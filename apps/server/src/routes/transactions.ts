import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { nanoid, generateInvoiceId } from "../utils/helpers";
import { notifyNewSale, notifyRefund, notifyLowStock } from "../lib/notifications";

export const transactionRoutes = new Hono();

// Validation schemas
const transactionItemSchema = z.object({
  productId: z.string().optional().nullable(),
  // Product creation fields (if creating new product)
  productName: z.string().optional(),
  productSlug: z.string().optional(),
  productSku: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
});

// Customer data for creation
const customerDataSchema = z.object({
  name: z.string().min(1),
  email: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().email().nullable().optional()
  ),
  phone: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
});

const createTransactionSchema = z.object({
  businessId: z.string(),
  customerId: z.string().optional().nullable(),
  // Customer creation fields (if creating new customer)
  customerData: customerDataSchema.optional().nullable(),
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
transactionRoutes.post(
  "/",
  requireAuth,
  zValidator("json", createTransactionSchema, (result, c) => {
    if (!result.success) {
      console.error('[Transaction] Validation Error:', JSON.stringify(result.error.format(), null, 2));
      return c.json(
        {
          error: "Validation failed",
          details: result.error.format(),
        },
        400
      );
    }
  }),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");

    console.log(`[Transaction] Creating transaction for user ${userId}`, {
      businessId: data.businessId,
      type: data.type,
      itemCount: data.items.length,
      customerId: data.customerId,
    });

  try {
    // Validate business exists and user has access
    const business = await db.business.findUnique({
      where: { id: data.businessId },
      include: { members: { where: { userId } } },
    });

    if (!business) {
      console.error(`[Transaction] Business not found: ${data.businessId}`);
      return c.json({ error: "Business not found" }, 404);
    }

    if (business.members.length === 0) {
      console.error(`[Transaction] User ${userId} not authorized for business ${data.businessId}`);
      return c.json({ error: "Not authorized to create transactions for this business" }, 403);
    }

    // Create customer if customer data is provided
    let customerId = data.customerId;
    if (data.customerData && !customerId) {
      console.log(`[Transaction] Creating new customer: ${data.customerData.name}`);
      const newCustomer = await db.customer.create({
        data: {
          name: data.customerData.name,
          email: data.customerData.email,
          phone: data.customerData.phone,
          businessId: data.businessId,
          createdById: userId,
        },
      });
      customerId = newCustomer.id;
      console.log(`[Transaction] Customer created: ${newCustomer.id}`);
    } else if (customerId) {
      // Validate existing customer if provided
      const customer = await db.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        console.error(`[Transaction] Customer not found: ${customerId}`);
        return c.json({ error: "Customer not found" }, 404);
      }

      if (customer.businessId !== data.businessId) {
        console.error(`[Transaction] Customer ${customerId} does not belong to business ${data.businessId}`);
        return c.json({ error: "Customer does not belong to this business" }, 400);
      }
    }

    // Process items and create products if needed
    const processedItems = await Promise.all(
      data.items.map(async (item) => {
        let productId = item.productId;

        // Create product if product details are provided but no productId
        if (!productId && item.productName) {
          console.log(`[Transaction] Creating new product: ${item.productName}`);
          // Generate unique slug by appending timestamp
          const baseSlug = item.productSlug || "";
          const uniqueSlug = baseSlug ? `${baseSlug}-${Date.now()}` : `product-${Date.now()}`;
          
          const newProduct = await db.product.create({
            data: {
              name: item.productName,
              slug: uniqueSlug,
              sku: item.productSku || `SKU-${Date.now()}`,
              quantity: item.quantity, // Set quantity to match the requested amount
              businessId: data.businessId,
              price: item.unitPrice,
              createdById: userId,
            },
          });
          productId = newProduct.id;
          console.log(`[Transaction] Product created: ${newProduct.id}`);
        }

        // Validate product exists and belongs to business
        const product = await db.product.findUnique({
          where: { id: productId! },
          select: { id: true, name: true, sku: true, quantity: true, businessId: true },
        });

        if (!product) {
          console.error(`[Transaction] Product not found: ${productId}`);
          return { valid: false, error: `Product not found: ${productId}` };
        }

        if (product.businessId !== data.businessId) {
          console.error(`[Transaction] Product ${productId} does not belong to business ${data.businessId}`);
          return { valid: false, error: `Product ${product.name} does not belong to this business` };
        }

        if (data.type === "SALE" && product.quantity < item.quantity) {
          console.error(`[Transaction] Insufficient stock for product ${product.name}: available ${product.quantity}, requested ${item.quantity}`);
          return { valid: false, error: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}` };
        }

        return { valid: true, product, productId };
      })
    );

    // Check for validation errors
    const validationError = processedItems.find((v) => !v.valid);
    if (validationError) {
      console.error(`[Transaction] Validation failed:`, validationError.error);
      return c.json({ error: validationError.error }, 400);
    }

    // Generate unique reference and invoice ID
    const reference = `TXN-${nanoid(10).toUpperCase()}`;
    const invoiceId = generateInvoiceId();

    console.log(`[Transaction] Generated reference: ${reference}, invoice: ${invoiceId}`);

    // Calculate totals
    const itemsWithTotals = data.items.map((item, index) => {
      const processedItem = processedItems[index];
      const product = processedItem.product!;
      const itemTotal = item.quantity * item.unitPrice - item.discount;

      return {
        productId: processedItem.productId,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: itemTotal,
      };
    });

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - data.discount;
    const change = data.amountPaid - total;

    console.log(`[Transaction] Calculated totals:`, {
      subtotal,
      discount: data.discount,
      total,
      amountPaid: data.amountPaid,
      change,
    });

    if (data.amountPaid < total) {
      console.error(`[Transaction] Insufficient payment: paid ${data.amountPaid}, required ${total}`);
      return c.json({ error: `Insufficient payment. Required: ${total}, Paid: ${data.amountPaid}` }, 400);
    }

    // Create transaction with items
    console.log(`[Transaction] Creating transaction in database...`);
    const transaction = await db.transaction.create({
      data: {
        invoiceId,
        reference,
        businessId: data.businessId,
        customerId: customerId || undefined,
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

    console.log(`[Transaction] Transaction created successfully: ${transaction.id}`);

    // Update product quantities for sales
    if (data.type === "SALE") {
      console.log(`[Transaction] Updating product quantities for SALE...`);
      await Promise.all(
        processedItems.map((item) =>
          db.product.update({
            where: { id: item.productId! },
            data: {
              quantity: { decrement: data.items[processedItems.indexOf(item)].quantity },
            },
          })
        )
      );
      console.log(`[Transaction] Product quantities updated`);

      // Trigger new sale notification
      notifyNewSale({
        id: transaction.id,
        reference: transaction.reference,
        total: Number(transaction.total),
        businessId: data.businessId,
        createdById: userId,
        customerName: transaction.customer?.name,
      }).catch((err) => console.error(`[Transaction] Failed to send sale notification:`, err));

      // Check for low stock products after sale
      const productIds = processedItems
        .map((item) => item.productId)
        .filter((id): id is string => id !== null && id !== undefined);
      
      const updatedProducts = await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, quantity: true, minQuantity: true, businessId: true },
      });

      // Notify for any products that are now below minimum quantity
      updatedProducts.forEach((product) => {
        if (product.quantity <= product.minQuantity) {
          console.log(`[Transaction] Low stock alert for product ${product.name}: ${product.quantity} <= ${product.minQuantity}`);
          notifyLowStock(product).catch((err) => console.error(`[Transaction] Failed to send low stock notification:`, err));
        }
      });
    }

    // Update product quantities for refunds (add back)
    if (data.type === "REFUND") {
      console.log(`[Transaction] Updating product quantities for REFUND...`);
      await Promise.all(
        processedItems
          .filter((item) => item.productId !== null && item.productId !== undefined)
          .map((item) =>
            db.product.update({
              where: { id: item.productId! },
              data: {
                quantity: { increment: data.items[processedItems.indexOf(item)].quantity },
              },
            })
          )
      );
      console.log(`[Transaction] Product quantities restored`);

      // Trigger refund notification
      notifyRefund({
        id: transaction.id,
        reference: transaction.reference,
        total: Number(transaction.total),
        businessId: data.businessId,
      }).catch((err) => console.error(`[Transaction] Failed to send refund notification:`, err));
    }

    console.log(`[Transaction] Transaction completed successfully: ${transaction.id}`);
    return c.json({ transaction }, 201);
  } catch (error) {
    console.error(`[Transaction] Error creating transaction:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      businessId: data.businessId,
      type: data.type,
    });
    
    return c.json(
      {
        error: "Failed to create transaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
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
      (Number(salesStats._sum.total) || 0) +
      (Number(incomeStats._sum.total) || 0) -
      (Number(refundStats._sum.total) || 0) -
      (Number(expenseStats._sum.total) || 0),
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

// Verify an invoice by invoiceId
transactionRoutes.get("/verify/:invoiceId", async (c) => {
  const invoiceId = c.req.param("invoiceId");

  if (!invoiceId || invoiceId.length !== 8) {
    return c.json({
      success: false,
      error: "Invalid invoice ID format. Must be 8 characters.",
    }, 400);
  }

  const transaction = await db.transaction.findUnique({
    where: { invoiceId: invoiceId.toUpperCase() },
    include: {
      business: {
        select: { id: true, name: true, logo: true, currency: true },
      },
      customer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      items: {
        include: {
          product: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  if (!transaction) {
    return c.json({
      success: false,
      error: "Invoice not found. Please check the ID and try again.",
    }, 404);
  }

  return c.json({
    success: true,
    invoice: {
      invoiceId: transaction.invoiceId,
      reference: transaction.reference,
      type: transaction.type,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      subtotal: transaction.subtotal,
      discount: transaction.discount,
      total: transaction.total,
      amountPaid: transaction.amountPaid,
      change: transaction.change,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      business: transaction.business,
      customer: transaction.customer,
      items: transaction.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
        product: item.product,
      })),
      createdBy: transaction.createdBy,
    },
  });
});
