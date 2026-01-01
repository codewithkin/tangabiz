import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, TrendingUp, Plus, FileText } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard";
import { QuickActions } from "@/components/dashboard/quick-actions";

async function getDashboardStats(userId: string, organizationId: string) {
    const member = await prisma.member.findFirst({
        where: { userId, organizationId },
    });

    if (!member) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

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

    // Total sales last month
    const salesLastMonth = await prisma.sale.aggregate({
        where: {
            ...salesWhere,
            createdAt: { gte: startOfLastMonth, lt: startOfMonth },
            status: "completed",
        },
        _sum: { total: true },
    });

    const currentSales = Number(salesThisMonth._sum.total || 0);
    const lastMonthSales = Number(salesLastMonth._sum.total || 0);
    const salesChange = lastMonthSales > 0
        ? ((currentSales - lastMonthSales) / lastMonthSales) * 100
        : 0;

    // Customers
    let customerStats = { total: 0, newThisWeek: 0 };
    if (!isStaff) {
        const [totalCustomers, newCustomersThisWeek] = await Promise.all([
            prisma.customer.count({ where: { organizationId } }),
            prisma.customer.count({
                where: { organizationId, createdAt: { gte: startOfWeek } },
            }),
        ]);
        customerStats = { total: totalCustomers, newThisWeek: newCustomersThisWeek };
    }

    // Products
    const totalProducts = await prisma.product.count({
        where: { organizationId, isActive: true },
    });

    const lowStockCount = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM product 
        WHERE "organizationId" = ${organizationId} 
        AND "isActive" = true 
        AND stock <= "lowStockAlert"
    `;

    return {
        role: member.role,
        sales: { total: currentSales, count: salesThisMonth._count, change: salesChange },
        customers: customerStats,
        products: { total: totalProducts, lowStock: Number(lowStockCount[0]?.count || 0) },
        revenue: { total: currentSales, change: salesChange },
    };
}

export default async function DashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        redirect("/auth");
    }

    const organizationId = session.session.activeOrganizationId;

    // If no active organization, redirect to onboarding
    if (!organizationId) {
        redirect("/onboarding");
    }

    const stats = await getDashboardStats(session.user.id, organizationId);

    if (!stats) {
        redirect("/onboarding");
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatChange = (change: number) => {
        const sign = change >= 0 ? "+" : "";
        return `${sign}${change.toFixed(1)}%`;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Welcome back! Here's an overview of your business.
                    </p>
                </div>
                <QuickActions />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Sales
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.sales.total)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatChange(stats.sales.change)} from last month
                        </p>
                    </CardContent>
                </Card>

                {stats.role !== "member" && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Customers
                            </CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Users className="h-4 w-4 text-yellow-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.customers.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                +{stats.customers.newThisWeek} new this week
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Products
                        </CardTitle>
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.products.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.products.lowStock} low stock items
                        </p>
                    </CardContent>
                </Card>

                {(stats.role === "owner" || stats.role === "admin") && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Revenue
                            </CardTitle>
                            <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-yellow-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatChange(stats.revenue.change)} from last month
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Charts, Tables, and Export */}
            <DashboardCharts />
        </div>
    );
}
