import { prisma } from "@/lib/prisma";
import { getPlan, isLimitExceeded, type PlanType } from "@/lib/plans";

export interface PlanCheckResult {
    allowed: boolean;
    reason?: string;
    current?: number;
    limit?: number;
}

// Get current counts for an organization
async function getOrganizationCounts(organizationId: string) {
    const [productCount, customerCount, memberCount, monthlySalesCount] = await Promise.all([
        prisma.product.count({
            where: { organizationId, isActive: true },
        }),
        prisma.customer.count({
            where: { organizationId },
        }),
        prisma.member.count({
            where: { organizationId },
        }),
        prisma.sale.count({
            where: {
                organizationId,
                createdAt: {
                    gte: new Date(new Date().setDate(1)), // First day of current month
                },
            },
        }),
    ]);

    return {
        products: productCount,
        customers: customerCount,
        teamMembers: memberCount,
        monthlySales: monthlySalesCount,
    };
}

// Check if organization can add a product
export async function canAddProduct(organizationId: string): Promise<PlanCheckResult> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    const plan = getPlan(org?.plan);
    if (!plan) {
        return { allowed: false, reason: "No plan selected" };
    }

    const counts = await getOrganizationCounts(organizationId);

    if (isLimitExceeded(counts.products, plan.limits.maxProducts)) {
        return {
            allowed: false,
            reason: `You've reached the maximum of ${plan.limits.maxProducts} products on the ${plan.name} plan`,
            current: counts.products,
            limit: plan.limits.maxProducts,
        };
    }

    return { allowed: true };
}

// Check if organization can add a customer
export async function canAddCustomer(organizationId: string): Promise<PlanCheckResult> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    const plan = getPlan(org?.plan);
    if (!plan) {
        return { allowed: false, reason: "No plan selected" };
    }

    const counts = await getOrganizationCounts(organizationId);

    if (isLimitExceeded(counts.customers, plan.limits.maxCustomers)) {
        return {
            allowed: false,
            reason: `You've reached the maximum of ${plan.limits.maxCustomers} customers on the ${plan.name} plan`,
            current: counts.customers,
            limit: plan.limits.maxCustomers,
        };
    }

    return { allowed: true };
}

// Check if organization can add a team member
export async function canAddTeamMember(organizationId: string): Promise<PlanCheckResult> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    const plan = getPlan(org?.plan);
    if (!plan) {
        return { allowed: false, reason: "No plan selected" };
    }

    const counts = await getOrganizationCounts(organizationId);

    if (isLimitExceeded(counts.teamMembers, plan.limits.maxTeamMembers)) {
        return {
            allowed: false,
            reason: `You've reached the maximum of ${plan.limits.maxTeamMembers} team members on the ${plan.name} plan`,
            current: counts.teamMembers,
            limit: plan.limits.maxTeamMembers,
        };
    }

    return { allowed: true };
}

// Check if organization can create a sale
export async function canCreateSale(organizationId: string): Promise<PlanCheckResult> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    const plan = getPlan(org?.plan);
    if (!plan) {
        return { allowed: false, reason: "No plan selected" };
    }

    const counts = await getOrganizationCounts(organizationId);

    if (isLimitExceeded(counts.monthlySales, plan.limits.maxMonthlySales)) {
        return {
            allowed: false,
            reason: `You've reached the maximum of ${plan.limits.maxMonthlySales} sales this month on the ${plan.name} plan`,
            current: counts.monthlySales,
            limit: plan.limits.maxMonthlySales,
        };
    }

    return { allowed: true };
}

// Check if organization has a specific feature
export async function hasFeature(
    organizationId: string,
    feature: keyof typeof import("@/lib/plans").PLANS.starter.limits.features
): Promise<boolean> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    const plan = getPlan(org?.plan);
    if (!plan) return false;

    return plan.limits.features[feature] ?? false;
}

// Get organization's current usage stats
export async function getOrganizationUsage(organizationId: string) {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true, planStartedAt: true },
    });

    const plan = getPlan(org?.plan);
    const counts = await getOrganizationCounts(organizationId);

    return {
        plan: org?.plan as PlanType | null,
        planStartedAt: org?.planStartedAt,
        usage: counts,
        limits: plan?.limits || null,
    };
}

// Check if organization can use email marketing
export async function canUseEmailMarketing(organizationId: string): Promise<PlanCheckResult> {
    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { plan: true },
    });

    const plan = getPlan(org?.plan);
    if (!plan) {
        return { allowed: false, reason: "No plan selected" };
    }

    if (!plan.limits.features.emailMarketing) {
        return {
            allowed: false,
            reason: `Email marketing is not available on the ${plan.name} plan. Please upgrade to Growth or Business plan.`,
        };
    }

    return { allowed: true };
}
