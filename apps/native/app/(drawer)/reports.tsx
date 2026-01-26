import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/lib/api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Time period options
const TIME_PERIODS = [
    { id: "today", label: "Today", days: 0 },
    { id: "week", label: "This Week", days: 7 },
    { id: "month", label: "This Month", days: 30 },
    { id: "all", label: "All Time", days: null },
];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function Reports() {
    const router = useRouter();
    const { currentBusiness, token } = useAuthStore();
    const businessId = currentBusiness?.id;
    const [selectedPeriod, setSelectedPeriod] = useState("month");

    // Calculate date range based on selected period
    const getDateRange = () => {
        const period = TIME_PERIODS.find((p) => p.id === selectedPeriod);
        if (!period) return {};

        if (period.days === null) {
            return {};
        }

        if (period.id === "today") {
            const today = new Date();
            return {
                startDate: format(today, "yyyy-MM-dd"),
                endDate: format(today, "yyyy-MM-dd"),
            };
        }

        if (period.id === "month") {
            const start = startOfMonth(new Date());
            const end = endOfMonth(new Date());
            return {
                startDate: format(start, "yyyy-MM-dd"),
                endDate: format(end, "yyyy-MM-dd"),
            };
        }

        const endDate = new Date();
        const startDate = subDays(endDate, period.days);
        return {
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
        };
    };

    const dateRange = getDateRange();

    // Fetch sales report
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ["salesReport", businessId, selectedPeriod, dateRange],
        queryFn: async () => {
            if (!businessId) return { transactions: [], pagination: { total: 0 } };
            const response = await transactionsApi.list(businessId, {
                type: 'SALE',
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });
            return response.data || { transactions: [], pagination: { total: 0 } };
        },
        enabled: !!businessId,
    });

    // Fetch expenses report
    const { data: expensesData, isLoading: expensesLoading } = useQuery({
        queryKey: ["expensesReport", businessId, selectedPeriod, dateRange],
        queryFn: async () => {
            if (!businessId) return { transactions: [], pagination: { total: 0 } };
            const response = await transactionsApi.list(businessId, {
                type: 'EXPENSE',
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
            });
            return response.data || { transactions: [], pagination: { total: 0 } };
        },
        enabled: !!businessId,
    });

    // Calculate metrics
    const totalSales = salesData?.transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0;
    const totalExpenses = expensesData?.transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0;
    const netProfit = totalSales - totalExpenses;
    const salesCount = salesData?.pagination?.total || 0;
    const expensesCount = expensesData?.pagination?.total || 0;

    const isLoading = salesLoading || expensesLoading;

    return (
        <ScrollView className="flex-1 bg-default-50">
            <View className="px-4 py-6 flex flex-col gap-6">
                {/* Period Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle>Time Period</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <View className="flex flex-row flex-wrap gap-2">
                            {TIME_PERIODS.map((period) => (
                                <Pressable
                                    key={period.id}
                                    onPress={() => setSelectedPeriod(period.id)}
                                    className={`px-4 py-2 rounded-lg border ${selectedPeriod === period.id
                                        ? "bg-green-500 border-green-500"
                                        : "bg-white border-gray-300"
                                        }`}
                                >
                                    <Text className={selectedPeriod === period.id ? "text-white font-medium" : "text-gray-700"}>
                                        {period.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </CardContent>
                </Card>

                {isLoading ? (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" color="#22c55e" />
                        <Text className="text-gray-500 mt-4">Loading reports...</Text>
                    </View>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <View className="flex flex-col gap-4">
                            {/* Total Sales */}
                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="py-6">
                                    <View className="flex flex-row items-center justify-between">
                                        <View className="flex flex-col gap-1">
                                            <Text className="text-gray-600 text-sm">Total Sales</Text>
                                            <Text className="text-3xl font-bold text-green-600">
                                                {formatCurrency(totalSales)}
                                            </Text>
                                            <Text className="text-gray-500 text-xs">{salesCount} transactions</Text>
                                        </View>
                                        <View className="bg-green-500 p-4 rounded-full">
                                            <FontAwesome6 name="arrow-trend-up" size={24} color="white" />
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>

                            {/* Total Expenses */}
                            <Card className="bg-red-50 border-red-200">
                                <CardContent className="py-6">
                                    <View className="flex flex-row items-center justify-between">
                                        <View className="flex flex-col gap-1">
                                            <Text className="text-gray-600 text-sm">Total Expenses</Text>
                                            <Text className="text-3xl font-bold text-red-600">
                                                {formatCurrency(totalExpenses)}
                                            </Text>
                                            <Text className="text-gray-500 text-xs">{expensesCount} expenses</Text>
                                        </View>
                                        <View className="bg-red-500 p-4 rounded-full">
                                            <FontAwesome6 name="arrow-trend-down" size={24} color="white" />
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>

                            {/* Net Profit */}
                            <Card className={`${netProfit >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
                                <CardContent className="py-6">
                                    <View className="flex flex-row items-center justify-between">
                                        <View className="flex flex-col gap-1">
                                            <Text className="text-gray-600 text-sm">Net Profit</Text>
                                            <Text className={`text-3xl font-bold ${netProfit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                                                {formatCurrency(netProfit)}
                                            </Text>
                                            <Text className="text-gray-500 text-xs">
                                                {netProfit >= 0 ? "Profitable" : "Loss"} period
                                            </Text>
                                        </View>
                                        <View className={`${netProfit >= 0 ? "bg-blue-500" : "bg-orange-500"} p-4 rounded-full`}>
                                            <MaterialCommunityIcons name="chart-line" size={24} color="white" />
                                        </View>
                                    </View>
                                </CardContent>
                            </Card>
                        </View>

                        {/* Recent Sales */}
                        {salesData?.transactions?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Sales</CardTitle>
                                    <CardDescription>Top 5 recent sales in this period</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    {salesData.transactions.slice(0, 5).map((sale: any) => (
                                        <View key={sale.id} className="flex flex-row justify-between items-center py-2 border-b border-gray-100">
                                            <View className="flex flex-col">
                                                <Text className="font-medium">{sale.customer?.name || "Walk-in Customer"}</Text>
                                                <Text className="text-xs text-gray-500">
                                                    {format(new Date(sale.createdAt), "MMM d, yyyy • h:mm a")}
                                                </Text>
                                            </View>
                                            <Text className="text-green-600 font-semibold">
                                                {formatCurrency(Number(sale.total))}
                                            </Text>
                                        </View>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Expenses */}
                        {expensesData?.transactions?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Expenses</CardTitle>
                                    <CardDescription>Top 5 recent expenses in this period</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    {expensesData.transactions.slice(0, 5).map((expense: any) => (
                                        <View key={expense.id} className="flex flex-row justify-between items-center py-2 border-b border-gray-100">
                                            <View className="flex flex-col">
                                                <Text className="font-medium">{expense.notes?.split(":")[0] || "Expense"}</Text>
                                                <Text className="text-xs text-gray-500">
                                                    {format(new Date(expense.createdAt), "MMM d, yyyy • h:mm a")}
                                                </Text>
                                            </View>
                                            <Text className="text-red-600 font-semibold">
                                                -{formatCurrency(Number(expense.total))}
                                            </Text>
                                        </View>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
}
