# Transactions History

## Overview

Transaction history screen with:
- Transaction listing with pagination
- Type filtering (All, Sales, Refunds)
- Period selection for date range
- Color-coded status and type indicators
- Responsive grid layout
- Transaction details with items

## File: `app/(tabs)/transactions.tsx`

## Data Types

```typescript
interface Transaction {
    id: string;
    reference: string;                                    // e.g., "TXN-1234567"
    type: 'SALE' | 'REFUND' | 'EXPENSE' | 'INCOME';
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
    total: number;
    amountPaid?: number;
    change?: number;
    notes?: string;
    createdAt: string;
    customerId?: string;
    customer?: { name: string };
    items?: TransactionItem[];
    _count?: { items: number };
    createdBy?: { name: string };
}

interface TransactionItem {
    id: string;
    productId: string;
    product: { name: string; sku?: string };
    quantity: number;
    price: number;
    discount: number;
    subtotal: number;
}
```

## Filtering

### Type Filter Buttons

```tsx
const [filter, setFilter] = useState<'all' | 'SALE' | 'REFUND'>('all');

const FilterButton = ({ value, label }: { value: typeof filter; label: string }) => (
    <Pressable
        onPress={() => setFilter(value)}
        className={`px-4 py-2 rounded-full mr-2 ${
            filter === value ? 'bg-green-500' : 'bg-white'
        }`}
    >
        <Text className={`font-medium ${filter === value ? 'text-white' : 'text-gray-600'}`}>
            {label}
        </Text>
    </Pressable>
);

// In JSX
<View className="px-4 py-3 flex-row bg-gray-50">
    <FilterButton value="all" label="All" />
    <FilterButton value="SALE" label="Sales" />
    <FilterButton value="REFUND" label="Refunds" />
</View>
```

### Period Selection

Uses `PeriodSelector` component for date range filtering:

```tsx
import { PeriodTags, PeriodType, CustomPeriod, getPeriodDates } from '@/components/PeriodSelector';

const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('1m');
const [customPeriod, setCustomPeriod] = useState<CustomPeriod>({
    startDate: new Date(),
    endDate: new Date()
});

// In fetch function
const { startDate, endDate } = getPeriodDates(selectedPeriod, customPeriod);

const res = await api.get('/api/transactions', {
    businessId: currentBusiness.id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    type: filter === 'all' ? undefined : filter,
});

// In JSX
<PeriodTags
    selectedPeriod={selectedPeriod}
    onSelect={setSelectedPeriod}
    customPeriod={customPeriod}
    onCustomPeriodChange={setCustomPeriod}
/>
```

## Visual Indicators

### Status Colors

```typescript
const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED': return 'bg-green-100 text-green-700';
        case 'PENDING': return 'bg-yellow-100 text-yellow-700';
        case 'CANCELLED': return 'bg-red-100 text-red-700';
        case 'REFUNDED': return 'bg-gray-100 text-gray-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};
```

### Type Icons

```typescript
const getTypeIcon = (type: string) => {
    switch (type) {
        case 'SALE': return { name: 'arrow-up', color: '#22c55e', bg: 'bg-green-100' };
        case 'REFUND': return { name: 'arrow-down', color: '#ef4444', bg: 'bg-red-100' };
        case 'EXPENSE': return { name: 'minus', color: '#f59e0b', bg: 'bg-yellow-100' };
        case 'INCOME': return { name: 'plus', color: '#3b82f6', bg: 'bg-blue-100' };
        default: return { name: 'receipt', color: '#6b7280', bg: 'bg-gray-100' };
    }
};
```

## Transaction Card

```tsx
const renderTransaction = ({ item }: { item: Transaction }) => {
    const typeInfo = getTypeIcon(item.type);

    return (
        <Pressable
            onPress={() => router.push(`/transactions/${item.id}`)}
            className="bg-white mx-4 mb-3 rounded-xl p-4 shadow-sm"
        >
            <View className="flex-row items-center">
                {/* Type Icon */}
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${typeInfo.bg}`}>
                    <MaterialCommunityIcons
                        name={typeInfo.name}
                        size={20}
                        color={typeInfo.color}
                    />
                </View>

                {/* Transaction Info */}
                <View className="flex-1">
                    <View className="flex-row items-center">
                        <Text className="text-gray-900 font-semibold">{item.reference}</Text>
                        <View className={`ml-2 px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                            <Text className="text-xs font-medium">{item.status}</Text>
                        </View>
                    </View>
                    <Text className="text-gray-500 text-sm mt-0.5">
                        {item.customer?.name || 'Walk-in'} • {item._count?.items || 0} items
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">
                        {formatRelativeTime(item.createdAt)}
                    </Text>
                </View>

                {/* Amount */}
                <View className="items-end">
                    <Text
                        className={`text-lg font-bold ${
                            item.type === 'SALE' || item.type === 'INCOME'
                                ? 'text-green-600'
                                : 'text-red-600'
                        }`}
                    >
                        {item.type === 'SALE' || item.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(item.total)}
                    </Text>
                    <Text className="text-gray-400 text-xs capitalize">
                        {item.paymentMethod.replace('_', ' ').toLowerCase()}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};
```

## Relative Time Formatting

```typescript
// From lib/utils.ts
export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

## Transaction Detail Screen

### File: `app/transactions/[id].tsx`

### Features
- Full transaction info
- Item list with quantities and prices
- Payment method and amounts
- Customer info
- Print/share receipt
- Refund action (for completed sales)

### Transaction Detail Layout

```tsx
// Header with status
<View className="bg-green-500 px-5 py-6">
    <Text className="text-white text-2xl font-bold">{transaction.reference}</Text>
    <View className="flex-row items-center mt-2">
        <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white font-medium">{transaction.status}</Text>
        </View>
        <Text className="text-white/80 ml-3">
            {formatDate(transaction.createdAt)}
        </Text>
    </View>
</View>

// Amount section
<View className="bg-white mx-4 -mt-4 rounded-xl p-4 shadow-sm">
    <Text className="text-gray-500 text-sm">Total Amount</Text>
    <Text className="text-3xl font-bold text-gray-900">
        {formatCurrency(transaction.total)}
    </Text>
    <View className="flex-row mt-2">
        <Text className="text-gray-500">Paid: {formatCurrency(transaction.amountPaid)}</Text>
        {transaction.change > 0 && (
            <Text className="text-gray-500 ml-4">Change: {formatCurrency(transaction.change)}</Text>
        )}
    </View>
</View>

// Items list
<View className="bg-white mx-4 mt-4 rounded-xl p-4">
    <Text className="text-gray-700 font-semibold mb-3">Items ({items.length})</Text>
    {items.map(item => (
        <View key={item.id} className="flex-row items-center py-3 border-b border-gray-100">
            <View className="flex-1">
                <Text className="text-gray-900 font-medium">{item.product.name}</Text>
                <Text className="text-gray-500 text-sm">
                    {formatCurrency(item.price)} × {item.quantity}
                </Text>
            </View>
            <Text className="text-gray-900 font-semibold">
                {formatCurrency(item.subtotal)}
            </Text>
        </View>
    ))}
</View>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions with filters |
| GET | `/api/transactions/:id` | Get transaction details |
| POST | `/api/transactions` | Create new transaction |
| POST | `/api/transactions/:id/refund` | Refund a transaction |

### Query Parameters for List

| Parameter | Type | Description |
|-----------|------|-------------|
| businessId | string | Required - Filter by business |
| page | number | Page number (default 1) |
| limit | number | Items per page (default 20) |
| type | string | Filter by type (SALE, REFUND, etc.) |
| status | string | Filter by status |
| customerId | string | Filter by customer |
| startDate | string | Start date (ISO string) |
| endDate | string | End date (ISO string) |

## Period Selector Component

See detailed documentation in [15_UI_COMPONENTS.md](./15_UI_COMPONENTS.md#period-selector)

### Period Types

```typescript
export type PeriodType = '24h' | '1w' | '1m' | '1y' | 'custom';

export const PERIOD_OPTIONS = [
    { type: '24h', label: 'Last 24 Hours', shortLabel: '24h' },
    { type: '1w', label: 'Last 7 Days', shortLabel: '1 Week' },
    { type: '1m', label: 'Last 30 Days', shortLabel: '1 Month' },
    { type: '1y', label: 'Last 12 Months', shortLabel: '1 Year' },
    { type: 'custom', label: 'Custom Period', shortLabel: 'Custom' },
];
```

### Calculate Period Dates

```typescript
export function getPeriodDates(type: PeriodType, customPeriod?: CustomPeriod) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(now);

    switch (type) {
        case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
        case '1w':
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '1m':
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            break;
        case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            if (customPeriod) {
                return { startDate: customPeriod.startDate, endDate: customPeriod.endDate };
            }
            break;
    }

    return { startDate, endDate };
}
```

## Permissions

- `view_transactions` - View transaction list and details
- `create_transactions` - Create sales/transactions
- `refund_transactions` - Refund completed transactions
- `view_reports` - Access transaction reports
