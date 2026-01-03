import { Polar } from "@polar-sh/sdk";

// Create and export a singleton Polar SDK client
export const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

// Types for Polar subscription response
export interface PolarCustomer {
  id: string;
  createdAt: Date;
  modifiedAt: Date | null;
  metadata: Record<string, any>;
  externalId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  billingAddress: {
    line1: string | null;
    line2: string | null;
    postalCode: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  };
  taxId: string | null;
  organizationId: string;
  deletedAt: Date | null;
  avatarUrl: string | null;
}

export interface PolarProduct {
  id: string;
  createdAt: Date;
  modifiedAt: Date | null;
  trialInterval: string | null;
  trialIntervalCount: number | null;
  name: string;
  description: string | null;
  recurringInterval: "month" | "year" | "day";
  recurringIntervalCount: number;
  isRecurring: boolean;
  isArchived: boolean;
  organizationId: string;
  metadata: Record<string, any>;
  prices: any[];
  benefits: any[];
  medias: any[];
  attachedCustomFields: any[];
}

export interface PolarSubscription {
  id: string;
  createdAt: Date;
  modifiedAt: Date | null;
  amount: number;
  currency: string;
  recurringInterval: "month" | "year" | "day";
  recurringIntervalCount: number;
  status: "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  startedAt: Date | null;
  endsAt: Date | null;
  endedAt: Date | null;
  customerId: string;
  productId: string;
  discountId: string | null;
  checkoutId: string | null;
  seats: number | null;
  customerCancellationReason: string | null;
  customerCancellationComment: string | null;
  metadata: Record<string, any>;
  customFieldData: Record<string, any>;
  customer?: PolarCustomer;
  product?: PolarProduct;
  discount?: any;
  prices?: any[];
  meters?: any[];
}

// Type for Polar paginated response
type PolarPaginatedResponse<T> = {
  result: {
    items: T[];
    pagination: {
      totalCount: number;
      maxPage: number;
    };
  };
  next: () => Promise<PolarPaginatedResponse<T> | undefined>;
};

// Map Polar product IDs to plan types
export const PRODUCT_ID_TO_PLAN: Record<string, string> = {
  // Monthly plans
  [process.env.POLAR_STARTER_PRODUCT_ID || ""]: "starter",
  [process.env.POLAR_GROWTH_PRODUCT_ID || ""]: "growth",
  [process.env.POLAR_ENTERPRISE_PRODUCT_ID || ""]: "enterprise",
  // Yearly plans
  [process.env.POLAR_STARTER_YEARLY_PRODUCT_ID || ""]: "starter",
  [process.env.POLAR_GROWTH_YEARLY_PRODUCT_ID || ""]: "growth",
  [process.env.POLAR_ENTERPRISE_YEARLY_PRODUCT_ID || ""]: "enterprise",
};

// Helper to get plan type from product ID
export function getPlanTypeFromProductId(productId: string): string | null {
  return PRODUCT_ID_TO_PLAN[productId] || null;
}

// Helper function to get active subscription for a user by email
export async function getUserSubscription(userEmail: string): Promise<PolarSubscription | null> {
  try {
    const response = await polarClient.subscriptions.list({
      limit: 100, // Fetch up to 100 subscriptions
    }) as PolarPaginatedResponse<PolarSubscription>;

    console.log("Fetched subscriptions from Polar:", response);

    // Find an active subscription for this user's email
    const activeSubscription = response.result.items?.find(
      (sub) =>
        (sub.status === "active" || sub.status === "trialing") &&
        sub.customer?.email === userEmail
    );

    console.log("Active subscription:", activeSubscription);

    return activeSubscription || null;
  } catch (error) {
    console.error("Error fetching subscription from Polar:", error);
    throw error;
  }
}

// Helper function to get all subscriptions for a user by email
export async function getUserSubscriptions(userEmail: string): Promise<PolarSubscription[]> {
  try {
    const response = await polarClient.subscriptions.list({
      limit: 100,
    }) as PolarPaginatedResponse<PolarSubscription>;

    const subscriptions = response.result.items?.filter(
      (sub) => sub.customer?.email === userEmail
    ) || [];

    return subscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions from Polar:", error);
    throw error;
  }
}
