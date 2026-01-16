// Verify Invoice - Result Screen
import React from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvoiceItem {
    id: string;
    productName: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}

interface Invoice {
    invoiceId: string;
    reference: string;
    type: string;
    status: string;
    paymentMethod: string;
    subtotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    change: number;
    notes?: string;
    createdAt: string;
    business: {
        id: string;
        name: string;
        logo?: string;
        currency: string;
    };
    customer?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
    };
    items: InvoiceItem[];
    createdBy: {
        id: string;
        name: string;
    };
}

export default function VerifyResultScreen() {
    const params = useLocalSearchParams<{
        success: string;
        invoice?: string;
        error?: string;
    }>();

    const isSuccess = params.success === 'true';
    const invoice: Invoice | null = params.invoice ? JSON.parse(params.invoice) : null;
    const errorMessage = params.error || 'An unknown error occurred';

    const handleCreateInvoice = () => {
        router.replace('/(tabs)/pos');
    };

    const handleGoToDashboard = () => {
        router.replace('/(tabs)');
    };

    const handleTryAgain = () => {
        router.replace('/verify-invoice');
    };

    if (!isSuccess) {
        return (
            <>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />
                <View className="flex-1 bg-red-50">
                    <View className="flex-1 items-center justify-center px-6">
                        {/* Failure Icon */}
                        <View className="w-28 h-28 bg-red-100 rounded-full items-center justify-center mb-6">
                            <MaterialCommunityIcons name="close-circle" size={64} color="#ef4444" />
                        </View>

                        <Text className="text-3xl font-bold text-red-600 text-center">
                            Verification Failed
                        </Text>
                        <Text className="text-gray-600 text-center mt-3 text-lg">
                            {errorMessage}
                        </Text>

                        {/* Warning Card */}
                        <View className="bg-white rounded-2xl p-5 mt-8 w-full shadow-sm border border-red-100">
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="alert-circle" size={24} color="#f59e0b" />
                                <Text className="text-gray-800 font-medium ml-3 flex-1">
                                    This invoice could not be verified
                                </Text>
                            </View>
                            <Text className="text-gray-500 mt-2 text-sm">
                                The invoice ID may be incorrect or the invoice may not exist in our system. 
                                Please double-check the ID and try again.
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="px-6 pb-10 pt-4">
                        <Pressable
                            onPress={handleTryAgain}
                            className="bg-gray-900 rounded-xl py-4 flex-row items-center justify-center mb-3 active:bg-gray-800"
                        >
                            <MaterialCommunityIcons name="refresh" size={22} color="white" />
                            <Text className="text-white font-semibold text-lg ml-2">
                                Try Again
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleCreateInvoice}
                            className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center mb-3 active:bg-green-600"
                        >
                            <MaterialCommunityIcons name="plus-circle" size={22} color="white" />
                            <Text className="text-white font-semibold text-lg ml-2">
                                Create New Invoice
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleGoToDashboard}
                            className="bg-white border border-gray-300 rounded-xl py-4 flex-row items-center justify-center active:bg-gray-50"
                        >
                            <MaterialCommunityIcons name="home" size={22} color="#374151" />
                            <Text className="text-gray-700 font-semibold text-lg ml-2">
                                Go to Dashboard
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </>
        );
    }

    // Success State
    const currency = invoice?.business?.currency || 'USD';

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <View className="flex-1 bg-green-50">
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
                    {/* Success Header */}
                    <View className="items-center pt-12 pb-6 px-6">
                        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="check-circle" size={56} color="#22c55e" />
                        </View>
                        <Text className="text-3xl font-bold text-green-600 text-center">
                            Invoice Verified!
                        </Text>
                        <Text className="text-gray-600 text-center mt-2">
                            This invoice is authentic and valid
                        </Text>
                    </View>

                    {/* Invoice Details Card */}
                    <View className="mx-6 bg-white rounded-2xl shadow-sm overflow-hidden">
                        {/* Invoice Header */}
                        <View className="bg-gray-900 px-5 py-4">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-gray-400 text-sm">Invoice ID</Text>
                                    <Text className="text-white font-mono text-xl font-bold">
                                        {invoice?.invoiceId}
                                    </Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${
                                    invoice?.status === 'COMPLETED' ? 'bg-green-500' :
                                    invoice?.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}>
                                    <Text className="text-white text-sm font-medium">
                                        {invoice?.status}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Business Info */}
                        <View className="px-5 py-4 border-b border-gray-100">
                            <Text className="text-gray-500 text-sm">Business</Text>
                            <Text className="text-gray-900 font-semibold text-lg">
                                {invoice?.business?.name}
                            </Text>
                        </View>

                        {/* Date & Type */}
                        <View className="flex-row border-b border-gray-100">
                            <View className="flex-1 px-5 py-4 border-r border-gray-100">
                                <Text className="text-gray-500 text-sm">Date</Text>
                                <Text className="text-gray-900 font-medium">
                                    {invoice?.createdAt ? formatDate(invoice.createdAt) : '-'}
                                </Text>
                            </View>
                            <View className="flex-1 px-5 py-4">
                                <Text className="text-gray-500 text-sm">Type</Text>
                                <Text className="text-gray-900 font-medium">
                                    {invoice?.type}
                                </Text>
                            </View>
                        </View>

                        {/* Customer */}
                        {invoice?.customer && (
                            <View className="px-5 py-4 border-b border-gray-100">
                                <Text className="text-gray-500 text-sm">Customer</Text>
                                <Text className="text-gray-900 font-medium">
                                    {invoice.customer.name}
                                </Text>
                                {invoice.customer.phone && (
                                    <Text className="text-gray-500 text-sm">
                                        {invoice.customer.phone}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Items */}
                        <View className="px-5 py-4 border-b border-gray-100">
                            <Text className="text-gray-500 text-sm mb-3">Items</Text>
                            {invoice?.items?.map((item, index) => (
                                <View key={item.id || index} className="flex-row justify-between py-2">
                                    <View className="flex-1">
                                        <Text className="text-gray-900">
                                            {item.productName}
                                        </Text>
                                        <Text className="text-gray-500 text-sm">
                                            {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-900 font-medium">
                                        {formatCurrency(item.total, currency)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Totals */}
                        <View className="px-5 py-4">
                            <View className="flex-row justify-between py-1">
                                <Text className="text-gray-500">Subtotal</Text>
                                <Text className="text-gray-900">
                                    {formatCurrency(invoice?.subtotal || 0, currency)}
                                </Text>
                            </View>
                            {(invoice?.discount || 0) > 0 && (
                                <View className="flex-row justify-between py-1">
                                    <Text className="text-gray-500">Discount</Text>
                                    <Text className="text-red-500">
                                        -{formatCurrency(invoice?.discount || 0, currency)}
                                    </Text>
                                </View>
                            )}
                            <View className="flex-row justify-between py-2 border-t border-gray-200 mt-2">
                                <Text className="text-gray-900 font-bold text-lg">Total</Text>
                                <Text className="text-green-600 font-bold text-lg">
                                    {formatCurrency(invoice?.total || 0, currency)}
                                </Text>
                            </View>
                        </View>

                        {/* Payment Info */}
                        <View className="bg-gray-50 px-5 py-4 flex-row justify-between">
                            <View>
                                <Text className="text-gray-500 text-sm">Payment Method</Text>
                                <Text className="text-gray-900 font-medium">
                                    {invoice?.paymentMethod?.replace('_', ' ')}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-gray-500 text-sm">Amount Paid</Text>
                                <Text className="text-gray-900 font-medium">
                                    {formatCurrency(invoice?.amountPaid || 0, currency)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Verified Badge */}
                    <View className="mx-6 mt-4 bg-green-100 rounded-xl p-4 flex-row items-center">
                        <MaterialCommunityIcons name="shield-check" size={24} color="#22c55e" />
                        <View className="ml-3 flex-1">
                            <Text className="text-green-800 font-semibold">Verified & Authentic</Text>
                            <Text className="text-green-600 text-sm">
                                This invoice was created by {invoice?.createdBy?.name || 'an authorized user'}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Action Buttons */}
                <View className="px-6 pb-10 pt-4 bg-white border-t border-gray-200">
                    <Pressable
                        onPress={handleCreateInvoice}
                        className="bg-green-500 rounded-xl py-4 flex-row items-center justify-center mb-3 active:bg-green-600"
                    >
                        <MaterialCommunityIcons name="plus-circle" size={22} color="white" />
                        <Text className="text-white font-semibold text-lg ml-2">
                            Create New Invoice
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleGoToDashboard}
                        className="bg-gray-900 rounded-xl py-4 flex-row items-center justify-center active:bg-gray-800"
                    >
                        <MaterialCommunityIcons name="home" size={22} color="white" />
                        <Text className="text-white font-semibold text-lg ml-2">
                            Go to Dashboard
                        </Text>
                    </Pressable>
                </View>
            </View>
        </>
    );
}
