import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Zustand-compatible storage adapter using AsyncStorage
const asyncStorageAdapter: StateStorage = {
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const CVT_FRONTEND = process.env.EXPO_PUBLIC_CVT_FRONTEND || 'https://cvt.co.zw';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  phone?: string;
  createdAt?: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  type?: string;
  currency?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  units: number;
  status: string;
  paid: boolean;
  nextBillingDate: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  businesses: Business[];
  currentBusiness: Business | null;
  service: Service | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  signIn: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  setCurrentBusiness: (business: Business) => void;
  setUser: (user: User) => void;
  setBusiness: (business: Business) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      businesses: [],
      currentBusiness: null,
      service: null,
      isLoading: false,
      error: null,

      // Sign in with CVT API key
      signIn: async (apiKey: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_URL}/api/auth/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            set({ 
              isLoading: false, 
              error: data.error || 'Sign in failed' 
            });
            return { 
              success: false, 
              error: data.error,
              needsPayment: data.needsPayment,
              needsSubscription: data.needsSubscription,
            };
          }

          set({
            user: data.user,
            token: data.session.token,
            businesses: data.businesses || [],
            currentBusiness: data.businesses?.[0] || null,
            service: data.service || null,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Network error';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Sign out
      signOut: async () => {
        const { token } = get();

        try {
          if (token) {
            await fetch(`${API_URL}/api/auth/sign-out`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
          }
        } catch {
          // Ignore errors during sign out
        }

        set({
          user: null,
          token: null,
          businesses: [],
          currentBusiness: null,
          service: null,
          error: null,
        });
      },

      // Verify current session
      verifySession: async () => {
        const { token } = get();

        if (!token) {
          return false;
        }

        try {
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!data.valid) {
            // Session invalid, clear state
            set({
              user: null,
              token: null,
              businesses: [],
              currentBusiness: null,
              service: null,
            });
            return false;
          }

          return true;
        } catch {
          return false;
        }
      },

      // Set current business
      setCurrentBusiness: (business: Business) => {
        set({ currentBusiness: business });
      },

      // Update user data
      setUser: (user: User) => {
        set({ user });
      },

      // Update business data
      setBusiness: (business: Business) => {
        const { businesses, currentBusiness } = get();
        const updatedBusinesses = businesses.map(b => 
          b.id === business.id ? business : b
        );
        set({ 
          businesses: updatedBusinesses,
          currentBusiness: currentBusiness?.id === business.id ? business : currentBusiness,
        });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'tangabiz-auth',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        businesses: state.businesses,
        currentBusiness: state.currentBusiness,
        service: state.service,
      }),
    }
  )
);

// CVT URLs for external links
export const CVT_URLS = {
  signUp: `${CVT_FRONTEND}/sign-up`,
  signIn: `${CVT_FRONTEND}/sign-in`,
  dashboard: `${CVT_FRONTEND}/dashboard`,
  billing: `${CVT_FRONTEND}/billing`,
};
