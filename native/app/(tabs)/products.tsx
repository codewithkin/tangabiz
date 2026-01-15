// Products Screen - List and manage products
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Image,
    useWindowDimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useResponsive } from '@/lib/useResponsive';
import { usePermissions } from '@/lib/permissions';

interface Product {
    id: string;
    name: string;
    price: number;
    costPrice?: number;
    quantity: number;
    minQuantity: number;
    sku?: string;
    image?: string;
    category?: { name: string };
    isActive: boolean;
}

export default function ProductsScreen() {
    const { currentBusiness } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { hasPermission } = usePermissions();

    // Responsive
    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, touchTargets, gridColumns } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';
    const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;

    const fetchProducts = useCallback(async (pageNum = 1, refresh = false) => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/products', {
                businessId: currentBusiness.id,
                page: pageNum,
                limit: 20,
                search: searchQuery || undefined,
            });

            const newProducts = res.data?.data || [];

            if (refresh || pageNum === 1) {
                setProducts(newProducts);
            } else {
                setProducts(prev => [...prev, ...newProducts]);
            }

            setHasMore(newProducts.length === 20);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness, searchQuery]);

    useEffect(() => {
        setIsLoading(true);
        fetchProducts(1, true);
    }, [searchQuery]);

    useEffect(() => {
        fetchProducts(1, true);
    }, [currentBusiness]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchProducts(1, true);
    }, [fetchProducts]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchProducts(page + 1);
        }
    }, [isLoading, hasMore, page, fetchProducts]);

    const renderProduct = ({ item }: { item: Product }) => {
        const isLowStock = item.quantity <= item.minQuantity;
        const isOutOfStock = item.quantity === 0;

        return (
            <Pressable
                onPress={() => router.push(`/products/${item.id}`)}
                className={`bg-white ${numColumns > 1 ? 'mx-2 mb-4' : 'mx-4 mb-3'} rounded-xl ${isTablet ? 'p-5' : 'p-4'} flex-row items-center shadow-sm`}
                style={numColumns > 1 ? { flex: 1 / numColumns, maxWidth: `${100 / numColumns - 2}%` } : undefined}
            >
                {/* Product Image */}
                <View className={`${isTablet ? 'w-20 h-20' : 'w-16 h-16'} bg-gray-100 rounded-lg items-center justify-center mr-4 overflow-hidden`}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <MaterialCommunityIcons name="package-variant" size={iconSizes.medium} color="#9ca3af" />
                    )}
                </View>

                {/* Product Info */}
                <View className="flex-1">
                    <Text className={`text-gray-900 font-semibold ${isTablet ? 'text-lg' : 'text-base'}`} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className={`text-gray-500 ${typography.small} mt-0.5`}>
                        {item.sku || 'No SKU'} {item.category && `• ${item.category.name}`}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Text className={`text-green-600 font-bold ${typography.body}`}>
                            {formatCurrency(item.price)}
                        </Text>
                        {isOutOfStock ? (
                            <View className={`bg-red-100 ${isTablet ? 'px-3 py-1' : 'px-2 py-0.5'} rounded ml-2`}>
                                <Text className={`text-red-600 ${typography.small} font-medium`}>Out of Stock</Text>
                            </View>
                        ) : isLowStock ? (
                            <View className={`bg-yellow-100 ${isTablet ? 'px-3 py-1' : 'px-2 py-0.5'} rounded ml-2`}>
                                <Text className={`text-yellow-700 ${typography.small} font-medium`}>Low Stock</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Stock Badge */}
                <View className="items-end">
                    <Text className={`text-gray-400 ${typography.small}`}>Stock</Text>
                    <Text
                        className={`${isTablet ? 'text-xl' : 'text-lg'} font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
                            }`}
                    >
                        {item.quantity}
                    </Text>
                </View>
            </Pressable>
        );
    };

    const ListEmpty = () => (
        <View className="flex-1 items-center justify-center py-20">
            <MaterialCommunityIcons name="package-variant" size={iconSizes.xlarge} color="#d1d5db" />
            <Text className={`text-gray-400 ${isTablet ? 'text-xl' : 'text-lg'} mt-4`}>No products found</Text>
            {hasPermission('create_products') && (
                <Pressable
                    onPress={() => router.push('/products/create')}
                    className={`mt-4 bg-green-500 ${isTablet ? 'px-8 py-4' : 'px-6 py-3'} rounded-xl`}
                >
                    <Text className={`text-white font-semibold ${typography.body}`}>Add First Product</Text>
                </Pressable>
            )}
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'Products',
                    headerRight: () => hasPermission('create_products') ? (
                        <Pressable
                            onPress={() => router.push('/products/create')}
                            className="mr-4"
                        >
                            <MaterialCommunityIcons name="plus" size={iconSizes.medium} color="#fff" />
                        </Pressable>
                    ) : null,
                }}
            />

            {/* Search Bar */}
            <View className={`${isTablet ? 'px-6 py-4' : 'px-4 py-3'} bg-white border-b border-gray-100`}>
                <View className={`flex-row items-center bg-gray-100 rounded-xl ${isTablet ? 'px-5 py-3' : 'px-4 py-2'}`} style={isLargeTablet ? { maxWidth: 600 } : undefined}>
                    <MaterialCommunityIcons name="magnify" size={iconSizes.small} color="#9ca3af" />
                    <TextInput
                        className={`flex-1 ml-2 text-gray-900 ${typography.body}`}
                        placeholder="Search products..."
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

            {/* Products List */}
            {isLoading && products.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#22c55e" />
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProduct}
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
                        isLoading && products.length > 0 ? (
                            <ActivityIndicator color="#22c55e" className="py-4" />
                        ) : null
                    }
                />
            )}

            {/* FAB */}
            <Pressable
                onPress={() => router.push('/products/create')}
                className={`absolute bottom-6 right-6 ${isTablet ? 'w-16 h-16' : 'w-14 h-14'} bg-green-500 rounded-full items-center justify-center shadow-lg`}
            >
                <MaterialCommunityIcons name="plus" size={iconSizes.medium} color="#fff" />
            </Pressable>
        </View>
    );
}
