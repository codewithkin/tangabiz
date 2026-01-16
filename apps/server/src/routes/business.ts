import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAuth, requireRole } from "../middleware/auth";
import type { Role } from "@prisma/client";

export const businessRoutes = new Hono();

// Validation schemas
const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  currency: z.string().default("USD"),
  timezone: z.string().default("UTC"),
  invoiceFooter: z.string().max(500).optional(),
});

const updateBusinessSchema = createBusinessSchema.partial();

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
});

// Get all businesses for the current user
businessRoutes.get("/", requireAuth, async (c) => {
  const userId = c.get("userId");

  const memberships = await db.businessMember.findMany({
    where: { userId, isActive: true },
    include: {
      business: true,
    },
    orderBy: { joinedAt: "desc" },
  });

  const businesses = memberships.map((m) => ({
    ...m.business,
    role: m.role,
    joinedAt: m.joinedAt,
  }));

  return c.json({ businesses });
});

// Get a single business by ID
businessRoutes.get("/:id", requireAuth, async (c) => {
  const businessId = c.req.param("id");
  const userId = c.get("userId");

  // Check if user is a member
  const membership = await db.businessMember.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
  });

  if (!membership) {
    return c.json({ error: "Business not found or access denied" }, 404);
  }

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
          customers: true,
          transactions: true,
        },
      },
    },
  });

  return c.json({ business, userRole: membership.role });
});

// Create a new business
businessRoutes.post("/", requireAuth, zValidator("json", createBusinessSchema), async (c) => {
  const userId = c.get("userId");
  const data = c.req.valid("json");

  // Check if slug is already taken
  const existing = await db.business.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    return c.json({ error: "Business slug is already taken" }, 400);
  }

  // Create business and add user as admin
  const business = await db.business.create({
    data: {
      ...data,
      members: {
        create: {
          userId,
          role: "ADMIN",
        },
      },
    },
  });

  return c.json({ business }, 201);
});

// Update a business
businessRoutes.put(
  "/:id",
  requireAuth,
  requireRole(["ADMIN"]),
  zValidator("json", updateBusinessSchema),
  async (c) => {
    const businessId = c.req.param("id");
    const data = c.req.valid("json");

    // Check slug uniqueness if being updated
    if (data.slug) {
      const existing = await db.business.findFirst({
        where: {
          slug: data.slug,
          id: { not: businessId },
        },
      });

      if (existing) {
        return c.json({ error: "Business slug is already taken" }, 400);
      }
    }

    const business = await db.business.update({
      where: { id: businessId },
      data,
    });

    return c.json({ business });
  }
);

// Delete a business
businessRoutes.delete("/:id", requireAuth, requireRole(["ADMIN"]), async (c) => {
  const businessId = c.req.param("id");

  await db.business.delete({
    where: { id: businessId },
  });

  return c.json({ message: "Business deleted successfully" });
});

// Get business members
businessRoutes.get("/:id/members", requireAuth, async (c) => {
  const businessId = c.req.param("id");

  const members = await db.businessMember.findMany({
    where: { businessId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return c.json({ members });
});

// Invite a member to the business
businessRoutes.post(
  "/:id/members",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  zValidator("json", inviteMemberSchema),
  async (c) => {
    const businessId = c.req.param("id");
    const { email, role } = c.req.valid("json");
    const userRole = c.get("userRole") as Role;

    // Managers can only invite staff
    if (userRole === "MANAGER" && role !== "STAFF") {
      return c.json({ error: "Managers can only invite staff members" }, 403);
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return c.json({ error: "User not found. They need to register first." }, 404);
    }

    // Check if already a member
    const existing = await db.businessMember.findUnique({
      where: {
        userId_businessId: { userId: user.id, businessId },
      },
    });

    if (existing) {
      return c.json({ error: "User is already a member of this business" }, 400);
    }

    // Add member
    const member = await db.businessMember.create({
      data: {
        userId: user.id,
        businessId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return c.json({ member }, 201);
  }
);

// Update a member's role
businessRoutes.put(
  "/:id/members/:memberId",
  requireAuth,
  requireRole(["ADMIN"]),
  zValidator("json", z.object({ role: z.enum(["ADMIN", "MANAGER", "STAFF"]) })),
  async (c) => {
    const businessId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const { role } = c.req.valid("json");

    const member = await db.businessMember.update({
      where: { id: memberId, businessId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return c.json({ member });
  }
);

// Remove a member from the business
businessRoutes.delete(
  "/:id/members/:memberId",
  requireAuth,
  requireRole(["ADMIN"]),
  async (c) => {
    const businessId = c.req.param("id");
    const memberId = c.req.param("memberId");

    // Prevent removing the last admin
    const adminCount = await db.businessMember.count({
      where: { businessId, role: "ADMIN" },
    });

    const memberToRemove = await db.businessMember.findUnique({
      where: { id: memberId },
    });

    if (memberToRemove?.role === "ADMIN" && adminCount <= 1) {
      return c.json({ error: "Cannot remove the last admin" }, 400);
    }

    await db.businessMember.delete({
      where: { id: memberId, businessId },
    });

    return c.json({ message: "Member removed successfully" });
  }
);
