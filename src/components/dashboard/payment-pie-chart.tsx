"use client";

import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";

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

export interface PaymentMethodData {
    method: string;
    value: number;
    count: number;
}

interface PaymentPieChartProps {
    data: PaymentMethodData[];
    showExportButton?: boolean;
    exportButton?: React.ReactNode;
}

const COLORS = {
    cash: "hsl(142, 71%, 45%)", // green-500
    card: "hsl(48, 96%, 53%)", // yellow-400
    mobile: "hsl(217, 91%, 60%)", // blue-500
    other: "hsl(240, 3.8%, 46.1%)", // gray-500
};

const chartConfig = {
    cash: {
        label: "Cash",
        color: COLORS.cash,
    },
    card: {
        label: "Card",
        color: COLORS.card,
    },
    mobile: {
        label: "Mobile",
        color: COLORS.mobile,
    },
    other: {
        label: "Other",
        color: COLORS.other,
    },
} satisfies ChartConfig;

export function PaymentPieChart({ data, showExportButton, exportButton }: PaymentPieChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);
    const hasData = data.length > 0 && totalRevenue > 0;

    return (
        <Card className="border-0 shadow-lg">
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>
                            Revenue breakdown by payment type
                        </CardDescription>
                    </div>
                    {hasData && showExportButton && exportButton}
                </div>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                {hasData ? (
                    <>
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto h-[250px] w-full"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name) => (
                                                <div className="flex items-center gap-2">
                                                    <span className="capitalize">{String(name)}</span>
                                                    <span className="font-mono font-medium">
                                                        {formatCurrency(Number(value))}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Pie
                                    data={data as unknown as Record<string, unknown>[]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="method"
                                >
                                    {data.map((entry) => (
                                        <Cell
                                            key={`cell-${entry.method}`}
                                            fill={COLORS[entry.method as keyof typeof COLORS] || COLORS.other}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
                            {data.map((entry) => (
                                <div key={entry.method} className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                            backgroundColor:
                                                COLORS[entry.method as keyof typeof COLORS] || COLORS.other,
                                        }}
                                    />
                                    <span className="capitalize text-muted-foreground">
                                        {entry.method}
                                    </span>
                                    <span className="font-medium">
                                        {totalRevenue > 0
                                            ? ((entry.value / totalRevenue) * 100).toFixed(0)
                                            : 0}
                                        %
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-sm text-muted-foreground">
                            No payment data available.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
