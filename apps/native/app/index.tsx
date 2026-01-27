import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "@/store/auth";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * Loading Page - Initial entry point for the app
 * 
 * This page is ALWAYS shown first when the app opens.
 * It displays a loading indicator while determining where to redirect the user.
 * 
 * Routing Logic:
 * 1. If user is authenticated (has token) -> Redirect to /(drawer) (dashboard)
 * 2. If user has not viewed onboarding -> Redirect to /onboarding
 * 3. Otherwise -> Redirect to /sign-in
 */
export default function LoadingPage() {
    const router = useRouter();
    const { token, isHydrated } = useAuthStore();
    const { hasCompletedOnboarding } = useOnboardingStore();

    useEffect(() => {
        const determineRoute = async () => {
            // Wait for auth state to hydrate from storage
            if (!isHydrated) return;

            try {
                // Check if user has viewed onboarding
                const onboardingViewed = await AsyncStorage.getItem("onboardingViewed");

                // Small delay to ensure smooth transition
                await new Promise(resolve => setTimeout(resolve, 100));

                // User is authenticated - go to dashboard
                if (token) {
                    router.replace("/(drawer)");
                    return;
                }

                // User hasn't viewed onboarding - show onboarding
                if (!hasCompletedOnboarding || onboardingViewed !== "true") {
                    router.replace("/onboarding");
                    return;
                }

                // User has completed onboarding but not authenticated - show sign in
                router.replace("/sign-in");
            } catch (error) {
                console.error("Error determining initial route:", error);
                // Fallback to onboarding on error
                router.replace("/onboarding");
            }
        };

        determineRoute();
    }, [isHydrated, token, hasCompletedOnboarding, router]);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
            <ActivityIndicator size="large" color="#22c55e" />
        </View>
    );
}
