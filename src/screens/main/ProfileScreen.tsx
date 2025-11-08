import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { User, CategoryPreferences, MainStackParamList } from "../../types";
import { getAuthService } from "../../services";
import { CategoryPreferenceService } from "../../services/CategoryPreferenceService";
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrivacySecurityScreen } from "./Profile/PrivacySecurityScreen";


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

  useEffect(() => {
    loadUserData();
  }, []);

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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.displayName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.memberSince}>
                Member since {formatDate(user.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={handleEditCategories}
          >
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceLabel}>Categories</Text>
              <Text style={styles.preferenceValue}>
                {preferences?.selectedCategories.length || 0} selected
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {preferences && preferences.selectedCategories.length > 0 && (
            <View style={styles.categoryTags}>
              {preferences.selectedCategories
                .slice(0, 3)
                .map((categoryId, index) => (
                  <View key={categoryId} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>
                      {categoryId.charAt(0).toUpperCase() + categoryId.slice(1)}
                    </Text>
                  </View>
                ))}
              {preferences.selectedCategories.length > 3 && (
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>
                    +{preferences.selectedCategories.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          )}

          {preferences?.lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last updated: {formatDate(preferences.lastUpdated)}
            </Text>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.accountItem}
            onPress={() => {
              navigation.navigate("AccountSettings", {});
            }}
          >
            <Text style={styles.accountLabel}>Account Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.accountItem}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Text style={styles.accountLabel}>Privacy & Security</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
          style={styles.accountItem}
          onPress={() => {
            navigation.navigate("HelpSupport", {});
          }}
          >
            <Text style={styles.accountLabel}>Help & Support</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Swipely v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Privacy & Security Modal */}
      <PrivacySecurityScreen 
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#eff7e9",
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#08f88c",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6C757D",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "#6C757D",
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
    marginBottom: 2,
  },
  preferenceValue: {
    fontSize: 14,
    color: "#6C757D",
  },
  chevron: {
    fontSize: 20,
    color: "#6C757D",
  },
  categoryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryTagText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "500",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 8,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  accountLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  logoutButton: {
    backgroundColor: "#DC3545",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: "#6C757D",
  },
});
