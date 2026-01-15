import { Context, Next } from "hono";
import { verifySessionToken } from "../lib/auth";
import { db } from "../lib/db";
import type { Role } from "@prisma/client";

// Extend Hono context to include user info
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    userRole?: Role;
    businessId?: string;
  }
}

/**
 * Middleware to require authentication
 * Verifies the session token from Authorization header
 */
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized", message: "Authentication required" }, 401);
  }

  // Verify token signature and expiration
  const result = verifySessionToken(token);

  if (!result.valid || !result.payload) {
    return c.json({ error: "Unauthorized", message: "Invalid or expired token" }, 401);
  }

  // Verify session exists in database
  const session = await db.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return c.json({ error: "Unauthorized", message: "Session expired" }, 401);
  }

  c.set("userId", session.userId);

  await next();
}

/**
 * Middleware to require specific roles
 * Must be used after requireAuth
 */
export function requireRole(allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const userId = c.get("userId");
    
    // Get businessId from request body, query, or params
    let businessId = c.req.param("id") || c.req.query("businessId");
    
    // If not found, try to get from JSON body
    if (!businessId) {
      try {
        const body = await c.req.json();
        businessId = body.businessId;
        // Store body for later use
        c.set("requestBody", body);
      } catch {
        // Body might not be JSON or already consumed
      }
    }

    if (!businessId) {
      return c.json(
        { error: "Bad Request", message: "businessId is required" },
        400
      );
    }

    // Check user's role in the business
    const membership = await db.businessMember.findUnique({
      where: {
        userId_businessId: { userId, businessId },
      },
    });

    if (!membership) {
      return c.json(
        { error: "Forbidden", message: "You are not a member of this business" },
        403
      );
    }

    if (!allowedRoles.includes(membership.role)) {
      return c.json(
        {
          error: "Forbidden",
          message: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
        },
        403
      );
    }

    c.set("userRole", membership.role);
    c.set("businessId", businessId);

    await next();
  };
}

/**
 * Middleware to verify business access without role requirements
 */
export async function requireBusinessAccess(c: Context, next: Next) {
  const userId = c.get("userId");
  
  let businessId = c.req.param("id") || c.req.query("businessId");
  
  if (!businessId) {
    try {
      const body = await c.req.json();
      businessId = body.businessId;
    } catch {
      // Body might not be JSON
    }
  }

  if (!businessId) {
    return c.json(
      { error: "Bad Request", message: "businessId is required" },
      400
    );
  }

  const membership = await db.businessMember.findUnique({
    where: {
      userId_businessId: { userId, businessId },
    },
  });

  if (!membership || !membership.isActive) {
    return c.json(
      { error: "Forbidden", message: "You do not have access to this business" },
      403
    );
  }

  c.set("userRole", membership.role);
  c.set("businessId", businessId);

  await next();
}
