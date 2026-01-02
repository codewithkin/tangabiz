"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useActiveOrganization, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { data: org } = useActiveOrganization();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) {
            router.push("/auth");
            return;
        }

        const organizationId = (session as any)?.session?.activeOrganizationId;
        if (!organizationId) {
            router.push("/onboarding");
            return;
        }

        // Fetch dashboard stats
        fetch("/api/dashboard/stats")
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [session, router]);

    if (loading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
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
                    <h2 className="text-3xl font-bold tracking-tight">{org?.name || "Dashboard"}</h2>
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
