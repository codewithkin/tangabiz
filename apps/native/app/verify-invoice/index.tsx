// Verify Invoice Screen - Entry point for invoice verification
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function VerifyInvoiceScreen() {
    const [invoiceId, setInvoiceId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        const trimmedId = invoiceId.trim().toUpperCase();

        if (trimmedId.length !== 8) {
            setError('Invoice ID must be exactly 8 characters');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await api.get(`/api/transactions/verify/${trimmedId}`);

            if (res.data?.success) {
                router.push({
                    pathname: '/verify-invoice/result',
                    params: {
                        success: 'true',
                        invoice: JSON.stringify(res.data.invoice),
                    },
                });
            } else {
                router.push({
                    pathname: '/verify-invoice/result',
                    params: {
                        success: 'false',
                        error: res.data?.error || 'Invoice not found',
                    },
                });
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to verify invoice';
            router.push({
                pathname: '/verify-invoice/result',
                params: {
                    success: 'false',
                    error: errorMessage,
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanQR = () => {
        router.push('/verify-invoice/scan');
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Verify Invoice',
                    headerTitleStyle: { fontWeight: '600' },
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 bg-gray-50"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="flex-1 px-6 py-8">
                        {/* Header */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
                                <MaterialCommunityIcons name="file-document-check-outline" size={40} color="#22c55e" />
                            </View>
                            <Text className="text-2xl font-bold text-gray-900 text-center">
                                Verify Invoice
                            </Text>
                            <Text className="text-gray-500 text-center mt-2">
                                Scan a QR code or enter the invoice ID to verify an invoice
                            </Text>
                        </View>

                        {/* QR Scan Button */}
                        <Pressable
                            onPress={handleScanQR}
                            className="bg-green-500 rounded-2xl p-6 mb-6 flex-row items-center justify-center active:bg-green-600"
                        >
                            <MaterialCommunityIcons name="qrcode-scan" size={28} color="white" />
                            <Text className="text-white text-lg font-semibold ml-3">
                                Scan QR Code
                            </Text>
                        </Pressable>

                        {/* Divider */}
                        <View className="flex-row items-center mb-6">
                            <View className="flex-1 h-px bg-gray-300" />
                            <Text className="mx-4 text-gray-500 font-medium">OR</Text>
                            <View className="flex-1 h-px bg-gray-300" />
                        </View>

                        {/* Manual Entry */}
                        <View className="mb-6">
                            <Text className="text-gray-700 font-medium mb-2">
                                Enter Invoice ID
                            </Text>
                            <TextInput
                                value={invoiceId}
                                onChangeText={(text) => {
                                    setInvoiceId(text.toUpperCase());
                                    setError(null);
                                }}
                                placeholder="e.g. ABC12345"
                                placeholderTextColor="#9ca3af"
                                maxLength={8}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                className="bg-white border border-gray-300 rounded-xl px-4 py-4 text-lg font-mono text-center tracking-widest"
                            />
                            <Text className="text-gray-400 text-sm text-center mt-2">
                                8-character alphanumeric code
                            </Text>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                                <Text className="text-red-600 text-center">{error}</Text>
                            </View>
                        )}

                        {/* Verify Button */}
                        <Pressable
                            onPress={handleVerify}
                            disabled={isLoading || invoiceId.length === 0}
                            className={`rounded-xl p-4 flex-row items-center justify-center ${invoiceId.length === 0 || isLoading
                                    ? 'bg-gray-300'
                                    : 'bg-gray-900 active:bg-gray-800'
                                }`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                                    <Text className="text-white text-lg font-semibold ml-2">
                                        Verify Invoice
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        {/* Info Section */}
                        <View className="mt-8 bg-blue-50 rounded-xl p-4">
                            <View className="flex-row items-start">
                                <MaterialCommunityIcons name="information" size={20} color="#3b82f6" />
                                <View className="flex-1 ml-3">
                                    <Text className="text-blue-800 font-medium">How it works</Text>
                                    <Text className="text-blue-600 text-sm mt-1">
                                        Each invoice has a unique 8-character ID printed on it.
                                        Enter this ID or scan the QR code to verify the invoice is authentic.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}
