import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Switch,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
    TextInput,
} from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/api';
import { BREAKPOINTS } from '../../lib/useResponsive';

interface NotificationPreferences {
    id: string;
    lowStockEmail: boolean;
    lowStockPush: boolean;
    newSaleEmail: boolean;
    newSalePush: boolean;
    largeSaleEmail: boolean;
    largeSalePush: boolean;
    largeSaleThreshold: number;
    newCustomerEmail: boolean;
    newCustomerPush: boolean;
    dailySummaryEmail: boolean;
    weeklyReportEmail: boolean;
}

export default function NotificationPreferencesScreen() {
    const { width } = useWindowDimensions();
    const { currentBusiness } = useAuthStore();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Responsive helpers
    const isTablet = width >= BREAKPOINTS.tablet;
    const cardPadding = isTablet ? 'p-5' : 'p-4';

    // Fetch preferences
    useEffect(() => {
        const fetchPreferences = async () => {
            if (!currentBusiness) return;

            try {
                const res = await api.get('/api/notifications/preferences', {
                    businessId: currentBusiness.id,
                });

                if (res.success && res.data) {
                    setPreferences(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch preferences:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreferences();
    }, [currentBusiness]);

    // Update preference
    const updatePreference = async (key: keyof NotificationPreferences, value: boolean | number) => {
        if (!currentBusiness || !preferences) return;

        // Optimistic update
        setPreferences((prev) => prev ? { ...prev, [key]: value } : null);

        try {
            await api.put(`/api/notifications/preferences?businessId=${currentBusiness.id}`, { [key]: value });
        } catch (error) {
            console.error('Failed to update preference:', error);
            // Revert on error
            setPreferences((prev) => prev ? { ...prev, [key]: !value } : null);
            Alert.alert('Error', 'Failed to update preference');
        }
    };

    // Preference item component
    const PreferenceItem = ({
        title,
        description,
        emailKey,
        pushKey,
        icon,
        color,
    }: {
        title: string;
        description: string;
        emailKey?: keyof NotificationPreferences;
        pushKey?: keyof NotificationPreferences;
        icon: string;
        color: string;
    }) => (
        <View className={`bg-white rounded-xl ${cardPadding} mb-3`}>
            <View className="flex-row items-center mb-3">
                <View
                    className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} rounded-full items-center justify-center mr-3`}
                    style={{ backgroundColor: color + '20' }}
                >
                    <MaterialCommunityIcons name={icon as any} size={isTablet ? 20 : 16} color={color} />
                </View>
                <View className="flex-1">
                    <Text className={`font-semibold text-gray-900 ${isTablet ? 'text-base' : 'text-sm'}`}>{title}</Text>
                    <Text className={`text-gray-500 ${isTablet ? 'text-sm' : 'text-xs'}`}>{description}</Text>
                </View>
            </View>
            <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                {emailKey && (
                    <View className="flex-row items-center flex-1">
                        <MaterialCommunityIcons name="email-outline" size={18} color="#6b7280" />
                        <Text className="text-gray-600 text-sm ml-2 mr-2">Email</Text>
                        <Switch
                            value={preferences?.[emailKey] as boolean}
                            onValueChange={(value) => updatePreference(emailKey, value)}
                            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                            thumbColor={preferences?.[emailKey] ? '#22c55e' : '#f4f4f5'}
                        />
                    </View>
                )}
                {pushKey && (
                    <View className="flex-row items-center flex-1 justify-end">
                        <MaterialCommunityIcons name="bell-outline" size={18} color="#6b7280" />
                        <Text className="text-gray-600 text-sm ml-2 mr-2">In-App</Text>
                        <Switch
                            value={preferences?.[pushKey] as boolean}
                            onValueChange={(value) => updatePreference(pushKey, value)}
                            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                            thumbColor={preferences?.[pushKey] ? '#22c55e' : '#f4f4f5'}
                        />
                    </View>
                )}
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ title: 'Notification Settings' }} />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: 100,
                    paddingHorizontal: isTablet ? 24 : 16,
                    ...(isTablet && { maxWidth: 600, alignSelf: 'center', width: '100%' }),
                }}
            >
                {/* Section: Sales */}
                <Text className="text-gray-500 font-medium mb-3 uppercase text-xs tracking-wider">
                    Sales & Transactions
                </Text>

                <PreferenceItem
                    title="New Sale"
                    description="Get notified when a sale is completed"
                    emailKey="newSaleEmail"
                    pushKey="newSalePush"
                    icon="cart-check"
                    color="#22c55e"
                />

                <PreferenceItem
                    title="Large Sale"
                    description="Get notified for sales above threshold"
                    emailKey="largeSaleEmail"
                    pushKey="largeSalePush"
                    icon="star-circle"
                    color="#eab308"
                />

                {/* Large Sale Threshold */}
                <View className={`bg-white rounded-xl ${cardPadding} mb-3`}>
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className={`font-semibold text-gray-900 ${isTablet ? 'text-base' : 'text-sm'}`}>
                                Large Sale Threshold
                            </Text>
                            <Text className={`text-gray-500 ${isTablet ? 'text-sm' : 'text-xs'}`}>
                                Minimum amount to trigger large sale alert
                            </Text>
                        </View>
                        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                            <Text className="text-gray-500 mr-1">$</Text>
                            <TextInput
                                value={String(preferences?.largeSaleThreshold || 10000)}
                                onChangeText={(text) => {
                                    const value = parseInt(text) || 0;
                                    setPreferences((prev) => prev ? { ...prev, largeSaleThreshold: value } : null);
                                }}
                                onBlur={() => {
                                    if (preferences?.largeSaleThreshold) {
                                        updatePreference('largeSaleThreshold', preferences.largeSaleThreshold);
                                    }
                                }}
                                keyboardType="numeric"
                                className="text-gray-900 font-semibold w-20 text-right"
                            />
                        </View>
                    </View>
                </View>

                {/* Section: Inventory */}
                <Text className="text-gray-500 font-medium mb-3 mt-6 uppercase text-xs tracking-wider">
                    Inventory
                </Text>

                <PreferenceItem
                    title="Low Stock Alert"
                    description="Get notified when products are running low"
                    emailKey="lowStockEmail"
                    pushKey="lowStockPush"
                    icon="alert-circle"
                    color="#ef4444"
                />

                {/* Section: Customers */}
                <Text className="text-gray-500 font-medium mb-3 mt-6 uppercase text-xs tracking-wider">
                    Customers
                </Text>

                <PreferenceItem
                    title="New Customer"
                    description="Get notified when a new customer is added"
                    emailKey="newCustomerEmail"
                    pushKey="newCustomerPush"
                    icon="account-plus"
                    color="#3b82f6"
                />

                {/* Section: Reports */}
                <Text className="text-gray-500 font-medium mb-3 mt-6 uppercase text-xs tracking-wider">
                    Reports & Summaries
                </Text>

                <View className={`bg-white rounded-xl ${cardPadding} mb-3`}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View
                                className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} rounded-full items-center justify-center mr-3`}
                                style={{ backgroundColor: '#8b5cf620' }}
                            >
                                <MaterialCommunityIcons name="chart-bar" size={isTablet ? 20 : 16} color="#8b5cf6" />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-gray-900 ${isTablet ? 'text-base' : 'text-sm'}`}>
                                    Daily Summary
                                </Text>
                                <Text className={`text-gray-500 ${isTablet ? 'text-sm' : 'text-xs'}`}>
                                    Receive daily business summary via email
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={preferences?.dailySummaryEmail}
                            onValueChange={(value) => updatePreference('dailySummaryEmail', value)}
                            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                            thumbColor={preferences?.dailySummaryEmail ? '#22c55e' : '#f4f4f5'}
                        />
                    </View>
                </View>

                <View className={`bg-white rounded-xl ${cardPadding} mb-3`}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <View
                                className={`${isTablet ? 'w-10 h-10' : 'w-8 h-8'} rounded-full items-center justify-center mr-3`}
                                style={{ backgroundColor: '#8b5cf620' }}
                            >
                                <MaterialCommunityIcons name="file-chart" size={isTablet ? 20 : 16} color="#8b5cf6" />
                            </View>
                            <View className="flex-1">
                                <Text className={`font-semibold text-gray-900 ${isTablet ? 'text-base' : 'text-sm'}`}>
                                    Weekly Report
                                </Text>
                                <Text className={`text-gray-500 ${isTablet ? 'text-sm' : 'text-xs'}`}>
                                    Receive weekly report via email
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={preferences?.weeklyReportEmail}
                            onValueChange={(value) => updatePreference('weeklyReportEmail', value)}
                            trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                            thumbColor={preferences?.weeklyReportEmail ? '#22c55e' : '#f4f4f5'}
                        />
                    </View>
                </View>

                {/* Info */}
                <View className="bg-blue-50 rounded-xl p-4 mt-6">
                    <View className="flex-row items-start">
                        <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
                        <Text className="text-blue-700 text-sm ml-2 flex-1">
                            Email notifications will be sent to the email address associated with your account.
                            In-app notifications appear in real-time when you're using the app.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
