import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { CVT_URLS } from '@/store/auth';
import AppName from '@/components/app-name';
import { useConnection } from '@/hooks/useConnection';

// About page displaying app information, version details, developer credits, links to CVT platform, support resources, and legal information for TangaBiz POS system.
export default function AboutPage() {
    const APP_VERSION = '1.0.0';
    const BUILD_NUMBER = '1';
    const { isLoading, isConnected } = useConnection();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isConnected) {
            router.push('/offline');
        }
    }, [isLoading, isConnected]);

    const openLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            <ScrollView className="flex-1">
                {/* App Header */}
                <View className="bg-white px-6 py-8 items-center border-b border-gray-200">
                    <View className="w-24 h-24 bg-green-500 rounded-3xl items-center justify-center mb-4 shadow-lg">
                        <MaterialCommunityIcons name="store" size={48} color="white" />
                    </View>
                    <AppName className="text-3xl font-bold" />
                    <Text className="text-gray-500 mt-2">Point of Sale Management System</Text>
                    <View className="bg-gray-100 px-4 py-2 rounded-full mt-4">
                        <Text className="text-gray-700 text-sm font-semibold">
                            Version {APP_VERSION} (Build {BUILD_NUMBER})
                        </Text>
                    </View>
                </View>

                {/* About */}
                <View className="bg-white mt-4 px-6 py-6">
                    <Text className="text-lg font-bold text-gray-900 mb-3">About Tangabiz</Text>
                    <Text className="text-gray-600 leading-6">
                        Tangabiz is a modern Point of Sale system designed specifically for Zimbabwean businesses.
                        We help you manage sales, inventory, customers, and get valuable insights through our AI-powered analytics.
                    </Text>
                    <Text className="text-gray-600 leading-6 mt-3">
                        Built with cutting-edge technology to provide you with a seamless and efficient business management experience.
                    </Text>
                </View>

                {/* Features */}
                <View className="bg-white mt-4 px-6 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Key Features</Text>
                    <View className="space-y-3">
                        {[
                            { icon: 'cart-outline', title: 'Point of Sale', description: 'Fast and efficient checkout process' },
                            { icon: 'package-variant', title: 'Inventory Management', description: 'Track stock levels and products' },
                            { icon: 'account-group', title: 'Customer Management', description: 'Build customer relationships' },
                            { icon: 'chart-line', title: 'Sales Analytics', description: 'Insights and reports on your business' },
                            { icon: 'robot-outline', title: 'AI Assistant', description: 'Get intelligent business insights' },
                            { icon: 'shield-check', title: 'Secure & Reliable', description: 'Your data is safe with us' },
                        ].map((feature, index) => (
                            <View key={index} className="flex-row items-center py-3 border-b border-gray-100">
                                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                                    <MaterialCommunityIcons name={feature.icon as any} size={20} color="#16a34a" />
                                </View>
                                <View className="ml-4 flex-1">
                                    <Text className="text-gray-900 font-semibold">{feature.title}</Text>
                                    <Text className="text-gray-500 text-sm">{feature.description}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Links */}
                <View className="bg-white mt-4 px-6 py-4">
                    <Text className="text-lg font-bold text-gray-900 mb-4">Resources</Text>
                    <View className="space-y-2">
                        <Pressable
                            onPress={() => openLink(CVT_URLS.dashboard)}
                            className="flex-row items-center justify-between py-3 border-b border-gray-100 active:bg-gray-50"
                        >
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#6b7280" />
                                <Text className="text-gray-900 ml-3">CVT Dashboard</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={18} color="#6b7280" />
                        </Pressable>

                        <Pressable
                            onPress={() => openLink(`${CVT_URLS.dashboard}/support`)}
                            className="flex-row items-center justify-between py-3 border-b border-gray-100 active:bg-gray-50"
                        >
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="help-circle-outline" size={20} color="#6b7280" />
                                <Text className="text-gray-900 ml-3">Help & Support</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={18} color="#6b7280" />
                        </Pressable>

                        <Pressable
                            onPress={() => openLink(`${CVT_URLS.dashboard}/terms`)}
                            className="flex-row items-center justify-between py-3 border-b border-gray-100 active:bg-gray-50"
                        >
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="file-document-outline" size={20} color="#6b7280" />
                                <Text className="text-gray-900 ml-3">Terms of Service</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={18} color="#6b7280" />
                        </Pressable>

                        <Pressable
                            onPress={() => openLink(`${CVT_URLS.dashboard}/privacy`)}
                            className="flex-row items-center justify-between py-3 active:bg-gray-50"
                        >
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#6b7280" />
                                <Text className="text-gray-900 ml-3">Privacy Policy</Text>
                            </View>
                            <MaterialCommunityIcons name="open-in-new" size={18} color="#6b7280" />
                        </Pressable>
                    </View>
                </View>

                {/* Credits */}
                <View className="bg-white mt-4 px-6 py-6 items-center">
                    <Text className="text-gray-500 text-sm text-center">
                        Powered by Christus Veritas Technologies
                    </Text>
                    <Text className="text-gray-400 text-xs mt-2">
                        © 2026 Tangabiz. All rights reserved.
                    </Text>
                </View>

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
