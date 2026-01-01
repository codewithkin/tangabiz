"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Receipt,
    Loader2,
    ShoppingCart,
    TrendingUp,
    DollarSign,
    CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Sale {
    id: string;
    receiptNumber: string;
    customer: string;
    customerEmail: string | null;
    staff: string;
    items: { product: string; quantity: number; price: number }[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
}

interface Stats {
    todaySales: number;
    todayRevenue: number;
    weekSales: number;
    weekRevenue: number;
}

export default function SalesPage() {
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [stats, setStats] = React.useState<Stats | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [paymentFilter, setPaymentFilter] = React.useState("all");

    React.useEffect(() => {
        fetchSales();
        fetchStats();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await fetch("/api/sales");
            if (res.ok) {
                const data = await res.json();
                setSales(data.sales || []);
            }
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/sales/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const filteredSales = sales.filter((sale) => {
        const matchesSearch =
            sale.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.staff.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
            statusFilter === "all" || sale.status === statusFilter;

        const matchesPayment =
            paymentFilter === "all" || sale.paymentMethod === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
            case "refunded":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Refunded</Badge>;
            case "voided":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Voided</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case "card":
                return <CreditCard className="h-4 w-4" />;
            case "mobile":
                return <ShoppingCart className="h-4 w-4" />;
            default:
                return <DollarSign className="h-4 w-4" />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-KE", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sales</h2>
                    <p className="text-muted-foreground">
                        Manage your sales and transactions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/sales/pos">
                        <Button variant="outline">
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            POS Terminal
                        </Button>
                    </Link>
                    <Link href="/dashboard/sales/new">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="mr-2 h-4 w-4" />
                            New Sale
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Today&apos;s Sales
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.todaySales}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Today&apos;s Revenue
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.todayRevenue)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                This Week&apos;s Sales
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.weekSales}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                This Week&apos;s Revenue
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.weekRevenue)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle>All Sales</CardTitle>
                    <CardDescription>
                        View and manage all your sales transactions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by receipt, customer, or staff..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                    <SelectItem value="voided">Voided</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Payment" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Payments</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="mobile">Mobile</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No sales found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Get started by creating your first sale"}
                            </p>
                            <Link href="/dashboard/sales/new">
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Sale
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Receipt #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-medium">
                                                {sale.receiptNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{sale.customer}</div>
                                                    {sale.customerEmail && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {sale.customerEmail}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{sale.staff}</TableCell>
                                            <TableCell>
                                                {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getPaymentIcon(sale.paymentMethod)}
                                                    <span className="capitalize">{sale.paymentMethod}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(sale.total)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(sale.status)}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(sale.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Receipt className="mr-2 h-4 w-4" />
                                                            Print Receipt
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
