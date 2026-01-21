import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/store/auth';
import { transactionsApi, productsApi } from '@/lib/api';

export default function Dashboard() {
    const { currentBusiness, user } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const { width } = useWindowDimensions();

    // Responsive grid columns
    const isTablet = width >= 768;
    const statCardWidth = isTablet ? 'w-1/4' : 'w-1/2';

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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Promise.all([refetchSummary(), refetchLowStock()]);
        setRefreshing(false);
    };

    const stats = {
        todaySales: summaryData?.sales?.total || 0,
        todayTransactions: summaryData?.sales?.count || 0,
        netRevenue: summaryData?.netRevenue || 0,
        lowStock: lowStockData?.products?.length || 0,
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentBusiness?.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const StatCard = ({ icon, iconBg, iconColor, value, label, onPress }: {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        iconBg: string;
        iconColor: string;
        value: string | number;
        label: string;
        onPress?: () => void;
    }) => {
        const content = (
            <View className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <View className={`w-10 h-10 ${iconBg} rounded-xl items-center justify-center`}>
                        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
                    </View>
                    {summaryLoading && <ActivityIndicator size="small" color="#22c55e" />}
                </View>
                <Text className="text-2xl font-bold text-gray-900">{value}</Text>
                <Text className="text-gray-500 text-sm mt-1">{label}</Text>
            </View>
        );

        if (onPress) {
            return (
                <Pressable onPress={onPress} className={`${statCardWidth} px-2 mb-4`}>
                    {content}
                </Pressable>
            );
        }
        return <View className={`${statCardWidth} px-2 mb-4`}>{content}</View>;
    };

    const QuickAction = ({ icon, label, onPress, color }: {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        label: string;
        onPress: () => void;
        color: string;
    }) => (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            className="items-center flex-1 py-3"
        >
            <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                style={{ backgroundColor: color + '15' }}
            >
                <MaterialCommunityIcons name={icon} size={26} color={color} />
            </View>
            <Text className="text-gray-700 text-xs text-center font-medium">{label}</Text>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            {/* Green Header */}
            <View className="bg-green-500 px-6 pt-6 pb-16 rounded-b-3xl">
                <View className="flex-row items-center justify-between mb-2">
                    <View>
                        <Text className="text-green-100 text-base">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                        <Text className="text-white text-2xl font-bold mt-1">
                            Hello, {user?.name?.split(' ')[0] || 'there'}! 👋
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/(tabs)/more')}
                        className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
                    >
                        <MaterialCommunityIcons name="account" size={24} color="white" />
                    </Pressable>
                </View>
                <Text className="text-green-100 text-sm">
                    {currentBusiness?.name || 'Select a business'}
                </Text>
            </View>

            <ScrollView
                className="flex-1 -mt-10"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Stats Cards */}
                <View className="flex-row flex-wrap -mx-2 mb-4">
                    <StatCard
                        icon="cash"
                        iconBg="bg-green-100"
                        iconColor="#22c55e"
                        value={formatCurrency(stats.todaySales)}
                        label="Today's Sales"
                    />
                    <StatCard
                        icon="receipt"
                        iconBg="bg-blue-100"
                        iconColor="#3b82f6"
                        value={stats.todayTransactions}
                        label="Transactions"
                    />
                    <StatCard
                        icon="trending-up"
                        iconBg="bg-purple-100"
                        iconColor="#8b5cf6"
                        value={formatCurrency(stats.netRevenue)}
                        label="Net Revenue"
                    />
                    <StatCard
                        icon="alert-circle-outline"
                        iconBg="bg-orange-100"
                        iconColor="#f97316"
                        value={stats.lowStock}
                        label="Low Stock"
                        onPress={() => router.push('/products?filter=lowStock')}
                    />
                </View>

                {/* Quick Actions */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
                    <View className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <View className="flex-row">
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
                    </View>
                </View>

                {/* Recent Sales */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-lg font-semibold text-gray-900">Recent Sales</Text>
                        <Pressable
                            onPress={() => router.push('/(tabs)/transactions')}
                            className="flex-row items-center"
                        >
                            <Text className="text-green-600 font-medium">View All</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#22c55e" />
                        </Pressable>
                    </View>
                    <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 items-center">
                        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                            <MaterialCommunityIcons name="receipt-text-outline" size={32} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-500 text-center mb-4">No recent sales today</Text>
                        <Pressable
                            onPress={() => router.push('/(tabs)/pos')}
                            className="bg-green-500 px-6 py-3 rounded-xl flex-row items-center active:bg-green-600"
                        >
                            <MaterialCommunityIcons name="plus" size={20} color="white" />
                            <Text className="text-white font-semibold ml-2">Create First Sale</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Low Stock Alert */}
                {stats.lowStock > 0 && (
                    <Pressable
                        onPress={() => router.push('/products?filter=lowStock')}
                        className="mb-6"
                    >
                        <View className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex-row items-center">
                            <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center mr-3">
                                <MaterialCommunityIcons name="alert" size={22} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-orange-800 font-semibold">Low Stock Alert</Text>
                                <Text className="text-orange-600 text-sm">{stats.lowStock} products need restocking</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#f97316" />
                        </View>
                    </Pressable>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
