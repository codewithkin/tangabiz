import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface } from 'heroui-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { transactionsApi } from '@/lib/api';
import { format } from 'date-fns';
import { formatCurrency, formatDateTime, formatTime, formatDate } from '@/lib/utils';

/**
 * Sale details screen displaying comprehensive transaction information including items purchased, payment details, customer info, and timestamps. Provides options to print receipt or share transaction details.
 */

type TransactionItem = {
    id: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    product?: {
        id: string;
        name: string;
        image?: string;
    };
};

type Transaction = {
    id: string;
    invoiceId: string;
    reference: string;
    type: string;
    status: string;
    paymentMethod: string;
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    change: number;
    notes?: string;
    createdAt: string;
    customer?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
    };
    createdBy?: {
        id: string;
        name: string;
        email?: string;
    };
    business?: {
        id: string;
        name: string;
        currency?: string;
    };
    items: TransactionItem[];
};

export default function SaleDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchTransaction();
        }
    }, [id]);

    const fetchTransaction = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await transactionsApi.get(id!);
            if (response.data?.transaction) {
                setTransaction(response.data.transaction);
            } else {
                setError('Transaction not found');
            }
        } catch (err: any) {
            console.error('Failed to fetch transaction:', err);
            setError(err.response?.data?.error || 'Failed to load transaction details');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            case 'REFUNDED':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'CASH':
                return 'cash';
            case 'CARD':
                return 'credit-card';
            case 'BANK_TRANSFER':
                return 'bank';
            case 'MOBILE_MONEY':
                return 'cellphone';
            default:
                return 'currency-usd';
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
                <Text className="text-gray-500 mt-4">Loading transaction...</Text>
            </SafeAreaView>
        );
    }

    if (error || !transaction) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center p-4">
                <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
                <Text className="text-xl font-bold text-gray-900 mt-4">Error</Text>
                <Text className="text-gray-500 text-center mt-2">{error || 'Transaction not found'}</Text>
                <Pressable
                    className="bg-green-500 px-6 py-3 rounded-xl mt-6 active:opacity-80"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Go Back</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
            <View className="h-full mt-8">
                <ScrollView className="flex-1">
                    <View className="p-4 gap-6">
                        {/* Header */}
                        <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center gap-3">
                            <Pressable
                                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
                                onPress={() => router.back()}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#6b7280" />
                            </Pressable>
                            <View className="flex-1">
                                <Text className="text-2xl font-black text-gray-900">Sale Details</Text>
                                <Text className="text-sm font-light text-gray-500">#{transaction.reference}</Text>
                            </View>
                            <View className={`px-3 py-1 rounded-full ${getStatusColor(transaction.status)}`}>
                                <Text className="font-medium text-sm">{transaction.status}</Text>
                            </View>
                        </Animated.View>

                        {/* Success Banner */}
                        <Animated.View entering={SlideInUp.duration(500).delay(50)}>
                            <Surface className="p-4 rounded-2xl bg-green-50 border border-green-200">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center">
                                        <MaterialCommunityIcons name="check-circle" size={28} color="#22c55e" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-green-800">Sale Completed!</Text>
                                        <Text className="text-sm text-green-600">
                                            {formatDateTime(transaction.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            </Surface>
                        </Animated.View>

                        {/* Transaction Summary */}
                        <Animated.View entering={SlideInUp.duration(500).delay(100)}>
                            <Surface className="p-4 rounded-2xl">
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-lg font-bold text-gray-900">Summary</Text>
                                    <View className="flex-row items-center gap-2">
                                        <MaterialCommunityIcons
                                            name={getPaymentMethodIcon(transaction.paymentMethod) as any}
                                            size={20}
                                            color="#6b7280"
                                        />
                                        <Text className="text-gray-600 font-medium">
                                            {transaction.paymentMethod.replace(/_/g, ' ')}
                                        </Text>
                                    </View>
                                </View>

                                <View className="gap-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-600">Invoice ID</Text>
                                        <Text className="font-bold text-gray-900">{transaction.invoiceId}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-600">Subtotal</Text>
                                        <Text className="font-medium text-gray-900">{formatCurrency(Number(transaction.subtotal))}</Text>
                                    </View>
                                    {Number(transaction.discount) > 0 && (
                                        <View className="flex-row justify-between">
                                            <Text className="text-gray-600">Discount</Text>
                                            <Text className="font-medium text-red-600">-{formatCurrency(Number(transaction.discount))}</Text>
                                        </View>
                                    )}
                                    <View className="flex-row justify-between pt-2 border-t border-gray-200">
                                        <Text className="text-lg font-bold text-gray-900">Total</Text>
                                        <Text className="text-lg font-black text-green-600">{formatCurrency(Number(transaction.total))}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-600">Amount Paid</Text>
                                        <Text className="font-medium text-gray-900">{formatCurrency(Number(transaction.amountPaid))}</Text>
                                    </View>
                                    {Number(transaction.change) > 0 && (
                                        <View className="flex-row justify-between">
                                            <Text className="text-gray-600">Change</Text>
                                            <Text className="font-medium text-green-600">{formatCurrency(Number(transaction.change))}</Text>
                                        </View>
                                    )}
                                </View>
                            </Surface>
                        </Animated.View>

                        {/* Items */}
                        <Animated.View entering={SlideInUp.duration(500).delay(200)}>
                            <Surface className="p-4 rounded-2xl">
                                <Text className="text-lg font-bold text-gray-900 mb-3">
                                    Items ({transaction.items.length})
                                </Text>
                                <View className="gap-3">
                                    {transaction.items.map((item, index) => (
                                        <View
                                            key={item.id || index}
                                            className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                                        >
                                            <View className="flex-1">
                                                <Text className="font-medium text-gray-900">{item.productName}</Text>
                                                <Text className="text-sm text-gray-500">
                                                    {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                                                </Text>
                                            </View>
                                            <Text className="font-bold text-gray-900">{formatCurrency(Number(item.total))}</Text>
                                        </View>
                                    ))}
                                </View>
                            </Surface>
                        </Animated.View>

                        {/* Customer Info */}
                        {transaction.customer && (
                            <Animated.View entering={SlideInUp.duration(500).delay(300)}>
                                <Surface className="p-4 rounded-2xl">
                                    <Text className="text-lg font-bold text-gray-900 mb-3">Customer</Text>
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                                            <MaterialCommunityIcons name="account" size={24} color="#6b7280" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-medium text-gray-900">{transaction.customer.name}</Text>
                                            {transaction.customer.email && (
                                                <Text className="text-sm text-gray-500">{transaction.customer.email}</Text>
                                            )}
                                            {transaction.customer.phone && (
                                                <Text className="text-sm text-gray-500">{transaction.customer.phone}</Text>
                                            )}
                                        </View>
                                    </View>
                                </Surface>
                            </Animated.View>
                        )}

                        {/* Notes */}
                        {transaction.notes && (
                            <Animated.View entering={SlideInUp.duration(500).delay(400)}>
                                <Surface className="p-4 rounded-2xl">
                                    <Text className="text-lg font-bold text-gray-900 mb-2">Notes</Text>
                                    <Text className="text-gray-600">{transaction.notes}</Text>
                                </Surface>
                            </Animated.View>
                        )}

                        {/* Actions */}
                        <Animated.View entering={SlideInUp.duration(500).delay(500)} className="flex-row gap-3">
                            <Pressable
                                className="flex-1 bg-gray-100 py-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                                onPress={() => router.push('/(drawer)/sales')}
                            >
                                <MaterialCommunityIcons name="receipt" size={20} color="#374151" />
                                <Text className="text-gray-700 font-bold">View All Sales</Text>
                            </Pressable>
                            <Pressable
                                className="flex-1 bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                                onPress={() => router.push('/sale/new')}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="white" />
                                <Text className="text-white font-bold">New Sale</Text>
                            </Pressable>
                        </Animated.View>

                        {/* Bottom padding */}
                        <View className="h-8" />
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
