import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET single product
export async function GET(
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

        const product = await prisma.product.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                category: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Fetch product error:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

// UPDATE product
export async function PUT(
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

        // If SKU is being changed, check it's unique
        if (body.sku && body.sku !== existingProduct.sku) {
            const skuExists = await prisma.product.findFirst({
                where: {
                    organizationId,
                    sku: body.sku,
                    id: { not: id },
                },
            });

            if (skuExists) {
                return NextResponse.json(
                    { error: "A product with this SKU already exists" },
                    { status: 400 }
                );
            }
        }

        // If barcode is being changed, check it's unique
        if (body.barcode && body.barcode !== existingProduct.barcode) {
            const barcodeExists = await prisma.product.findFirst({
                where: {
                    organizationId,
                    barcode: body.barcode,
                    id: { not: id },
                },
            });

            if (barcodeExists) {
                return NextResponse.json(
                    { error: "A product with this barcode already exists" },
                    { status: 400 }
                );
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description,
                sku: body.sku || null,
                barcode: body.barcode || null,
                price: body.price ? parseFloat(body.price) : existingProduct.price,
                cost: body.cost ? parseFloat(body.cost) : existingProduct.cost,
                stock: body.stock !== undefined ? parseInt(body.stock) : existingProduct.stock,
                lowStockAlert: body.lowStockAlert !== undefined ? parseInt(body.lowStockAlert) : existingProduct.lowStockAlert,
                image: body.image,
                categoryId: body.categoryId || null,
                isActive: body.isActive !== undefined ? body.isActive : existingProduct.isActive,
            },
            include: {
                category: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Update product error:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

// DELETE product
export async function DELETE(
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

        // Verify the product belongs to this business
        const existingProduct = await prisma.product.findFirst({
            where: { id, organizationId },
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check if product has been used in any sales
        const salesCount = await prisma.saleItem.count({
            where: { productId: id },
        });

        if (salesCount > 0) {
            // Soft delete - just mark as inactive
            await prisma.product.update({
                where: { id },
                data: { isActive: false },
            });

            return NextResponse.json({
                message: "Product has been deactivated (has sales history)",
                deactivated: true,
            });
        }

        // Hard delete if no sales
        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
