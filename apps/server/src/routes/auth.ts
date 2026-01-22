import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../lib/db";
import {
  verifyCVTApiKey,
  getCVTUserProfile,
  generateSessionToken,
  verifySessionToken,
  getCVTUrls,
} from "../lib/auth";

export const authRoutes = new Hono();

// Validation schemas
const signInSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  cvtUser: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    image: z.string().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    businessName: z.string().optional().nullable(),
    businessAddress: z.string().optional().nullable(),
  }).optional(),
  cvtService: z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    paid: z.boolean(),
  }).optional(),
});

/**
 * Sign in with CVT API key
 * POST /api/auth/sign-in
 */
authRoutes.post("/sign-in", zValidator("json", signInSchema), async (c) => {
  const { apiKey, cvtUser: providedCvtUser, cvtService } = c.req.valid("json");

  let cvtUser = providedCvtUser;

  // If CVT user data not provided, fetch it from CVT
  if (!cvtUser) {
    // Use CVT_BACKEND_API_URL from environment variables
    const cvtBackendUrl = process.env.CVT_BACKEND_API_URL || "http://localhost:3001";

    // Verify the API key with CVT backend
    const verification = await verifyCVTApiKey(apiKey, cvtBackendUrl);

    if (!verification.success) {
      return c.json(
        {
          success: false,
          error: verification.error,
          needsPayment: verification.verification?.hasService && !verification.verification?.paid,
          needsSubscription: verification.verification?.valid && !verification.verification?.hasService,
          cvtUrls: getCVTUrls(),
        },
        401
      );
    }

    // Get user profile from CVT
    const profileResult = await getCVTUserProfile(apiKey);

    if (!profileResult.success || !profileResult.user) {
      return c.json(
        {
          success: false,
          error: "Failed to get user profile",
          cvtUrls: getCVTUrls(),
        },
        401
      );
    }

    cvtUser = profileResult.user;
  }

  // Find or create user in our database
  let user = await db.user.findUnique({
    where: { email: cvtUser.email },
  });

  if (!user) {
    // Create new user
    user = await db.user.create({
      data: {
        id: cvtUser.id,
        email: cvtUser.email,
        name: cvtUser.name,
        image: cvtUser.image || undefined,
        emailVerified: true, // CVT users are already verified
      },
    });

    // Create a default business if user has business info
    if (cvtUser.businessName) {
      const slug = cvtUser.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const business = await db.business.create({
        data: {
          name: cvtUser.businessName,
          slug: `${slug}-${user.id.slice(0, 8)}`,
          address: cvtUser.businessAddress || undefined,
        },
      });

      // Add user as admin of the business
      await db.businessMember.create({
        data: {
          userId: user.id,
          businessId: business.id,
          role: 'ADMIN',
          isActive: true,
        },
      });
    }
  } else {
    // Update existing user info
    user = await db.user.update({
      where: { id: user.id },
      data: {
        name: cvtUser.name,
        image: cvtUser.image || undefined,
      },
    });
  }

  // Generate session token
  const sessionToken = generateSessionToken(user.id, apiKey);

  // Create session in database
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.session.create({
    data: {
      token: sessionToken,
      userId: user.id,
      expiresAt,
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      userAgent: c.req.header("user-agent"),
    },
  });

  // Get user's businesses
  const memberships = await db.businessMember.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true },
      },
    },
  });

  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
    session: {
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
    },
    businesses: memberships.map((m) => ({
      ...m.business,
      role: m.role,
    })),
    service: cvtService,
  });
});

/**
 * Verify session token
 * POST /api/auth/verify
 */
authRoutes.post("/verify", async (c) => {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ valid: false, error: "No token provided" }, 401);
  }

  const result = verifySessionToken(token);

  if (!result.valid || !result.payload) {
    return c.json({ valid: false, error: "Invalid or expired token" }, 401);
  }

  // Check if session exists in database
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, email: true, name: true, image: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return c.json({ valid: false, error: "Session expired" }, 401);
  }

  return c.json({
    valid: true,
    user: session.user,
  });
});

/**
 * Get current user info
 * GET /api/auth/me
 */
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          businessMembers: {
            where: { isActive: true },
            include: {
              business: {
                select: { id: true, name: true, slug: true, logo: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return c.json({ error: "Session expired" }, 401);
  }

  return c.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
    businesses: session.user.businessMembers.map((m) => ({
      ...m.business,
      role: m.role,
    })),
  });
});

/**
 * Sign out
 * POST /api/auth/sign-out
 */
authRoutes.post("/sign-out", async (c) => {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    // Delete session from database
    await db.session.deleteMany({
      where: { token },
    });
  }

  return c.json({ success: true, message: "Signed out successfully" });
});

/**
 * Get CVT URLs for authentication
 * GET /api/auth/cvt-urls
 */
authRoutes.get("/cvt-urls", (c) => {
  return c.json(getCVTUrls());
});
