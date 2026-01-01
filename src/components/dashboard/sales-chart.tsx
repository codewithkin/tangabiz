"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface SalesDataPoint {
    date: string;
    sales: number;
    revenue: number;
}

interface SalesChartProps {
    data: SalesDataPoint[];
    timeRange: string;
    onTimeRangeChange: (value: string) => void;
    showExportButton?: boolean;
    exportButton?: React.ReactNode;
}

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(142, 71%, 45%)", // green-500
    },
    sales: {
        label: "Sales Count",
        color: "hsl(48, 96%, 53%)", // yellow-400
    },
} satisfies ChartConfig;

export function SalesChart({ data, timeRange, onTimeRangeChange, showExportButton, exportButton }: SalesChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const hasData = data.length > 0 && data.some(d => d.sales > 0 || d.revenue > 0);

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1 text-center sm:text-left">
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>
                        Showing revenue and sales over time
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {hasData && showExportButton && exportButton}
                    <Select value={timeRange} onValueChange={onTimeRangeChange}>
                        <SelectTrigger
                            className="w-[160px] rounded-lg"
                            aria-label="Select time range"
                        >
                            <SelectValue placeholder="Last 7 days" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="7d" className="rounded-lg">
                                Last 7 days
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="90d" className="rounded-lg">
                                Last 3 months
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                {hasData ? (
                    <ChartContainer
                        config={chartConfig}
                        className="aspect-auto h-[250px] w-full"
                    >
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-revenue)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-revenue)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="var(--color-sales)"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--color-sales)"
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => formatCurrency(value)}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => {
                                            return new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            });
                                        }}
                                        indicator="dot"
                                    />
                                }
                            />
                            <Area
                                dataKey="revenue"
                                type="natural"
                                fill="url(#fillRevenue)"
                                stroke="var(--color-revenue)"
                                stackId="a"
                            />
                        </AreaChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-sm text-muted-foreground">
                            No sales data available for the selected time period.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
