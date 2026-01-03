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
    Download,
    Share2,
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
    organization?: { name: string; logo: string | null; metadata: string | null };
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

    const handleDownload = () => {
        window.print(); // Opens print dialog where user can print or save as PDF
    };

    const handleShare = async () => {
        if (navigator.share && sale) {
            try {
                await navigator.share({
                    title: `Receipt ${sale.receiptNumber}`,
                    text: `Receipt for ${formatCurrency(sale.total)} - ${sale.receiptNumber}`,
                    url: window.location.href,
                });
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Receipt link copied to clipboard!');
        }
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
        <div className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 print:hidden">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold tracking-tight">Receipt</h1>
                        <p className="text-sm text-muted-foreground">#{sale.receiptNumber}</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6 print:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="w-[15%]"
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Print / Download Receipt
                    </Button>
                </div>

                {/* Receipt Card */}
                <Card className="border-2 shadow-sm print:shadow-none">
                    <CardHeader className="border-b-2 border-green-600 pb-6">
                        {/* Business Branding */}
                        <div className="text-center mb-6">
                            {sale.organization?.logo && (
                                <img
                                    src={sale.organization.logo}
                                    alt={sale.organization.name}
                                    className="h-16 w-auto mx-auto mb-3"
                                />
                            )}
                            <h2 className="text-3xl font-bold text-green-600 mb-1">
                                {sale.organization?.name || "Business"}
                            </h2>
                            <p className="text-lg font-semibold text-muted-foreground">RECEIPT</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Receipt Number</p>
                                <p className="font-mono font-bold">{sale.receiptNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-1">Date</p>
                                <p className="font-medium">{formatDate(sale.createdAt)}</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6 space-y-6">
                        {/* Customer & Staff Info */}
                        <div className="grid grid-cols-2 gap-6 text-sm pb-4 border-b">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Customer</p>
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
                                <p className="text-xs text-muted-foreground mb-1">Staff</p>
                                <p className="font-medium">
                                    {sale.member?.user.name || "Unknown"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                                <p className="font-medium capitalize">{sale.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <Badge variant="outline" className="capitalize">{sale.status}</Badge>
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="font-semibold mb-3 text-sm">Items Purchased</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Product</th>
                                            <th className="text-center p-3 font-medium">Qty</th>
                                            <th className="text-right p-3 font-medium">Unit Price</th>
                                            <th className="text-right p-3 font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.items.map((item, index) => (
                                            <tr key={item.id} className={index !== sale.items.length - 1 ? "border-b" : ""}>
                                                <td className="p-3">{item.product.name}</td>
                                                <td className="text-center p-3">{item.quantity}</td>
                                                <td className="text-right p-3 text-muted-foreground">
                                                    {formatCurrency(item.unitPrice)}
                                                </td>
                                                <td className="text-right p-3 font-medium">
                                                    {formatCurrency(item.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t-2 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                            </div>
                            {sale.tax > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span className="font-medium">{formatCurrency(sale.tax)}</span>
                                </div>
                            )}
                            {sale.discount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="font-medium">-{formatCurrency(sale.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-3 border-t-2 border-green-600">
                                <span>Total Paid</span>
                                <span className="text-green-600">{formatCurrency(sale.total)}</span>
                            </div>
                        </div>

                        {sale.notes && (
                            <div className="border-t pt-4">
                                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                <p className="text-sm">{sale.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Print Footer */}
                <div className="text-center text-sm text-muted-foreground mt-6">
                    <p className="font-medium">Thank you for your purchase!</p>
                    <p className="text-xs mt-1">Please keep this receipt for your records.</p>
                </div>

                {/* Print Styles */}
                <style jsx global>{`
                    @media print {
                        body {
                            margin: 0;
                            padding: 0;
                        }
                        .max-w-md {
                            max-width: 80mm !important;
                            margin: 0 auto;
                        }
                        * {
                            font-size: 11px !important;
                        }
                        h2 {
                            font-size: 18px !important;
                        }
                        .text-3xl {
                            font-size: 18px !important;
                        }
                        .text-2xl {
                            font-size: 16px !important;
                        }
                        .text-xl {
                            font-size: 14px !important;
                        }
                        img {
                            max-height: 40px !important;
                        }
                        .p-3 {
                            padding: 0.5rem !important;
                        }
                        .pt-6, .pb-6 {
                            padding-top: 1rem !important;
                            padding-bottom: 1rem !important;
                        }
                    }
                `}</style>
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
                    @page {
                        margin: 1cm;
                    }
                }
            `}</style>
        </div>
    );
}
