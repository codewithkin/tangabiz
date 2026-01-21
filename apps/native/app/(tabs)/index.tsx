import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Spinner, Button, useThemeColor } from 'heroui-native';
import { useQuery } from '@tanstack/react-query';

import { Container } from '@/components/container';
import { useAuthStore } from '@/store/auth';
import { transactionsApi, productsApi, customersApi } from '@/lib/api';

interface DashboardStats {
    todaySales: number;
    todayTransactions: number;
    totalProducts: number;
    totalCustomers: number;
    lowStockCount: number;
}

export default function Dashboard() {
    const { currentBusiness, user } = useAuthStore();
    const linkColor = useThemeColor('link');
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    // Fetch dashboard stats
    const { data: summaryData, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
        queryKey: ['dashboard-summary', currentBusiness?.id],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const today = new Date().toISOString().split('T')[0];
            const res = await transactionsApi.getSummary(currentBusiness.id, today, today);
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const { data: lowStockData, refetch: refetchLowStock } = useQuery({
        queryKey: ['low-stock', currentBusiness?.id],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await productsApi.getLowStock(currentBusiness.id);
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchSummary(), refetchLowStock()]);
        setRefreshing(false);
    };

    const stats = {
        todaySales: summaryData?.sales?.total || 0,
        todayTransactions: summaryData?.sales?.count || 0,
        netRevenue: summaryData?.netRevenue || 0,
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentBusiness?.currency || 'USD',
        }).format(amount);
    };

    const QuickAction = ({ icon, label, onPress, color = linkColor }: {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        label: string;
        onPress: () => void;
        color?: string;
    }) => (
        <Pressable
            onPress={onPress}
            className="items-center w-20"
        >
            <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: color + '20' }}
            >
                <MaterialCommunityIcons name={icon} size={28} color={color} />
            </View>
            <Text className="text-foreground text-xs text-center font-medium">{label}</Text>
        </Pressable>
    );

    return (
        <Container>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Welcome Header */}
                <View className="mb-6">
                    <Text className="text-2xl font-bold text-foreground">
                        Hello, {user?.name?.split(' ')[0] || 'there'}! 👋
                    </Text>
                    <Text className="text-muted mt-1">
                        {currentBusiness?.name || 'Select a business'}
                    </Text>
                </View>

                {/* Stats Cards */}
                <View className="flex-row flex-wrap -mx-2 mb-6">
                    <View className="w-1/2 px-2 mb-4">
                        <Surface variant="secondary" className="p-4 rounded-xl">
                            <View className="flex-row items-center justify-between">
                                <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center">
                                    <MaterialCommunityIcons name="cash" size={24} color="#22c55e" />
                                </View>
                                {summaryLoading && <Spinner size="sm" />}
                            </View>
                            <Text className="text-2xl font-bold text-foreground mt-3">
                                {formatCurrency(stats.todaySales)}
                            </Text>
                            <Text className="text-muted text-sm">Today's Sales</Text>
                        </Surface>
                    </View>

                    <View className="w-1/2 px-2 mb-4">
                        <Surface variant="secondary" className="p-4 rounded-xl">
                            <View className="flex-row items-center justify-between">
                                <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center">
                                    <MaterialCommunityIcons name="receipt" size={24} color="#3b82f6" />
                                </View>
                            </View>
                            <Text className="text-2xl font-bold text-foreground mt-3">
                                {stats.todayTransactions}
                            </Text>
                            <Text className="text-muted text-sm">Transactions</Text>
                        </Surface>
                    </View>

                    <View className="w-1/2 px-2 mb-4">
                        <Surface variant="secondary" className="p-4 rounded-xl">
                            <View className="flex-row items-center justify-between">
                                <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center">
                                    <MaterialCommunityIcons name="trending-up" size={24} color="#8b5cf6" />
                                </View>
                            </View>
                            <Text className="text-2xl font-bold text-foreground mt-3">
                                {formatCurrency(stats.netRevenue)}
                            </Text>
                            <Text className="text-muted text-sm">Net Revenue</Text>
                        </Surface>
                    </View>

                    <View className="w-1/2 px-2 mb-4">
                        <Pressable onPress={() => router.push('/products?filter=lowStock')}>
                            <Surface variant="secondary" className="p-4 rounded-xl">
                                <View className="flex-row items-center justify-between">
                                    <View className="w-10 h-10 bg-orange-100 rounded-lg items-center justify-center">
                                        <MaterialCommunityIcons name="alert-circle" size={24} color="#f97316" />
                                    </View>
                                </View>
                                <Text className="text-2xl font-bold text-foreground mt-3">
                                    {lowStockData?.products?.length || 0}
                                </Text>
                                <Text className="text-muted text-sm">Low Stock</Text>
                            </Surface>
                        </Pressable>
                    </View>
                </View>

                {/* Quick Actions */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-foreground mb-4">Quick Actions</Text>
                    <Surface variant="secondary" className="p-4 rounded-xl">
                        <View className="flex-row justify-around">
                            <QuickAction
                                icon="cart-plus"
                                label="New Sale"
                                onPress={() => router.push('/(tabs)/pos')}
                                color="#22c55e"
                            />
                            <QuickAction
                                icon="plus-box"
                                label="Add Product"
                                onPress={() => router.push('/products/create')}
                                color="#3b82f6"
                            />
                            <QuickAction
                                icon="account-plus"
                                label="Add Customer"
                                onPress={() => router.push('/customers/create')}
                                color="#8b5cf6"
                            />
                            <QuickAction
                                icon="robot"
                                label="Ask AI"
                                onPress={() => router.push('/ai')}
                                color="#eab308"
                            />
                        </View>
                    </Surface>
                </View>

                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-semibold text-foreground">Recent Sales</Text>
                        <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                            <Text className="text-link font-medium">View All</Text>
                        </Pressable>
                    </View>
                    <Surface variant="secondary" className="p-4 rounded-xl">
                        <View className="items-center py-8">
                            <MaterialCommunityIcons name="receipt-text" size={48} color="#9ca3af" />
                            <Text className="text-muted mt-2">No recent sales</Text>
                            <Button
                                variant="secondary"
                                className="mt-4"
                                onPress={() => router.push('/(tabs)/pos')}
                            >
                                <Button.Label>Create First Sale</Button.Label>
                            </Button>
                        </View>
                    </Surface>
                </View>
            </ScrollView>
        </Container>
    );
}
