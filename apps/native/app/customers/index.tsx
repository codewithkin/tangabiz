import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, FlatList, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Spinner, Button, useThemeColor } from 'heroui-native';
import { useQuery } from '@tanstack/react-query';

import { Container } from '@/components/container';
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
    const linkColor = useThemeColor('link');
    const foregroundColor = useThemeColor('foreground');
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
        await refetch();
        setRefreshing(false);
    };

    const renderCustomer = ({ item }: { item: Customer }) => (
        <Pressable onPress={() => router.push(`/customers/${item.id}`)}>
            <Surface variant="secondary" className="p-4 rounded-xl mb-3 flex-row items-center">
                {/* Avatar */}
                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-purple-600 font-bold text-lg">
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Customer Info */}
                <View className="flex-1">
                    <Text className="text-foreground font-semibold" numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.email && (
                        <Text className="text-muted text-sm" numberOfLines={1}>
                            {item.email}
                        </Text>
                    )}
                    {item.phone && (
                        <Text className="text-muted text-sm" numberOfLines={1}>
                            {item.phone}
                        </Text>
                    )}
                    <Text className="text-muted text-xs mt-1">
                        {item._count?.transactions || 0} transactions
                    </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
            </Surface>
        </Pressable>
    );

    return (
        <Container>
            <Stack.Screen
                options={{
                    title: 'Customers',
                    headerRight: () => (
                        <Pressable onPress={() => router.push('/customers/create')} className="mr-4">
                            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                        </Pressable>
                    ),
                }}
            />

            <View className="flex-1">
                {/* Search */}
                <View className="p-4">
                    <TextInput
                        placeholder="Search customers..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="bg-gray-100 rounded-lg px-4 py-3"
                        style={{ color: foregroundColor }}
                    />
                </View>

                {/* Customers List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Spinner size="lg" />
                    </View>
                ) : customers.length === 0 ? (
                    <View className="flex-1 items-center justify-center p-8">
                        <MaterialCommunityIcons name="account-group" size={64} color="#9ca3af" />
                        <Text className="text-lg font-semibold text-foreground mt-4">No Customers Yet</Text>
                        <Text className="text-muted text-center mt-2">
                            Add your first customer to start tracking their purchases
                        </Text>
                        <Button
                            variant="primary"
                            className="mt-6"
                            onPress={() => router.push('/customers/create')}
                        >
                            <Button.Label>Add Customer</Button.Label>
                        </Button>
                    </View>
                ) : (
                    <FlatList
                        data={customers}
                        renderItem={renderCustomer}
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
