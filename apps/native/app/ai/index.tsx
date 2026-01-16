// Tatenda AI Chat Screen
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useResponsive } from '@/lib/useResponsive';

// Get API URL from environment
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

export default function TatendaAIScreen() {
    const { currentBusiness, token } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const { deviceType, typography } = useResponsive();
    const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';

    // Welcome animation
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Add welcome message
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hi there! 👋 I'm Tatenda, your AI assistant for ${currentBusiness?.name || 'your business'}.\n\nI can help you with:\n• Sales and revenue insights\n• Inventory status\n• Customer analytics\n• Recent transactions\n• Product searches\n\nHow can I help you today?`,
            timestamp: new Date(),
        }]);
    }, [currentBusiness?.name]);

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const sendMessage = useCallback(async () => {
        if (!inputText.trim() || !currentBusiness || isLoading) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: inputText.trim(),
            timestamp: new Date(),
        };

        const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInputText('');
        setIsLoading(true);
        scrollToBottom();

        try {
            // Use streaming endpoint
            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    businessId: currentBusiness.id,
                    threadId: threadId || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === 'chunk') {
                                    fullContent += data.content;
                                    setMessages(prev =>
                                        prev.map(msg =>
                                            msg.id === assistantMessage.id
                                                ? { ...msg, content: fullContent }
                                                : msg
                                        )
                                    );
                                    scrollToBottom();
                                } else if (data.type === 'done') {
                                    if (data.threadId) {
                                        setThreadId(data.threadId);
                                    }
                                } else if (data.type === 'error') {
                                    setMessages(prev =>
                                        prev.map(msg =>
                                            msg.id === assistantMessage.id
                                                ? { ...msg, content: data.message, isStreaming: false }
                                                : msg
                                        )
                                    );
                                }
                            } catch (e) {
                                // Ignore parse errors for incomplete chunks
                            }
                        }
                    }
                }
            }

            // Mark streaming as complete
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessage.id
                        ? { ...msg, isStreaming: false }
                        : msg
                )
            );

        } catch (error: any) {
            console.error('Chat error:', error);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === assistantMessage.id
                        ? {
                            ...msg,
                            content: 'Sorry, I encountered an error. Please try again.',
                            isStreaming: false
                        }
                        : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [inputText, currentBusiness, token, threadId, isLoading]);

    const startNewChat = () => {
        setThreadId(null);
        setMessages([{
            id: 'welcome-new',
            role: 'assistant',
            content: `Starting a new conversation! How can I help you with ${currentBusiness?.name || 'your business'}?`,
            timestamp: new Date(),
        }]);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
                {!isUser && (
                    <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2">
                        <Text className="text-lg">🤖</Text>
                    </View>
                )}
                <View
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-green-500 rounded-br-sm'
                        : 'bg-white border border-gray-200 rounded-bl-sm'
                        }`}
                    style={isTablet ? { maxWidth: '60%' } : undefined}
                >
                    <Text className={`${typography.body} ${isUser ? 'text-white' : 'text-gray-800'}`}>
                        {item.content}
                    </Text>
                    {item.isStreaming && (
                        <View className="flex-row items-center mt-2">
                            <ActivityIndicator size="small" color="#22c55e" />
                            <Text className="text-gray-400 text-xs ml-2">Thinking...</Text>
                        </View>
                    )}
                </View>
                {isUser && (
                    <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center ml-2">
                        <MaterialCommunityIcons name="account" size={18} color="#fff" />
                    </View>
                )}
            </View>
        );
    };

    const SuggestionChip = ({ text, onPress }: { text: string; onPress: () => void }) => (
        <Pressable
            onPress={onPress}
            className="bg-green-50 border border-green-200 rounded-full px-4 py-2 mr-2 mb-2"
        >
            <Text className="text-green-700 text-sm">{text}</Text>
        </Pressable>
    );

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-50"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Header with New Chat button */}
            <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
                <View className="flex-row items-center">
                    <Text className="text-2xl mr-2">🤖</Text>
                    <View>
                        <Text className="text-lg font-bold text-gray-900">Tatenda</Text>
                        <Text className="text-xs text-gray-500">AI Business Assistant</Text>
                    </View>
                </View>
                <Pressable
                    onPress={startNewChat}
                    className="flex-row items-center bg-green-50 px-3 py-2 rounded-full"
                >
                    <MaterialCommunityIcons name="plus" size={18} color="#22c55e" />
                    <Text className="text-green-600 font-medium ml-1">New Chat</Text>
                </Pressable>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                    paddingTop: 16,
                    paddingBottom: 16,
                    ...(isTablet && { maxWidth: 800, alignSelf: 'center', width: '100%' })
                }}
                onContentSizeChange={scrollToBottom}
                ListFooterComponent={
                    messages.length === 1 ? (
                        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 16 }}>
                            <Text className="text-gray-500 text-sm mb-3">Try asking:</Text>
                            <View className="flex-row flex-wrap">
                                <SuggestionChip
                                    text="How are sales this month?"
                                    onPress={() => setInputText("How are sales this month?")}
                                />
                                <SuggestionChip
                                    text="What products are low on stock?"
                                    onPress={() => setInputText("What products are low on stock?")}
                                />
                                <SuggestionChip
                                    text="Show recent transactions"
                                    onPress={() => setInputText("Show me the 5 most recent transactions")}
                                />
                                <SuggestionChip
                                    text="Top selling products"
                                    onPress={() => setInputText("What are my top selling products?")}
                                />
                            </View>
                        </Animated.View>
                    ) : null
                }
            />

            {/* Input */}
            <View className="px-4 pb-4 pt-2 bg-white border-t border-gray-200">
                <View
                    className="flex-row items-end bg-gray-100 rounded-2xl px-4 py-2"
                    style={isTablet ? { maxWidth: 800, alignSelf: 'center', width: '100%' } : undefined}
                >
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask Tatenda anything..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        maxLength={2000}
                        className="flex-1 text-gray-900 text-base py-2 max-h-32"
                        onSubmitEditing={sendMessage}
                        editable={!isLoading}
                    />
                    <Pressable
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                        className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${inputText.trim() && !isLoading
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <MaterialCommunityIcons
                                name="send"
                                size={20}
                                color="#fff"
                            />
                        )}
                    </Pressable>
                </View>
                <Text className="text-center text-gray-400 text-xs mt-2">
                    Tatenda can make mistakes. Verify important information.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}
