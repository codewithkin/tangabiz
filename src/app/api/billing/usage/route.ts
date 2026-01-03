import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrganizationUsage } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get organization ID from query params or user's active organization
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get("organizationId");

        let organizationId = orgId;

        if (!organizationId) {
            // Get user's active organization
            const member = await prisma.member.findFirst({
                where: { userId: session.user.id },
                select: { organizationId: true },
            });

            if (!member) {
                return NextResponse.json(
                    { error: "No organization found" },
                    { status: 404 }
                );
            }
            organizationId = member.organizationId;
        }

        const usage = await getOrganizationUsage(organizationId);

        return NextResponse.json(usage);
    } catch (error) {
        console.error("Error fetching usage:", error);
        return NextResponse.json(
            { error: "Failed to fetch usage" },
            { status: 500 }
        );
    }
}
