import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

export default function TabLayout() {
    const navigation = useNavigation();
    const activeColor = '#22c55e';
    const inactiveColor = '#9ca3af';

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 4,
                    fontFamily: 'Satoshi-Bold',
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                        <MaterialCommunityIcons
                            name={focused ? "home" : "home-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: 'Products',
                    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                        <MaterialCommunityIcons
                            name={focused ? "package-variant" : "package-variant-closed"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="pos"
                options={{
                    title: '',
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <View
                            style={{
                                backgroundColor: focused ? '#16a34a' : '#22c55e',
                                width: 56,
                                height: 56,
                                marginTop: -24,
                                borderRadius: 28,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: '#22c55e',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
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
                    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                        <MaterialCommunityIcons
                            name={focused ? "receipt" : "receipt-text-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
                        <MaterialCommunityIcons
                            name={focused ? "cog" : "cog-outline"}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
