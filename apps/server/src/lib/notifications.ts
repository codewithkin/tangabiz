/**
 * Notification Service
 * Handles creating, sending, and managing notifications for business events
 */

import { db } from "./db";
import { sendSystemEmail, emailTemplates } from "./email";
import {
  sendToUser,
  sendToBusiness,
  createMessage,
  isUserConnected,
} from "./websocket";
import type { NotificationType, NotificationChannel } from "@prisma/client";

// =====================================================
// NOTIFICATION CREATION
// =====================================================

interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  businessId: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
}

/**
 * Create a notification and send it via configured channels
 */
export async function createNotification(
  options: CreateNotificationOptions
): Promise<void> {
  const { type, title, message, userId, businessId, data, channels = ["IN_APP"] } = options;

  try {
    // Get user preferences
    const preferences = await db.notificationPreference.findUnique({
      where: { userId_businessId: { userId, businessId } },
    });

    // Create notification in database
    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
        data: data ?? undefined,
        channels,
        userId,
        businessId,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
        business: {
          select: { name: true },
        },
      },
    });

    // Send via WebSocket (realtime in-app)
    if (channels.includes("IN_APP") && isUserConnected(userId)) {
      sendToUser(
        userId,
        createMessage("notification", {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt.toISOString(),
          isRead: false,
        })
      );
    }

    // Send via email if enabled
    if (channels.includes("EMAIL") && shouldSendEmail(type, preferences)) {
      await sendNotificationEmail(notification);
      await db.notification.update({
        where: { id: notification.id },
        data: { emailSent: true },
      });
    }

    console.log(`[Notification] Created ${type} notification for user ${userId}`);
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Create notifications for all users in a business
 */
export async function notifyBusinessUsers(
  businessId: string,
  options: Omit<CreateNotificationOptions, "userId" | "businessId">
): Promise<void> {
  try {
    // Get all active business members
    const members = await db.businessMember.findMany({
      where: { businessId, isActive: true },
      select: { userId: true },
    });

    // Create notification for each member
    await Promise.all(
      members.map((member) =>
        createNotification({
          ...options,
          userId: member.userId,
          businessId,
        })
      )
    );
  } catch (error) {
    console.error("[Notification] Failed to notify business users:", error);
  }
}

// =====================================================
// BUSINESS EVENT TRIGGERS
// =====================================================

/**
 * Trigger low stock notification
 */
export async function notifyLowStock(
  product: {
    id: string;
    name: string;
    quantity: number;
    minQuantity: number;
    businessId: string;
  }
): Promise<void> {
  await notifyBusinessUsers(product.businessId, {
    type: "LOW_STOCK",
    title: "Low Stock Alert",
    message: `${product.name} is running low (${product.quantity} remaining, minimum: ${product.minQuantity})`,
    data: {
      productId: product.id,
      productName: product.name,
      currentQuantity: product.quantity,
      minQuantity: product.minQuantity,
    },
    channels: ["IN_APP", "EMAIL"],
  });
}

/**
 * Trigger new sale notification
 */
export async function notifyNewSale(
  transaction: {
    id: string;
    reference: string;
    total: number;
    businessId: string;
    createdById: string;
    customerName?: string;
  }
): Promise<void> {
  // Get business preferences to check large sale threshold
  const preferences = await db.notificationPreference.findFirst({
    where: { businessId: transaction.businessId },
  });

  const threshold = preferences?.largeSaleThreshold
    ? Number(preferences.largeSaleThreshold)
    : 10000;

  const isLargeSale = transaction.total >= threshold;

  await notifyBusinessUsers(transaction.businessId, {
    type: isLargeSale ? "LARGE_SALE" : "NEW_SALE",
    title: isLargeSale ? "🎉 Large Sale Completed!" : "New Sale",
    message: isLargeSale
      ? `A sale of ${formatCurrency(transaction.total)} was just completed! Reference: ${transaction.reference}`
      : `Sale ${transaction.reference} completed for ${formatCurrency(transaction.total)}${
          transaction.customerName ? ` - ${transaction.customerName}` : ""
        }`,
    data: {
      transactionId: transaction.id,
      reference: transaction.reference,
      total: transaction.total,
      customerName: transaction.customerName,
    },
    channels: isLargeSale ? ["IN_APP", "EMAIL"] : ["IN_APP"],
  });

  // Also broadcast sale completion for realtime updates
  sendToBusiness(
    transaction.businessId,
    createMessage("sale_completed", {
      transactionId: transaction.id,
      reference: transaction.reference,
      total: transaction.total,
    })
  );
}

/**
 * Trigger new customer notification
 */
export async function notifyNewCustomer(
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    businessId: string;
    createdById: string;
  }
): Promise<void> {
  await notifyBusinessUsers(customer.businessId, {
    type: "NEW_CUSTOMER",
    title: "New Customer Added",
    message: `${customer.name} has been added to your customer database`,
    data: {
      customerId: customer.id,
      customerName: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    channels: ["IN_APP"],
  });

  // Broadcast for realtime customer list updates
  sendToBusiness(
    customer.businessId,
    createMessage("customer_created", {
      customerId: customer.id,
      customerName: customer.name,
    })
  );
}

/**
 * Trigger refund notification
 */
export async function notifyRefund(
  refund: {
    id: string;
    reference: string;
    total: number;
    businessId: string;
    originalReference?: string;
  }
): Promise<void> {
  await notifyBusinessUsers(refund.businessId, {
    type: "REFUND_PROCESSED",
    title: "Refund Processed",
    message: `A refund of ${formatCurrency(refund.total)} has been processed (${refund.reference})`,
    data: {
      transactionId: refund.id,
      reference: refund.reference,
      total: refund.total,
      originalReference: refund.originalReference,
    },
    channels: ["IN_APP", "EMAIL"],
  });
}

/**
 * Trigger daily summary notification
 */
export async function notifyDailySummary(
  businessId: string,
  summary: {
    totalSales: number;
    transactionCount: number;
    newCustomers: number;
    topProduct?: string;
  }
): Promise<void> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await notifyBusinessUsers(businessId, {
    type: "DAILY_SUMMARY",
    title: `Daily Summary - ${today}`,
    message: `Today's sales: ${formatCurrency(summary.totalSales)} from ${summary.transactionCount} transactions. New customers: ${summary.newCustomers}`,
    data: summary,
    channels: ["IN_APP", "EMAIL"],
  });
}

/**
 * Trigger goal achieved notification
 */
export async function notifyGoalAchieved(
  businessId: string,
  goal: {
    type: string;
    target: number;
    achieved: number;
    description: string;
  }
): Promise<void> {
  await notifyBusinessUsers(businessId, {
    type: "GOAL_ACHIEVED",
    title: "🎯 Goal Achieved!",
    message: goal.description,
    data: goal,
    channels: ["IN_APP", "EMAIL"],
  });
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Check if email should be sent based on notification type and preferences
 */
function shouldSendEmail(
  type: NotificationType,
  preferences: any | null
): boolean {
  if (!preferences) return true; // Default to sending if no preferences set

  switch (type) {
    case "LOW_STOCK":
      return preferences.lowStockEmail;
    case "NEW_SALE":
      return preferences.newSaleEmail;
    case "LARGE_SALE":
      return preferences.largeSaleEmail;
    case "NEW_CUSTOMER":
      return preferences.newCustomerEmail;
    case "DAILY_SUMMARY":
      return preferences.dailySummaryEmail;
    case "WEEKLY_REPORT":
      return preferences.weeklyReportEmail;
    default:
      return true;
  }
}

/**
 * Send notification via email
 */
async function sendNotificationEmail(
  notification: any
): Promise<void> {
  const emailContent = getEmailContent(notification);

  await sendSystemEmail({
    to: notification.user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

/**
 * Get email content based on notification type
 */
function getEmailContent(notification: any): { subject: string; html: string } {
  const { type, title, message, data, business, user } = notification;

  const baseTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #22c55e 0%, #eab308 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🌿 Tangabiz</h1>
        <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">${business.name}</p>
      </div>
      <div style="padding: 30px; background: #f9fafb;">
        <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
        <p style="color: #4b5563; line-height: 1.6;">${message}</p>
        {{CONTENT}}
      </div>
      <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        <p>You received this email because you're subscribed to ${business.name} notifications on Tangabiz.</p>
        <p>© ${new Date().getFullYear()} Tangabiz. All rights reserved.</p>
      </div>
    </div>
  `;

  let additionalContent = "";

  switch (type) {
    case "LOW_STOCK":
      additionalContent = `
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 20px;">
          <strong style="color: #dc2626;">Stock Alert</strong>
          <p style="color: #7f1d1d; margin: 5px 0 0 0;">
            Product: ${data?.productName}<br/>
            Current Stock: ${data?.currentQuantity}<br/>
            Minimum Required: ${data?.minQuantity}
          </p>
        </div>
      `;
      break;

    case "LARGE_SALE":
      additionalContent = `
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-top: 20px;">
          <strong style="color: #16a34a;">Sale Details</strong>
          <p style="color: #166534; margin: 5px 0 0 0;">
            Reference: ${data?.reference}<br/>
            Amount: ${formatCurrency(data?.total || 0)}
            ${data?.customerName ? `<br/>Customer: ${data.customerName}` : ""}
          </p>
        </div>
      `;
      break;

    case "REFUND_PROCESSED":
      additionalContent = `
        <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 15px; margin-top: 20px;">
          <strong style="color: #ca8a04;">Refund Details</strong>
          <p style="color: #854d0e; margin: 5px 0 0 0;">
            Reference: ${data?.reference}<br/>
            Amount: ${formatCurrency(data?.total || 0)}
          </p>
        </div>
      `;
      break;

    case "DAILY_SUMMARY":
      additionalContent = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                <strong>Total Sales</strong>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #22c55e; font-weight: bold;">
                ${formatCurrency(data?.totalSales || 0)}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                <strong>Transactions</strong>
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${data?.transactionCount || 0}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px;">
                <strong>New Customers</strong>
              </td>
              <td style="padding: 10px; text-align: right;">
                ${data?.newCustomers || 0}
              </td>
            </tr>
          </table>
        </div>
      `;
      break;

    default:
      additionalContent = "";
  }

  return {
    subject: `[Tangabiz] ${title}`,
    html: baseTemplate.replace("{{CONTENT}}", additionalContent),
  };
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Export all functions
export {
  formatCurrency,
};
