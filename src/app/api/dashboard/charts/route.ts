import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                organizationId,
            },
        });

        if (!member) {
            return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 });
        }

        // Parse time range from URL
        const { searchParams } = new URL(request.url);
        const range = searchParams.get("range") || "7d";

        const now = new Date();
        let startDate: Date;
        switch (range) {
            case "30d":
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case "90d":
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default: // 7d
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const isStaff = member.role === "member";
        const salesWhere = {
            organizationId,
            status: "completed" as const,
            createdAt: { gte: startDate },
            ...(isStaff ? { memberId: member.id } : {}),
        };

        // Get all sales in the range for chart data
        const sales = await prisma.sale.findMany({
            where: salesWhere,
            select: {
                total: true,
                paymentMethod: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        });

        // Aggregate daily sales data
        const dailyData: Record<string, { sales: number; revenue: number }> = {};
        const paymentData: Record<string, { value: number; count: number }> = {};

        // Initialize days
        const daysInRange = range === "90d" ? 90 : range === "30d" ? 30 : 7;
        for (let i = 0; i < daysInRange; i++) {
            const date = new Date(now.getTime() - (daysInRange - 1 - i) * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split("T")[0];
            dailyData[dateKey] = { sales: 0, revenue: 0 };
        }

        // Process sales
        for (const sale of sales) {
            const dateKey = sale.createdAt.toISOString().split("T")[0];
            const amount = Number(sale.total);

            if (dailyData[dateKey]) {
                dailyData[dateKey].sales += 1;
                dailyData[dateKey].revenue += amount;
            }

            const method = sale.paymentMethod || "other";
            if (!paymentData[method]) {
                paymentData[method] = { value: 0, count: 0 };
            }
            paymentData[method].value += amount;
            paymentData[method].count += 1;
        }

        // Convert to arrays for chart consumption
        const salesChartData = Object.entries(dailyData).map(([date, data]) => ({
            date,
            sales: data.sales,
            revenue: Math.round(data.revenue * 100) / 100,
        }));

        const paymentChartData = Object.entries(paymentData).map(([method, data]) => ({
            method,
            value: Math.round(data.value * 100) / 100,
            count: data.count,
        }));

        // Get recent sales for table
        const recentSales = await prisma.sale.findMany({
            where: {
                organizationId,
                ...(isStaff ? { memberId: member.id } : {}),
            },
            include: {
                customer: { select: { name: true, email: true } },
                member: { include: { user: { select: { name: true, email: true } } } },
                items: {
                    include: {
                        product: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const salesTableData = recentSales.map((sale) => ({
            id: sale.id,
            receiptNumber: sale.receiptNumber,
            customer: sale.customer?.name || "Walk-in",
            customerEmail: sale.customer?.email || null,
            staff: sale.member?.user?.name || sale.member?.user?.email || "Unknown",
            items: sale.items.map((item) => ({
                product: item.product.name,
                quantity: item.quantity,
                price: Number(item.price),
            })),
            subtotal: Number(sale.subtotal),
            tax: Number(sale.tax),
            discount: Number(sale.discount),
            total: Number(sale.total),
            paymentMethod: sale.paymentMethod,
            status: sale.status,
            createdAt: sale.createdAt.toISOString(),
        }));

        // Get recent customers for table (non-staff only)
        let customersTableData: Array<{
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            totalPurchases: number;
            createdAt: string;
        }> = [];

        if (!isStaff) {
            const recentCustomers = await prisma.customer.findMany({
                where: { organizationId },
                orderBy: { createdAt: "desc" },
                take: 20,
            });

            // Get purchase totals for each customer
            const customerIds = recentCustomers.map((c) => c.id);
            const purchaseTotals = await prisma.sale.groupBy({
                by: ["customerId"],
                where: {
                    customerId: { in: customerIds },
                    status: "completed",
                },
                _sum: { total: true },
            });

            const purchaseMap = new Map(
                purchaseTotals.map((p) => [p.customerId, Number(p._sum.total || 0)])
            );

            customersTableData = recentCustomers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                totalPurchases: purchaseMap.get(customer.id) || 0,
                createdAt: customer.createdAt.toISOString(),
            }));
        }

        return NextResponse.json({
            salesChart: salesChartData,
            paymentChart: paymentChartData,
            salesTable: salesTableData,
            customersTable: customersTableData,
            role: member.role,
        });
    } catch (error) {
        console.error("Chart data error:", error);
        return NextResponse.json(
            { error: "Failed to fetch chart data" },
            { status: 500 }
        );
    }
}
