import { getSessionAndRedirect } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Users, Package, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
    // Protect this page - only authenticated users can access
    await getSessionAndRedirect(true);

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Welcome back! Here's an overview of your business.
                </p>
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
                        <div className="text-2xl font-bold">$12,345</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

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
                        <div className="text-2xl font-bold">234</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +12 new this week
                        </p>
                    </CardContent>
                </Card>

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
                        <div className="text-2xl font-bold">89</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            5 low stock items
                        </p>
                    </CardContent>
                </Card>

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
                        <div className="text-2xl font-bold">$8,234</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            +15.3% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="pb-6">
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Your latest transactions and updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">
                            No recent activity. Start making sales to see your activity here.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
