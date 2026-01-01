import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

        // Get the member's role in this organization
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        // Fetch stats based on role
        // Staff can only see their own sales, managers/admins see all
        const isStaff = member.role === "member";
        const salesWhere = {
            organizationId,
            ...(isStaff ? { memberId: member.id } : {}),
        };

        // Total sales this month
        const salesThisMonth = await prisma.sale.aggregate({
            where: {
                ...salesWhere,
                createdAt: { gte: startOfMonth },
                status: "completed",
            },
            _sum: { total: true },
            _count: true,
        });

        // Total sales last month (for comparison)
        const salesLastMonth = await prisma.sale.aggregate({
            where: {
                ...salesWhere,
                createdAt: {
                    gte: startOfLastMonth,
                    lt: startOfMonth,
                },
                status: "completed",
            },
            _sum: { total: true },
        });

        // Calculate percentage change
        const currentSales = Number(salesThisMonth._sum.total || 0);
        const lastMonthSales = Number(salesLastMonth._sum.total || 0);
        const salesChange = lastMonthSales > 0
            ? ((currentSales - lastMonthSales) / lastMonthSales) * 100
            : 0;

        // Total customers (only for admin/manager)
        let customerStats = { total: 0, newThisWeek: 0 };
        if (!isStaff) {
            const totalCustomers = await prisma.customer.count({
                where: { organizationId },
            });

            const newCustomersThisWeek = await prisma.customer.count({
                where: {
                    organizationId,
                    createdAt: { gte: startOfWeek },
                },
            });

            customerStats = {
                total: totalCustomers,
                newThisWeek: newCustomersThisWeek,
            };
        }

        // Products count
        const totalProducts = await prisma.product.count({
            where: { organizationId, isActive: true },
        });

        const lowStockProducts = await prisma.product.count({
            where: {
                organizationId,
                isActive: true,
                stock: { lte: prisma.product.fields.lowStockAlert },
            },
        });

        // For low stock, we need a raw query since we're comparing two columns
        const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count FROM product 
            WHERE "organizationId" = ${organizationId} 
            AND "isActive" = true 
            AND stock <= "lowStockAlert"
        `;

        // Revenue (profit) - only for admin
        let revenueStats = { total: 0, change: 0 };
        if (member.role === "owner" || member.role === "admin") {
            // Revenue is calculated as total sales minus costs
            // For simplicity, we'll use total sales as revenue for now
            revenueStats = {
                total: currentSales,
                change: salesChange,
            };
        }

        // Recent activity
        const recentSales = await prisma.sale.findMany({
            where: salesWhere,
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                customer: { select: { name: true } },
                member: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recentActivity = (recentSales as any[]).map((sale) => ({
            id: sale.id,
            receiptNumber: sale.receiptNumber,
            total: Number(sale.total),
            customerName: sale.customer?.name || "Walk-in",
            staffName: sale.member?.user?.name || sale.member?.user?.email || "Unknown",
            itemCount: sale.items?.length || 0,
            createdAt: sale.createdAt,
        }));

        return NextResponse.json({
            role: member.role,
            stats: {
                sales: {
                    total: currentSales,
                    count: salesThisMonth._count,
                    change: salesChange,
                },
                customers: customerStats,
                products: {
                    total: totalProducts,
                    lowStock: Number(lowStockCount[0]?.count || 0),
                },
                revenue: revenueStats,
            },
            recentActivity,
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
}
