import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/auth';

export default function Layout() {
  const { verifySession } = useAuthStore();

  useEffect(() => {
    // Verify session on app start
    verifySession();
  }, []);

  return (
    <>
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
      <Toast />
    </>
  );
}
