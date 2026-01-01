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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Search,
    Loader2,
    ShoppingCart,
    Eye,
    Download,
    Calendar,
    TrendingUp,
    DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SaleItem {
    product: string;
    quantity: number;
    price: number;
}

interface Sale {
    id: string;
    receiptNumber: string;
    customer: string;
    customerEmail: string | null;
    staff: string;
    items: SaleItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
}

export default function SalesHistoryPage() {
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [dateRange, setDateRange] = React.useState("30");
    const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);

    React.useEffect(() => {
        fetchSales();
    }, [dateRange]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sales?days=${dateRange}`);
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

    const filteredSales = sales.filter((sale) => {
        const matchesSearch =
            sale.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sale.staff.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    // Calculate summary stats
    const totalRevenue = filteredSales
        .filter((s) => s.status === "completed")
        .reduce((sum, sale) => sum + sale.total, 0);

    const totalSales = filteredSales.filter((s) => s.status === "completed").length;

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/sales">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">Sales History</h2>
                    <p className="text-muted-foreground">
                        View and analyze your past sales
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Last {dateRange} days
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Sales
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSales}</div>
                        <p className="text-xs text-muted-foreground">
                            Completed transactions
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Average Order Value
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Per transaction
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sales Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                Detailed view of all sales transactions
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    className="pl-10 w-64"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="w-[150px]">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                    <SelectItem value="365">Last year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No sales found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? "Try adjusting your search"
                                    : "No sales in this time period"}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Receipt #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="text-muted-foreground">
                                                {formatDateShort(sale.createdAt)}
                                            </TableCell>
                                            <TableCell className="font-medium font-mono">
                                                {sale.receiptNumber}
                                            </TableCell>
                                            <TableCell>{sale.customer}</TableCell>
                                            <TableCell>{sale.staff}</TableCell>
                                            <TableCell>
                                                {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(sale.total)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(sale.status)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedSale(sale)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sale Details Dialog */}
            <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sale Details</DialogTitle>
                        <DialogDescription>
                            Receipt #{selectedSale?.receiptNumber}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedSale && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p className="font-medium">
                                        {formatDate(selectedSale.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Staff</p>
                                    <p className="font-medium">{selectedSale.staff}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Customer</p>
                                    <p className="font-medium">{selectedSale.customer}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Payment</p>
                                    <p className="font-medium capitalize">
                                        {selectedSale.paymentMethod}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="font-medium mb-2">Items</p>
                                <div className="space-y-2">
                                    {selectedSale.items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between text-sm"
                                        >
                                            <span>
                                                {item.quantity}x {item.product}
                                            </span>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                                </div>
                                {selectedSale.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(selectedSale.tax)}</span>
                                    </div>
                                )}
                                {selectedSale.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span>-{formatCurrency(selectedSale.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span className="text-green-600">
                                        {formatCurrency(selectedSale.total)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                {getStatusBadge(selectedSale.status)}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
