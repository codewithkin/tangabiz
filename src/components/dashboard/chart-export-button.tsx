"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { SaleData } from "./sales-table";
import { CustomerData } from "./customers-table";

interface ChartExportButtonProps {
    salesData: SaleData[];
    customersData: CustomerData[];
    size?: "sm" | "default";
}

export function ChartExportButton({ salesData, customersData, size = "sm" }: ChartExportButtonProps) {
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
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const exportToCSV = (type: "sales" | "customers") => {
        let csvContent = "";
        let filename = "";

        if (type === "sales") {
            csvContent = "Receipt,Customer,Staff,Items,Subtotal,Tax,Discount,Total,Payment Method,Status,Date\n";
            csvContent += salesData
                .map((sale) =>
                    [
                        sale.receiptNumber,
                        `"${sale.customer}"`,
                        `"${sale.staff}"`,
                        sale.items.length,
                        sale.subtotal.toFixed(2),
                        sale.tax.toFixed(2),
                        sale.discount.toFixed(2),
                        sale.total.toFixed(2),
                        sale.paymentMethod,
                        sale.status,
                        formatDate(sale.createdAt),
                    ].join(",")
                )
                .join("\n");
            filename = `sales-export-${new Date().toISOString().split("T")[0]}.csv`;
        } else {
            csvContent = "Name,Email,Phone,Total Purchases,Joined\n";
            csvContent += customersData
                .map((customer) =>
                    [
                        `"${customer.name}"`,
                        customer.email || "",
                        customer.phone || "",
                        customer.totalPurchases.toFixed(2),
                        formatDate(customer.createdAt),
                    ].join(",")
                )
                .join("\n");
            filename = `customers-export-${new Date().toISOString().split("T")[0]}.csv`;
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const exportToPDF = async (type: "sales" | "customers") => {
        // Dynamic import to avoid SSR issues
        const jsPDF = (await import("jspdf")).default;
        const autoTable = (await import("jspdf-autotable")).default;

        const doc = new jsPDF();
        const title = type === "sales" ? "Sales Report" : "Customers Report";
        const filename = type === "sales"
            ? `sales-export-${new Date().toISOString().split("T")[0]}.pdf`
            : `customers-export-${new Date().toISOString().split("T")[0]}.pdf`;

        // Title
        doc.setFontSize(18);
        doc.text(title, 14, 22);

        // Date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

        if (type === "sales") {
            const tableData = salesData.map((sale) => [
                `#${sale.receiptNumber}`,
                sale.customer,
                sale.staff,
                `${sale.items.length} items`,
                formatCurrency(sale.total),
                sale.paymentMethod,
                sale.status,
                new Date(sale.createdAt).toLocaleDateString(),
            ]);

            autoTable(doc, {
                head: [["Receipt", "Customer", "Staff", "Items", "Total", "Payment", "Status", "Date"]],
                body: tableData,
                startY: 38,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 163, 74] }, // green-600
            });

            // Summary
            const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalY = (doc as any).lastAutoTable?.finalY || 150;
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Total Sales: ${salesData.length}`, 14, finalY + 10);
            doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, finalY + 18);
        } else {
            const tableData = customersData.map((customer) => [
                customer.name,
                customer.email || "—",
                customer.phone || "—",
                formatCurrency(customer.totalPurchases),
                new Date(customer.createdAt).toLocaleDateString(),
            ]);

            autoTable(doc, {
                head: [["Name", "Email", "Phone", "Total Purchases", "Joined"]],
                body: tableData,
                startY: 38,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [22, 163, 74] }, // green-600
            });

            // Summary
            const totalCustomers = customersData.length;
            const totalPurchases = customersData.reduce((sum, c) => sum + c.totalPurchases, 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalY = (doc as any).lastAutoTable?.finalY || 150;
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Total Customers: ${totalCustomers}`, 14, finalY + 10);
            doc.text(`Combined Purchases: ${formatCurrency(totalPurchases)}`, 14, finalY + 18);
        }

        doc.save(filename);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={size}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {salesData.length > 0 && (
                    <>
                        <DropdownMenuItem onClick={() => exportToCSV("sales")}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Sales as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToPDF("sales")}>
                            <FileText className="h-4 w-4 mr-2" />
                            Sales as PDF
                        </DropdownMenuItem>
                    </>
                )}
                {customersData.length > 0 && (
                    <>
                        <DropdownMenuItem onClick={() => exportToCSV("customers")}>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Customers as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToPDF("customers")}>
                            <FileText className="h-4 w-4 mr-2" />
                            Customers as PDF
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}