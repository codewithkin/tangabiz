import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
        const days = parseInt(searchParams.get("days") || "30");

        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

        // Current period revenue
        const currentRevenue = await prisma.sale.aggregate({
            where: {
                organizationId,
                createdAt: { gte: startDate },
                status: "completed",
            },
            _sum: { total: true },
            _count: true,
        });

        // Previous period revenue (for comparison)
        const previousRevenue = await prisma.sale.aggregate({
            where: {
                organizationId,
                createdAt: { gte: previousStartDate, lt: startDate },
                status: "completed",
            },
            _sum: { total: true },
            _count: true,
        });

        const currentRevenueTotal = Number(currentRevenue._sum.total || 0);
        const previousRevenueTotal = Number(previousRevenue._sum.total || 0);
        const revenueChange = previousRevenueTotal > 0
            ? ((currentRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
            : 0;

        const currentSalesCount = currentRevenue._count;
        const previousSalesCount = previousRevenue._count;
        const salesChange = previousSalesCount > 0
            ? ((currentSalesCount - previousSalesCount) / previousSalesCount) * 100
            : 0;

        // Revenue by day
        const revenueByDay = await prisma.$queryRaw`
            SELECT 
                DATE("createdAt") as date,
                SUM(total)::numeric as amount
            FROM sale
            WHERE "organizationId" = ${organizationId}
                AND "createdAt" >= ${startDate}
                AND status = 'completed'
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
        ` as { date: Date; amount: number }[];

        // Sales by payment method
        const salesByPaymentMethod = await prisma.$queryRaw`
            SELECT 
                "paymentMethod" as method,
                COUNT(*)::int as count,
                SUM(total)::numeric as amount
            FROM sale
            WHERE "organizationId" = ${organizationId}
                AND "createdAt" >= ${startDate}
                AND status = 'completed'
            GROUP BY "paymentMethod"
        ` as { method: string; count: number; amount: number }[];

        // Top selling products
        const topProducts = await prisma.$queryRaw`
            SELECT 
                p.name,
                SUM(si.quantity)::int as quantity,
                SUM(si.quantity * si.price)::numeric as revenue
            FROM "sale_item" si
            JOIN product p ON si."productId" = p.id
            JOIN sale s ON si."saleId" = s.id
            WHERE s."organizationId" = ${organizationId}
                AND s."createdAt" >= ${startDate}
                AND s.status = 'completed'
            GROUP BY p.id, p.name
            ORDER BY quantity DESC
            LIMIT 10
        ` as { name: string; quantity: number; revenue: number }[];

        // Low stock products
        const lowStockProducts = await prisma.product.findMany({
            where: {
                organizationId,
                isActive: true,
            },
            select: {
                name: true,
                stock: true,
                lowStockAlert: true,
            },
            orderBy: { stock: "asc" },
        });

        const lowStock = lowStockProducts.filter(p => p.stock <= p.lowStockAlert);

        // Customer stats
        const totalCustomers = await prisma.customer.count({
            where: { organizationId },
        });

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newCustomersThisMonth = await prisma.customer.count({
            where: {
                organizationId,
                createdAt: { gte: startOfMonth },
            },
        });

        // Top customers
        const topCustomers = await prisma.$queryRaw`
            SELECT 
                c.name,
                COUNT(s.id)::int as "salesCount",
                SUM(s.total)::numeric as "totalSpent"
            FROM customer c
            JOIN sale s ON s."customerId" = c.id
            WHERE c."organizationId" = ${organizationId}
                AND s."createdAt" >= ${startDate}
                AND s.status = 'completed'
            GROUP BY c.id, c.name
            ORDER BY "totalSpent" DESC
            LIMIT 10
        ` as { name: string; salesCount: number; totalSpent: number }[];

        return NextResponse.json({
            revenue: {
                total: currentRevenueTotal,
                change: revenueChange,
                byDay: revenueByDay.map(d => ({
                    date: d.date,
                    amount: Number(d.amount),
                })),
            },
            sales: {
                total: currentSalesCount,
                change: salesChange,
                byPaymentMethod: salesByPaymentMethod.map(m => ({
                    method: m.method,
                    count: Number(m.count),
                    amount: Number(m.amount),
                })),
            },
            products: {
                topSelling: topProducts.map(p => ({
                    name: p.name,
                    quantity: Number(p.quantity),
                    revenue: Number(p.revenue),
                })),
                lowStock: lowStock.map(p => ({
                    name: p.name,
                    stock: p.stock,
                    lowStockAlert: p.lowStockAlert,
                })),
            },
            customers: {
                total: totalCustomers,
                newThisMonth: newCustomersThisMonth,
                topSpenders: topCustomers.map(c => ({
                    name: c.name,
                    salesCount: Number(c.salesCount),
                    totalSpent: Number(c.totalSpent),
                })),
            },
        });
    } catch (error) {
        console.error("Reports error:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}
