import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Button, Spinner, useThemeColor } from 'heroui-native';
import * as Haptics from 'expo-haptics';

import { Container } from '@/components/container';
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
    const linkColor = useThemeColor('link');
    const foregroundColor = useThemeColor('foreground');
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

    const QuickPrompt = ({ text }: { text: string }) => (
        <Pressable
            onPress={() => setInput(text)}
            className="bg-gray-100 px-3 py-2 rounded-full mr-2 mb-2"
        >
            <Text className="text-muted text-sm">{text}</Text>
        </Pressable>
    );

    return (
        <Container>
            <Stack.Screen
                options={{
                    title: 'Tatenda AI',
                    headerStyle: { backgroundColor: '#eab308' },
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={90}
            >
                {/* Messages */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 p-4"
                    contentContainerStyle={{ paddingBottom: 20 }}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                            <View
                                className={`max-w-[85%] p-4 rounded-2xl ${message.role === 'user'
                                    ? 'bg-warning rounded-br-md'
                                    : 'bg-gray-100 rounded-bl-md'
                                    }`}
                            >
                                <Text
                                    className={message.role === 'user' ? 'text-white' : 'text-foreground'}
                                    style={{ lineHeight: 22 }}
                                >
                                    {message.content}
                                </Text>
                            </View>
                            <Text className="text-muted text-xs mt-1 mx-1">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    ))}

                    {isLoading && (
                        <View className="items-start mb-4">
                            <View className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                                <View className="flex-row items-center">
                                    <Spinner size="sm" />
                                    <Text className="text-muted ml-2">Thinking...</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Prompts */}
                {messages.length === 1 && (
                    <View className="px-4 pb-2">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <QuickPrompt text="How are my sales today?" />
                            <QuickPrompt text="What's my best selling product?" />
                            <QuickPrompt text="Show me low stock items" />
                            <QuickPrompt text="Customer insights" />
                        </ScrollView>
                    </View>
                )}

                {/* Input Area */}
                <Surface variant="secondary" className="p-4 border-t border-gray-200">
                    <View className="flex-row items-end">
                        <TextInput
                            className="flex-1 mr-3 bg-gray-100 rounded-xl px-4 py-3"
                            style={{ color: foregroundColor, maxHeight: 100 }}
                            placeholder="Ask Tatenda anything..."
                            placeholderTextColor="#9ca3af"
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={500}
                            onSubmitEditing={sendMessage}
                        />
                        <Button
                            variant="primary"
                            onPress={sendMessage}
                            isDisabled={!input.trim() || isLoading}
                            className="w-12 h-12 rounded-full"
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={20}
                                color="white"
                            />
                        </Button>
                    </View>
                </Surface>
            </KeyboardAvoidingView>
        </Container>
    );
}
