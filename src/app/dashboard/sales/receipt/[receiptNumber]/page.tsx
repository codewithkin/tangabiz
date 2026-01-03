"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeft,
    Loader2,
    Printer,
    Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SaleItem {
    id: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    product: { name: string };
}

interface Sale {
    id: string;
    receiptNumber: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    status: string;
    notes: string | null;
    createdAt: string;
    items: SaleItem[];
    customer: { name: string; email: string | null; phone: string | null } | null;
    member: { user: { name: string | null } } | null;
}

export default function ReceiptPage() {
    const params = useParams();
    const receiptNumber = params.receiptNumber as string;
    const [sale, setSale] = React.useState<Sale | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchReceipt = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/sales/receipt/${receiptNumber}`);
                if (!res.ok) {
                    throw new Error("Receipt not found");
                }
                const data = await res.json();
                setSale(data.sale);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load receipt");
            } finally {
                setLoading(false);
            }
        };

        fetchReceipt();
    }, [receiptNumber]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(date));
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !sale) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Receipt Not Found</CardTitle>
                        <CardDescription>
                            The receipt you're looking for doesn't exist or you don't have access to it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/dashboard/sales">
                            <Button className="w-full">Back to Sales</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard/sales">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">Receipt</h1>
                        <p className="text-muted-foreground">#{sale.receiptNumber}</p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        <Button variant="outline" size="icon" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Receipt Card */}
                <Card className="border-0 shadow-lg print:shadow-none print:border">
                    <CardHeader className="border-b pb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground mb-1">Receipt Number</p>
                                <p className="font-mono font-bold text-lg">{sale.receiptNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-muted-foreground mb-1">Date</p>
                                <p className="font-medium">{formatDate(sale.createdAt)}</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                        {/* Customer & Staff Info */}
                        <div>
                            <h3 className="font-semibold mb-3">Transaction Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Customer</p>
                                    <p className="font-medium">
                                        {sale.customer?.name || "Walk-in Customer"}
                                    </p>
                                    {sale.customer?.email && (
                                        <p className="text-muted-foreground text-xs">{sale.customer.email}</p>
                                    )}
                                    {sale.customer?.phone && (
                                        <p className="text-muted-foreground text-xs">{sale.customer.phone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Staff</p>
                                    <p className="font-medium">
                                        {sale.member?.user.name || "Unknown"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Payment Method</p>
                                    <p className="font-medium capitalize">{sale.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge className="capitalize">{sale.status}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="font-semibold mb-3">Items</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-2">Product</th>
                                            <th className="text-center p-2">Qty</th>
                                            <th className="text-right p-2">Unit Price</th>
                                            <th className="text-right p-2">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map((item) => (
                                            <tr key={item.id} className="border-t">
                                                <td className="p-2">{item.product.name}</td>
                                                <td className="text-center p-2">{item.quantity}</td>
                                                <td className="text-right p-2">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="text-right p-2 font-medium">
                                                    {formatCurrency(item.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            {sale.tax > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(sale.tax)}</span>
                                </div>
                            )}
                            {sale.discount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span>-{formatCurrency(sale.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span className="text-green-600">{formatCurrency(sale.total)}</span>
                            </div>
                        </div>

                        {sale.notes && (
                            <div className="border-t pt-4">
                                <p className="text-xs text-muted-foreground">Notes</p>
                                <p className="text-sm">{sale.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Print Footer */}
                <div className="text-center text-xs text-muted-foreground mt-6 print:block hidden">
                    <p>Thank you for your purchase!</p>
                    <p>Please keep this receipt for your records.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
