// Create Customer Screen
import React, { useState } from 'react';
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

export default function CreateCustomerScreen() {
    const { currentBusiness } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        notes: '',
    });

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Customer name is required');
            return;
        }

        if (!currentBusiness) {
            Alert.alert('Error', 'No business selected');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/api/customers', {
                businessId: currentBusiness.id,
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                address: form.address.trim() || undefined,
                city: form.city.trim() || undefined,
                notes: form.notes.trim() || undefined,
            });

            Alert.alert('Success', 'Customer created successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create customer');
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
                    title: 'Add Customer',
                    headerRight: () => (
                        <Pressable
                            onPress={handleSubmit}
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
                {/* Basic Info Section */}
                <View className="bg-white m-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Basic Information
                    </Text>

                    {/* Name */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">
                            Name <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Customer name"
                                placeholderTextColor="#9ca3af"
                                value={form.name}
                                onChangeText={(value) => updateField('name', value)}
                            />
                        </View>
                    </View>

                    {/* Phone */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">Phone</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Phone number"
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
                                placeholder="Email address"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={form.email}
                                onChangeText={(value) => updateField('email', value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Address Section */}
                <View className="bg-white mx-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Address Information
                    </Text>

                    {/* Address */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">Address</Text>
                        <View className="flex-row items-start bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="map-marker" size={20} color="#6b7280" className="mt-0.5" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Street address"
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={2}
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

                {/* Notes Section */}
                <View className="bg-white m-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-4">
                        Additional Notes
                    </Text>

                    <View className="flex-row items-start bg-gray-100 rounded-xl px-4 py-3">
                        <MaterialCommunityIcons name="note-text" size={20} color="#6b7280" className="mt-0.5" />
                        <TextInput
                            className="flex-1 ml-3 text-gray-900 text-base"
                            placeholder="Add notes about this customer..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={form.notes}
                            onChangeText={(value) => updateField('notes', value)}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Button */}
            <View className="px-4 pb-6 pt-2 bg-white border-t border-gray-100">
                <Pressable
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className={`py-4 rounded-xl items-center ${isLoading ? 'bg-green-300' : 'bg-green-500'}`}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-base">Add Customer</Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}
