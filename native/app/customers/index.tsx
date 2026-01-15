// Customers List Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useResponsive } from '@/lib/useResponsive';

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    city?: string;
    isActive: boolean;
    _count?: {
        transactions: number;
    };
}

export default function CustomersScreen() {
    const { currentBusiness } = useAuthStore();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Responsive
    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, avatarSizes, touchTargets } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';
    const numColumns = isLargeTablet ? 2 : 1;

    const fetchCustomers = useCallback(async (pageNum = 1, refresh = false) => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/customers', {
                businessId: currentBusiness.id,
                page: pageNum,
                limit: 20,
                search: searchQuery || undefined,
            });

            const newCustomers = res.data?.data || [];

            if (refresh || pageNum === 1) {
                setCustomers(newCustomers);
            } else {
                setCustomers(prev => [...prev, ...newCustomers]);
            }

            setHasMore(newCustomers.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness, searchQuery]);

    useEffect(() => {
        setIsLoading(true);
        fetchCustomers(1, true);
    }, [searchQuery]);

    useEffect(() => {
        fetchCustomers(1, true);
    }, [currentBusiness]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchCustomers(1, true);
    }, [fetchCustomers]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchCustomers(page + 1);
        }
    }, [isLoading, hasMore, page, fetchCustomers]);

    const renderCustomer = ({ item }: { item: Customer }) => (
        <Pressable
            onPress={() => router.push(`/customers/${item.id}`)}
            className={`bg-white ${numColumns > 1 ? 'mx-2' : 'mx-4'} mb-3 rounded-xl ${isTablet ? 'p-5' : 'p-4'} flex-row items-center shadow-sm`}
            style={numColumns > 1 ? { flex: 1 / numColumns, maxWidth: `${100 / numColumns - 2}%` } : undefined}
        >
            {/* Avatar */}
            <View
                className="bg-yellow-100 rounded-full items-center justify-center mr-4"
                style={{ width: avatarSizes.medium, height: avatarSizes.medium }}
            >
                <Text className={`text-yellow-700 ${isTablet ? 'text-xl' : 'text-lg'} font-bold`}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>

            {/* Customer Info */}
            <View className="flex-1">
                <Text className={`text-gray-900 font-semibold ${isTablet ? 'text-lg' : 'text-base'}`}>{item.name}</Text>
                <Text className={`text-gray-500 ${typography.small} mt-0.5`}>
                    {item.phone || item.email || 'No contact info'}
                </Text>
                {item.city && (
                    <Text className={`text-gray-400 ${typography.small} mt-0.5`}>{item.city}</Text>
                )}
            </View>

            {/* Transaction Count */}
            <View className="items-end">
                <Text className={`text-gray-400 ${typography.small}`}>Transactions</Text>
                <Text className={`text-gray-900 font-bold ${isTablet ? 'text-xl' : 'text-lg'}`}>
                    {item._count?.transactions || 0}
                </Text>
            </View>
        </Pressable>
    );

    const ListEmpty = () => (
        <View className="flex-1 items-center justify-center py-20">
            <MaterialCommunityIcons name="account-group" size={iconSizes.xlarge} color="#d1d5db" />
            <Text className={`text-gray-400 ${isTablet ? 'text-xl' : 'text-lg'} mt-4`}>No customers found</Text>
            <Pressable
                onPress={() => router.push('/customers/create')}
                className={`mt-4 bg-green-500 ${isTablet ? 'px-8 py-4' : 'px-6 py-3'} rounded-xl`}
            >
                <Text className={`text-white font-semibold ${typography.body}`}>Add First Customer</Text>
            </Pressable>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'Customers',
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.push('/customers/create')}
                            className="mr-4"
                        >
                            <MaterialCommunityIcons name="plus" size={iconSizes.medium} color="#fff" />
                        </Pressable>
                    ),
                }}
            />

            {/* Search Bar */}
            <View className={`${isTablet ? 'px-6 py-4' : 'px-4 py-3'} bg-white border-b border-gray-100`}>
                <View className={`flex-row items-center bg-gray-100 rounded-xl ${isTablet ? 'px-5 py-3' : 'px-4 py-2'}`} style={isLargeTablet ? { maxWidth: 600 } : undefined}>
                    <MaterialCommunityIcons name="magnify" size={iconSizes.small} color="#9ca3af" />
                    <TextInput
                        className={`flex-1 ml-2 text-gray-900 ${typography.body}`}
                        placeholder="Search customers..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={iconSizes.small} color="#9ca3af" />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* Customers List */}
            {isLoading && customers.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <FlatList
                    data={customers}
                    renderItem={renderCustomer}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    key={numColumns}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 100, ...(isLargeTablet && { maxWidth: 1400, alignSelf: 'center', width: '100%' }) }}
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
                        isLoading && customers.length > 0 ? (
                            <ActivityIndicator color="#22c55e" className="py-4" />
                        ) : null
                    }
                />
            )}

            {/* FAB */}
            <Pressable
                onPress={() => router.push('/customers/create')}
                className={`absolute bottom-6 right-6 ${isTablet ? 'w-16 h-16' : 'w-14 h-14'} bg-green-500 rounded-full items-center justify-center shadow-lg`}
            >
                <MaterialCommunityIcons name="plus" size={iconSizes.medium} color="#fff" />
            </Pressable>
        </View>
    );
}
