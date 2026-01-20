# Navigation & Routing

## Overview

Tangabiz uses **expo-router** for file-based routing with a nested navigation structure:
- Root Stack (auth screens + main app)
- Bottom Tabs (main navigation)
- Nested Stacks (feature-specific screens)

## Route Structure

```
/ (root)
├── onboarding          # First-time user intro
├── sign-in             # Authentication
├── sign-up             # CVT redirect
├── (tabs)/             # Bottom tab navigator
│   ├── index           # Home/Dashboard
│   ├── products        # Products list
│   ├── pos             # Point of Sale
│   ├── transactions    # Sales history
│   └── more            # More menu
├── products/
│   ├── create          # Add product
│   └── [id]            # Product details
├── customers/
│   ├── index           # Customers list
│   ├── create          # Add customer
│   └── [id]            # Customer details
├── transactions/
│   └── [id]            # Transaction details
├── reports/
│   └── index           # Reports dashboard
├── ai/
│   └── index           # Tatenda AI chat
├── notifications/
│   ├── index           # Notifications list
│   └── preferences     # Notification settings
├── settings/
│   ├── index           # Settings menu
│   ├── profile         # User profile
│   └── business        # Business settings
└── verify-invoice/
    ├── index           # Entry point
    ├── scan            # QR scanner
    └── result          # Verification result
```

## Tab Navigator Configuration

**File**: `app/(tabs)/_layout.tsx`

```tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#22c55e',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 10,
                    height: Platform.OS === 'ios' ? 85 : 65,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: '#22c55e',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                    headerTitle: 'Tangabiz',
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="package-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pos"
                options={{
                    title: 'New Sale',
                    tabBarIcon: ({ color, size }) => (
                        // Special floating button style
                        <View className="bg-green-500 rounded-full p-2 -mt-4">
                            <MaterialCommunityIcons name="cart-plus" size={28} color="#fff" />
                        </View>
                    ),
                    tabBarLabel: () => null, // Hide label for center button
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Sales',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
```

## Navigation Patterns

### 1. Programmatic Navigation

```tsx
import { router } from 'expo-router';

// Navigate forward
router.push('/products/create');

// Navigate with params
router.push(`/products/${productId}`);

// Replace current screen
router.replace('/sign-in');

// Go back
router.back();

// Navigate with query params
router.push({
    pathname: '/verify-invoice/result',
    params: { success: 'true', invoice: JSON.stringify(data) },
});
```

### 2. Dynamic Routes

**File**: `app/products/[id].tsx`

```tsx
import { useLocalSearchParams } from 'expo-router';

export default function ProductDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    
    // Fetch product by id
    useEffect(() => {
        fetchProduct(id);
    }, [id]);
}
```

### 3. Stack Screen Options

```tsx
import { Stack } from 'expo-router';

export default function ProductDetails() {
    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Product Details',
                    headerRight: () => (
                        <Pressable onPress={handleEdit}>
                            <MaterialCommunityIcons name="pencil" size={24} color="#fff" />
                        </Pressable>
                    ),
                }}
            />
            {/* Screen content */}
        </>
    );
}
```

### 4. Nested Stack in Feature

**File**: `app/products/_layout.tsx`

```tsx
import { Stack } from 'expo-router';

export default function ProductsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: '#22c55e' },
                headerTintColor: '#fff',
            }}
        />
    );
}
```

## Deep Linking

Configured in `app.json`:

```json
{
  "expo": {
    "scheme": "tangabiz",
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

## Tab Icons Used

| Tab | Icon Name | Library |
|-----|-----------|---------|
| Home | `home` | MaterialCommunityIcons |
| Products | `package-variant` | MaterialCommunityIcons |
| POS | `cart-plus` | MaterialCommunityIcons |
| Transactions | `receipt` | MaterialCommunityIcons |
| More | `dots-horizontal` | MaterialCommunityIcons |

## Common Icon Names

```
home, package-variant, cart-plus, receipt, dots-horizontal,
account-group, chart-bar, cog, bell, plus, chevron-right,
magnify, close, check, trash-can-outline, pencil, store,
cash, credit-card, cellphone, bank, arrow-up, arrow-down,
robot, file-document-check, qrcode-scan, information
```
