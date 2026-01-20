# Point of Sale (POS) System

## Overview

Full-featured POS screen for creating sales with:
- Product search and grid display
- Cart management with quantity controls
- Payment method selection
- Customer selection
- Checkout flow with change calculation

## File: `app/(tabs)/pos.tsx`

## Features

### 1. Product Grid
- Search bar for filtering products
- Grid of product cards showing:
  - Product image/icon
  - Name
  - Price
  - Stock quantity
  - Cart badge (quantity in cart)
- Out of stock products are disabled and dimmed

### 2. Cart Management
- Add products by tapping
- Quantity controls (+/-)
- Remove items
- Clear cart confirmation
- Running subtotal and total

### 3. Checkout Modal
- Customer selection (optional, walk-in default)
- Payment method selection: Cash, Card, Mobile Money, Bank Transfer
- Amount paid input (for cash transactions)
- Change calculation
- Notes field
- Order summary
- Complete Sale button

### 4. Responsive Layout
- **Mobile**: Product grid + floating cart FAB → Cart modal
- **Tablet**: Split view with products on left, cart sidebar on right

## Data Types

```typescript
interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number; // stock quantity
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
```

## Cart Logic

```typescript
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

// Clear cart with confirmation
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
```

## Cart Calculations

```typescript
const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity - item.discount,
    0
);
const total = subtotal;
const change = Number(amountPaid || 0) - total;
```

## Submit Transaction

```typescript
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
```

## UI Components

### Product Card

```tsx
const renderProduct = ({ item }: { item: Product }) => {
    const inCart = cart.find(c => c.product.id === item.id);
    const isOutOfStock = item.quantity === 0;

    return (
        <Pressable
            onPress={() => !isOutOfStock && addToCart(item)}
            disabled={isOutOfStock}
            className={`bg-white rounded-xl p-3 mr-3 mb-3 ${isOutOfStock ? 'opacity-50' : ''}`}
            style={{ width: 140 }}
        >
            <View className="w-full bg-gray-100 rounded-lg items-center justify-center mb-2" style={{ height: 80 }}>
                <MaterialCommunityIcons name="package-variant" size={32} color="#9ca3af" />
            </View>
            <Text className="text-gray-900 font-medium" numberOfLines={2}>{item.name}</Text>
            <Text className="text-green-600 font-bold mt-1">{formatCurrency(item.price)}</Text>
            <Text className="text-gray-400 text-xs mt-1">Stock: {item.quantity}</Text>
            
            {/* Cart badge */}
            {inCart && (
                <View className="absolute top-2 right-2 bg-green-500 w-6 h-6 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">{inCart.quantity}</Text>
                </View>
            )}
        </Pressable>
    );
};
```

### Payment Method Selector

```tsx
const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: 'cash' },
    { value: 'CARD', label: 'Card', icon: 'credit-card' },
    { value: 'MOBILE_MONEY', label: 'Mobile', icon: 'cellphone' },
    { value: 'BANK_TRANSFER', label: 'Bank', icon: 'bank' },
];

<View className="flex-row mb-4">
    {paymentMethods.map((method) => (
        <Pressable
            key={method.value}
            onPress={() => setPaymentMethod(method.value)}
            className={`flex-1 py-3 rounded-xl mr-2 items-center ${
                paymentMethod === method.value ? 'bg-green-500' : 'bg-gray-100'
            }`}
        >
            <MaterialCommunityIcons
                name={method.icon}
                size={22}
                color={paymentMethod === method.value ? '#fff' : '#6b7280'}
            />
            <Text className={`text-xs mt-1 ${
                paymentMethod === method.value ? 'text-white' : 'text-gray-600'
            }`}>
                {method.label}
            </Text>
        </Pressable>
    ))}
</View>
```

### Mobile Cart FAB

```tsx
{!isTablet && cart.length > 0 && (
    <Pressable
        onPress={() => setShowCart(true)}
        className="absolute bottom-6 left-4 right-4 bg-green-500 rounded-xl py-4 px-6 flex-row items-center justify-between shadow-lg"
    >
        <View className="flex-row items-center">
            <MaterialCommunityIcons name="cart" size={24} color="#fff" />
            <Text className="text-white font-semibold ml-2">{cart.length} items</Text>
        </View>
        <Text className="text-white font-bold text-lg">{formatCurrency(total)}</Text>
    </Pressable>
)}
```

## Modals

1. **Cart Modal** (Mobile only) - Shows cart items with checkout button
2. **Checkout Modal** - Payment details and final confirmation
3. **Customer Search Modal** - Search and select customer

## Dependencies

- `expo-haptics` - For tactile feedback
- `react-native-toast-message` - For notifications
