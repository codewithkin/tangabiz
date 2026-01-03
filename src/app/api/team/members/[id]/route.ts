import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
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
        const body = await request.json();
        const { role } = body;

        // Verify requester is admin or owner
        const requesterMember = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!requesterMember || (requesterMember.role !== "admin" && requesterMember.role !== "owner")) {
            return NextResponse.json(
                { error: "Only admins can change roles" },
                { status: 403 }
            );
        }

        // Cannot change owner role
        const targetMember = await prisma.member.findUnique({
            where: { id },
        });

        if (!targetMember || targetMember.organizationId !== organizationId) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        if (targetMember.role === "owner") {
            return NextResponse.json(
                { error: "Cannot change owner role" },
                { status: 403 }
            );
        }

        // Update the member's role
        const updatedMember = await prisma.member.update({
            where: { id },
            data: { role },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ member: updatedMember });
    } catch (error) {
        console.error("Update member error:", error);
        return NextResponse.json(
            { error: "Failed to update member" },
            { status: 500 }
        );
    }
}

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

        // Verify requester is admin or owner
        const requesterMember = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!requesterMember || (requesterMember.role !== "admin" && requesterMember.role !== "owner")) {
            return NextResponse.json(
                { error: "Only admins can remove members" },
                { status: 403 }
            );
        }

        // Cannot remove owner or self
        const targetMember = await prisma.member.findUnique({
            where: { id },
        });

        if (!targetMember || targetMember.organizationId !== organizationId) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        if (targetMember.role === "owner") {
            return NextResponse.json(
                { error: "Cannot remove owner" },
                { status: 403 }
            );
        }

        if (targetMember.userId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot remove yourself" },
                { status: 403 }
            );
        }

        // Delete the member
        await prisma.member.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete member error:", error);
        return NextResponse.json(
            { error: "Failed to remove member" },
            { status: 500 }
        );
    }
}
