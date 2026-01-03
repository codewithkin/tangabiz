import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSubscription, getPlanTypeFromProductId } from "@/lib/polar";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        console.log("[API /verify-subscription] POST request started");
        
        // Get the authenticated session
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        console.log("[API /verify-subscription] Session check:", { hasSession: !!session, userId: session?.user?.id });

        if (!session || !session.user) {
            console.log("[API /verify-subscription] Unauthorized - no session");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Use Polar SDK to fetch subscriptions
        const userEmail = session.user.email;
        console.log("[API /verify-subscription] Fetching subscription for email:", userEmail);
        const activeSubscription = await getUserSubscription(userEmail);

        console.log("[API /verify-subscription] Active subscription:", activeSubscription);

        if (!activeSubscription) {
            console.log("[API /verify-subscription] No active subscription found");
            return NextResponse.json(
                { error: "No active subscription found for this user" },
                { status: 404 }
            );
        }

        // Get the product ID from the subscription (using correct property name)
        const productId = activeSubscription.productId;
        const planType = getPlanTypeFromProductId(productId);

        console.log("[API /verify-subscription] Product ID:", productId);
        console.log("[API /verify-subscription] Plan Type:", planType);
        console.log("[API /verify-subscription] Product ID mappings available:", {
            POLAR_STARTER_PRODUCT_ID: process.env.POLAR_STARTER_PRODUCT_ID,
            POLAR_GROWTH_PRODUCT_ID: process.env.POLAR_GROWTH_PRODUCT_ID,
            POLAR_ENTERPRISE_PRODUCT_ID: process.env.POLAR_ENTERPRISE_PRODUCT_ID,
            POLAR_STARTER_YEARLY_PRODUCT_ID: process.env.POLAR_STARTER_YEARLY_PRODUCT_ID,
            POLAR_GROWTH_YEARLY_PRODUCT_ID: process.env.POLAR_GROWTH_YEARLY_PRODUCT_ID,
            POLAR_ENTERPRISE_YEARLY_PRODUCT_ID: process.env.POLAR_ENTERPRISE_YEARLY_PRODUCT_ID,
        });

        if (!planType) {
            console.error("[API /verify-subscription] Unknown product ID:", productId);
            return NextResponse.json(
                { error: "Unknown subscription product", productId },
                { status: 400 }
            );
        }

        // Get the user's ACTIVE organization
        console.log("[API /verify-subscription] Finding ACTIVE organization for user:", session.user.id);
        
        // First try to get the active organization from session
        let org = session.user.activeOrganizationId 
            ? await prisma.organization.findUnique({
                where: { id: session.user.activeOrganizationId },
              })
            : null;

        console.log("[API /verify-subscription] Active org from session:", { orgId: org?.id, orgName: org?.name });

        // If no active org or user is not owner, find their first owned org
        if (!org) {
            console.log("[API /verify-subscription] No active org, finding first owned org");
            org = await prisma.organization.findFirst({
                where: {
                    members: {
                        some: {
                            userId: session.user.id,
                            role: "owner",
                        },
                    },
                },
            });
        }

        console.log("[API /verify-subscription] Organization to update:", { orgId: org?.id, orgName: org?.name, currentPlan: org?.plan });

        if (!org) {
            console.log("[API /verify-subscription] No organization found for user");
            return NextResponse.json(
                { error: "No organization found" },
                { status: 404 }
            );
        }

        // Update the organization's plan
        console.log("[API /verify-subscription] Updating organization plan:", { orgId: org.id, newPlan: planType });
        console.log("[API /verify-subscription] BEFORE UPDATE - Org state:", JSON.stringify({
            id: org.id,
            name: org.name,
            plan: org.plan,
            planStartedAt: org.planStartedAt
        }));
        
        const updatedOrg = await prisma.organization.update({
            where: { id: org.id },
            data: {
                plan: planType,
                planStartedAt: new Date(),
            },
        });
        
        console.log("[API /verify-subscription] AFTER UPDATE - Organization updated:", JSON.stringify({
            id: updatedOrg.id,
            name: updatedOrg.name,
            plan: updatedOrg.plan,
            planStartedAt: updatedOrg.planStartedAt
        }));
        
        // Verify the update by fetching the org again
        const verifyOrg = await prisma.organization.findUnique({
            where: { id: org.id },
            select: { id: true, name: true, plan: true, planStartedAt: true }
        });
        console.log("[API /verify-subscription] VERIFICATION FETCH - Org from DB:", JSON.stringify(verifyOrg));

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
