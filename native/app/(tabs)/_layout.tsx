import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#22c55e',
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#fff',
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
                    backgroundColor: '#22c55e',
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
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home" size={size} color={color} />
                    ),
                    headerTitle: 'Tangabiz',
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="package-variant" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="pos"
                options={{
                    title: 'New Sale',
                    tabBarIcon: ({ color, size }) => (
                        <View className="bg-green-500 rounded-full p-2 -mt-4">
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
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
