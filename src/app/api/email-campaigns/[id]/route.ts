import { NextResponse } from "next/server";
import { getSession } from "@/helpers/auth/session";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/email-campaigns/[id] - Get a specific campaign
export async function GET(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        const campaign = await prisma.emailCampaign.findFirst({
            where: { id, organizationId },
            include: {
                recipients: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error("[EMAIL-CAMPAIGNS] GET by ID error:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaign" },
            { status: 500 }
        );
    }
}

// PUT /api/email-campaigns/[id] - Update a campaign
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        // Check if campaign exists and belongs to organization
        const existing = await prisma.emailCampaign.findFirst({
            where: { id, organizationId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Can only update draft campaigns
        if (existing.status !== "draft") {
            return NextResponse.json(
                { error: "Can only edit draft campaigns" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { subject, content } = body;

        const campaign = await prisma.emailCampaign.update({
            where: { id },
            data: {
                ...(subject && { subject }),
                ...(content && { content }),
            },
        });

        return NextResponse.json({ campaign });
    } catch (error) {
        console.error("[EMAIL-CAMPAIGNS] PUT error:", error);
        return NextResponse.json(
            { error: "Failed to update campaign" },
            { status: 500 }
        );
    }
}

// DELETE /api/email-campaigns/[id] - Delete a campaign
export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const session = await getSession();

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        // Check if campaign exists and belongs to organization
        const existing = await prisma.emailCampaign.findFirst({
            where: { id, organizationId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        await prisma.emailCampaign.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[EMAIL-CAMPAIGNS] DELETE error:", error);
        return NextResponse.json(
            { error: "Failed to delete campaign" },
            { status: 500 }
        );
    }
}
