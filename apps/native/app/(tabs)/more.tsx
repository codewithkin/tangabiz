import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore, CVT_URLS } from '@/store/auth';

interface MenuItemProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
    badge?: string;
    description?: string;
}

const MenuItem = ({ icon, label, onPress, color = '#22c55e', badge, description }: MenuItemProps) => (
    <Pressable 
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }} 
        className="flex-row items-center py-3"
    >
        <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: color + '15' }}
        >
            <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <View className="flex-1">
            <Text className="text-gray-900 font-medium">{label}</Text>
            {description && (
                <Text className="text-gray-400 text-sm">{description}</Text>
            )}
        </View>
        {badge && (
            <View className="bg-red-500 px-2 py-1 rounded-full mr-2">
                <Text className="text-white text-xs font-bold">{badge}</Text>
            </View>
        )}
        <MaterialCommunityIcons name="chevron-right" size={22} color="#d1d5db" />
    </Pressable>
);

const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-5">
        <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider px-4 mb-2">{title}</Text>
        <View className="bg-white rounded-2xl mx-4 px-4 shadow-sm border border-gray-100">
            {children}
        </View>
    </View>
);

const MenuDivider = () => <View className="h-px bg-gray-100" />;

export default function More() {
    const { currentBusiness, user, signOut } = useAuthStore();
    const router = useRouter();

    const handleSignOut = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/sign-in');
                    }
                },
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="px-4 pt-4 pb-6">
                    <Text className="text-2xl font-bold text-gray-900">Settings</Text>
                </View>

                {/* Profile Card */}
                <View className="mx-4 mb-6">
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <View className="flex-row items-center">
                            <View className="w-16 h-16 bg-green-500 rounded-2xl items-center justify-center mr-4">
                                <Text className="text-white text-2xl font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-bold text-lg">{user?.name || 'User'}</Text>
                                <Text className="text-gray-500">{user?.email || 'No email'}</Text>
                                <View className="flex-row items-center mt-1.5">
                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                    <Text className="text-gray-400 text-sm">
                                        {currentBusiness?.role || 'Member'}
                                    </Text>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => router.push('/settings/profile')}
                                className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center"
                            >
                                <MaterialCommunityIcons name="pencil" size={18} color="#6b7280" />
                            </Pressable>
                        </View>

                        {/* Business Switcher */}
                        <Pressable
                            onPress={() => router.push('/settings/business')}
                            className="mt-4 pt-4 border-t border-gray-100 flex-row items-center"
                        >
                            <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                                <MaterialCommunityIcons name="store" size={20} color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-medium">
                                    {currentBusiness?.name || 'Select Business'}
                                </Text>
                                <Text className="text-gray-400 text-sm">Current business</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={22} color="#d1d5db" />
                        </Pressable>
                    </View>
                </View>

                {/* Business Section */}
                <MenuSection title="Business">
                    <MenuItem
                        icon="account-group"
                        label="Customers"
                        description="Manage your customer database"
                        onPress={() => router.push('/customers')}
                        color="#8b5cf6"
                    />
                    <MenuDivider />
                    <MenuItem
                        icon="chart-bar"
                        label="Reports"
                        description="Sales analytics & insights"
                        onPress={() => router.push('/reports')}
                        color="#f97316"
                    />
                </MenuSection>

                {/* Features Section */}
                <MenuSection title="Features">
                    <MenuItem
                        icon="robot"
                        label="Tatenda AI Assistant"
                        description="Ask questions about your business"
                        onPress={() => router.push('/ai')}
                        color="#eab308"
                    />
                    <MenuDivider />
                    <MenuItem
                        icon="qrcode-scan"
                        label="Verify Invoice"
                        description="Scan QR code to verify"
                        onPress={() => router.push('/verify-invoice')}
                        color="#22c55e"
                    />
                    <MenuDivider />
                    <MenuItem
                        icon="bell"
                        label="Notifications"
                        description="Alerts and updates"
                        onPress={() => router.push('/notifications')}
                        color="#ef4444"
                    />
                </MenuSection>

                {/* Settings Section */}
                <MenuSection title="App Settings">
                    <MenuItem
                        icon="cog"
                        label="Preferences"
                        description="Theme, language, display"
                        onPress={() => router.push('/settings')}
                        color="#6b7280"
                    />
                </MenuSection>

                {/* Support Section */}
                <MenuSection title="Support">
                    <MenuItem
                        icon="help-circle"
                        label="Help & Support"
                        description="FAQs and contact support"
                        onPress={() => Linking.openURL('https://tangabiz.store/help')}
                        color="#3b82f6"
                    />
                    <MenuDivider />
                    <MenuItem
                        icon="open-in-new"
                        label="CVT Dashboard"
                        description="Manage your CVT account"
                        onPress={() => Linking.openURL(CVT_URLS.dashboard)}
                        color="#8b5cf6"
                    />
                </MenuSection>

                {/* Sign Out Button */}
                <View className="mx-4 mt-2">
                    <Pressable
                        onPress={handleSignOut}
                        className="bg-white py-4 rounded-2xl items-center justify-center flex-row shadow-sm border border-gray-100 active:bg-red-50"
                    >
                        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                        <Text className="text-red-500 font-semibold ml-2">Sign Out</Text>
                    </Pressable>
                </View>

                {/* Version */}
                <View className="items-center mt-8">
                    <Text className="text-gray-400 text-sm">
                        Tangabiz v1.0.0
                    </Text>
                    <Text className="text-gray-300 text-xs mt-1">
                        Powered by CVT
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
