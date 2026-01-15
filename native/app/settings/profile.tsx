// Profile Settings Screen
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

export default function ProfileSettingsScreen() {
    const { user, setUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setIsLoading(true);

        try {
            const res = await api.put('/api/auth/profile', {
                name: form.name.trim(),
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
            });

            if (res.data?.data) {
                setUser(res.data.data);
            }

            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
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
                    title: 'Profile',
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
                {/* Avatar */}
                <View className="items-center py-8">
                    <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center">
                        <Text className="text-green-700 text-4xl font-bold">
                            {form.name.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Pressable className="mt-4">
                        <Text className="text-green-600 font-medium">Change Photo</Text>
                    </Pressable>
                </View>

                {/* Form */}
                <View className="bg-white mx-4 rounded-xl p-4">
                    {/* Name */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">
                            Full Name <Text className="text-red-500">*</Text>
                        </Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="account" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="Your name"
                                placeholderTextColor="#9ca3af"
                                value={form.name}
                                onChangeText={(value) => updateField('name', value)}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View className="mb-4">
                        <Text className="text-gray-700 text-sm font-medium mb-2">Email</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="email" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="your@email.com"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={form.email}
                                onChangeText={(value) => updateField('email', value)}
                            />
                        </View>
                    </View>

                    {/* Phone */}
                    <View>
                        <Text className="text-gray-700 text-sm font-medium mb-2">Phone</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                            <MaterialCommunityIcons name="phone" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-900 text-base"
                                placeholder="+1 (555) 000-0000"
                                placeholderTextColor="#9ca3af"
                                keyboardType="phone-pad"
                                value={form.phone}
                                onChangeText={(value) => updateField('phone', value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Account Info */}
                <View className="bg-white mx-4 mt-4 rounded-xl p-4">
                    <Text className="text-gray-500 text-sm font-medium mb-3">
                        Account Information
                    </Text>

                    <View className="flex-row items-center py-3 border-b border-gray-100">
                        <MaterialCommunityIcons name="identifier" size={20} color="#6b7280" />
                        <View className="flex-1 ml-3">
                            <Text className="text-gray-500 text-xs">User ID</Text>
                            <Text className="text-gray-900">{user?.id || 'N/A'}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center py-3">
                        <MaterialCommunityIcons name="calendar" size={20} color="#6b7280" />
                        <View className="flex-1 ml-3">
                            <Text className="text-gray-500 text-xs">Member Since</Text>
                            <Text className="text-gray-900">
                                {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString()
                                    : 'N/A'}
                            </Text>
                        </View>
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
        </KeyboardAvoidingView>
    );
}
