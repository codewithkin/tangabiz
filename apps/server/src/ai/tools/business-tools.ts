// Business Data Tools for Tatenda AI Agent
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { db } from "../../lib/db";

// Role-based data access levels
type UserRole = "ADMIN" | "MANAGER" | "STAFF";

interface RoleContext {
  userId: string;
  businessId: string;
  role: UserRole;
}

// Helper to filter sensitive data based on role
function filterByRole<T extends Record<string, any>>(
  data: T,
  role: UserRole,
  sensitiveFields: { managerHidden: string[]; staffHidden: string[] }
): Partial<T> {
  const result = { ...data };

  if (role === "STAFF") {
    // Staff can't see manager-hidden and staff-hidden fields
    [...sensitiveFields.managerHidden, ...sensitiveFields.staffHidden].forEach((field) => {
      delete result[field];
    });
  } else if (role === "MANAGER") {
    // Managers can't see manager-hidden fields
    sensitiveFields.managerHidden.forEach((field) => {
      delete result[field];
    });
  }
  // ADMIN sees everything

  return result;
}

// =====================================================
// SALES SUMMARY TOOL
// =====================================================
export const getSalesSummaryTool = createTool({
  id: "get-sales-summary",
  description:
    "Get sales summary for a business including total sales, transaction count, average order value, and top products. Use this when users ask about sales performance, revenue, or how the business is doing.",
  inputSchema: z.object({
    businessId: z.string().describe("The business ID to get sales for"),
    period: z
      .enum(["today", "week", "month", "year"])
      .default("month")
      .describe("Time period for the sales summary"),
  }),
  outputSchema: z.object({
    totalSales: z.number(),
    totalTransactions: z.number(),
    averageOrderValue: z.number(),
    totalRefunds: z.number(),
    netRevenue: z.number(),
    topProducts: z.array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        revenue: z.number(),
      })
    ),
    salesByPaymentMethod: z.array(
      z.object({
        method: z.string(),
        amount: z.number(),
        count: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { businessId, period } = context;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get sales transactions
    const sales = await db.transaction.findMany({
      where: {
        businessId,
        type: "SALE",
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: now },
      },
      include: {
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    });

    // Get refunds
    const refunds = await db.transaction.findMany({
      where: {
        businessId,
        type: "REFUND",
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: now },
      },
    });

    const totalSales = sales.reduce((sum, t) => sum + Number(t.total), 0);
    const totalRefunds = refunds.reduce((sum, t) => sum + Number(t.total), 0);
    const totalTransactions = sales.length;
    const averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Calculate top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const name = item.product?.name || "Unknown";
        if (!productSales[name]) {
          productSales[name] = { name, quantity: 0, revenue: 0 };
        }
        productSales[name].quantity += item.quantity;
        productSales[name].revenue += Number(item.total);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales by payment method
    const methodSales: Record<string, { method: string; amount: number; count: number }> = {};
    sales.forEach((sale) => {
      const method = sale.paymentMethod;
      if (!methodSales[method]) {
        methodSales[method] = { method, amount: 0, count: 0 };
      }
      methodSales[method].amount += Number(sale.total);
      methodSales[method].count += 1;
    });

    return {
      totalSales,
      totalTransactions,
      averageOrderValue,
      totalRefunds,
      netRevenue: totalSales - totalRefunds,
      topProducts,
      salesByPaymentMethod: Object.values(methodSales),
    };
  },
});

// =====================================================
// INVENTORY STATUS TOOL
// =====================================================
export const getInventoryStatusTool = createTool({
  id: "get-inventory-status",
  description:
    "Get inventory status including total products, low stock items, out of stock items, and inventory value. Use this when users ask about stock, products, or inventory.",
  inputSchema: z.object({
    businessId: z.string().describe("The business ID to check inventory for"),
    includeDetails: z.boolean().default(false).describe("Include detailed product list"),
  }),
  outputSchema: z.object({
    totalProducts: z.number(),
    totalStock: z.number(),
    lowStockCount: z.number(),
    outOfStockCount: z.number(),
    inventoryValue: z.number(),
    lowStockItems: z.array(
      z.object({
        name: z.string(),
        sku: z.string().nullable(),
        stock: z.number(),
        minStock: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { businessId, includeDetails } = context;

    const products = await db.product.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        costPrice: true,
      },
    });

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockItems = products.filter((p) => p.stock <= p.minStock && p.stock > 0);
    const outOfStock = products.filter((p) => p.stock === 0);
    const inventoryValue = products.reduce((sum, p) => sum + p.stock * Number(p.costPrice), 0);

    return {
      totalProducts,
      totalStock,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStock.length,
      inventoryValue,
      lowStockItems: includeDetails
        ? lowStockItems.slice(0, 10).map((p) => ({
            name: p.name,
            sku: p.sku,
            stock: p.stock,
            minStock: p.minStock,
          }))
        : [],
    };
  },
});

// =====================================================
// CUSTOMER INSIGHTS TOOL
// =====================================================
export const getCustomerInsightsTool = createTool({
  id: "get-customer-insights",
  description:
    "Get customer insights including total customers, new customers, top customers by spending. Use this when users ask about customers or customer analytics.",
  inputSchema: z.object({
    businessId: z.string().describe("The business ID to get customer insights for"),
    period: z
      .enum(["week", "month", "year"])
      .default("month")
      .describe("Time period for new customer count"),
  }),
  outputSchema: z.object({
    totalCustomers: z.number(),
    newCustomers: z.number(),
    activeCustomers: z.number(),
    topCustomers: z.array(
      z.object({
        name: z.string(),
        email: z.string().nullable(),
        totalSpent: z.number(),
        transactionCount: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { businessId, period } = context;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const customers = await db.customer.findMany({
      where: { businessId },
      include: {
        _count: { select: { transactions: true } },
        transactions: {
          where: { type: "SALE", status: "COMPLETED" },
          select: { total: true },
        },
      },
    });

    const newCustomers = await db.customer.count({
      where: { businessId, createdAt: { gte: startDate } },
    });

    const activeCustomers = customers.filter((c) => c._count.transactions > 0).length;

    // Calculate top customers by spending
    const customerSpending = customers.map((c) => ({
      name: c.name,
      email: c.email,
      totalSpent: c.transactions.reduce((sum, t) => sum + Number(t.total), 0),
      transactionCount: c._count.transactions,
    }));

    const topCustomers = customerSpending.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    return {
      totalCustomers: customers.length,
      newCustomers,
      activeCustomers,
      topCustomers,
    };
  },
});

// =====================================================
// RECENT TRANSACTIONS TOOL
// =====================================================
export const getRecentTransactionsTool = createTool({
  id: "get-recent-transactions",
  description:
    "Get recent transactions for a business. Use this when users ask about recent sales, latest orders, or transaction history.",
  inputSchema: z.object({
    businessId: z.string().describe("The business ID to get transactions for"),
    limit: z.number().default(10).describe("Number of transactions to return"),
    type: z
      .enum(["SALE", "REFUND", "ALL"])
      .default("ALL")
      .describe("Filter by transaction type"),
  }),
  outputSchema: z.object({
    transactions: z.array(
      z.object({
        reference: z.string(),
        type: z.string(),
        total: z.number(),
        paymentMethod: z.string(),
        customerName: z.string().nullable(),
        itemCount: z.number(),
        createdAt: z.string(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { businessId, limit, type } = context;

    const where: any = { businessId };
    if (type !== "ALL") {
      where.type = type;
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      transactions: transactions.map((t) => ({
        reference: t.reference,
        type: t.type,
        total: Number(t.total),
        paymentMethod: t.paymentMethod,
        customerName: t.customer?.name || null,
        itemCount: t._count.items,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  },
});

// =====================================================
// BUSINESS INFO TOOL
// =====================================================
export const getBusinessInfoTool = createTool({
  id: "get-business-info",
  description:
    "Get business information including name, settings, and statistics. Use this when users ask about their business details or settings.",
  inputSchema: z.object({
    businessId: z.string().describe("The business ID to get info for"),
  }),
  outputSchema: z.object({
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    currency: z.string(),
    taxRate: z.number(),
    memberCount: z.number(),
    productCount: z.number(),
    customerCount: z.number(),
  }),
  execute: async ({ context }) => {
    const { businessId } = context;

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: {
        _count: {
          select: {
            members: true,
            products: true,
            customers: true,
          },
        },
      },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    return {
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      currency: business.currency,
      taxRate: Number(business.taxRate),
      memberCount: business._count.members,
      productCount: business._count.products,
      customerCount: business._count.customers,
    };
  },
});

// =====================================================
// SEARCH PRODUCTS TOOL
// =====================================================
export const searchProductsTool = createTool({
  id: "search-products",
  description:
    "Search for products by name, SKU, or category. Use this when users ask about specific products or want to find product details.",
  inputSchema: z.object({
    businessId: z.string().describe("The business ID to search in"),
    query: z.string().describe("Search query for product name or SKU"),
    limit: z.number().default(10).describe("Maximum results to return"),
  }),
  outputSchema: z.object({
    products: z.array(
      z.object({
        name: z.string(),
        sku: z.string().nullable(),
        price: z.number(),
        stock: z.number(),
        category: z.string().nullable(),
        isActive: z.boolean(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { businessId, query, limit } = context;

    const products = await db.product.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        category: { select: { name: true } },
      },
      take: limit,
    });

    return {
      products: products.map((p) => ({
        name: p.name,
        sku: p.sku,
        price: Number(p.price),
        stock: p.stock,
        category: p.category?.name || null,
        isActive: p.isActive,
      })),
    };
  },
});

// Export all tools
export const businessTools = {
  getSalesSummaryTool,
  getInventoryStatusTool,
  getCustomerInsightsTool,
  getRecentTransactionsTool,
  getBusinessInfoTool,
  searchProductsTool,
};
