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

        const { id } = await params;
        const body = await request.json();

        // Verify user is a member of this org
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            );
        }

        // Update organization
        const updated = await prisma.organization.update({
            where: { id },
            data: {
                name: body.name,
                logo: body.logo,
                metadata: JSON.stringify({
                    address: body.address,
                    phone: body.phone,
                    email: body.email,
                    taxId: body.taxId,
                    currency: body.currency,
                    timezone: body.timezone,
                    notifications: body.notifications,
                }),
            },
        });

        return NextResponse.json({ success: true, organization: updated });
    } catch (error) {
        console.error("Update org settings error:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}

export async function GET(
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

        const { id } = await params;

        // Verify user is a member
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId: id,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this organization" },
                { status: 403 }
            );
        }

        const org = await prisma.organization.findUnique({
            where: { id },
        });

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        // Parse metadata
        let settings = {};
        if (org.metadata) {
            try {
                settings = JSON.parse(org.metadata);
            } catch {
                settings = {};
            }
        }

        return NextResponse.json({
            name: org.name,
            slug: org.slug,
            logo: org.logo,
            ...settings,
        });
    } catch (error) {
        console.error("Get org settings error:", error);
        return NextResponse.json(
            { error: "Failed to get settings" },
            { status: 500 }
        );
    }
}
