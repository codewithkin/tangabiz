# Authentication System

## Overview

Tangabiz uses **CVT (Christus Veritas Technologies) API Key authentication**. Users obtain an API key from the CVT platform and use it to authenticate in the mobile app.

## Flow

1. User opens app → Check if onboarding completed
2. If not → Show onboarding screens
3. If onboarding done but not authenticated → Show sign-in
4. User enters CVT API key → App validates with backend
5. Backend returns user, businesses, session token
6. App persists auth state with AsyncStorage

## Auth Store (Zustand)

**File**: `store/auth.ts`

```typescript
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
```

## Onboarding Store

**File**: `store/onboarding.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: 'tangabiz-onboarding',
      storage: createJSONStorage(() => asyncStorageAdapter),
    }
  )
);
```

## Route Protection (Root Layout)

**File**: `app/_layout.tsx`

```tsx
import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure stores are hydrated
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'sign-in' || segments[0] === 'sign-up';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';

    // If user hasn't completed onboarding (first time app launch), show onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // If user completed onboarding but not signed in, show auth
    if (hasCompletedOnboarding && !token && !inAuthGroup) {
      router.replace('/sign-in');
      return;
    }

    // If user is signed in but on auth pages or onboarding, redirect to app
    if (token && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
      return;
    }
  }, [isReady, hasCompletedOnboarding, token, segments]);

  return { isReady };
}

export default function Layout() {
  const { verifySession } = useAuthStore();
  const { isReady } = useProtectedRoute();

  useEffect(() => {
    // Verify session on app start
    verifySession();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 bg-green-500 items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#22c55e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <Toast />
    </GestureHandlerRootView>
  );
}
```

## Sign In Screen

**File**: `app/sign-in.tsx`

Key features:
- Animated entrance (fade + slide + scale)
- API key text input (secure, no auto-capitalize)
- Loading state with ActivityIndicator
- Error display with contextual help links
- Link to CVT sign-up for new users
- Input focus animation effect

UI Structure:
1. Header section with logo + branding (green background)
2. Form section (white rounded top)
   - "Welcome Back" title
   - Error message (conditional)
   - API Key input field
   - "Find your API key..." helper text
   - Sign In button
   - OR divider
   - "Sign up at CVT" link
   - Footer branding

## Sign Up Screen

**File**: `app/sign-up.tsx`

Key features:
- Redirects to CVT website for account creation
- Feature cards explaining the flow:
  1. Get Your API Key
  2. Secure Authentication
  3. Instant Access
- Button to open CVT sign-up URL
- Link back to sign-in
- Info box explaining how to get API key

## Onboarding Screen

**File**: `app/onboarding.tsx`

Key features:
- 3 slides using FlatList with horizontal paging
- Animated pagination dots
- "Skip" button on non-final slides
- "Sign In" and "Create Account" buttons on final slide
- Bubble animation on icons
- Slides content:
  1. Welcome to Tangabiz
  2. Powerful Features
  3. Get Started

## Dependencies Required

```json
{
  "zustand": "^4.5.1",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "expo-router": "~5.0.0",
  "react-native-toast-message": "^2.2.0",
  "react-native-gesture-handler": "~2.20.0"
}
```

## Environment Variables

```
EXPO_PUBLIC_API_URL=http://localhost:3002
EXPO_PUBLIC_CVT_FRONTEND=https://cvt.co.zw
```
