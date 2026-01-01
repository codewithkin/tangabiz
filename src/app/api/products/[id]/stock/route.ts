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

        if (body.stock === undefined || body.stock < 0) {
            return NextResponse.json(
                { error: "Invalid stock value" },
                { status: 400 }
            );
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                stock: parseInt(body.stock),
            },
        });

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Update stock error:", error);
        return NextResponse.json(
            { error: "Failed to update stock" },
            { status: 500 }
        );
    }
}
