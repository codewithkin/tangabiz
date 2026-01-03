// Plan types
export type PlanType = "starter" | "growth" | "enterprise";

export interface PlanLimits {
    maxProducts: number;
    maxCustomers: number;
    maxTeamMembers: number;
    maxMonthlySales: number;
    maxLocations: number;
    features: {
        analytics: boolean;
        advancedReports: boolean;
        emailAlerts: boolean;
        apiAccess: boolean;
        customBranding: boolean;
        prioritySupport: boolean;
        multiLocation: boolean;
        bulkImport: boolean;
        exportData: boolean;
        customerLoyalty: boolean;
        inventoryAlerts: boolean;
        salesForecasting: boolean;
        emailMarketing: boolean;
    };
}

export interface Plan {
    id: PlanType;
    name: string;
    description: string;
    price: number; // Monthly price in USD
    yearlyPrice: number; // Yearly price in USD (discounted)
    polarProductId: string; // Polar product ID
    yearlyPolarProductId: string; // Polar yearly product ID
    limits: PlanLimits;
    popular?: boolean;
}

// Plan configurations
export const PLANS: Record<PlanType, Plan> = {
    starter: {
        id: "starter",
        name: "Starter",
        description: "Perfect for small shops just getting started",
        price: 19.99,
        yearlyPrice: 203.90, // Save 15%
        polarProductId: process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID || "",
        yearlyPolarProductId: process.env.NEXT_PUBLIC_POLAR_STARTER_YEARLY_PRODUCT_ID || "",
        limits: {
            maxProducts: 50,
            maxCustomers: 100,
            maxTeamMembers: 2,
            maxMonthlySales: 500,
            maxLocations: 1,
            features: {
                analytics: true,
                advancedReports: false,
                emailAlerts: false,
                apiAccess: false,
                customBranding: false,
                prioritySupport: false,
                multiLocation: false,
                bulkImport: false,
                exportData: true,
                customerLoyalty: false,
                inventoryAlerts: false,
                salesForecasting: false,
                emailMarketing: false,
            },
        },
    },
    growth: {
        id: "growth",
        name: "Growth",
        description: "For growing businesses that need more power",
        price: 49.99,
        yearlyPrice: 509.90, // Save 15%
        polarProductId: process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID || "",
        yearlyPolarProductId: process.env.NEXT_PUBLIC_POLAR_GROWTH_YEARLY_PRODUCT_ID || "",
        popular: true,
        limits: {
            maxProducts: 500,
            maxCustomers: 1000,
            maxTeamMembers: 10,
            maxMonthlySales: 5000,
            maxLocations: 3,
            features: {
                analytics: true,
                advancedReports: true,
                emailAlerts: true,
                apiAccess: false,
                customBranding: true,
                prioritySupport: false,
                multiLocation: true,
                bulkImport: true,
                exportData: true,
                customerLoyalty: true,
                inventoryAlerts: true,
                salesForecasting: false,
                emailMarketing: true,
            },
        },
    },
    enterprise: {
        id: "enterprise",
        name: "Enterprise",
        description: "For large businesses with advanced needs",
        price: 89.99,
        yearlyPrice: 917.90, // Save 15%
        polarProductId: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID || "",
        yearlyPolarProductId: process.env.NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PRODUCT_ID || "",
        limits: {
            maxProducts: -1, // Unlimited
            maxCustomers: -1, // Unlimited
            maxTeamMembers: -1, // Unlimited
            maxMonthlySales: -1, // Unlimited
            maxLocations: -1, // Unlimited
            features: {
                analytics: true,
                advancedReports: true,
                emailAlerts: true,
                apiAccess: true,
                customBranding: true,
                prioritySupport: true,
                multiLocation: true,
                bulkImport: true,
                exportData: true,
                customerLoyalty: true,
                inventoryAlerts: true,
                salesForecasting: true,
                emailMarketing: true,
            },
        },
    },
};

// Trial duration in days
export const TRIAL_DURATION_DAYS = 3;

// Get plan by ID
export function getPlan(planId: PlanType | string | null | undefined): Plan | null {
    if (!planId) return null;
    return PLANS[planId as PlanType] || null;
}

// Get all plans as array
export function getAllPlans(): Plan[] {
    return Object.values(PLANS);
}

// Check if a limit is exceeded (-1 means unlimited)
export function isLimitExceeded(current: number, max: number): boolean {
    if (max === -1) return false; // Unlimited
    return current >= max;
}

// Get formatted limit text
export function formatLimit(limit: number): string {
    if (limit === -1) return "Unlimited";
    return limit.toLocaleString();
}

// Feature display names
export const FEATURE_NAMES: Record<keyof PlanLimits["features"], string> = {
    analytics: "Basic Analytics",
    advancedReports: "Advanced Reports",
    emailAlerts: "Email Alerts",
    apiAccess: "API Access",
    customBranding: "Custom Branding",
    prioritySupport: "Priority Support",
    multiLocation: "Multi-Location Support",
    bulkImport: "Bulk Import",
    exportData: "Data Export",
    customerLoyalty: "Customer Loyalty Program",
    inventoryAlerts: "Inventory Alerts",
    salesForecasting: "Sales Forecasting",
};

// Check if trial is still active
export function isTrialActive(planStartedAt: Date | null): boolean {
    if (!planStartedAt) return false;
    const now = new Date();
    const trialEnd = new Date(planStartedAt);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
    return now < trialEnd;
}

// Get trial end date
export function getTrialEndDate(planStartedAt: Date | null): Date | null {
    if (!planStartedAt) return null;
    const trialEnd = new Date(planStartedAt);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
    return trialEnd;
}

// Get days remaining in trial
export function getTrialDaysRemaining(planStartedAt: Date | null): number {
    if (!planStartedAt) return 0;
    const trialEnd = getTrialEndDate(planStartedAt);
    if (!trialEnd) return 0;
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
