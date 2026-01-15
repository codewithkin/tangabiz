import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { nanoid } from "../utils/helpers";

export const transactionRoutes = new Hono();

// Validation schemas
const transactionItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
});

const createTransactionSchema = z.object({
  businessId: z.string(),
  customerId: z.string().optional().nullable(),
  type: z.enum(["SALE", "REFUND", "EXPENSE", "INCOME"]).default("SALE"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_MONEY", "OTHER"]).default("CASH"),
  items: z.array(transactionItemSchema).min(1),
  discount: z.number().min(0).default(0),
  amountPaid: z.number().positive(),
  notes: z.string().optional().nullable(),
});

const querySchema = z.object({
  businessId: z.string(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(["SALE", "REFUND", "EXPENSE", "INCOME"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["createdAt", "total"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Get all transactions for a business
transactionRoutes.get("/", requireAuth, zValidator("query", querySchema), async (c) => {
  const { businessId, page, limit, type, status, customerId, startDate, endDate, sortBy, sortOrder } =
    c.req.valid("query");

  // Build where clause
  const where: any = { businessId };

  if (type) where.type = type;
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Get total count
  const total = await db.transaction.count({ where });

  // Get transactions
  const transactions = await db.transaction.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true, email: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  return c.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get a single transaction with items
transactionRoutes.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      business: {
        select: { id: true, name: true, currency: true },
      },
    },
  });

  if (!transaction) {
    return c.json({ error: "Transaction not found" }, 404);
  }

  return c.json({ transaction });
});

// Create a new transaction (sale, expense, etc.)
transactionRoutes.post("/", requireAuth, zValidator("json", createTransactionSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  // Generate unique reference
  const reference = `TXN-${nanoid(10).toUpperCase()}`;

  // Calculate totals
  const itemsWithTotals = await Promise.all(
    data.items.map(async (item) => {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { name: true, sku: true },
      });

      const itemTotal = item.quantity * item.unitPrice - item.discount;

      return {
        productId: item.productId,
        productName: product?.name || "Unknown Product",
        productSku: product?.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: itemTotal,
      };
    })
  );

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - data.discount;
  const change = data.amountPaid - total;

  // Create transaction with items
  const transaction = await db.transaction.create({
    data: {
      reference,
      businessId: data.businessId,
      customerId: data.customerId,
      createdById: userId,
      type: data.type,
      paymentMethod: data.paymentMethod,
      subtotal,
      discount: data.discount,
      total,
      amountPaid: data.amountPaid,
      change: Math.max(0, change),
      notes: data.notes,
      status: "COMPLETED",
      items: {
        create: itemsWithTotals,
      },
    },
    include: {
      items: true,
      customer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Update product quantities for sales
  if (data.type === "SALE") {
    await Promise.all(
      data.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: {
            quantity: { decrement: item.quantity },
          },
        })
      )
    );
  }

  // Update product quantities for refunds (add back)
  if (data.type === "REFUND") {
    await Promise.all(
      data.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
          },
        })
      )
    );
  }

  return c.json({ transaction }, 201);
});

// Cancel a transaction
transactionRoutes.post("/:id/cancel", requireAuth, requireRole(["ADMIN", "MANAGER"]), async (c) => {
  const id = c.req.param("id");

  const existing = await db.transaction.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    return c.json({ error: "Transaction not found" }, 404);
  }

  if (existing.status !== "COMPLETED") {
    return c.json({ error: "Only completed transactions can be cancelled" }, 400);
  }

  // Restore product quantities
  if (existing.type === "SALE") {
    await Promise.all(
      existing.items.map((item) =>
        db.product.update({
          where: { id: item.productId! },
          data: {
            quantity: { increment: item.quantity },
          },
        })
      )
    );
  }

  const transaction = await db.transaction.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return c.json({ transaction });
});

// Get transaction statistics
transactionRoutes.get("/stats/summary", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  if (!businessId) {
    return c.json({ error: "businessId is required" }, 400);
  }

  const where: any = { businessId, status: "COMPLETED" };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  // Sales summary
  const salesStats = await db.transaction.aggregate({
    where: { ...where, type: "SALE" },
    _count: { id: true },
    _sum: { total: true },
    _avg: { total: true },
  });

  // Refunds summary
  const refundStats = await db.transaction.aggregate({
    where: { ...where, type: "REFUND" },
    _count: { id: true },
    _sum: { total: true },
  });

  // Expenses summary
  const expenseStats = await db.transaction.aggregate({
    where: { ...where, type: "EXPENSE" },
    _count: { id: true },
    _sum: { total: true },
  });

  // Income summary
  const incomeStats = await db.transaction.aggregate({
    where: { ...where, type: "INCOME" },
    _count: { id: true },
    _sum: { total: true },
  });

  return c.json({
    sales: {
      count: salesStats._count.id,
      total: salesStats._sum.total || 0,
      average: salesStats._avg.total || 0,
    },
    refunds: {
      count: refundStats._count.id,
      total: refundStats._sum.total || 0,
    },
    expenses: {
      count: expenseStats._count.id,
      total: expenseStats._sum.total || 0,
    },
    income: {
      count: incomeStats._count.id,
      total: incomeStats._sum.total || 0,
    },
    netRevenue:
      (salesStats._sum.total || 0) +
      (incomeStats._sum.total || 0) -
      (refundStats._sum.total || 0) -
      (expenseStats._sum.total || 0),
  });
});

// Get daily sales trends
transactionRoutes.get("/stats/trends", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  const days = parseInt(c.req.query("days") || "30");

  if (!businessId) {
    return c.json({ error: "businessId is required" }, 400);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const trends = await db.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*)::int as "transactionCount",
      COALESCE(SUM(total), 0)::float as "totalSales"
    FROM transactions
    WHERE 
      "businessId" = ${businessId}
      AND type = 'SALE'
      AND status = 'COMPLETED'
      AND created_at >= ${startDate}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return c.json({ trends });
});

// Get top selling products
transactionRoutes.get("/stats/top-products", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  const limit = parseInt(c.req.query("limit") || "10");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  if (!businessId) {
    return c.json({ error: "businessId is required" }, 400);
  }

  let dateFilter = "";
  if (startDate) dateFilter += ` AND t.created_at >= '${startDate}'`;
  if (endDate) dateFilter += ` AND t.created_at <= '${endDate}'`;

  const topProducts = await db.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.image,
      SUM(ti.quantity)::int as "totalQuantity",
      COALESCE(SUM(ti.total), 0)::float as "totalRevenue"
    FROM transaction_items ti
    JOIN transactions t ON t.id = ti."transactionId"
    JOIN products p ON p.id = ti."productId"
    WHERE 
      t."businessId" = ${businessId}
      AND t.type = 'SALE'
      AND t.status = 'COMPLETED'
    GROUP BY p.id, p.name, p.image
    ORDER BY "totalQuantity" DESC
    LIMIT ${limit}
  `;

  return c.json({ products: topProducts });
});

// Get payment method breakdown
transactionRoutes.get("/stats/payment-methods", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  if (!businessId) {
    return c.json({ error: "businessId is required" }, 400);
  }

  const where: any = { businessId, type: "SALE", status: "COMPLETED" };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const breakdown = await db.transaction.groupBy({
    by: ["paymentMethod"],
    where,
    _count: { id: true },
    _sum: { total: true },
  });

  return c.json({
    breakdown: breakdown.map((b) => ({
      method: b.paymentMethod,
      count: b._count.id,
      total: b._sum.total || 0,
    })),
  });
});
