// Reports Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type DateRange = 'today' | 'week' | 'month' | 'year';

interface ReportData {
    totalSales: number;
    totalRefunds: number;
    netRevenue: number;
    transactionCount: number;
    averageOrderValue: number;
    topProducts: {
        id: string;
        name: string;
        quantity: number;
        revenue: number;
    }[];
    salesByPaymentMethod: {
        method: string;
        amount: number;
        count: number;
    }[];
    dailySales: {
        date: string;
        amount: number;
    }[];
}

const { width } = Dimensions.get('window');

export default function ReportsScreen() {
    const { currentBusiness } = useAuthStore();
    const [dateRange, setDateRange] = useState<DateRange>('week');
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchReports = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/reports', {
                businessId: currentBusiness.id,
                dateRange,
            });
            setReportData(res.data?.data || null);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            // Set mock data for demo
            setReportData({
                totalSales: 125000,
                totalRefunds: 5000,
                netRevenue: 120000,
                transactionCount: 45,
                averageOrderValue: 2778,
                topProducts: [
                    { id: '1', name: 'Product A', quantity: 25, revenue: 50000 },
                    { id: '2', name: 'Product B', quantity: 18, revenue: 36000 },
                    { id: '3', name: 'Product C', quantity: 12, revenue: 24000 },
                ],
                salesByPaymentMethod: [
                    { method: 'CASH', amount: 60000, count: 20 },
                    { method: 'MOBILE_MONEY', amount: 40000, count: 15 },
                    { method: 'CARD', amount: 20000, count: 10 },
                ],
                dailySales: [
                    { date: 'Mon', amount: 15000 },
                    { date: 'Tue', amount: 20000 },
                    { date: 'Wed', amount: 18000 },
                    { date: 'Thu', amount: 25000 },
                    { date: 'Fri', amount: 22000 },
                    { date: 'Sat', amount: 30000 },
                    { date: 'Sun', amount: 12000 },
                ],
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness, dateRange]);

    useEffect(() => {
        setIsLoading(true);
        fetchReports();
    }, [dateRange]);

    useEffect(() => {
        fetchReports();
    }, [currentBusiness]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchReports();
    }, [fetchReports]);

    const maxDailySale = Math.max(...(reportData?.dailySales.map(d => d.amount) || [1]));

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'CASH': return 'cash';
            case 'CARD': return 'credit-card';
            case 'MOBILE_MONEY': return 'cellphone';
            case 'BANK_TRANSFER': return 'bank';
            default: return 'cash';
        }
    };

    const getPaymentMethodColor = (method: string) => {
        switch (method) {
            case 'CASH': return '#22c55e';
            case 'CARD': return '#3b82f6';
            case 'MOBILE_MONEY': return '#eab308';
            case 'BANK_TRANSFER': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Reports' }} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#22c55e']}
                        tintColor="#22c55e"
                    />
                }
            >
                {/* Date Range Selector */}
                <View className="flex-row bg-white mx-4 mt-4 p-1 rounded-xl">
                    {(['today', 'week', 'month', 'year'] as DateRange[]).map((range) => (
                        <Pressable
                            key={range}
                            onPress={() => setDateRange(range)}
                            className={`flex-1 py-2 rounded-lg ${dateRange === range ? 'bg-green-500' : ''
                                }`}
                        >
                            <Text
                                className={`text-center font-medium capitalize ${dateRange === range ? 'text-white' : 'text-gray-600'
                                    }`}
                            >
                                {range}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Summary Cards */}
                <View className="flex-row flex-wrap px-2 mt-4">
                    <View className="w-1/2 p-2">
                        <View className="bg-white rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-sm">Total Sales</Text>
                                <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                                    <MaterialCommunityIcons name="trending-up" size={16} color="#22c55e" />
                                </View>
                            </View>
                            <Text className="text-gray-900 text-xl font-bold mt-2">
                                {formatCurrency(reportData?.totalSales || 0)}
                            </Text>
                        </View>
                    </View>

                    <View className="w-1/2 p-2">
                        <View className="bg-white rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-sm">Refunds</Text>
                                <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
                                    <MaterialCommunityIcons name="trending-down" size={16} color="#ef4444" />
                                </View>
                            </View>
                            <Text className="text-red-600 text-xl font-bold mt-2">
                                {formatCurrency(reportData?.totalRefunds || 0)}
                            </Text>
                        </View>
                    </View>

                    <View className="w-1/2 p-2">
                        <View className="bg-white rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-sm">Net Revenue</Text>
                                <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                                    <MaterialCommunityIcons name="cash" size={16} color="#3b82f6" />
                                </View>
                            </View>
                            <Text className="text-blue-600 text-xl font-bold mt-2">
                                {formatCurrency(reportData?.netRevenue || 0)}
                            </Text>
                        </View>
                    </View>

                    <View className="w-1/2 p-2">
                        <View className="bg-white rounded-xl p-4">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-sm">Avg. Order</Text>
                                <View className="w-8 h-8 bg-yellow-100 rounded-full items-center justify-center">
                                    <MaterialCommunityIcons name="chart-line" size={16} color="#eab308" />
                                </View>
                            </View>
                            <Text className="text-yellow-600 text-xl font-bold mt-2">
                                {formatCurrency(reportData?.averageOrderValue || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Transactions Count */}
                <View className="bg-white mx-4 mt-2 rounded-xl p-4 flex-row items-center">
                    <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center">
                        <MaterialCommunityIcons name="receipt" size={24} color="#8b5cf6" />
                    </View>
                    <View className="flex-1 ml-4">
                        <Text className="text-gray-500 text-sm">Total Transactions</Text>
                        <Text className="text-gray-900 text-2xl font-bold">
                            {reportData?.transactionCount || 0}
                        </Text>
                    </View>
                </View>

                {/* Sales Chart */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-900 font-semibold mb-4">Sales Trend</Text>
                    <View className="flex-row items-end justify-between h-32">
                        {reportData?.dailySales.map((day, index) => (
                            <View key={index} className="items-center flex-1">
                                <View
                                    className="bg-green-500 rounded-t-sm w-6"
                                    style={{
                                        height: Math.max((day.amount / maxDailySale) * 100, 4),
                                    }}
                                />
                                <Text className="text-gray-500 text-xs mt-2">{day.date}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Payment Methods */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-900 font-semibold mb-4">Payment Methods</Text>
                    {reportData?.salesByPaymentMethod.map((method, index) => (
                        <View key={index} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                style={{ backgroundColor: getPaymentMethodColor(method.method) + '20' }}
                            >
                                <MaterialCommunityIcons
                                    name={getPaymentMethodIcon(method.method)}
                                    size={20}
                                    color={getPaymentMethodColor(method.method)}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-medium">
                                    {method.method.replace('_', ' ')}
                                </Text>
                                <Text className="text-gray-500 text-sm">
                                    {method.count} transactions
                                </Text>
                            </View>
                            <Text className="text-gray-900 font-bold">
                                {formatCurrency(method.amount)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Top Products */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-900 font-semibold mb-4">Top Products</Text>
                    {reportData?.topProducts.map((product, index) => (
                        <View key={product.id} className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0">
                            <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                                <Text className="text-gray-600 font-bold">{index + 1}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-medium">{product.name}</Text>
                                <Text className="text-gray-500 text-sm">
                                    {product.quantity} units sold
                                </Text>
                            </View>
                            <Text className="text-green-600 font-bold">
                                {formatCurrency(product.revenue)}
                            </Text>
                        </View>
                    ))}
                    {(!reportData?.topProducts || reportData.topProducts.length === 0) && (
                        <Text className="text-gray-400 text-center py-4">
                            No product data available
                        </Text>
                    )}
                </View>

                {/* Export Button */}
                <Pressable className="bg-white mx-4 mt-4 rounded-xl p-4 flex-row items-center justify-center">
                    <MaterialCommunityIcons name="download" size={20} color="#22c55e" />
                    <Text className="text-green-600 font-semibold ml-2">Export Report</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
