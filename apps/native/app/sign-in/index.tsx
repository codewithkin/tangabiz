import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, CVT_URLS } from '@/store/auth';

export default function SignIn() {
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const { signIn, isLoading, error, clearError } = useAuthStore();
    const router = useRouter();

    const handleSignIn = async () => {
        if (!apiKey.trim()) return;

        const result = await signIn(apiKey.trim());

        if (result.success) {
            router.replace('/(tabs)');
        } else if (result.needsSubscription) {
            Linking.openURL(CVT_URLS.dashboard);
        } else if (result.needsPayment) {
            Linking.openURL(CVT_URLS.billing);
        }
    };

    const handleSignUp = () => {
        Linking.openURL(CVT_URLS.signUp);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className='h-full'>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                        keyboardShouldPersistTaps="handled"
                        className="px-6 py-8"
                    >
                        {/* Header */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-green-500 rounded-2xl items-center justify-center mb-4 shadow-lg">
                                <MaterialCommunityIcons name="store-outline" size={48} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-gray-900 mt-4">Tangabiz</Text>
                            <Text className="text-gray-500 text-center mt-2">
                                Point of Sale Management System
                            </Text>
                        </View>

                        {/* Form Section */}
                        <View className="mt-8">
                            <Text className="text-2xl font-bold text-gray-900 mb-2">Sign In</Text>
                            <Text className="text-gray-600 mb-6">
                                Enter your CVT API key to get started
                            </Text>

                            {/* API Key Input */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-medium mb-2">CVT API Key</Text>
                                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                    <View className="pl-4">
                                        <MaterialCommunityIcons name="key-variant" size={20} color="#9ca3af" />
                                    </View>
                                    <TextInput
                                        className="flex-1 px-3 py-4 text-gray-900"
                                        placeholder="Enter your API key"
                                        placeholderTextColor="#9ca3af"
                                        value={apiKey}
                                        onChangeText={(text) => {
                                            setApiKey(text);
                                            if (error) clearError();
                                        }}
                                        secureTextEntry={!showApiKey}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <Pressable
                                        onPress={() => setShowApiKey(!showApiKey)}
                                        className="px-4 py-4"
                                    >
                                        <MaterialCommunityIcons
                                            name={showApiKey ? 'eye-off' : 'eye'}
                                            size={22}
                                            color="#6b7280"
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Error Message */}
                            {error && (
                                <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex-row items-start">
                                    <MaterialCommunityIcons name="alert-circle" size={20} color="#dc2626" />
                                    <Text className="text-red-700 text-sm ml-2 flex-1">{error}</Text>
                                </View>
                            )}

                            {/* Sign In Button */}
                            <Pressable
                                onPress={handleSignIn}
                                disabled={isLoading || !apiKey.trim()}
                                className={`py-4 rounded-xl items-center justify-center flex-row ${isLoading || !apiKey.trim()
                                    ? 'bg-gray-300'
                                    : 'bg-green-500 active:bg-green-600'
                                    }`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="login" size={20} color="white" />
                                        <Text className="text-white font-semibold text-base ml-2">Sign In</Text>
                                    </>
                                )}
                            </Pressable>

                            {/* Divider */}
                            <View className="flex-row items-center my-8">
                                <View className="flex-1 h-px bg-gray-200" />
                                <Text className="text-gray-400 mx-4 text-sm">OR</Text>
                                <View className="flex-1 h-px bg-gray-200" />
                            </View>

                            {/* Create Account Button */}
                            <Pressable
                                onPress={handleSignUp}
                                className="py-4 rounded-xl items-center justify-center border-2 border-green-500 active:bg-green-50"
                            >
                                <Text className="text-green-600 font-semibold text-base">Create CVT Account</Text>
                            </Pressable>
                        </View>

                        {/* Help Text */}
                        <View className="mt-8 items-center">
                            <Text className="text-gray-500 text-sm text-center">
                                Need help?{' '}
                            </Text>
                            <Pressable onPress={() => Linking.openURL(CVT_URLS.dashboard)}>
                                <Text className="text-green-600 text-sm font-medium mt-1">
                                    Get your API key from CVT Dashboard
                                </Text>
                            </Pressable>
                        </View>

                        {/* Footer */}
                        <View className="mt-12 items-center">
                            <Text className="text-gray-400 text-xs">
                                Powered by CVT • v1.0.0
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}
