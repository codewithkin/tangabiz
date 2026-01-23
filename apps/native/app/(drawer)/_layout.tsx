import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useThemeColor } from "heroui-native";
import React, { useCallback } from "react";
import { Pressable, Text as RNText } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";

function DrawerLayout() {
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  const renderThemeToggle = useCallback(() => <ThemeToggle />, []);

  return (
    <Drawer
      screenOptions={{
        headerTintColor: themeColorForeground,
        headerStyle: { backgroundColor: themeColorBackground },
        headerTitleStyle: {
          fontWeight: "600",
          fontFamily: 'Satoshi-Bold',
          color: themeColorForeground,
        },
        headerRight: renderThemeToggle,
        drawerStyle: { backgroundColor: themeColorBackground },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Home",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: 'Satoshi-Regular' }}>Home</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="(tabs)/index"
        options={{
          headerTitle: "Dashboard",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: 'Satoshi-Regular' }}>Dashboard</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <MaterialIcons
              name="dashboard"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable className="mr-4">
                <Ionicons name="add-outline" size={24} color={themeColorForeground} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Drawer.Screen
        name="organisation"
        options={{
          headerTitle: "Organisation",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: 'Satoshi-Regular' }}>Organisation</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="business-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="billing"
        options={{
          headerTitle: "Billing",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: 'Satoshi-Regular' }}>Billing</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="card-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          headerTitle: "About",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: 'Satoshi-Regular' }}>About</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="information-circle-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
    </Drawer>
  );
}

export default DrawerLayout;
