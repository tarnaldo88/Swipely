import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { User, CategoryPreferences, MainStackParamList } from "../../types";
import { getAuthService } from "../../services";
import { CategoryPreferenceService } from "../../services/CategoryPreferenceService";
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrivacySecurityScreen } from "./Profile/PrivacySecurityScreen";
import { AccountSettingsScreen } from "./Profile/AccountSettingsScreen";
import { HelpSupportScreen } from "./Profile/HelpSupportScreen";
import { ProfileStyles } from "../Styles/ProfileScreenStyles";


type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface ProfileScreenProps {
  navigation?: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<CategoryPreferences | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload preferences when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserPreferences();
    }, [])
  );

  const loadUserPreferences = async () => {
    try {
      const userPreferences = await CategoryPreferenceService.getUserPreferences();
      setPreferences(userPreferences);
    } catch (error) {
      console.log("No preferences found, using defaults");
      setPreferences({ selectedCategories: [], lastUpdated: new Date() });
    }
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const authService = getAuthService();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        try {
          const userPreferences =
            await CategoryPreferenceService.getUserPreferences();
          setPreferences(userPreferences);
        } catch (error) {
          console.log("No preferences found, using defaults");
          setPreferences({ selectedCategories: [], lastUpdated: new Date() });
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategories = () => {
    // Navigate to category selection screen
    navigation.navigate("CategorySelection", { isInitialSetup: false });
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: performLogout,
      },
    ]);
  };

  const performLogout = async () => {
    try {
      const authService = getAuthService();
      await authService.signOut();
      // Navigation will be handled automatically by the auth state change in App.tsx
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <View style={ProfileStyles.backgroundContainer}>
        <SafeAreaView style={ProfileStyles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={ProfileStyles.loadingContainer}>
          <Text style={ProfileStyles.loadingText}>Loading profile...</Text>
        </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={ProfileStyles.backgroundContainer}>
        <SafeAreaView style={ProfileStyles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={ProfileStyles.errorContainer}>
          <Text style={ProfileStyles.errorText}>Unable to load profile</Text>
        </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={ProfileStyles.backgroundContainer}>
      <SafeAreaView style={ProfileStyles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={ProfileStyles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={ProfileStyles.header}>
          <Text style={ProfileStyles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Section */}
        <View style={ProfileStyles.section}>
          <View style={ProfileStyles.userInfo}>
            <View style={ProfileStyles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={ProfileStyles.avatar} />
              ) : (
                <View style={ProfileStyles.avatarPlaceholder}>
                  <Text style={ProfileStyles.avatarText}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={ProfileStyles.userDetails}>
              <Text style={ProfileStyles.userName}>{user.displayName}</Text>
              <Text style={ProfileStyles.userEmail}>{user.email}</Text>
              <Text style={ProfileStyles.memberSince}>
                Member since {formatDate(user.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={ProfileStyles.section}>
          <Text style={ProfileStyles.sectionTitle}>Preferences</Text>

          <TouchableOpacity
            style={ProfileStyles.preferenceItem}
            onPress={handleEditCategories}
          >
            <View style={ProfileStyles.preferenceContent}>
              <Text style={ProfileStyles.preferenceLabel}>Categories</Text>
              <Text style={ProfileStyles.preferenceValue}>
                {preferences?.selectedCategories.length || 0} selected
              </Text>
            </View>
            <Text style={ProfileStyles.chevron}>›</Text>
          </TouchableOpacity>

          {preferences && preferences.selectedCategories.length > 0 && (
            <View style={ProfileStyles.categoryTags}>
              {preferences.selectedCategories
                .slice(0, 3)
                .map((categoryId, index) => (
                  <View key={categoryId} style={ProfileStyles.categoryTag}>
                    <Text style={ProfileStyles.categoryTagText}>
                      {categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}
                    </Text>
                  </View>
                ))}
              {preferences.selectedCategories.length > 3 && (
                <View style={ProfileStyles.categoryTag}>
                  <Text style={ProfileStyles.categoryTagText}>
                    +{preferences.selectedCategories.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {preferences?.lastUpdated && (
            <Text style={ProfileStyles.lastUpdated}>
              Last updated: {formatDate(preferences.lastUpdated)}
            </Text>
          )}
        </View>

        {/* Account Section */}
        <View style={ProfileStyles.section}>
          <Text style={ProfileStyles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={ProfileStyles.accountItem}
            onPress={() => setShowAccountModal(true)}
          >
            <Text style={ProfileStyles.accountLabel}>Account Settings</Text>
            <Text style={ProfileStyles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={ProfileStyles.accountItem}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Text style={ProfileStyles.accountLabel}>Privacy & Security</Text>
            <Text style={ProfileStyles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
          style={ProfileStyles.accountItem}
          onPress={() => setShowHelpModal(true)}
          >
            <Text style={ProfileStyles.accountLabel}>Help & Support</Text>
            <Text style={ProfileStyles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={ProfileStyles.section}>
          <TouchableOpacity style={ProfileStyles.logoutButton} onPress={handleLogout}>
            <Text style={ProfileStyles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={ProfileStyles.appInfo}>
          <Text style={ProfileStyles.appInfoText}>Swipely v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Account Settings Modal */}
      <AccountSettingsScreen 
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />

      {/* Privacy & Security Modal */}
      <PrivacySecurityScreen 
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      {/* Help & Support Modal */}
      <HelpSupportScreen 
        visible={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
      </SafeAreaView>
    </View>
  );
};