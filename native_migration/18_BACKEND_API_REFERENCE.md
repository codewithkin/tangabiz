# Backend API Reference & Page Integration

## Overview

Complete backend API documentation with all endpoints, request/response formats, and how each screen integrates with the backend. Base URL: `http://localhost:3001` (configurable via `EXPO_PUBLIC_API_URL` env variable).

## API Client Setup

### File: `lib/api.ts`

The API client handles:
- Token injection from AsyncStorage
- Request/response formatting
- Error handling
- Timeouts (30 seconds default)
- Bearer token authentication

```typescript
// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', headers = {}, body, params, timeout = 30000 } = options;
  
  // Token is automatically injected from 'tangabiz-auth' storage key
  const token = getAuthToken();
  // Authorization header: Bearer {token}
};

// Convenience methods
export const api = {
  get: <T>(endpoint, params) => apiRequest<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint, body, options) => apiRequest<T>(endpoint, { method: 'POST', body, ...options }),
  put: <T>(endpoint, body, options) => apiRequest<T>(endpoint, { method: 'PUT', body, ...options }),
  patch: <T>(endpoint, body, options) => apiRequest<T>(endpoint, { method: 'PATCH', body, ...options }),
  delete: <T>(endpoint, options) => apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};
```

## Auth API

### Sign In
```typescript
POST /api/auth/sign-in
```

**Request:**
```json
{
  "apiKey": "string (from CVT integration)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "ADMIN" | "MANAGER" | "STAFF",
      "businessId": "business_id",
      "permissions": ["permission1", "permission2"]
    },
    "business": {
      "id": "business_id",
      "name": "Business Name",
      "logo": "url_to_logo",
      "primaryColor": "#22c55e"
    }
  }
}
```

**Integration (Sign In Screen)**:
```tsx
// app/sign-in.tsx
const handleSignIn = async () => {
  const response = await authApi.signIn(apiKey);
  if (response.success) {
    // Store token and user in Zustand store
    // Navigate to dashboard
  }
};
```

### Sign Out
```typescript
POST /api/auth/sign-out
```

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

### Verify Token
```typescript
POST /api/auth/verify
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": { /* user object */ }
  }
}
```

### Get Current User
```typescript
GET /api/auth/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "businessId": "business_id",
    "permissions": ["*"]
  }
}
```

**Integration (App Layout - Token Verification)**:
```tsx
// app/_layout.tsx
useEffect(() => {
  const verifyToken = async () => {
    const response = await authApi.verify();
    if (!response.success) {
      // Redirect to login
    }
  };
  verifyToken();
}, []);
```

---

## Business API

### List Businesses
```typescript
GET /api/business
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "business_id",
      "name": "My Business",
      "description": "Business description",
      "logo": "url",
      "primaryColor": "#22c55e",
      "currency": "USD",
      "timezone": "UTC",
      "owner": { /* user object */ },
      "createdAt": "2024-01-20T00:00:00Z"
    }
  ]
}
```

**Integration (Dashboard - Business Selector)**:
```tsx
// Component for selecting/switching business
const [businesses, setBusinesses] = useState([]);

useEffect(() => {
  const loadBusinesses = async () => {
    const response = await businessApi.list();
    if (response.success) {
      setBusinesses(response.data);
    }
  };
  loadBusinesses();
}, []);
```

### Get Business Details
```typescript
GET /api/business/{id}
```

### Create Business
```typescript
POST /api/business
```

**Request:**
```json
{
  "name": "My New Business",
  "description": "Business description",
  "currency": "USD",
  "timezone": "UTC"
}
```

### Update Business
```typescript
PUT /api/business/{id}
```

### Get Business Members
```typescript
GET /api/business/{id}/members
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "member_id",
      "user": { /* user object */ },
      "role": "ADMIN" | "MANAGER" | "STAFF",
      "permissions": ["permission1", "permission2"],
      "joinedAt": "2024-01-20T00:00:00Z"
    }
  ]
}
```

---

## Products API

### List Products
```typescript
GET /api/products?businessId={id}&page={page}&limit={limit}&search={search}&categoryId={id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "product_id",
        "name": "Product Name",
        "description": "Product description",
        "sku": "SKU123",
        "price": 99.99,
        "cost": 50.00,
        "quantity": 100,
        "minStock": 10,
        "categoryId": "category_id",
        "category": {
          "id": "category_id",
          "name": "Electronics"
        },
        "images": [
          {
            "id": "image_id",
            "url": "https://...",
            "isPrimary": true
          }
        ],
        "barcode": "123456789",
        "status": "ACTIVE" | "INACTIVE",
        "createdAt": "2024-01-20T00:00:00Z",
        "updatedAt": "2024-01-20T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Integration (Products Screen)**:
```tsx
// app/(tabs)/products.tsx
const { isMobile } = useResponsive();
const [products, setProducts] = useState([]);
const [page, setPage] = useState(1);
const [search, setSearch] = useState('');

useEffect(() => {
  const loadProducts = async () => {
    const response = await productsApi.list(businessId, {
      page,
      limit: isMobile ? 10 : 20,
      search,
    });
    if (response.success) {
      setProducts(response.data.data);
    }
  };
  loadProducts();
}, [page, search, businessId]);
```

### Get Single Product
```typescript
GET /api/products/{id}
```

**Integration (Product Details Screen)**:
```tsx
// app/products/[id].tsx
useEffect(() => {
  const loadProduct = async () => {
    const response = await productsApi.get(productId);
    if (response.success) {
      setProduct(response.data);
    }
  };
  loadProduct();
}, [productId]);
```

### Create Product
```typescript
POST /api/products
```

**Request:**
```json
{
  "businessId": "business_id",
  "name": "New Product",
  "description": "Product description",
  "sku": "SKU123",
  "price": 99.99,
  "cost": 50.00,
  "quantity": 100,
  "minStock": 10,
  "categoryId": "category_id",
  "barcode": "123456789",
  "images": [
    {
      "url": "https://...",
      "isPrimary": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new_product_id",
    /* full product object */
  }
}
```

**Integration (Create Product Screen)**:
```tsx
// app/products/create.tsx
const handleCreateProduct = async () => {
  const response = await productsApi.create({
    businessId,
    name: formData.name,
    description: formData.description,
    sku: formData.sku,
    price: parseFloat(formData.price),
    cost: parseFloat(formData.cost),
    quantity: parseInt(formData.quantity),
    minStock: parseInt(formData.minStock),
    categoryId: selectedCategory?.id,
    images: uploadedImages,
  });
  
  if (response.success) {
    showToast('Product created successfully');
    router.back();
  }
};
```

### Update Product
```typescript
PUT /api/products/{id}
```

### Delete Product
```typescript
DELETE /api/products/{id}
```

### Update Stock
```typescript
PATCH /api/products/{id}/stock
```

**Request:**
```json
{
  "quantity": 10,
  "operation": "add" | "subtract" | "set"
}
```

**Integration (After Sale/Return)**:
```tsx
// After completing a transaction
const updateProductStock = async (productId: string, quantity: number) => {
  const response = await productsApi.updateStock(productId, quantity, 'subtract');
  if (response.success) {
    // Stock updated
  }
};
```

### Get Low Stock Products
```typescript
GET /api/products/low-stock?businessId={id}
```

**Integration (Dashboard - Inventory Alert)**:
```tsx
useEffect(() => {
  const loadLowStock = async () => {
    const response = await productsApi.getLowStock(businessId);
    if (response.success && response.data.length > 0) {
      // Show warning: Low stock items
    }
  };
  loadLowStock();
}, [businessId]);
```

---

## Customers API

### List Customers
```typescript
GET /api/customers?businessId={id}&page={page}&limit={limit}&search={search}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "customer_id",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "address": "123 Main St, City, Country",
        "city": "City",
        "country": "Country",
        "businessId": "business_id",
        "totalSpent": 5000.00,
        "totalTransactions": 25,
        "lastPurchase": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 450,
      "totalPages": 23
    }
  }
}
```

**Integration (Customers Screen)**:
```tsx
// app/(tabs)/customers.tsx (if exists) or in POS customer selection
const [customers, setCustomers] = useState([]);
const [search, setSearch] = useState('');

useEffect(() => {
  const loadCustomers = async () => {
    const response = await customersApi.list(businessId, {
      page: 1,
      limit: 100,
      search,
    });
    if (response.success) {
      setCustomers(response.data.data);
    }
  };
  loadCustomers();
}, [search, businessId]);
```

### Get Single Customer
```typescript
GET /api/customers/{id}
```

### Create Customer
```typescript
POST /api/customers
```

**Request:**
```json
{
  "businessId": "business_id",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "address": "456 Oak Ave, City, Country",
  "city": "City",
  "country": "Country"
}
```

**Integration (Create Customer in POS)**:
```tsx
// During checkout, if "new customer" option selected
const handleCreateCustomer = async () => {
  const response = await customersApi.create({
    businessId,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    address: customerData.address,
  });
  
  if (response.success) {
    // Set created customer as selected customer
    setSelectedCustomer(response.data);
  }
};
```

### Update Customer
```typescript
PUT /api/customers/{id}
```

### Delete Customer
```typescript
DELETE /api/customers/{id}
```

### Get Customer Transactions
```typescript
GET /api/customers/{id}/transactions?page={page}&limit={limit}
```

---

## Transactions API

### List Transactions
```typescript
GET /api/transactions?businessId={id}&page={page}&limit={limit}&type={type}&status={status}&startDate={date}&endDate={date}&customerId={id}
```

**Query Parameters:**
- `type`: SALE | RETURN | REFUND
- `status`: PENDING | COMPLETED | CANCELLED
- `startDate`: ISO date string (filters transactions on or after)
- `endDate`: ISO date string (filters transactions on or before)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "transaction_id",
        "type": "SALE",
        "status": "COMPLETED",
        "businessId": "business_id",
        "customerId": "customer_id",
        "customer": {
          "id": "customer_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "items": [
          {
            "id": "transaction_item_id",
            "product": {
              "id": "product_id",
              "name": "Product Name",
              "sku": "SKU123"
            },
            "quantity": 2,
            "unitPrice": 99.99,
            "total": 199.98,
            "discount": 0
          }
        ],
        "subtotal": 199.98,
        "tax": 19.98,
        "discount": 0,
        "total": 219.96,
        "paymentMethod": "CASH" | "CARD" | "MOBILE_MONEY" | "CHECK",
        "paymentStatus": "PAID" | "PENDING",
        "notes": "Special order",
        "invoiceNumber": "INV-2024-001",
        "createdAt": "2024-01-20T10:30:00Z",
        "updatedAt": "2024-01-20T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500,
      "totalPages": 25
    }
  }
}
```

**Integration (Transactions Screen)**:
```tsx
// app/(tabs)/transactions.tsx
const [transactions, setTransactions] = useState([]);
const [filters, setFilters] = useState({
  type: null,
  status: 'COMPLETED',
  startDate: null,
  endDate: null,
});

useEffect(() => {
  const loadTransactions = async () => {
    const response = await transactionsApi.list(businessId, {
      page: 1,
      limit: 20,
      ...filters,
    });
    if (response.success) {
      setTransactions(response.data.data);
    }
  };
  loadTransactions();
}, [filters, businessId]);
```

### Create Transaction (Sale)
```typescript
POST /api/transactions
```

**Request:**
```json
{
  "businessId": "business_id",
  "type": "SALE",
  "customerId": "customer_id (optional)",
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "unitPrice": 99.99,
      "discount": 0
    }
  ],
  "subtotal": 199.98,
  "tax": 19.98,
  "discount": 0,
  "total": 219.96,
  "paymentMethod": "CASH" | "CARD" | "MOBILE_MONEY",
  "paymentStatus": "PAID",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction_id",
    "invoiceNumber": "INV-2024-001",
    /* full transaction object */
  }
}
```

**Integration (POS Checkout)**:
```tsx
// app/(tabs)/pos.tsx - After checkout
const handleCompleteCheckout = async () => {
  const response = await transactionsApi.create({
    businessId,
    type: 'SALE',
    customerId: selectedCustomer?.id,
    items: cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
    })),
    subtotal: calculateSubtotal(),
    tax: calculateTax(),
    discount: cartDiscount,
    total: calculateTotal(),
    paymentMethod: selectedPaymentMethod,
    paymentStatus: 'PAID',
  });
  
  if (response.success) {
    showToast('Sale completed successfully');
    printReceipt(response.data);
    clearCart();
  }
};
```

### Get Transaction Details
```typescript
GET /api/transactions/{id}
```

### Get Transaction Receipt
```typescript
GET /api/transactions/{id}/receipt
```

**Returns PDF or printable receipt data**

**Integration (Print/Share Receipt)**:
```tsx
const handlePrintReceipt = async (transactionId: string) => {
  const response = await transactionsApi.getReceipt(transactionId);
  if (response.success) {
    // Pass to print function or download
    Print.printAsync({ uri: response.data.receiptUrl });
  }
};
```

### Refund Transaction
```typescript
POST /api/transactions/{id}/refund
```

**Request:**
```json
{
  "reason": "Customer requested refund",
  "items": [
    {
      "itemId": "transaction_item_id",
      "quantity": 1
    }
  ],
  "amount": 99.99
}
```

### Cancel Transaction
```typescript
PATCH /api/transactions/{id}/cancel
```

---

## Reports API

### Get Sales Summary
```typescript
GET /api/reports/sales-summary?businessId={id}&startDate={date}&endDate={date}&period={period}
```

**Query Parameters:**
- `period`: TODAY | WEEK | MONTH | QUARTER | YEAR

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSales": 50000.00,
    "totalTransactions": 250,
    "averageOrderValue": 200.00,
    "growth": 15.5,
    "byPaymentMethod": {
      "CASH": 25000.00,
      "CARD": 20000.00,
      "MOBILE_MONEY": 5000.00
    },
    "dailyData": [
      {
        "date": "2024-01-20",
        "sales": 2500.00,
        "transactions": 15
      }
    ],
    "topProducts": [
      {
        "id": "product_id",
        "name": "Product Name",
        "sold": 150,
        "revenue": 14999.50
      }
    ]
  }
}
```

**Integration (Reports Dashboard)**:
```tsx
// app/reports/index.tsx
const [reportData, setReportData] = useState(null);
const [period, setPeriod] = useState('MONTH');

useEffect(() => {
  const loadReport = async () => {
    const response = await reportsApi.getSalesSummary(businessId, {
      period,
      startDate: getStartDate(period),
      endDate: getEndDate(period),
    });
    if (response.success) {
      setReportData(response.data);
    }
  };
  loadReport();
}, [period, businessId]);

// Render charts with reportData
<LineChart
  data={reportData.dailyData}
  xKey="date"
  yKey="sales"
  width={width}
  height={300}
/>
```

### Get Inventory Summary
```typescript
GET /api/reports/inventory-summary?businessId={id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 500,
    "activeProducts": 480,
    "inactiveProducts": 20,
    "totalValue": 100000.00,
    "lowStockItems": 25,
    "outOfStock": 5,
    "categories": [
      {
        "id": "category_id",
        "name": "Electronics",
        "count": 120,
        "value": 50000.00
      }
    ]
  }
}
```

### Get Customer Summary
```typescript
GET /api/reports/customer-summary?businessId={id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 1500,
    "activeCustomers": 1200,
    "totalRevenue": 500000.00,
    "averageCustomerValue": 333.33,
    "topCustomers": [
      {
        "id": "customer_id",
        "name": "John Doe",
        "totalSpent": 25000.00,
        "transactions": 100
      }
    ]
  }
}
```

---

## Upload API

### Get Presigned URL
```typescript
POST /api/upload/presigned-url
```

**Request:**
```json
{
  "filename": "product-image.jpg",
  "contentType": "image/jpeg",
  "folder": "products"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "key": "products/product-image.jpg",
    "expiresIn": 3600
  }
}
```

**Integration (Product Image Upload)**:
```tsx
// In product create/edit screen
const handleUploadImage = async (imageUri: string) => {
  // Get filename from URI
  const filename = imageUri.split('/').pop();
  
  // Get presigned URL
  const presignedResponse = await uploadApi.getPresignedUrl({
    filename,
    contentType: 'image/jpeg',
    folder: 'products',
  });
  
  if (presignedResponse.success) {
    // Upload directly to S3
    const uploadResponse = await fetch(presignedResponse.data.uploadUrl, {
      method: 'PUT',
      body: await fetch(imageUri).then(r => r.blob()),
      headers: { 'Content-Type': 'image/jpeg' },
    });
    
    if (uploadResponse.ok) {
      // Confirm upload with backend
      await uploadApi.confirmUpload({
        key: presignedResponse.data.key,
        url: buildImageUrl(presignedResponse.data.key),
      });
    }
  }
};
```

### Confirm Upload
```typescript
POST /api/upload/confirm
```

---

## AI Chat API (Tatenda Integration)

### Stream Chat Response
```typescript
POST /api/ai/chat/stream (Server-Sent Events)
```

**Request:**
```json
{
  "message": "What are my top selling products?",
  "businessId": "business_id",
  "context": "dashboard"
}
```

**Response (Streaming):**
```
data: {"type": "token", "content": "Based"}
data: {"type": "token", "content": " on"}
data: {"type": "token", "content": " your"}
...
data: {"type": "complete", "content": "full response"}
```

**Integration (AI Chat Screen)**:
```tsx
// app/ai/index.tsx
const handleSendMessage = async (message: string) => {
  setIsLoading(true);
  let fullResponse = '';
  
  const eventSource = new EventSource(
    `/api/ai/chat/stream?message=${encodeURIComponent(message)}&businessId=${businessId}`
  );
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'token') {
      fullResponse += data.content;
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: fullResponse }
      ]);
    } else if (data.type === 'complete') {
      eventSource.close();
      setIsLoading(false);
    }
  };
};
```

---

## Error Handling

All API responses follow this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

**Common Error Codes:**
- `401`: Unauthorized (token expired)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `409`: Conflict (duplicate entry)
- `422`: Validation error
- `500`: Server error

**Global Error Handler:**
```tsx
// lib/api.ts
export const handleApiError = (error: ApiResponse<any>) => {
  if (!error.success) {
    switch (true) {
      case error.error?.includes('401'):
        // Redirect to login
        break;
      case error.error?.includes('403'):
        showToast('You do not have permission to perform this action');
        break;
      case error.error?.includes('Timeout'):
        showToast('Request timeout. Please check your connection');
        break;
      default:
        showToast(error.error || 'Something went wrong');
    }
  }
};
```

---

## Common API Patterns

### Loading Data
```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const response = await api.get(endpoint);
    if (response.success) {
      setData(response.data);
    } else {
      setError(response.error);
    }
    setLoading(false);
  };
  loadData();
}, []);
```

### Paginated Data
```tsx
const [items, setItems] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const response = await api.get(endpoint, {
    page: page + 1,
    limit: 20,
  });
  
  if (response.success) {
    setItems([...items, ...response.data.data]);
    setPage(page + 1);
    setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
  }
};
```

### Form Submission
```tsx
const handleSubmit = async (formData) => {
  setSubmitting(true);
  const response = await api.post(endpoint, formData);
  
  if (response.success) {
    showToast('Success!');
    router.back();
  } else {
    setFieldErrors({
      [errorField]: response.error,
    });
  }
  
  setSubmitting(false);
};
```

---

## Environment Variables

```bash
# .env or .env.local
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_MAX_UPLOAD_SIZE=10485760  # 10MB
```

---

## Response Time Targets

- Listing endpoints: < 2 seconds
- Detail endpoints: < 1.5 seconds
- Create/Update: < 3 seconds
- Search: < 1 second
- Analytics/Reports: < 5 seconds

---

## Rate Limiting

- 100 requests per minute per API key
- 10,000 requests per day per API key
- Returns 429 status when exceeded

---

## CORS Configuration

API allows requests from:
- `http://localhost:8081` (Expo)
- `http://localhost:3000` (Web)
- Production domain (configurable)
