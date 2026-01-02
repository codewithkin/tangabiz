import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

        const body = await req.json();
        const { customerSessionToken } = body;

        if (!customerSessionToken) {
            return NextResponse.json(
                { error: "Missing customer session token" },
                { status: 400 }
            );
        }

        // Use server-side Polar API with access token to fetch subscriptions
        // We'll list all subscriptions and find the ones for this user's email
        const userEmail = session.user.email;

        const polarResponse = await fetch(
            "https://api.polar.sh/v1/subscriptions",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN || ""}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!polarResponse.ok) {
            const errorData = await polarResponse.json().catch(() => ({}));
            console.error("Polar API error:", errorData);
            return NextResponse.json(
                { error: "Failed to fetch subscription from Polar", details: errorData },
                { status: 500 }
            );
        }

        const subscriptionData = await polarResponse.json();
        const subscriptions = subscriptionData.items || [];

        // Find an active subscription for this user's email
        const activeSubscription = subscriptions.find(
            (sub: any) =>
                (sub.status === "active" || sub.status === "trialing") &&
                sub.customer?.email === userEmail
        );

        if (!activeSubscription) {
            return NextResponse.json(
                { error: "No active subscription found for this user", subscriptions: subscriptions.length },
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
