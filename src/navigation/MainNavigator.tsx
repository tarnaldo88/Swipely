import React from "react";
import { Text, Platform } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MainStackParamList, MainTabParamList } from "../types";
import { SimpleProductDetailsScreen } from "../screens/main/SimpleProductDetailsScreen";
import CategorySelectionScreen from "../screens/main/CategorySelectionScreen";
import { SkippedProductsScreen } from "../screens/main/SkippedProductsScreen";
import { FeedScreen } from "../screens/main/FeedScreen";
import { WishlistScreen } from "../screens/main/WishlistScreen";
import { CartScreen } from "../screens/main/CartScreen";
import { ProfileScreen } from "../screens/main/ProfileScreen";
import {
  getIOSNavigationOptions,
  getIOSModalOptions,
  getPlatformFeatures,
} from "../utils/PlatformUtils";
import { IOSStyles } from "../styles/IOSStyles";
import {
  getAndroidNavigationOptions,
  getAndroidModalOptions,
  AndroidBackHandler,
} from "../utils/AndroidUtils";
import { AndroidStyles, MaterialColors } from "../styles/AndroidStyles";
import { StackScreen } from "react-native-screens";
import { AccountSettingsScreen } from "@/screens/main/Profile/AccountSettingsScreen";
import { HelpSupportScreen } from "@/screens/main/Profile/HelpSupportScreen";
import { PrivacySecurityScreen } from "@/screens/main/Profile/PrivacySecurityScreen";

const Stack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const platformFeatures = getPlatformFeatures();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle:
          Platform.OS === "ios"
            ? {
                ...IOSStyles.tabBar,
                backgroundColor: "#221e27",
                borderTopColor: "#221e27",
              }
            : {
                ...AndroidStyles.bottomNavigation,
                backgroundColor: MaterialColors.surface,
                borderTopColor: MaterialColors.divider,
              },
        tabBarActiveTintColor:
          Platform.OS === "ios" ? "#007AFF" : MaterialColors.primary,
        tabBarInactiveTintColor:
          Platform.OS === "ios" ? "#d2d2d6ff" : MaterialColors.textSecondary,
        tabBarLabelStyle:
          Platform.OS === "ios"
            ? {
                fontSize: 10,
                fontWeight: "400",
              }
            : {
                fontSize: 12,
                fontWeight: "500",
              },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: "Discover",
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20, color }}>{focused ? "🏠" : "🏡"}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: "Wishlist",
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20, color }}>{focused ? "💖" : "🤍"}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: "Cart",
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20, color }}>{focused ? "🛒" : "🛒"}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: 20, color }}>{focused ? "👤" : "👤"}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const MainNavigator: React.FC = () => {
  const iosNavigationOptions =
    Platform.OS === "ios" ? getIOSNavigationOptions() : {};
  const iosModalOptions = Platform.OS === "ios" ? getIOSModalOptions() : {};
  const androidNavigationOptions =
    Platform.OS === "android" ? getAndroidNavigationOptions() : {};
  const androidModalOptions =
    Platform.OS === "android" ? getAndroidModalOptions() : {};

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...(Platform.OS === "ios" && iosNavigationOptions),
        ...(Platform.OS === "android" && androidNavigationOptions),
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="ProductDetails"
        component={SimpleProductDetailsScreen}
        options={
          Platform.OS === "ios"
            ? {
                ...iosModalOptions,
                headerShown: true,
                title: "Product Details",
              }
            : {
                ...androidModalOptions,
                headerShown: true,
                title: "Product Details",
              }
        }
      />
      <Stack.Screen
        name="CategorySelection"
        component={CategorySelectionScreen}
        options={
          Platform.OS === "ios"
            ? {
                ...iosNavigationOptions,
                title: "Categories",
                headerShown: true,
              }
            : {
                ...androidNavigationOptions,
                title: "Categories",
                headerShown: true,
              }
        }
      />
      <Stack.Screen
        name="SkippedProducts"
        component={SkippedProductsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AccountSettings"
        component={AccountSettingsScreen}      
        options={
          Platform.OS === "ios"
            ? {
                ...iosModalOptions,
                headerShown: true,
                title: "Account Settings",
              }
            : {
                ...androidModalOptions,
                headerShown: true,
                title: "Account Settings",
              }
        }
      />
      <Stack.Screen 
        name="HelpSupport"
        component={HelpSupportScreen}      
        options={
          Platform.OS === "ios"
            ? {
                ...iosModalOptions,
                headerShown: true,
                title: "Help & Support",
              }
            : {
                ...androidModalOptions,
                headerShown: true,
                title: "Help & Support",
              }
        }
      />
      <Stack.Screen 
        name="PrivacySecurity"
        component={PrivacySecurityScreen}      
        options={
          Platform.OS === "ios"
            ? {
                ...iosModalOptions,
                headerShown: true,
                title: "Privacy & Security",
              }
            : {
                ...androidModalOptions,
                headerShown: true,
                title: "Privacy & Security",
              }
        }
      />
    </Stack.Navigator>
  );
};
