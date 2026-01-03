import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSubscription, getPlanTypeFromProductId } from "@/lib/polar";
import { NextRequest, NextResponse } from "next/server";

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

        console.log("Active subscription:", activeSubscription);

        if (!activeSubscription) {
            return NextResponse.json(
                { error: "No active subscription found for this user" },
                { status: 404 }
            );
        }

        // Get the product ID from the subscription (using correct property name)
        const productId = activeSubscription.productId;
        const planType = getPlanTypeFromProductId(productId);

        console.log("Product ID:", productId);
        console.log("Plan Type:", planType);

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

        // Determine billing interval from subscription (using correct property name)
        const isYearly = activeSubscription.recurringInterval === "year";

        return NextResponse.json({
            success: true,
            plan: planType,
            isYearly,
            subscription: {
                id: activeSubscription.id,
                status: activeSubscription.status,
                currentPeriodEnd: activeSubscription.currentPeriodEnd,
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
