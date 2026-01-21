import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/store/auth';
import { aiApi } from '@/lib/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIChat() {
    const { currentBusiness } = useAuthStore();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm Tatenda, your AI business assistant. 🌿\n\nI can help you with:\n• Sales summaries and trends\n• Inventory insights\n• Customer analytics\n• Business recommendations\n\nWhat would you like to know?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | undefined>();

    const sendMessage = async () => {
        if (!input.trim() || isLoading || !currentBusiness?.id) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const res = await aiApi.chat(userMessage.content, currentBusiness.id, threadId);

            if (res.success && res.data) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: res.data.response || res.data.content || "I'm sorry, I couldn't process that request.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);

                if (res.data.threadId) {
                    setThreadId(res.data.threadId);
                }
            } else {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "I'm having trouble connecting right now. Please try again in a moment.",
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Something went wrong. Please check your connection and try again.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const QuickPrompt = ({ text, icon }: { text: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) => (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInput(text);
            }}
            className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl mr-2 flex-row items-center"
        >
            <MaterialCommunityIcons name={icon} size={16} color="#eab308" />
            <Text className="text-gray-700 text-sm ml-2">{text}</Text>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="bg-yellow-500 px-4 py-4">
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3"
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                    </Pressable>
                    <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                        <MaterialCommunityIcons name="robot-happy-outline" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg">Tatenda AI</Text>
                        <Text className="text-yellow-100 text-sm">Your business assistant</Text>
                    </View>
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setMessages([{
                                id: '1',
                                role: 'assistant',
                                content: "Hi! I'm Tatenda, your AI business assistant. 🌿\n\nI can help you with:\n• Sales summaries and trends\n• Inventory insights\n• Customer analytics\n• Business recommendations\n\nWhat would you like to know?",
                                timestamp: new Date(),
                            }]);
                            setThreadId(undefined);
                        }}
                        className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                    >
                        <MaterialCommunityIcons name="refresh" size={22} color="white" />
                    </Pressable>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={0}
            >
                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 px-4 pt-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <View className="flex-row items-center mb-1.5">
                                    <View className="w-6 h-6 bg-yellow-100 rounded-full items-center justify-center mr-2">
                                        <MaterialCommunityIcons name="robot" size={14} color="#eab308" />
                                    </View>
                                    <Text className="text-gray-500 text-xs font-medium">Tatenda</Text>
                                </View>
                            )}
                            <View
                                className={`max-w-[85%] p-4 ${message.role === 'user'
                                        ? 'bg-yellow-500 rounded-2xl rounded-br-md'
                                        : 'bg-white rounded-2xl rounded-tl-md shadow-sm border border-gray-100'
                                    }`}
                            >
                                <Text
                                    className={message.role === 'user' ? 'text-white' : 'text-gray-800'}
                                    style={{ lineHeight: 22 }}
                                >
                                    {message.content}
                                </Text>
                            </View>
                            <Text className="text-gray-400 text-xs mt-1.5 mx-1">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    ))}

                    {isLoading && (
                        <View className="items-start mb-4">
                            <View className="flex-row items-center mb-1.5">
                                <View className="w-6 h-6 bg-yellow-100 rounded-full items-center justify-center mr-2">
                                    <MaterialCommunityIcons name="robot" size={14} color="#eab308" />
                                </View>
                                <Text className="text-gray-500 text-xs font-medium">Tatenda</Text>
                            </View>
                            <View className="bg-white p-4 rounded-2xl rounded-tl-md shadow-sm border border-gray-100">
                                <View className="flex-row items-center">
                                    <ActivityIndicator size="small" color="#eab308" />
                                    <Text className="text-gray-500 ml-2">Thinking...</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Prompts */}
                {messages.length === 1 && (
                    <View className="px-4 pb-3">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <QuickPrompt text="How are my sales today?" icon="chart-line" />
                            <QuickPrompt text="Best selling product?" icon="star" />
                            <QuickPrompt text="Low stock items" icon="alert-circle-outline" />
                            <QuickPrompt text="Customer insights" icon="account-group" />
                        </ScrollView>
                    </View>
                )}

                {/* Input Area */}
                <View className="p-4 bg-white border-t border-gray-100">
                    <View className="flex-row items-end">
                        <View className="flex-1 mr-3 bg-gray-100 rounded-2xl px-4 flex-row items-end">
                            <TextInput
                                className="flex-1 py-3 text-gray-900"
                                style={{ maxHeight: 100 }}
                                placeholder="Ask Tatenda anything..."
                                placeholderTextColor="#9ca3af"
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={500}
                            />
                        </View>
                        <Pressable
                            onPress={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className={`w-12 h-12 rounded-full items-center justify-center ${input.trim() && !isLoading ? 'bg-yellow-500 active:bg-yellow-600' : 'bg-gray-200'
                                }`}
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={20}
                                color={input.trim() && !isLoading ? 'white' : '#9ca3af'}
                            />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
