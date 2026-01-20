# Dashboard / Home Screen

## Overview

The home screen displays a business dashboard with:
- User greeting and current business info
- Period-selectable sales stats
- Quick action buttons
- Overview stats (products, customers)
- Recent transactions list

## File: `app/(tabs)/index.tsx`

## Features

### 1. Welcome Header (Green Background)
- User name greeting
- Notification bell button
- Current business card with role badge

### 2. Stats Row
- Period selector dropdown (24h, 1w, 1m, 1y, custom)
- Today's Sales (or transaction count for non-revenue users)
- Transaction count

### 3. Quick Actions
Permission-based action buttons:
- New Sale → `/pos`
- Add Product → `/products/create` (requires `create_products`)
- Add Customer → `/customers/create` (requires `create_customers`)
- Reports → `/reports` (requires `view_reports`)
- Tatenda AI → `/ai`
- Settings → `/settings` (requires `edit_business_settings`, tablet only)
- Categories → `/categories` (requires `create_categories`, tablet only)

### 4. Overview Cards
- Total Products count
- Total Customers count

### 5. Recent Transactions
- List of last 5 transactions
- Each shows: reference, customer name, relative time, amount
- "View All" link to transactions screen
- Empty state with "Create First Sale" button

## Code Structure

```tsx
// Key imports
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useResponsive } from '@/lib/useResponsive';
import { usePermissions, getRoleBadgeStyle } from '@/lib/permissions';
import { PermissionGuard, ManagerAndAbove } from '@/components/PermissionGuard';
import { PeriodDropdown, PeriodType, getPeriodDates } from '@/components/PeriodSelector';

// Dashboard stats interface
interface DashboardStats {
    todaySales: number;
    todayTransactions: number;
    totalProducts: number;
    lowStockProducts: number;
    totalCustomers: number;
}

interface RecentTransaction {
    id: string;
    reference: string;
    total: number;
    type: string;
    status: string;
    createdAt: string;
    customer?: { name: string };
}
```

## Data Fetching

```typescript
const fetchDashboardData = useCallback(async () => {
    if (!currentBusiness) return;

    try {
        const { startDate, endDate } = getPeriodDates(selectedPeriod, customPeriod);

        const [salesRes, productsRes, customersRes, transactionsRes] = await Promise.all([
            api.get('/api/reports/sales-summary', {
                businessId: currentBusiness.id,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }),
            api.get('/api/products', { businessId: currentBusiness.id, limit: 1 }),
            api.get('/api/customers', { businessId: currentBusiness.id, limit: 1 }),
            api.get('/api/transactions', { businessId: currentBusiness.id, limit: 5 }),
        ]);

        setStats({
            todaySales: salesRes.data?.totalSales || 0,
            todayTransactions: salesRes.data?.totalTransactions || 0,
            totalProducts: productsRes.data?.pagination?.total || 0,
            lowStockProducts: 0,
            totalCustomers: customersRes.data?.pagination?.total || 0,
        });

        setRecentTransactions(transactionsRes.data?.data || []);
    } catch (error) {
        console.error('Failed to fetch dashboard:', error);
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
}, [currentBusiness, selectedPeriod, customPeriod]);
```

## UI Components

### QuickAction Button

```tsx
const QuickAction = ({
    icon,
    label,
    color,
    onPress,
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    color: string;
    onPress: () => void;
}) => (
    <Pressable onPress={onPress} className="items-center flex-1">
        <View
            className="w-14 h-14 rounded-full items-center justify-center mb-2"
            style={{ backgroundColor: `${color}20` }}
        >
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text className="text-sm text-gray-700 text-center font-medium">{label}</Text>
    </Pressable>
);
```

### StatCard

```tsx
const StatCard = ({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
}) => (
    <View className="bg-white rounded-xl p-4 flex-1 mr-3 shadow-sm">
        <View className="flex-row items-center justify-between mb-2">
            <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text className="text-2xl font-bold text-gray-900">{value}</Text>
        <Text className="text-sm text-gray-500 mt-1">{title}</Text>
    </View>
);
```

### Transaction Item

```tsx
<Pressable
    onPress={() => router.push(`/transactions/${transaction.id}`)}
    className="flex-row items-center p-4 border-b border-gray-100"
>
    <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            transaction.type === 'SALE' ? 'bg-green-100' : 'bg-red-100'
        }`}
    >
        <MaterialCommunityIcons
            name={transaction.type === 'SALE' ? 'arrow-up' : 'arrow-down'}
            size={20}
            color={transaction.type === 'SALE' ? '#22c55e' : '#ef4444'}
        />
    </View>
    <View className="flex-1">
        <Text className="text-gray-900 font-medium">{transaction.reference}</Text>
        <Text className="text-gray-500 text-sm">
            {transaction.customer?.name || 'Walk-in'} • {formatRelativeTime(transaction.createdAt)}
        </Text>
    </View>
    <Text className={`font-semibold ${
        transaction.type === 'SALE' ? 'text-green-600' : 'text-red-600'
    }`}>
        {transaction.type === 'SALE' ? '+' : '-'}{formatCurrency(transaction.total)}
    </Text>
</Pressable>
```

## Responsive Design

Uses `useResponsive()` hook for tablet adaptation:
- Larger padding on tablets
- Bigger icons and text
- More quick actions visible
- Grid layout adjustments

## Pull to Refresh

```tsx
<ScrollView
    refreshControl={
        <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#22c55e']}
            tintColor="#22c55e"
        />
    }
>
```

## Permission-Based Rendering

```tsx
// Only show if user has permission
{hasPermission('view_revenue') ? (
    <StatCard title="Today's Sales" value={formatCurrency(stats?.todaySales)} ... />
) : (
    <StatCard title="Today's Sales" value={stats?.todayTransactions} ... />
)}

// Quick action with permission check
{hasPermission('create_products') && (
    <QuickAction icon="plus-circle" label="Add Product" ... />
)}
```
