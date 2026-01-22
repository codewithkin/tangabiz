import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/store/auth';
import { transactionsApi } from '@/lib/api';

interface Transaction {
    id: string;
    invoiceId: string;
    reference: string;
    type: 'SALE' | 'REFUND' | 'EXPENSE' | 'INCOME';
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    paymentMethod: string;
    subtotal: number;
    discount: number;
    total: number;
    createdAt: string;
    customer?: {
        id: string;
        name: string;
        email?: string;
    };
    createdBy?: {
        id: string;
        name: string;
    };
    _count?: {
        items: number;
    };
}

type FilterType = 'all' | 'SALE' | 'REFUND';
type PeriodType = 'today' | 'week' | 'month' | 'all';

export default function Transactions() {
    const { currentBusiness } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [period, setPeriod] = useState<PeriodType>('today');

    const getDateRange = (period: PeriodType) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'today':
                return { startDate: today.toISOString() };
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return { startDate: weekAgo.toISOString() };
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return { startDate: monthAgo.toISOString() };
            default:
                return {};
        }
    };

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['transactions', currentBusiness?.id, filter, period],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const dateRange = getDateRange(period);
            const res = await transactionsApi.list(currentBusiness.id, {
                type: filter === 'all' ? undefined : filter,
                limit: 50,
                ...dateRange,
            });
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const transactions: Transaction[] = data?.transactions || [];

    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await refetch();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentBusiness?.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }).format(date);
    };

    const getStatusBadge = (status: Transaction['status']) => {
        const styles = {
            COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
            CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
            REFUNDED: { bg: 'bg-gray-100', text: 'text-gray-700' },
        };
        const style = styles[status] || styles.PENDING;

        return (
            <View className={`${style.bg} px-2 py-0.5 rounded-md`}>
                <Text className={`${style.text} text-xs font-semibold`}>{status}</Text>
            </View>
        );
    };

    const getTypeIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'SALE': return 'cart-check';
            case 'REFUND': return 'cart-minus';
            case 'EXPENSE': return 'cart-arrow-down';
            case 'INCOME': return 'cart-arrow-up';
            default: return 'cart';
        }
    };

    const FilterChip = ({ label, value, isActive, onPress }: { label: string; value: string; isActive: boolean; onPress: () => void }) => (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            className={`px-4 py-2 rounded-xl mr-2 ${isActive ? 'bg-green-500' : 'bg-white border border-gray-200'}`}
        >
            <Text className={isActive ? 'text-white font-semibold' : 'text-gray-600 font-medium'}>
                {label}
            </Text>
        </Pressable>
    );

    const renderTransaction = ({ item }: { item: Transaction }) => (
        <Pressable
            onPress={() => router.push(`/transactions/${item.id}`)}
            className="mx-4 mb-3"
        >
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <View className="flex-row items-start">
                    {/* Icon */}
                    <View
                        className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${item.type === 'SALE' ? 'bg-green-100' :
                                item.type === 'REFUND' ? 'bg-red-100' : 'bg-gray-100'
                            }`}
                    >
                        <MaterialCommunityIcons
                            name={getTypeIcon(item.type) as any}
                            size={22}
                            color={item.type === 'SALE' ? '#22c55e' : item.type === 'REFUND' ? '#ef4444' : '#6b7280'}
                        />
                    </View>

                    {/* Details */}
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-gray-900 font-semibold">
                                {item.reference}
                            </Text>
                            {getStatusBadge(item.status)}
                        </View>
                        <Text className="text-gray-500 text-sm">
                            {item.customer?.name || 'Walk-in Customer'} • {item._count?.items || 0} items
                        </Text>
                        <View className="flex-row items-center mt-1.5">
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs ml-1">
                                {formatDate(item.createdAt)}
                            </Text>
                            <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                            <Text className="text-gray-400 text-xs">{item.paymentMethod}</Text>
                        </View>
                    </View>

                    {/* Amount */}
                    <View className="items-end">
                        <Text className={`text-lg font-bold ${item.type === 'REFUND' ? 'text-red-500' : 'text-green-600'
                            }`}>
                            {item.type === 'REFUND' ? '-' : '+'}{formatCurrency(item.total)}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
                <Text className="text-2xl font-bold text-gray-900 mb-4">Transactions</Text>

                {/* Period Filter */}
                <View className="mb-3">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterChip label="Today" value="today" isActive={period === 'today'} onPress={() => setPeriod('today')} />
                        <FilterChip label="This Week" value="week" isActive={period === 'week'} onPress={() => setPeriod('week')} />
                        <FilterChip label="This Month" value="month" isActive={period === 'month'} onPress={() => setPeriod('month')} />
                        <FilterChip label="All Time" value="all" isActive={period === 'all'} onPress={() => setPeriod('all')} />
                    </ScrollView>
                </View>

                {/* Type Filter */}
                <View className="flex-row">
                    {(['all', 'SALE', 'REFUND'] as const).map(f => (
                        <Pressable
                            key={f}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setFilter(f);
                            }}
                            className={`flex-1 py-2.5 rounded-xl mr-2 last:mr-0 ${filter === f ? 'bg-gray-900' : 'bg-gray-100'
                                }`}
                        >
                            <Text className={`text-center font-medium ${filter === f ? 'text-white' : 'text-gray-600'
                                }`}>
                                {f === 'all' ? 'All' : f === 'SALE' ? 'Sales' : 'Refunds'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Transactions List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-2">Loading transactions...</Text>
                </View>
            ) : transactions.length === 0 ? (
                <View className="flex-1 items-center justify-center p-8">
                    <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                        <MaterialCommunityIcons name="receipt-text-outline" size={40} color="#9ca3af" />
                    </View>
                    <Text className="text-xl font-semibold text-gray-900">No Transactions</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Your sales and transactions will appear here
                    </Text>
                    <Pressable
                        onPress={() => router.push('/(tabs)/pos')}
                        className="mt-6 bg-green-500 rounded-xl px-6 py-3 flex-row items-center active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Create Sale</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
