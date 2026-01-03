import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/email-campaigns - List all email campaigns
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        // Check if organization has access to email marketing
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { plan: true },
        });

        if (!organization?.plan || organization.plan === "starter") {
            return NextResponse.json(
                { error: "Email marketing requires Growth or Business plan" },
                { status: 403 }
            );
        }

        const campaigns = await prisma.emailCampaign.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { recipients: true },
                },
            },
        });

        return NextResponse.json({ campaigns });
    } catch (error) {
        console.error("[EMAIL-CAMPAIGNS] GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaigns" },
            { status: 500 }
        );
    }
}

// POST /api/email-campaigns - Create a new email campaign
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const organizationId = session.session.activeOrganizationId;

        // Check if organization has access to email marketing
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: { plan: true },
        });

        if (!organization?.plan || organization.plan === "starter") {
            return NextResponse.json(
                { error: "Email marketing requires Growth or Business plan" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { subject, content } = body;

        if (!subject || !content) {
            return NextResponse.json(
                { error: "Subject and content are required" },
                { status: 400 }
            );
        }

        const campaign = await prisma.emailCampaign.create({
            data: {
                subject,
                content,
                organizationId,
                status: "draft",
            },
        });

        return NextResponse.json({ campaign }, { status: 201 });
    } catch (error) {
        console.error("[EMAIL-CAMPAIGNS] POST error:", error);
        return NextResponse.json(
            { error: "Failed to create campaign" },
            { status: 500 }
        );
    }
}
