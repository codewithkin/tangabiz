import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireRole, requireBusinessAccess } from "../middleware/auth";

export const productRoutes = new Hono();

// Validation schemas
const createProductSchema = z.object({
  businessId: z.string(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  price: z.number().positive(),
  costPrice: z.number().positive().optional(),
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  unit: z.string().default("piece"),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateProductSchema = createProductSchema.partial().omit({ businessId: true });

const querySchema = z.object({
  businessId: z.string(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "price", "quantity", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Get all products for a business
productRoutes.get("/", requireAuth, zValidator("query", querySchema), async (c) => {
  const { businessId, page, limit, search, categoryId, isActive, lowStock, sortBy, sortOrder } =
    c.req.valid("query");

  // Build where clause
  const where: any = { businessId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (lowStock) {
    where.quantity = { lte: db.$queryRaw`"minQuantity"` };
  }

  // Get total count
  const total = await db.product.count({ where });

  // Get products
  const products = await db.product.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  return c.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get a single product
productRoutes.get("/:id", requireAuth, async (c) => {
  const id = c.req.param("id");

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: {
        select: { id: true, name: true },
      },
      business: {
        select: { id: true, name: true, currency: true },
      },
    },
  });

  if (!product) {
    return c.json({ error: "Product not found" }, 404);
  }

  return c.json({ product });
});

// Create a new product
productRoutes.post(
  "/",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  zValidator("json", createProductSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");

    // Check if slug is unique within the business
    const existingSlug = await db.product.findUnique({
      where: {
        businessId_slug: { businessId: data.businessId, slug: data.slug },
      },
    });

    if (existingSlug) {
      return c.json({ error: "Product slug already exists in this business" }, 400);
    }

    // Check if SKU is unique within the business (if provided)
    if (data.sku) {
      const existingSku = await db.product.findUnique({
        where: {
          businessId_sku: { businessId: data.businessId, sku: data.sku },
        },
      });

      if (existingSku) {
        return c.json({ error: "Product SKU already exists in this business" }, 400);
      }
    }

    const product = await db.product.create({
      data: {
        ...data,
        createdById: userId,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return c.json({ product }, 201);
  }
);

// Update a product
productRoutes.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  zValidator("json", updateProductSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const existing = await db.product.findUnique({ where: { id } });

    if (!existing) {
      return c.json({ error: "Product not found" }, 404);
    }

    // Check slug uniqueness if being updated
    if (data.slug && data.slug !== existing.slug) {
      const existingSlug = await db.product.findUnique({
        where: {
          businessId_slug: { businessId: existing.businessId, slug: data.slug },
        },
      });

      if (existingSlug) {
        return c.json({ error: "Product slug already exists in this business" }, 400);
      }
    }

    // Check SKU uniqueness if being updated
    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await db.product.findUnique({
        where: {
          businessId_sku: { businessId: existing.businessId, sku: data.sku },
        },
      });

      if (existingSku) {
        return c.json({ error: "Product SKU already exists in this business" }, 400);
      }
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return c.json({ product });
  }
);

// Delete a product
productRoutes.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (c) => {
  const id = c.req.param("id");

  await db.product.delete({ where: { id } });

  return c.json({ message: "Product deleted successfully" });
});

// Bulk update product quantities (inventory adjustment)
productRoutes.post(
  "/bulk-quantity",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  zValidator(
    "json",
    z.object({
      updates: z.array(
        z.object({
          id: z.string(),
          quantity: z.number().int().min(0),
        })
      ),
    })
  ),
  async (c) => {
    const { updates } = c.req.valid("json");

    const results = await Promise.all(
      updates.map((update) =>
        db.product.update({
          where: { id: update.id },
          data: { quantity: update.quantity },
          select: { id: true, name: true, quantity: true },
        })
      )
    );

    return c.json({ updated: results });
  }
);

// Get low stock products
productRoutes.get("/alerts/low-stock", requireAuth, async (c) => {
  const businessId = c.req.query("businessId");

  if (!businessId) {
    return c.json({ error: "businessId is required" }, 400);
  }

  const products = await db.product.findMany({
    where: {
      businessId,
      isActive: true,
      quantity: { lte: db.$queryRaw`"minQuantity"` },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      minQuantity: true,
      image: true,
    },
    orderBy: { quantity: "asc" },
  });

  return c.json({ products });
});
