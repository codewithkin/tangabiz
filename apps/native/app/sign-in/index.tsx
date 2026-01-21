import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Surface, Spinner, useThemeColor } from 'heroui-native';
import { useAuthStore, CVT_URLS } from '@/store/auth';
import { Container } from '@/components/container';

export default function SignIn() {
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const { signIn, isLoading, error, clearError } = useAuthStore();
    const router = useRouter();
    const foregroundColor = useThemeColor('foreground');

    const handleSignIn = async () => {
        if (!apiKey.trim()) return;

        const result = await signIn(apiKey.trim());

        if (result.success) {
            router.replace('/(tabs)');
        } else if (result.needsSubscription) {
            // Redirect to CVT to subscribe
            Linking.openURL(CVT_URLS.dashboard);
        } else if (result.needsPayment) {
            // Redirect to CVT billing
            Linking.openURL(CVT_URLS.billing);
        }
    };

    const handleSignUp = () => {
        Linking.openURL(CVT_URLS.signUp);
    };

    return (
        <Container>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Header */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center mb-4">
                            <MaterialCommunityIcons name="store" size={40} color="white" />
                        </View>
                        <Text className="text-3xl font-bold text-foreground">Tangabiz</Text>
                        <Text className="text-muted text-center mt-2">
                            Sign in with your CVT API Key
                        </Text>
                    </View>

                    {/* Sign In Form */}
                    <Surface variant="secondary" className="p-6 rounded-2xl">
                        <View className="mb-4">
                            <Text className="text-foreground font-medium mb-2">CVT API Key</Text>
                            <View className="flex-row items-center">
                                <TextInput
                                    className="flex-1 bg-background-secondary border border-gray-300 rounded-lg px-4 py-3"
                                    style={{ color: foregroundColor }}
                                    placeholder="Enter your API key"
                                    placeholderTextColor="#9ca3af"
                                    value={apiKey}
                                    onChangeText={(text: string) => {
                                        setApiKey(text);
                                        if (error) clearError();
                                    }}
                                    secureTextEntry={!showApiKey}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <Pressable
                                    onPress={() => setShowApiKey(!showApiKey)}
                                    className="ml-2 p-2"
                                >
                                    <MaterialCommunityIcons
                                        name={showApiKey ? 'eye-off' : 'eye'}
                                        size={24}
                                        color="#6b7280"
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {error && (
                            <Surface variant="tertiary" className="p-3 rounded-lg mb-4 bg-red-50">
                                <Text className="text-red-600 text-sm">{error}</Text>
                            </Surface>
                        )}

                        <Button
                            variant="primary"
                            onPress={handleSignIn}
                            isDisabled={isLoading || !apiKey.trim()}
                            className="w-full"
                        >
                            {isLoading ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <Button.Label>Sign In</Button.Label>
                            )}
                        </Button>

                        <View className="flex-row items-center my-6">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="text-muted mx-4">OR</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        <Button
                            variant="secondary"
                            onPress={handleSignUp}
                            className="w-full"
                        >
                            <Button.Label>Create CVT Account</Button.Label>
                        </Button>
                    </Surface>

                    {/* Help Text */}
                    <View className="mt-8 items-center">
                        <Text className="text-muted text-sm text-center">
                            Don't have an API key?{' '}
                        </Text>
                        <Pressable onPress={() => Linking.openURL(CVT_URLS.dashboard)}>
                            <Text className="text-primary text-sm font-medium">
                                Get one from your CVT Dashboard
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Container>
    );
}
