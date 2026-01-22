import { useState } from 'react';
import { View, Text, RefreshControl, Pressable, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/store/auth';
import { customersApi } from '@/lib/api';

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    isActive: boolean;
    createdAt: string;
    _count?: {
        transactions: number;
    };
}

export default function Customers() {
    const { currentBusiness } = useAuthStore();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['customers', currentBusiness?.id, searchQuery],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await customersApi.list(currentBusiness.id, {
                search: searchQuery || undefined,
                limit: 50
            });
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const customers: Customer[] = data?.customers || [];

    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await refetch();
        setRefreshing(false);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            { bg: 'bg-purple-100', text: 'text-purple-600' },
            { bg: 'bg-blue-100', text: 'text-blue-600' },
            { bg: 'bg-green-100', text: 'text-green-600' },
            { bg: 'bg-orange-100', text: 'text-orange-600' },
            { bg: 'bg-pink-100', text: 'text-pink-600' },
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const renderCustomer = ({ item }: { item: Customer }) => {
        const avatarColor = getAvatarColor(item.name);

        return (
            <Pressable
                onPress={() => router.push(`/customers/${item.id}`)}
                className="mx-4 mb-3"
            >
                <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row items-center">
                    {/* Avatar */}
                    <View className={`w-12 h-12 ${avatarColor.bg} rounded-full items-center justify-center mr-4`}>
                        <Text className={`${avatarColor.text} font-bold text-lg`}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    {/* Customer Info */}
                    <View className="flex-1">
                        <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.email && (
                            <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                {item.email}
                            </Text>
                        )}
                        {item.phone && !item.email && (
                            <Text className="text-gray-400 text-sm" numberOfLines={1}>
                                {item.phone}
                            </Text>
                        )}
                        <View className="flex-row items-center mt-1">
                            <MaterialCommunityIcons name="receipt-text-outline" size={14} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs ml-1">
                                {item._count?.transactions || 0} transactions
                            </Text>
                        </View>
                    </View>

                    <MaterialCommunityIcons name="chevron-right" size={22} color="#d1d5db" />
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <Pressable
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center mr-2"
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
                        </Pressable>
                        <Text className="text-2xl font-bold text-gray-900">Customers</Text>
                    </View>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/customers/create');
                        }}
                        className="bg-green-500 rounded-xl px-4 py-2.5 flex-row items-center active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-semibold ml-1">Add</Text>
                    </Pressable>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
                    <MaterialCommunityIcons name="magnify" size={22} color="#9ca3af" />
                    <TextInput
                        placeholder="Search customers..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 py-3 px-2 text-gray-900"
                    />
                    {searchQuery ? (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close-circle" size={20} color="#9ca3af" />
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* Customers List */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-2">Loading customers...</Text>
                </View>
            ) : customers.length === 0 ? (
                <View className="flex-1 items-center justify-center p-8">
                    <View className="w-20 h-20 bg-purple-100 rounded-full items-center justify-center mb-4">
                        <MaterialCommunityIcons name="account-group-outline" size={40} color="#8b5cf6" />
                    </View>
                    <Text className="text-xl font-semibold text-gray-900">No Customers Yet</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Add your first customer to start tracking their purchases
                    </Text>
                    <Pressable
                        onPress={() => router.push('/customers/create')}
                        className="mt-6 bg-green-500 rounded-xl px-6 py-3 flex-row items-center active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Add Customer</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={customers}
                    renderItem={renderCustomer}
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
