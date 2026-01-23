import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
  signIn: (apiKey: string) => Promise<{ success: boolean; error?: string; needsPayment?: boolean; needsSubscription?: boolean; cvt?: any; tangabiz?: any; service?: any }>;
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
          console.log('CVT_API_URL:', CVT_API_URL);
          console.log('Verifying API key with CVT...');
          
          const cvtUrl = `${CVT_API_URL}/api/api-keys/verify`;
          console.log('Fetching from:', cvtUrl);
          
          const cvtResponse = await axios.post(cvtUrl, { apiKey });

          console.log('CVT Response status:', cvtResponse.status);
          const cvtData = cvtResponse.data;
          console.log('CVT Response data:', cvtData);

          if (!cvtData.valid) {
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
            console.log('Tangabiz service not found in:', cvtData.services?.map((s: any) => s.name));
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

          console.log('Found Tangabiz service:', tangabizService);

          // Step 3: Check if service is paid and active
          if (tangabizService.status.toUpperCase() !== 'ACTIVE') {
            set({ 
              isLoading: false, 
              error: `Tangabiz service is ${tangabizService.status}. Please contact support.` 
            });
            return { 
              success: false, 
              error: 'Service is not active',
              needsSubscription: true,
            };
          }

          if (!tangabizService.paid) {
            console.log('Tangabiz service payment required');
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
          const tangabizResponse = await axios.post(`${API_URL}/api/auth/sign-in`, { 
            apiKey,
            cvtUser: cvtData.user,
            cvtService: tangabizService,
          });

          const tangabizData = tangabizResponse.data;

          if (!tangabizData.success) {
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

          return { success: true, cvt: cvtData, tangabiz: tangabizData, service: tangabizService };
        } catch (error) {
          console.error('Sign in error:', error);
          const errorMessage = axios.isAxiosError(error) 
            ? error.response?.data?.message || error.message 
            : error instanceof Error ? error.message : 'Network error. Please check your connection.';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      // Sign out
      signOut: async () => {
        const { token } = get();

        try {
          if (token) {
            await axios.post(
              `${API_URL}/api/auth/sign-out`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
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
          const response = await axios.post(
            `${API_URL}/api/auth/verify`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = response.data;

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
