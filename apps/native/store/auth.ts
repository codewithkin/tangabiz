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
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
const CVT_FRONTEND = process.env.EXPO_PUBLIC_CVT_FRONTEND || 'https://cvt.co.zw';
const CVT_API_URL = process.env.EXPO_PUBLIC_CVT_BACKEND_API_URL || 'https://api.cvt.co.zw';

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
  isHydrated: boolean;

  // Actions
  signIn: (apiKey: string) => Promise<{ success: boolean; error?: string; needsPayment?: boolean; needsSubscription?: boolean }>;
  signOut: () => Promise<void>;
  verifySession: () => Promise<boolean>;
  setCurrentBusiness: (business: Business) => void;
  setUser: (user: User) => void;
  setBusiness: (business: Business) => void;
  clearError: () => void;
  setHydrated: () => void;
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
      isHydrated: false,

      setHydrated: () => {
        set({ isHydrated: true });
      },

      // Sign in with CVT API key
      signIn: async (apiKey: string) => {
        set({ isLoading: true, error: null });

        try {
          // Step 1: Verify API key with CVT
          console.log('Verifying API key with CVT...');
          const cvtResponse = await fetch(`${CVT_API_URL}/api/api-keys/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey }),
          });

          const cvtData = await cvtResponse.json();

          if (!cvtResponse.ok || !cvtData.valid) {
            set({ 
              isLoading: false, 
              error: cvtData.message || 'Invalid or expired API key' 
            });
            return { 
              success: false, 
              error: cvtData.message || 'Invalid API key',
            };
          }

          // Step 2: Check for Tangabiz service
          console.log('CVT Services:', cvtData.services);
          const tangabizService = cvtData.services?.find(
            (service: any) => service.name.toLowerCase() === 'tangabiz'
          );

          if (!tangabizService) {
            set({ 
              isLoading: false, 
              error: 'Tangabiz service not found. Please subscribe to Tangabiz on CVT.' 
            });
            return { 
              success: false, 
              error: 'No Tangabiz subscription found',
              needsSubscription: true,
            };
          }

          // Step 3: Check if service is paid
          if (!tangabizService.paid) {
            set({ 
              isLoading: false, 
              error: 'Tangabiz subscription payment required. Please complete payment on CVT.' 
            });
            return { 
              success: false, 
              error: 'Payment required',
              needsPayment: true,
            };
          }

          console.log('CVT verification successful. Creating/signing in to Tangabiz...');

          // Step 4: Sign in to Tangabiz backend (creates account if doesn't exist)
          const tangabizResponse = await fetch(`${API_URL}/api/auth/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              apiKey,
              cvtUser: cvtData.user,
              cvtService: tangabizService,
            }),
          });

          const tangabizData = await tangabizResponse.json();

          if (!tangabizResponse.ok || !tangabizData.success) {
            set({ 
              isLoading: false, 
              error: tangabizData.error || 'Failed to sign in to Tangabiz' 
            });
            return { 
              success: false, 
              error: tangabizData.error,
            };
          }

          console.log('Tangabiz sign-in successful!');

          // Step 5: Store auth data
          set({
            user: tangabizData.user,
            token: tangabizData.session.token,
            businesses: tangabizData.businesses || [],
            currentBusiness: tangabizData.businesses?.[0] || null,
            service: tangabizService,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          console.error('Sign in error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Network error. Please check your connection.';
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

        if (!token) return false;

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
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
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
