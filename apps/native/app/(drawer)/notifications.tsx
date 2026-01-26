import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, View, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import { format, formatDistanceToNow } from "date-fns";

type Notification = {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    metadata?: any;
};

const getNotificationIcon = (type: string) => {
    switch (type) {
        case "NEW_SALE":
            return { name: "cash-multiple", color: "#22c55e", IconComponent: MaterialCommunityIcons };
        case "NEW_CUSTOMER":
            return { name: "account-plus", color: "#3b82f6", IconComponent: MaterialCommunityIcons };
        case "LOW_STOCK":
            return { name: "alert", color: "#f59e0b", IconComponent: MaterialCommunityIcons };
        case "REFUND":
            return { name: "cash-refund", color: "#ef4444", IconComponent: MaterialCommunityIcons };
        default:
            return { name: "bell", color: "#6b7280", IconComponent: Ionicons };
    }
};

function NotificationItem({ notification, onPress }: { notification: Notification; onPress: () => void }) {
    const iconData = getNotificationIcon(notification.type);
    const IconComponent = iconData.IconComponent;

    return (
        <Pressable onPress={onPress} className="active:opacity-70">
            <Card className={`mb-3 ${!notification.read ? "border-l-4 border-l-green-500" : ""}`}>
                <CardContent className="py-4">
                    <View className="flex flex-row gap-3">
                        {/* Icon */}
                        <View
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${iconData.color}20` }}
                        >
                            <IconComponent name={iconData.name as any} size={24} color={iconData.color} />
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                            <View className="flex flex-row justify-between items-start mb-1">
                                <Text className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-600"}`}>
                                    {notification.title}
                                </Text>
                                {!notification.read && (
                                    <View className="bg-green-500 w-2 h-2 rounded-full" />
                                )}
                            </View>

                            <Text className={`text-sm ${!notification.read ? "text-gray-700" : "text-gray-500"}`}>
                                {notification.message}
                            </Text>

                            <Text className="text-xs text-gray-400 mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Text>
                        </View>
                    </View>
                </CardContent>
            </Card>
        </Pressable>
    );
}

export default function Notifications() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { currentBusiness, token } = useAuthStore();
    const businessId = currentBusiness?.id;

    // Fetch notifications
    const { data: notifications = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["notifications", businessId],
        queryFn: async () => {
            if (!businessId) return [];
            const response = await notificationsApi.list(businessId);
            return response.data?.notifications || [];
        },
        enabled: !!businessId,
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await notificationsApi.markAsRead(notificationId);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", businessId] });
            queryClient.invalidateQueries({ queryKey: ["notificationsCount", businessId] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!businessId) return;
            const response = await notificationsApi.markAllAsRead(businessId);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", businessId] });
            queryClient.invalidateQueries({ queryKey: ["notificationsCount", businessId] });
        },
    });

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
    };

    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    return (
        <ScrollView
            className="flex-1 bg-default-50"
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
            <View className="px-4 py-6 flex flex-col gap-6">
                {/* Header */}
                <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-3">
                        <View>
                            <Text className="text-2xl font-bold">Notifications</Text>
                            <Text className="text-gray-500 text-sm">
                                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                            </Text>
                        </View>
                    </View>

                    {unreadCount > 0 && (
                        <Pressable
                            onPress={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="active:opacity-70"
                        >
                            <Text className="text-green-600 font-semibold text-sm">Mark all read</Text>
                        </Pressable>
                    )}
                </View>

                {/* Notifications List */}
                {isLoading ? (
                    <View className="py-12 items-center">
                        <ActivityIndicator size="large" color="#22c55e" />
                        <Text className="text-gray-500 mt-4">Loading notifications...</Text>
                    </View>
                ) : notifications.length === 0 ? (
                    <View className="py-12 items-center">
                        <View className="bg-gray-100 p-6 rounded-full mb-4">
                            <Ionicons name="notifications-off" size={48} color="#9ca3af" />
                        </View>
                        <Text className="text-gray-500 text-lg font-semibold">No notifications yet</Text>
                        <Text className="text-gray-400 text-sm text-center mt-2">
                            You'll be notified about sales, low stock, and more
                        </Text>
                    </View>
                ) : (
                    <View className="flex flex-col">
                        {notifications.map((notification: Notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onPress={() => handleNotificationPress(notification)}
                            />
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
