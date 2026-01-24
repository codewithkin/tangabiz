import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface } from 'heroui-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { api, productsApi, customersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQueryClient } from '@tanstack/react-query';
import { Switch } from '@/components/ui/switch';
import { Card as CardItem } from '@/components/ui/card';
import { formatCurrency, parseCurrencyValue } from '@/lib/utils';

/**
 * New sale creation screen - Refactored with reducer pattern and custom hooks
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

// State shape
type SaleState = {
    cart: TransactionItem[];
    customer: {
        mode: 'search' | 'manual';
        selectedId: string | null;
        selected: Customer | null;
        searchText: string;
        manualData: { name: string; email: string; phone: string };
    };
    product: {
        mode: 'search' | 'manual';
        selected: Product | null;
        searchText: string;
        manualData: { name: string; price: string };
        quantity: number;
    };
    payment: {
        method: PaymentMethod;
        discount: string;
        amountPaid: string;
        trackChange: boolean;
        notes: Map<number, number>;
        memo: string;
    };
    ui: {
        isSubmitting: boolean;
        errorMsg: string | null;
    };
};

// Action types
type Action =
    | { type: 'ADD_CART_ITEM'; payload: TransactionItem }
    | { type: 'REMOVE_CART_ITEM'; payload: number }
    | { type: 'UPDATE_ITEM_QTY'; payload: { index: number; delta: number } }
    | { type: 'SET_CUSTOMER_MODE'; payload: 'search' | 'manual' }
    | { type: 'SET_CUSTOMER_SEARCH'; payload: string }
    | { type: 'SELECT_CUSTOMER'; payload: Customer }
    | { type: 'CLEAR_CUSTOMER' }
    | { type: 'SET_MANUAL_CUSTOMER'; payload: { field: 'name' | 'email' | 'phone'; value: string } }
    | { type: 'SET_PRODUCT_MODE'; payload: 'search' | 'manual' }
    | { type: 'SET_PRODUCT_SEARCH'; payload: string }
    | { type: 'SELECT_PRODUCT'; payload: Product }
    | { type: 'CLEAR_PRODUCT' }
    | { type: 'SET_MANUAL_PRODUCT'; payload: { field: 'name' | 'price'; value: string } }
    | { type: 'SET_ITEM_QTY'; payload: number }
    | { type: 'SET_PAYMENT_METHOD'; payload: PaymentMethod }
    | { type: 'SET_DISCOUNT'; payload: string }
    | { type: 'SET_AMOUNT_PAID'; payload: string }
    | { type: 'TOGGLE_TRACK_CHANGE' }
    | { type: 'UPDATE_NOTE_QTY'; payload: { note: number; delta: number } }
    | { type: 'SET_MEMO'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SUBMITTING'; payload: boolean }
    | { type: 'RESET_PRODUCT_FORM' };

// Initial state
const initialState: SaleState = {
    cart: [],
    customer: {
        mode: 'search',
        selectedId: null,
        selected: null,
        searchText: '',
        manualData: { name: '', email: '', phone: '' },
    },
    product: {
        mode: 'search',
        selected: null,
        searchText: '',
        manualData: { name: '', price: '' },
        quantity: 1,
    },
    payment: {
        method: 'CASH',
        discount: '0',
        amountPaid: '0',
        trackChange: false,
        notes: new Map(),
        memo: '',
    },
    ui: {
        isSubmitting: false,
        errorMsg: null,
    },
};

// Reducer function
function saleReducer(state: SaleState, action: Action): SaleState {
    switch (action.type) {
        case 'ADD_CART_ITEM':
            return { ...state, cart: [...state.cart, action.payload] };
        case 'REMOVE_CART_ITEM':
            return { ...state, cart: state.cart.filter((_, idx) => idx !== action.payload) };
        case 'UPDATE_ITEM_QTY': {
            const updatedCart = state.cart.map((item, idx) => {
                if (idx === action.payload.index) {
                    const qty = Math.max(1, item.quantity + action.payload.delta);
                    return { ...item, quantity: qty, total: qty * item.unitPrice - item.discount };
                }
                return item;
            });
            return { ...state, cart: updatedCart };
        }
        case 'SET_CUSTOMER_MODE':
            return { ...state, customer: { ...state.customer, mode: action.payload } };
        case 'SET_CUSTOMER_SEARCH':
            return { ...state, customer: { ...state.customer, searchText: action.payload } };
        case 'SELECT_CUSTOMER':
            return {
                ...state,
                customer: {
                    ...state.customer,
                    selected: action.payload,
                    selectedId: action.payload.id,
                    searchText: action.payload.name,
                },
            };
        case 'CLEAR_CUSTOMER':
            return {
                ...state,
                customer: { ...state.customer, selected: null, selectedId: null, searchText: '' },
            };
        case 'SET_MANUAL_CUSTOMER':
            return {
                ...state,
                customer: {
                    ...state.customer,
                    manualData: { ...state.customer.manualData, [action.payload.field]: action.payload.value },
                },
            };
        case 'SET_PRODUCT_MODE':
            return { ...state, product: { ...state.product, mode: action.payload } };
        case 'SET_PRODUCT_SEARCH':
            return { ...state, product: { ...state.product, searchText: action.payload } };
        case 'SELECT_PRODUCT':
            return {
                ...state,
                product: { ...state.product, selected: action.payload, searchText: action.payload.name },
            };
        case 'CLEAR_PRODUCT':
            return { ...state, product: { ...state.product, selected: null, searchText: '' } };
        case 'SET_MANUAL_PRODUCT':
            return {
                ...state,
                product: {
                    ...state.product,
                    manualData: { ...state.product.manualData, [action.payload.field]: action.payload.value },
                },
            };
        case 'SET_ITEM_QTY':
            return { ...state, product: { ...state.product, quantity: action.payload } };
        case 'SET_PAYMENT_METHOD':
            return { ...state, payment: { ...state.payment, method: action.payload } };
        case 'SET_DISCOUNT':
            return { ...state, payment: { ...state.payment, discount: action.payload } };
        case 'SET_AMOUNT_PAID':
            return { ...state, payment: { ...state.payment, amountPaid: action.payload } };
        case 'TOGGLE_TRACK_CHANGE':
            return { ...state, payment: { ...state.payment, trackChange: !state.payment.trackChange } };
        case 'UPDATE_NOTE_QTY': {
            const newNotes = new Map(state.payment.notes);
            const currentQty = newNotes.get(action.payload.note) || 0;
            const newQty = Math.max(0, currentQty + action.payload.delta);
            if (newQty === 0) {
                newNotes.delete(action.payload.note);
            } else {
                newNotes.set(action.payload.note, newQty);
            }
            return { ...state, payment: { ...state.payment, notes: newNotes } };
        }
        case 'SET_MEMO':
            return { ...state, payment: { ...state.payment, memo: action.payload } };
        case 'SET_ERROR':
            return { ...state, ui: { ...state.ui, errorMsg: action.payload } };
        case 'SET_SUBMITTING':
            return { ...state, ui: { ...state.ui, isSubmitting: action.payload } };
        case 'RESET_PRODUCT_FORM':
            return {
                ...state,
                product: {
                    ...state.product,
                    selected: null,
                    searchText: '',
                    manualData: { name: '', price: '' },
                    quantity: 1,
                },
            };
        default:
            return state;
    }
}

// Custom hook for product search
function useProductSearch(businessId: string | undefined, query: string, mode: 'search' | 'manual') {
    const [results, setResults] = useReducer((state: Product[], action: Product[]) => action, []);
    const [loading, setLoading] = useReducer((state: boolean, action: boolean) => action, false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (mode !== 'search' || !query || query.length === 0 || !businessId) {
            setResults([]);
            setLoading(false);
            return;
        }

        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        const timer = setTimeout(() => {
            productsApi
                .list(businessId, { search: query, limit: 10 })
                .then((res) => setResults(res.data?.products || []))
                .catch((err) => {
                    if (err.name !== 'AbortError') setResults([]);
                })
                .finally(() => setLoading(false));
        }, 300);

        return () => {
            clearTimeout(timer);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [query, mode, businessId]);

    return { results, loading };
}

// Custom hook for customer search
function useCustomerSearch(businessId: string | undefined, query: string, mode: 'search' | 'manual') {
    const [results, setResults] = useReducer((state: Customer[], action: Customer[]) => action, []);
    const [loading, setLoading] = useReducer((state: boolean, action: boolean) => action, false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (mode !== 'search' || !query || query.length === 0 || !businessId) {
            setResults([]);
            setLoading(false);
            return;
        }

        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        const timer = setTimeout(() => {
            customersApi
                .list(businessId, { search: query, limit: 10 })
                .then((res) => setResults(res.data?.customers || []))
                .catch((err) => {
                    if (err.name !== 'AbortError') setResults([]);
                })
                .finally(() => setLoading(false));
        }, 300);

        return () => {
            clearTimeout(timer);
            if (abortRef.current) abortRef.current.abort();
        };
    }, [query, mode, businessId]);

    return { results, loading };
}

// Calculation utilities
const computeSubtotal = (items: TransactionItem[]): number => {
    return items.reduce((acc, item) => acc + item.total, 0);
};

const computeNotesTotal = (notes: Map<number, number>): number => {
    let sum = 0;
    notes.forEach((qty, denomination) => {
        sum += denomination * qty;
    });
    return sum;
};

const computeFinalTotal = (subtotal: number, discountStr: string): number => {
    const discountVal = parseCurrencyValue(discountStr);
    return subtotal - discountVal;
};

const computeChange = (paid: number, total: number): number => {
    return paid - total;
};

export default function NewSaleScreen() {
    const router = useRouter();
    const { currentBusiness } = useAuthStore();
    const queryClient = useQueryClient();
    const { width } = useWindowDimensions();

    const isTablet = width >= 768;
    const isLargeScreen = width >= 1024;

    const [state, dispatch] = useReducer(saleReducer, initialState);

    const productSearch = useProductSearch(
        currentBusiness?.id,
        state.product.searchText,
        state.product.mode
    );
    const customerSearch = useCustomerSearch(
        currentBusiness?.id,
        state.customer.searchText,
        state.customer.mode
    );

    // Memoized calculations
    const subtotal = useMemo(() => computeSubtotal(state.cart), [state.cart]);
    const finalTotal = useMemo(() => computeFinalTotal(subtotal, state.payment.discount), [subtotal, state.payment.discount]);
    const amountPaid = useMemo(() => {
        return state.payment.trackChange
            ? computeNotesTotal(state.payment.notes)
            : parseCurrencyValue(state.payment.amountPaid);
    }, [state.payment.trackChange, state.payment.notes, state.payment.amountPaid]);
    const changeAmount = useMemo(() => computeChange(amountPaid, finalTotal), [amountPaid, finalTotal]);

    // Add item to cart handler
    const addItemToCart = useCallback(() => {
        let productId = '';
        let productName = '';
        let unitPrice = 0;

        if (state.product.mode === 'search') {
            if (!state.product.selected) {
                dispatch({ type: 'SET_ERROR', payload: 'Please select a product' });
                return;
            }
            productId = state.product.selected.id;
            productName = state.product.selected.name;
            unitPrice = state.product.selected.price;
        } else {
            if (!state.product.manualData.name.trim()) {
                dispatch({ type: 'SET_ERROR', payload: 'Please enter a product name' });
                return;
            }
            const price = parseCurrencyValue(state.product.manualData.price);
            if (!price || price <= 0) {
                dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid price' });
                return;
            }
            productId = `manual-${Date.now()}`;
            productName = state.product.manualData.name.trim();
            unitPrice = price;
        }

        if (state.product.quantity < 1) {
            dispatch({ type: 'SET_ERROR', payload: 'Quantity must be at least 1' });
            return;
        }

        const newItem: TransactionItem = {
            productId,
            productName,
            quantity: state.product.quantity,
            unitPrice,
            discount: 0,
            total: state.product.quantity * unitPrice,
        };

        dispatch({ type: 'ADD_CART_ITEM', payload: newItem });
        dispatch({ type: 'RESET_PRODUCT_FORM' });
        dispatch({ type: 'SET_ERROR', payload: null });
    }, [state.product]);

    // Submit sale handler
    const submitSale = useCallback(async () => {
        if (!currentBusiness?.id) {
            dispatch({ type: 'SET_ERROR', payload: 'No business selected' });
            return;
        }

        if (state.cart.length === 0) {
            dispatch({ type: 'SET_ERROR', payload: 'Please add at least one item' });
            return;
        }

        if (finalTotal <= 0) {
            dispatch({ type: 'SET_ERROR', payload: 'Total must be greater than 0' });
            return;
        }

        if (amountPaid < finalTotal) {
            dispatch({ type: 'SET_ERROR', payload: 'Amount paid must be at least the total amount' });
            return;
        }

        dispatch({ type: 'SET_SUBMITTING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            let finalCustomerId = state.customer.selectedId;

            if (state.customer.mode === 'manual' && state.customer.manualData.name.trim()) {
                const customerRes = await customersApi.create({
                    businessId: currentBusiness.id,
                    name: state.customer.manualData.name.trim(),
                    email: state.customer.manualData.email.trim() || null,
                    phone: state.customer.manualData.phone.trim() || null,
                });
                finalCustomerId = customerRes.data?.customer?.id || null;
            }

            let finalMemo = state.payment.memo.trim();
            if (state.payment.trackChange && state.payment.notes.size > 0 && changeAmount > 0) {
                const noteBreakdown: string[] = [];
                state.payment.notes.forEach((qty, denomination) => {
                    if (qty > 0) noteBreakdown.push(`${qty}×$${denomination}`);
                });
                const changeNote = `Payment: ${noteBreakdown.join(' + ')}, Change: ${formatCurrency(changeAmount)}`;
                finalMemo = finalMemo ? `${finalMemo}\n${changeNote}` : changeNote;
            }

            const saleData = {
                businessId: currentBusiness.id,
                customerId: finalCustomerId || null,
                type: 'SALE' as const,
                paymentMethod: state.payment.method,
                items: state.cart.map((item) => ({
                    productId: item.productId.startsWith('manual-') ? null : item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                })),
                discount: parseCurrencyValue(state.payment.discount),
                amountPaid: amountPaid,
                notes: finalMemo || null,
            };

            const response = await api.post('/api/transactions', saleData);

            if (response.data?.transaction?.id) {
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['revenue'] });
                queryClient.invalidateQueries({ queryKey: ['sales'] });

                router.replace(`/sale/${response.data.transaction.id}` as any);
            }
        } catch (err: any) {
            console.error('Failed to create sale:', err);
            dispatch({
                type: 'SET_ERROR',
                payload: err.response?.data?.error || 'Failed to create sale. Please try again.',
            });
        } finally {
            dispatch({ type: 'SET_SUBMITTING', payload: false });
        }
    }, [currentBusiness, state, finalTotal, amountPaid, changeAmount, queryClient, router]);

    // Component helpers
    const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
        <Surface className={`p-4 rounded-2xl ${className}`}>
            {children}
        </Surface>
    );

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
            <View className="h-full mt-8">
                <ScrollView className="flex-1">
                    <View className="p-4 gap-6">
                        {/* Header */}
                        <View className="flex-row items-center gap-3">
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
                        </View>

                        {/* Responsive Grid Container */}
                        <View className={isTablet ? 'flex-row flex-wrap gap-4' : 'gap-6'}>
                            {/* Left Column on Tablet */}
                            <View className={isTablet ? (isLargeScreen ? 'flex-1 min-w-100' : 'w-full') : ''}>
                                {/* Customer Details Section */}
                                <View className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Satoshi-Bold' }}>
                                        Customer Details
                                    </Text>
                                    <View className="flex-row gap-2 mb-3">
                                        <Pressable
                                            className={`flex-1 py-2 rounded-xl items-center ${state.customer.mode === 'search' ? 'bg-green-500' : 'bg-gray-100'}`}
                                            onPress={() => dispatch({ type: 'SET_CUSTOMER_MODE', payload: 'search' })}
                                        >
                                            <Text className={state.customer.mode === 'search' ? 'text-white font-medium' : 'text-gray-700'}>
                                                Select Existing
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            className={`flex-1 py-2 rounded-xl items-center ${state.customer.mode === 'manual' ? 'bg-green-500' : 'bg-gray-100'}`}
                                            onPress={() => dispatch({ type: 'SET_CUSTOMER_MODE', payload: 'manual' })}
                                        >
                                            <Text className={state.customer.mode === 'manual' ? 'text-white font-medium' : 'text-gray-700'}>
                                                Add New
                                            </Text>
                                        </Pressable>
                                    </View>

                                    {state.customer.mode === 'search' ? (
                                        <View>
                                            <TextInput
                                                className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                placeholder="Search customers..."
                                                placeholderTextColor="#9ca3af"
                                                value={state.customer.searchText}
                                                onChangeText={(text) => dispatch({ type: 'SET_CUSTOMER_SEARCH', payload: text })}
                                            />
                                            {customerSearch.results.length > 0 && (
                                                <View className="bg-gray-50 rounded-xl mt-2 max-h-40 overflow-hidden">
                                                    {customerSearch.loading ? (
                                                        <View className="p-4 items-center">
                                                            <ActivityIndicator size="small" color="#22c55e" />
                                                        </View>
                                                    ) : (
                                                        customerSearch.results.map((customer) => (
                                                            <Pressable
                                                                key={customer.id}
                                                                className="p-3 border-b border-gray-200 active:bg-gray-100"
                                                                onPress={() => dispatch({ type: 'SELECT_CUSTOMER', payload: customer })}
                                                            >
                                                                <Text className="font-medium text-gray-900">{customer.name}</Text>
                                                                {customer.email && (
                                                                    <Text className="text-sm text-gray-500">{customer.email}</Text>
                                                                )}
                                                            </Pressable>
                                                        ))
                                                    )}
                                                </View>
                                            )}
                                            {state.customer.selected && (
                                                <View className="mt-2 p-3 bg-green-50 rounded-xl flex-row items-center justify-between">
                                                    <View>
                                                        <Text className="font-medium text-green-800">{state.customer.selected.name}</Text>
                                                        {state.customer.selected.email && (
                                                            <Text className="text-sm text-green-600">{state.customer.selected.email}</Text>
                                                        )}
                                                    </View>
                                                    <Pressable onPress={() => dispatch({ type: 'CLEAR_CUSTOMER' })}>
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
                                                value={state.customer.manualData.name}
                                                onChangeText={(text) => dispatch({ type: 'SET_MANUAL_CUSTOMER', payload: { field: 'name', value: text } })}
                                            />
                                            <TextInput
                                                className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                placeholder="Email (optional)"
                                                placeholderTextColor="#9ca3af"
                                                value={state.customer.manualData.email}
                                                onChangeText={(text) => dispatch({ type: 'SET_MANUAL_CUSTOMER', payload: { field: 'email', value: text } })}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                            <TextInput
                                                className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                placeholder="Phone (optional)"
                                                placeholderTextColor="#9ca3af"
                                                value={state.customer.manualData.phone}
                                                onChangeText={(text) => dispatch({ type: 'SET_MANUAL_CUSTOMER', payload: { field: 'phone', value: text } })}
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Payment Method Selection */}
                                <View className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Satoshi-Bold' }}>
                                        Payment Method
                                    </Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'OTHER'] as PaymentMethod[]).map((method) => (
                                            <Pressable
                                                key={method}
                                                className={`px-4 py-2 rounded-xl ${state.payment.method === method ? 'bg-green-500' : 'bg-gray-100'}`}
                                                onPress={() => dispatch({ type: 'SET_PAYMENT_METHOD', payload: method })}
                                            >
                                                <Text className={`font-medium ${state.payment.method === method ? 'text-white' : 'text-gray-700'}`}>
                                                    {method.replace(/_/g, ' ')}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* Right Column on Tablet */}
                            <View className={isTablet ? (isLargeScreen ? 'flex-1 min-w-100' : 'w-full') : ''}>
                                {/* Add Product Section */}
                                <View className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Satoshi-Bold' }}>
                                        Add Product
                                    </Text>
                                    <View className="flex-row gap-2 mb-3">
                                        <Pressable
                                            className={`flex-1 py-2 rounded-xl items-center ${state.product.mode === 'search' ? 'bg-green-500' : 'bg-gray-100'}`}
                                            onPress={() => dispatch({ type: 'SET_PRODUCT_MODE', payload: 'search' })}
                                        >
                                            <Text className={state.product.mode === 'search' ? 'text-white font-medium' : 'text-gray-700'}>
                                                Select Product
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            className={`flex-1 py-2 rounded-xl items-center ${state.product.mode === 'manual' ? 'bg-green-500' : 'bg-gray-100'}`}
                                            onPress={() => dispatch({ type: 'SET_PRODUCT_MODE', payload: 'manual' })}
                                        >
                                            <Text className={state.product.mode === 'manual' ? 'text-white font-medium' : 'text-gray-700'}>
                                                Enter Manually
                                            </Text>
                                        </Pressable>
                                    </View>

                                    <View className="gap-3">
                                        {state.product.mode === 'search' ? (
                                            <View>
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="Search products..."
                                                    placeholderTextColor="#9ca3af"
                                                    value={state.product.searchText}
                                                    onChangeText={(text) => dispatch({ type: 'SET_PRODUCT_SEARCH', payload: text })}
                                                />
                                                {productSearch.results.length > 0 && (
                                                    <View className="bg-gray-50 rounded-xl mt-2 max-h-40 overflow-hidden">
                                                        {productSearch.loading ? (
                                                            <View className="p-4 items-center">
                                                                <ActivityIndicator size="small" color="#22c55e" />
                                                            </View>
                                                        ) : (
                                                            productSearch.results.map((product) => (
                                                                <Pressable
                                                                    key={product.id}
                                                                    className="p-3 border-b border-gray-200 active:bg-gray-100 flex-row justify-between"
                                                                    onPress={() => dispatch({ type: 'SELECT_PRODUCT', payload: product })}
                                                                >
                                                                    <Text className="font-medium text-gray-900 flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">
                                                                        {product.name}
                                                                    </Text>
                                                                    <Text className="font-bold text-green-600">{formatCurrency(product.price)}</Text>
                                                                </Pressable>
                                                            ))
                                                        )}
                                                    </View>
                                                )}
                                                {state.product.selected && (
                                                    <View className="mt-2 p-3 bg-green-50 rounded-xl flex-row items-center justify-between">
                                                        <View className="flex-1 mr-2">
                                                            <Text className="font-medium text-green-800" numberOfLines={1} ellipsizeMode="tail">
                                                                {state.product.selected.name}
                                                            </Text>
                                                            <Text className="text-sm text-green-600">{formatCurrency(state.product.selected.price)}</Text>
                                                        </View>
                                                        <Pressable onPress={() => dispatch({ type: 'CLEAR_PRODUCT' })}>
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
                                                    value={state.product.manualData.name}
                                                    onChangeText={(text) => dispatch({ type: 'SET_MANUAL_PRODUCT', payload: { field: 'name', value: text } })}
                                                />
                                                <TextInput
                                                    className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                    placeholder="Price"
                                                    placeholderTextColor="#9ca3af"
                                                    value={state.product.manualData.price}
                                                    onChangeText={(text) => dispatch({ type: 'SET_MANUAL_PRODUCT', payload: { field: 'price', value: text } })}
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
                                                    onPress={() => dispatch({ type: 'SET_ITEM_QTY', payload: Math.max(1, state.product.quantity - 1) })}
                                                >
                                                    <MaterialCommunityIcons name="minus" size={20} color="#374151" />
                                                </Pressable>
                                                <View className="flex-1 bg-gray-100 px-4 py-3 rounded-xl items-center">
                                                    <Text className="text-lg font-bold text-gray-900">{state.product.quantity}</Text>
                                                </View>
                                                <Pressable
                                                    className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center active:bg-gray-200"
                                                    onPress={() => dispatch({ type: 'SET_ITEM_QTY', payload: state.product.quantity + 1 })}
                                                >
                                                    <MaterialCommunityIcons name="plus" size={20} color="#374151" />
                                                </Pressable>
                                            </View>
                                        </View>

                                        <Pressable
                                            className="bg-green-500 py-3 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80"
                                            onPress={addItemToCart}
                                        >
                                            <MaterialCommunityIcons name="plus" size={20} color="white" />
                                            <Text className="text-white font-bold">Add Item</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Items List - Full Width */}
                        {state.cart.length > 0 && (
                            <View>
                                <CardItem>
                                    <Text className="text-lg font-bold text-gray-900 ">Items ({state.cart.length})</Text>
                                    <View className="gap-2">
                                        {state.cart.map((item, index) => (
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
                                                        onPress={() => dispatch({ type: 'UPDATE_ITEM_QTY', payload: { index, delta: -1 } })}
                                                    >
                                                        <MaterialCommunityIcons name="minus" size={16} color="#374151" />
                                                    </Pressable>
                                                    <Text className="font-bold text-gray-900 w-8 text-center">{item.quantity}</Text>
                                                    <Pressable
                                                        className="w-8 h-8 rounded-lg bg-gray-200 items-center justify-center"
                                                        onPress={() => dispatch({ type: 'UPDATE_ITEM_QTY', payload: { index, delta: 1 } })}
                                                    >
                                                        <MaterialCommunityIcons name="plus" size={16} color="#374151" />
                                                    </Pressable>
                                                    <Text className="font-bold text-gray-900 ml-2 w-20 text-right">{formatCurrency(item.total)}</Text>
                                                    <Pressable onPress={() => dispatch({ type: 'REMOVE_CART_ITEM', payload: index })}>
                                                        <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </CardItem>
                            </View>
                        )}

                        {/* Transaction Details and Summary Row on Tablet */}
                        <View className={isTablet ? 'flex-row gap-4' : 'gap-6'}>
                            {/* Transaction Details */}
                            <View className={isTablet ? 'flex-1' : ''}>
                                <View className="mb-4 bg-white rounded-2xl border border-gray-200 p-4">
                                    <Text className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Satoshi-Bold' }}>
                                        Transaction Details
                                    </Text>
                                    <View className="gap-3">
                                    <View>
                                        <Text className="text-sm font-medium text-gray-700 mb-1">Total Discount</Text>
                                        <TextInput
                                            className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                            placeholder="0.00"
                                            placeholderTextColor="#9ca3af"
                                            value={state.payment.discount}
                                            onChangeText={(text) => dispatch({ type: 'SET_DISCOUNT', payload: text })}
                                            keyboardType="decimal-pad"
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between py-2">
                                        <Text className="text-gray-700 font-medium">
                                            Track cash change
                                        </Text>
                                        <Switch
                                            checked={state.payment.trackChange}
                                            onCheckedChange={() => dispatch({ type: 'TOGGLE_TRACK_CHANGE' })}
                                            nativeID="track-change"
                                        />
                                    </View>

                                    {state.payment.trackChange ? (
                                        <View>
                                            <Text className="text-sm font-medium text-gray-700 mb-2">Note Denominations</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {NOTE_DENOMINATIONS.map((note) => {
                                                    const quantity = state.payment.notes.get(note) || 0;
                                                    return (
                                                        <View
                                                            key={note}
                                                            className="flex-row items-center gap-0 bg-gray-100 rounded-xl overflow-hidden"
                                                        >
                                                            <Pressable
                                                                className="px-2 py-2 active:bg-gray-200"
                                                                onPress={() => dispatch({ type: 'UPDATE_NOTE_QTY', payload: { note, delta: -1 } })}
                                                            >
                                                                <MaterialCommunityIcons name="minus" size={16} color="#374151" />
                                                            </Pressable>
                                                            <View className="px-3 py-2 items-center">
                                                                <Text className="text-xs font-light text-gray-600">${note}</Text>
                                                                {quantity > 0 && (
                                                                    <Text className="text-sm font-bold text-gray-900">×{quantity}</Text>
                                                                )}
                                                            </View>
                                                            <Pressable
                                                                className="px-2 py-2 active:bg-gray-200"
                                                                onPress={() => dispatch({ type: 'UPDATE_NOTE_QTY', payload: { note, delta: 1 } })}
                                                            >
                                                                <MaterialCommunityIcons name="plus" size={16} color="#374151" />
                                                            </Pressable>
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ) : (
                                        <View>
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Amount Paid</Text>
                                            <TextInput
                                                className="bg-gray-100 px-4 py-3 rounded-xl text-gray-900 font-medium"
                                                placeholder="0.00"
                                                placeholderTextColor="#9ca3af"
                                                value={state.payment.amountPaid}
                                                onChangeText={(text) => dispatch({ type: 'SET_AMOUNT_PAID', payload: text })}
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
                                            value={state.payment.memo}
                                            onChangeText={(text) => dispatch({ type: 'SET_MEMO', payload: text })}
                                            multiline
                                            numberOfLines={3}
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
                                </View>
                            </View>

                            {/* Summary Card */}
                            <View className={isTablet ? 'flex-1' : ''}>
                                <Surface className="p-4 rounded-2xl bg-green-50 border border-green-200">
                                    <Text className="text-lg font-bold text-gray-900 ">Summary</Text>
                                    <View className="gap-2">
                                        <View className="flex-row justify-between">
                                            <Text className="font-medium text-gray-700">Subtotal:</Text>
                                            <Text className="font-bold text-gray-900">{formatCurrency(subtotal)}</Text>
                                        </View>
                                        {parseCurrencyValue(state.payment.discount) > 0 && (
                                            <View className="flex-row justify-between">
                                                <Text className="font-medium text-gray-700">Discount:</Text>
                                                <Text className="font-bold text-red-600">-{formatCurrency(parseCurrencyValue(state.payment.discount))}</Text>
                                            </View>
                                        )}
                                        <View className="flex-row justify-between pt-2 border-t border-green-200">
                                            <Text className="text-lg font-black text-gray-900">Total:</Text>
                                            <Text className="text-lg font-black text-green-600">{formatCurrency(finalTotal)}</Text>
                                        </View>
                                        {amountPaid > 0 && (
                                            <>
                                                <View className="flex-row justify-between">
                                                    <Text className="font-medium text-gray-700">
                                                        {state.payment.trackChange && state.payment.notes.size > 0 ? 'Notes Breakdown:' : 'Amount Paid:'}
                                                    </Text>
                                                    <Text className="font-bold text-gray-900">{formatCurrency(amountPaid)}</Text>
                                                </View>
                                                {changeAmount > 0 && (
                                                    <View className="flex-row justify-between">
                                                        <Text className="font-medium text-gray-700">Change:</Text>
                                                        <Text className="font-bold text-green-600">{formatCurrency(changeAmount)}</Text>
                                                    </View>
                                                )}
                                            </>
                                        )}
                                    </View>
                                </Surface>
                            </View>
                        </View>

                        {/* Error Message */}
                        {state.ui.errorMsg && (
                            <View>
                                <Surface className="p-4 rounded-xl bg-red-50 border border-red-200">
                                    <View className="flex-row items-center gap-2">
                                        <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
                                        <Text className="flex-1 text-sm font-medium text-red-700">{state.ui.errorMsg}</Text>
                                    </View>
                                </Surface>
                            </View>
                        )}

                        {/* Save Button */}
                        <View className={isTablet ? 'items-end' : ''}>
                            <Pressable
                                className={`bg-green-500 py-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-80 ${isTablet ? 'w-fit px-8' : 'w-full'} ${state.ui.isSubmitting ? 'opacity-70' : ''}`}
                                onPress={submitSale}
                                disabled={state.ui.isSubmitting}
                            >
                                {state.ui.isSubmitting ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="check" size={24} color="white" />
                                        <Text className="text-white font-black text-lg">Save Sale</Text>
                                    </>
                                )}
                            </Pressable>
                        </View>

                        {/* Bottom padding for mobile */}
                        <View className="h-8" />
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
