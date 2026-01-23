import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/useConnection';
import { Chip, Divider, Surface, Spinner, useThemeColor } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Container } from '@/components/container';

// Customers overview screen showing system connection status and providing navigation to full customer management features with real-time API health monitoring.
export default function CustomersDrawer() {
  const { isLoading, isConnected } = useConnection();
  const successColor = useThemeColor('success');
  const dangerColor = useThemeColor('danger');
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isConnected) {
      router.push('/offline');
    }
  }, [isLoading, isConnected]);

  return (
    <Container className="p-4">
      <View className="py-6 mb-4">
        <Text className="text-3xl font-semibold text-foreground tracking-tight">
          Customers
        </Text>
        <Text className="text-muted text-sm mt-1">Manage your customer base</Text>
      </View>

      <Surface variant="secondary" className="p-4 rounded-lg mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-foreground font-medium">System Status</Text>
          <Chip variant="secondary" color={isConnected ? 'success' : 'danger'} size="sm">
            <Chip.Label>{isConnected ? 'LIVE' : 'OFFLINE'}</Chip.Label>
          </Chip>
        </View>

        <Divider className="mb-3" />

        <Surface variant="tertiary" className="p-3 rounded-md">
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-3 ${isConnected ? 'bg-success' : 'bg-muted'}`}
            />
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">API Connection</Text>
              <Text className="text-muted text-xs mt-0.5">
                {isLoading
                  ? 'Checking connection...'
                  : isConnected
                    ? 'Connected to API'
                    : 'API Disconnected'}
              </Text>
            </View>
            {isLoading && <Spinner size="sm" />}
            {!isLoading && isConnected && (
              <Ionicons name="checkmark-circle" size={18} color={successColor} />
            )}
            {!isLoading && !isConnected && (
              <Ionicons name="close-circle" size={18} color={dangerColor} />
            )}
          </View>
        </Surface>
      </Surface>

      <Surface variant="secondary" className="p-4 rounded-lg">
        <Text className="text-foreground font-medium mb-2">Customer Management</Text>
        <Text className="text-muted text-sm">
          View and manage all your customers from the Customers tab in the main navigation.
        </Text>
      </Surface>
    </Container>
  );
}
