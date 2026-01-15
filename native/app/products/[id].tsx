// Product Detail Screen
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, haptics, toast } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
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
    createdAt: string;
    updatedAt: string;
    category?: { id: string; name: string };
    createdBy?: { name: string };
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentBusiness } = useAuthStore();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        if (!id) return;
        try {
            const res = await api.get(`/api/products/${id}`);
            if (res.success) {
                setProduct(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
            toast.error('Failed to load product');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        haptics.medium();
                        try {
                            const res = await api.delete(`/api/products/${id}`);
                            if (res.success) {
                                haptics.success();
                                toast.success('Product deleted');
                                router.back();
                            } else {
                                toast.error('Failed to delete product', res.error);
                            }
                        } catch (error) {
                            toast.error('Failed to delete product');
                        }
                    },
                },
            ]
        );
    };

    const handleStockAdjust = (operation: 'add' | 'subtract') => {
        Alert.prompt(
            `${operation === 'add' ? 'Add' : 'Remove'} Stock`,
            'Enter quantity:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: operation === 'add' ? 'Add' : 'Remove',
                    onPress: async (value: string) => {
                        const qty = Number(value);
                        if (!qty || qty <= 0) {
                            toast.error('Invalid quantity');
                            return;
                        }
                        try {
                            const res = await api.patch(`/api/products/${id}/stock`, {
                                quantity: qty,
                                operation,
                            });
                            if (res.success) {
                                haptics.success();
                                toast.success('Stock updated');
                                fetchProduct();
                            } else {
                                toast.error('Failed to update stock', res.error);
                            }
                        } catch (error) {
                            toast.error('Failed to update stock');
                        }
                    },
                },
            ],
            'plain-text',
            '',
            'number-pad'
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    if (!product) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <MaterialCommunityIcons name="package-variant-remove" size={64} color="#d1d5db" />
                <Text className="text-gray-400 mt-4">Product not found</Text>
                <Pressable
                    onPress={() => router.back()}
                    className="mt-4 bg-green-500 px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-semibold">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const isLowStock = product.quantity <= product.minQuantity;
    const isOutOfStock = product.quantity === 0;
    const profit = product.costPrice ? product.price - product.costPrice : null;

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'Product Details',
                    headerRight: () => (
                        <View className="flex-row">
                            <Pressable
                                onPress={() => router.push(`/products/edit/${id}`)}
                                className="mr-4"
                            >
                                <MaterialCommunityIcons name="pencil" size={22} color="#fff" />
                            </Pressable>
                            <Pressable onPress={handleDelete}>
                                <MaterialCommunityIcons name="delete" size={22} color="#fff" />
                            </Pressable>
                        </View>
                    ),
                }}
            />

            <ScrollView>
                {/* Product Image */}
                <View className="w-full h-64 bg-gray-200 items-center justify-center">
                    {product.image ? (
                        <Image
                            source={{ uri: product.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <MaterialCommunityIcons name="package-variant" size={80} color="#9ca3af" />
                    )}
                </View>

                {/* Product Info */}
                <View className="bg-white px-5 py-4 -mt-4 rounded-t-3xl">
                    {/* Name & Category */}
                    <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-900">{product.name}</Text>
                            {product.category && (
                                <View className="flex-row items-center mt-1">
                                    <View className="bg-blue-100 px-2 py-1 rounded">
                                        <Text className="text-blue-700 text-xs font-medium">
                                            {product.category.name}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                        <View className="items-end">
                            <Text className="text-2xl font-bold text-green-600">
                                {formatCurrency(product.price)}
                            </Text>
                            {profit !== null && (
                                <Text className="text-xs text-gray-500">
                                    Profit: {formatCurrency(profit)}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Description */}
                    {product.description && (
                        <Text className="text-gray-600 mt-2">{product.description}</Text>
                    )}

                    {/* Stock Section */}
                    <View className="mt-6 bg-gray-50 rounded-xl p-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-gray-700 font-semibold">Stock Level</Text>
                            {isOutOfStock ? (
                                <View className="bg-red-100 px-3 py-1 rounded-full">
                                    <Text className="text-red-700 font-medium">Out of Stock</Text>
                                </View>
                            ) : isLowStock ? (
                                <View className="bg-yellow-100 px-3 py-1 rounded-full">
                                    <Text className="text-yellow-700 font-medium">Low Stock</Text>
                                </View>
                            ) : (
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                    <Text className="text-green-700 font-medium">In Stock</Text>
                                </View>
                            )}
                        </View>

                        <View className="flex-row items-center justify-center mb-4">
                            <Text
                                className={`text-5xl font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
                                    }`}
                            >
                                {product.quantity}
                            </Text>
                            <Text className="text-gray-500 text-lg ml-2">{product.unit}s</Text>
                        </View>

                        <View className="flex-row">
                            <Pressable
                                onPress={() => handleStockAdjust('add')}
                                className="flex-1 bg-green-500 py-3 rounded-xl items-center mr-2"
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                                <Text className="text-white font-medium mt-1">Add Stock</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => handleStockAdjust('subtract')}
                                className="flex-1 bg-red-500 py-3 rounded-xl items-center ml-2"
                            >
                                <MaterialCommunityIcons name="minus" size={20} color="#fff" />
                                <Text className="text-white font-medium mt-1">Remove</Text>
                            </Pressable>
                        </View>

                        <Text className="text-gray-400 text-center text-xs mt-3">
                            Alert threshold: {product.minQuantity} {product.unit}s
                        </Text>
                    </View>

                    {/* Details */}
                    <View className="mt-6">
                        <Text className="text-gray-700 font-semibold mb-3">Details</Text>

                        <View className="bg-gray-50 rounded-xl">
                            {product.sku && (
                                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <Text className="text-gray-500">SKU</Text>
                                    <Text className="text-gray-900 font-medium">{product.sku}</Text>
                                </View>
                            )}
                            {product.barcode && (
                                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <Text className="text-gray-500">Barcode</Text>
                                    <Text className="text-gray-900 font-medium">{product.barcode}</Text>
                                </View>
                            )}
                            {product.costPrice && (
                                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <Text className="text-gray-500">Cost Price</Text>
                                    <Text className="text-gray-900 font-medium">
                                        {formatCurrency(product.costPrice)}
                                    </Text>
                                </View>
                            )}
                            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                <Text className="text-gray-500">Unit</Text>
                                <Text className="text-gray-900 font-medium capitalize">{product.unit}</Text>
                            </View>
                            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                                <Text className="text-gray-500">Status</Text>
                                <Text className={product.isActive ? 'text-green-600' : 'text-red-600'}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between px-4 py-3">
                                <Text className="text-gray-500">Created</Text>
                                <Text className="text-gray-900">{formatDate(product.createdAt)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
