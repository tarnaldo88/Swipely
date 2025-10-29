import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, AuthStackParamList, MainTabParamList } from '../types';

// Stack navigators
export const RootStack = createStackNavigator<RootStackParamList>();
export const AuthStack = createStackNavigator<AuthStackParamList>();
export const MainTab = createBottomTabNavigator<MainTabParamList>();

// Navigation container will be configured in App.tsx
export { NavigationContainer };