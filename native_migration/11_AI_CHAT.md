# Tatenda AI Chat

## Overview

AI-powered business assistant chat with:
- Streaming response support
- Conversation threads
- Suggestion chips for quick queries
- Welcome message with capabilities
- New chat functionality
- Responsive layout for tablets

## File: `app/ai/index.tsx`

## Features

### Core Capabilities
- Sales and revenue insights
- Inventory status queries
- Customer analytics
- Recent transaction lookup
- Product search

### UI Features
- Real-time streaming responses
- Typing indicator during response
- User/assistant message bubbles
- Auto-scroll to latest message
- Suggestion chips for first-time users
- New chat button to reset conversation

## Data Types

```typescript
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}
```

## State Management

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [inputText, setInputText] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [threadId, setThreadId] = useState<string | null>(null);  // For conversation continuity
```

## Welcome Message

```typescript
useEffect(() => {
    setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi there! 👋 I'm Tatenda, your AI assistant for ${currentBusiness?.name || 'your business'}.\n\nI can help you with:\n• Sales and revenue insights\n• Inventory status\n• Customer analytics\n• Recent transactions\n• Product searches\n\nHow can I help you today?`,
        timestamp: new Date(),
    }]);
}, [currentBusiness?.name]);
```

## Streaming Response Implementation

```typescript
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !currentBusiness || isLoading) return;

    // Create user message
    const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: inputText.trim(),
        timestamp: new Date(),
    };

    // Create placeholder for assistant response
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

        // Process streaming response
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
                                // Append content chunk
                                fullContent += data.content;
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === assistantMessage.id
                                            ? { ...msg, content: fullContent }
                                            : msg
                                    )
                                );
                            } else if (data.type === 'done') {
                                // Store thread ID for conversation continuity
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
```

## Message Bubble UI

```tsx
const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
        <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
            {/* Assistant Avatar */}
            {!isUser && (
                <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2">
                    <Text className="text-lg">🤖</Text>
                </View>
            )}
            
            {/* Message Bubble */}
            <View
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? 'bg-green-500 rounded-br-sm'
                        : 'bg-white border border-gray-200 rounded-bl-sm'
                }`}
            >
                <Text className={isUser ? 'text-white' : 'text-gray-800'}>
                    {item.content}
                </Text>
                
                {/* Streaming Indicator */}
                {item.isStreaming && (
                    <View className="flex-row items-center mt-2">
                        <ActivityIndicator size="small" color="#22c55e" />
                        <Text className="text-gray-400 text-xs ml-2">Thinking...</Text>
                    </View>
                )}
            </View>
            
            {/* User Avatar */}
            {isUser && (
                <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center ml-2">
                    <MaterialCommunityIcons name="account" size={18} color="#fff" />
                </View>
            )}
        </View>
    );
};
```

## Suggestion Chips

```tsx
const SuggestionChip = ({ text, onPress }: { text: string; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        className="bg-green-50 border border-green-200 rounded-full px-4 py-2 mr-2 mb-2"
    >
        <Text className="text-green-700 text-sm">{text}</Text>
    </Pressable>
);

// Usage in ListFooterComponent (only show after welcome message)
{messages.length === 1 && (
    <View className="px-4">
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
    </View>
)}
```

## New Chat Functionality

```typescript
const startNewChat = () => {
    setThreadId(null);  // Clear thread to start fresh
    setMessages([{
        id: 'welcome-new',
        role: 'assistant',
        content: `Starting a new conversation! How can I help you with ${currentBusiness?.name || 'your business'}?`,
        timestamp: new Date(),
    }]);
};

// Header button
<Pressable
    onPress={startNewChat}
    className="flex-row items-center bg-green-50 px-3 py-2 rounded-full"
>
    <MaterialCommunityIcons name="plus" size={18} color="#22c55e" />
    <Text className="text-green-600 font-medium ml-1">New Chat</Text>
</Pressable>
```

## Input Component

```tsx
<View className="px-4 pb-4 pt-2 bg-white border-t border-gray-200">
    <View className="flex-row items-end bg-gray-100 rounded-2xl px-4 py-2">
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
            className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim() && !isLoading ? 'bg-green-500' : 'bg-gray-300'
            }`}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
        </Pressable>
    </View>
    <Text className="text-center text-gray-400 text-xs mt-2">
        Tatenda can make mistakes. Verify important information.
    </Text>
</View>
```

## Auto-Scroll

```typescript
const flatListRef = useRef<FlatList>(null);

const scrollToBottom = () => {
    setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
};

// Call after adding messages or updating content
// Also set onContentSizeChange on FlatList
<FlatList
    ref={flatListRef}
    onContentSizeChange={scrollToBottom}
    // ...
/>
```

## API Endpoint

### POST `/api/ai/chat`

**Request:**
```json
{
    "message": "How are sales this month?",
    "businessId": "business-id",
    "threadId": "optional-thread-id"
}
```

**Response (Server-Sent Events):**
```
data: {"type":"chunk","content":"Based on "}
data: {"type":"chunk","content":"your sales data"}
data: {"type":"chunk","content":"..."}
data: {"type":"done","threadId":"thread-abc123"}
```

**Error Response:**
```
data: {"type":"error","message":"An error occurred"}
```

## Keyboard Handling

```tsx
<KeyboardAvoidingView
    className="flex-1 bg-gray-50"
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={90}
>
    {/* Content */}
</KeyboardAvoidingView>
```

## Responsive Layout

```typescript
const { deviceType } = useResponsive();
const isTablet = deviceType === 'tablet' || deviceType === 'largeTablet';

// Constrain message width on tablets
<View
    className="max-w-[80%] rounded-2xl px-4 py-3"
    style={isTablet ? { maxWidth: '60%' } : undefined}
>

// Constrain input and messages container on tablets
contentContainerStyle={{
    paddingTop: 16,
    paddingBottom: 16,
    ...(isTablet && { maxWidth: 800, alignSelf: 'center', width: '100%' })
}}
```

## Dependencies

- `expo-constants` - For accessing API URL from environment
- `@expo/vector-icons` - MaterialCommunityIcons
