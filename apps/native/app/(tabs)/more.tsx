import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Surface, Button, useThemeColor, Divider } from 'heroui-native';

import { Container } from '@/components/container';
import { useAuthStore, CVT_URLS } from '@/store/auth';

interface MenuItemProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
    badge?: string;
}

const MenuItem = ({ icon, label, onPress, color, badge }: MenuItemProps) => (
    <Pressable onPress={onPress} className="flex-row items-center py-4">
        <View
            className="w-10 h-10 rounded-lg items-center justify-center mr-4"
            style={{ backgroundColor: (color || '#22c55e') + '20' }}
        >
            <MaterialCommunityIcons name={icon} size={24} color={color || '#22c55e'} />
        </View>
        <Text className="flex-1 text-foreground font-medium">{label}</Text>
        {badge && (
            <View className="bg-red-500 px-2 py-1 rounded-full mr-2">
                <Text className="text-white text-xs font-bold">{badge}</Text>
            </View>
        )}
        <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
    </Pressable>
);

export default function More() {
    const { currentBusiness, user, signOut } = useAuthStore();
    const router = useRouter();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/sign-in');
                    }
                },
            ]
        );
    };

    return (
        <Container>
            <Stack.Screen options={{ title: 'More' }} />

            <ScrollView className="flex-1 p-4">
                {/* User Info */}
                <Surface variant="secondary" className="p-4 rounded-xl mb-6">
                    <View className="flex-row items-center">
                        <View className="w-14 h-14 bg-success rounded-full items-center justify-center mr-4">
                            <Text className="text-white text-xl font-bold">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-foreground font-bold text-lg">{user?.name}</Text>
                            <Text className="text-muted">{user?.email}</Text>
                            <View className="flex-row items-center mt-1">
                                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                <Text className="text-muted text-sm">
                                    {currentBusiness?.role || 'Member'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Surface>

                {/* Business */}
                <Surface variant="secondary" className="rounded-xl mb-6 px-4">
                    <Text className="text-muted text-sm font-medium pt-4 pb-2">BUSINESS</Text>
                    <MenuItem
                        icon="store"
                        label={currentBusiness?.name || 'Select Business'}
                        onPress={() => router.push('/settings/business')}
                        color="#3b82f6"
                    />
                    <Divider />
                    <MenuItem
                        icon="account-group"
                        label="Customers"
                        onPress={() => router.push('/customers')}
                        color="#8b5cf6"
                    />
                    <Divider />
                    <MenuItem
                        icon="chart-bar"
                        label="Reports"
                        onPress={() => router.push('/reports')}
                        color="#f97316"
                    />
                </Surface>

                {/* Features */}
                <Surface variant="secondary" className="rounded-xl mb-6 px-4">
                    <Text className="text-muted text-sm font-medium pt-4 pb-2">FEATURES</Text>
                    <MenuItem
                        icon="robot"
                        label="Tatenda AI Assistant"
                        onPress={() => router.push('/ai')}
                        color="#eab308"
                    />
                    <Divider />
                    <MenuItem
                        icon="qrcode-scan"
                        label="Verify Invoice"
                        onPress={() => router.push('/verify-invoice')}
                        color="#22c55e"
                    />
                    <Divider />
                    <MenuItem
                        icon="bell"
                        label="Notifications"
                        onPress={() => router.push('/notifications')}
                        color="#ef4444"
                    />
                </Surface>

                {/* Settings */}
                <Surface variant="secondary" className="rounded-xl mb-6 px-4">
                    <Text className="text-muted text-sm font-medium pt-4 pb-2">SETTINGS</Text>
                    <MenuItem
                        icon="account-cog"
                        label="Profile Settings"
                        onPress={() => router.push('/settings/profile')}
                        color="#6b7280"
                    />
                    <Divider />
                    <MenuItem
                        icon="cog"
                        label="App Settings"
                        onPress={() => router.push('/settings')}
                        color="#6b7280"
                    />
                </Surface>

                {/* Support */}
                <Surface variant="secondary" className="rounded-xl mb-6 px-4">
                    <Text className="text-muted text-sm font-medium pt-4 pb-2">SUPPORT</Text>
                    <MenuItem
                        icon="help-circle"
                        label="Help & Support"
                        onPress={() => Linking.openURL('https://tangabiz.store/help')}
                        color="#3b82f6"
                    />
                    <Divider />
                    <MenuItem
                        icon="open-in-new"
                        label="CVT Dashboard"
                        onPress={() => Linking.openURL(CVT_URLS.dashboard)}
                        color="#8b5cf6"
                    />
                </Surface>

                {/* Sign Out */}
                <Button
                    variant="secondary"
                    onPress={handleSignOut}
                    className="w-full mb-8"
                >
                    <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
                    <Button.Label className="text-red-500 ml-2">Sign Out</Button.Label>
                </Button>

                {/* Version */}
                <Text className="text-center text-muted text-sm mb-8">
                    Tangabiz v1.0.0
                </Text>
            </ScrollView>
        </Container>
    );
}
