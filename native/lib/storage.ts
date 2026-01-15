// MMKV Storage Utilities for Tangabiz

import { MMKV } from 'react-native-mmkv';

// Main app storage instance
export const storage = new MMKV({
  id: 'tangabiz-storage',
  encryptionKey: 'tangabiz-secure-key',
});

// Secure storage for sensitive data
export const secureStorage = new MMKV({
  id: 'tangabiz-secure',
  encryptionKey: 'tangabiz-ultra-secure-key',
});

// Cache storage for temporary data
export const cacheStorage = new MMKV({
  id: 'tangabiz-cache',
});

// Storage utility functions
export const StorageUtils = {
  // String operations
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string) => storage.set(key, value),

  // Number operations
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number) => storage.set(key, value),

  // Boolean operations
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean) => storage.set(key, value),

  // Object operations (JSON)
  getObject: <T>(key: string): T | null => {
    const json = storage.getString(key);
    if (!json) return null;
    try {
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  },
  setObject: <T>(key: string, value: T) => {
    storage.set(key, JSON.stringify(value));
  },

  // Delete operations
  delete: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),

  // Check if key exists
  contains: (key: string): boolean => storage.contains(key),

  // Get all keys
  getAllKeys: (): string[] => storage.getAllKeys(),
};

// Secure storage utility functions
export const SecureStorageUtils = {
  getString: (key: string): string | undefined => secureStorage.getString(key),
  setString: (key: string, value: string) => secureStorage.set(key, value),
  delete: (key: string) => secureStorage.delete(key),
  clearAll: () => secureStorage.clearAll(),
};

// Cache storage utility functions
export const CacheUtils = {
  get: <T>(key: string): T | null => {
    const json = cacheStorage.getString(key);
    if (!json) return null;
    try {
      const { data, expiry } = JSON.parse(json);
      if (expiry && Date.now() > expiry) {
        cacheStorage.delete(key);
        return null;
      }
      return data as T;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T, ttlMs?: number) => {
    const data = {
      data: value,
      expiry: ttlMs ? Date.now() + ttlMs : null,
    };
    cacheStorage.set(key, JSON.stringify(data));
  },

  delete: (key: string) => cacheStorage.delete(key),
  clearAll: () => cacheStorage.clearAll(),
};

// Storage keys constants
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  API_KEY: 'api_key',
  USER: 'user',
  
  // Business
  CURRENT_BUSINESS: 'current_business',
  BUSINESSES: 'businesses',
  
  // Settings
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  
  // Cache
  PRODUCTS_CACHE: 'products_cache',
  CUSTOMERS_CACHE: 'customers_cache',
  TRANSACTIONS_CACHE: 'transactions_cache',
  
  // Offline
  PENDING_TRANSACTIONS: 'pending_transactions',
  OFFLINE_PRODUCTS: 'offline_products',
  
  // App state
  FIRST_LAUNCH: 'first_launch',
  LAST_SYNC: 'last_sync',
  APP_VERSION: 'app_version',
} as const;
