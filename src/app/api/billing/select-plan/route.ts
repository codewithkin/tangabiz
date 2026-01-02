import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
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
        const { planId } = body;

        if (!planId || !["starter", "growth", "enterprise"].includes(planId)) {
            return NextResponse.json(
                { error: "Invalid plan ID" },
                { status: 400 }
            );
        }

        // Get the user's active organization
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

        // Update the selected plan
        await prisma.organization.update({
            where: { id: org.id },
            data: { selectedPlan: planId },
        });

        // Initiate checkout using Better Auth Polar plugin
        // The checkout will be handled client-side via authClient.checkout()
        // This endpoint just saves the selected plan and returns success
        return NextResponse.json({
            success: true,
            planId,
        });
    } catch (error) {
        console.error("Error selecting plan:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
