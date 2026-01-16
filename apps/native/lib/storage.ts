// AsyncStorage Utilities for Tangabiz
// Replaced MMKV with AsyncStorage for better Expo compatibility

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage prefix for namespacing
const STORAGE_PREFIX = 'tangabiz:';
const SECURE_PREFIX = 'tangabiz:secure:';
const CACHE_PREFIX = 'tangabiz:cache:';

// Storage wrapper to provide MMKV-like API
class StorageWrapper {
  constructor(private prefix: string) {}

  async getString(key: string): Promise<string | undefined> {
    try {
      const value = await AsyncStorage.getItem(this.prefix + key);
      return value ?? undefined;
    } catch {
      return undefined;
    }
  }

  async getNumber(key: string): Promise<number | undefined> {
    try {
      const value = await this.getString(key);
      return value ? Number(value) : undefined;
    } catch {
      return undefined;
    }
  }

  async getBoolean(key: string): Promise<boolean | undefined> {
    try {
      const value = await this.getString(key);
      return value === 'true' ? true : value === 'false' ? false : undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: string | number | boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(this.prefix + key, String(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(k => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error('Storage clearAll error:', error);
    }
  }

  async contains(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.prefix + key);
      return value !== null;
    } catch {
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(k => k.startsWith(this.prefix))
        .map(k => k.substring(this.prefix.length));
    } catch {
      return [];
    }
  }
}

// Storage instances
export const storage = new StorageWrapper(STORAGE_PREFIX);
export const secureStorage = new StorageWrapper(SECURE_PREFIX);
export const cacheStorage = new StorageWrapper(CACHE_PREFIX);

// Storage utility functions (async versions)
export const StorageUtils = {
  // String operations
  getString: async (key: string): Promise<string | undefined> => storage.getString(key),
  setString: async (key: string, value: string): Promise<void> => storage.set(key, value),

  // Number operations
  getNumber: async (key: string): Promise<number | undefined> => storage.getNumber(key),
  setNumber: async (key: string, value: number): Promise<void> => storage.set(key, value),

  // Boolean operations
  getBoolean: async (key: string): Promise<boolean | undefined> => storage.getBoolean(key),
  setBoolean: async (key: string, value: boolean): Promise<void> => storage.set(key, value),

  // Object operations (JSON)
  getObject: async <T>(key: string): Promise<T | null> => {
    const json = await storage.getString(key);
    if (!json) return null;
    try {
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  },
  setObject: async <T>(key: string, value: T): Promise<void> => {
    await storage.set(key, JSON.stringify(value));
  },

  // Delete operations
  delete: async (key: string): Promise<void> => storage.delete(key),
  clearAll: async (): Promise<void> => storage.clearAll(),

  // Check if key exists
  contains: async (key: string): Promise<boolean> => storage.contains(key),

  // Get all keys
  getAllKeys: async (): Promise<string[]> => storage.getAllKeys(),
};

// Secure storage utility functions
export const SecureStorageUtils = {
  getString: async (key: string): Promise<string | undefined> => secureStorage.getString(key),
  setString: async (key: string, value: string): Promise<void> => secureStorage.set(key, value),
  delete: async (key: string): Promise<void> => secureStorage.delete(key),
  clearAll: async (): Promise<void> => secureStorage.clearAll(),
};

// Cache storage utility functions
export const CacheUtils = {
  get: async <T>(key: string): Promise<T | null> => {
    const json = await cacheStorage.getString(key);
    if (!json) return null;
    try {
      const { data, expiry } = JSON.parse(json);
      if (expiry && Date.now() > expiry) {
        await cacheStorage.delete(key);
        return null;
      }
      return data as T;
    } catch {
      return null;
    }
  },

  set: async <T>(key: string, value: T, ttlMs?: number): Promise<void> => {
    const data = {
      data: value,
      expiry: ttlMs ? Date.now() + ttlMs : null,
    };
    await cacheStorage.set(key, JSON.stringify(data));
  },

  delete: async (key: string): Promise<void> => cacheStorage.delete(key),
  clearAll: async (): Promise<void> => cacheStorage.clearAll(),
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
