import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, FlatList } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Spinner, Button, Chip, useThemeColor } from 'heroui-native';
import { useQuery } from '@tanstack/react-query';

import { Container } from '@/components/container';
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

export default function Transactions() {
    const { currentBusiness } = useAuthStore();
    const linkColor = useThemeColor('link');
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'SALE' | 'REFUND'>('all');

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['transactions', currentBusiness?.id, filter],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await transactionsApi.list(currentBusiness.id, {
                type: filter === 'all' ? undefined : filter,
                limit: 50,
            });
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const transactions: Transaction[] = data?.transactions || [];

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentBusiness?.currency || 'USD',
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

    const getStatusColor = (status: Transaction['status']): 'success' | 'warning' | 'danger' | 'default' => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'danger';
            case 'REFUNDED': return 'default';
            default: return 'default';
        }
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

    const renderTransaction = ({ item }: { item: Transaction }) => (
        <Pressable onPress={() => router.push(`/transactions/${item.id}`)}>
            <Surface variant="secondary" className="p-4 rounded-xl mb-3">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View
                            className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${item.type === 'SALE' ? 'bg-green-100' :
                                item.type === 'REFUND' ? 'bg-red-100' : 'bg-gray-100'
                                }`}
                        >
                            <MaterialCommunityIcons
                                name={getTypeIcon(item.type) as any}
                                size={24}
                                color={item.type === 'SALE' ? '#22c55e' : item.type === 'REFUND' ? '#ef4444' : '#6b7280'}
                            />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center">
                                <Text className="text-foreground font-semibold">
                                    {item.reference}
                                </Text>
                                <Chip
                                    color={getStatusColor(item.status)}
                                    size="sm"
                                    className="ml-2"
                                >
                                    <Chip.Label>{item.status}</Chip.Label>
                                </Chip>
                            </View>
                            <Text className="text-muted text-sm mt-1">
                                {item.customer?.name || 'Walk-in Customer'} • {item._count?.items || 0} items
                            </Text>
                            <Text className="text-muted text-xs mt-1">
                                {formatDate(item.createdAt)}
                            </Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className={`text-lg font-bold ${item.type === 'REFUND' ? 'text-red-500' : 'text-success'
                            }`}>
                            {item.type === 'REFUND' ? '-' : ''}{formatCurrency(item.total)}
                        </Text>
                        <Text className="text-muted text-xs">{item.paymentMethod}</Text>
                    </View>
                </View>
            </Surface>
        </Pressable>
    );

    return (
        <Container>
            <Stack.Screen options={{ title: 'Sales History' }} />

            <View className="flex-1">
                {/* Filter Tabs */}
                <View className="flex-row p-4 space-x-2">
                    {(['all', 'SALE', 'REFUND'] as const).map(f => (
                        <Pressable
                            key={f}
                            onPress={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full ${filter === f ? 'bg-success' : 'bg-gray-100'
                                }`}
                        >
                            <Text className={filter === f ? 'text-white font-medium' : 'text-muted'}>
                                {f === 'all' ? 'All' : f === 'SALE' ? 'Sales' : 'Refunds'}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Transactions List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Spinner size="lg" />
                    </View>
                ) : transactions.length === 0 ? (
                    <View className="flex-1 items-center justify-center p-8">
                        <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#9ca3af" />
                        <Text className="text-lg font-semibold text-foreground mt-4">No Transactions</Text>
                        <Text className="text-muted text-center mt-2">
                            Your sales will appear here
                        </Text>
                        <Button
                            variant="primary"
                            className="mt-6"
                            onPress={() => router.push('/(tabs)/pos')}
                        >
                            <Button.Label>Create Sale</Button.Label>
                        </Button>
                    </View>
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderTransaction}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                )}
            </View>
        </Container>
    );
}
