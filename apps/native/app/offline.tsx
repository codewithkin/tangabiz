import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/useConnection';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function OfflineScreen() {
  const { isLoading, isConnected } = useConnection(5000); // Check every 5 seconds
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isConnected) {
      // Connection restored, go back
      router.back();
    }
  }, [isLoading, isConnected]);

  return (
    <View className="flex-1 bg-default-50 items-center justify-center p-8">
      <View className="items-center">
        <MaterialCommunityIcons 
          name="wifi-off" 
          size={80} 
          color="#ef4444" 
        />
        
        <Text className="text-2xl font-bold text-center mt-6">You're Offline</Text>
        <Text className="text-gray-500 text-center mt-2 mb-8">
          Please check your internet connection and try again
        </Text>

        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text className="text-gray-400 text-sm">
            {isLoading ? 'Checking connection...' : 'Attempting to reconnect...'}
          </Text>
        </View>
      </View>
    </View>
  );
}
