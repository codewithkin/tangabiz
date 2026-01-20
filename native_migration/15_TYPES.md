# TypeScript Types

## Overview

Complete type definitions for the Tangabiz native app:
- User and authentication types
- Business and role types
- Product and category types
- Customer types
- Transaction and POS types
- Report types
- API response types
- Form data types

## File: `types/index.ts`

## User & Authentication

```typescript
export interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Session {
    id: string;
    token: string;
    expiresAt: string;
    userId: string;
}
```

## Business & Roles

```typescript
export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface Business {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    currency: string;
    timezone: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BusinessMember {
    id: string;
    role: Role;
    isActive: boolean;
    joinedAt: string;
    userId: string;
    businessId: string;
    user?: User;
    business?: Business;
}

// Convenience type for business with user's role
export interface BusinessWithRole extends Business {
    role: Role;
}
```

## Categories

```typescript
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    isActive: boolean;
    businessId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        products: number;
    };
}
```

## Products

```typescript
export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    sku?: string;
    barcode?: string;
    image?: string;
    images: string[];
    price: number | string;
    costPrice?: number | string;
    quantity: number;
    minQuantity: number;
    unit: string;
    isActive: boolean;
    businessId: string;
    categoryId?: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    category?: Category;
    createdBy?: User;
}
```

## Customers

```typescript
export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
    isActive: boolean;
    businessId: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: User;
    _count?: {
        transactions: number;
    };
}
```

## Transactions

```typescript
export type TransactionType = 'SALE' | 'REFUND' | 'EXPENSE' | 'INCOME';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'OTHER';

export interface TransactionItem {
    id: string;
    quantity: number;
    unitPrice: number | string;
    discount: number | string;
    total: number | string;
    productName: string;
    productSku?: string;
    transactionId: string;
    productId?: string;
    product?: Product;
    createdAt: string;
}

export interface Transaction {
    id: string;
    reference: string;
    type: TransactionType;
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    subtotal: number | string;
    discount: number | string;
    total: number | string;
    amountPaid: number | string;
    change: number | string;
    notes?: string;
    businessId: string;
    customerId?: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
    createdBy?: User;
    items: TransactionItem[];
}
```

## Reports

```typescript
export type ReportType = 'SALES' | 'INVENTORY' | 'CUSTOMERS' | 'TRANSACTIONS' | 'CUSTOM';
export type ReportPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export interface Report {
    id: string;
    name: string;
    type: ReportType;
    period: ReportPeriod;
    startDate: string;
    endDate: string;
    fileUrl?: string;
    fileSize?: number;
    parameters?: Record<string, any>;
    businessId: string;
    createdAt: string;
}
```

## API Response Types

### Pagination

```typescript
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedList<T> {
    data: T[];
    pagination: Pagination;
}
```

### Summary Types

```typescript
export interface SalesSummary {
    totalSales: number;
    totalTransactions: number;
    averageTransaction: number;
    topProducts: Array<{
        productId: string;
        productName: string;
        quantity: number;
        total: number;
    }>;
    salesByDay: Array<{
        date: string;
        total: number;
        count: number;
    }>;
    salesByPaymentMethod: Array<{
        method: PaymentMethod;
        total: number;
        count: number;
    }>;
}

export interface InventorySummary {
    totalProducts: number;
    totalValue: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    productsByCategory: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        value: number;
    }>;
}

export interface CustomerSummary {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    topCustomers: Array<{
        customerId: string;
        customerName: string;
        totalSpent: number;
        transactionCount: number;
    }>;
}
```

## Cart Types (POS)

```typescript
export interface CartItem {
    product: Product;
    quantity: number;
    discount: number;
}

export interface Cart {
    items: CartItem[];
    customer?: Customer;
    paymentMethod: PaymentMethod;
    discount: number;
    notes?: string;
}
```

## Form Data Types

```typescript
export interface ProductFormData {
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    price: string;
    costPrice?: string;
    quantity: string;
    minQuantity?: string;
    unit?: string;
    categoryId?: string;
    image?: string;
    images?: string[];
}

export interface CustomerFormData {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    notes?: string;
}

export interface TransactionFormData {
    type: TransactionType;
    paymentMethod: PaymentMethod;
    customerId?: string;
    items: Array<{
        productId: string;
        quantity: number;
        discount?: number;
    }>;
    discount?: number;
    notes?: string;
}
```

## Navigation Types

```typescript
export type RootStackParamList = {
    index: undefined;
    'sign-in': undefined;
    details: { id: string };
    // Products
    'products/index': undefined;
    'products/[id]': { id: string };
    'products/create': undefined;
    // Customers
    'customers/index': undefined;
    'customers/[id]': { id: string };
    'customers/create': undefined;
    // Transactions
    'transactions/index': undefined;
    'transactions/[id]': { id: string };
    'transactions/create': undefined;
    // Reports
    'reports/index': undefined;
    'reports/[id]': { id: string };
    // Settings
    'settings/index': undefined;
    'settings/business': undefined;
    'settings/profile': undefined;
};
```

## API Response Wrapper

```typescript
// Generic API response
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Usage
type ProductResponse = ApiResponse<Product>;
type ProductListResponse = ApiResponse<PaginatedList<Product>>;
```

## Type Guards

```typescript
// Check if value is a specific transaction type
export const isSale = (tx: Transaction): boolean => tx.type === 'SALE';
export const isRefund = (tx: Transaction): boolean => tx.type === 'REFUND';

// Check if product is low/out of stock
export const isLowStock = (p: Product): boolean => p.quantity <= p.minQuantity;
export const isOutOfStock = (p: Product): boolean => p.quantity === 0;

// Check user role
export const isAdmin = (role: Role): boolean => role === 'ADMIN';
export const isManager = (role: Role): boolean => role === 'MANAGER';
export const isAdminOrManager = (role: Role): boolean => 
    role === 'ADMIN' || role === 'MANAGER';
```

## Notes on Number Types

Some fields like `price`, `total`, `subtotal` are typed as `number | string` because:
1. API may return them as strings (JSON serialization)
2. Form inputs store them as strings
3. Always parse before calculations:

```typescript
const numPrice = typeof product.price === 'string' 
    ? parseFloat(product.price) 
    : product.price;
```
