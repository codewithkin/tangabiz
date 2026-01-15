// Sign Up screen - redirects to CVT website
import React from 'react';
import { View, Text, Pressable, Linking, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CVT_SIGNUP_URL = 'https://cvt.co.zw/sign-up';

export default function SignUpScreen() {
    const handleOpenSignUp = async () => {
        try {
            await Linking.openURL(CVT_SIGNUP_URL);
        } catch (error) {
            console.error('Failed to open URL:', error);
        }
    };

    const features = [
        {
            icon: 'key-variant' as const,
            title: 'Get Your API Key',
            description: 'Create an account to receive your unique API key',
        },
        {
            icon: 'shield-check' as const,
            title: 'Secure Authentication',
            description: 'Your data is protected with enterprise-grade security',
        },
        {
            icon: 'rocket-launch' as const,
            title: 'Instant Access',
            description: 'Start managing your business immediately after sign up',
        },
    ];

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="flex-1 px-6 pt-16 pb-8">
                {/* Header */}
                <View className="items-center mb-8">
                    <View className="w-24 h-24 bg-yellow-100 rounded-full items-center justify-center mb-4">
                        <MaterialCommunityIcons
                            name="account-plus"
                            size={48}
                            color="#eab308"
                        />
                    </View>
                    <Text className="text-3xl font-bold text-gray-900 text-center">
                        Create Your Account
                    </Text>
                    <Text className="text-gray-500 text-center mt-2 text-base">
                        Sign up through Christus Veritas Technologies
                    </Text>
                </View>

                {/* Features */}
                <View className="mb-8">
                    {features.map((feature, index) => (
                        <View
                            key={index}
                            className="flex-row items-start bg-gray-50 rounded-xl p-4 mb-3"
                        >
                            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                                <MaterialCommunityIcons
                                    name={feature.icon}
                                    size={24}
                                    color="#22c55e"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-semibold text-gray-900">
                                    {feature.title}
                                </Text>
                                <Text className="text-gray-500 mt-1">
                                    {feature.description}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Sign Up Button */}
                <Pressable
                    onPress={handleOpenSignUp}
                    className="w-full bg-yellow-500 py-4 rounded-xl mb-4 flex-row items-center justify-center active:bg-yellow-600"
                >
                    <MaterialCommunityIcons
                        name="open-in-new"
                        size={20}
                        color="#000"
                    />
                    <Text className="text-black text-lg font-semibold ml-2">
                        Sign Up on CVT Website
                    </Text>
                </Pressable>

                {/* Already have account */}
                <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">Already have an account? </Text>
                    <Pressable onPress={() => router.replace('/sign-in')}>
                        <Text className="text-green-500 font-semibold">Sign In</Text>
                    </Pressable>
                </View>

                {/* Info box */}
                <View className="bg-blue-50 rounded-xl p-4 mt-8">
                    <View className="flex-row items-start">
                        <MaterialCommunityIcons
                            name="information"
                            size={24}
                            color="#3b82f6"
                        />
                        <View className="flex-1 ml-3">
                            <Text className="text-blue-800 font-semibold">
                                How to get your API Key
                            </Text>
                            <Text className="text-blue-700 mt-1 text-sm leading-5">
                                1. Create an account on CVT{'\n'}
                                2. Subscribe to the Ultimate Service{'\n'}
                                3. Go to Dashboard → API Keys{'\n'}
                                4. Copy your API key and use it to sign in
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
