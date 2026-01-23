import "@/global.css";
import { useEffect, useState } from "react";
import { Slot, useRouter, useRootNavigationState, useSegments } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore } from "@/store/onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export const unstable_settings = {
  initialRouteName: "onboarding",
};

function AuthProtection({ children }: { children: React.ReactNode }) {
  const { user, token, isHydrated } = useAuthStore();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const [onboardingViewed, setOnboardingViewed] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load onboarding viewed state on mount
  useEffect(() => {
    const checkOnboardingViewed = async () => {
      const viewed = await AsyncStorage.getItem("onboardingViewed");
      setOnboardingViewed(viewed === "true");
    };
    checkOnboardingViewed();
  }, []);

  useEffect(() => {
    // Wait for both navigation state and hydration
    if (!navigationState?.key) return;
    if (!isHydrated) return;
    if (onboardingViewed === null) return; // Wait until we've loaded onboardingViewed

    // Small delay to ensure Slot is fully mounted
    const timeout = setTimeout(() => {
      const routePath = segments.join('/');
      const inAuthGroup = segments[0] === '(drawer)';
      const inOnboarding = routePath.includes('onboarding');
      const inSignIn = routePath.includes('sign-in');

      // If user is already on onboarding page and not authenticated, don't redirect away
      if (inOnboarding && !token) {
        setIsReady(true);
        return;
      }

      // If user is signed in and on onboarding/sign-in, redirect to dashboard
      if (token && (inOnboarding || inSignIn)) {
        router.replace('/(drawer)/index');
        setIsReady(true);
        return;
      }

      // If not completed onboarding and not signed in, show onboarding
      if (!hasCompletedOnboarding && !token && !inOnboarding) {
        router.replace('/onboarding');
        setIsReady(true);
        return;
      }

      // If authenticated and in protected route, stay
      if (token && inAuthGroup) {
        setIsReady(true);
        return;
      }

      // If not authenticated and trying to access protected route, go to sign in
      if (!token && inAuthGroup) {
        router.replace('/sign-in');
        setIsReady(true);
        return;
      }

      // Default: ready
      setIsReady(true);
    }, 1);

    return () => clearTimeout(timeout);
  }, [user, token, segments, hasCompletedOnboarding, isHydrated, navigationState?.key, onboardingViewed]);

  // Show loading indicator while computing redirects
  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    'Satoshi-Black': require('@/assets/fonts/Satoshi/OTF/Satoshi-Black.otf'),
    'Satoshi-Bold': require('@/assets/fonts/Satoshi/OTF/Satoshi-Bold.otf'),
    'Satoshi-Medium': require('@/assets/fonts/Satoshi/OTF/Satoshi-Medium.otf'),
    'Satoshi-Regular': require('@/assets/fonts/Satoshi/OTF/Satoshi-Regular.otf'),
    'Satoshi-Light': require('@/assets/fonts/Satoshi/OTF/Satoshi-Light.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <AuthProtection>
                <Slot />
              </AuthProtection>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
