import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from 'heroui-native';

export default function TabLayout() {
    const linkColor = useThemeColor('link');
    const mutedColor = useThemeColor('muted');
    const backgroundColor = useThemeColor('background');

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: linkColor,
                tabBarInactiveTintColor: mutedColor,
                tabBarStyle: {
                    backgroundColor: backgroundColor,
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb',
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 10,
                    height: Platform.OS === 'ios' ? 85 : 65,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: linkColor,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                    headerTitle: 'Tangabiz',
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="package-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pos"
                options={{
                    title: 'New Sale',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <View className="bg-success rounded-full p-2 -mt-4">
                            <MaterialCommunityIcons name="cart-plus" size={28} color="#fff" />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'Sales',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
