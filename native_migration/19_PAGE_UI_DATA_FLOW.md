# Page-by-Page UI & Data Flow

## Overview

Complete UI design, data flow, and backend integration for every screen in the Tangabiz app. Includes wireframes, component usage, state management, and API calls.

---

## 1. Sign In Screen

**File:** `app/sign-in.tsx`

### UI Design

**Layout:**
```
┌─────────────────────────┐
│  Logo/Branding Header   │  (Safe Area)
├─────────────────────────┤
│                         │
│  "Sign In to Tangabiz"  │  (Heading)
│  "Enter your API key"   │  (Subtitle)
│                         │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ API Key Input     │  │  (Text Input)
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ [Sign In Button]  │  │  (Primary Button)
│  └───────────────────┘  │
│                         │
│  Don't have an API key? │  (Helper Text)
│  Contact CVT Support    │  (Secondary Link)
│                         │
└─────────────────────────┘
```

### Components Used
```tsx
<SafeAreaView className="flex-1 bg-white">
  <ScrollView className="px-6 py-8">
    {/* Header */}
    <View className="items-center mb-8">
      <MaterialCommunityIcons name="store-outline" size={48} color="#22c55e" />
      <Text className="text-3xl font-bold text-gray-900 mt-4">Tangabiz</Text>
      <Text className="text-gray-500 text-center mt-2">
        Point of Sale Management System
      </Text>
    </View>

    {/* Form */}
    <View className="mt-8">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Sign In</Text>
      <Text className="text-gray-600 mb-6">
        Enter your CVT API key to get started
      </Text>

      <Input
        label="API Key"
        placeholder="paste-your-api-key-here"
        icon="key-outline"
        value={apiKey}
        onChangeText={setApiKey}
        secureTextEntry={!showApiKey}
        error={errors.apiKey}
      />

      <Button
        title={loading ? "Signing in..." : "Sign In"}
        variant="primary"
        disabled={loading || !apiKey}
        onPress={handleSignIn}
      />

      <Text className="text-center text-gray-500 text-sm mt-4">
        Need help? Contact{' '}
        <Text 
          className="text-primary-500 font-semibold"
          onPress={() => Linking.openURL('mailto:support@cvt.com')}
        >
          CVT Support
        </Text>
      </Text>
    </View>
  </ScrollView>
</SafeAreaView>
```

### State Management
```tsx
// Using Zustand store
const authStore = create((set) => ({
  user: null,
  token: null,
  business: null,
  setAuth: (user, token, business) =>
    set({ user, token, business }),
  clearAuth: () =>
    set({ user: null, token: null, business: null }),
}));
```

### Data Flow
```
User Input (apiKey)
      ↓
Validation (check if empty)
      ↓
API Call: authApi.signIn(apiKey)
      ↓
Response: { token, user, business }
      ↓
Store in Zustand + AsyncStorage
      ↓
Navigate to Dashboard
```

### API Integration
```tsx
const handleSignIn = async () => {
  try {
    setLoading(true);
    setErrors({});
    
    if (!apiKey.trim()) {
      setErrors({ apiKey: 'API key is required' });
      return;
    }

    const response = await authApi.signIn(apiKey);
    
    if (response.success) {
      // Store auth data
      const authData = {
        token: response.data.token,
        user: response.data.user,
        business: response.data.business,
      };
      
      storage.set('tangabiz-auth', JSON.stringify(authData));
      authStore.setAuth(...Object.values(authData));
      
      // Haptic feedback
      triggerHapticFeedback('notificationSuccess');
      
      // Navigate
      router.replace('/(tabs)');
    } else {
      setErrors({ apiKey: response.error });
      triggerHapticFeedback('notificationError');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 2. Dashboard (Home) Screen

**File:** `app/(tabs)/index.tsx`

### UI Design

**Desktop/Tablet Layout:**
```
┌──────────────────────────────────────────┐
│ Welcome back, John Doe              [●]  │  (Header - Green BG)
├──────────────────────────────────────────┤
│                                          │
│ ┌──────────┐  ┌──────────┐  ┌────────┐ │
│ │ $50,000  │  │   2,450  │  │   850  │ │  (Stat Cards)
│ │  Sales   │  │Products  │  │Customers│
│ └──────────┘  └──────────┘  └────────┘ │
│                                          │
│ Quick Actions                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│ │  Create │ │   View  │ │ Generate│   │  (Action Buttons)
│ │  Sale   │ │Products │ │ Reports │   │
│ └─────────┘ └─────────┘ └─────────┘   │
│                                          │
│ Recent Transactions                      │
│ ┌────────────────────────────────────┐  │
│ │ Item 1 | Amount | Date | Status    │  │
│ │ Item 2 | Amount | Date | Status    │  │
│ │ Item 3 | Amount | Date | Status    │  │
│ └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### Components Used
```tsx
const Dashboard = () => {
  const { isTablet, isLargeTablet } = useResponsive();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className={`bg-primary-500 ${isTablet ? 'px-8 pt-6 pb-10' : 'px-5 pt-4 pb-8'}`}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-primary-100 ${typography.small}`}>Welcome back,</Text>
            <Text className={`text-white ${isTablet ? 'text-2xl' : 'text-xl'} font-bold`}>
              {user?.name}
            </Text>
          </View>
          <Pressable
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            onPress={() => router.push('/notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView className={`flex-1 ${isTablet ? 'px-8' : 'px-5'} py-4`}>
        {/* Stats Grid */}
        <View className={`flex-row ${isTablet ? 'gap-6' : 'gap-3'} mb-6 flex-wrap`}>
          <StatCard
            icon="currency-usd"
            label="Total Sales"
            value={`$${formatNumber(stats.totalSales)}`}
            color="#22c55e"
            flex={isTablet ? undefined : 1}
            width={isTablet ? '31%' : undefined}
          />
          <StatCard
            icon="package-variant"
            label="Products"
            value={stats.productCount}
            color="#eab308"
            flex={isTablet ? undefined : 1}
            width={isTablet ? '31%' : undefined}
          />
          <StatCard
            icon="people"
            label="Customers"
            value={stats.customerCount}
            color="#3b82f6"
            flex={isTablet ? undefined : 1}
            width={isTablet ? '31%' : undefined}
          />
        </View>

        {/* Quick Actions */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row gap-3">
            <QuickActionButton
              icon="plus"
              label="New Sale"
              onPress={() => router.push('/(tabs)/pos')}
              color="#22c55e"
            />
            <QuickActionButton
              icon="package"
              label="Add Product"
              onPress={() => router.push('/products/create')}
              color="#eab308"
            />
            <QuickActionButton
              icon="chart-line"
              label="Reports"
              onPress={() => router.push('/reports')}
              color="#3b82f6"
            />
          </View>
        </Card>

        {/* Recent Transactions */}
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">Recent Transactions</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <Text className="text-primary-500 font-medium">View All</Text>
            </Pressable>
          </View>

          {recentTransactions.length > 0 ? (
            <View className="bg-white rounded-xl shadow-sm overflow-hidden">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onPress={() => router.push(`/transactions/${transaction.id}`)}
                />
              ))}
            </View>
          ) : (
            <Card className="items-center py-8">
              <MaterialCommunityIcons name="inbox-outline" size={40} color="#d1d5db" />
              <Text className="text-gray-400 mt-2">No transactions yet</Text>
              <Button
                title="Create First Sale"
                variant="outline"
                className="mt-4"
                onPress={() => router.push('/(tabs)/pos')}
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
```

### State Management
```tsx
const [stats, setStats] = useState({
  totalSales: 0,
  productCount: 0,
  customerCount: 0,
});
const [recentTransactions, setRecentTransactions] = useState([]);
const [loading, setLoading] = useState(true);

// Fetch data
useEffect(() => {
  loadDashboardData();
  // Refresh every 30 seconds
  const interval = setInterval(loadDashboardData, 30000);
  return () => clearInterval(interval);
}, [businessId]);
```

### API Calls
```tsx
const loadDashboardData = async () => {
  try {
    const [statsRes, transactionsRes] = await Promise.all([
      api.get('/api/dashboard/stats', { businessId }),
      transactionsApi.list(businessId, { limit: 5 }),
    ]);

    if (statsRes.success) {
      setStats(statsRes.data);
    }
    if (transactionsRes.success) {
      setRecentTransactions(transactionsRes.data.data);
    }
  } catch (error) {
    showToast('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};
```

---

## 3. POS (Point of Sale) Screen

**File:** `app/(tabs)/pos.tsx`

### UI Design

**Mobile Layout:**
```
┌──────────────────────────┐
│ Products | Cart (2)      │  (Tabs + Badge)
├──────────────────────────┤
│ Search Products          │  (Search Input)
├──────────────────────────┤
│ [Product 1]              │
│ [Product 2]              │  (Product Grid)
│ [Product 3]              │
│ ...                      │
├──────────────────────────┤
│ Subtotal:    $150.00     │
│ Tax (10%):   $15.00      │  (Summary)
│ Total:       $165.00     │
│ [Checkout Button]        │
└──────────────────────────┘
```

**Cart Detail:**
```
┌──────────────────────────┐
│ Cart Items               │
├──────────────────────────┤
│ Product 1                │
│ Qty: [−] 2 [+] | $25.98  │
│                          │
│ Product 2                │
│ Qty: [−] 1 [+] | $99.99  │
├──────────────────────────┤
│ Subtotal:    $125.97     │
│ Discount:    -$10.00     │
│ Tax:         $12.60      │
│ Total:       $128.57     │
│                          │
│ [Select Customer]        │
│ [Payment Method ▼]       │
│ [Complete Sale Button]   │
└──────────────────────────┘
```

### Components Used
```tsx
const POSScreen = () => {
  const [tab, setTab] = useState<'products' | 'cart'>('products');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Tabs */}
      <View className="flex-row border-b border-gray-200 bg-white">
        <Pressable
          className={`flex-1 py-4 items-center ${
            tab === 'products' ? 'border-b-2 border-primary-500' : ''
          }`}
          onPress={() => setTab('products')}
        >
          <Text className={tab === 'products' ? 'font-semibold text-primary-500' : 'text-gray-600'}>
            Products
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-4 items-center flex-row justify-center ${
            tab === 'cart' ? 'border-b-2 border-primary-500' : ''
          }`}
          onPress={() => setTab('cart')}
        >
          <Text className={tab === 'cart' ? 'font-semibold text-primary-500' : 'text-gray-600'}>
            Cart
          </Text>
          {cart.length > 0 && (
            <Badge text={cart.length} variant="primary" className="ml-2" />
          )}
        </Pressable>
      </View>

      {tab === 'products' ? (
        <ProductsTab
          products={products}
          onAddToCart={(product) => addToCart(product)}
        />
      ) : (
        <CartTab
          cart={cart}
          selectedCustomer={selectedCustomer}
          paymentMethod={paymentMethod}
          onUpdateQuantity={(productId, qty) => updateCartQuantity(productId, qty)}
          onRemoveFromCart={(productId) => removeFromCart(productId)}
          onSelectCustomer={() => openCustomerSelector()}
          onChangePaymentMethod={setPaymentMethod}
          onCheckout={handleCheckout}
        />
      )}
    </SafeAreaView>
  );
};
```

### State Management
```tsx
const cartStore = create((set) => ({
  items: [],
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find(i => i.id === product.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter(i => i.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map(i =>
        i.id === productId ? { ...i, quantity } : i
      ),
    })),
  clear: () => set({ items: [] }),
}));
```

### API Calls
```tsx
// Load products for POS
useEffect(() => {
  const loadProducts = async () => {
    const response = await productsApi.list(businessId, {
      limit: 100,
    });
    if (response.success) {
      setProducts(response.data.data);
    }
  };
  loadProducts();
}, [businessId]);

// Complete checkout
const handleCheckout = async () => {
  try {
    setProcessing(true);
    
    const response = await transactionsApi.create({
      businessId,
      type: 'SALE',
      customerId: selectedCustomer?.id,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      paymentMethod,
      paymentStatus: 'PAID',
    });

    if (response.success) {
      showToast('Sale completed successfully');
      
      // Print receipt
      const receiptUrl = response.data.receiptUrl;
      await Print.printAsync({ uri: receiptUrl });
      
      // Clear cart
      cartStore.clear();
      setTab('products');
    }
  } finally {
    setProcessing(false);
  }
};
```

---

## 4. Products Screen

**File:** `app/(tabs)/products.tsx`

### UI Design

**Product List:**
```
┌──────────────────────────┐
│ [Search...] [+ Add]      │
├──────────────────────────┤
│ [Grid/List Toggle]       │
├──────────────────────────┤
│ ┌────────────────────┐   │
│ │ [Image]            │   │
│ │ Product Name       │   │  (Grid: 2 columns on mobile)
│ │ Price: $99.99      │   │  (Grid: 3-4 columns on tablet)
│ │ Stock: 45          │   │
│ │ [View Details →]   │   │
│ └────────────────────┘   │
│                          │
│ [Load More...]           │
└──────────────────────────┘
```

### Components Used
```tsx
const ProductsScreen = () => {
  const { gridColumns, isTablet } = useResponsive();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const columnWidth = 100 / gridColumns;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className={`bg-white px-5 py-4 border-b border-gray-200`}>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="flex-1">
            <Input
              placeholder="Search products..."
              icon="magnify"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Button
            title="+"
            variant="primary"
            size="lg"
            onPress={() => router.push('/products/create')}
          />
        </View>

        {/* View Mode Toggle */}
        <View className="flex-row gap-2">
          <Pressable
            className={`flex-1 py-2 rounded-lg items-center ${
              viewMode === 'grid' ? 'bg-primary-500' : 'bg-gray-200'
            }`}
            onPress={() => setViewMode('grid')}
          >
            <MaterialCommunityIcons name="view-grid" size={20} />
          </Pressable>
          <Pressable
            className={`flex-1 py-2 rounded-lg items-center ${
              viewMode === 'list' ? 'bg-primary-500' : 'bg-gray-200'
            }`}
            onPress={() => setViewMode('list')}
          >
            <MaterialCommunityIcons name="view-list" size={20} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'grid' ? (
        <FlatList
          data={products}
          numColumns={gridColumns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ width: `${columnWidth}%`, paddingHorizontal: 8 }}>
              <ProductCard
                product={item}
                onPress={() => router.push(`/products/${item.id}`)}
              />
            </View>
          )}
          onEndReached={loadMore}
          contentContainerStyle={{ paddingVertical: 12 }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductListItem
              product={item}
              onPress={() => router.push(`/products/${item.id}`)}
            />
          )}
          onEndReached={loadMore}
        />
      )}
    </SafeAreaView>
  );
};
```

### Product Card Component
```tsx
const ProductCard = ({ product, onPress }) => (
  <Pressable onPress={onPress} className="mb-4">
    <Card className="overflow-hidden">
      {/* Product Image */}
      <View className="w-full h-40 bg-gray-200 items-center justify-center">
        {product.images?.[0] ? (
          <Image
            source={{ uri: product.images[0].url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={40} color="#d1d5db" />
        )}
      </View>

      {/* Product Info */}
      <View className="p-3">
        <Text className="font-semibold text-gray-900 mb-1" numberOfLines={2}>
          {product.name}
        </Text>

        <Text className="text-primary-500 font-bold text-lg mb-2">
          ${formatNumber(product.price)}
        </Text>

        {/* Stock Status */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs text-gray-600">
            Stock: {product.quantity}
          </Text>
          <Badge
            text={product.quantity > product.minStock ? 'In Stock' : 'Low Stock'}
            variant={product.quantity > product.minStock ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        <Button title="View" size="sm" onPress={onPress} />
      </View>
    </Card>
  </Pressable>
);
```

### API Calls
```tsx
useEffect(() => {
  loadProducts();
}, [search, page, businessId]);

const loadProducts = async () => {
  setLoading(true);
  const response = await productsApi.list(businessId, {
    page,
    limit: 20,
    search,
  });

  if (response.success) {
    setProducts(
      page === 1
        ? response.data.data
        : [...products, ...response.data.data]
    );
    setHasMore(
      response.data.pagination.page < response.data.pagination.totalPages
    );
  }
  setLoading(false);
};
```

---

## 5. Transactions Screen

**File:** `app/(tabs)/transactions.tsx`

### UI Design

```
┌──────────────────────────────┐
│ Period: [Last 30 Days ▼]     │  (Period Selector)
├──────────────────────────────┤
│ Filter:  [Type ▼] [Status ▼] │  (Filters)
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ Product 1                │ │
│ │ INV-001 | Jan 20, 2024   │ │
│ │ $150.00 | ✓ Completed    │ │  (Transaction List)
│ └──────────────────────────┘ │
│                              │
│ [Show More...]               │
└──────────────────────────────┘
```

### Components Used
```tsx
const TransactionsScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState('MONTH');
  const [filters, setFilters] = useState({
    type: null,
    status: null,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Period Selector */}
      <View className="bg-white px-5 py-4 border-b border-gray-200">
        <PeriodSelector
          selectedPeriod={period}
          onPeriodChange={setPeriod}
        />
      </View>

      {/* Filters */}
      <View className="bg-white px-5 py-3 border-b border-gray-200 flex-row gap-2">
        <Pressable
          className="flex-1 flex-row items-center justify-between bg-gray-100 px-3 py-2 rounded-lg"
          onPress={() => setShowTypeFilter(true)}
        >
          <Text className="text-gray-700">
            {filters.type ? filters.type : 'All Types'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} />
        </Pressable>

        <Pressable
          className="flex-1 flex-row items-center justify-between bg-gray-100 px-3 py-2 rounded-lg"
          onPress={() => setShowStatusFilter(true)}
        >
          <Text className="text-gray-700">
            {filters.status ? filters.status : 'All Status'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={20} />
        </Pressable>
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionListItem
            transaction={item}
            onPress={() => router.push(`/transactions/${item.id}`)}
          />
        )}
        contentContainerStyle={{ padding: 12 }}
        onEndReached={loadMore}
      />
    </SafeAreaView>
  );
};

const TransactionListItem = ({ transaction, onPress }) => (
  <Pressable onPress={onPress} className="mb-3">
    <Card className="flex-row items-center">
      {/* Icon */}
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
          transaction.type === 'SALE' ? 'bg-green-100' : 'bg-red-100'
        }`}
      >
        <MaterialCommunityIcons
          name={transaction.type === 'SALE' ? 'plus' : 'minus'}
          size={24}
          color={transaction.type === 'SALE' ? '#22c55e' : '#ef4444'}
        />
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="font-semibold text-gray-900">
          {transaction.customer?.name || 'Walk-in Customer'}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {transaction.invoiceNumber} · {formatDate(transaction.createdAt)}
        </Text>
      </View>

      {/* Amount & Status */}
      <View className="items-end">
        <Text className="font-bold text-gray-900">
          ${formatNumber(transaction.total)}
        </Text>
        <Badge
          text={transaction.status}
          variant={transaction.status === 'COMPLETED' ? 'success' : 'gray'}
          size="sm"
          className="mt-1"
        />
      </View>
    </Card>
  </Pressable>
);
```

### API Integration
```tsx
useEffect(() => {
  loadTransactions();
}, [period, filters, businessId]);

const loadTransactions = async () => {
  const { startDate, endDate } = getPeriodDateRange(period);

  const response = await transactionsApi.list(businessId, {
    startDate,
    endDate,
    type: filters.type,
    status: filters.status,
    page: 1,
    limit: 20,
  });

  if (response.success) {
    setTransactions(response.data.data);
  }
};
```

---

## 6. Settings & More Screen

**File:** `app/(tabs)/more.tsx` or `app/settings/index.tsx`

### UI Design

```
┌──────────────────────────┐
│ More Settings            │
├──────────────────────────┤
│ Profile Section          │
│ [Account Logo]           │
│ John Doe                 │
│ john@example.com         │
├──────────────────────────┤
│ Business Section         │
│ [Switch Business ▼]      │
│ [Business Settings]      │
├──────────────────────────┤
│ App Settings             │
│ [Theme: Light/Dark]      │
│ [Notifications Toggle]   │
├──────────────────────────┤
│ Support & Legal          │
│ [Help & Support]         │
│ [Terms of Service]       │
│ [Privacy Policy]         │
├──────────────────────────┤
│ [Sign Out Button]        │
└──────────────────────────┘
```

### Components Used
```tsx
const MoreScreen = () => {
  const { user, businesses, business } = authStore();
  const [selectedBusiness, setSelectedBusiness] = useState(business);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
        {/* Profile Section */}
        <Card className="m-4 flex-row items-center">
          <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center">
            <Text className="text-2xl font-bold text-primary-500">
              {user?.name?.charAt(0)}
            </Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {user?.name}
            </Text>
            <Text className="text-sm text-gray-500">{user?.email}</Text>
            <Badge
              text={user?.role}
              variant={getRoleVariant(user?.role)}
              className="mt-2"
            />
          </View>
          <Pressable onPress={() => router.push('/settings/profile')}>
            <MaterialCommunityIcons name="pencil" size={24} color="#22c55e" />
          </Pressable>
        </Card>

        {/* Business Section */}
        {businesses.length > 1 && (
          <Card className="m-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Business
            </Text>
            <Pressable
              className="flex-row items-center justify-between py-3 px-3 bg-gray-100 rounded-lg"
              onPress={() => setShowBusinessSelector(true)}
            >
              <Text className="font-medium text-gray-900">
                {selectedBusiness?.name}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} />
            </Pressable>
          </Card>
        )}

        {/* Settings Sections */}
        <View className="m-4">
          <SettingsSection
            title="Account"
            items={[
              {
                icon: 'account-edit',
                label: 'Edit Profile',
                onPress: () => router.push('/settings/profile'),
              },
              {
                icon: 'lock',
                label: 'Change Password',
                onPress: () => router.push('/settings/password'),
              },
            ]}
          />

          <SettingsSection
            title="Preferences"
            items={[
              {
                icon: 'palette',
                label: 'Theme',
                value: 'Light',
                onPress: () => setShowThemeSelector(true),
              },
              {
                icon: 'bell',
                label: 'Notifications',
                toggle: true,
                value: notificationsEnabled,
                onToggle: setNotificationsEnabled,
              },
            ]}
          />

          <SettingsSection
            title="Support"
            items={[
              {
                icon: 'help-circle',
                label: 'Help & Support',
                onPress: () => Linking.openURL('https://help.tangabiz.com'),
              },
              {
                icon: 'file-document',
                label: 'Terms of Service',
                onPress: () => Linking.openURL('https://tangabiz.com/terms'),
              },
              {
                icon: 'shield-account',
                label: 'Privacy Policy',
                onPress: () => Linking.openURL('https://tangabiz.com/privacy'),
              },
            ]}
          />
        </View>

        {/* Sign Out */}
        <View className="mx-4 mb-6">
          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingsSection = ({ title, items }) => (
  <View className="mb-6">
    <Text className="text-sm font-semibold text-gray-600 uppercase mb-3 px-2">
      {title}
    </Text>
    <Card>
      {items.map((item, index) => (
        <View key={item.label}>
          <Pressable
            className="flex-row items-center justify-between py-4 px-4"
            onPress={item.onPress}
            disabled={item.toggle}
          >
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons
                name={item.icon as any}
                size={20}
                color="#6b7280"
                style={{ marginRight: 12 }}
              />
              <Text className="text-gray-900 font-medium">{item.label}</Text>
            </View>

            {item.toggle ? (
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
              />
            ) : (
              <View className="flex-row items-center">
                {item.value && (
                  <Text className="text-gray-500 mr-2">{item.value}</Text>
                )}
                <MaterialCommunityIcons name="chevron-right" size={20} color="#d1d5db" />
              </View>
            )}
          </Pressable>

          {index < items.length - 1 && (
            <View className="h-px bg-gray-200 mx-4" />
          )}
        </View>
      ))}
    </Card>
  </View>
);
```

---

## Summary of Page Flow

```
Sign In
   ↓
Dashboard (Home)
   ├→ POS (Create Sale)
   │   └→ Customers (Select/Create)
   │   └→ Products (Select Items)
   ├→ Products (Management)
   │   └→ Create Product
   │   └→ Product Details (Edit)
   ├→ Transactions (History)
   │   └→ Transaction Details
   ├→ Reports (Analytics)
   │   └→ Export/PDF
   ├→ AI Chat (Tatenda)
   └→ Settings/More
       ├→ Profile
       ├→ Business Settings
       └→ Preferences
```

---

## Common State Management Pattern

```tsx
// Zustand store example
const useDashboardStore = create((set) => ({
  // State
  stats: null,
  loading: false,
  error: null,
  
  // Actions
  loadStats: async (businessId) => {
    set({ loading: true });
    try {
      const response = await api.get('/api/dashboard/stats', { businessId });
      if (response.success) {
        set({ stats: response.data, error: null });
      } else {
        set({ error: response.error });
      }
    } finally {
      set({ loading: false });
    }
  },
  
  // Reset
  reset: () => set({ stats: null, error: null }),
}));

// Usage in component
const Dashboard = () => {
  const { stats, loading, loadStats } = useDashboardStore();
  
  useEffect(() => {
    loadStats(businessId);
  }, [businessId]);
};
```
