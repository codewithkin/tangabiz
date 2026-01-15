// More Screen - Settings, Customers, Reports, etc.
import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';

export default function MoreScreen() {
    const { user, currentBusiness, businesses, signOut, setCurrentBusiness } = useAuthStore();
    const { resetOnboarding } = useOnboardingStore();

    const handleSignOut = () => {
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
                    },
                },
            ]
        );
    };

    const MenuItem = ({
        icon,
        label,
        description,
        onPress,
        color = '#374151',
        showArrow = true,
        badge,
    }: {
        icon: keyof typeof MaterialCommunityIcons.glyphMap;
        label: string;
        description?: string;
        onPress: () => void;
        color?: string;
        showArrow?: boolean;
        badge?: string;
    }) => (
        <Pressable
            onPress={onPress}
            className="flex-row items-center py-4 px-4 bg-white border-b border-gray-50"
        >
            <View
                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${color}15` }}
            >
                <MaterialCommunityIcons name={icon} size={22} color={color} />
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 font-medium text-base">{label}</Text>
                {description && (
                    <Text className="text-gray-500 text-sm mt-0.5">{description}</Text>
                )}
            </View>
            {badge && (
                <View className="bg-green-500 px-2 py-1 rounded-full mr-2">
                    <Text className="text-white text-xs font-medium">{badge}</Text>
                </View>
            )}
            {showArrow && (
                <MaterialCommunityIcons name="chevron-right" size={22} color="#9ca3af" />
            )}
        </Pressable>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-2 bg-gray-50">
            {title}
        </Text>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'More',
                }}
            />

            <ScrollView>
                {/* User Profile Card */}
                <View className="bg-green-500 px-4 py-6">
                    <View className="flex-row items-center">
                        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
                            <Text className="text-white text-2xl font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold">{user?.name || 'User'}</Text>
                            <Text className="text-green-100">{user?.email}</Text>
                        </View>
                        <Pressable
                            onPress={() => router.push('/settings/profile')}
                            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                        >
                            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                        </Pressable>
                    </View>
                </View>

                {/* Current Business */}
                {currentBusiness && (
                    <Pressable
                        onPress={() => {
                            if (businesses.length > 1) {
                                Alert.alert(
                                    'Switch Business',
                                    'Select a business',
                                    businesses.map((b) => ({
                                        text: b.name,
                                        onPress: () => setCurrentBusiness(b),
                                    }))
                                );
                            }
                        }}
                        className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm"
                    >
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-4">
                                <MaterialCommunityIcons name="store" size={26} color="#22c55e" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-500 text-xs uppercase">Current Business</Text>
                                <Text className="text-gray-900 font-semibold text-lg">
                                    {currentBusiness.name}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <View className="bg-green-100 px-2 py-0.5 rounded">
                                        <Text className="text-green-700 text-xs font-medium">
                                            {currentBusiness.role}
                                        </Text>
                                    </View>
                                    {businesses.length > 1 && (
                                        <Text className="text-gray-400 text-xs ml-2">
                                            {businesses.length} businesses
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {businesses.length > 1 && (
                                <MaterialCommunityIcons name="swap-horizontal" size={24} color="#9ca3af" />
                            )}
                        </View>
                    </Pressable>
                )}

                {/* Management */}
                <SectionHeader title="Management" />
                <View className="bg-white">
                    <MenuItem
                        icon="account-group"
                        label="Customers"
                        description="Manage your customer database"
                        onPress={() => router.push('/customers')}
                        color="#eab308"
                    />
                    <MenuItem
                        icon="tag-multiple"
                        label="Categories"
                        description="Organize products by category"
                        onPress={() => router.push('/categories')}
                        color="#3b82f6"
                    />
                    <MenuItem
                        icon="chart-bar"
                        label="Reports"
                        description="View sales and inventory reports"
                        onPress={() => router.push('/reports')}
                        color="#8b5cf6"
                    />
                </View>

                {/* Business */}
                <SectionHeader title="Business" />
                <View className="bg-white">
                    <MenuItem
                        icon="store-cog"
                        label="Business Settings"
                        description="Manage business details"
                        onPress={() => router.push('/settings/business')}
                        color="#22c55e"
                    />
                    <MenuItem
                        icon="account-multiple"
                        label="Team Members"
                        description="Manage staff access"
                        onPress={() => router.push('/settings/team')}
                        color="#06b6d4"
                    />
                </View>

                {/* Account */}
                <SectionHeader title="Account" />
                <View className="bg-white">
                    <MenuItem
                        icon="account-cog"
                        label="Profile Settings"
                        description="Update your personal info"
                        onPress={() => router.push('/settings/profile')}
                        color="#6366f1"
                    />
                    <MenuItem
                        icon="help-circle"
                        label="Help & Support"
                        description="Get help using Tangabiz"
                        onPress={() => router.push('/help')}
                        color="#14b8a6"
                    />
                    <MenuItem
                        icon="information"
                        label="About"
                        description="Version 1.0.0"
                        onPress={() => { }}
                        color="#9ca3af"
                        showArrow={false}
                    />
                </View>

                {/* Sign Out */}
                <View className="mt-4 mb-8 bg-white">
                    <MenuItem
                        icon="logout"
                        label="Sign Out"
                        onPress={handleSignOut}
                        color="#ef4444"
                        showArrow={false}
                    />
                </View>
            </ScrollView>
        </View>
    );
}
