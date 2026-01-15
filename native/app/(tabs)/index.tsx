// Home Dashboard Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';

interface DashboardStats {
    todaySales: number;
    todayTransactions: number;
    totalProducts: number;
    lowStockProducts: number;
    totalCustomers: number;
}

interface RecentTransaction {
    id: string;
    reference: string;
    total: number;
    type: string;
    status: string;
    createdAt: string;
    customer?: { name: string };
}

export default function HomeScreen() {
    const { user, currentBusiness } = useAuthStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            // Fetch stats
            const [salesRes, productsRes, customersRes, transactionsRes] = await Promise.all([
                api.get('/api/reports/sales-summary', { businessId: currentBusiness.id, period: 'daily' }),
                api.get('/api/products', { businessId: currentBusiness.id, limit: 1 }),
                api.get('/api/customers', { businessId: currentBusiness.id, limit: 1 }),
                api.get('/api/transactions', { businessId: currentBusiness.id, limit: 5 }),
            ]);

            setStats({
                todaySales: salesRes.data?.totalSales || 0,
                todayTransactions: salesRes.data?.totalTransactions || 0,
                totalProducts: productsRes.data?.pagination?.total || 0,
                lowStockProducts: 0, // Will be fetched separately
                totalCustomers: customersRes.data?.pagination?.total || 0,
            });

            setRecentTransactions(transactionsRes.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const QuickAction = ({
        icon,
        label,
        color,
        onPress,
    }: {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        label: string;
        color: string;
        onPress: () => void;
    }) => (
        <Pressable
            onPress={onPress}
            className="items-center flex-1"
        >
            <View
                className="w-14 h-14 rounded-full items-center justify-center mb-2"
                style={{ backgroundColor: `${color}20` }}
            >
                <MaterialCommunityIcons name={icon} size={26} color={color} />
            </View>
            <Text className="text-xs text-gray-700 text-center font-medium">{label}</Text>
        </Pressable>
    );

    const StatCard = ({
        title,
        value,
        icon,
        color,
    }: {
        title: string;
        value: string | number;
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        color: string;
    }) => (
        <View className="bg-white rounded-xl p-4 flex-1 mr-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <Text className="text-2xl font-bold text-gray-900">{value}</Text>
            <Text className="text-xs text-gray-500 mt-1">{title}</Text>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={['#22c55e']}
                    tintColor="#22c55e"
                />
            }
        >
            {/* Header */}
            <View className="bg-green-500 px-5 pt-4 pb-8 rounded-b-3xl">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-green-100 text-sm">Welcome back,</Text>
                        <Text className="text-white text-xl font-bold">
                            {user?.name || 'User'}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/(tabs)/more')}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                    >
                        <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
                    </Pressable>
                </View>

                {/* Business Card */}
                {currentBusiness && (
                    <View className="bg-white/10 rounded-xl p-4">
                        <Text className="text-green-100 text-xs uppercase tracking-wide">
                            Current Business
                        </Text>
                        <Text className="text-white text-lg font-semibold mt-1">
                            {currentBusiness.name}
                        </Text>
                        <View className="flex-row items-center mt-2">
                            <View className="bg-green-400 px-2 py-1 rounded">
                                <Text className="text-white text-xs font-medium">
                                    {currentBusiness.role}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Stats Row */}
            <View className="flex-row px-5 -mt-4">
                <StatCard
                    title="Today's Sales"
                    value={formatCurrency(stats?.todaySales || 0)}
                    icon="cash"
                    color="#22c55e"
                />
                <StatCard
                    title="Transactions"
                    value={stats?.todayTransactions || 0}
                    icon="receipt"
                    color="#3b82f6"
                />
            </View>

            {/* Quick Actions */}
            <View className="bg-white mx-5 mt-4 rounded-xl p-4 shadow-sm">
                <Text className="text-gray-900 font-semibold mb-4">Quick Actions</Text>
                <View className="flex-row justify-between">
                    <QuickAction
                        icon="cart-plus"
                        label="New Sale"
                        color="#22c55e"
                        onPress={() => router.push('/(tabs)/pos')}
                    />
                    <QuickAction
                        icon="plus-circle"
                        label="Add Product"
                        color="#3b82f6"
                        onPress={() => router.push('/products/create')}
                    />
                    <QuickAction
                        icon="account-plus"
                        label="Add Customer"
                        color="#eab308"
                        onPress={() => router.push('/customers/create')}
                    />
                    <QuickAction
                        icon="chart-bar"
                        label="Reports"
                        color="#8b5cf6"
                        onPress={() => router.push('/reports')}
                    />
                </View>
            </View>

            {/* Stats Overview */}
            <View className="px-5 mt-4">
                <Text className="text-gray-900 font-semibold mb-3">Overview</Text>
                <View className="flex-row">
                    <View className="bg-white rounded-xl p-4 flex-1 mr-2 shadow-sm">
                        <View className="flex-row items-center">
                            <MaterialCommunityIcons name="package-variant" size={20} color="#3b82f6" />
                            <Text className="text-gray-500 text-sm ml-2">Products</Text>
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mt-2">
                            {stats?.totalProducts || 0}
                        </Text>
                    </View>
                    <View className="bg-white rounded-xl p-4 flex-1 ml-2 shadow-sm">
                        <View className="flex-row items-center">
                            <MaterialCommunityIcons name="account-group" size={20} color="#eab308" />
                            <Text className="text-gray-500 text-sm ml-2">Customers</Text>
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 mt-2">
                            {stats?.totalCustomers || 0}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Recent Transactions */}
            <View className="px-5 mt-4 mb-8">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-900 font-semibold">Recent Transactions</Text>
                    <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                        <Text className="text-green-500 font-medium">View All</Text>
                    </Pressable>
                </View>

                {recentTransactions.length === 0 ? (
                    <View className="bg-white rounded-xl p-8 items-center shadow-sm">
                        <MaterialCommunityIcons name="receipt" size={48} color="#d1d5db" />
                        <Text className="text-gray-400 mt-2">No transactions yet</Text>
                        <Pressable
                            onPress={() => router.push('/(tabs)/pos')}
                            className="mt-4 bg-green-500 px-6 py-2 rounded-lg"
                        >
                            <Text className="text-white font-medium">Create First Sale</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {recentTransactions.map((transaction, index) => (
                            <Pressable
                                key={transaction.id}
                                onPress={() => router.push(`/transactions/${transaction.id}`)}
                                className={`flex-row items-center p-4 ${index < recentTransactions.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                            >
                                <View
                                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${transaction.type === 'SALE' ? 'bg-green-100' : 'bg-red-100'
                                        }`}
                                >
                                    <MaterialCommunityIcons
                                        name={transaction.type === 'SALE' ? 'arrow-up' : 'arrow-down'}
                                        size={20}
                                        color={transaction.type === 'SALE' ? '#22c55e' : '#ef4444'}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-medium">
                                        {transaction.reference}
                                    </Text>
                                    <Text className="text-gray-500 text-xs">
                                        {transaction.customer?.name || 'Walk-in'} • {formatRelativeTime(transaction.createdAt)}
                                    </Text>
                                </View>
                                <Text
                                    className={`font-semibold ${transaction.type === 'SALE' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {transaction.type === 'SALE' ? '+' : '-'}
                                    {formatCurrency(transaction.total)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
