import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import { useAuthStore } from '@/store/auth';

export default function Layout() {
  const { verifySession } = useAuthStore();

  useEffect(() => {
    // Verify session on app start
    verifySession();
  }, []);

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
      />
      <PortalHost />
      <Toast />
    </GestureHandlerRootView>
  );
}
