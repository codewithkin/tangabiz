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
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontFamily: 'Satoshi-Bold',
          color: themeColorForeground,
        },
        drawerStyle: { backgroundColor: themeColorBackground },
        headerRight: renderThemeToggle,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: "Home",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: focused ? 'Satoshi-Bold' : 'Satoshi-Regular' }}>Home</RNText>
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
        name="products"
        options={{
          headerTitle: "Products",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: focused ? 'Satoshi-Bold' : 'Satoshi-Regular' }}>Products</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="cube-outline"
              size={size}
              color={focused ? color : themeColorForeground}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="organisation"
        options={{
          headerTitle: "Organisation",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: focused ? 'Satoshi-Bold' : 'Satoshi-Regular' }}>Organisation</RNText>
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
        name="customers"
        options={{
          headerTitle: "Customers",
          drawerLabel: ({ color, focused }) => (
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: focused ? 'Satoshi-Bold' : 'Satoshi-Regular' }}>Customers</RNText>
          ),
          drawerIcon: ({ size, color, focused }) => (
            <Ionicons
              name="people-outline"
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
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: focused ? 'Satoshi-Bold' : 'Satoshi-Regular' }}>Billing</RNText>
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
            <RNText style={{ color: focused ? color : themeColorForeground, fontFamily: focused ? 'Satoshi-Bold' : 'Satoshi-Regular' }}>About</RNText>
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
