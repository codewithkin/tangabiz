import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/organizations
 * Fetches all organizations the current user is a member of
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all organizations where the user is a member
        const members = await prisma.member.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Get organization details
        const orgIds = members.map((m) => m.organizationId);
        const orgs = await prisma.organization.findMany({
            where: {
                id: { in: orgIds },
            },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                createdAt: true,
            },
        });

        // Map organizations with user's role
        const memberMap = new Map(members.map((m) => [m.organizationId, m.role]));
        const organizations = orgs.map((org) => ({
            ...org,
            role: memberMap.get(org.id),
        }));

        return NextResponse.json({ organizations });
    } catch (error) {
        console.error("Error fetching organizations:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
