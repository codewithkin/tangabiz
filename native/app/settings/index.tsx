// Settings Screen
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Switch,
    Alert,
    Linking,
    useWindowDimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { useOnboardingStore } from '@/store/onboarding';
import * as Application from 'expo-application';
import { useResponsive } from '@/lib/useResponsive';

export default function SettingsScreen() {
    const { signOut, currentBusiness } = useAuthStore();
    const { resetOnboarding } = useOnboardingStore();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [biometrics, setBiometrics] = useState(false);

    // Responsive
    const { width } = useWindowDimensions();
    const { deviceType, iconSizes, typography, touchTargets } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';
    const isLargeTablet = deviceType === 'largeTablet';

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

    const handleResetOnboarding = () => {
        Alert.alert(
            'Reset Onboarding',
            'This will show the onboarding screens again next time you open the app.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: () => {
                        resetOnboarding();
                        Alert.alert('Done', 'Onboarding has been reset');
                    },
                },
            ]
        );
    };

    const handleSupport = () => {
        Linking.openURL('mailto:support@tangabiz.com');
    };

    const handlePrivacy = () => {
        Linking.openURL('https://tangabiz.com/privacy');
    };

    const handleTerms = () => {
        Linking.openURL('https://tangabiz.com/terms');
    };

    const MenuItem = ({
        icon,
        title,
        subtitle,
        onPress,
        rightElement,
        destructive = false,
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        onPress?: () => void;
        rightElement?: React.ReactNode;
        destructive?: boolean;
    }) => (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center ${isTablet ? 'py-5' : 'py-4'} border-b border-gray-100`}
        >
            <View className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} rounded-full items-center justify-center mr-3 ${destructive ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                <MaterialCommunityIcons
                    name={icon as any}
                    size={iconSizes.small}
                    color={destructive ? '#ef4444' : '#6b7280'}
                />
            </View>
            <View className="flex-1">
                <Text className={`font-medium ${typography.body} ${destructive ? 'text-red-600' : 'text-gray-900'}`}>
                    {title}
                </Text>
                {subtitle && (
                    <Text className={`text-gray-500 ${typography.small} mt-0.5`}>{subtitle}</Text>
                )}
            </View>
            {rightElement || (
                <MaterialCommunityIcons name="chevron-right" size={iconSizes.small} color="#9ca3af" />
            )}
        </Pressable>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Settings' }} />

            <ScrollView 
                className="flex-1" 
                contentContainerStyle={{ paddingBottom: 100, ...(isLargeTablet && { maxWidth: 800, alignSelf: 'center', width: '100%' }) }}
            >
                {/* Business Info */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'p-5' : 'p-4'}`}>
                    <View className="flex-row items-center">
                        <View className={`${isTablet ? 'w-16 h-16' : 'w-14 h-14'} bg-green-100 rounded-full items-center justify-center`}>
                            <MaterialCommunityIcons name="store" size={iconSizes.medium} color="#22c55e" />
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className={`text-gray-900 ${isTablet ? 'text-xl' : 'text-lg'} font-bold`}>
                                {currentBusiness?.name || 'My Business'}
                            </Text>
                            <Text className={`text-gray-500 ${typography.small}`}>
                                {currentBusiness?.type || 'RETAIL'}
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => router.push('/settings/business')}
                            className={`bg-green-500 ${isTablet ? 'px-5 py-3' : 'px-4 py-2'} rounded-xl`}
                        >
                            <Text className={`text-white font-medium ${typography.body}`}>Edit</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Account Settings */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'px-5' : 'px-4'}`}>
                    <Text className={`text-gray-500 ${typography.small} font-medium pt-4 pb-2`}>Account</Text>

                    <MenuItem
                        icon="account-circle"
                        title="Profile"
                        subtitle="Manage your account details"
                        onPress={() => router.push('/settings/profile')}
                    />

                    <MenuItem
                        icon="shield-lock"
                        title="Security"
                        subtitle="Password and authentication"
                        onPress={() => router.push('/settings/security')}
                    />

                    <MenuItem
                        icon="bell"
                        title="Notifications"
                        rightElement={
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                                thumbColor={notifications ? '#22c55e' : '#f4f4f5'}
                            />
                        }
                    />
                </View>

                {/* App Settings */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'px-5' : 'px-4'}`}>
                    <Text className={`text-gray-500 ${typography.small} font-medium pt-4 pb-2`}>App</Text>

                    <MenuItem
                        icon="palette"
                        title="Appearance"
                        subtitle="Dark mode"
                        rightElement={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                                thumbColor={darkMode ? '#22c55e' : '#f4f4f5'}
                            />
                        }
                    />

                    <MenuItem
                        icon="fingerprint"
                        title="Biometric Login"
                        subtitle="Use Face ID or fingerprint"
                        rightElement={
                            <Switch
                                value={biometrics}
                                onValueChange={setBiometrics}
                                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                                thumbColor={biometrics ? '#22c55e' : '#f4f4f5'}
                            />
                        }
                    />

                    <MenuItem
                        icon="translate"
                        title="Language"
                        subtitle="English"
                        onPress={() => router.push('/settings/language')}
                    />

                    <MenuItem
                        icon="currency-usd"
                        title="Currency"
                        subtitle={currentBusiness?.currency || 'XOF'}
                        onPress={() => router.push('/settings/currency')}
                    />
                </View>

                {/* Business Settings */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'px-5' : 'px-4'}`}>
                    <Text className={`text-gray-500 ${typography.small} font-medium pt-4 pb-2`}>Business</Text>

                    <MenuItem
                        icon="printer"
                        title="Receipt Settings"
                        subtitle="Customize your receipts"
                        onPress={() => router.push('/settings/receipts')}
                    />

                    <MenuItem
                        icon="percent"
                        title="Tax Settings"
                        subtitle="Configure tax rates"
                        onPress={() => router.push('/settings/taxes')}
                    />

                    <MenuItem
                        icon="package-variant"
                        title="Inventory Settings"
                        subtitle="Low stock alerts and more"
                        onPress={() => router.push('/settings/inventory')}
                    />
                </View>

                {/* Support */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'px-5' : 'px-4'}`}>
                    <Text className={`text-gray-500 ${typography.small} font-medium pt-4 pb-2`}>Support</Text>

                    <MenuItem
                        icon="help-circle"
                        title="Help Center"
                        onPress={handleSupport}
                    />

                    <MenuItem
                        icon="message-text"
                        title="Contact Support"
                        onPress={handleSupport}
                    />

                    <MenuItem
                        icon="star"
                        title="Rate App"
                        onPress={() => { }}
                    />
                </View>

                {/* Legal */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'px-5' : 'px-4'}`}>
                    <Text className={`text-gray-500 ${typography.small} font-medium pt-4 pb-2`}>Legal</Text>

                    <MenuItem
                        icon="file-document"
                        title="Terms of Service"
                        onPress={handleTerms}
                    />

                    <MenuItem
                        icon="shield-check"
                        title="Privacy Policy"
                        onPress={handlePrivacy}
                    />
                </View>

                {/* Danger Zone */}
                <View className={`bg-white ${isTablet ? 'mx-6' : 'mx-4'} mt-4 rounded-xl ${isTablet ? 'px-5' : 'px-4'}`}>
                    <Text className={`text-gray-500 ${typography.small} font-medium pt-4 pb-2`}>Danger Zone</Text>

                    <MenuItem
                        icon="restart"
                        title="Reset Onboarding"
                        subtitle="Show onboarding screens again"
                        onPress={handleResetOnboarding}
                    />

                    <MenuItem
                        icon="logout"
                        title="Sign Out"
                        onPress={handleSignOut}
                        destructive
                    />
                </View>

                {/* App Version */}
                <View className="items-center mt-8 mb-4">
                    <Text className={`text-gray-400 ${typography.small}`}>
                        Tangabiz v{Application.nativeApplicationVersion || '1.0.0'}
                    </Text>
                    <Text className={`text-gray-300 ${typography.small} mt-1`}>
                        Build {Application.nativeBuildVersion || '1'}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
