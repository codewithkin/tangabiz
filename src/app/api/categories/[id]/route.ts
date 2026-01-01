import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET single category
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

        const category = await prisma.category.findFirst({
            where: {
                id,
                organizationId,
            },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json({ category });
    } catch (error) {
        console.error("Fetch category error:", error);
        return NextResponse.json(
            { error: "Failed to fetch category" },
            { status: 500 }
        );
    }
}

// UPDATE category
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

        // Verify the category belongs to this business
        const existingCategory = await prisma.category.findFirst({
            where: { id, organizationId },
        });

        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // If name is being changed, check it's unique
        if (body.name && body.name !== existingCategory.name) {
            const nameExists = await prisma.category.findFirst({
                where: {
                    organizationId,
                    name: body.name,
                    id: { not: id },
                },
            });

            if (nameExists) {
                return NextResponse.json(
                    { error: "A category with this name already exists" },
                    { status: 400 }
                );
            }
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name: body.name || existingCategory.name,
                description: body.description !== undefined ? body.description : existingCategory.description,
            },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        return NextResponse.json({ category });
    } catch (error) {
        console.error("Update category error:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE category
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

        // Verify the category belongs to this business
        const existingCategory = await prisma.category.findFirst({
            where: { id, organizationId },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Check if category has products
        if (existingCategory._count.products > 0) {
            return NextResponse.json(
                {
                    error: "Cannot delete category with products. Remove or reassign products first.",
                    productCount: existingCategory._count.products,
                },
                { status: 400 }
            );
        }

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Delete category error:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
