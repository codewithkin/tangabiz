// Customer Detail Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    transactions?: Transaction[];
    _count?: {
        transactions: number;
    };
}

interface Transaction {
    id: string;
    type: string;
    total: number;
    status: string;
    createdAt: string;
    items: { quantity: number }[];
}

export default function CustomerDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentBusiness } = useAuthStore();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (!id || !currentBusiness) return;

        try {
            const res = await api.get(`/api/customers/${id}`, {
                businessId: currentBusiness.id,
            });
            setCustomer(res.data?.data || null);

            // Fetch recent transactions
            const txRes = await api.get('/api/transactions', {
                businessId: currentBusiness.id,
                customerId: id,
                limit: 10,
            });
            setTransactions(txRes.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch customer:', error);
            Alert.alert('Error', 'Failed to load customer details');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [id, currentBusiness]);

    useEffect(() => {
        fetchCustomer();
    }, [fetchCustomer]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchCustomer();
    }, [fetchCustomer]);

    const handleCall = () => {
        if (customer?.phone) {
            Linking.openURL(`tel:${customer.phone}`);
        }
    };

    const handleEmail = () => {
        if (customer?.email) {
            Linking.openURL(`mailto:${customer.email}`);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Customer',
            `Are you sure you want to delete "${customer?.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            await api.delete(`/api/customers/${id}?businessId=${currentBusiness?.id}`);
                            Alert.alert('Success', 'Customer deleted successfully', [
                                { text: 'OK', onPress: () => router.back() }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete customer');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const calculateTotalSpent = () => {
        return transactions
            .filter(t => t.type === 'SALE' && t.status === 'COMPLETED')
            .reduce((sum, t) => sum + t.total, 0);
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    if (!customer) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <MaterialCommunityIcons name="account-off" size={64} color="#d1d5db" />
                <Text className="text-gray-400 text-lg mt-4">Customer not found</Text>
                <Pressable
                    onPress={() => router.back()}
                    className="mt-4 bg-green-500 px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: customer.name,
                    headerRight: () => (
                        <View className="flex-row items-center mr-4">
                            <Pressable
                                onPress={() => router.push(`/customers/edit/${id}`)}
                                className="mr-4"
                            >
                                <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
                            </Pressable>
                            <Pressable onPress={handleDelete} disabled={isDeleting}>
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <MaterialCommunityIcons name="delete" size={22} color="#fff" />
                                )}
                            </Pressable>
                        </View>
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
                <View className="bg-white m-4 rounded-xl p-6 items-center">
                    <View className="w-20 h-20 bg-yellow-100 rounded-full items-center justify-center mb-4">
                        <Text className="text-yellow-700 text-3xl font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text className="text-gray-900 text-xl font-bold">{customer.name}</Text>
                    {customer.city && (
                        <Text className="text-gray-500 mt-1">{customer.city}</Text>
                    )}

                    {/* Quick Actions */}
                    <View className="flex-row mt-6">
                        {customer.phone && (
                            <Pressable
                                onPress={handleCall}
                                className="bg-green-100 px-6 py-3 rounded-xl mr-3 flex-row items-center"
                            >
                                <MaterialCommunityIcons name="phone" size={20} color="#22c55e" />
                                <Text className="text-green-700 font-semibold ml-2">Call</Text>
                            </Pressable>
                        )}
                        {customer.email && (
                            <Pressable
                                onPress={handleEmail}
                                className="bg-blue-100 px-6 py-3 rounded-xl flex-row items-center"
                            >
                                <MaterialCommunityIcons name="email" size={20} color="#3b82f6" />
                                <Text className="text-blue-700 font-semibold ml-2">Email</Text>
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* Stats Row */}
                <View className="flex-row px-4 mb-4">
                    <View className="flex-1 bg-white rounded-xl p-4 mr-2">
                        <Text className="text-gray-500 text-xs">Total Transactions</Text>
                        <Text className="text-gray-900 text-2xl font-bold">
                            {customer._count?.transactions || 0}
                        </Text>
                    </View>
                    <View className="flex-1 bg-white rounded-xl p-4 ml-2">
                        <Text className="text-gray-500 text-xs">Total Spent</Text>
                        <Text className="text-green-600 text-2xl font-bold">
                            {formatCurrency(calculateTotalSpent())}
                        </Text>
                    </View>
                </View>

                {/* Contact Info */}
                <View className="bg-white mx-4 rounded-xl p-4 mb-4">
                    <Text className="text-gray-500 text-sm font-medium mb-3">
                        Contact Information
                    </Text>

                    {customer.phone && (
                        <Pressable
                            onPress={handleCall}
                            className="flex-row items-center py-3 border-b border-gray-100"
                        >
                            <MaterialCommunityIcons name="phone" size={22} color="#6b7280" />
                            <Text className="flex-1 ml-3 text-gray-900">{customer.phone}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                        </Pressable>
                    )}

                    {customer.email && (
                        <Pressable
                            onPress={handleEmail}
                            className="flex-row items-center py-3 border-b border-gray-100"
                        >
                            <MaterialCommunityIcons name="email" size={22} color="#6b7280" />
                            <Text className="flex-1 ml-3 text-gray-900">{customer.email}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                        </Pressable>
                    )}

                    {customer.address && (
                        <View className="flex-row items-center py-3">
                            <MaterialCommunityIcons name="map-marker" size={22} color="#6b7280" />
                            <Text className="flex-1 ml-3 text-gray-900">
                                {customer.address}
                                {customer.city && `, ${customer.city}`}
                            </Text>
                        </View>
                    )}

                    {!customer.phone && !customer.email && !customer.address && (
                        <Text className="text-gray-400 text-center py-4">
                            No contact information available
                        </Text>
                    )}
                </View>

                {/* Notes */}
                {customer.notes && (
                    <View className="bg-white mx-4 rounded-xl p-4 mb-4">
                        <Text className="text-gray-500 text-sm font-medium mb-2">Notes</Text>
                        <Text className="text-gray-700">{customer.notes}</Text>
                    </View>
                )}

                {/* Recent Transactions */}
                <View className="bg-white mx-4 rounded-xl p-4">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-gray-500 text-sm font-medium">
                            Recent Transactions
                        </Text>
                        {transactions.length > 0 && (
                            <Pressable onPress={() => { }}>
                                <Text className="text-green-600 text-sm font-medium">View All</Text>
                            </Pressable>
                        )}
                    </View>

                    {transactions.length === 0 ? (
                        <View className="py-8 items-center">
                            <MaterialCommunityIcons name="receipt" size={40} color="#d1d5db" />
                            <Text className="text-gray-400 mt-2">No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.slice(0, 5).map((tx) => (
                            <Pressable
                                key={tx.id}
                                onPress={() => router.push(`/transactions/${tx.id}`)}
                                className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${tx.type === 'SALE' ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                    <MaterialCommunityIcons
                                        name={tx.type === 'SALE' ? 'arrow-up' : 'arrow-down'}
                                        size={20}
                                        color={tx.type === 'SALE' ? '#22c55e' : '#ef4444'}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-900 font-medium">
                                        {tx.type === 'SALE' ? 'Sale' : 'Refund'}
                                    </Text>
                                    <Text className="text-gray-500 text-xs">
                                        {formatDate(tx.createdAt)}
                                    </Text>
                                </View>
                                <Text className={`font-bold ${tx.type === 'SALE' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {tx.type === 'SALE' ? '+' : '-'}{formatCurrency(tx.total)}
                                </Text>
                            </Pressable>
                        ))
                    )}
                </View>

                {/* Created At */}
                <Text className="text-gray-400 text-xs text-center mt-6">
                    Customer since {formatDate(customer.createdAt)}
                </Text>
            </ScrollView>

            {/* Create Transaction FAB */}
            <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/pos', params: { customerId: customer.id } })}
                className="absolute bottom-6 right-6 bg-green-500 px-6 py-4 rounded-full shadow-lg flex-row items-center"
            >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">New Sale</Text>
            </Pressable>
        </View>
    );
}
