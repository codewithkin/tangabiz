// Home Dashboard Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useResponsive } from '@/lib/useResponsive';
import { usePermissions, getRoleBadgeStyle } from '@/lib/permissions';
import { PermissionGuard, ManagerAndAbove } from '@/components/PermissionGuard';
import { PeriodDropdown, PeriodType, CustomPeriod, getPeriodDates } from '@/components/PeriodSelector';

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
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('24h');
    const [customPeriod, setCustomPeriod] = useState<CustomPeriod>({ startDate: new Date(), endDate: new Date() });
    const { hasPermission, role } = usePermissions();
    const roleBadgeStyle = getRoleBadgeStyle(role);

    // Get period label for display
    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case '24h': return "Today's";
            case '1w': return 'This Week\'s';
            case '1m': return 'This Month\'s';
            case '1y': return 'This Year\'s';
            case 'custom': return 'Period';
            default: return "Today's";
        }
    };

    const fetchDashboardData = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            const { startDate, endDate } = getPeriodDates(selectedPeriod, customPeriod);

            // Fetch stats
            const [salesRes, productsRes, customersRes, transactionsRes] = await Promise.all([
                api.get('/api/reports/sales-summary', {
                    businessId: currentBusiness.id,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }),
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
    }, [currentBusiness, selectedPeriod, customPeriod]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchDashboardData();
    }, [fetchDashboardData]);

    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, touchTargets } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';

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
            style={{ minWidth: isTablet ? 100 : 70 }}
        >
            <View
                className={`${isLargeTablet ? 'w-20 h-20' : isTablet ? 'w-16 h-16' : 'w-14 h-14'} rounded-full items-center justify-center mb-2`}
                style={{ backgroundColor: `${color}20` }}
            >
                <MaterialCommunityIcons name={icon} size={iconSizes.medium} color={color} />
            </View>
            <Text className={`${typography.small} text-gray-700 text-center font-medium`}>{label}</Text>
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
        <View className={`bg-white rounded-xl ${isTablet ? 'p-6' : 'p-4'} flex-1 mr-3 shadow-sm`}>
            <View className="flex-row items-center justify-between mb-2">
                <MaterialCommunityIcons name={icon} size={iconSizes.small} color={color} />
            </View>
            <Text className={`${isLargeTablet ? 'text-3xl' : isTablet ? 'text-2xl' : 'text-2xl'} font-bold text-gray-900`}>{value}</Text>
            <Text className={`${typography.small} text-gray-500 mt-1`}>{title}</Text>
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
            contentContainerStyle={isLargeTablet ? { maxWidth: 1200, alignSelf: 'center', width: '100%' } : undefined}
        >
            {/* Header */}
            <View className={`bg-green-500 ${isTablet ? 'px-8 pt-6 pb-10' : 'px-5 pt-4 pb-8'} rounded-b-3xl`}>
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className={`text-green-100 ${typography.small}`}>Welcome back,</Text>
                        <Text className={`text-white ${isTablet ? 'text-2xl' : 'text-xl'} font-bold`}>
                            {user?.name || 'User'}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/(tabs)/more')}
                        className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} bg-white/20 rounded-full items-center justify-center`}
                    >
                        <MaterialCommunityIcons name="bell-outline" size={iconSizes.small} color="#fff" />
                    </Pressable>
                </View>

                {/* Business Card */}
                {currentBusiness && (
                    <View className={`bg-white/10 rounded-xl ${isTablet ? 'p-6' : 'p-4'}`}>
                        <Text className={`text-green-100 ${typography.small} uppercase tracking-wide`}>
                            Current Business
                        </Text>
                        <Text className={`text-white ${isTablet ? 'text-xl' : 'text-lg'} font-semibold mt-1`}>
                            {currentBusiness.name}
                        </Text>
                        <View className="flex-row items-center mt-2">
                            <View className={`${roleBadgeStyle.bg} ${isTablet ? 'px-3 py-2' : 'px-2 py-1'} rounded`}>
                                <Text className={`${roleBadgeStyle.text} ${typography.small} font-medium`}>
                                    {currentBusiness.role}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Stats Row - Only show sales figures to users with view_revenue permission */}
            <View className={`${isTablet ? 'px-8' : 'px-5'} -mt-4`}>
                {/* Period Selector */}
                <View className="flex-row justify-end mb-3">
                    <PeriodDropdown
                        selectedPeriod={selectedPeriod}
                        onSelect={setSelectedPeriod}
                        customPeriod={customPeriod}
                        onCustomPeriodChange={setCustomPeriod}
                    />
                </View>

                <View className="flex-row">
                    {hasPermission('view_revenue') ? (
                        <StatCard
                            title={`${getPeriodLabel()} Sales`}
                            value={formatCurrency(stats?.todaySales || 0)}
                            icon="cash"
                            color="#22c55e"
                        />
                    ) : (
                        <StatCard
                            title={`${getPeriodLabel()} Sales`}
                            value={stats?.todayTransactions || 0}
                            icon="cart-check"
                            color="#22c55e"
                        />
                    )}
                    <StatCard
                        title="Transactions"
                        value={stats?.todayTransactions || 0}
                        icon="receipt"
                        color="#3b82f6"
                    />
                </View>
            </View>

            {/* Quick Actions */}
            <View className={`bg-white ${isTablet ? 'mx-8' : 'mx-5'} mt-4 rounded-xl ${isTablet ? 'p-6' : 'p-4'} shadow-sm`}>
                <Text className={`text-gray-900 font-semibold ${isTablet ? 'mb-6 text-lg' : 'mb-4'}`}>Quick Actions</Text>
                <View className={`flex-row ${isLargeTablet ? 'justify-start gap-8' : 'justify-between'}`}>
                    <QuickAction
                        icon="cart-plus"
                        label="New Sale"
                        color="#22c55e"
                        onPress={() => router.push('/(tabs)/pos')}
                    />
                    {hasPermission('create_products') && (
                        <QuickAction
                            icon="plus-circle"
                            label="Add Product"
                            color="#3b82f6"
                            onPress={() => router.push('/products/create')}
                        />
                    )}
                    {hasPermission('create_customers') && (
                        <QuickAction
                            icon="account-plus"
                            label="Add Customer"
                            color="#eab308"
                            onPress={() => router.push('/customers/create')}
                        />
                    )}
                    {hasPermission('view_reports') && (
                        <QuickAction
                            icon="chart-bar"
                            label="Reports"
                            color="#8b5cf6"
                            onPress={() => router.push('/reports')}
                        />
                    )}
                    <QuickAction
                        icon="robot"
                        label="Tatenda AI"
                        color="#10b981"
                        onPress={() => router.push('/ai')}
                    />
                    {isTablet && hasPermission('edit_business_settings') && (
                        <QuickAction
                            icon="cog"
                            label="Settings"
                            color="#6b7280"
                            onPress={() => router.push('/settings')}
                        />
                    )}
                    {isTablet && hasPermission('create_categories') && (
                        <QuickAction
                            icon="folder"
                            label="Categories"
                            color="#14b8a6"
                            onPress={() => router.push('/categories')}
                        />
                    )}
                </View>
            </View>

            {/* Stats Overview */}
            <View className={`${isTablet ? 'px-8' : 'px-5'} mt-4`}>
                <Text className={`text-gray-900 font-semibold mb-3 ${isTablet ? 'text-lg' : ''}`}>Overview</Text>
                <View className={`${isLargeTablet ? 'flex-row flex-wrap' : 'flex-row'}`}>
                    <View className={`bg-white rounded-xl ${isTablet ? 'p-6' : 'p-4'} flex-1 mr-2 shadow-sm ${isLargeTablet ? 'min-w-[200px]' : ''}`}>
                        <View className="flex-row items-center">
                            <MaterialCommunityIcons name="package-variant" size={iconSizes.small} color="#3b82f6" />
                            <Text className={`text-gray-500 ${typography.body} ml-2`}>Products</Text>
                        </View>
                        <Text className={`${isLargeTablet ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900 mt-2`}>
                            {stats?.totalProducts || 0}
                        </Text>
                    </View>
                    <View className={`bg-white rounded-xl ${isTablet ? 'p-6' : 'p-4'} flex-1 ml-2 shadow-sm ${isLargeTablet ? 'min-w-[200px]' : ''}`}>
                        <View className="flex-row items-center">
                            <MaterialCommunityIcons name="account-group" size={iconSizes.small} color="#eab308" />
                            <Text className={`text-gray-500 ${typography.body} ml-2`}>Customers</Text>
                        </View>
                        <Text className={`${isLargeTablet ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900 mt-2`}>
                            {stats?.totalCustomers || 0}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Recent Transactions */}
            <View className={`${isTablet ? 'px-8' : 'px-5'} mt-4 mb-8`}>
                <View className="flex-row items-center justify-between mb-3">
                    <Text className={`text-gray-900 font-semibold ${isTablet ? 'text-lg' : ''}`}>Recent Transactions</Text>
                    <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                        <Text className={`text-green-500 font-medium ${typography.body}`}>View All</Text>
                    </Pressable>
                </View>

                {recentTransactions.length === 0 ? (
                    <View className={`bg-white rounded-xl ${isTablet ? 'p-12' : 'p-8'} items-center shadow-sm`}>
                        <MaterialCommunityIcons name="receipt" size={isTablet ? 64 : 48} color="#d1d5db" />
                        <Text className={`text-gray-400 mt-2 ${typography.body}`}>No transactions yet</Text>
                        <Pressable
                            onPress={() => router.push('/(tabs)/pos')}
                            className={`mt-4 bg-green-500 ${isTablet ? 'px-8 py-3' : 'px-6 py-2'} rounded-lg`}
                        >
                            <Text className={`text-white font-medium ${typography.body}`}>Create First Sale</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {recentTransactions.map((transaction, index) => (
                            <Pressable
                                key={transaction.id}
                                onPress={() => router.push(`/transactions/${transaction.id}`)}
                                className={`flex-row items-center ${isTablet ? 'p-5' : 'p-4'} ${index < recentTransactions.length - 1 ? 'border-b border-gray-100' : ''
                                    }`}
                            >
                                <View
                                    className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} rounded-full items-center justify-center mr-3 ${transaction.type === 'SALE' ? 'bg-green-100' : 'bg-red-100'
                                        }`}
                                >
                                    <MaterialCommunityIcons
                                        name={transaction.type === 'SALE' ? 'arrow-up' : 'arrow-down'}
                                        size={iconSizes.small}
                                        color={transaction.type === 'SALE' ? '#22c55e' : '#ef4444'}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={`text-gray-900 font-medium ${typography.body}`}>
                                        {transaction.reference}
                                    </Text>
                                    <Text className={`text-gray-500 ${typography.small}`}>
                                        {transaction.customer?.name || 'Walk-in'} • {formatRelativeTime(transaction.createdAt)}
                                    </Text>
                                </View>
                                <Text
                                    className={`font-semibold ${isTablet ? 'text-lg' : ''} ${transaction.type === 'SALE' ? 'text-green-600' : 'text-red-600'
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
