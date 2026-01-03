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

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, email, phone, address, notes } = body;

        // Verify customer belongs to organization
        const existingCustomer = await prisma.customer.findFirst({
            where: { id, organizationId },
        });

        if (!existingCustomer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                address: address || null,
                notes: notes || null,
            },
        });

        return NextResponse.json(updatedCustomer);
    } catch (error) {
        console.error("Update customer error:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }

        const { id } = await params;

        // Verify customer belongs to organization
        const existingCustomer = await prisma.customer.findFirst({
            where: { id, organizationId },
        });

        if (!existingCustomer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Check if customer has sales
        const salesCount = await prisma.sale.count({
            where: { customerId: id },
        });

        if (salesCount > 0) {
            return NextResponse.json(
                { error: "Cannot delete customer with existing sales. Consider archiving instead." },
                { status: 400 }
            );
        }

        await prisma.customer.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete customer error:", error);
        return NextResponse.json(
            { error: "Failed to delete customer" },
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

        const organizationId = session.session.activeOrganizationId;
        if (!organizationId) {
            return NextResponse.json({ error: "No active organization" }, { status: 400 });
        }

        const { id } = await params;

        const customer = await prisma.customer.findFirst({
            where: { id, organizationId },
            include: {
                sales: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        // Calculate stats
        const totalSpent = await prisma.sale.aggregate({
            where: { customerId: id, status: "completed" },
            _sum: { total: true },
            _count: true,
        });

        return NextResponse.json({
            ...customer,
            stats: {
                totalSpent: Number(totalSpent._sum.total || 0),
                totalPurchases: totalSpent._count,
            },
        });
    } catch (error) {
        console.error("Get customer error:", error);
        return NextResponse.json(
            { error: "Failed to get customer" },
            { status: 500 }
        );
    }
}
