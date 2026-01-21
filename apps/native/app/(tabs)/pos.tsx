import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Image, Alert, TextInput, useWindowDimensions, ActivityIndicator, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth';
import { productsApi, transactionsApi } from '@/lib/api';

interface Product {
    id: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    sku?: string;
    category?: { name: string };
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function POS() {
    const { currentBusiness } = useAuthStore();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY'>('CASH');
    const [showCart, setShowCart] = useState(false);

    // Responsive layout
    const isTablet = width >= 768;
    const numColumns = isTablet ? 4 : 3;

    const { data, isLoading } = useQuery({
        queryKey: ['pos-products', currentBusiness?.id, searchQuery],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await productsApi.list(currentBusiness.id, {
                search: searchQuery || undefined,
                limit: 100
            });
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const products: Product[] = data?.products || [];

    const addToCart = (product: Product) => {
        if (product.quantity <= 0) {
            Alert.alert('Out of Stock', 'This product is currently out of stock.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.quantity) {
                    Alert.alert('Stock Limit', `Only ${product.quantity} units available.`);
                    return prev;
                }
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        setCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    if (newQty > item.product.quantity) {
                        Alert.alert('Stock Limit', `Only ${item.product.quantity} units available.`);
                        return item;
                    }
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(Boolean) as CartItem[];
        });
    };

    const removeFromCart = (productId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const clearCart = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to clear all items?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => setCart([]) },
            ]
        );
    };

    const subtotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [cart]);

    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentBusiness?.currency || 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        setIsSubmitting(true);
        try {
            const res = await transactionsApi.create({
                businessId: currentBusiness?.id,
                type: 'SALE',
                paymentMethod,
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: item.product.price,
                    discount: 0,
                })),
                discount: 0,
                amountPaid: subtotal,
            });

            if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Sale Complete! 🎉',
                    `Total: ${formatCurrency(subtotal)}\nReference: ${res.data?.transaction?.reference}`,
                    [{ text: 'OK', onPress: () => { setCart([]); setShowCart(false); } }]
                );
            } else {
                Alert.alert('Error', res.error || 'Failed to complete sale');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to complete sale. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => {
        const inCart = cart.find(c => c.product.id === item.id);
        const isOutOfStock = item.quantity <= 0;

        return (
            <Pressable
                onPress={() => addToCart(item)}
                disabled={isOutOfStock}
                style={{ width: `${100 / numColumns}%` }}
                className="p-1.5"
            >
                <View
                    className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                    <View className="w-full aspect-square bg-gray-50 rounded-lg items-center justify-center overflow-hidden mb-2">
                        {item.image ? (
                            <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <MaterialCommunityIcons name="package-variant" size={32} color="#d1d5db" />
                        )}
                    </View>
                    <Text className="text-gray-900 text-sm font-medium" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className="text-green-600 text-sm font-bold mt-0.5">
                        {formatCurrency(item.price)}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-0.5">
                        {item.quantity} in stock
                    </Text>
                    {inCart && (
                        <View className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full items-center justify-center shadow-sm">
                            <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    const CartPanel = () => (
        <View className={`${isTablet ? 'w-80 border-l border-gray-200' : 'flex-1'} bg-gray-50`}>
            <View className="p-4 border-b border-gray-200 bg-white flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <MaterialCommunityIcons name="cart" size={22} color="#22c55e" />
                    <Text className="font-bold text-gray-900 ml-2 text-lg">Cart ({totalItems})</Text>
                </View>
                {cart.length > 0 && (
                    <Pressable 
                        onPress={clearCart}
                        className="bg-red-50 px-3 py-1 rounded-lg"
                    >
                        <Text className="text-red-500 text-sm font-medium">Clear</Text>
                    </Pressable>
                )}
            </View>

            <ScrollView className="flex-1 p-4">
                {cart.length === 0 ? (
                    <View className="items-center py-12">
                        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                            <MaterialCommunityIcons name="cart-outline" size={32} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-500 text-center">Your cart is empty</Text>
                        <Text className="text-gray-400 text-sm text-center mt-1">Tap products to add them</Text>
                    </View>
                ) : (
                    cart.map(item => (
                        <View
                            key={item.product.id}
                            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
                        >
                            <View className="flex-row items-start justify-between">
                                <View className="flex-1 mr-3">
                                    <Text className="text-gray-900 font-medium" numberOfLines={2}>
                                        {item.product.name}
                                    </Text>
                                    <Text className="text-green-600 font-bold mt-1">
                                        {formatCurrency(item.product.price)}
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => removeFromCart(item.product.id)}
                                    className="p-1"
                                >
                                    <MaterialCommunityIcons name="close" size={18} color="#9ca3af" />
                                </Pressable>
                            </View>
                            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <View className="flex-row items-center bg-gray-100 rounded-lg">
                                    <Pressable
                                        onPress={() => updateQuantity(item.product.id, -1)}
                                        className="w-9 h-9 items-center justify-center"
                                    >
                                        <MaterialCommunityIcons name="minus" size={18} color="#374151" />
                                    </Pressable>
                                    <Text className="text-gray-900 font-bold w-8 text-center">{item.quantity}</Text>
                                    <Pressable
                                        onPress={() => updateQuantity(item.product.id, 1)}
                                        className="w-9 h-9 items-center justify-center"
                                    >
                                        <MaterialCommunityIcons name="plus" size={18} color="#374151" />
                                    </Pressable>
                                </View>
                                <Text className="text-gray-900 font-bold text-lg">
                                    {formatCurrency(item.product.price * item.quantity)}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Payment Methods & Checkout */}
            {cart.length > 0 && (
                <View className="p-4 border-t border-gray-200 bg-white">
                    <Text className="text-gray-500 text-sm mb-2 font-medium">Payment Method</Text>
                    <View className="flex-row gap-2 mb-4">
                        {(['CASH', 'CARD', 'MOBILE_MONEY'] as const).map(method => (
                            <Pressable
                                key={method}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setPaymentMethod(method);
                                }}
                                className={`flex-1 py-2.5 rounded-xl border-2 ${
                                    paymentMethod === method
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <Text className={`text-center text-xs font-semibold ${
                                    paymentMethod === method ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                    {method === 'MOBILE_MONEY' ? 'MOBILE' : method}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-gray-500 text-base">Total</Text>
                        <Text className="text-2xl font-bold text-green-600">
                            {formatCurrency(subtotal)}
                        </Text>
                    </View>

                    <Pressable
                        onPress={handleCheckout}
                        disabled={cart.length === 0 || isSubmitting}
                        className={`py-4 rounded-xl items-center justify-center flex-row ${
                            isSubmitting ? 'bg-gray-300' : 'bg-green-500 active:bg-green-600'
                        }`}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-circle" size={22} color="white" />
                                <Text className="text-white font-bold text-base ml-2">Complete Sale</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-white px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4">
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
            </View>

            <View className="flex-1 flex-row">
                {/* Products Grid */}
                <View className={isTablet ? 'flex-1' : 'flex-1'}>
                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#22c55e" />
                            <Text className="text-gray-500 mt-2">Loading products...</Text>
                        </View>
                    ) : products.length === 0 ? (
                        <View className="flex-1 items-center justify-center">
                            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                                <MaterialCommunityIcons name="package-variant-closed" size={32} color="#9ca3af" />
                            </View>
                            <Text className="text-gray-500">No products found</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={products}
                            renderItem={renderProduct}
                            keyExtractor={(item) => item.id}
                            numColumns={numColumns}
                            key={numColumns}
                            contentContainerStyle={{ padding: 8 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Cart Panel - Side panel on tablet */}
                {isTablet && <CartPanel />}
            </View>

            {/* Mobile Cart FAB */}
            {!isTablet && cart.length > 0 && (
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowCart(true);
                    }}
                    className="absolute bottom-6 right-4 left-4 bg-green-500 rounded-2xl py-4 px-6 flex-row items-center justify-between shadow-lg"
                    style={{ elevation: 8 }}
                >
                    <View className="flex-row items-center">
                        <View className="w-8 h-8 bg-white/20 rounded-full items-center justify-center mr-3">
                            <Text className="text-white font-bold">{totalItems}</Text>
                        </View>
                        <Text className="text-white font-semibold">View Cart</Text>
                    </View>
                    <Text className="text-white font-bold text-lg">{formatCurrency(subtotal)}</Text>
                </Pressable>
            )}

            {/* Mobile Cart Modal */}
            <Modal
                visible={showCart && !isTablet}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView className="flex-1 bg-gray-50">
                    <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
                        <Text className="text-xl font-bold text-gray-900">Your Cart</Text>
                        <Pressable
                            onPress={() => setShowCart(false)}
                            className="w-10 h-10 items-center justify-center bg-gray-100 rounded-full"
                        >
                            <MaterialCommunityIcons name="close" size={22} color="#374151" />
                        </Pressable>
                    </View>
                    <CartPanel />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
