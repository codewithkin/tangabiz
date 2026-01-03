"use client";

import { useRef } from "react";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { SaleData } from "./sales-table";

interface ReceiptProps {
    sale: SaleData;
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
}

export function Receipt({ sale, businessName = "Tangabiz Store", businessAddress, businessPhone }: ReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt #${sale.receiptNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 16px; border-bottom: 1px dashed #000; padding-bottom: 16px; }
                    .business-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                    .business-info { font-size: 12px; color: #666; }
                    .receipt-info { margin: 16px 0; font-size: 12px; }
                    .receipt-info div { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 12px 0; margin: 12px 0; }
                    .item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
                    .item-name { flex: 1; }
                    .item-qty { width: 40px; text-align: center; }
                    .item-price { width: 60px; text-align: right; }
                    .totals { margin-top: 12px; font-size: 12px; }
                    .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .total-row { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
                    .payment-method { text-align: center; margin-top: 12px; font-size: 12px; font-weight: bold; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownload = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt #${sale.receiptNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 16px; border-bottom: 1px dashed #000; padding-bottom: 16px; }
                    .business-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
                    .business-info { font-size: 12px; color: #666; }
                    .receipt-info { margin: 16px 0; font-size: 12px; }
                    .receipt-info div { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .items { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 12px 0; margin: 12px 0; }
                    .item { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8px; }
                    .item-name { flex: 1; }
                    .item-qty { width: 40px; text-align: center; }
                    .item-price { width: 60px; text-align: right; }
                    .totals { margin-top: 12px; font-size: 12px; }
                    .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
                    .total-row { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
                    .payment-method { text-align: center; margin-top: 12px; font-size: 12px; font-weight: bold; }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${sale.receiptNumber}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Printer className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Receipt #{sale.receiptNumber}</DialogTitle>
                </DialogHeader>

                <div className="flex gap-2 mb-4">
                    <Button onClick={handlePrint} className="flex-1" variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handleDownload} className="flex-1" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>

                <div
                    ref={receiptRef}
                    className="bg-white p-4 rounded border font-mono text-sm"
                >
                    <div className="header text-center border-b border-dashed border-gray-400 pb-4 mb-4">
                        <div className="business-name text-lg font-bold">{businessName}</div>
                        {businessAddress && <div className="business-info text-xs text-gray-500">{businessAddress}</div>}
                        {businessPhone && <div className="business-info text-xs text-gray-500">{businessPhone}</div>}
                    </div>

                    <div className="receipt-info text-xs space-y-1">
                        <div className="flex justify-between">
                            <span>Receipt:</span>
                            <span>#{sale.receiptNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Date:</span>
                            <span>{formatDate(sale.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Customer:</span>
                            <span>{sale.customer}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Staff:</span>
                            <span>{sale.staff}</span>
                        </div>
                    </div>

                    <div className="items border-t border-b border-dashed border-gray-400 py-3 my-3">
                        <div className="flex text-xs font-bold mb-2">
                            <span className="flex-1">Item</span>
                            <span className="w-10 text-center">Qty</span>
                            <span className="w-16 text-right">Price</span>
                        </div>
                        {sale.items.map((item, idx) => (
                            <div key={idx} className="item flex text-xs mb-1">
                                <span className="item-name flex-1 truncate">{item.product}</span>
                                <span className="item-qty w-10 text-center">{item.quantity}</span>
                                <span className="item-price w-16 text-right">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="totals text-xs space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(sale.subtotal)}</span>
                        </div>
                        {sale.tax > 0 && (
                            <div className="flex justify-between">
                                <span>Tax:</span>
                                <span>{formatCurrency(sale.tax)}</span>
                            </div>
                        )}
                        {sale.discount > 0 && (
                            <div className="flex justify-between">
                                <span>Discount:</span>
                                <span>-{formatCurrency(sale.discount)}</span>
                            </div>
                        )}
                        <div className="total-row flex justify-between font-bold text-sm border-t border-gray-400 pt-2 mt-2">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(sale.total)}</span>
                        </div>
                        {sale.amountPaid != null && sale.amountPaid > 0 && (
                            <>
                                <div className="flex justify-between mt-2">
                                    <span>Amount Paid:</span>
                                    <span>{formatCurrency(sale.amountPaid)}</span>
                                </div>
                                {sale.changeGiven != null && sale.changeGiven > 0 && (
                                    <div className="flex justify-between font-bold">
                                        <span>Change:</span>
                                        <span>{formatCurrency(sale.changeGiven)}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="payment-method text-center mt-3 text-xs font-bold uppercase">
                        Paid by {sale.paymentMethod}
                    </div>

                    <div className="footer text-center mt-4 text-xs text-gray-500">
                        <p>Thank you for your purchase!</p>
                        <p>Powered by Tangabiz</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
