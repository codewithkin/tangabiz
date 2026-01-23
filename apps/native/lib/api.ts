import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
const getAuthToken = async (): Promise<string | null> => {
  try {
    const authState = await AsyncStorage.getItem('tangabiz-auth');
    if (!authState) return null;
    const parsed = JSON.parse(authState);
    return parsed.state?.token || null;
  } catch {
    return null;
  }
};

// Add auth token interceptor
axiosInstance.interceptors.request.use(async (config) => {
  try {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        ...error,
        message: 'Request timeout',
      });
    }
    return Promise.reject(error);
  }
);

// Main API request function using axios
export const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', headers = {}, body, params } = options;

  try {
    const config: AxiosRequestConfig = {
      method: method as any,
      url: endpoint,
      params,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = body;
    }

    const response = await axiosInstance(config);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'Request timeout' };
      }
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Network error';
      
      return {
        success: false,
        error: errorMessage,
        data: error.response?.data,
      };
    }

    if (error instanceof Error) {
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

// API Endpoints
export const authApi = {
  signIn: (apiKey: string) => api.post('/api/auth/sign-in', { apiKey }),
  signOut: () => api.post('/api/auth/sign-out'),
  verify: () => api.post('/api/auth/verify'),
  me: () => api.get('/api/auth/me'),
};

export const businessApi = {
  list: () => api.get('/api/businesses'),
  get: (id: string) => api.get(`/api/businesses/${id}`),
  create: (data: any) => api.post('/api/businesses', data),
  update: (id: string, data: any) => api.put(`/api/businesses/${id}`, data),
  delete: (id: string) => api.delete(`/api/businesses/${id}`),
  getMembers: (id: string) => api.get(`/api/businesses/${id}/members`),
  addMember: (id: string, data: any) => api.post(`/api/businesses/${id}/members`, data),
  updateMember: (businessId: string, memberId: string, data: any) =>
    api.put(`/api/businesses/${businessId}/members/${memberId}`, data),
  removeMember: (businessId: string, memberId: string) =>
    api.delete(`/api/businesses/${businessId}/members/${memberId}`),
};

export const productsApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; search?: string; categoryId?: string }) =>
    api.get('/api/products', { businessId, ...params }),
  get: (id: string) => api.get(`/api/products/${id}`),
  create: (data: any) => api.post('/api/products', data),
  update: (id: string, data: any) => api.put(`/api/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/products/${id}`),
  getLowStock: (businessId: string) => api.get('/api/products/alerts/low-stock', { businessId }),
};

export const categoriesApi = {
  list: (businessId: string) => api.get('/api/categories', { businessId }),
  get: (id: string) => api.get(`/api/categories/${id}`),
  create: (data: any) => api.post('/api/categories', data),
  update: (id: string, data: any) => api.put(`/api/categories/${id}`, data),
  delete: (id: string) => api.delete(`/api/categories/${id}`),
};

export const customersApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/api/customers', { businessId, ...params }),
  get: (id: string) => api.get(`/api/customers/${id}`),
  create: (data: any) => api.post('/api/customers', data),
  update: (id: string, data: any) => api.put(`/api/customers/${id}`, data),
  delete: (id: string) => api.delete(`/api/customers/${id}`),
};

export const transactionsApi = {
  list: (businessId: string, params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string }) =>
    api.get('/api/transactions', { businessId, ...params }),
  get: (id: string) => api.get(`/api/transactions/${id}`),
  create: (data: any) => api.post('/api/transactions', data),
  getSummary: (businessId: string, startDate?: string, endDate?: string) =>
    api.get('/api/transactions/stats/summary', { businessId, startDate, endDate }),
  getTrends: (businessId: string, days?: number) =>
    api.get('/api/transactions/stats/trends', { businessId, days }),
};

export const reportsApi = {
  getSummary: (businessId: string, startDate: string, endDate: string) =>
    api.get('/api/reports/sales-summary', { businessId, startDate, endDate }),
  generatePdf: (data: { businessId: string; type: string; period: string; startDate: string; endDate: string; name: string }) =>
    api.post('/api/reports/generate', data),
  list: (businessId: string, params?: { page?: number; limit?: number }) =>
    api.get('/api/reports', { businessId, ...params }),
};

export const notificationsApi = {
  list: (businessId: string, params?: { page?: number; limit?: number }) =>
    api.get('/api/notifications', { businessId, ...params }),
  getCount: (businessId: string) => api.get('/api/notifications/count', { businessId }),
  markAsRead: (id: string) => api.patch(`/api/notifications/${id}/read`),
  markAllAsRead: (businessId: string) => api.patch('/api/notifications/read-all', { businessId }),
};

export const aiApi = {
  chat: (message: string, businessId: string, threadId?: string) =>
    api.post('/api/ai/chat/simple', { message, businessId, threadId }),
  getHistory: (businessId: string, threadId?: string, limit?: number) =>
    api.get('/api/ai/history', { businessId, threadId, limit }),
};

// Health check
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
};

export { API_URL };
