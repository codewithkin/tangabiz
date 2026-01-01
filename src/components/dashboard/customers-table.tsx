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

export interface CustomerData {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    totalPurchases: number;
    createdAt: string;
}

interface CustomersTableProps {
    data: CustomerData[];
    showExportButton?: boolean;
    exportButton?: React.ReactNode;
}

export function CustomersTable({ data, showExportButton, exportButton }: CustomersTableProps) {
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
        });
    };

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Recent Customers</CardTitle>
                        <CardDescription>
                            Your latest customer registrations
                        </CardDescription>
                    </div>
                    {data.length > 0 && showExportButton && exportButton}
                </div>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead className="text-right">Total Purchases</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">
                                            {customer.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {customer.email || "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {customer.phone || "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(customer.totalPurchases)}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(customer.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">
                            No customers yet. Add customers to see them here.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
