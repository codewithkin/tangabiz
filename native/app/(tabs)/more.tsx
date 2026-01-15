// More Screen - Settings, Customers, Reports, etc.
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, useWindowDimensions } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';
import { useResponsive } from '@/lib/useResponsive';
import { api } from '@/lib/api';

export default function MoreScreen() {
    const { user, currentBusiness, businesses, signOut, setCurrentBusiness } = useAuthStore();
    const { resetOnboarding } = useOnboardingStore();
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    // Responsive
    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, touchTargets, avatarSizes } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';

    // Fetch unread notification count
    useFocusEffect(
        React.useCallback(() => {
            const fetchUnreadCount = async () => {
                if (!currentBusiness) return;
                try {
                    const res = await api.get('/api/notifications/count', {
                        businessId: currentBusiness.id,
                    });
                    if (res.success && res.data) {
                        setUnreadNotifications(res.data.count || 0);
                    }
                } catch (error) {
                    console.error('Failed to fetch notification count:', error);
                }
            };
            fetchUnreadCount();
        }, [currentBusiness])
    );

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
            className={`flex-row items-center ${isTablet ? 'py-5 px-5' : 'py-4 px-4'} bg-white border-b border-gray-50`}
        >
            <View
                className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} rounded-full items-center justify-center mr-4`}
                style={{ backgroundColor: `${color}15` }}
            >
                <MaterialCommunityIcons name={icon} size={iconSizes.small} color={color} />
            </View>
            <View className="flex-1">
                <Text className={`text-gray-900 font-medium ${isTablet ? 'text-lg' : 'text-base'}`}>{label}</Text>
                {description && (
                    <Text className={`text-gray-500 ${typography.small} mt-0.5`}>{description}</Text>
                )}
            </View>
            {badge && (
                <View className={`bg-green-500 ${isTablet ? 'px-3 py-1.5' : 'px-2 py-1'} rounded-full mr-2`}>
                    <Text className={`text-white ${typography.small} font-medium`}>{badge}</Text>
                </View>
            )}
            {showArrow && (
                <MaterialCommunityIcons name="chevron-right" size={iconSizes.small} color="#9ca3af" />
            )}
        </Pressable>
    );

    const SectionHeader = ({ title }: { title: string }) => (
        <Text className={`text-gray-500 ${typography.small} font-semibold uppercase tracking-wide ${isTablet ? 'px-5' : 'px-4'} py-2 bg-gray-50`}>
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

            <ScrollView contentContainerStyle={isLargeTablet ? { maxWidth: 800, alignSelf: 'center', width: '100%' } : undefined}>
                {/* User Profile Card */}
                <View className={`bg-green-500 ${isTablet ? 'px-6 py-8' : 'px-4 py-6'}`}>
                    <View className="flex-row items-center">
                        <View
                            className="bg-white/20 rounded-full items-center justify-center mr-4"
                            style={{ width: avatarSizes.large, height: avatarSizes.large }}
                        >
                            <Text className={`text-white ${isTablet ? 'text-3xl' : 'text-2xl'} font-bold`}>
                                {user?.name?.charAt(0) || 'U'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className={`text-white ${isTablet ? 'text-2xl' : 'text-xl'} font-bold`}>{user?.name || 'User'}</Text>
                            <Text className={`text-green-100 ${typography.body}`}>{user?.email}</Text>
                        </View>
                        <Pressable
                            onPress={() => router.push('/settings/profile')}
                            className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} bg-white/20 rounded-full items-center justify-center`}
                        >
                            <MaterialCommunityIcons name="pencil" size={iconSizes.small} color="#fff" />
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
                        className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'p-5' : 'p-4'} shadow-sm`}
                    >
                        <View className="flex-row items-center">
                            <View className={`${isTablet ? 'w-14 h-14' : 'w-12 h-12'} bg-green-100 rounded-xl items-center justify-center mr-4`}>
                                <MaterialCommunityIcons name="store" size={iconSizes.medium} color="#22c55e" />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-gray-500 ${typography.small} uppercase`}>Current Business</Text>
                                <Text className={`text-gray-900 font-semibold ${isTablet ? 'text-xl' : 'text-lg'}`}>
                                    {currentBusiness.name}
                                </Text>
                                <View className="flex-row items-center mt-1">
                                    <View className={`bg-green-100 ${isTablet ? 'px-3 py-1' : 'px-2 py-0.5'} rounded`}>
                                        <Text className={`text-green-700 ${typography.small} font-medium`}>
                                            {currentBusiness.role}
                                        </Text>
                                    </View>
                                    {businesses.length > 1 && (
                                        <Text className={`text-gray-400 ${typography.small} ml-2`}>
                                            {businesses.length} businesses
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {businesses.length > 1 && (
                                <MaterialCommunityIcons name="swap-horizontal" size={iconSizes.medium} color="#9ca3af" />
                            )}
                        </View>
                    </Pressable>
                )}

                {/* Management */}
                <SectionHeader title="Management" />
                <View className="bg-white">
                    <MenuItem
                        icon="bell"
                        label="Notifications"
                        description="View business alerts and updates"
                        onPress={() => router.push('/notifications')}
                        color="#22c55e"
                        badge={unreadNotifications > 0 ? String(unreadNotifications) : undefined}
                    />
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
                        icon="bell-cog"
                        label="Notification Settings"
                        description="Configure alerts and emails"
                        onPress={() => router.push('/notifications/preferences')}
                        color="#f97316"
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
