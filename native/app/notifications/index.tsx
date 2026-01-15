import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Alert,
    useWindowDimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/api';
import { BREAKPOINTS } from '../../lib/useResponsive';

// Types
interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    business: {
        name: string;
        logo?: string;
    };
}

type NotificationType =
    | 'LOW_STOCK'
    | 'NEW_SALE'
    | 'LARGE_SALE'
    | 'NEW_CUSTOMER'
    | 'DAILY_SUMMARY'
    | 'WEEKLY_REPORT'
    | 'PAYMENT_RECEIVED'
    | 'REFUND_PROCESSED'
    | 'GOAL_ACHIEVED'
    | 'SYSTEM';

// WebSocket connection URL
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

export default function NotificationsScreen() {
    const { width } = useWindowDimensions();
    const { currentBusiness, user, token } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Responsive helpers
    const isTablet = width >= BREAKPOINTS.tablet;
    const cardPadding = isTablet ? 'p-5' : 'p-4';
    const iconSize = isTablet ? 28 : 24;

    // Connect to WebSocket for realtime updates
    useEffect(() => {
        if (!user || !currentBusiness || !token) return;

        const connectWebSocket = () => {
            try {
                const ws = new WebSocket(`${WS_URL}?userId=${user.id}&businessId=${currentBusiness.id}&token=${token}`);

                ws.onopen = () => {
                    console.log('[WS] Connected');
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'notification') {
                            // Add new notification to the top of the list
                            setNotifications((prev) => [data.payload, ...prev]);
                            setUnreadCount((prev) => prev + 1);
                        }
                    } catch (error) {
                        console.error('[WS] Failed to parse message:', error);
                    }
                };

                ws.onclose = () => {
                    console.log('[WS] Disconnected');
                    // Attempt reconnection after 5 seconds
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
                };

                ws.onerror = (error) => {
                    console.error('[WS] Error:', error);
                };

                wsRef.current = ws;
            } catch (error) {
                console.error('[WS] Connection error:', error);
                reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
            }
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [user, currentBusiness, token]);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        if (!currentBusiness) return;

        try {
            const res = await api.get('/api/notifications', {
                businessId: currentBusiness.id,
                unreadOnly: filter === 'unread' ? 'true' : 'false',
            });

            if (res.success && res.data) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [currentBusiness, filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        fetchNotifications();
    }, [fetchNotifications]);

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            await api.patch(`/api/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        if (!currentBusiness) return;

        try {
            await api.post('/api/notifications/mark-read', {
                markAll: true,
            }, {
                businessId: currentBusiness.id,
            });
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId: string) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/notifications/${notificationId}`);
                            setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                        } catch (error) {
                            console.error('Failed to delete notification:', error);
                        }
                    },
                },
            ]
        );
    };

    // Handle notification press - navigate based on type
    const handleNotificationPress = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Navigate based on notification type and data
        switch (notification.type) {
            case 'LOW_STOCK':
                if (notification.data?.productId) {
                    router.push(`/products/${notification.data.productId}`);
                }
                break;
            case 'NEW_SALE':
            case 'LARGE_SALE':
            case 'REFUND_PROCESSED':
                if (notification.data?.transactionId) {
                    router.push(`/transactions/${notification.data.transactionId}`);
                }
                break;
            case 'NEW_CUSTOMER':
                if (notification.data?.customerId) {
                    router.push(`/customers/${notification.data.customerId}`);
                }
                break;
            case 'DAILY_SUMMARY':
            case 'WEEKLY_REPORT':
                router.push('/reports');
                break;
            default:
                // Just mark as read for other types
                break;
        }
    };

    // Get icon and color for notification type
    const getNotificationStyle = (type: NotificationType) => {
        switch (type) {
            case 'LOW_STOCK':
                return { icon: 'alert-circle', color: '#ef4444', bgColor: 'bg-red-100' };
            case 'NEW_SALE':
                return { icon: 'cart-check', color: '#22c55e', bgColor: 'bg-green-100' };
            case 'LARGE_SALE':
                return { icon: 'star-circle', color: '#eab308', bgColor: 'bg-yellow-100' };
            case 'NEW_CUSTOMER':
                return { icon: 'account-plus', color: '#3b82f6', bgColor: 'bg-blue-100' };
            case 'DAILY_SUMMARY':
                return { icon: 'chart-bar', color: '#8b5cf6', bgColor: 'bg-purple-100' };
            case 'WEEKLY_REPORT':
                return { icon: 'file-chart', color: '#8b5cf6', bgColor: 'bg-purple-100' };
            case 'PAYMENT_RECEIVED':
                return { icon: 'cash-check', color: '#22c55e', bgColor: 'bg-green-100' };
            case 'REFUND_PROCESSED':
                return { icon: 'cash-refund', color: '#f97316', bgColor: 'bg-orange-100' };
            case 'GOAL_ACHIEVED':
                return { icon: 'trophy', color: '#eab308', bgColor: 'bg-yellow-100' };
            case 'SYSTEM':
            default:
                return { icon: 'bell', color: '#6b7280', bgColor: 'bg-gray-100' };
        }
    };

    // Format relative time
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    // Render notification item
    const renderNotification = ({ item }: { item: Notification }) => {
        const style = getNotificationStyle(item.type);

        return (
            <Pressable
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => deleteNotification(item.id)}
                className={`${cardPadding} mx-4 mb-3 bg-white rounded-xl flex-row items-start ${
                    !item.isRead ? 'border-l-4 border-green-500' : ''
                }`}
                style={{ opacity: item.isRead ? 0.8 : 1 }}
            >
                <View className={`${isTablet ? 'w-12 h-12' : 'w-10 h-10'} rounded-full items-center justify-center mr-3 ${style.bgColor}`}>
                    <MaterialCommunityIcons
                        name={style.icon as any}
                        size={isTablet ? 24 : 20}
                        color={style.color}
                    />
                </View>
                <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className={`font-semibold text-gray-900 flex-1 ${isTablet ? 'text-base' : 'text-sm'}`} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {!item.isRead && (
                            <View className="w-2 h-2 rounded-full bg-green-500 ml-2" />
                        )}
                    </View>
                    <Text className={`text-gray-600 ${isTablet ? 'text-sm' : 'text-xs'}`} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text className={`text-gray-400 mt-1 ${isTablet ? 'text-xs' : 'text-[10px]'}`}>
                        {formatRelativeTime(item.createdAt)}
                    </Text>
                </View>
            </Pressable>
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#22c55e" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerRight: () =>
                        unreadCount > 0 ? (
                            <Pressable onPress={markAllAsRead} className="mr-4">
                                <Text className="text-white font-medium">Mark all read</Text>
                            </Pressable>
                        ) : null,
                }}
            />

            {/* Filter Tabs */}
            <View className={`flex-row bg-white p-1 rounded-xl ${isTablet ? 'mx-6 mt-4' : 'mx-4 mt-3'}`}>
                <Pressable
                    onPress={() => setFilter('all')}
                    className={`flex-1 py-2 rounded-lg ${filter === 'all' ? 'bg-green-500' : ''}`}
                >
                    <Text className={`text-center font-medium ${filter === 'all' ? 'text-white' : 'text-gray-600'}`}>
                        All
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setFilter('unread')}
                    className={`flex-1 py-2 rounded-lg flex-row items-center justify-center ${filter === 'unread' ? 'bg-green-500' : ''}`}
                >
                    <Text className={`text-center font-medium ${filter === 'unread' ? 'text-white' : 'text-gray-600'}`}>
                        Unread
                    </Text>
                    {unreadCount > 0 && (
                        <View className={`ml-2 px-2 py-0.5 rounded-full ${filter === 'unread' ? 'bg-white' : 'bg-green-500'}`}>
                            <Text className={`text-xs font-bold ${filter === 'unread' ? 'text-green-600' : 'text-white'}`}>
                                {unreadCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={['#22c55e']}
                        tintColor="#22c55e"
                    />
                }
                ListEmptyComponent={
                    <View className="flex-1 items-center justify-center py-20">
                        <MaterialCommunityIcons name="bell-off-outline" size={64} color="#d1d5db" />
                        <Text className="text-gray-400 mt-4 text-center">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </Text>
                        <Text className="text-gray-400 text-sm text-center mt-1">
                            You'll receive updates about your business here
                        </Text>
                    </View>
                }
            />

            {/* Connection Status Indicator */}
            {wsRef.current?.readyState === WebSocket.OPEN && (
                <View className="absolute bottom-24 right-4 flex-row items-center bg-green-500 px-3 py-1.5 rounded-full">
                    <View className="w-2 h-2 rounded-full bg-white mr-2" />
                    <Text className="text-white text-xs font-medium">Live</Text>
                </View>
            )}
        </View>
    );
}
