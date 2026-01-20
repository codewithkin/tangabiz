import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking, KeyboardAvoidingView, Platform, ScrollView, Animated, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuthStore, CVT_URLS } from '@/store/auth';

export default function SignIn() {
    const [apiKey, setApiKey] = useState('');
    const { signIn, isLoading, error, clearError } = useAuthStore();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
    const inputScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(logoScaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleInputFocus = () => {
        Animated.spring(inputScaleAnim, {
            toValue: 1.02,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const handleInputBlur = () => {
        Animated.spring(inputScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 5,
            useNativeDriver: true,
        }).start();
    };

    const handleSignIn = async () => {
        if (!apiKey.trim()) {
            return;
        }

        const result = await signIn(apiKey.trim());

        if (result.success) {
            router.replace('/');
        }
    };

    const openSignUp = () => {
        Linking.openURL(CVT_URLS.signUp);
    };

    const openBilling = () => {
        Linking.openURL(CVT_URLS.billing);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <Stack.Screen
                options={{
                    title: 'Sign In',
                    headerShown: false,
                }}
            />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="flex-1 bg-primary-500">
                    {/* Header Section */}
                    <Animated.View
                        className="flex-1 justify-center items-center px-6 pt-16 pb-8"
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        }}
                    >
                        <Animated.View
                            className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg"
                            style={{
                                transform: [{ scale: logoScaleAnim }],
                            }}
                        >
                            <Text className="text-4xl">🌿</Text>
                        </Animated.View>
                        <Text className="text-4xl font-bold text-white mb-2">Tangabiz</Text>
                        <Text className="text-lg text-primary-100 text-center">
                            All-in-one Business Management
                        </Text>
                    </Animated.View>

                    {/* Form Section */}
                    <Animated.View
                        className="bg-white rounded-t-3xl px-6 py-8 min-h-[400px]"
                        style={{
                            opacity: fadeAnim,
                        }}
                    >
                        <Text className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome Back
                        </Text>
                        <Text className="text-gray-600 mb-6">
                            Enter your Christus Veritas Technologies API key to continue
                        </Text>

                        {/* Error Message */}
                        {error && (
                            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                <Text className="text-red-700">{error}</Text>
                                {error.includes('payment') && (
                                    <TouchableOpacity onPress={openBilling} className="mt-2">
                                        <Text className="text-red-700 font-semibold underline">
                                            Update Payment →
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {error.includes('subscribe') && (
                                    <TouchableOpacity onPress={openSignUp} className="mt-2">
                                        <Text className="text-red-700 font-semibold underline">
                                            Subscribe to Tangabiz →
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* API Key Input */}
                        <Animated.View
                            className="mb-4"
                            style={{
                                transform: [{ scale: inputScaleAnim }],
                            }}
                        >
                            <Text className="text-sm font-medium text-gray-700 mb-2">
                                API Key
                            </Text>
                            <TextInput
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 text-base"
                                placeholder="cvt_your_api_key_here"
                                placeholderTextColor="#9ca3af"
                                value={apiKey}
                                onChangeText={(text) => {
                                    setApiKey(text);
                                    if (error) clearError();
                                }}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                autoCapitalize="none"
                                autoCorrect={false}
                                secureTextEntry
                                editable={!isLoading}
                            />
                            <Text className="text-xs text-gray-500 mt-2">
                                Find your API key in your CVT dashboard under API Keys
                            </Text>
                        </Animated.View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            className={`rounded-xl py-4 items-center mb-4 ${isLoading || !apiKey.trim()
                                ? 'bg-primary-300'
                                : 'bg-primary-500 active:bg-primary-600'
                                }`}
                            onPress={handleSignIn}
                            disabled={isLoading || !apiKey.trim()}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-white font-semibold text-lg">
                                    Sign In
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="px-4 text-gray-500 text-sm">or</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        {/* Sign Up Link */}
                        <View className="items-center">
                            <Text className="text-gray-600 mb-2">
                                Don't have an account?
                            </Text>
                            <TouchableOpacity onPress={openSignUp}>
                                <Text className="text-primary-600 font-semibold text-lg">
                                    Sign up at Christus Veritas →
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="mt-8 items-center">
                            <Text className="text-xs text-gray-400 text-center">
                                Tangabiz is a service provided by{'\n'}
                                <Text className="font-medium">Christus Veritas Technologies</Text>
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}