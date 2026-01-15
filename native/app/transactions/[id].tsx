// Transaction Detail Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Share,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TransactionItem {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: {
        id: string;
        name: string;
        sku?: string;
    };
}

interface Transaction {
    id: string;
    type: 'SALE' | 'REFUND';
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
    customer?: {
        id: string;
        name: string;
        phone?: string;
        email?: string;
    };
    items: TransactionItem[];
}

export default function TransactionDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentBusiness } = useAuthStore();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchTransaction = useCallback(async () => {
        if (!id || !currentBusiness) return;

        try {
            const res = await api.get(`/api/transactions/${id}`, {
                businessId: currentBusiness.id,
            });
            setTransaction(res.data?.data || null);
        } catch (error) {
            console.error('Failed to fetch transaction:', error);
            Alert.alert('Error', 'Failed to load transaction details');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [id, currentBusiness]);

    useEffect(() => {
        fetchTransaction();
    }, [fetchTransaction]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchTransaction();
    }, [fetchTransaction]);

    const handleShare = async () => {
        if (!transaction) return;

        try {
            const itemsText = transaction.items
                .map(item => `${item.product.name} x${item.quantity} - ${formatCurrency(item.total)}`)
                .join('\n');

            const message = `
Transaction Receipt
-------------------
ID: ${transaction.id}
Date: ${formatDate(transaction.createdAt)}
Type: ${transaction.type}
Status: ${transaction.status}

Items:
${itemsText}

Subtotal: ${formatCurrency(transaction.subtotal)}
Tax: ${formatCurrency(transaction.tax)}
Discount: ${formatCurrency(transaction.discount)}
-------------------
Total: ${formatCurrency(transaction.total)}

Payment: ${transaction.paymentMethod.replace('_', ' ')}
${transaction.customer ? `Customer: ${transaction.customer.name}` : ''}
      `.trim();

            await Share.share({ message });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handleRefund = () => {
        Alert.alert(
            'Process Refund',
            'Are you sure you want to refund this transaction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Refund',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/api/transactions/${id}/refund`, {
                                businessId: currentBusiness?.id,
                            });
                            Alert.alert('Success', 'Refund processed successfully');
                            fetchTransaction();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to process refund');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return { bg: 'bg-green-100', text: 'text-green-700' };
            case 'PENDING': return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
            case 'CANCELLED': return { bg: 'bg-red-100', text: 'text-red-700' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'CASH': return 'cash';
            case 'CARD': return 'credit-card';
            case 'MOBILE_MONEY': return 'cellphone';
            case 'BANK_TRANSFER': return 'bank';
            default: return 'cash';
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    if (!transaction) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <MaterialCommunityIcons name="receipt" size={64} color="#d1d5db" />
                <Text className="text-gray-400 text-lg mt-4">Transaction not found</Text>
                <Pressable
                    onPress={() => router.back()}
                    className="mt-4 bg-green-500 px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const statusColor = getStatusColor(transaction.status);

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: `#${transaction.id.slice(-8).toUpperCase()}`,
                    headerRight: () => (
                        <Pressable onPress={handleShare} className="mr-4">
                            <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
                        </Pressable>
                    ),
                }}
            />

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
                {/* Header Card */}
                <View className="bg-white m-4 rounded-xl p-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className={`${statusColor.bg} px-3 py-1 rounded-full`}>
                            <Text className={`${statusColor.text} text-sm font-medium`}>
                                {transaction.status}
                            </Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${transaction.type === 'SALE' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <Text className={`text-sm font-medium ${transaction.type === 'SALE' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {transaction.type}
                            </Text>
                        </View>
                    </View>

                    <Text className={`text-4xl font-bold text-center ${transaction.type === 'SALE' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {transaction.type === 'REFUND' ? '-' : ''}{formatCurrency(transaction.total)}
                    </Text>

                    <Text className="text-gray-500 text-center mt-2">
                        {formatDate(transaction.createdAt)}
                    </Text>

                    {/* Payment Method */}
                    <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-gray-100">
                        <MaterialCommunityIcons
                            name={getPaymentIcon(transaction.paymentMethod)}
                            size={20}
                            color="#6b7280"
                        />
                        <Text className="text-gray-600 ml-2">
                            {transaction.paymentMethod.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                {/* Customer */}
                {transaction.customer && (
                    <Pressable
                        onPress={() => router.push(`/customers/${transaction.customer!.id}`)}
                        className="bg-white mx-4 mb-4 rounded-xl p-4 flex-row items-center"
                    >
                        <View className="w-12 h-12 bg-yellow-100 rounded-full items-center justify-center">
                            <Text className="text-yellow-700 text-lg font-bold">
                                {transaction.customer.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className="text-gray-900 font-semibold">
                                {transaction.customer.name}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                {transaction.customer.phone || transaction.customer.email || 'Customer'}
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                    </Pressable>
                )}

                {/* Items */}
                <View className="bg-white mx-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-3">
                        Items ({transaction.items.length})
                    </Text>

                    {transaction.items.map((item) => (
                        <Pressable
                            key={item.id}
                            onPress={() => router.push(`/products/${item.product.id}`)}
                            className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
                        >
                            <View className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                                <MaterialCommunityIcons name="package-variant" size={20} color="#6b7280" />
                            </View>
                            <View className="flex-1 ml-3">
                                <Text className="text-gray-900 font-medium">{item.product.name}</Text>
                                <Text className="text-gray-500 text-sm">
                                    {item.quantity} × {formatCurrency(item.unitPrice)}
                                </Text>
                            </View>
                            <Text className="text-gray-900 font-semibold">
                                {formatCurrency(item.total)}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Summary */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-3">Summary</Text>

                    <View className="flex-row items-center justify-between py-2">
                        <Text className="text-gray-600">Subtotal</Text>
                        <Text className="text-gray-900">{formatCurrency(transaction.subtotal)}</Text>
                    </View>

                    {transaction.tax > 0 && (
                        <View className="flex-row items-center justify-between py-2">
                            <Text className="text-gray-600">Tax</Text>
                            <Text className="text-gray-900">{formatCurrency(transaction.tax)}</Text>
                        </View>
                    )}

                    {transaction.discount > 0 && (
                        <View className="flex-row items-center justify-between py-2">
                            <Text className="text-gray-600">Discount</Text>
                            <Text className="text-red-600">-{formatCurrency(transaction.discount)}</Text>
                        </View>
                    )}

                    <View className="flex-row items-center justify-between py-3 mt-2 border-t border-gray-200">
                        <Text className="text-gray-900 font-bold text-lg">Total</Text>
                        <Text className="text-gray-900 font-bold text-lg">
                            {formatCurrency(transaction.total)}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {transaction.notes && (
                    <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                        <Text className="text-gray-500 text-sm font-medium mb-2">Notes</Text>
                        <Text className="text-gray-700">{transaction.notes}</Text>
                    </View>
                )}

                {/* Transaction ID */}
                <View className="mx-4 mt-4 p-4">
                    <Text className="text-gray-400 text-xs text-center">
                        Transaction ID: {transaction.id}
                    </Text>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            {transaction.type === 'SALE' && transaction.status === 'COMPLETED' && (
                <View className="px-4 pb-6 pt-2 bg-white border-t border-gray-100 flex-row">
                    <Pressable
                        onPress={handleShare}
                        className="flex-1 mr-2 py-4 rounded-xl items-center bg-gray-100 flex-row justify-center"
                    >
                        <MaterialCommunityIcons name="printer" size={20} color="#6b7280" />
                        <Text className="text-gray-700 font-semibold ml-2">Print</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleRefund}
                        className="flex-1 ml-2 py-4 rounded-xl items-center bg-red-100 flex-row justify-center"
                    >
                        <MaterialCommunityIcons name="undo" size={20} color="#ef4444" />
                        <Text className="text-red-600 font-semibold ml-2">Refund</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
