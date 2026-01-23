import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface } from 'heroui-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { api, productsApi, customersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card as CardItem } from '@/components/ui/card';
import { formatCurrency, formatCurrencyAsYouType, formatPhoneNumberAsYouType, formatPhoneNumber, parseCurrencyValue } from '@/lib/utils';

/**
 * New sale creation screen with comprehensive form for recording transactions. Includes customer selection, product items with quantity and pricing, payment method options, discount management, and automatic total calculation with real-time validation.
 */

type TransactionItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
};

type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'OTHER';

type Product = {
    id: string;
    name: string;
    price: number;
    sku?: string;
};

type Customer = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
};

const NOTE_DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100];

export default function NewSaleScreen() {
    const router = useRouter();
    const { currentBusiness, user } = useAuthStore();
    const queryClient = useQueryClient();
    const { width } = useWindowDimensions();

    // Responsive layout
    const isTablet = width >= 768;
    const isLargeScreen = width >= 1024;

    const [items, setItems] = useState<TransactionItem[]>([]);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [discount, setDiscount] = useState<string>('0');
    const [amountPaid, setAmountPaid] = useState<string>('0');
    const [notes, setNotes] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Product selection states
    const [productMode, setProductMode] = useState<'search' | 'manual'>('search');
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [manualProductName, setManualProductName] = useState('');
    const [manualProductPrice, setManualProductPrice] = useState('');
    const [itemQuantity, setItemQuantity] = useState<number>(1);

    // Customer selection states
    const [customerMode, setCustomerMode] = useState<'search' | 'manual'>('search');
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [manualCustomerEmail, setManualCustomerEmail] = useState('');
    const [manualCustomerPhone, setManualCustomerPhone] = useState('');

    // Change tracking states
    const [trackChange, setTrackChange] = useState(false);
    const [selectedNote, setSelectedNote] = useState<number | null>(null);

    // Accordion states for collapsible sections
    const [isCustomerOpen, setIsCustomerOpen] = useState(true);
    const [isPaymentOpen, setIsPaymentOpen] = useState(true);
    const [isProductOpen, setIsProductOpen] = useState(true);
    const [isTransactionOpen, setIsTransactionOpen] = useState(true);

    // Calculate totals
    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + item.total, 0);
    }, [items]);

    const discountAmount = parseCurrencyValue(discount);
    const total = subtotal - discountAmount;

    // Calculate amount paid and change based on tracking mode
    const amountPaidValue = trackChange && selectedNote ? selectedNote : parseCurrencyValue(amountPaid);
    const change = amountPaidValue - total;

    // Fetch products when searching
    useEffect(() => {
        if (productMode === 'search' && productSearchQuery.length >= 1 && currentBusiness?.id) {
            setProductsLoading(true);
            productsApi.list(currentBusiness.id, { search: productSearchQuery, limit: 10 })
                .then((res) => {
                    setProducts(res.data?.products || []);
                    setShowProductDropdown(true);
                })
                .catch(console.error)
                .finally(() => setProductsLoading(false));
        } else {
            setProducts([]);
            setShowProductDropdown(false);
        }
    }, [productSearchQuery, productMode, currentBusiness?.id]);

    // Fetch customers when searching
    useEffect(() => {
        if (customerMode === 'search' && customerSearchQuery.length >= 1 && currentBusiness?.id) {
            setCustomersLoading(true);
            customersApi.list(currentBusiness.id, { search: customerSearchQuery, limit: 10 })
                .then((res) => {
                    setCustomers(res.data?.customers || []);
                    setShowCustomerDropdown(true);
                })
                .catch(console.error)
                .finally(() => setCustomersLoading(false));
        } else {
            setCustomers([]);
            setShowCustomerDropdown(false);
        }
    }, [customerSearchQuery, customerMode, currentBusiness?.id]);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setProductSearchQuery(product.name);
        setShowProductDropdown(false);
    };

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerId(customer.id);
        setCustomerSearchQuery(customer.name);
        setShowCustomerDropdown(false);
    };

    const handleAddItem = () => {
        let productId = '';
        let productName = '';
        let unitPrice = 0;

        if (productMode === 'search') {
            if (!selectedProduct) {
                setError('Please select a product');
                return;
            }
            productId = selectedProduct.id;
            productName = selectedProduct.name;
            unitPrice = selectedProduct.price;
        } else {
            if (!manualProductName.trim()) {
                setError('Please enter a product name');
                return;
            }
            const price = parseCurrencyValue(manualProductPrice);
            if (!price || price <= 0) {
                setError('Please enter a valid price');
                return;
            }
            productId = `manual-${Date.now()}`;
            productName = manualProductName.trim();
            unitPrice = price;
        }

        if (itemQuantity < 1) {
            setError('Quantity must be at least 1');
            return;
        }

        const itemTotal = itemQuantity * unitPrice;

        const newItem: TransactionItem = {
            productId,
            productName,
            quantity: itemQuantity,
            unitPrice,
            discount: 0,
            total: itemTotal,
        };

        setItems([...items, newItem]);

        // Reset item inputs
        setSelectedProduct(null);
        setProductSearchQuery('');
        setManualProductName('');
        setManualProductPrice('');
        setItemQuantity(1);
        setError(null);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleUpdateQuantity = (index: number, delta: number) => {
        setItems(items.map((item, i) => {
            if (i === index) {
                const newQuantity = Math.max(1, item.quantity + delta);
                return {
                    ...item,
                    quantity: newQuantity,
                    total: newQuantity * item.unitPrice - item.discount,
                };
            }
            return item;
        }));
    };

    const handleSaveSale = async () => {
        if (!currentBusiness?.id) {
            setError('No business selected');
            return;
        }

        if (items.length === 0) {
            setError('Please add at least one item');
            return;
        }

        if (total <= 0) {
            setError('Total must be greater than 0');
            return;
        }

        if (amountPaidValue < total) {
            setError('Amount paid must be at least the total amount');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create customer if manual mode and data provided
            let finalCustomerId = customerId;
            if (customerMode === 'manual' && manualCustomerName.trim()) {
                const customerRes = await customersApi.create({
                    businessId: currentBusiness.id,
                    name: manualCustomerName.trim(),
                    email: manualCustomerEmail.trim() || null,
                    phone: manualCustomerPhone.trim() || null,
                });
                finalCustomerId = customerRes.data?.customer?.id || null;
            }

            // Build notes with change tracking info
            let finalNotes = notes.trim();
            if (trackChange && selectedNote && change > 0) {
                const changeNote = `Payment: ${formatCurrency(selectedNote)} note, Change: ${formatCurrency(change)}`;
                finalNotes = finalNotes ? `${finalNotes}\n${changeNote}` : changeNote;
            }

            const saleData = {
                businessId: currentBusiness.id,
                customerId: finalCustomerId || null,
                type: 'SALE' as const,
                paymentMethod,
                items: items.map(item => ({
                    productId: item.productId.startsWith('manual-') ? null : item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                })),
                discount: discountAmount,
                amountPaid: amountPaidValue,
                notes: finalNotes || null,
            };

            const response = await api.post('/api/transactions', saleData);

            if (response.data?.transaction?.id) {
                // Invalidate relevant queries to refresh data
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['revenue'] });
                queryClient.invalidateQueries({ queryKey: ['sales'] });

                // Navigate to sale details page
                router.replace(`/sale/${response.data.transaction.id}` as any);
            }
        } catch (err: any) {
            console.error('Failed to create sale:', err);
            setError(err.response?.data?.error || 'Failed to create sale. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Card wrapper for responsive layout
    const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
        <Surface className={`p-4 rounded-2xl ${className}`}>
            {children}
        </Surface>
    );

    // Collapsible section component
    const CollapsibleSection = ({ 
        title, 
        isOpen, 
        onToggle, 
        children,
        className = '',
        hasError = false
    }: { 
        title: string; 
        isOpen: boolean; 
        onToggle: () => void; 
        children: React.ReactNode;
        className?: string;
        hasError?: boolean;
    }) => (
        <Surface className={`rounded-2xl ${hasError ? 'border-2 border-red-500' : ''} ${className}`}>
            <Pressable 
                className="p-4 flex-row items-center justify-between active:opacity-70"
                onPress={onToggle}
            >
                <Text className={`text-lg font-bold ${hasError ? 'text-red-600' : 'text-gray-900'}`}>
                    {title}
                </Text>
                <MaterialCommunityIcons 
                    name={isOpen ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={hasError ? '#dc2626' : '#6b7280'}
                />
            </Pressable>
            {isOpen && (
                <Animated.View entering={FadeIn.duration(200)} className="px-4 pb-4">
                    {children}
                </Animated.View>
            )}
            {hasError && !isOpen && (
                <Text className="px-4 pb-3 text-sm text-red-600">
                    Please fill in the missing details
                </Text>
            )}
        </Surface>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
            <View className="h-full mt-8">
                <ScrollView className="flex-1">
                    <View className="p-4 gap-6">
                        {/* Header */}
                        <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center gap-3">
                            <Pressable
                                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 active:opacity-70"
                                onPress={() => router.back()}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={24} color="#6b7280" />
                            </Pressable>
                            <View className="flex-1">
                                <Text className="text-xl font-black text-gray-900">New Sale</Text>
                                <Text className="text-sm font-light text-gray-500">Create a new transaction</Text>
                            </View>
                        </Animated.View>

                        {/* Responsive Grid Container */}
                        <View className={isTablet ? 'flex-row flex-wrap gap-4' : 'gap-6'}>
                            {/* Left Column on Tablet */}
                            <View className={isTablet ? (isLargeScreen ? 'flex-1 min-w-100' : 'w-full') : ''}>
                                {/* Customer Details Section */}
                                <Animated.View entering={SlideInUp.duration(500).delay(50)} className="mb-4">
                                    <CollapsibleSection
                                        title="Customer Details"
                                        isOpen={isCustomerOpen}
                                        onToggle={() => setIsCustomerOpen(!isCustomerOpen)}
                                    >
                                        {/* Mode Toggle */}
                                        <View className="flex-row gap-2 mb-3">
                                            <Pressable
                                                className={`flex-1 py-2 rounded-xl items-center ${customerMode === 'search' ? 'bg-green-500' : 'bg-gray-100'}`}
                                                onPress={() => setCustomerMode('search')}
                                            >
                                                <Text className={customerMode === 'search' ? 'text-white font-medium' : 'text-gray-700'}>
                                                    Select Existing
                                                </Text>
                                            </Pressable>
                                            <Pressable
                                                className={`flex-1 py-2 rounded-xl items-center ${customerMode === 'manual' ? 'bg-green-500' : 'bg-gray-100'}`}
                                                onPress={() => setCustomerMode('manual')}
                                            >
                                                <Text className={customerMode === 'manual' ? 'text-white font-medium' : 'text-gray-700'}>
                                                    Add New
                                                </Text>
                                            </Pressable>
                                        </View>

                                        {customerMode === 'search' ? (
                                            <View>
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="Search customers..."
                                                    placeholderTextColor="#9ca3af"
                                                    value={customerSearchQuery}
                                                    onChangeText={setCustomerSearchQuery}
                                                />
                                                {showCustomerDropdown && (
                                                    <View className="bg-gray-50 rounded-xl mt-2 max-h-40 overflow-hidden">
                                                        {customersLoading ? (
                                                            <View className="p-4 items-center">
                                                                <ActivityIndicator size="small" color="#22c55e" />
                                                            </View>
                                                        ) : customers.length > 0 ? (
                                                            customers.map((customer) => (
                                                                <Pressable
                                                                    key={customer.id}
                                                                    className="p-3 border-b border-gray-200 active:bg-gray-100"
                                                                    onPress={() => handleSelectCustomer(customer)}
                                                                >
                                                                    <Text className="font-medium text-gray-900">{customer.name}</Text>
                                                                    {customer.email && (
                                                                        <Text className="text-sm text-gray-500">{customer.email}</Text>
                                                                    )}
                                                                </Pressable>
                                                            ))
                                                        ) : (
                                                            <View className="p-4">
                                                                <Text className="text-gray-500 text-center text-sm">
                                                                    You don't have any customers yet
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                                {selectedCustomer && (
                                                    <View className="mt-2 p-3 bg-green-50 rounded-xl flex-row items-center justify-between">
                                                        <View>
                                                            <Text className="font-medium text-green-800">{selectedCustomer.name}</Text>
                                                            {selectedCustomer.email && (
                                                                <Text className="text-sm text-green-600">{selectedCustomer.email}</Text>
                                                            )}
                                                        </View>
                                                        <Pressable onPress={() => {
                                                            setSelectedCustomer(null);
                                                            setCustomerId(null);
                                                            setCustomerSearchQuery('');
                                                        }}>
                                                            <MaterialCommunityIcons name="close-circle" size={20} color="#22c55e" />
                                                        </Pressable>
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <View className="gap-3">
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="Customer name *"
                                                    placeholderTextColor="#9ca3af"
                                                    value={manualCustomerName}
                                                    onChangeText={setManualCustomerName}
                                                />
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="Email (optional)"
                                                    placeholderTextColor="#9ca3af"
                                                    value={manualCustomerEmail}
                                                    onChangeText={setManualCustomerEmail}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                />
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="Phone (optional)"
                                                    placeholderTextColor="#9ca3af"
                                                    value={manualCustomerPhone}
                                                    onChangeText={(text) => setManualCustomerPhone(formatPhoneNumberAsYouType(text))}
                                                    keyboardType="phone-pad"
                                                />
                                            </View>
                                        )}
                                    </CollapsibleSection>
                                </Animated.View>

                                {/* Payment Method Selection */}
                                <Animated.View entering={SlideInUp.duration(500).delay(100)} className="mb-4">
                                    <CardItem>
                                        <Text className="text-lg font-bold text-gray-900 ">Payment Method</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'OTHER'] as PaymentMethod[]).map((method) => (
                                                <Pressable
                                                    key={method}
                                                    className={`px-4 py-2 rounded-xl ${paymentMethod === method ? 'bg-green-500' : 'bg-gray-100'}`}
                                                    onPress={() => setPaymentMethod(method)}
                                                >
                                                    <Text className={`font-medium ${paymentMethod === method ? 'text-white' : 'text-gray-700'}`}>
                                                        {method.replace(/_/g, ' ')}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </CardItem>
                                </Animated.View>
                            </View>

                            {/* Right Column on Tablet */}
                            <View className={isTablet ? (isLargeScreen ? 'flex-1 min-w-100' : 'w-full') : ''}>
                                {/* Add Product Section */}
                                <Animated.View entering={SlideInUp.duration(500).delay(200)} className="mb-4">
                                    <CardItem>
                                        <Text className="text-lg font-bold text-gray-900 ">Add Product</Text>

                                        {/* Mode Toggle */}
                                        <View className="flex-row gap-2 ">
                                            <Pressable
                                                className={`flex-1 py-2 rounded-xl items-center ${productMode === 'search' ? 'bg-green-500' : 'bg-gray-100'}`}
                                                onPress={() => setProductMode('search')}
                                            >
                                                <Text className={productMode === 'search' ? 'text-white font-medium' : 'text-gray-700'}>
                                                    Select Product
                                                </Text>
                                            </Pressable>
                                            <Pressable
                                                className={`flex-1 py-2 rounded-xl items-center ${productMode === 'manual' ? 'bg-green-500' : 'bg-gray-100'}`}
                                                onPress={() => setProductMode('manual')}
                                            >
                                                <Text className={productMode === 'manual' ? 'text-white font-medium' : 'text-gray-700'}>
                                                    Enter Manually
                                                </Text>
                                            </Pressable>
                                        </View>

                                        <View className="gap-3">
                                            {productMode === 'search' ? (
                                                <View>
                                                    <TextInput
                                                        className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                        placeholder="Search products..."
                                                        placeholderTextColor="#9ca3af"
                                                        value={productSearchQuery}
                                                        onChangeText={setProductSearchQuery}
                                                    />
                                                    {showProductDropdown && (
                                                        <View className="bg-gray-50 rounded-xl mt-2 max-h-40 overflow-hidden">
                                                            {productsLoading ? (
                                                                <View className="p-4 items-center">
                                                                    <ActivityIndicator size="small" color="#22c55e" />
                                                                </View>
                                                            ) : products.length > 0 ? (
                                                                products.map((product) => (
                                                                    <Pressable
                                                                        key={product.id}
                                                                        className="p-3 border-b border-gray-200 active:bg-gray-100 flex-row justify-between"
                                                                        onPress={() => handleSelectProduct(product)}
                                                                    >
                                                                        <Text className="font-medium text-gray-900 flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">
                                                                            {product.name}
                                                                        </Text>
                                                                        <Text className="font-bold text-green-600">{formatCurrency(product.price)}</Text>
                                                                    </Pressable>
                                                                ))
                                                            ) : (
                                                                <View className="p-4">
                                                                    <Text className="text-gray-500 text-center text-sm">
                                                                        You don't have any products yet
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}
                                                    {selectedProduct && (
                                                        <View className="mt-2 p-3 bg-green-50 rounded-xl flex-row items-center justify-between">
                                                            <View className="flex-1 mr-2">
                                                                <Text className="font-medium text-green-800" numberOfLines={1} ellipsizeMode="tail">
                                                                    {selectedProduct.name}
                                                                </Text>
                                                                <Text className="text-sm text-green-600">{formatCurrency(selectedProduct.price)}</Text>
                                                            </View>
                                                            <Pressable onPress={() => {
                                                                setSelectedProduct(null);
                                                                setProductSearchQuery('');
                                                            }}>
                                                                <MaterialCommunityIcons name="close-circle" size={20} color="#22c55e" />
                                                            </Pressable>
                                                        </View>
                                                    )}
                                                </View>
                                            ) : (
                                                <View className="gap-3">
                                                    <TextInput
                                                        className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                        placeholder="Product name"
                                                        placeholderTextColor="#9ca3af"
                                                        value={manualProductName}
                                                        onChangeText={setManualProductName}
                                                    />
                                                    <TextInput
                                                        className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                        placeholder="Price"
                                                        placeholderTextColor="#9ca3af"
                                                        value={manualProductPrice}
                                                        onChangeText={(text) => setManualProductPrice(formatCurrencyAsYouType(text))}
                                                        keyboardType="decimal-pad"
                                                    />
                                                </View>
                                            )}

                                            {/* Quantity Selector */}
                                            <View>
                                                <Text className="text-sm font-medium text-gray-700 mb-2">Quantity</Text>
                                                <View className="flex-row items-center gap-3">
                                                    <Pressable
                                                        className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
                                                        onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                                                    >
                                                        <MaterialCommunityIcons name="minus" size={20} color="#374151" />
                                                    </Pressable>
                                                    <View className="flex-1 bg-gray-100 px-4 py-3 rounded-xl items-center">
                                                        <Text className="text-lg font-bold text-gray-900">{itemQuantity}</Text>
                                                    </View>
                                                    <Pressable
                                                        className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
                                                        onPress={() => setItemQuantity(itemQuantity + 1)}
                                                    >
                                                        <MaterialCommunityIcons name="plus" size={20} color="#374151" />
                                                    </Pressable>
                                                </View>
                                            </View>

                                            <Pressable
                                                className="bg-green-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                                                onPress={handleAddItem}
                                            >
                                                <MaterialCommunityIcons name="plus" size={20} color="white" />
                                                <Text className="text-white font-bold">Add Item</Text>
                                            </Pressable>
                                        </View>
                                    </CardItem>
                                </Animated.View>
                            </View>
                        </View>

                        {/* Items List - Full Width */}
                        {items.length > 0 && (
                            <Animated.View entering={SlideInUp.duration(500).delay(300)}>
                                <CardItem>
                                    <Text className="text-lg font-bold text-gray-900 ">Items ({items.length})</Text>
                                    <View className="gap-2">
                                        {items.map((item, index) => (
                                            <View
                                                key={index}
                                                className="bg-gray-50 p-3 rounded-xl flex-row items-center justify-between"
                                            >
                                                <View className="flex-1">
                                                    <Text className="font-bold text-gray-900" numberOfLines={2} ellipsizeMode="tail">
                                                        {item.productName}
                                                    </Text>
                                                    <Text className="text-sm font-light text-gray-500">
                                                        {formatCurrency(item.unitPrice)} each
                                                    </Text>
                                                </View>
                                                <View className="flex-row items-center gap-2">
                                                    <Pressable
                                                        className="w-8 h-8 rounded-lg bg-gray-200 items-center justify-center"
                                                        onPress={() => handleUpdateQuantity(index, -1)}
                                                    >
                                                        <MaterialCommunityIcons name="minus" size={16} color="#374151" />
                                                    </Pressable>
                                                    <Text className="font-bold text-gray-900 w-8 text-center">{item.quantity}</Text>
                                                    <Pressable
                                                        className="w-8 h-8 rounded-lg bg-gray-200 items-center justify-center"
                                                        onPress={() => handleUpdateQuantity(index, 1)}
                                                    >
                                                        <MaterialCommunityIcons name="plus" size={16} color="#374151" />
                                                    </Pressable>
                                                    <Text className="font-bold text-gray-900 ml-2 w-20 text-right">{formatCurrency(item.total)}</Text>
                                                    <Pressable onPress={() => handleRemoveItem(index)}>
                                                        <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </CardItem>
                            </Animated.View>
                        )}

                        {/* Transaction Details and Summary Row on Tablet */}
                        <View className={isTablet ? 'flex-row gap-4' : 'gap-6'}>
                            {/* Transaction Details */}
                            <Animated.View entering={SlideInUp.duration(500).delay(400)} className={isTablet ? 'flex-1' : ''}>
                                <CardItem>
                                    <Text className="text-lg font-bold text-gray-900 ">Transaction Details</Text>

                                    <View className="gap-3">
                                        <View>
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Total Discount</Text>
                                            <TextInput
                                                className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                placeholder="0.00"
                                                placeholderTextColor="#9ca3af"
                                                value={discount}
                                                onChangeText={(text) => setDiscount(formatCurrencyAsYouType(text))}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>

                                        {/* Track Change Toggle */}
                                        <View className="flex-row items-center justify-between py-2">
                                            <Text className="text-gray-700 font-medium">
                                                Track cash change
                                            </Text>
                                            <Switch
                                                checked={trackChange}
                                                onCheckedChange={setTrackChange}
                                                nativeID="track-change"
                                            />
                                        </View>

                                        {trackChange ? (
                                            <View>
                                                <Text className="text-sm font-medium text-gray-700 mb-2">Select Note Denomination</Text>
                                                <View className="flex-row flex-wrap gap-2">
                                                    {NOTE_DENOMINATIONS.map((note) => (
                                                        <Pressable
                                                            key={note}
                                                            className={`px-4 py-2 rounded-xl ${selectedNote === note ? 'bg-green-500' : 'bg-gray-100'}`}
                                                            onPress={() => setSelectedNote(note)}
                                                        >
                                                            <Text className={`font-medium ${selectedNote === note ? 'text-white' : 'text-gray-700'}`}>
                                                                ${note}
                                                            </Text>
                                                        </Pressable>
                                                    ))}
                                                </View>
                                            </View>
                                        ) : (
                                            <View>
                                                <Text className="text-sm font-medium text-gray-700 mb-1">Amount Paid</Text>
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="0.00"
                                                    placeholderTextColor="#9ca3af"
                                                    value={amountPaid}
                                                    onChangeText={(text) => setAmountPaid(formatCurrencyAsYouType(text))}
                                                    keyboardType="decimal-pad"
                                                />
                                            </View>
                                        )}

                                        <View>
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Notes (Optional)</Text>
                                            <TextInput
                                                className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                placeholder="Add notes..."
                                                placeholderTextColor="#9ca3af"
                                                value={notes}
                                                onChangeText={setNotes}
                                                multiline
                                                numberOfLines={3}
                                                textAlignVertical="top"
                                            />
                                        </View>
                                    </View>
                                </CardItem>
                            </Animated.View>

                            {/* Summary */}
                            <Animated.View entering={SlideInUp.duration(500).delay(500)} className={isTablet ? 'flex-1' : ''}>
                                <Surface className="p-4 rounded-2xl bg-green-50 border border-green-200">
                                    <Text className="text-lg font-bold text-gray-900 ">Summary</Text>
                                    <View className="gap-2">
                                        <View className="flex-row justify-between">
                                            <Text className="font-medium text-gray-700">Subtotal:</Text>
                                            <Text className="font-bold text-gray-900">{formatCurrency(subtotal)}</Text>
                                        </View>
                                        {discountAmount > 0 && (
                                            <View className="flex-row justify-between">
                                                <Text className="font-medium text-gray-700">Discount:</Text>
                                                <Text className="font-bold text-red-600">-{formatCurrency(discountAmount)}</Text>
                                            </View>
                                        )}
                                        <View className="flex-row justify-between pt-2 border-t border-green-200">
                                            <Text className="text-lg font-black text-gray-900">Total:</Text>
                                            <Text className="text-lg font-black text-green-600">{formatCurrency(total)}</Text>
                                        </View>
                                        {amountPaidValue > 0 && (
                                            <>
                                                <View className="flex-row justify-between">
                                                    <Text className="font-medium text-gray-700">
                                                        {trackChange && selectedNote ? `$${selectedNote} Note:` : 'Amount Paid:'}
                                                    </Text>
                                                    <Text className="font-bold text-gray-900">{formatCurrency(amountPaidValue)}</Text>
                                                </View>
                                                {change > 0 && (
                                                    <View className="flex-row justify-between">
                                                        <Text className="font-medium text-gray-700">Change:</Text>
                                                        <Text className="font-bold text-green-600">{formatCurrency(change)}</Text>
                                                    </View>
                                                )}
                                            </>
                                        )}
                                    </View>
                                </Surface>
                            </Animated.View>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <Animated.View entering={SlideInUp.duration(300)}>
                                <Surface className="p-4 rounded-xl bg-red-50 border border-red-200">
                                    <View className="flex-row items-center gap-2">
                                        <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                                        <Text className="flex-1 text-sm font-medium text-red-700">{error}</Text>
                                    </View>
                                </Surface>
                            </Animated.View>
                        )}

                        {/* Save Button */}
                        <Animated.View entering={SlideInUp.duration(500).delay(600)} className={isTablet ? 'items-end' : ''}>
                            <Pressable
                                className={`bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80 ${isTablet ? 'w-fit px-8' : 'w-full'} ${isLoading ? 'opacity-70' : ''}`}
                                onPress={handleSaveSale}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check" size={24} color="white" />
                                        <Text className="text-white font-black text-lg">Save Sale</Text>
                                    </>
                                )}
                            </Pressable>
                        </Animated.View>

                        {/* Bottom padding for mobile */}
                        <View className="h-8" />
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
