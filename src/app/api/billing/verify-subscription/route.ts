import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/polar";
import { NextRequest, NextResponse } from "next/server";

// Map Polar product IDs to plan types
const PRODUCT_ID_TO_PLAN: Record<string, string> = {
    // Monthly plans
    [process.env.POLAR_STARTER_PRODUCT_ID || ""]: "starter",
    [process.env.POLAR_GROWTH_PRODUCT_ID || ""]: "growth",
    [process.env.POLAR_ENTERPRISE_PRODUCT_ID || ""]: "enterprise",
    // Yearly plans
    [process.env.POLAR_STARTER_YEARLY_PRODUCT_ID || ""]: "starter",
    [process.env.POLAR_GROWTH_YEARLY_PRODUCT_ID || ""]: "growth",
    [process.env.POLAR_ENTERPRISE_YEARLY_PRODUCT_ID || ""]: "enterprise",
};

export async function POST(req: NextRequest) {
    try {
        // Get the authenticated session
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Use Polar SDK to fetch subscriptions
        const userEmail = session.user.email;
        const activeSubscription = await getUserSubscription(userEmail);

        if (!activeSubscription) {
            return NextResponse.json(
                { error: "No active subscription found for this user" },
                { status: 404 }
            );
        }

        // Get the product ID from the subscription
        const productId = activeSubscription.product_id;
        const planType = PRODUCT_ID_TO_PLAN[productId];

        if (!planType) {
            console.error("Unknown product ID:", productId);
            return NextResponse.json(
                { error: "Unknown subscription product", productId },
                { status: 400 }
            );
        }

        // Get the user's organization (where they are owner)
        const org = await prisma.organization.findFirst({
            where: {
                members: {
                    some: {
                        userId: session.user.id,
                        role: "owner",
                    },
                },
            },
        });

        if (!org) {
            return NextResponse.json(
                { error: "No organization found" },
                { status: 404 }
            );
        }

        // Update the organization's plan
        await prisma.organization.update({
            where: { id: org.id },
            data: {
                plan: planType,
                planStartedAt: new Date(),
            },
        });

        // Determine billing interval from subscription
        const isYearly = activeSubscription.recurring_interval === "year";

        return NextResponse.json({
            success: true,
            plan: planType,
            isYearly,
            subscription: {
                id: activeSubscription.id,
                status: activeSubscription.status,
                currentPeriodEnd: activeSubscription.current_period_end,
                productName: activeSubscription.product?.name,
            },
        });
    } catch (error) {
        console.error("Error verifying subscription:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
