import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        // Verify user is admin or owner
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!member || (member.role !== "admin" && member.role !== "owner")) {
            return NextResponse.json(
                { error: "Only admins can cancel invitations" },
                { status: 403 }
            );
        }

        // Verify invitation belongs to this org
        const invitation = await prisma.invitation.findUnique({
            where: { id },
        });

        if (!invitation || invitation.organizationId !== organizationId) {
            return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
        }

        // Delete the invitation
        await prisma.invitation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cancel invitation error:", error);
        return NextResponse.json(
            { error: "Failed to cancel invitation" },
            { status: 500 }
        );
    }
}
