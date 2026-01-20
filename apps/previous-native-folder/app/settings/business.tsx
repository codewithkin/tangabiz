// Business Settings Screen
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

const BUSINESS_TYPES = [
    { value: 'RETAIL', label: 'Retail', icon: 'store' },
    { value: 'WHOLESALE', label: 'Wholesale', icon: 'warehouse' },
    { value: 'RESTAURANT', label: 'Restaurant', icon: 'food' },
    { value: 'SERVICE', label: 'Service', icon: 'briefcase' },
    { value: 'OTHER', label: 'Other', icon: 'dots-horizontal' },
];

const CURRENCIES = [
    { value: 'XOF', label: 'CFA Franc (XOF)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'NGN', label: 'Nigerian Naira (NGN)' },
    { value: 'GHS', label: 'Ghanaian Cedi (GHS)' },
    { value: 'KES', label: 'Kenyan Shilling (KES)' },
];

export default function BusinessSettingsScreen() {
    const { currentBusiness, setBusiness } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'RETAIL',
        currency: 'XOF',
        address: '',
        city: '',
        phone: '',
        email: '',
        taxId: '',
        invoiceFooter: '',
    });

    useEffect(() => {
        if (currentBusiness) {
            setForm({
                name: currentBusiness.name || '',
                type: currentBusiness.type || 'RETAIL',
                currency: currentBusiness.currency || 'XOF',
                address: currentBusiness.address || '',
                city: currentBusiness.city || '',
                phone: currentBusiness.phone || '',
                email: currentBusiness.email || '',
                taxId: currentBusiness.taxId || '',
                invoiceFooter: currentBusiness.invoiceFooter || '',
            });
        }
    }, [currentBusiness]);

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Business name is required');
            return;
        }

        if (!currentBusiness) return;

        setIsLoading(true);

        try {
            const res = await api.put(`/api/businesses/${currentBusiness.id}`, {
                name: form.name.trim(),
                type: form.type,
                currency: form.currency,
                address: form.address.trim() || undefined,
                city: form.city.trim() || undefined,
                phone: form.phone.trim() || undefined,
                email: form.email.trim() || undefined,
                taxId: form.taxId.trim() || undefined,
                invoiceFooter: form.invoiceFooter.trim() || undefined,
            });

            if (res.data?.data) {
                setBusiness(res.data.data);
            }

            Alert.alert('Success', 'Business updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update business');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-50"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen
                options={{
                    title: 'Business Settings',
                    headerRight: () => (
                        <Pressable
                            onPress={handleSave}
                            disabled={isLoading}
                            className="mr-4"
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white font-semibold text-base">Save</Text>
                            )}
                        </Pressable>
                    ),
                }}
            />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Basic Info */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Basic Information
                    </Text>

                    {/* Business Name */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">
                            Business Name <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="store" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Your business name"
                                placeholderTextColor="#9ca3af"
                                value={form.name}
                                onChangeText={(value) => updateField('name', value)}
                            />
                        </View>
                    </View>

                    {/* Business Type */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">
                            Business Type
                        </Text>
                        <Pressable
                            onPress={() => setShowTypeModal(true)}
                            className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
                        >
                            <MaterialCommunityIcons
                                name={BUSINESS_TYPES.find(t => t.value === form.type)?.icon as any || 'store'}
                                size={20}
                                color="#6b7280"
                            />
                            <Text className="flex-1 ml-3 text-gray-900 text-base">
                                {BUSINESS_TYPES.find(t => t.value === form.type)?.label || 'Select type'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#9ca3af" />
                        </Pressable>
                    </View>

                    {/* Currency */}
                    <View>
                        <Text className="text-gray-700 text-sm font-medium mb-2">
                            Currency
                        </Text>
                        <Pressable
                            onPress={() => setShowCurrencyModal(true)}
                            className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
                        >
                            <MaterialCommunityIcons name="currency-usd" size={20} color="#6b7280" />
                            <Text className="flex-1 ml-3 text-gray-900 text-base">
                                {CURRENCIES.find(c => c.value === form.currency)?.label || 'Select currency'}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={20} color="#9ca3af" />
                        </Pressable>
                    </View>
                </View>

                {/* Contact Info */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Contact Information
                    </Text>

                    {/* Phone */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">Phone</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Business phone"
                                placeholderTextColor="#9ca3af"
                                keyboardType="phone-pad"
                                value={form.phone}
                                onChangeText={(value) => updateField('phone', value)}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View>
                        <Text className="text-gray-700 text-sm font-medium mb-2">Email</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="business@email.com"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={form.email}
                                onChangeText={(value) => updateField('email', value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Location */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Location
                    </Text>

                    {/* Address */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">Address</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="map-marker" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Street address"
                                placeholderTextColor="#9ca3af"
                                value={form.address}
                                onChangeText={(value) => updateField('address', value)}
                            />
                        </View>
                    </View>

                    {/* City */}
                    <View>
                        <Text className="text-gray-700 text-sm font-medium mb-2">City</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="city" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="City"
                                placeholderTextColor="#9ca3af"
                                value={form.city}
                                onChangeText={(value) => updateField('city', value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Tax Info */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Tax Information
                    </Text>

                    <View>
                        <Text className="text-gray-700 text-sm font-medium mb-2">Tax ID</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="file-document" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Tax identification number"
                                placeholderTextColor="#9ca3af"
                                value={form.taxId}
                                onChangeText={(value) => updateField('taxId', value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Invoice Settings */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Invoice Settings
                    </Text>

                    <View>
                        <Text className="text-gray-700 text-sm font-medium mb-2">Invoice Footer Text</Text>
                        <Text className="text-gray-400 text-xs mb-2">
                            Add custom text to appear at the bottom of invoices (e.g., return policies, disclaimers)
                        </Text>
                        <View className="bg-gray-100 rounded-xl px-4 py-3">
                            <TextInput
                                className="text-gray-900 text-base"
                                placeholder="e.g., NO REFUNDS. All sales are final."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                maxLength={500}
                                value={form.invoiceFooter}
                                onChangeText={(value) => updateField('invoiceFooter', value)}
                                style={{ minHeight: 80 }}
                            />
                        </View>
                        <Text className="text-gray-400 text-xs text-right mt-1">
                            {form.invoiceFooter.length}/500
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View className="px-4 pb-6 pt-2 bg-white border-t border-gray-100">
                <Pressable
                    onPress={handleSave}
                    disabled={isLoading}
                    className={`py-4 rounded-xl items-center ${isLoading ? 'bg-green-300' : 'bg-green-500'}`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-base">Save Changes</Text>
                    )}
                </Pressable>
            </View>

            {/* Business Type Modal */}
            {showTypeModal && (
                <View className="absolute inset-0 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 pb-10">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-gray-900 text-lg font-bold">Business Type</Text>
                            <Pressable onPress={() => setShowTypeModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </Pressable>
                        </View>
                        {BUSINESS_TYPES.map((type) => (
                            <Pressable
                                key={type.value}
                                onPress={() => {
                                    updateField('type', type.value);
                                    setShowTypeModal(false);
                                }}
                                className={`flex-row items-center py-4 border-b border-gray-100 ${form.type === type.value ? 'bg-green-50' : ''
                                    }`}
                            >
                                <MaterialCommunityIcons
                                    name={type.icon as any}
                                    size={24}
                                    color={form.type === type.value ? '#22c55e' : '#6b7280'}
                                />
                                <Text className={`flex-1 ml-3 text-base ${form.type === type.value ? 'text-green-700 font-medium' : 'text-gray-900'
                                    }`}>
                                    {type.label}
                                </Text>
                                {form.type === type.value && (
                                    <MaterialCommunityIcons name="check" size={24} color="#22c55e" />
                                )}
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}

            {/* Currency Modal */}
            {showCurrencyModal && (
                <View className="absolute inset-0 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 pb-10">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-gray-900 text-lg font-bold">Currency</Text>
                            <Pressable onPress={() => setShowCurrencyModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                            </Pressable>
                        </View>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {CURRENCIES.map((currency) => (
                                <Pressable
                                    key={currency.value}
                                    onPress={() => {
                                        updateField('currency', currency.value);
                                        setShowCurrencyModal(false);
                                    }}
                                    className={`flex-row items-center py-4 border-b border-gray-100 ${form.currency === currency.value ? 'bg-green-50' : ''
                                        }`}
                                >
                                    <Text className={`flex-1 text-base ${form.currency === currency.value ? 'text-green-700 font-medium' : 'text-gray-900'
                                        }`}>
                                        {currency.label}
                                    </Text>
                                    {form.currency === currency.value && (
                                        <MaterialCommunityIcons name="check" size={24} color="#22c55e" />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}
