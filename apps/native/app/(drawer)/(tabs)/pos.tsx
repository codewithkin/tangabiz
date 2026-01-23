import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Image, Alert, TextInput, useWindowDimensions, ActivityIndicator, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/auth';
import { productsApi, transactionsApi, categoriesApi } from '@/lib/api';

interface Product {
    id: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    sku?: string;
    category?: { id: string; name: string };
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function POS() {
    const { currentBusiness } = useAuthStore();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY'>('CASH');
    const [showCart, setShowCart] = useState(false);

    // Responsive layout
    const isTablet = width >= 768;
    const numColumns = isTablet ? 4 : 2;

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories', currentBusiness?.id],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await categoriesApi.list(currentBusiness.id);
            return res.data;
        },
        enabled: !!currentBusiness?.id,
    });

    const categories: Category[] = categoriesData?.categories || [];

    const { data, isLoading } = useQuery({
        queryKey: ['pos-products', currentBusiness?.id, searchQuery, selectedCategory],
        queryFn: async () => {
            if (!currentBusiness?.id) return null;
            const res = await productsApi.list(currentBusiness.id, {
                search: searchQuery || undefined,
                categoryId: selectedCategory || undefined,
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
            <View style={{ width: `${100 / numColumns}%` }} className="p-2">
                <View
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                    {/* Product Image - Tappable to add */}
                    <Pressable
                        onPress={() => addToCart(item)}
                        disabled={isOutOfStock}
                    >
                        <View className="w-full aspect-square bg-gray-50 items-center justify-center overflow-hidden">
                            {item.image ? (
                                <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <MaterialCommunityIcons name="package-variant" size={40} color="#d1d5db" />
                            )}
                        </View>
                    </Pressable>

                    {/* Product Info */}
                    <View className="p-3">
                        <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.category && (
                            <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                                {item.category.name}
                            </Text>
                        )}
                        <View className="flex-row items-center justify-between mt-2">
                            <Text className="text-green-600 font-bold">
                                {formatCurrency(item.price)}
                            </Text>

                            {/* Quantity Controls - Like the design */}
                            {inCart ? (
                                <View className="flex-row items-center bg-gray-100 rounded-lg">
                                    <Pressable
                                        onPress={() => updateQuantity(item.id, -1)}
                                        className="w-7 h-7 items-center justify-center"
                                    >
                                        <MaterialCommunityIcons name="minus" size={14} color="#374151" />
                                    </Pressable>
                                    <Text className="text-gray-900 font-bold text-sm w-6 text-center">{inCart.quantity}</Text>
                                    <Pressable
                                        onPress={() => updateQuantity(item.id, 1)}
                                        className="w-7 h-7 items-center justify-center"
                                    >
                                        <MaterialCommunityIcons name="plus" size={14} color="#22c55e" />
                                    </Pressable>
                                </View>
                            ) : (
                                <Pressable
                                    onPress={() => addToCart(item)}
                                    disabled={isOutOfStock}
                                    className="w-7 h-7 bg-green-500 rounded-full items-center justify-center"
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color="white" />
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const CartPanel = () => (
        <View className={`${isTablet ? 'w-80 border-l border-gray-200' : 'flex-1'} bg-white`}>
            <View className="p-4 border-b border-gray-200 bg-white flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-2">
                        <MaterialCommunityIcons name="receipt" size={20} color="#22c55e" />
                    </View>
                    <View>
                        <Text className="font-bold text-gray-900 text-lg">Ticket</Text>
                        <Text className="text-gray-400 text-xs">{totalItems} items</Text>
                    </View>
                </View>
                {cart.length > 0 && (
                    <Pressable
                        onPress={clearCart}
                        className="flex-row items-center"
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                        <Text className="text-red-500 text-sm font-medium ml-1">Clear</Text>
                    </Pressable>
                )}
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                {cart.length === 0 ? (
                    <View className="items-center py-12">
                        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="cart-outline" size={40} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-900 font-semibold text-lg">Your cart is empty</Text>
                        <Text className="text-gray-400 text-sm text-center mt-1">Tap products to add them</Text>
                    </View>
                ) : (
                    cart.map(item => (
                        <View
                            key={item.product.id}
                            className="flex-row bg-gray-50 rounded-2xl mb-3 overflow-hidden"
                        >
                            {/* Product Image */}
                            <View className="w-20 h-20 bg-gray-200 items-center justify-center">
                                {item.product.image ? (
                                    <Image source={{ uri: item.product.image }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <MaterialCommunityIcons name="package-variant" size={28} color="#9ca3af" />
                                )}
                            </View>

                            {/* Product Details */}
                            <View className="flex-1 p-3">
                                <View className="flex-row items-start justify-between">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                                            {item.product.name}
                                        </Text>
                                        <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                                            {item.product.category?.name || 'Product'}
                                        </Text>
                                    </View>
                                    <Pressable
                                        onPress={() => removeFromCart(item.product.id)}
                                        className="w-6 h-6 bg-red-50 rounded items-center justify-center"
                                    >
                                        <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
                                    </Pressable>
                                </View>

                                <View className="flex-row items-center justify-between mt-2">
                                    <Text className="text-green-600 font-bold">
                                        {formatCurrency(item.product.price)}
                                    </Text>

                                    {/* Quantity Controls - Like the design with - 1 + */}
                                    <View className="flex-row items-center">
                                        <Pressable
                                            onPress={() => updateQuantity(item.product.id, -1)}
                                            className="w-7 h-7 bg-gray-200 rounded-lg items-center justify-center"
                                        >
                                            <MaterialCommunityIcons name="minus" size={14} color="#374151" />
                                        </Pressable>
                                        <Text className="text-gray-900 font-bold text-sm w-8 text-center">{item.quantity}</Text>
                                        <Pressable
                                            onPress={() => updateQuantity(item.product.id, 1)}
                                            className="w-7 h-7 bg-green-500 rounded-lg items-center justify-center"
                                        >
                                            <MaterialCommunityIcons name="plus" size={14} color="white" />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Summary & Checkout - Like the design */}
            {cart.length > 0 && (
                <View className="p-4 border-t border-gray-200 bg-white">
                    {/* Summary Lines */}
                    <View className="space-y-2 mb-4">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500">Sub total :</Text>
                            <Text className="text-gray-900 font-medium">{formatCurrency(subtotal)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500">Discount :</Text>
                            <Text className="text-gray-900 font-medium">{formatCurrency(0)}</Text>
                        </View>
                        <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                            <Text className="text-gray-900 font-bold">total :</Text>
                            <Text className="text-gray-900 font-bold text-xl">{formatCurrency(subtotal)}</Text>
                        </View>
                    </View>

                    {/* Payment Method Pills */}
                    <View className="flex-row gap-2 mb-4">
                        {(['CASH', 'CARD', 'MOBILE_MONEY'] as const).map(method => (
                            <Pressable
                                key={method}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setPaymentMethod(method);
                                }}
                                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${paymentMethod === method
                                    ? 'bg-green-500'
                                    : 'bg-gray-100'
                                    }`}
                            >
                                <MaterialCommunityIcons
                                    name={method === 'CASH' ? 'cash' : method === 'CARD' ? 'credit-card-outline' : 'cellphone'}
                                    size={16}
                                    color={paymentMethod === method ? 'white' : '#6b7280'}
                                />
                                <Text className={`text-xs font-semibold ml-1 ${paymentMethod === method ? 'text-white' : 'text-gray-500'
                                    }`}>
                                    {method === 'MOBILE_MONEY' ? 'Mobile' : method.charAt(0) + method.slice(1).toLowerCase()}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Save & Charge Buttons - Like the design */}
                    <View className="flex-row gap-3">
                        <Pressable
                            onPress={() => {
                                // Save for later functionality
                                Alert.alert('Saved', 'Order saved for later');
                            }}
                            className="flex-1 py-4 rounded-xl items-center justify-center bg-gray-100 active:bg-gray-200"
                        >
                            <Text className="text-gray-700 font-semibold">Save</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleCheckout}
                            disabled={cart.length === 0 || isSubmitting}
                            className={`flex-1 py-4 rounded-xl items-center justify-center ${isSubmitting ? 'bg-gray-300' : 'bg-green-500 active:bg-green-600'
                                }`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text className="text-white font-bold">Charge</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header - Inspired by the design */}
            <View className="bg-white px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
                            <MaterialCommunityIcons name="grid" size={20} color="#374151" />
                        </View>
                        <Text className="text-gray-900 font-bold text-lg">Point of Sale</Text>
                    </View>
                    {/* Ticket Badge - like in the design */}
                    {cart.length > 0 && (
                        <Pressable
                            onPress={() => !isTablet && setShowCart(true)}
                            className="flex-row items-center bg-green-100 px-4 py-2 rounded-full"
                        >
                            <Text className="text-green-700 font-semibold mr-1">Ticket</Text>
                            <View className="bg-green-500 w-6 h-6 rounded-full items-center justify-center">
                                <Text className="text-white text-xs font-bold">{totalItems}</Text>
                            </View>
                        </Pressable>
                    )}
                </View>

                {/* Search Bar */}
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

            {/* Category Pills - Horizontal scroll like in the design */}
            {categories.length > 0 && (
                <View className="bg-white px-4 py-3 border-b border-gray-100">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectedCategory(null);
                            }}
                            className={`px-4 py-2 rounded-xl mr-2 ${selectedCategory === null ? 'bg-green-500' : 'bg-gray-100'
                                }`}
                        >
                            <Text className={`font-medium ${selectedCategory === null ? 'text-white' : 'text-gray-700'
                                }`}>
                                All Items
                            </Text>
                        </Pressable>
                        {categories.map((cat) => (
                            <Pressable
                                key={cat.id}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedCategory(cat.id === selectedCategory ? null : cat.id);
                                }}
                                className={`px-4 py-2 rounded-xl mr-2 ${selectedCategory === cat.id ? 'bg-green-500' : 'bg-gray-100'
                                    }`}
                            >
                                <Text className={`font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-700'
                                    }`}>
                                    {cat.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}

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
                            contentContainerStyle={{ padding: 8, paddingBottom: cart.length > 0 && !isTablet ? 100 : 24 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Cart Panel - Side panel on tablet */}
                {isTablet && <CartPanel />}
            </View>

            {/* Mobile Cart FAB - Styled like the "Save/Charge" buttons in design */}
            {!isTablet && cart.length > 0 && (
                <View className="absolute bottom-6 right-4 left-4 flex-row bg-gray-900 rounded-2xl overflow-hidden shadow-lg" style={{ elevation: 8 }}>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowCart(true);
                        }}
                        className="flex-1 py-4 px-6 flex-row items-center justify-center border-r border-gray-700"
                    >
                        <MaterialCommunityIcons name="content-save-outline" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">Save</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setShowCart(true);
                        }}
                        className="flex-1 py-4 px-6 flex-row items-center justify-center bg-green-500"
                    >
                        <Text className="text-white font-bold">Charge {formatCurrency(subtotal)}</Text>
                    </Pressable>
                </View>
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
