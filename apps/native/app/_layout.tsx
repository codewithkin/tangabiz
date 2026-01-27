import "@/global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { useAuthStore } from "@/store/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export const unstable_settings = {
  initialRouteName: "index",
};

function AuthProtection({ children }: { children: React.ReactNode }) {
  const { token, isHydrated } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    const routePath = segments.join('/');
    const inAuthGroup = segments[0] === '(drawer)';
    const inPublicRoute = routePath.includes('onboarding') ||
      routePath.includes('sign-in') ||
      routePath === '';

    // Protect authenticated routes - redirect to sign-in if not authenticated
    if (!token && inAuthGroup) {
      router.replace('/sign-in');
      return;
    }

    // If authenticated and on public route (except index), redirect to dashboard
    if (token && (routePath.includes('onboarding') || routePath.includes('sign-in'))) {
      router.replace('/(drawer)');
      return;
    }
  }, [token, segments, isHydrated, router]);

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
