# Products Management

## Overview

Complete product management system with:
- Product listing with search and pagination
- Product creation with image upload
- Product detail view
- Stock management (add/subtract)
- Responsive grid layout for tablets
- Category filtering
- Low stock / out of stock alerts

## Files Structure

```
app/
├── (tabs)/
│   └── products.tsx           # Product listing tab
└── products/
    ├── _layout.tsx            # Stack navigator
    ├── create.tsx             # Create product form
    ├── [id].tsx               # Product detail view
    └── edit/
        └── [id].tsx           # Edit product form
```

## Data Types

```typescript
interface Product {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    image?: string;
    price: number;
    costPrice?: number;
    quantity: number;         // Current stock
    minQuantity: number;      // Low stock alert threshold
    unit: string;             // piece, kg, liter, etc.
    isActive: boolean;
    categoryId?: string;
    category?: { id: string; name: string };
    createdAt: string;
    updatedAt: string;
    createdBy?: { name: string };
}

interface Category {
    id: string;
    name: string;
}
```

## Products Listing Screen

### File: `app/(tabs)/products.tsx`

### Features
- Search bar with debounced query
- Infinite scroll pagination
- Pull-to-refresh
- Responsive grid (1 col mobile, 2 col tablet, 3 col large tablet)
- Stock status badges (Low Stock, Out of Stock)
- FAB for quick add
- Permission-based add button

### Key Implementation

```typescript
// Pagination state
const [products, setProducts] = useState<Product[]>([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [searchQuery, setSearchQuery] = useState('');

// Fetch with pagination
const fetchProducts = async (pageNum = 1, refresh = false) => {
    const res = await api.get('/api/products', {
        businessId: currentBusiness.id,
        page: pageNum,
        limit: 20,
        search: searchQuery || undefined,
    });

    const newProducts = res.data?.data || [];

    if (refresh || pageNum === 1) {
        setProducts(newProducts);
    } else {
        setProducts(prev => [...prev, ...newProducts]);
    }

    setHasMore(newProducts.length === 20);
    setPage(pageNum);
};

// Load more on scroll
const loadMore = () => {
    if (!isLoading && hasMore) {
        fetchProducts(page + 1);
    }
};
```

### Responsive Grid

```typescript
const { deviceType } = useResponsive();
const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
const isLargeTablet = deviceType === 'largeTablet';
const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;

<FlatList
    data={products}
    numColumns={numColumns}
    key={numColumns}  // Re-render when columns change
    onEndReached={loadMore}
    onEndReachedThreshold={0.5}
/>
```

### Product Card

```tsx
const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.quantity <= item.minQuantity;
    const isOutOfStock = item.quantity === 0;

    return (
        <Pressable
            onPress={() => router.push(`/products/${item.id}`)}
            className="bg-white mx-4 mb-3 rounded-xl p-4 flex-row items-center shadow-sm"
        >
            {/* Product Image */}
            <View className="w-16 h-16 bg-gray-100 rounded-lg items-center justify-center mr-4 overflow-hidden">
                {item.image ? (
                    <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <MaterialCommunityIcons name="package-variant" size={24} color="#9ca3af" />
                )}
            </View>

            {/* Product Info */}
            <View className="flex-1">
                <Text className="text-gray-900 font-semibold" numberOfLines={1}>{item.name}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">
                    {item.sku || 'No SKU'} {item.category && `• ${item.category.name}`}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Text className="text-green-600 font-bold">{formatCurrency(item.price)}</Text>
                    {isOutOfStock && (
                        <View className="bg-red-100 px-2 py-0.5 rounded ml-2">
                            <Text className="text-red-600 text-xs font-medium">Out of Stock</Text>
                        </View>
                    )}
                    {isLowStock && !isOutOfStock && (
                        <View className="bg-yellow-100 px-2 py-0.5 rounded ml-2">
                            <Text className="text-yellow-700 text-xs font-medium">Low Stock</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stock Badge */}
            <View className="items-end">
                <Text className="text-gray-400 text-xs">Stock</Text>
                <Text className={`text-lg font-bold ${
                    isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-600' : 'text-gray-900'
                }`}>
                    {item.quantity}
                </Text>
            </View>
        </Pressable>
    );
};
```

## Create Product Screen

### File: `app/products/create.tsx`

### Form Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Product name |
| description | string | ❌ | Multiline description |
| price | number | ✅ | Selling price |
| costPrice | number | ❌ | Cost/purchase price |
| quantity | number | ❌ | Initial stock (default 0) |
| minQuantity | number | ❌ | Low stock alert threshold |
| sku | string | ❌ | Stock keeping unit |
| barcode | string | ❌ | Product barcode |
| unit | string | ❌ | Unit of measure (default "piece") |
| categoryId | string | ❌ | Category ID |
| image | string | ❌ | Image URI |

### Image Upload

```typescript
import { pickImage, takePhoto } from '@/lib/files';

const handlePickImage = async () => {
    Alert.alert('Add Image', 'Choose an option', [
        {
            text: 'Camera',
            onPress: async () => {
                const result = await takePhoto({ quality: 0.8 });
                if (result) {
                    setImage(result.uri);
                }
            },
        },
        {
            text: 'Gallery',
            onPress: async () => {
                const result = await pickImage({ quality: 0.8 });
                if (result && result[0]) {
                    setImage(result[0].uri);
                }
            },
        },
        { text: 'Cancel', style: 'cancel' },
    ]);
};
```

### Category Selector

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <Pressable
        onPress={() => setCategoryId(null)}
        className={`px-4 py-2 rounded-full mr-2 ${!categoryId ? 'bg-green-500' : 'bg-gray-100'}`}
    >
        <Text className={!categoryId ? 'text-white' : 'text-gray-600'}>None</Text>
    </Pressable>
    {categories.map((cat) => (
        <Pressable
            key={cat.id}
            onPress={() => setCategoryId(cat.id)}
            className={`px-4 py-2 rounded-full mr-2 ${categoryId === cat.id ? 'bg-green-500' : 'bg-gray-100'}`}
        >
            <Text className={categoryId === cat.id ? 'text-white' : 'text-gray-600'}>
                {cat.name}
            </Text>
        </Pressable>
    ))}
</ScrollView>
```

### Submit Handler

```typescript
const handleSubmit = async () => {
    if (!name.trim()) {
        toast.error('Name is required');
        return;
    }
    if (!price || Number(price) <= 0) {
        toast.error('Valid price is required');
        return;
    }

    setIsLoading(true);
    haptics.medium();

    try {
        const productData = {
            businessId: currentBusiness?.id,
            name: name.trim(),
            description: description.trim() || undefined,
            sku: sku.trim() || undefined,
            barcode: barcode.trim() || undefined,
            price: Number(price),
            costPrice: costPrice ? Number(costPrice) : undefined,
            quantity: Number(quantity) || 0,
            minQuantity: Number(minQuantity) || 0,
            unit: unit.trim() || 'piece',
            categoryId: categoryId || undefined,
            image: image || undefined,
        };

        const res = await api.post('/api/products', productData);

        if (res.success) {
            haptics.success();
            toast.success('Product created!', name);
            router.back();
        } else {
            toast.error('Failed to create product', res.error);
        }
    } catch (error) {
        toast.error('Failed to create product');
    } finally {
        setIsLoading(false);
    }
};
```

### Reusable Form Input Component

```tsx
const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    required = false,
}: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
    multiline?: boolean;
    required?: boolean;
}) => (
    <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-1.5">
            {label} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TextInput
            className={`bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 ${
                multiline ? 'h-24' : ''
            }`}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
        />
    </View>
);
```

## Product Detail Screen

### File: `app/products/[id].tsx`

### Features
- Full product info display
- Stock level with status badge
- Stock adjustment buttons (add/subtract)
- Edit and delete actions
- Profit calculation display
- Created/updated timestamps

### Stock Adjustment

```typescript
const handleStockAdjust = (operation: 'add' | 'subtract') => {
    Alert.prompt(
        `${operation === 'add' ? 'Add' : 'Remove'} Stock`,
        'Enter quantity:',
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: operation === 'add' ? 'Add' : 'Remove',
                onPress: async (value: string) => {
                    const qty = Number(value);
                    if (!qty || qty <= 0) {
                        toast.error('Invalid quantity');
                        return;
                    }
                    try {
                        const res = await api.patch(`/api/products/${id}/stock`, {
                            quantity: qty,
                            operation,
                        });
                        if (res.success) {
                            haptics.success();
                            toast.success('Stock updated');
                            fetchProduct(); // Refresh
                        } else {
                            toast.error('Failed to update stock', res.error);
                        }
                    } catch (error) {
                        toast.error('Failed to update stock');
                    }
                },
            },
        ],
        'plain-text',
        '',
        'number-pad'
    );
};
```

### Delete Confirmation

```typescript
const handleDelete = () => {
    Alert.alert(
        'Delete Product',
        'Are you sure you want to delete this product? This action cannot be undone.',
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    haptics.medium();
                    try {
                        const res = await api.delete(`/api/products/${id}`);
                        if (res.success) {
                            haptics.success();
                            toast.success('Product deleted');
                            router.back();
                        } else {
                            toast.error('Failed to delete product', res.error);
                        }
                    } catch (error) {
                        toast.error('Failed to delete product');
                    }
                },
            },
        ]
    );
};
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products with pagination |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| PATCH | `/api/products/:id/stock` | Adjust stock |
| GET | `/api/products/categories` | List categories |

### Query Parameters for List

| Parameter | Type | Description |
|-----------|------|-------------|
| businessId | string | Required - Filter by business |
| page | number | Page number (default 1) |
| limit | number | Items per page (default 20) |
| search | string | Search by name/SKU |
| categoryId | string | Filter by category |
| isActive | boolean | Filter by active status |

## Permissions

- `view_products` - View product list and details
- `create_products` - Create new products
- `edit_products` - Edit existing products
- `delete_products` - Delete products
- `manage_stock` - Adjust stock levels
