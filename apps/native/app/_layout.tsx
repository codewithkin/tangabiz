import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
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

    // If user hasn't completed onboarding, show onboarding
    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // If user completed onboarding but not signed in, show auth
    if (hasCompletedOnboarding && !token && !inAuthGroup) {
      router.replace('/sign-in');
      return;
    }

    // If user is signed in but on auth pages, redirect to app
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
          headerStyle: {
            backgroundColor: '#22c55e', // Primary green
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#f9fafb',
          },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <PortalHost />
      <Toast />
    </GestureHandlerRootView>
  );
}
