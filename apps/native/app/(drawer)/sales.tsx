import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface } from 'heroui-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useConnection } from '@/hooks/useConnection';

/**
 * Sales management screen displaying all transactions (sales, refunds, expenses) with filtering options and quick access to create new sale. Shows revenue metrics, recent transactions, and provides navigation to detailed sale views.
 */
export default function SalesScreen() {
    const router = useRouter();
    const { isLoading: isConnecting, isConnected } = useConnection();

    // Redirect to offline screen if not connected
    if (!isConnecting && !isConnected) {
        router.replace('/offline');
        return null;
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={['bottom']}>
            <ScrollView className="flex-1">
                <View className="p-4 gap-6">
                    {/* Header with Create New Sale button */}
                    <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-black text-gray-900 dark:text-white">Sales</Text>
                            <Text className="text-sm font-light text-gray-500 dark:text-gray-400">Manage your transactions</Text>
                        </View>
                        <Pressable
                            className="bg-green-500 px-4 py-3 rounded-xl flex-row items-center gap-2 active:opacity-80"
                            onPress={() => router.push('/sale/new')}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color="white" />
                            <Text className="text-white font-bold">New Sale</Text>
                        </Pressable>
                    </Animated.View>

                    {/* Placeholder content */}
                    <Animated.View entering={SlideInUp.duration(500).delay(100)}>
                        <Surface className="p-6 rounded-2xl">
                            <View className="items-center gap-4">
                                <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#22c55e" />
                                <Text className="text-lg font-bold text-gray-900 dark:text-white text-center">
                                    Sales Dashboard Coming Soon
                                </Text>
                                <Text className="text-sm font-light text-gray-500 dark:text-gray-400 text-center">
                                    View and manage all your sales transactions, track revenue, and analyze sales trends.
                                </Text>
                            </View>
                        </Surface>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
