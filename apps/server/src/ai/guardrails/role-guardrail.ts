// Role-Based Guardrails for Tatenda AI Agent
// Filters responses based on user role permissions

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

// Define what each role can access
export const ROLE_PERMISSIONS = {
  ADMIN: {
    canViewRevenue: true,
    canViewCosts: true,
    canViewProfitMargins: true,
    canViewCustomerEmails: true,
    canViewCustomerPhones: true,
    canViewTeamPerformance: true,
    canViewSensitiveReports: true,
    canViewAllTransactions: true,
    canViewInventoryValue: true,
    canViewBusinessSettings: true,
  },
  MANAGER: {
    canViewRevenue: true,
    canViewCosts: false, // Hide cost data from managers
    canViewProfitMargins: false, // Hide margins
    canViewCustomerEmails: true,
    canViewCustomerPhones: true,
    canViewTeamPerformance: true,
    canViewSensitiveReports: false,
    canViewAllTransactions: true,
    canViewInventoryValue: false, // Hide inventory value
    canViewBusinessSettings: false,
  },
  STAFF: {
    canViewRevenue: false, // Staff can't see revenue figures
    canViewCosts: false,
    canViewProfitMargins: false,
    canViewCustomerEmails: false, // Privacy protection
    canViewCustomerPhones: false,
    canViewTeamPerformance: false,
    canViewSensitiveReports: false,
    canViewAllTransactions: false, // Only their own
    canViewInventoryValue: false,
    canViewBusinessSettings: false,
  },
} as const;

// Sensitive field mappings for different data types
export const SENSITIVE_FIELDS = {
  salesSummary: {
    adminOnly: [] as string[],
    managerHidden: ["costOfGoodsSold", "profitMargin", "grossProfit"],
    staffHidden: ["totalSales", "netRevenue", "averageOrderValue", "totalRefunds"],
  },
  inventory: {
    adminOnly: [] as string[],
    managerHidden: ["inventoryValue", "costPrice"],
    staffHidden: ["inventoryValue", "costPrice", "profitMargin"],
  },
  customers: {
    adminOnly: [] as string[],
    managerHidden: [] as string[],
    staffHidden: ["email", "phone", "totalSpent"],
  },
  transactions: {
    adminOnly: [] as string[],
    managerHidden: ["costPrice", "profit"],
    staffHidden: ["costPrice", "profit", "total"],
  },
  business: {
    adminOnly: [] as string[],
    managerHidden: ["taxRate", "settings"],
    staffHidden: ["taxRate", "settings", "email", "bankDetails"],
  },
};

// Check if role has permission
export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.ADMIN): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// Generate role-specific system prompt additions
export function getRoleContext(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return `
The user is an ADMIN with full access to all business data.
You can share all information including:
- Complete revenue and sales figures
- Cost prices and profit margins
- Full customer details including contact information
- Team performance metrics
- All financial reports and analytics
- Business settings and configurations
`;

    case "MANAGER":
      return `
The user is a MANAGER with elevated but limited access.
You CAN share:
- Revenue and sales figures
- Customer names and contact details
- Transaction history
- Team performance basics
- Inventory stock levels

You MUST NOT share (politely decline if asked):
- Cost prices or profit margins
- Inventory monetary value
- Sensitive business settings
- Detailed financial reports with costs

If asked about restricted data, say something like:
"I can see you're asking about [topic], but that information is restricted to administrators. I'd be happy to help you with sales figures or other data I can access for you!"
`;

    case "STAFF":
      return `
The user is a STAFF member with basic access.
You CAN share:
- Product names and stock levels (quantities only)
- Customer names (no contact details)
- General business information
- Their own transaction records

You MUST NOT share (politely decline if asked):
- Any revenue or sales figures
- Customer emails or phone numbers
- Other staff members' performance
- Cost prices or profit information
- Financial reports or analytics

If asked about restricted data, say something like:
"I appreciate you asking! That information is available to managers and administrators. Is there something else I can help you with today?"
`;

    default:
      return "You have read-only access to basic public information only.";
  }
}

// Filter response data based on role
export function filterResponseByRole<T extends Record<string, any>>(
  data: T,
  role: UserRole,
  dataType: keyof typeof SENSITIVE_FIELDS
): Partial<T> {
  const fields = SENSITIVE_FIELDS[dataType];
  if (!fields) return data;

  const result = { ...data };

  // Remove fields based on role
  if (role === "STAFF") {
    [...fields.staffHidden, ...fields.managerHidden, ...fields.adminOnly].forEach((field) => {
      if (field in result) {
        delete result[field];
      }
    });
  } else if (role === "MANAGER") {
    [...fields.managerHidden, ...fields.adminOnly].forEach((field) => {
      if (field in result) {
        delete result[field];
      }
    });
  }
  // ADMIN keeps all fields

  return result;
}

// Guardrail to check if a request should be allowed
export function checkRequestGuardrail(
  role: UserRole,
  toolName: string,
  context: Record<string, any>
): { allowed: boolean; reason?: string } {
  // Staff restrictions
  if (role === "STAFF") {
    // Staff can't access sales summary
    if (toolName === "get-sales-summary") {
      return {
        allowed: false,
        reason: "Sales summary data is restricted to managers and administrators.",
      };
    }
    // Staff can't access customer insights (has spending data)
    if (toolName === "get-customer-insights") {
      return {
        allowed: false,
        reason: "Customer analytics are restricted to managers and administrators.",
      };
    }
  }

  // Manager restrictions
  if (role === "MANAGER") {
    // Managers can access most things, but data will be filtered
  }

  return { allowed: true };
}

// Output guardrail - sanitize response before sending
export function sanitizeOutput(
  role: UserRole,
  response: string
): string {
  if (role === "ADMIN") {
    return response; // Admin sees everything
  }

  let sanitized = response;

  // Remove currency amounts for staff
  if (role === "STAFF") {
    // Redact specific patterns like "KES 10,000" or "$1,234.56"
    sanitized = sanitized.replace(
      /(?:KES|USD|\$|€|£)\s*[\d,]+(?:\.\d{2})?/gi,
      "[Amount Hidden]"
    );
    // Redact email addresses
    sanitized = sanitized.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[Email Hidden]"
    );
    // Redact phone numbers
    sanitized = sanitized.replace(
      /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
      "[Phone Hidden]"
    );
  }

  return sanitized;
}
