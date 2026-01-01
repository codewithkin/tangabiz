import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { email, role } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Get user's active organization
        const activeMember = await prisma.member.findFirst({
            where: { userId: session.user.id },
            include: { organization: true },
        });

        if (!activeMember) {
            return NextResponse.json(
                { error: "You must be part of an organization to invite members" },
                { status: 400 }
            );
        }

        // Check if user is admin or owner
        if (activeMember.role !== "admin" && activeMember.role !== "owner") {
            return NextResponse.json(
                { error: "Only admins can invite new members" },
                { status: 403 }
            );
        }

        // Check if user already exists in this organization
        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId: activeMember.organizationId,
                user: { email },
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "This user is already a member of your organization" },
                { status: 400 }
            );
        }

        // Check for existing pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                organizationId: activeMember.organizationId,
                email,
                status: "pending",
            },
        });

        if (existingInvitation) {
            return NextResponse.json(
                { error: "An invitation has already been sent to this email" },
                { status: 400 }
            );
        }

        const invitationId = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create invitation
        const invitation = await prisma.invitation.create({
            data: {
                id: invitationId,
                email,
                role: role || "member",
                organizationId: activeMember.organizationId,
                inviterId: session.user.id,
                status: "pending",
                expiresAt,
                createdAt: new Date(),
            },
        });

        // Build invite link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite/${invitation.id}`;

        // Send invitation email
        try {
            await sendInviteEmail({
                email,
                inviteLink,
                inviterName: session.user.name || "",
                inviterEmail: session.user.email || "",
                shopName: activeMember.organization.name,
                role: role || "member",
            });
        } catch (emailError) {
            console.error("Failed to send invitation email:", emailError);
            // Delete the invitation if email fails
            await prisma.invitation.delete({ where: { id: invitation.id } });
            return NextResponse.json(
                { error: "Failed to send invitation email" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Invitation sent to ${email}`,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt,
            },
        });
    } catch (error) {
        console.error("Invite error:", error);
        return NextResponse.json(
            { error: "Failed to send invitation" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's active organization
        const activeMember = await prisma.member.findFirst({
            where: { userId: session.user.id },
        });

        if (!activeMember) {
            return NextResponse.json({ error: "No organization found" }, { status: 400 });
        }

        // Get pending invitations with inviter info via separate query
        const invitations = await prisma.invitation.findMany({
            where: {
                organizationId: activeMember.organizationId,
                status: "pending",
            },
            orderBy: { createdAt: "desc" },
        });

        // Get inviter details separately
        const inviterIds = [...new Set(invitations.map((i) => i.inviterId))];
        const inviters = await prisma.user.findMany({
            where: { id: { in: inviterIds } },
            select: { id: true, name: true, email: true },
        });

        const inviterMap = new Map(inviters.map((i) => [i.id, i]));

        const invitationsWithInviter = invitations.map((inv) => ({
            ...inv,
            inviter: inviterMap.get(inv.inviterId) || null,
        }));

        return NextResponse.json({ invitations: invitationsWithInviter });
    } catch (error) {
        console.error("Get invitations error:", error);
        return NextResponse.json(
            { error: "Failed to fetch invitations" },
            { status: 500 }
        );
    }
}
