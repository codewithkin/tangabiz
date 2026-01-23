import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useConnection } from '@/hooks/useConnection';

export default function OrganisationPage() {
    const { currentBusiness, businesses, setCurrentBusiness } = useAuthStore();
    const [showBusinessSelector, setShowBusinessSelector] = useState(false);
    const { isLoading, isConnected } = useConnection();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isConnected) {
            router.push('/offline');
        }
    }, [isLoading, isConnected]);

    if (!currentBusiness) {
        return (
            <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
                <View className="flex-1 items-center justify-center px-6">
                    <MaterialCommunityIcons name="office-building-outline" size={64} color="#d1d5db" />
                    <Text className="text-gray-900 text-xl font-bold mt-4">No Organisation</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        You don't have an active organisation yet.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <ScrollView className="flex-1">
                {/* Business Header */}
                <View className="bg-white px-6 py-8 border-b border-gray-200">
                    <View className="items-center">
                        <View className="w-20 h-20 bg-green-500 rounded-full items-center justify-center mb-4">
                            {currentBusiness.logo ? (
                                <Image source={{ uri: currentBusiness.logo }} className="w-20 h-20 rounded-full" />
                            ) : (
                                <MaterialCommunityIcons name="office-building" size={40} color="white" />
                            )}
                        </View>
                        <Text className="text-2xl font-bold text-gray-900">{currentBusiness.name}</Text>
                        <View className="bg-green-100 px-3 py-1 rounded-full mt-2">
                            <Text className="text-green-700 text-sm font-semibold">{currentBusiness.role}</Text>
                        </View>
                    </View>
                </View>

                {/* Business Details */}
                <View className="bg-white mt-4 px-6 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Organisation Details</Text>

                    <View className="space-y-4">
                        {/* Slug */}
                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <MaterialCommunityIcons name="at" size={20} color="#6b7280" />
                            <View className="ml-3 flex-1">
                                <Text className="text-gray-500 text-xs">Slug</Text>
                                <Text className="text-gray-900 font-medium">{currentBusiness.slug}</Text>
                            </View>
                        </View>

                        {/* Email */}
                        {currentBusiness.email && (
                            <View className="flex-row items-center py-3 border-b border-gray-100">
                                <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-500 text-xs">Email</Text>
                                    <Text className="text-gray-900 font-medium">{currentBusiness.email}</Text>
                                </View>
                            </View>
                        )}

                        {/* Phone */}
                        {currentBusiness.phone && (
                            <View className="flex-row items-center py-3 border-b border-gray-100">
                                <MaterialCommunityIcons name="phone-outline" size={20} color="#6b7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-500 text-xs">Phone</Text>
                                    <Text className="text-gray-900 font-medium">{currentBusiness.phone}</Text>
                                </View>
                            </View>
                        )}

                        {/* Address */}
                        {currentBusiness.address && (
                            <View className="flex-row items-start py-3 border-b border-gray-100">
                                <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6b7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-500 text-xs">Address</Text>
                                    <Text className="text-gray-900 font-medium">{currentBusiness.address}</Text>
                                    {currentBusiness.city && (
                                        <Text className="text-gray-600 text-sm">{currentBusiness.city}</Text>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Type */}
                        {currentBusiness.type && (
                            <View className="flex-row items-center py-3 border-b border-gray-100">
                                <MaterialCommunityIcons name="briefcase-outline" size={20} color="#6b7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-500 text-xs">Type</Text>
                                    <Text className="text-gray-900 font-medium">{currentBusiness.type}</Text>
                                </View>
                            </View>
                        )}

                        {/* Currency */}
                        {currentBusiness.currency && (
                            <View className="flex-row items-center py-3 border-b border-gray-100">
                                <MaterialCommunityIcons name="currency-usd" size={20} color="#6b7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-500 text-xs">Currency</Text>
                                    <Text className="text-gray-900 font-medium">{currentBusiness.currency}</Text>
                                </View>
                            </View>
                        )}

                        {/* Tax ID */}
                        {currentBusiness.taxId && (
                            <View className="flex-row items-center py-3">
                                <MaterialCommunityIcons name="file-document-outline" size={20} color="#6b7280" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-gray-500 text-xs">Tax ID</Text>
                                    <Text className="text-gray-900 font-medium">{currentBusiness.taxId}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Other Businesses */}
                {businesses.length > 1 && (
                    <View className="bg-white mt-4 px-6 py-4">
                        <Text className="text-lg font-bold text-gray-900 mb-4">
                            Other Organisations ({businesses.length - 1})
                        </Text>
                        {businesses
                            .filter(b => b.id !== currentBusiness.id)
                            .map((business) => (
                                <Pressable
                                    key={business.id}
                                    onPress={() => setCurrentBusiness(business)}
                                    className="flex-row items-center py-3 border-b border-gray-100 active:bg-gray-50"
                                >
                                    <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center">
                                        {business.logo ? (
                                            <Image source={{ uri: business.logo }} className="w-12 h-12 rounded-full" />
                                        ) : (
                                            <MaterialCommunityIcons name="office-building" size={20} color="#6b7280" />
                                        )}
                                    </View>
                                    <View className="ml-3 flex-1">
                                        <Text className="text-gray-900 font-semibold">{business.name}</Text>
                                        <Text className="text-gray-500 text-sm">{business.role}</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color="#6b7280" />
                                </Pressable>
                            ))}
                    </View>
                )}

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
