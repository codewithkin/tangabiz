import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify the user is a member of this organization
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

        // Fetch the organization with plan data
        const organization = await prisma.organization.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                planStartedAt: true,
                createdAt: true,
            },
        });

        if (!organization) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(organization);
    } catch (error) {
        console.error("Error fetching organization:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
