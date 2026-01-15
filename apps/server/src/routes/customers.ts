import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { notifyNewCustomer } from "../lib/notifications";

export const customerRoutes = new Hono();

// Validation schemas
const createCustomerSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateCustomerSchema = createCustomerSchema.partial().omit({ businessId: true });

const querySchema = z.object({
  businessId: z.string(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Get all customers for a business
customerRoutes.get("/", requireAuth, zValidator("query", querySchema), async (c) => {
  const { businessId, page, limit, search, isActive, sortBy, sortOrder } = c.req.valid("query");

  // Build where clause
  const where: any = { businessId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Get total count
  const total = await db.customer.count({ where });

  // Get customers with transaction stats
  const customers = await db.customer.findMany({
    where,
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  return c.json({
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get a single customer with transaction history
customerRoutes.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          reference: true,
          type: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
    },
  });

  if (!customer) {
    return c.json({ error: "Customer not found" }, 404);
  }

  // Calculate customer stats
  const stats = await db.transaction.aggregate({
    where: { customerId: id, status: "COMPLETED" },
    _count: { id: true },
    _sum: { total: true },
    _avg: { total: true },
  });

  return c.json({
    customer,
    stats: {
      totalTransactions: stats._count.id,
      totalSpent: stats._sum.total || 0,
      averageTransaction: stats._avg.total || 0,
    },
  });
});

// Create a new customer
customerRoutes.post("/", requireAuth, zValidator("json", createCustomerSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  const customer = await db.customer.create({
    data: {
      ...data,
      createdById: userId,
    },
  });

  // Trigger new customer notification
  notifyNewCustomer({
    id: customer.id,
    name: customer.name,
    email: customer.email || undefined,
    phone: customer.phone || undefined,
    businessId: data.businessId,
    createdById: userId,
  }).catch(console.error);

  return c.json({ customer }, 201);
});

// Update a customer
customerRoutes.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  zValidator("json", updateCustomerSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const customer = await db.customer.update({
      where: { id },
      data,
    });

    return c.json({ customer });
  }
);

// Delete a customer
customerRoutes.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (c) => {
  const id = c.req.param("id");

  await db.customer.delete({ where: { id } });

  return c.json({ message: "Customer deleted successfully" });
});

// Get customer transaction history
customerRoutes.get("/:id/transactions", requireAuth, async (c) => {
  const id = c.req.param("id");
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");

  const transactions = await db.transaction.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          total: true,
        },
      },
    },
  });

  const total = await db.transaction.count({ where: { customerId: id } });

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

// Get top customers by spending
customerRoutes.get("/stats/top", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");
  const limit = parseInt(c.req.query("limit") || "10");

  if (!businessId) {
    return c.json({ error: "businessId is required" }, 400);
  }

  // Get customers with their total spending
  const topCustomers = await db.$queryRaw`
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      COUNT(t.id)::int as "transactionCount",
      COALESCE(SUM(t.total), 0)::float as "totalSpent"
    FROM customers c
    LEFT JOIN transactions t ON t."customerId" = c.id AND t.status = 'COMPLETED'
    WHERE c."businessId" = ${businessId}
    GROUP BY c.id, c.name, c.email, c.phone
    ORDER BY "totalSpent" DESC
    LIMIT ${limit}
  `;

  return c.json({ customers: topCustomers });
});
