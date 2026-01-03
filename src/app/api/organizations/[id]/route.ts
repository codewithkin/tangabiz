import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        console.log("[API /organizations/[id]] GET request", { hasSession: !!session });

        if (!session?.user) {
            console.log("[API /organizations/[id]] Unauthorized - no session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        console.log("[API /organizations/[id]] Fetching org:", id, "for user:", session.user.id);

        // Verify the user is a member of this organization
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
            },
        });

        console.log("[API /organizations/[id]] Member check:", { isMember: !!member });

        if (!member) {
            console.log("[API /organizations/[id]] User is not a member");
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            );
        }

        // Fetch the organization with plan data
        const organization = await prisma.organization.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                planStartedAt: true,
                createdAt: true,
            },
        });

        console.log("[API /organizations/[id]] Organization data:", organization);

        if (!organization) {
            console.log("[API /organizations/[id]] Organization not found");
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(organization);
    } catch (error) {
        console.error("Error fetching organization:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
