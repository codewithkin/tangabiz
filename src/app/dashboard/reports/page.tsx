"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    Download,
    Calendar,
    Loader2,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReportStats {
    revenue: {
        total: number;
        change: number;
        byDay: { date: string; amount: number }[];
    };
    sales: {
        total: number;
        change: number;
        byPaymentMethod: { method: string; count: number; amount: number }[];
    };
    products: {
        topSelling: { name: string; quantity: number; revenue: number }[];
        lowStock: { name: string; stock: number; lowStockAlert: number }[];
    };
    customers: {
        total: number;
        newThisMonth: number;
        topSpenders: { name: string; totalSpent: number; salesCount: number }[];
    };
}

export default function ReportsPage() {
    const [stats, setStats] = React.useState<ReportStats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [dateRange, setDateRange] = React.useState("30");

    React.useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/reports?days=${dateRange}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [dateRange]);

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

    const exportReport = () => {
        // Generate CSV
        if (!stats) return;

        const lines = [
            "Report Summary",
            `Date Range: Last ${dateRange} days`,
            "",
            "Revenue",
            `Total: ${formatCurrency(stats.revenue.total)}`,
            `Change: ${formatChange(stats.revenue.change)}`,
            "",
            "Sales",
            `Total Sales: ${stats.sales.total}`,
            "",
            "Sales by Payment Method",
            ...stats.sales.byPaymentMethod.map(
                (m) => `${m.method}: ${m.count} sales, ${formatCurrency(m.amount)}`
            ),
            "",
            "Top Selling Products",
            ...stats.products.topSelling.map(
                (p) => `${p.name}: ${p.quantity} sold, ${formatCurrency(p.revenue)}`
            ),
            "",
            "Top Customers",
            ...stats.customers.topSpenders.map(
                (c) => `${c.name}: ${c.salesCount} orders, ${formatCurrency(c.totalSpent)}`
            ),
        ];

        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
                    <p className="text-muted-foreground">
                        Analytics and insights for your business
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={exportReport} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats ? formatCurrency(stats.revenue.total) : "$0"}
                        </div>
                        {stats && (
                            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.revenue.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {stats.revenue.change >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                {formatChange(stats.revenue.change)} from previous period
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Sales
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.sales.total || 0}</div>
                        {stats && (
                            <p className={`text-xs flex items-center gap-1 mt-1 ${stats.sales.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {stats.sales.change >= 0 ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                )}
                                {formatChange(stats.sales.change)} from previous period
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Customers
                        </CardTitle>
                        <Users className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.customers.total || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +{stats?.customers.newThisMonth || 0} new this month
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock Items
                        </CardTitle>
                        <Package className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.products.lowStock.length || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Products need restocking
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Sales by Payment Method */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-green-600" />
                            Sales by Payment Method
                        </CardTitle>
                        <CardDescription>
                            Breakdown of payment methods used
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.sales.byPaymentMethod.length ? (
                            <div className="space-y-4">
                                {stats.sales.byPaymentMethod.map((method) => {
                                    const total = stats.sales.byPaymentMethod.reduce(
                                        (acc, m) => acc + m.count,
                                        0
                                    );
                                    const percentage = total > 0 ? (method.count / total) * 100 : 0;

                                    return (
                                        <div key={method.method} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium capitalize">{method.method}</span>
                                                <span className="text-muted-foreground">
                                                    {method.count} sales · {formatCurrency(method.amount)}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${method.method === "cash"
                                                            ? "bg-green-500"
                                                            : method.method === "card"
                                                                ? "bg-blue-500"
                                                                : "bg-yellow-500"
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No sales data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Selling Products */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Top Selling Products
                        </CardTitle>
                        <CardDescription>
                            Best performing products by quantity sold
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.products.topSelling.length ? (
                            <div className="space-y-4">
                                {stats.products.topSelling.slice(0, 5).map((product, index) => (
                                    <div key={product.name} className="flex items-center gap-4">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {product.quantity} sold
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No product data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Customers */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-yellow-600" />
                            Top Customers
                        </CardTitle>
                        <CardDescription>
                            Customers with highest total spending
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.customers.topSpenders.length ? (
                            <div className="space-y-4">
                                {stats.customers.topSpenders.slice(0, 5).map((customer, index) => (
                                    <div key={customer.name} className="flex items-center gap-4">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{customer.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {customer.salesCount} orders
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No customer data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-red-600" />
                            Low Stock Alert
                        </CardTitle>
                        <CardDescription>
                            Products that need restocking
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats?.products.lowStock.length ? (
                            <div className="space-y-4">
                                {stats.products.lowStock.slice(0, 5).map((product) => (
                                    <div key={product.name} className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Alert at {product.lowStockAlert} units
                                            </p>
                                        </div>
                                        <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                                            {product.stock} left
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-green-600">
                                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>All products are well stocked!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
