import { useState, useEffect } from 'react';
import { View, Text, RefreshControl, Pressable, FlatList, Image, TextInput, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/store/auth';
import { productsApi } from '@/lib/api';
import { useConnection } from '@/hooks/useConnection';

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

// Products management screen showing searchable product catalog with images, pricing, stock levels, and filtering. Supports grid/list views with pull-to-refresh functionality.
export default function Products() {
    const { currentBusiness } = useAuthStore();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const { isLoading: connectionLoading, isConnected } = useConnection();

    // Check connection and redirect if offline
    useEffect(() => {
        if (!connectionLoading && !isConnected) {
            router.push('/offline');
        }
    }, [connectionLoading, isConnected]);

    // Responsive columns
    const isTablet = width >= 768;
    const numColumns = viewMode === 'grid' ? (isTablet ? 4 : 2) : 1;

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

    const StockBadge = ({ quantity, minQuantity }: { quantity: number; minQuantity: number }) => {
        const isLowStock = quantity <= minQuantity && quantity > 0;
        const isOutOfStock = quantity === 0;

        if (isOutOfStock) {
            return (
                <View className="bg-red-100 px-2 py-1 rounded-lg">
                    <Text className="text-red-600 text-xs font-semibold">Out of Stock</Text>
                </View>
            );
        }
        if (isLowStock) {
            return (
                <View className="bg-orange-100 px-2 py-1 rounded-lg">
                    <Text className="text-orange-600 text-xs font-semibold">Low: {quantity}</Text>
                </View>
            );
        }
        return (
            <Text className="text-gray-400 text-sm">Stock: {quantity}</Text>
        );
    };

    const renderGridItem = ({ item }: { item: Product }) => (
        <Pressable
            onPress={() => router.push(`/products/${item.id}`)}
            style={{ width: `${100 / numColumns}%` }}
            className="p-1.5"
        >
            <View className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <View className="w-full aspect-square bg-gray-50 rounded-lg items-center justify-center overflow-hidden mb-3">
                    {item.image ? (
                        <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <MaterialCommunityIcons name="package-variant" size={40} color="#d1d5db" />
                    )}
                </View>
                <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="text-gray-400 text-sm" numberOfLines={1}>
                    {item.category?.name || 'Uncategorized'}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-green-600 font-bold">
                        {formatCurrency(item.price)}
                    </Text>
                    <StockBadge quantity={item.quantity} minQuantity={item.minQuantity} />
                </View>
            </View>
        </Pressable>
    );

    const renderListItem = ({ item }: { item: Product }) => (
        <Pressable onPress={() => router.push(`/products/${item.id}`)} className="mx-4 mb-3">
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex-row items-center">
                {/* Product Image */}
                <View className="w-16 h-16 bg-gray-50 rounded-xl mr-4 items-center justify-center overflow-hidden">
                    {item.image ? (
                        <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <MaterialCommunityIcons name="package-variant" size={28} color="#d1d5db" />
                    )}
                </View>

                {/* Product Info */}
                <View className="flex-1">
                    <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>
                        {item.sku ? `SKU: ${item.sku}` : item.category?.name || 'Uncategorized'}
                    </Text>
                    <View className="flex-row items-center mt-1.5 gap-2">
                        <Text className="text-green-600 font-bold">
                            {formatCurrency(item.price)}
                        </Text>
                        <StockBadge quantity={item.quantity} minQuantity={item.minQuantity} />
                    </View>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={22} color="#d1d5db" />
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-2xl font-bold text-gray-900">Products</Text>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/products/create');
                        }}
                        className="bg-green-500 rounded-xl px-4 py-2.5 flex-row items-center active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-semibold ml-1">Add</Text>
                    </Pressable>
                </View>

                {/* Search and View Toggle */}
                <View className="flex-row items-center gap-2">
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4">
                        <MaterialCommunityIcons name="magnify" size={22} color="#9ca3af" />
                        <TextInput
                            placeholder="Search products..."
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
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setViewMode(viewMode === 'grid' ? 'list' : 'grid');
                        }}
                        className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center"
                    >
                        <MaterialCommunityIcons
                            name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                            size={22}
                            color="#6b7280"
                        />
                    </Pressable>
                </View>
            </View>

            {/* Products List/Grid */}
            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text className="text-gray-500 mt-2">Loading products...</Text>
                </View>
            ) : products.length === 0 ? (
                <View className="flex-1 items-center justify-center p-8">
                    <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                        <MaterialCommunityIcons name="package-variant-closed" size={40} color="#9ca3af" />
                    </View>
                    <Text className="text-xl font-semibold text-gray-900">No Products Yet</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Add your first product to start selling
                    </Text>
                    <Pressable
                        onPress={() => router.push('/products/create')}
                        className="mt-6 bg-green-500 rounded-xl px-6 py-3 flex-row items-center active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Add Product</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                    keyExtractor={(item) => item.id}
                    numColumns={viewMode === 'grid' ? numColumns : 1}
                    key={viewMode === 'grid' ? `grid-${numColumns}` : 'list'}
                    contentContainerStyle={{ padding: viewMode === 'grid' ? 8 : 0, paddingTop: 16, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Floating Action Button */}
            {products.length > 0 && (
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push('/products/create');
                    }}
                    className="absolute bottom-6 right-6 w-16 h-16 bg-green-500 rounded-full items-center justify-center shadow-lg active:bg-green-600"
                    style={{
                        shadowColor: '#22c55e',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <MaterialCommunityIcons name="plus" size={28} color="white" />
                </Pressable>
            )}
        </SafeAreaView>
    );
}
