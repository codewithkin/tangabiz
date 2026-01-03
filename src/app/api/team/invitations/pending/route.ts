import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }

        // Verify user is admin or owner
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!member || (member.role !== "admin" && member.role !== "owner")) {
            return NextResponse.json(
                { error: "Only admins can view pending invitations" },
                { status: 403 }
            );
        }

        // Get pending invitations for this organization
        const invitations = await prisma.invitation.findMany({
            where: {
                organizationId,
                status: "pending",
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ invitations });
    } catch (error) {
        console.error("Get pending invitations error:", error);
        return NextResponse.json(
            { error: "Failed to get invitations" },
            { status: 500 }
        );
    }
}
