"use client";

import * as React from "react";
import { SalesChart, SalesDataPoint } from "./sales-chart";
import { PaymentPieChart, PaymentMethodData } from "./payment-pie-chart";
import { SalesTable, SaleData } from "./sales-table";
import { CustomersTable, CustomerData } from "./customers-table";
import { ExportButton } from "./export-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ChartData {
    salesChart: SalesDataPoint[];
    paymentChart: PaymentMethodData[];
    salesTable: SaleData[];
    customersTable: CustomerData[];
    role: string;
}

export function DashboardCharts() {
    const [data, setData] = React.useState<ChartData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [timeRange, setTimeRange] = React.useState("7d");
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async (range: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/charts?range=${range}`);
            if (!response.ok) {
                throw new Error("Failed to fetch chart data");
            }
            const chartData = await response.json();
            setData(chartData);
            setError(null);
        } catch (err) {
            setError("Failed to load chart data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData(timeRange);
    }, [timeRange, fetchData]);

    const handleTimeRangeChange = (value: string) => {
        setTimeRange(value);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Charts skeleton */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="border-0 shadow-lg lg:col-span-2">
                        <CardHeader className="border-b py-5">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Skeleton className="h-[250px] w-full" />
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[250px] w-full rounded-full mx-auto max-w-[200px]" />
                        </CardContent>
                    </Card>
                </div>
                {/* Table skeleton */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-0 shadow-lg">
                <CardContent className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const showCustomers = data.role !== "member" && data.customersTable.length > 0;

    return (
        <div className="space-y-6">
            {/* Export button */}
            <div className="flex justify-end">
                <ExportButton
                    salesData={data.salesTable}
                    customersData={data.customersTable}
                />
            </div>

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <SalesChart
                        data={data.salesChart}
                        timeRange={timeRange}
                        onTimeRangeChange={handleTimeRangeChange}
                    />
                </div>
                <div>
                    <PaymentPieChart data={data.paymentChart} />
                </div>
            </div>

            {/* Tables */}
            <SalesTable data={data.salesTable} />

            {showCustomers && (
                <CustomersTable data={data.customersTable} />
            )}
        </div>
    );
}
