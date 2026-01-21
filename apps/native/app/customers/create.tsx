import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Button, Spinner, useThemeColor } from 'heroui-native';
import * as Haptics from 'expo-haptics';

import { Container } from '@/components/container';
import { useAuthStore } from '@/store/auth';
import { customersApi } from '@/lib/api';

export default function CreateCustomer() {
    const { currentBusiness } = useAuthStore();
    const router = useRouter();
    const foregroundColor = useThemeColor('foreground');
    const [isSubmitting, setIsSubmitting] = useState(false);
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

        if (!currentBusiness?.id) {
            Alert.alert('Error', 'No business selected');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await customersApi.create({
                businessId: currentBusiness.id,
                name: form.name.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                address: form.address.trim() || null,
                city: form.city.trim() || null,
                notes: form.notes.trim() || null,
            });

            if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Customer created successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', res.error || 'Failed to create customer');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create customer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container>
            <Stack.Screen options={{ title: 'Add Customer' }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 p-4"
                    keyboardShouldPersistTaps="handled"
                >
                    <Surface variant="secondary" className="p-4 rounded-xl">
                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Name *</Text>
                            <TextInput
                                placeholder="Customer name"
                                placeholderTextColor="#9ca3af"
                                value={form.name}
                                onChangeText={(v: string) => updateField('name', v)}
                                autoCapitalize="words"
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Email</Text>
                            <TextInput
                                placeholder="customer@example.com"
                                placeholderTextColor="#9ca3af"
                                value={form.email}
                                onChangeText={(v: string) => updateField('email', v)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Phone</Text>
                            <TextInput
                                placeholder="+1234567890"
                                placeholderTextColor="#9ca3af"
                                value={form.phone}
                                onChangeText={(v: string) => updateField('phone', v)}
                                keyboardType="phone-pad"
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Address</Text>
                            <TextInput
                                placeholder="Street address"
                                placeholderTextColor="#9ca3af"
                                value={form.address}
                                onChangeText={(v: string) => updateField('address', v)}
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">City</Text>
                            <TextInput
                                placeholder="City"
                                placeholderTextColor="#9ca3af"
                                value={form.city}
                                onChangeText={(v: string) => updateField('city', v)}
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Notes</Text>
                            <TextInput
                                placeholder="Additional notes..."
                                placeholderTextColor="#9ca3af"
                                value={form.notes}
                                onChangeText={(v: string) => updateField('notes', v)}
                                multiline
                                numberOfLines={3}
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor, minHeight: 80 }}
                            />
                        </View>
                    </Surface>

                    <Button
                        variant="primary"
                        onPress={handleSubmit}
                        isDisabled={isSubmitting || !form.name.trim()}
                        className="mt-6 mb-8"
                    >
                        {isSubmitting ? (
                            <Spinner size="sm" color="white" />
                        ) : (
                            <Button.Label>Create Customer</Button.Label>
                        )}
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </Container>
    );
}
