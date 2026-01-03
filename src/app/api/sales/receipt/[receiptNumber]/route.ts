import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { receiptNumber: string } }
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

        const sale = await prisma.sale.findFirst({
            where: {
                receiptNumber: params.receiptNumber,
                organizationId,
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
                customer: { select: { name: true, email: true, phone: true } },
                member: { select: { user: { select: { name: true } } } },
            },
        });

        if (!sale) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        return NextResponse.json({ sale });
    } catch (error) {
        console.error("Fetch receipt error:", error);
        return NextResponse.json(
            { error: "Failed to fetch receipt" },
            { status: 500 }
        );
    }
}
