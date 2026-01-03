import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/team/invitations
 * Fetches pending invitations for the current authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userEmail = session.user.email;

        if (!userEmail) {
            return NextResponse.json({ error: "User email not found" }, { status: 400 });
        }

        // Get pending invitations for this user's email
        const invitations = await prisma.invitation.findMany({
            where: {
                email: userEmail,
                status: "pending",
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Get organization details
        const orgIds = [...new Set(invitations.map((i) => i.organizationId))];
        const organizations = await prisma.organization.findMany({
            where: { id: { in: orgIds } },
            select: { id: true, name: true, slug: true },
        });
        const orgMap = new Map(organizations.map((o) => [o.id, o]));

        // Get inviter details
        const inviterIds = [...new Set(invitations.map((i) => i.inviterId))];
        const inviters = await prisma.user.findMany({
            where: { id: { in: inviterIds } },
            select: { id: true, name: true, email: true },
        });

        const inviterMap = new Map(inviters.map((i) => [i.id, i]));

        const formattedInvitations = invitations.map((inv) => {
            const inviter = inviterMap.get(inv.inviterId);
            const org = orgMap.get(inv.organizationId);
            return {
                id: inv.id,
                email: inv.email,
                role: inv.role,
                status: inv.status,
                organizationId: inv.organizationId,
                organizationName: org?.name || "Unknown",
                organizationSlug: org?.slug || "",
                inviterEmail: inviter?.email || "Unknown",
                expiresAt: inv.expiresAt,
            };
        });

        return NextResponse.json({ invitations: formattedInvitations });
    } catch (error) {
        console.error("Get user invitations error:", error);
        return NextResponse.json(
            { error: "Failed to fetch invitations" },
            { status: 500 }
        );
    }
}
