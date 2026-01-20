# Customers Management

## Overview

Customer management system with:
- Customer listing with search and pagination
- Customer creation with contact details
- Customer detail view with transaction history
- Responsive grid layout for tablets

## Files Structure

```
app/
└── customers/
    ├── _layout.tsx            # Stack navigator
    ├── index.tsx              # Customer listing
    ├── create.tsx             # Create customer form
    └── [id].tsx               # Customer detail view
```

## Data Types

```typescript
interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    businessId: string;
    _count?: {
        transactions: number;
    };
}
```

## Customers Listing Screen

### File: `app/customers/index.tsx`

### Features
- Search bar with live query
- Infinite scroll pagination
- Pull-to-refresh
- Responsive grid (1 col mobile, 2 col large tablet)
- Customer avatar with initial
- Transaction count display
- FAB for quick add

### Customer Card

```tsx
const renderCustomer = ({ item }: { item: Customer }) => (
    <Pressable
        onPress={() => router.push(`/customers/${item.id}`)}
        className="bg-white mx-4 mb-3 rounded-xl p-4 flex-row items-center shadow-sm"
    >
        {/* Avatar with Initial */}
        <View
            className="bg-yellow-100 rounded-full items-center justify-center mr-4"
            style={{ width: 48, height: 48 }}
        >
            <Text className="text-yellow-700 text-lg font-bold">
                {item.name.charAt(0).toUpperCase()}
            </Text>
        </View>

        {/* Customer Info */}
        <View className="flex-1">
            <Text className="text-gray-900 font-semibold">{item.name}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
                {item.phone || item.email || 'No contact info'}
            </Text>
            {item.city && (
                <Text className="text-gray-400 text-sm mt-0.5">{item.city}</Text>
            )}
        </View>

        {/* Transaction Count */}
        <View className="items-end">
            <Text className="text-gray-400 text-xs">Transactions</Text>
            <Text className="text-gray-900 font-bold text-lg">
                {item._count?.transactions || 0}
            </Text>
        </View>
    </Pressable>
);
```

### Pagination Pattern

```typescript
const [customers, setCustomers] = useState<Customer[]>([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [searchQuery, setSearchQuery] = useState('');

const fetchCustomers = async (pageNum = 1, refresh = false) => {
    const res = await api.get('/api/customers', {
        businessId: currentBusiness.id,
        page: pageNum,
        limit: 20,
        search: searchQuery || undefined,
    });

    const newCustomers = res.data?.data || [];

    if (refresh || pageNum === 1) {
        setCustomers(newCustomers);
    } else {
        setCustomers(prev => [...prev, ...newCustomers]);
    }

    setHasMore(newCustomers.length === 20);
    setPage(pageNum);
};

const loadMore = () => {
    if (!isLoading && hasMore) {
        fetchCustomers(page + 1);
    }
};

// Re-fetch on search change
useEffect(() => {
    setIsLoading(true);
    fetchCustomers(1, true);
}, [searchQuery]);
```

## Create Customer Screen

### File: `app/customers/create.tsx`

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Customer name |
| phone | string | ❌ | Phone number |
| email | string | ❌ | Email address |
| address | string | ❌ | Street address (multiline) |
| city | string | ❌ | City |
| notes | string | ❌ | Additional notes (multiline) |

### Form State Pattern

```typescript
const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
});

const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
};
```

### Form Input with Icon

```tsx
<View className="mb-4">
    <Text className="text-gray-700 text-sm font-medium mb-2">
        Name <Text className="text-red-500">*</Text>
    </Text>
    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
        <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
        <TextInput
            className="flex-1 ml-3 text-gray-900 text-base"
            placeholder="Customer name"
            placeholderTextColor="#9ca3af"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
        />
    </View>
</View>
```

### Grouped Form Sections

```tsx
{/* Basic Info Section */}
<View className="bg-white m-4 rounded-xl p-4">
    <Text className="text-gray-500 text-sm font-medium mb-4">
        Basic Information
    </Text>
    {/* Name, Phone, Email inputs */}
</View>

{/* Address Section */}
<View className="bg-white mx-4 rounded-xl p-4">
    <Text className="text-gray-500 text-sm font-medium mb-4">
        Address Information
    </Text>
    {/* Address, City inputs */}
</View>

{/* Notes Section */}
<View className="bg-white m-4 rounded-xl p-4">
    <Text className="text-gray-500 text-sm font-medium mb-4">
        Additional Notes
    </Text>
    {/* Notes textarea */}
</View>
```

### Submit Handler

```typescript
const handleSubmit = async () => {
    if (!form.name.trim()) {
        Alert.alert('Error', 'Customer name is required');
        return;
    }

    if (!currentBusiness) {
        Alert.alert('Error', 'No business selected');
        return;
    }

    setIsLoading(true);

    try {
        await api.post('/api/customers', {
            businessId: currentBusiness.id,
            name: form.name.trim(),
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            notes: form.notes.trim() || undefined,
        });

        Alert.alert('Success', 'Customer created successfully', [
            { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to create customer');
    } finally {
        setIsLoading(false);
    }
};
```

### Keyboard Handling

```tsx
<KeyboardAvoidingView
    className="flex-1 bg-gray-50"
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
    <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
    >
        {/* Form content */}
    </ScrollView>
</KeyboardAvoidingView>
```

## Customer Detail Screen

### File: `app/customers/[id].tsx`

### Features
- Display customer info
- Contact quick actions (Call, Email)
- Transaction history for this customer
- Edit and delete actions

### Getting Route Parameter

```typescript
import { useLocalSearchParams } from 'expo-router';

const { id } = useLocalSearchParams<{ id: string }>();
```

### Quick Action Buttons

```tsx
<View className="flex-row">
    {customer.phone && (
        <Pressable
            onPress={() => Linking.openURL(`tel:${customer.phone}`)}
            className="flex-1 bg-green-100 py-3 rounded-xl items-center mr-2"
        >
            <MaterialCommunityIcons name="phone" size={22} color="#22c55e" />
            <Text className="text-green-600 text-sm font-medium mt-1">Call</Text>
        </Pressable>
    )}
    {customer.email && (
        <Pressable
            onPress={() => Linking.openURL(`mailto:${customer.email}`)}
            className="flex-1 bg-blue-100 py-3 rounded-xl items-center"
        >
            <MaterialCommunityIcons name="email" size={22} color="#3b82f6" />
            <Text className="text-blue-600 text-sm font-medium mt-1">Email</Text>
        </Pressable>
    )}
</View>
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers with pagination |
| GET | `/api/customers/:id` | Get customer details |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Query Parameters for List

| Parameter | Type | Description |
|-----------|------|-------------|
| businessId | string | Required - Filter by business |
| page | number | Page number (default 1) |
| limit | number | Items per page (default 20) |
| search | string | Search by name/phone/email |

## Customer Selection in POS

The POS screen has a customer selector modal:

```tsx
// Customer selector in checkout
const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

<Pressable
    onPress={() => setShowCustomerModal(true)}
    className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-4"
>
    <MaterialCommunityIcons 
        name={selectedCustomer ? 'account-check' : 'account-plus'} 
        size={24} 
        color={selectedCustomer ? '#22c55e' : '#6b7280'} 
    />
    <Text className="flex-1 ml-3 text-gray-700">
        {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
    </Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
</Pressable>
```

## Permissions

- `view_customers` - View customer list and details
- `create_customers` - Create new customers
- `edit_customers` - Edit existing customers
- `delete_customers` - Delete customers
