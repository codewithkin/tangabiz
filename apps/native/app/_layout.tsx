import "@/global.css";
import { useEffect } from "react";
import { Slot, useRouter, useRootNavigationState, useSegments } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortalHost } from "@rn-primitives/portal";

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

  useEffect(() => {
    // Wait for both navigation state and hydration
    if (!navigationState?.key) return;
    if (!isHydrated) return;

    // Small delay to ensure Slot is fully mounted
    const timeout = setTimeout(() => {
      const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(drawer)';
      const inOnboarding = segments.includes('onboarding');
      const inSignIn = segments.includes('sign-in');

      if (!hasCompletedOnboarding && !inOnboarding) {
        // First time user - show onboarding
        router.replace('/onboarding');
      } else if (!token && inAuthGroup) {
        // Not authenticated but trying to access protected route
        router.replace('/sign-in');
      } else if (token && (inSignIn || inOnboarding)) {
        // Authenticated but on auth screens
        router.replace('/(tabs)');
      }
    }, 1);

    return () => clearTimeout(timeout);
  }, [user, token, segments, hasCompletedOnboarding, isHydrated, navigationState?.key]);

  return <>{children}</>;
}

export default function Layout() {
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
      <PortalHost />
    </GestureHandlerRootView>
  );
}
