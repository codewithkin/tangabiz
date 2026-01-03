import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { receiptNumber: string } }
) {
    try {
        // Public endpoint - no auth required for receipt sharing
        const sale = await prisma.sale.findFirst({
            where: {
                receiptNumber: params.receiptNumber,
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
                customer: { select: { name: true, email: true, phone: true } },
                member: { select: { user: { select: { name: true } } } },
                organization: { select: { name: true, logo: true, metadata: true } },
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
