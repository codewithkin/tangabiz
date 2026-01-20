# API Client

## Overview

Centralized API client that handles all HTTP requests with automatic token injection, error handling, and timeout support.

## Implementation

**File**: `lib/api.ts`

```typescript
import { storage, STORAGE_KEYS } from './storage';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
}

// Get auth token from storage
const getAuthToken = (): string | null => {
  const authState = storage.getString('tangabiz-auth');
  if (!authState) return null;
  try {
    const parsed = JSON.parse(authState);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

// Build URL with query params
const buildUrl = (endpoint: string, params?: Record<string, string | number | boolean | undefined>): string => {
  const url = new URL(endpoint, API_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
};

// Main API request function
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', headers = {}, body, params, timeout = 30000 } = options;

  try {
    const token = getAuthToken();
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const url = buildUrl(endpoint, params);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || data?.message || `HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
};

// Convenience methods
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(endpoint, { method: 'GET', params }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { method: 'POST', body, ...options }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { method: 'PUT', body, ...options }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body, ...options }),

  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};
```

## API Endpoints Reference

### Auth

```typescript
export const authApi = {
  signIn: (apiKey: string) => api.post('/api/auth/sign-in', { apiKey }),
  signOut: () => api.post('/api/auth/sign-out'),
  verify: () => api.post('/api/auth/verify'),
  me: () => api.get('/api/auth/me'),
};
```

### Business

```typescript
export const businessApi = {
  list: () => api.get('/api/business'),
  get: (id: string) => api.get(`/api/business/${id}`),
  create: (data: any) => api.post('/api/business', data),
  update: (id: string, data: any) => api.put(`/api/business/${id}`, data),
  delete: (id: string) => api.delete(`/api/business/${id}`),
  getMembers: (id: string) => api.get(`/api/business/${id}/members`),
  addMember: (id: string, data: any) => api.post(`/api/business/${id}/members`, data),
  updateMember: (businessId: string, memberId: string, data: any) =>
    api.put(`/api/business/${businessId}/members/${memberId}`, data),
  removeMember: (businessId: string, memberId: string) =>
    api.delete(`/api/business/${businessId}/members/${memberId}`),
};
```

### Products

```typescript
export const productsApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get(`/api/products`, { businessId, ...params }),
  get: (id: string) => api.get(`/api/products/${id}`),
  create: (data: any) => api.post('/api/products', data),
  update: (id: string, data: any) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
  updateStock: (id: string, quantity: number, operation: 'add' | 'subtract' | 'set') =>
    api.patch(`/api/products/${id}/stock`, { quantity, operation }),
  getLowStock: (businessId: string) => api.get(`/api/products/low-stock`, { businessId }),
};
```

### Categories

```typescript
export const categoriesApi = {
  list: (businessId: string) => api.get(`/api/products/categories`, { businessId }),
  get: (id: string) => api.get(`/api/products/categories/${id}`),
  create: (data: any) => api.post('/api/products/categories', data),
  update: (id: string, data: any) => api.put(`/api/products/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/categories/${id}`),
};
```

### Customers

```typescript
export const customersApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get(`/api/customers`, { businessId, ...params }),
  get: (id: string) => api.get(`/api/customers/${id}`),
  create: (data: any) => api.post('/api/customers', data),
  update: (id: string, data: any) => api.put(`/api/customers/${id}`, data),
  delete: (id: string) => api.delete(`/api/customers/${id}`),
};
```

### Transactions

```typescript
export const transactionsApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string }) =>
    api.get(`/api/transactions`, { businessId, ...params }),
  get: (id: string) => api.get(`/api/transactions/${id}`),
  create: (data: any) => api.post('/api/transactions', data),
  verify: (reference: string) => api.get(`/api/transactions/verify/${reference}`),
};
```

### Reports

```typescript
export const reportsApi = {
  getSummary: (businessId: string, startDate: string, endDate: string) =>
    api.get('/api/reports/summary', { businessId, startDate, endDate }),
  getSalesSummary: (businessId: string, startDate: string, endDate: string) =>
    api.get('/api/reports/sales-summary', { businessId, startDate, endDate }),
  generatePdf: (data: { businessId: string; type: string; period: string; startDate: string; endDate: string; name: string }) =>
    api.post('/api/reports/generate', data),
};
```

### Notifications

```typescript
export const notificationsApi = {
  list: (businessId: string, params?: { page?: number; limit?: number }) =>
    api.get('/api/notifications', { businessId, ...params }),
  getCount: (businessId: string) => api.get('/api/notifications/count', { businessId }),
  markAsRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: (businessId: string) => api.patch('/api/notifications/read-all', { businessId }),
};
```

### AI Chat

```typescript
export const aiApi = {
  chat: (message: string, businessId: string, threadId?: string) =>
    api.post('/api/ai/chat', { message, businessId, threadId }),
};
```

## Usage Examples

```typescript
// Fetch products with pagination
const fetchProducts = async () => {
  const res = await api.get('/api/products', {
    businessId: currentBusiness.id,
    page: 1,
    limit: 20,
    search: searchQuery || undefined,
  });
  
  if (res.success) {
    setProducts(res.data?.data || []);
  } else {
    toast.error('Failed to fetch products', res.error);
  }
};

// Create a transaction
const createSale = async (cart, paymentMethod) => {
  const res = await api.post('/api/transactions', {
    businessId: currentBusiness.id,
    type: 'SALE',
    paymentMethod,
    items: cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      discount: item.discount,
    })),
  });
  
  if (res.success) {
    router.push(`/transactions/${res.data.id}`);
  }
};
```
