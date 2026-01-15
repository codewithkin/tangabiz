// Transactions Screen - Sales history
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useResponsive } from '@/lib/useResponsive';

interface Transaction {
    id: string;
    reference: string;
    type: 'SALE' | 'REFUND' | 'EXPENSE' | 'INCOME';
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    paymentMethod: string;
    total: number;
    createdAt: string;
    customer?: { name: string };
    _count?: { items: number };
}

export default function TransactionsScreen() {
    const { currentBusiness } = useAuthStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState<'all' | 'SALE' | 'REFUND'>('all');

    // Responsive
    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, touchTargets } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';
    const numColumns = isLargeTablet ? 2 : 1;

    const fetchTransactions = useCallback(async (pageNum = 1, refresh = false) => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/transactions', {
                businessId: currentBusiness.id,
                page: pageNum,
                limit: 20,
                type: filter === 'all' ? undefined : filter,
            });

            const newTransactions = res.data?.data || [];

            if (refresh || pageNum === 1) {
                setTransactions(newTransactions);
            } else {
                setTransactions(prev => [...prev, ...newTransactions]);
            }

            setHasMore(newTransactions.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness, filter]);

    useEffect(() => {
        setIsLoading(true);
        fetchTransactions(1, true);
    }, [filter]);

    useEffect(() => {
        fetchTransactions(1, true);
    }, [currentBusiness]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchTransactions(1, true);
    }, [fetchTransactions]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchTransactions(page + 1);
        }
    }, [isLoading, hasMore, page, fetchTransactions]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            case 'REFUNDED': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SALE': return { name: 'arrow-up', color: '#22c55e', bg: 'bg-green-100' };
            case 'REFUND': return { name: 'arrow-down', color: '#ef4444', bg: 'bg-red-100' };
            case 'EXPENSE': return { name: 'minus', color: '#f59e0b', bg: 'bg-yellow-100' };
            case 'INCOME': return { name: 'plus', color: '#3b82f6', bg: 'bg-blue-100' };
            default: return { name: 'receipt', color: '#6b7280', bg: 'bg-gray-100' };
        }
    };

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const typeInfo = getTypeIcon(item.type);

        return (
            <Pressable
                onPress={() => router.push(`/transactions/${item.id}`)}
                className={`bg-white ${numColumns > 1 ? 'mx-2' : 'mx-4'} mb-3 rounded-xl ${isTablet ? 'p-5' : 'p-4'} shadow-sm`}
                style={numColumns > 1 ? { flex: 1 / numColumns, maxWidth: `${100 / numColumns - 2}%` } : undefined}
            >
                <View className="flex-row items-center">
                    <View className={`${isTablet ? 'w-14 h-14' : 'w-12 h-12'} rounded-full items-center justify-center mr-3 ${typeInfo.bg}`}>
                        <MaterialCommunityIcons
                            name={typeInfo.name as any}
                            size={iconSizes.small}
                            color={typeInfo.color}
                        />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className={`text-gray-900 font-semibold ${typography.body}`}>{item.reference}</Text>
                            <View className={`ml-2 ${isTablet ? 'px-3 py-1' : 'px-2 py-0.5'} rounded ${getStatusColor(item.status)}`}>
                                <Text className={`${typography.small} font-medium`}>{item.status}</Text>
                            </View>
                        </View>
                        <Text className={`text-gray-500 ${typography.small} mt-0.5`}>
                            {item.customer?.name || 'Walk-in'} • {item._count?.items || 0} items
                        </Text>
                        <Text className={`text-gray-400 ${typography.small} mt-1`}>
                            {formatRelativeTime(item.createdAt)}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text
                            className={`${isTablet ? 'text-xl' : 'text-lg'} font-bold ${item.type === 'SALE' || item.type === 'INCOME'
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}
                        >
                            {item.type === 'SALE' || item.type === 'INCOME' ? '+' : '-'}
                            {formatCurrency(item.total)}
                        </Text>
                        <Text className={`text-gray-400 ${typography.small} capitalize`}>
                            {item.paymentMethod.replace('_', ' ').toLowerCase()}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    };

    const FilterButton = ({ value, label }: { value: typeof filter; label: string }) => (
        <Pressable
            onPress={() => setFilter(value)}
            className={`${isTablet ? 'px-6 py-3' : 'px-4 py-2'} rounded-full mr-2 ${filter === value ? 'bg-green-500' : 'bg-white'
                }`}
        >
            <Text
                className={`font-medium ${typography.body} ${filter === value ? 'text-white' : 'text-gray-600'
                    }`}
            >
                {label}
            </Text>
        </Pressable>
    );

    const ListEmpty = () => (
        <View className="flex-1 items-center justify-center py-20">
            <MaterialCommunityIcons name="receipt" size={iconSizes.xlarge} color="#d1d5db" />
            <Text className={`text-gray-400 ${isTablet ? 'text-xl' : 'text-lg'} mt-4`}>No transactions found</Text>
            <Pressable
                onPress={() => router.push('/(tabs)/pos')}
                className={`mt-4 bg-green-500 ${isTablet ? 'px-8 py-4' : 'px-6 py-3'} rounded-xl`}
            >
                <Text className={`text-white font-semibold ${typography.body}`}>Create First Sale</Text>
            </Pressable>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'Transactions',
                }}
            />

            {/* Filters */}
            <View className={`${isTablet ? 'px-6 py-4' : 'px-4 py-3'} flex-row bg-gray-50`}>
                <FilterButton value="all" label="All" />
                <FilterButton value="SALE" label="Sales" />
                <FilterButton value="REFUND" label="Refunds" />
            </View>

            {/* Transactions List */}
            {isLoading && transactions.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    key={numColumns}
                    contentContainerStyle={{ paddingTop: 4, paddingBottom: 100, ...(isLargeTablet && { maxWidth: 1400, alignSelf: 'center', width: '100%' }) }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={['#22c55e']}
                            tintColor="#22c55e"
                        />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={ListEmpty}
                    ListFooterComponent={
                        isLoading && transactions.length > 0 ? (
                            <ActivityIndicator color="#22c55e" className="py-4" />
                        ) : null
                    }
                />
            )}
        </View>
    );
}
