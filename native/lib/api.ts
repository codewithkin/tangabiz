// API Client for Tangabiz
// Handles all HTTP requests to the backend

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

// =====================================================
// API ENDPOINTS
// =====================================================

// Auth API
export const authApi = {
  signIn: (apiKey: string) => api.post('/api/auth/sign-in', { apiKey }),
  signOut: () => api.post('/api/auth/sign-out'),
  verify: () => api.post('/api/auth/verify'),
  me: () => api.get('/api/auth/me'),
};

// Business API
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

// Products API
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

// Categories API
export const categoriesApi = {
  list: (businessId: string) => api.get(`/api/products/categories`, { businessId }),
  get: (id: string) => api.get(`/api/products/categories/${id}`),
  create: (data: any) => api.post('/api/products/categories', data),
  update: (id: string, data: any) => api.put(`/api/products/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/categories/${id}`),
};

// Customers API
export const customersApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get(`/api/customers`, { businessId, ...params }),
  get: (id: string) => api.get(`/api/customers/${id}`),
  create: (data: any) => api.post('/api/customers', data),
  update: (id: string, data: any) => api.put(`/api/customers/${id}`, data),
  delete: (id: string) => api.delete(`/api/customers/${id}`),
  getTransactions: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/api/customers/${id}/transactions`, params),
};

// Transactions API
export const transactionsApi = {
  list: (businessId: string, params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    customerId?: string;
  }) => api.get(`/api/transactions`, { businessId, ...params }),
  get: (id: string) => api.get(`/api/transactions/${id}`),
  create: (data: any) => api.post('/api/transactions', data),
  update: (id: string, data: any) => api.put(`/api/transactions/${id}`, data),
  cancel: (id: string) => api.patch(`/api/transactions/${id}/cancel`),
  refund: (id: string, data?: any) => api.post(`/api/transactions/${id}/refund`, data),
  getReceipt: (id: string) => api.get(`/api/transactions/${id}/receipt`),
};

// Reports API
export const reportsApi = {
  list: (businessId: string, params?: { type?: string; page?: number; limit?: number }) =>
    api.get(`/api/reports`, { businessId, ...params }),
  get: (id: string) => api.get(`/api/reports/${id}`),
  generate: (data: any) => api.post('/api/reports/generate', data),
  delete: (id: string) => api.delete(`/api/reports/${id}`),
  getSalesSummary: (businessId: string, params?: { startDate?: string; endDate?: string; period?: string }) =>
    api.get(`/api/reports/sales-summary`, { businessId, ...params }),
  getInventorySummary: (businessId: string) =>
    api.get(`/api/reports/inventory-summary`, { businessId }),
  getCustomerSummary: (businessId: string) =>
    api.get(`/api/reports/customer-summary`, { businessId }),
};

// Upload API
export const uploadApi = {
  getPresignedUrl: (data: { filename: string; contentType: string; folder?: string }) =>
    api.post('/api/upload/presigned-url', data),
  confirmUpload: (data: { key: string; url: string }) =>
    api.post('/api/upload/confirm', data),
};

export default api;
