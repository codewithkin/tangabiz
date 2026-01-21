import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Image, Alert, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Spinner, Button, Chip, useThemeColor } from 'heroui-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { Container } from '@/components/container';
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
    const linkColor = useThemeColor('link');
    const foregroundColor = useThemeColor('foreground');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY'>('CASH');

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currentBusiness?.currency || 'USD',
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
                    [{ text: 'OK', onPress: () => setCart([]) }]
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
                className="w-1/3 p-1"
            >
                <Surface
                    variant="secondary"
                    className={`p-2 rounded-lg items-center ${isOutOfStock ? 'opacity-50' : ''}`}
                >
                    <View className="w-16 h-16 bg-gray-100 rounded-lg items-center justify-center overflow-hidden mb-1">
                        {item.image ? (
                            <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <MaterialCommunityIcons name="package-variant" size={24} color="#9ca3af" />
                        )}
                    </View>
                    <Text className="text-foreground text-xs font-medium text-center" numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className="text-link text-xs font-bold">
                        {formatCurrency(item.price)}
                    </Text>
                    {inCart && (
                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full items-center justify-center">
                            <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
                        </View>
                    )}
                </Surface>
            </Pressable>
        );
    };

    return (
        <Container>
            <Stack.Screen options={{ title: 'Point of Sale' }} />

            <View className="flex-1 flex-row">
                {/* Products Grid */}
                <View className="flex-1">
                    <View className="p-3">
                        <TextInput
                            placeholder="Search products..."
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="bg-gray-100 rounded-lg px-4 py-2"
                            style={{ color: foregroundColor }}
                        />
                    </View>

                    {isLoading ? (
                        <View className="flex-1 items-center justify-center">
                            <Spinner size="lg" />
                        </View>
                    ) : (
                        <FlatList
                            data={products}
                            renderItem={renderProduct}
                            keyExtractor={(item) => item.id}
                            numColumns={3}
                            contentContainerStyle={{ padding: 8 }}
                        />
                    )}
                </View>

                {/* Cart Panel */}
                <View className="w-80 bg-gray-50 border-l border-gray-200">
                    <View className="p-3 border-b border-gray-200 flex-row items-center justify-between">
                        <Text className="font-bold text-foreground">Cart ({cart.length})</Text>
                        {cart.length > 0 && (
                            <Pressable onPress={clearCart}>
                                <Text className="text-red-500 text-sm">Clear</Text>
                            </Pressable>
                        )}
                    </View>

                    <ScrollView className="flex-1 p-3">
                        {cart.length === 0 ? (
                            <View className="items-center py-8">
                                <MaterialCommunityIcons name="cart-outline" size={48} color="#9ca3af" />
                                <Text className="text-muted mt-2">Cart is empty</Text>
                            </View>
                        ) : (
                            cart.map(item => (
                                <Surface
                                    key={item.product.id}
                                    variant="secondary"
                                    className="p-3 rounded-lg mb-2"
                                >
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-1">
                                            <Text className="text-foreground font-medium" numberOfLines={1}>
                                                {item.product.name}
                                            </Text>
                                            <Text className="text-link text-sm">
                                                {formatCurrency(item.product.price)}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <Pressable
                                                onPress={() => updateQuantity(item.product.id, -1)}
                                                className="w-8 h-8 bg-gray-200 rounded items-center justify-center"
                                            >
                                                <MaterialCommunityIcons name="minus" size={18} color="#333" />
                                            </Pressable>
                                            <Text className="text-foreground font-bold mx-3">{item.quantity}</Text>
                                            <Pressable
                                                onPress={() => updateQuantity(item.product.id, 1)}
                                                className="w-8 h-8 bg-success rounded items-center justify-center"
                                            >
                                                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                                            </Pressable>
                                        </View>
                                    </View>
                                    <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
                                        <Text className="text-muted text-sm">Subtotal</Text>
                                        <Text className="text-foreground font-bold">
                                            {formatCurrency(item.product.price * item.quantity)}
                                        </Text>
                                    </View>
                                </Surface>
                            ))
                        )}
                    </ScrollView>

                    {/* Payment Methods */}
                    {cart.length > 0 && (
                        <View className="p-3 border-t border-gray-200">
                            <Text className="text-muted text-sm mb-2">Payment Method</Text>
                            <View className="flex-row space-x-2 mb-3">
                                {(['CASH', 'CARD', 'MOBILE_MONEY'] as const).map(method => (
                                    <Pressable
                                        key={method}
                                        onPress={() => setPaymentMethod(method)}
                                        className={`flex-1 p-2 rounded-lg border ${paymentMethod === method
                                            ? 'border-success bg-green-50'
                                            : 'border-gray-200'
                                            }`}
                                    >
                                        <Text className={`text-center text-xs font-medium ${paymentMethod === method ? 'text-success' : 'text-muted'
                                            }`}>
                                            {method.replace('_', ' ')}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Total & Checkout */}
                    <View className="p-3 border-t border-gray-200 bg-white">
                        <View className="flex-row justify-between mb-3">
                            <Text className="text-lg font-bold text-foreground">Total</Text>
                            <Text className="text-lg font-bold text-success">
                                {formatCurrency(subtotal)}
                            </Text>
                        </View>
                        <Button
                            variant="primary"
                            onPress={handleCheckout}
                            isDisabled={cart.length === 0 || isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <Button.Label>Complete Sale</Button.Label>
                            )}
                        </Button>
                    </View>
                </View>
            </View>
        </Container>
    );
}
