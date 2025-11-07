import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  PanResponder,
  Animated,
  ScrollView,
  StatusBar, 
  Switch,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getAuthService } from "../../../services";
import { User, CategoryPreferences, MainStackParamList, PasswordChange } from "../../../types";
import { SafeAreaView } from 'react-native-safe-area-context';

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface PrivacySecurityScreenProps {
  navigation: any;
  route?: {
    params?: {
      isInitialSetup?: boolean;
    };
  };
}



export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = () => {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const [user, setUser] = useState(null);
    const [showPasswordChange, setShowPasswordChange] = useState(true);
    const [credentials, setCredentials] = useState<PasswordChange>({
            oldPassword: "",
            newPassword: "",
    });    

    const updateCredentials = (field: keyof PasswordChange, value: string) => {
        setCredentials((prev) => ({
            ...prev,
            [field]: value,
            // provider: loginMethod,
        }));
    };

    const handlePasswordSubmit = () => {
        //Firebase password change would go here
        setShowPasswordChange(false);
    }

    const togglePasswordChange = () => {
        setShowPasswordChange((prev) => !prev);
    };

    return(
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <TouchableOpacity style={styles.securityItem} onPress={() => {togglePasswordChange()}}>
                    <Text style={styles.pwChangeLabel}>
                        {showPasswordChange ? "Cancel Password Change" : "Change Password"}
                    </Text>
                </TouchableOpacity>

                {showPasswordChange && (
                    <View style={styles.passwordSection}>
                        <TextInput
                        style={styles.input}
                        placeholder="Old Password"
                        value={credentials.oldPassword}
                        onChangeText={(value) => updateCredentials("oldPassword", value)}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        />
                        <TextInput
                        style={styles.input}
                        placeholder="New Password"
                        value={credentials.newPassword}
                        onChangeText={(value) => updateCredentials("newPassword", value)}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        />
                        <TouchableOpacity style={styles.submitButton} onPress={handlePasswordSubmit}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  scrollView: {
    flex: 1,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor:'#fff'
  },
  pwChangeLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#08f88c",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  passwordSection: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
});