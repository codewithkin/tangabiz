import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateSale } from "@/lib/plan-limits";

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

        // Check plan limit
        const canSell = await canCreateSale(organizationId);
        if (!canSell.allowed) {
            return NextResponse.json(
                { 
                    error: "Plan limit reached",
                    message: `You've reached your plan's limit of ${canSell.limit} monthly sales. Please upgrade your plan to continue selling.`,
                    limitType: "monthlySales",
                    current: canSell.current,
                    limit: canSell.limit,
                },
                { status: 403 }
            );
        }

        // Get member for this user
        const member = await prisma.member.findFirst({
            where: { userId: session.user.id, organizationId },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member" }, { status: 403 });
        }

        const body = await request.json();
        const {
            items,
            customerId,
            paymentMethod,
            amountPaid,
            changeGiven,
            discount,
            tax,
            notes,
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "At least one item is required" },
                { status: 400 }
            );
        }

        // Calculate totals
        let subtotal = 0;
        const saleItems = [];

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                return NextResponse.json(
                    { error: `Product not found: ${item.productId}` },
                    { status: 400 }
                );
            }

            const itemTotal = Number(product.price) * item.quantity - (item.discount || 0);
            subtotal += itemTotal;

            saleItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: Number(product.price),
                discount: item.discount || 0,
                total: itemTotal,
            });

            // Update stock
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
            });
        }

        const taxAmount = tax || 0;
        const discountAmount = discount || 0;
        const total = subtotal + taxAmount - discountAmount;

        // Generate receipt number
        const date = new Date();
        const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        const receiptNumber = `RCP-${dateStr}-${randomNum}`;

        // Create sale with items
        const sale = await prisma.sale.create({
            data: {
                receiptNumber,
                subtotal,
                tax: taxAmount,
                discount: discountAmount,
                total,
                amountPaid: amountPaid || null,
                changeGiven: changeGiven || null,
                paymentMethod: paymentMethod || "cash",
                status: "completed",
                notes: notes || null,
                organizationId,
                customerId: customerId && customerId !== "walk-in" ? customerId : null,
                memberId: member.id,
                items: {
                    create: saleItems,
                },
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
                customer: { select: { name: true } },
            },
        });

        return NextResponse.json({ sale });
    } catch (error) {
        console.error("Create sale error:", error);
        return NextResponse.json(
            { error: "Failed to create sale" },
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
        const limit = parseInt(searchParams.get("limit") || "50");

        const sales = await prisma.sale.findMany({
            where: { organizationId },
            include: {
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
                customer: { select: { name: true, email: true } },
                member: { include: { user: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        return NextResponse.json({ sales });
    } catch (error) {
        console.error("Get sales error:", error);
        return NextResponse.json(
            { error: "Failed to get sales" },
            { status: 500 }
        );
    }
}
