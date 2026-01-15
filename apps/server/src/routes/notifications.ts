/**
 * Notification Routes
 * API endpoints for managing notifications
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../lib/db";
import { authMiddleware } from "../middleware/auth";

export const notificationRoutes = new Hono();

// Apply auth middleware to all routes
notificationRoutes.use("*", authMiddleware);

// =====================================================
// GET NOTIFICATIONS
// =====================================================

/**
 * Get all notifications for the current user
 */
notificationRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const businessId = c.req.query("businessId");
    const unreadOnly = c.req.query("unreadOnly") === "true";
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const where: any = {
      userId: user.id,
    };

    if (businessId) {
      where.businessId = businessId;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          business: {
            select: { name: true, logo: true },
          },
        },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: {
          userId: user.id,
          businessId: businessId || undefined,
          isRead: false,
        },
      }),
    ]);

    return c.json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        hasMore: offset + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return c.json({ success: false, error: "Failed to fetch notifications" }, 500);
  }
});

/**
 * Get unread notification count
 */
notificationRoutes.get("/count", async (c) => {
  try {
    const user = c.get("user");
    const businessId = c.req.query("businessId");

    const where: any = {
      userId: user.id,
      isRead: false,
    };

    if (businessId) {
      where.businessId = businessId;
    }

    const count = await db.notification.count({ where });

    return c.json({ success: true, data: { count } });
  } catch (error) {
    console.error("Failed to get notification count:", error);
    return c.json({ success: false, error: "Failed to get count" }, 500);
  }
});

// =====================================================
// MARK AS READ
// =====================================================

const markReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
});

/**
 * Mark notifications as read
 */
notificationRoutes.post(
  "/mark-read",
  zValidator("json", markReadSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const { notificationIds, markAll } = c.req.valid("json");
      const businessId = c.req.query("businessId");

      if (markAll) {
        // Mark all notifications as read
        const where: any = {
          userId: user.id,
          isRead: false,
        };

        if (businessId) {
          where.businessId = businessId;
        }

        await db.notification.updateMany({
          where,
          data: { isRead: true, readAt: new Date() },
        });

        return c.json({ success: true, message: "All notifications marked as read" });
      }

      if (notificationIds && notificationIds.length > 0) {
        await db.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id,
          },
          data: { isRead: true, readAt: new Date() },
        });

        return c.json({ success: true, message: "Notifications marked as read" });
      }

      return c.json({ success: false, error: "No notifications specified" }, 400);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      return c.json({ success: false, error: "Failed to mark as read" }, 500);
    }
  }
);

/**
 * Mark a single notification as read
 */
notificationRoutes.patch("/:id/read", async (c) => {
  try {
    const user = c.get("user");
    const notificationId = c.req.param("id");

    const notification = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
      data: { isRead: true, readAt: new Date() },
    });

    if (notification.count === 0) {
      return c.json({ success: false, error: "Notification not found" }, 404);
    }

    return c.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return c.json({ success: false, error: "Failed to mark as read" }, 500);
  }
});

// =====================================================
// DELETE NOTIFICATIONS
// =====================================================

/**
 * Delete a notification
 */
notificationRoutes.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const notificationId = c.req.param("id");

    const notification = await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: user.id,
      },
    });

    if (notification.count === 0) {
      return c.json({ success: false, error: "Notification not found" }, 404);
    }

    return c.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return c.json({ success: false, error: "Failed to delete notification" }, 500);
  }
});

/**
 * Delete all read notifications
 */
notificationRoutes.delete("/", async (c) => {
  try {
    const user = c.get("user");
    const businessId = c.req.query("businessId");

    const where: any = {
      userId: user.id,
      isRead: true,
    };

    if (businessId) {
      where.businessId = businessId;
    }

    const result = await db.notification.deleteMany({ where });

    return c.json({
      success: true,
      message: `Deleted ${result.count} notifications`,
    });
  } catch (error) {
    console.error("Failed to delete notifications:", error);
    return c.json({ success: false, error: "Failed to delete notifications" }, 500);
  }
});

// =====================================================
// NOTIFICATION PREFERENCES
// =====================================================

/**
 * Get notification preferences
 */
notificationRoutes.get("/preferences", async (c) => {
  try {
    const user = c.get("user");
    const businessId = c.req.query("businessId");

    if (!businessId) {
      return c.json({ success: false, error: "Business ID required" }, 400);
    }

    let preferences = await db.notificationPreference.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await db.notificationPreference.create({
        data: {
          userId: user.id,
          businessId,
        },
      });
    }

    return c.json({ success: true, data: preferences });
  } catch (error) {
    console.error("Failed to get preferences:", error);
    return c.json({ success: false, error: "Failed to get preferences" }, 500);
  }
});

const updatePreferencesSchema = z.object({
  lowStockEmail: z.boolean().optional(),
  lowStockPush: z.boolean().optional(),
  newSaleEmail: z.boolean().optional(),
  newSalePush: z.boolean().optional(),
  largeSaleEmail: z.boolean().optional(),
  largeSalePush: z.boolean().optional(),
  largeSaleThreshold: z.number().optional(),
  newCustomerEmail: z.boolean().optional(),
  newCustomerPush: z.boolean().optional(),
  dailySummaryEmail: z.boolean().optional(),
  weeklyReportEmail: z.boolean().optional(),
});

/**
 * Update notification preferences
 */
notificationRoutes.put(
  "/preferences",
  zValidator("json", updatePreferencesSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const businessId = c.req.query("businessId");
      const updates = c.req.valid("json");

      if (!businessId) {
        return c.json({ success: false, error: "Business ID required" }, 400);
      }

      const preferences = await db.notificationPreference.upsert({
        where: { userId_businessId: { userId: user.id, businessId } },
        create: {
          userId: user.id,
          businessId,
          ...updates,
        },
        update: updates,
      });

      return c.json({ success: true, data: preferences });
    } catch (error) {
      console.error("Failed to update preferences:", error);
      return c.json({ success: false, error: "Failed to update preferences" }, 500);
    }
  }
);
