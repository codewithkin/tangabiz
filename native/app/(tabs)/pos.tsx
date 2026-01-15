// POS Screen - Create new sales
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    TextInput,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, haptics, toast, generateReference } from '@/lib/utils';

interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
    sku?: string;
    image?: string;
}

interface CartItem {
    product: Product;
    quantity: number;
    discount: number;
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
}

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';

export default function POSScreen() {
    const { currentBusiness, user } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Checkout modal state
    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [amountPaid, setAmountPaid] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch products
    const fetchProducts = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/products', {
                businessId: currentBusiness.id,
                limit: 100,
                search: searchQuery || undefined,
            });
            setProducts(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentBusiness, searchQuery]);

    // Fetch customers
    const fetchCustomers = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/customers', {
                businessId: currentBusiness.id,
                limit: 50,
                search: customerSearch || undefined,
            });
            setCustomers(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    }, [currentBusiness, customerSearch]);

    useEffect(() => {
        fetchProducts();
    }, [searchQuery]);

    useEffect(() => {
        if (showCustomerSearch) {
            fetchCustomers();
        }
    }, [showCustomerSearch, customerSearch]);

    // Cart calculations
    const subtotal = cart.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity - item.discount,
        0
    );
    const total = subtotal;
    const change = Number(amountPaid || 0) - total;

    // Add to cart
    const addToCart = (product: Product) => {
        haptics.light();
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.quantity) {
                    toast.error('Not enough stock', `Only ${product.quantity} available`);
                    return prev;
                }
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1, discount: 0 }];
        });
    };

    // Update quantity
    const updateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(prev =>
            prev.map(item => {
                if (item.product.id === productId) {
                    if (newQuantity > item.product.quantity) {
                        toast.error('Not enough stock');
                        return item;
                    }
                    return { ...item, quantity: newQuantity };
                }
                return item;
            })
        );
    };

    // Remove from cart
    const removeFromCart = (productId: string) => {
        haptics.medium();
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    // Clear cart
    const clearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to clear all items?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        setCart([]);
                        haptics.medium();
                    },
                },
            ]
        );
    };

    // Submit transaction
    const submitTransaction = async () => {
        if (cart.length === 0) return;
        if (paymentMethod === 'CASH' && change < 0) {
            toast.error('Insufficient amount', 'Amount paid is less than total');
            return;
        }

        setIsSubmitting(true);
        haptics.medium();

        try {
            const transactionData = {
                businessId: currentBusiness?.id,
                type: 'SALE',
                paymentMethod,
                customerId: selectedCustomer?.id,
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    discount: item.discount,
                })),
                amountPaid: Number(amountPaid) || total,
                notes,
            };

            const res = await api.post('/api/transactions', transactionData);

            if (res.success) {
                haptics.success();
                toast.success('Sale completed!', `Reference: ${res.data?.reference}`);
                setCart([]);
                setShowCheckout(false);
                setAmountPaid('');
                setSelectedCustomer(null);
                setNotes('');
                router.push(`/transactions/${res.data?.id}`);
            } else {
                toast.error('Failed to create sale', res.error);
            }
        } catch (error) {
            console.error('Transaction failed:', error);
            toast.error('Transaction failed', 'Please try again');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render product item
    const renderProduct = ({ item }: { item: Product }) => {
        const inCart = cart.find(c => c.product.id === item.id);
        const isOutOfStock = item.quantity === 0;

        return (
            <Pressable
                onPress={() => !isOutOfStock && addToCart(item)}
                disabled={isOutOfStock}
                className={`bg-white rounded-xl p-3 mr-3 mb-3 w-[140px] ${isOutOfStock ? 'opacity-50' : ''
                    }`}
            >
                <View className="w-full h-20 bg-gray-100 rounded-lg items-center justify-center mb-2">
                    <MaterialCommunityIcons
                        name="package-variant"
                        size={32}
                        color="#9ca3af"
                    />
                </View>
                <Text className="text-gray-900 font-medium text-sm" numberOfLines={2}>
                    {item.name}
                </Text>
                <Text className="text-green-600 font-bold mt-1">
                    {formatCurrency(item.price)}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                    Stock: {item.quantity}
                </Text>
                {inCart && (
                    <View className="absolute top-2 right-2 bg-green-500 w-6 h-6 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
                    </View>
                )}
            </Pressable>
        );
    };

    // Render cart item
    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View className="flex-row items-center py-3 border-b border-gray-100">
            <View className="flex-1">
                <Text className="text-gray-900 font-medium" numberOfLines={1}>
                    {item.product.name}
                </Text>
                <Text className="text-gray-500 text-sm">
                    {formatCurrency(item.product.price)} x {item.quantity}
                </Text>
            </View>
            <View className="flex-row items-center">
                <Pressable
                    onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                    <MaterialCommunityIcons name="minus" size={18} color="#374151" />
                </Pressable>
                <Text className="mx-3 text-gray-900 font-medium w-6 text-center">
                    {item.quantity}
                </Text>
                <Pressable
                    onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                    <MaterialCommunityIcons name="plus" size={18} color="#374151" />
                </Pressable>
                <Pressable
                    onPress={() => removeFromCart(item.product.id)}
                    className="ml-3"
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#ef4444" />
                </Pressable>
            </View>
        </View>
    );

    const paymentMethods: { value: PaymentMethod; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
        { value: 'CASH', label: 'Cash', icon: 'cash' },
        { value: 'CARD', label: 'Card', icon: 'credit-card' },
        { value: 'MOBILE_MONEY', label: 'Mobile', icon: 'cellphone' },
        { value: 'BANK_TRANSFER', label: 'Bank', icon: 'bank' },
    ];

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'New Sale',
                    headerRight: () =>
                        cart.length > 0 ? (
                            <Pressable onPress={clearCart} className="mr-4">
                                <MaterialCommunityIcons name="delete-outline" size={24} color="#fff" />
                            </Pressable>
                        ) : null,
                }}
            />

            {/* Search Bar */}
            <View className="px-4 py-3 bg-white">
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
                    <MaterialCommunityIcons name="magnify" size={20} color="#9ca3af" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-900"
                        placeholder="Search products..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <View className="flex-1 flex-row">
                {/* Products Grid */}
                <View className="flex-[2] p-4">
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#22c55e" className="mt-10" />
                    ) : (
                        <FlatList
                            data={products.filter(p => p.quantity > 0 || cart.some(c => c.product.id === p.id))}
                            renderItem={renderProduct}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View className="items-center justify-center py-20">
                                    <MaterialCommunityIcons name="package-variant" size={48} color="#d1d5db" />
                                    <Text className="text-gray-400 mt-2">No products found</Text>
                                </View>
                            }
                        />
                    )}
                </View>

                {/* Cart Panel */}
                <View className="flex-1 bg-white border-l border-gray-200 min-w-[200px]">
                    <View className="p-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-900">Cart</Text>
                        <Text className="text-gray-500 text-sm">{cart.length} items</Text>
                    </View>

                    <FlatList
                        data={cart}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.product.id}
                        className="flex-1 px-4"
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10">
                                <MaterialCommunityIcons name="cart-outline" size={48} color="#d1d5db" />
                                <Text className="text-gray-400 mt-2 text-center">
                                    Tap products to add them
                                </Text>
                            </View>
                        }
                    />

                    {/* Cart Footer */}
                    <View className="p-4 border-t border-gray-100">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">Subtotal</Text>
                            <Text className="text-gray-900 font-medium">{formatCurrency(subtotal)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-gray-900 font-bold text-lg">Total</Text>
                            <Text className="text-green-600 font-bold text-lg">{formatCurrency(total)}</Text>
                        </View>
                        <Pressable
                            onPress={() => setShowCheckout(true)}
                            disabled={cart.length === 0}
                            className={`py-4 rounded-xl items-center ${cart.length === 0 ? 'bg-gray-200' : 'bg-green-500'
                                }`}
                        >
                            <Text className={`font-semibold ${cart.length === 0 ? 'text-gray-400' : 'text-white'}`}>
                                Checkout
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* Checkout Modal */}
            <Modal visible={showCheckout} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end"
                >
                    <Pressable
                        className="flex-1 bg-black/50"
                        onPress={() => setShowCheckout(false)}
                    />
                    <View className="bg-white rounded-t-3xl px-6 py-6 max-h-[85%]">
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View className="flex-row items-center justify-between mb-6">
                                <Text className="text-2xl font-bold text-gray-900">Checkout</Text>
                                <Pressable onPress={() => setShowCheckout(false)}>
                                    <MaterialCommunityIcons name="close" size={26} color="#9ca3af" />
                                </Pressable>
                            </View>

                            {/* Customer Selection */}
                            <Text className="text-gray-700 font-medium mb-2">Customer (Optional)</Text>
                            <Pressable
                                onPress={() => setShowCustomerSearch(true)}
                                className="bg-gray-100 rounded-xl p-4 mb-4 flex-row items-center justify-between"
                            >
                                <Text className={selectedCustomer ? 'text-gray-900' : 'text-gray-400'}>
                                    {selectedCustomer?.name || 'Walk-in Customer'}
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={20} color="#9ca3af" />
                            </Pressable>

                            {/* Payment Method */}
                            <Text className="text-gray-700 font-medium mb-2">Payment Method</Text>
                            <View className="flex-row mb-4">
                                {paymentMethods.map((method) => (
                                    <Pressable
                                        key={method.value}
                                        onPress={() => setPaymentMethod(method.value)}
                                        className={`flex-1 py-3 rounded-xl mr-2 items-center ${paymentMethod === method.value
                                                ? 'bg-green-500'
                                                : 'bg-gray-100'
                                            }`}
                                    >
                                        <MaterialCommunityIcons
                                            name={method.icon}
                                            size={22}
                                            color={paymentMethod === method.value ? '#fff' : '#6b7280'}
                                        />
                                        <Text
                                            className={`text-xs mt-1 ${paymentMethod === method.value ? 'text-white' : 'text-gray-600'
                                                }`}
                                        >
                                            {method.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Amount Paid (for cash) */}
                            {paymentMethod === 'CASH' && (
                                <>
                                    <Text className="text-gray-700 font-medium mb-2">Amount Paid</Text>
                                    <TextInput
                                        className="bg-gray-100 rounded-xl p-4 text-gray-900 text-lg mb-2"
                                        placeholder="0.00"
                                        placeholderTextColor="#9ca3af"
                                        value={amountPaid}
                                        onChangeText={setAmountPaid}
                                        keyboardType="decimal-pad"
                                    />
                                    {Number(amountPaid) >= total && (
                                        <View className="bg-green-50 rounded-xl p-3 mb-4">
                                            <Text className="text-green-700">
                                                Change: <Text className="font-bold">{formatCurrency(change)}</Text>
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Notes */}
                            <Text className="text-gray-700 font-medium mb-2">Notes (Optional)</Text>
                            <TextInput
                                className="bg-gray-100 rounded-xl p-4 text-gray-900 mb-4"
                                placeholder="Add notes..."
                                placeholderTextColor="#9ca3af"
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                            />

                            {/* Summary */}
                            <View className="bg-gray-50 rounded-xl p-4 mb-6">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-gray-500">Items</Text>
                                    <Text className="text-gray-900">{cart.length}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-900 font-bold text-lg">Total</Text>
                                    <Text className="text-green-600 font-bold text-lg">{formatCurrency(total)}</Text>
                                </View>
                            </View>

                            {/* Complete Button */}
                            <Pressable
                                onPress={submitTransaction}
                                disabled={isSubmitting || (paymentMethod === 'CASH' && change < 0)}
                                className={`py-4 rounded-xl items-center ${isSubmitting || (paymentMethod === 'CASH' && change < 0)
                                        ? 'bg-gray-300'
                                        : 'bg-green-500'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-semibold text-lg">Complete Sale</Text>
                                )}
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Customer Search Modal */}
            <Modal visible={showCustomerSearch} animationType="slide" transparent>
                <Pressable
                    className="flex-1 bg-black/50"
                    onPress={() => setShowCustomerSearch(false)}
                />
                <View className="bg-white rounded-t-3xl px-6 py-6 max-h-[70%]">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Select Customer</Text>

                    <TextInput
                        className="bg-gray-100 rounded-xl px-4 py-3 mb-4"
                        placeholder="Search customers..."
                        placeholderTextColor="#9ca3af"
                        value={customerSearch}
                        onChangeText={setCustomerSearch}
                    />

                    <Pressable
                        onPress={() => {
                            setSelectedCustomer(null);
                            setShowCustomerSearch(false);
                        }}
                        className="py-3 border-b border-gray-100"
                    >
                        <Text className="text-gray-600">Walk-in Customer</Text>
                    </Pressable>

                    <FlatList
                        data={customers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => {
                                    setSelectedCustomer(item);
                                    setShowCustomerSearch(false);
                                }}
                                className="py-3 border-b border-gray-100"
                            >
                                <Text className="text-gray-900 font-medium">{item.name}</Text>
                                {item.phone && (
                                    <Text className="text-gray-500 text-sm">{item.phone}</Text>
                                )}
                            </Pressable>
                        )}
                    />
                </View>
            </Modal>
        </View>
    );
}
