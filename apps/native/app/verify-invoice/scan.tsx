// Verify Invoice - QR Code Scanner
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/lib/api';

export default function ScanQRScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || isVerifying) return;

        setScanned(true);
        setIsVerifying(true);

        try {
            // Extract invoice ID from QR code data
            // QR code could be just the ID or a URL containing the ID
            let invoiceId = data.trim().toUpperCase();
            
            // If it's a URL, extract the ID from it
            if (invoiceId.includes('/')) {
                const parts = invoiceId.split('/');
                invoiceId = parts[parts.length - 1];
            }

            // Validate ID length
            if (invoiceId.length !== 8) {
                router.replace({
                    pathname: '/verify-invoice/result',
                    params: {
                        success: 'false',
                        error: 'Invalid QR code. The invoice ID must be 8 characters.',
                    },
                });
                return;
            }

            const res = await api.get(`/api/transactions/verify/${invoiceId}`);

            if (res.data?.success) {
                router.replace({
                    pathname: '/verify-invoice/result',
                    params: {
                        success: 'true',
                        invoice: JSON.stringify(res.data.invoice),
                    },
                });
            } else {
                router.replace({
                    pathname: '/verify-invoice/result',
                    params: {
                        success: 'false',
                        error: res.data?.error || 'Invoice not found',
                    },
                });
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.error || err?.message || 'Failed to verify invoice';
            router.replace({
                pathname: '/verify-invoice/result',
                params: {
                    success: 'false',
                    error: errorMessage,
                },
            });
        }
    };

    if (!permission) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="white" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        title: 'Scan QR Code',
                        headerStyle: { backgroundColor: '#000' },
                        headerTintColor: '#fff',
                    }}
                />
                <View className="flex-1 items-center justify-center bg-black px-6">
                    <MaterialCommunityIcons name="camera-off" size={64} color="#6b7280" />
                    <Text className="text-white text-xl font-semibold mt-6 text-center">
                        Camera Permission Required
                    </Text>
                    <Text className="text-gray-400 text-center mt-3 mb-6">
                        We need camera access to scan QR codes on invoices.
                    </Text>
                    <Pressable
                        onPress={requestPermission}
                        className="bg-green-500 px-8 py-4 rounded-xl active:bg-green-600"
                    >
                        <Text className="text-white font-semibold text-lg">
                            Grant Camera Access
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => router.back()}
                        className="mt-4 py-3"
                    >
                        <Text className="text-gray-400 font-medium">
                            Enter ID Manually Instead
                        </Text>
                    </Pressable>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Scan QR Code',
                    headerTransparent: true,
                    headerTintColor: '#fff',
                }}
            />
            <View className="flex-1 bg-black">
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* Overlay */}
                <View className="flex-1 items-center justify-center">
                    {/* Top Overlay */}
                    <View className="absolute top-0 left-0 right-0 h-40 bg-black/60" />
                    
                    {/* Scanner Frame */}
                    <View className="w-64 h-64 border-2 border-white rounded-3xl overflow-hidden">
                        {/* Corner indicators */}
                        <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl" />
                        <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl" />
                        <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl" />
                        <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl" />
                    </View>

                    {/* Bottom Overlay */}
                    <View className="absolute bottom-0 left-0 right-0 h-48 bg-black/60 px-6 pt-8">
                        {isVerifying ? (
                            <View className="items-center">
                                <ActivityIndicator size="large" color="#22c55e" />
                                <Text className="text-white text-lg mt-4">Verifying invoice...</Text>
                            </View>
                        ) : (
                            <View className="items-center">
                                <Text className="text-white text-lg font-medium text-center">
                                    Position the QR code within the frame
                                </Text>
                                <Text className="text-gray-400 text-center mt-2">
                                    The scanner will automatically detect the code
                                </Text>
                                
                                <Pressable
                                    onPress={() => router.back()}
                                    className="mt-6 bg-white/20 px-6 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-medium">
                                        Enter ID Manually
                                    </Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </>
    );
}
