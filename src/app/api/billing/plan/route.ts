import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPlan, type PlanType } from "@/lib/plans";

// Update organization plan
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;
        const userId = session.user.id;

        // Check if user is owner of the organization
        const member = await prisma.member.findFirst({
            where: {
                organizationId,
                userId,
                role: "owner",
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Only organization owners can change plans" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { plan } = body;

        // Validate plan
        if (!plan || !["starter", "growth", "enterprise"].includes(plan)) {
            return NextResponse.json(
                { error: "Invalid plan. Must be starter, growth, or enterprise" },
                { status: 400 }
            );
        }

        const planData = getPlan(plan as PlanType);
        if (!planData) {
            return NextResponse.json({ error: "Plan not found" }, { status: 400 });
        }

        // Update organization with new plan
        const updatedOrg = await prisma.organization.update({
            where: { id: organizationId },
            data: {
                plan,
                planStartedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            organization: {
                id: updatedOrg.id,
                name: updatedOrg.name,
                plan: updatedOrg.plan,
                planStartedAt: updatedOrg.planStartedAt,
            },
        });
    } catch (error) {
        console.error("Update plan error:", error);
        return NextResponse.json(
            { error: "Failed to update plan" },
            { status: 500 }
        );
    }
}

// Get organization plan and usage
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                plan: true,
                planStartedAt: true,
            },
        });

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Get current usage
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
                        gte: new Date(new Date().setDate(1)),
                    },
                },
            }),
        ]);

        const plan = getPlan(org.plan);

        return NextResponse.json({
            organization: org,
            plan: plan,
            usage: {
                products: productCount,
                customers: customerCount,
                teamMembers: memberCount,
                monthlySales: monthlySalesCount,
            },
        });
    } catch (error) {
        console.error("Get plan error:", error);
        return NextResponse.json(
            { error: "Failed to get plan" },
            { status: 500 }
        );
    }
}
