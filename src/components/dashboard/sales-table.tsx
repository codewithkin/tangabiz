"use client";

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
import { Badge } from "@/components/ui/badge";

export interface SaleData {
    id: string;
    receiptNumber: string;
    customer: string;
    customerEmail: string | null;
    staff: string;
    items: Array<{
        product: string;
        quantity: number;
        price: number;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
}

interface SalesTableProps {
    data: SaleData[];
    showExportButton?: boolean;
    exportButton?: React.ReactNode;
}

export function SalesTable({ data, showExportButton, exportButton }: SalesTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>;
            case "refunded":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentBadge = (method: string) => {
        switch (method) {
            case "cash":
                return <Badge variant="outline" className="border-green-500 text-green-600">Cash</Badge>;
            case "card":
                return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Card</Badge>;
            case "mobile":
                return <Badge variant="outline" className="border-blue-500 text-blue-600">Mobile</Badge>;
            default:
                return <Badge variant="outline">{method}</Badge>;
        }
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>
                            Your latest transactions
                        </CardDescription>
                    </div>
                    {showExportButton && exportButton}
                </div>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Staff</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-medium">
                                            #{sale.receiptNumber}
                                        </TableCell>
                                        <TableCell>{sale.customer}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {sale.staff}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-muted-foreground">
                                                {sale.items.length} item{sale.items.length !== 1 ? "s" : ""}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(sale.total)}
                                        </TableCell>
                                        <TableCell>{getPaymentBadge(sale.paymentMethod)}</TableCell>
                                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(sale.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">
                            No sales yet. Start making sales to see them here.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
