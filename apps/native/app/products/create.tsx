import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Button, Spinner, useThemeColor } from 'heroui-native';
import * as Haptics from 'expo-haptics';

import { Container } from '@/components/container';
import { useAuthStore } from '@/store/auth';
import { productsApi } from '@/lib/api';

export default function CreateProduct() {
    const { currentBusiness } = useAuthStore();
    const router = useRouter();
    const foregroundColor = useThemeColor('foreground');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        price: '',
        costPrice: '',
        quantity: '',
        minQuantity: '',
        unit: 'piece',
    });

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Product name is required');
            return;
        }

        if (!form.price || parseFloat(form.price) <= 0) {
            Alert.alert('Error', 'Valid price is required');
            return;
        }

        if (!currentBusiness?.id) {
            Alert.alert('Error', 'No business selected');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await productsApi.create({
                businessId: currentBusiness.id,
                name: form.name.trim(),
                slug: generateSlug(form.name),
                sku: form.sku.trim() || undefined,
                barcode: form.barcode.trim() || undefined,
                description: form.description.trim() || undefined,
                price: parseFloat(form.price),
                costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
                quantity: parseInt(form.quantity) || 0,
                minQuantity: parseInt(form.minQuantity) || 0,
                unit: form.unit || 'piece',
                isActive: true,
            });

            if (res.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Success', 'Product created successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', res.error || 'Failed to create product');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container>
            <Stack.Screen options={{ title: 'Add Product' }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 p-4"
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Basic Info */}
                    <Surface variant="secondary" className="p-4 rounded-xl mb-4">
                        <Text className="text-lg font-semibold text-foreground mb-4">Basic Information</Text>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Product Name *</Text>
                            <TextInput
                                placeholder="e.g., iPhone 15 Pro"
                                placeholderTextColor="#9ca3af"
                                value={form.name}
                                onChangeText={(v: string) => updateField('name', v)}
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">Description</Text>
                            <TextInput
                                placeholder="Product description..."
                                placeholderTextColor="#9ca3af"
                                value={form.description}
                                onChangeText={(v: string) => updateField('description', v)}
                                multiline
                                numberOfLines={3}
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor, minHeight: 80 }}
                            />
                        </View>

                        <View className="flex-row space-x-4">
                            <View className="flex-1">
                                <Text className="text-foreground font-medium mb-2">SKU</Text>
                                <TextInput
                                    placeholder="SKU-001"
                                    placeholderTextColor="#9ca3af"
                                    value={form.sku}
                                    onChangeText={(v: string) => updateField('sku', v)}
                                    autoCapitalize="characters"
                                    className="bg-gray-100 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-medium mb-2">Barcode</Text>
                                <TextInput
                                    placeholder="1234567890"
                                    placeholderTextColor="#9ca3af"
                                    value={form.barcode}
                                    onChangeText={(v: string) => updateField('barcode', v)}
                                    keyboardType="numeric"
                                    className="bg-gray-100 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                />
                            </View>
                        </View>
                    </Surface>

                    {/* Pricing */}
                    <Surface variant="secondary" className="p-4 rounded-xl mb-4">
                        <Text className="text-lg font-semibold text-foreground mb-4">Pricing</Text>

                        <View className="flex-row space-x-4">
                            <View className="flex-1">
                                <Text className="text-foreground font-medium mb-2">Selling Price *</Text>
                                <TextInput
                                    placeholder="0.00"
                                    placeholderTextColor="#9ca3af"
                                    value={form.price}
                                    onChangeText={(v: string) => updateField('price', v)}
                                    keyboardType="decimal-pad"
                                    className="bg-gray-100 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-medium mb-2">Cost Price</Text>
                                <TextInput
                                    placeholder="0.00"
                                    placeholderTextColor="#9ca3af"
                                    value={form.costPrice}
                                    onChangeText={(v: string) => updateField('costPrice', v)}
                                    keyboardType="decimal-pad"
                                    className="bg-gray-100 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                />
                            </View>
                        </View>
                    </Surface>

                    {/* Inventory */}
                    <Surface variant="secondary" className="p-4 rounded-xl mb-4">
                        <Text className="text-lg font-semibold text-foreground mb-4">Inventory</Text>

                        <View className="flex-row space-x-4 mb-4">
                            <View className="flex-1">
                                <Text className="text-foreground font-medium mb-2">Quantity</Text>
                                <TextInput
                                    placeholder="0"
                                    placeholderTextColor="#9ca3af"
                                    value={form.quantity}
                                    onChangeText={(v: string) => updateField('quantity', v)}
                                    keyboardType="numeric"
                                    className="bg-gray-100 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-medium mb-2">Min. Stock Alert</Text>
                                <TextInput
                                    placeholder="0"
                                    placeholderTextColor="#9ca3af"
                                    value={form.minQuantity}
                                    onChangeText={(v: string) => updateField('minQuantity', v)}
                                    keyboardType="numeric"
                                    className="bg-gray-100 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-foreground font-medium mb-2">Unit</Text>
                            <TextInput
                                placeholder="piece, kg, liter, etc."
                                placeholderTextColor="#9ca3af"
                                value={form.unit}
                                onChangeText={(v: string) => updateField('unit', v)}
                                className="bg-gray-100 rounded-lg px-4 py-3"
                                style={{ color: foregroundColor }}
                            />
                        </View>
                    </Surface>

                    <Button
                        variant="primary"
                        onPress={handleSubmit}
                        isDisabled={isSubmitting || !form.name.trim() || !form.price}
                        className="mt-2 mb-8"
                    >
                        {isSubmitting ? (
                            <Spinner size="sm" color="white" />
                        ) : (
                            <Button.Label>Create Product</Button.Label>
                        )}
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </Container>
    );
}
