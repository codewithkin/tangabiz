import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  generateSalesReport,
  generateInventoryReport,
  generateCustomerReport,
  type SalesReportData,
  type InventoryReportData,
  type CustomerReportData,
} from "../lib/pdf";
import { getUploadUrl } from "../lib/s3";

export const reportRoutes = new Hono();

// Validation schemas
const generateReportSchema = z.object({
  businessId: z.string(),
  type: z.enum(["SALES", "INVENTORY", "CUSTOMERS", "TRANSACTIONS", "CUSTOM"]),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]),
  startDate: z.string(),
  endDate: z.string(),
  name: z.string().optional(),
});

const querySchema = z.object({
  businessId: z.string(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(["SALES", "INVENTORY", "CUSTOMERS", "TRANSACTIONS", "CUSTOM"]).optional(),
});

// Get all reports for a business
reportRoutes.get("/", requireAuth, zValidator("query", querySchema), async (c) => {
  const { businessId, page, limit, type } = c.req.valid("query");

  const where: any = { businessId };
  if (type) where.type = type;

  const total = await db.report.count({ where });

  const reports = await db.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return c.json({
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get a single report
reportRoutes.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");

  const report = await db.report.findUnique({
    where: { id },
    include: {
      business: {
        select: { id: true, name: true },
      },
    },
  });

  if (!report) {
    return c.json({ error: "Report not found" }, 404);
  }

  return c.json({ report });
});

// Generate a new report
reportRoutes.post(
  "/generate",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  zValidator("json", generateReportSchema),
  async (c) => {
    const userId = c.get("userId");
    const { businessId, type, period, startDate, endDate, name } = c.req.valid("json");

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { name: true, logo: true, currency: true },
    });

    if (!business) {
      return c.json({ error: "Business not found" }, 404);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const start = new Date(startDate);
    const end = new Date(endDate);

    let pdfBuffer: Buffer;
    let reportName = name || `${type} Report`;

    const baseReportData = {
      title: reportName,
      businessName: business.name,
      businessLogo: business.logo || undefined,
      period: { start, end },
      generatedAt: new Date(),
      generatedBy: user?.name || "System",
    };

    switch (type) {
      case "SALES": {
        // Gather sales data
        const transactions = await db.transaction.findMany({
          where: {
            businessId,
            type: "SALE",
            status: "COMPLETED",
            createdAt: { gte: start, lte: end },
          },
          include: {
            customer: { select: { name: true } },
            items: true,
          },
          orderBy: { createdAt: "desc" },
        });

        // Get top products
        const topProducts = await db.$queryRaw<
          Array<{ name: string; quantity: number; revenue: number }>
        >`
          SELECT 
            p.name,
            SUM(ti.quantity)::int as quantity,
            COALESCE(SUM(ti.total), 0)::float as revenue
          FROM transaction_items ti
          JOIN transactions t ON t.id = ti."transactionId"
          JOIN products p ON p.id = ti."productId"
          WHERE 
            t."businessId" = ${businessId}
            AND t.type = 'SALE'
            AND t.status = 'COMPLETED'
            AND t.created_at >= ${start}
            AND t.created_at <= ${end}
          GROUP BY p.id, p.name
          ORDER BY quantity DESC
          LIMIT 5
        `;

        const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);

        const salesData: SalesReportData = {
          ...baseReportData,
          summary: {
            totalSales,
            totalTransactions: transactions.length,
            averageTransaction: transactions.length > 0 ? totalSales / transactions.length : 0,
            topProducts,
          },
          transactions: transactions.map((t) => ({
            reference: t.reference,
            date: t.createdAt,
            customer: t.customer?.name || null,
            items: t.items.length,
            total: Number(t.total),
            paymentMethod: t.paymentMethod,
          })),
        };

        pdfBuffer = await generateSalesReport(salesData);
        break;
      }

      case "INVENTORY": {
        const products = await db.product.findMany({
          where: { businessId, isActive: true },
          include: {
            category: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        });

        const totalValue = products.reduce(
          (sum, p) => sum + Number(p.price) * p.quantity,
          0
        );
        const lowStock = products.filter((p) => p.quantity <= p.minQuantity && p.quantity > 0);
        const outOfStock = products.filter((p) => p.quantity === 0);

        const inventoryData: InventoryReportData = {
          ...baseReportData,
          summary: {
            totalProducts: products.length,
            totalValue,
            lowStockCount: lowStock.length,
            outOfStockCount: outOfStock.length,
          },
          products: products.map((p) => ({
            name: p.name,
            sku: p.sku,
            category: p.category?.name || null,
            quantity: p.quantity,
            price: Number(p.price),
            value: Number(p.price) * p.quantity,
          })),
        };

        pdfBuffer = await generateInventoryReport(inventoryData);
        break;
      }

      case "CUSTOMERS": {
        const customers = await db.customer.findMany({
          where: { businessId, isActive: true },
          orderBy: { name: "asc" },
        });

        const newCustomers = await db.customer.count({
          where: {
            businessId,
            createdAt: { gte: start, lte: end },
          },
        });

        // Get customers with transaction stats
        const customersWithStats = await Promise.all(
          customers.map(async (customer) => {
            const stats = await db.transaction.aggregate({
              where: {
                customerId: customer.id,
                status: "COMPLETED",
                createdAt: { gte: start, lte: end },
              },
              _count: { id: true },
              _sum: { total: true },
            });

            const lastTransaction = await db.transaction.findFirst({
              where: { customerId: customer.id, status: "COMPLETED" },
              orderBy: { createdAt: "desc" },
              select: { createdAt: true },
            });

            return {
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              totalTransactions: stats._count.id,
              totalSpent: Number(stats._sum.total || 0),
              lastTransaction: lastTransaction?.createdAt || null,
            };
          })
        );

        const activeCustomers = customersWithStats.filter((c) => c.totalTransactions > 0);

        const customerData: CustomerReportData = {
          ...baseReportData,
          summary: {
            totalCustomers: customers.length,
            newCustomers,
            activeCustomers: activeCustomers.length,
          },
          customers: customersWithStats,
        };

        pdfBuffer = await generateCustomerReport(customerData);
        break;
      }

      default:
        return c.json({ error: "Report type not supported yet" }, 400);
    }

    // Upload PDF to S3
    const filename = `${reportName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const { uploadUrl, fileKey, publicUrl } = await getUploadUrl(filename, "application/pdf", {
      folder: `reports/${businessId}`,
    });

    // Upload the buffer directly
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: pdfBuffer,
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!uploadResponse.ok) {
      return c.json({ error: "Failed to upload report" }, 500);
    }

    // Save report record
    const report = await db.report.create({
      data: {
        name: reportName,
        type,
        period,
        startDate: start,
        endDate: end,
        businessId,
        fileUrl: publicUrl,
        fileSize: pdfBuffer.length,
        parameters: { startDate, endDate },
      },
    });

    return c.json({ report, downloadUrl: publicUrl }, 201);
  }
);

// Delete a report
reportRoutes.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (c) => {
  const id = c.req.param("id");

  await db.report.delete({ where: { id } });

  return c.json({ message: "Report deleted successfully" });
});
