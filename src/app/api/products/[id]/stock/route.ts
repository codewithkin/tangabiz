import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH stock level
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.session?.activeOrganizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const organizationId = session.session.activeOrganizationId;
        const body = await request.json();

        // Verify the product belongs to this business
        const existingProduct = await prisma.product.findFirst({
            where: { id, organizationId },
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Support both absolute stock value and relative adjustment
        let newStock: number;
        if (body.adjustment !== undefined) {
            // Relative adjustment: +5 or -3
            newStock = Math.max(0, existingProduct.stock + parseInt(body.adjustment));
        } else if (body.stock !== undefined) {
            // Absolute stock value
            newStock = parseInt(body.stock);
            if (newStock < 0) {
                return NextResponse.json(
                    { error: "Stock cannot be negative" },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Must provide either 'stock' or 'adjustment'" },
                { status: 400 }
            );
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                stock: newStock,
            },
        });

        return NextResponse.json({ product, newStock: product.stock });
    } catch (error) {
        console.error("Update stock error:", error);
        return NextResponse.json(
            { error: "Failed to update stock" },
            { status: 500 }
        );
    }
}
