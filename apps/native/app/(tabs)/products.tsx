import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, FlatList, Image, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Spinner, Button, Chip, useThemeColor } from 'heroui-native';
import { useQuery } from '@tanstack/react-query';

import { Container } from '@/components/container';
import { useAuthStore } from '@/store/auth';
import { productsApi } from '@/lib/api';

interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    sku?: string;
    barcode?: string;
    image?: string;
    price: number;
    costPrice?: number;
    quantity: number;
    minQuantity: number;
    unit: string;
    isActive: boolean;
    category?: {
        id: string;
        name: string;
        slug: string;
    };
}

export default function Products() {
    const { currentBusiness } = useAuthStore();
    const linkColor = useThemeColor('link');
    const foregroundColor = useThemeColor('foreground');
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['products', currentBusiness?.id, searchQuery],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await productsApi.list(currentBusiness.id, {
                search: searchQuery || undefined,
                limit: 50
            });
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const products: Product[] = data?.products || [];

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

    const renderProduct = ({ item }: { item: Product }) => {
        const isLowStock = item.quantity <= item.minQuantity;
        const isOutOfStock = item.quantity === 0;

        return (
            <Pressable onPress={() => router.push(`/products/${item.id}`)}>
                <Surface variant="secondary" className="p-4 rounded-xl mb-3 flex-row items-center">
                    {/* Product Image */}
                    <View className="w-16 h-16 bg-gray-100 rounded-lg mr-4 items-center justify-center overflow-hidden">
                        {item.image ? (
                            <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <MaterialCommunityIcons name="package-variant" size={28} color="#9ca3af" />
                        )}
                    </View>

                    {/* Product Info */}
                    <View className="flex-1">
                        <Text className="text-foreground font-semibold" numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text className="text-muted text-sm" numberOfLines={1}>
                            {item.sku ? `SKU: ${item.sku}` : item.category?.name || 'No category'}
                        </Text>
                        <View className="flex-row items-center mt-1">
                            <Text className="text-link font-bold">
                                {formatCurrency(item.price)}
                            </Text>
                            {isOutOfStock ? (
                                <Chip color="danger" size="sm" className="ml-2">
                                    <Chip.Label>Out of Stock</Chip.Label>
                                </Chip>
                            ) : isLowStock ? (
                                <Chip color="warning" size="sm" className="ml-2">
                                    <Chip.Label>Low: {item.quantity}</Chip.Label>
                                </Chip>
                            ) : (
                                <Text className="text-muted text-sm ml-2">
                                    Stock: {item.quantity}
                                </Text>
                            )}
                        </View>
                    </View>

                    <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                </Surface>
            </Pressable>
        );
    };

    return (
        <Container>
            <Stack.Screen
                options={{
                    headerRight: () => (
                        <Pressable onPress={() => router.push('/products/create')} className="mr-4">
                            <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                        </Pressable>
                    ),
                }}
            />

            <View className="flex-1">
                {/* Search */}
                <View className="p-4">
                    <TextInput
                        placeholder="Search products..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="bg-gray-100 rounded-lg px-4 py-3"
                        style={{ color: foregroundColor }}
                    />
                </View>

                {/* Products List */}
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <Spinner size="lg" />
                    </View>
                ) : products.length === 0 ? (
                    <View className="flex-1 items-center justify-center p-8">
                        <MaterialCommunityIcons name="package-variant" size={64} color="#9ca3af" />
                        <Text className="text-lg font-semibold text-foreground mt-4">No Products Yet</Text>
                        <Text className="text-muted text-center mt-2">
                            Add your first product to start selling
                        </Text>
                        <Button
                            variant="primary"
                            className="mt-6"
                            onPress={() => router.push('/products/create')}
                        >
                            <Button.Label>Add Product</Button.Label>
                        </Button>
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderProduct}
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
