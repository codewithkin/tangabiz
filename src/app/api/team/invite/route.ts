import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { canAddTeamMember } from "@/lib/plan-limits";

/**
 * POST /api/team/invite
 * Server-side validation for team member invitations
 * Checks plan limits and member permissions
 * The actual invitation is sent via better-auth's organization.inviteMember
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { email, role, organizationId } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Determine the organization ID
        let targetOrgId = organizationId;

        if (!targetOrgId) {
            const activeMember = await prisma.member.findFirst({
                where: { userId: session.user.id },
            });

            if (!activeMember) {
                return NextResponse.json(
                    { error: "You must be part of an organization to invite members" },
                    { status: 400 }
                );
            }

            targetOrgId = activeMember.organizationId;
        }

        // Check plan limit
        const canAdd = await canAddTeamMember(targetOrgId);
        if (!canAdd.allowed) {
            return NextResponse.json(
                {
                    error: "Plan limit reached",
                    message: `You've reached your plan's limit of ${canAdd.limit} team members. Please upgrade your plan to invite more.`,
                    limitType: "teamMembers",
                    current: canAdd.current,
                    limit: canAdd.limit,
                },
                { status: 403 }
            );
        }

        // Check if user is admin or owner
        const activeMember = await prisma.member.findFirst({
            where: { userId: session.user.id, organizationId: targetOrgId },
        });

        if (!activeMember || (activeMember.role !== "admin" && activeMember.role !== "owner")) {
            return NextResponse.json(
                { error: "Only admins can invite new members" },
                { status: 403 }
            );
        }

        // Check if user already exists in this organization
        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId: targetOrgId,
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
                organizationId: targetOrgId,
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

        // All validations passed - return success
        // The actual invitation will be sent via authClient.organization.inviteMember on client
        return NextResponse.json({
            success: true,
            message: "Validation passed. Invitation can be sent.",
            organizationId: targetOrgId,
        });
    } catch (error) {
        console.error("Invite validation error:", error);
        return NextResponse.json(
            { error: "Failed to validate invitation" },
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
