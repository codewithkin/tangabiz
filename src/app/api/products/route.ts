import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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

        const body = await request.json();
        const {
            name,
            description,
            sku,
            barcode,
            image,
            price,
            cost,
            stock,
            lowStockAlert,
            categoryId,
        } = body;

        if (!name || price === undefined) {
            return NextResponse.json(
                { error: "Name and price are required" },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || null,
                sku: sku || null,
                barcode: barcode || null,
                image: image || null,
                price: parseFloat(price),
                cost: cost ? parseFloat(cost) : null,
                stock: parseInt(stock) || 0,
                lowStockAlert: parseInt(lowStockAlert) || 5,
                categoryId: categoryId || null,
                organizationId,
            },
        });

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Create product error:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const lowStock = searchParams.get("lowStock") === "true";
        const categoryId = searchParams.get("categoryId");

        let products = await prisma.product.findMany({
            where: {
                organizationId,
                isActive: true,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { sku: { contains: search, mode: "insensitive" } },
                        { barcode: { contains: search, mode: "insensitive" } },
                    ],
                }),
                ...(categoryId && { categoryId }),
            },
            include: {
                category: { select: { id: true, name: true } },
            },
            orderBy: { name: "asc" },
        });

        // Filter for low stock if requested
        if (lowStock) {
            products = products.filter((p) => p.stock <= p.lowStockAlert);
        }

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Get products error:", error);
        return NextResponse.json(
            { error: "Failed to get products" },
            { status: 500 }
        );
    }
}
