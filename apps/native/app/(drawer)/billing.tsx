import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore, CVT_URLS } from '@/store/auth';
import { useConnection } from '@/hooks/useConnection';

// Billing and subscription management screen showing TangaBiz service status, payment information, billing cycle, and links to CVT platform for payment management.
export default function BillingPage() {
    const { service, user } = useAuthStore();
    const { isLoading, isConnected } = useConnection();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isConnected) {
            router.push('/offline');
        }
    }, [isLoading, isConnected]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const daysUntilBilling = service?.nextBillingDate
        ? Math.ceil((new Date(service.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

    if (!service) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
                <View className="flex-1 items-center justify-center px-6">
                    <MaterialCommunityIcons name="credit-card-off-outline" size={64} color="#d1d5db" />
                    <Text className="text-gray-900 text-xl font-bold mt-4">No Subscription</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        You don't have an active Tangabiz subscription.
                    </Text>
                    <Pressable
                        onPress={() => Linking.openURL(CVT_URLS.dashboard)}
                        className="mt-6 bg-green-500 px-6 py-3 rounded-xl active:bg-green-600"
                    >
                        <Text className="text-white font-semibold">Subscribe on CVT</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <ScrollView className="flex-1">
                {/* Subscription Status */}
                <View className="bg-white px-6 py-6 border-b border-gray-200">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-900">Tangabiz</Text>
                            <Text className="text-gray-500 mt-1">{service.description}</Text>
                        </View>
                        <View className={`px-4 py-2 rounded-full ${service.status === 'ACTIVE' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <Text className={`font-semibold ${service.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                {service.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Payment Status */}
                <View className="bg-white mt-4 px-6 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Payment Status</Text>

                    <View className="flex-row items-center">
                        <View className={`w-12 h-12 rounded-full items-center justify-center ${service.paid ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            <MaterialCommunityIcons
                                name={service.paid ? "check-circle" : "alert-circle"}
                                size={24}
                                color={service.paid ? "#16a34a" : "#dc2626"}
                            />
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-gray-900 font-semibold">
                                {service.paid ? 'Paid' : 'Payment Required'}
                            </Text>
                            <Text className="text-gray-500 text-sm">
                                {service.paid
                                    ? 'Your subscription is up to date'
                                    : 'Please complete your payment to continue'
                                }
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Billing Details */}
                <View className="bg-white mt-4 px-6 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Billing Details</Text>

                    <View className="space-y-4">
                        {/* Units */}
                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="package-variant" size={20} color="#6b7280" />
                                <Text className="text-gray-700 ml-3">Units</Text>
                            </View>
                            <Text className="text-gray-900 font-semibold">{service.units}</Text>
                        </View>

                        {/* Next Billing Date */}
                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="calendar-clock" size={20} color="#6b7280" />
                                <Text className="text-gray-700 ml-3">Next Billing Date</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-900 font-semibold">
                                    {formatDate(service.nextBillingDate)}
                                </Text>
                                <Text className="text-gray-500 text-xs mt-1">
                                    {daysUntilBilling > 0
                                        ? `${daysUntilBilling} days remaining`
                                        : 'Due now'
                                    }
                                </Text>
                            </View>
                        </View>

                        {/* Service ID */}
                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="identifier" size={20} color="#6b7280" />
                                <Text className="text-gray-700 ml-3">Service ID</Text>
                            </View>
                            <Text className="text-gray-500 text-sm font-mono">
                                {service.id.substring(0, 12)}...
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Manage Subscription */}
                <View className="px-6 mt-6">
                    <Pressable
                        onPress={() => Linking.openURL(CVT_URLS.billing)}
                        className="bg-green-500 py-4 rounded-xl flex-row items-center justify-center active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="open-in-new" size={20} color="white" />
                        <Text className="text-white font-semibold ml-2">
                            Manage Subscription on CVT
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => Linking.openURL(CVT_URLS.dashboard)}
                        className="mt-3 border-2 border-green-500 py-4 rounded-xl flex-row items-center justify-center active:bg-green-50"
                    >
                        <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#22c55e" />
                        <Text className="text-green-600 font-semibold ml-2">
                            Open CVT Dashboard
                        </Text>
                    </Pressable>
                </View>

                {/* User Info */}
                {user && (
                    <View className="bg-white mt-6 px-6 py-4">
                        <Text className="text-lg font-bold text-gray-900 mb-4">Account</Text>
                        <View className="space-y-3">
                            <View className="flex-row items-center py-2">
                                <MaterialCommunityIcons name="account-outline" size={20} color="#6b7280" />
                                <Text className="text-gray-900 ml-3">{user.name}</Text>
                            </View>
                            <View className="flex-row items-center py-2">
                                <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" />
                                <Text className="text-gray-900 ml-3">{user.email}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
