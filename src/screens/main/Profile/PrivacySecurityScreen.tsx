import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Modal
} from "react-native";
import { PasswordChange } from "../../../types";

interface PrivacySecurityScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({ visible, onClose }) => {
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [credentials, setCredentials] = useState<PasswordChange>({
            oldPassword: "",
            newPassword: "",
    });    

    const updateCredentials = (field: keyof PasswordChange, value: string) => {
        setCredentials((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePasswordSubmit = () => {
        //Firebase password change would go here
        setShowPasswordChange(false);
    }

    const togglePasswordChange = () => {
        setShowPasswordChange((prev) => !prev);
    };

    const toggleLocationPermission = () => {
        //Location code changes would go here. 
        setLocationEnabled((prev) => !prev);
    };

    const toggleNotifications = () => {
        //code changes for showing notifications go here
        setNotifications((prev) => !prev);
    };

    return(
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Privacy & Security</Text>
                </View>

                {/* {Privacy and Security settings} */}
                <View>
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

                    <Text style={styles.headerTitle}>App Permissions</Text>
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Enable Location</Text>
                        <Switch
                        value={locationEnabled}
                        onValueChange={toggleLocationPermission}
                        />
                    </View>

                    {/* Notifications Toggle */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Allow Notifications</Text>
                        <Switch
                        value={notifications}
                        onValueChange={toggleNotifications}
                        />
                    </View>
                </View>                
                </ScrollView>
            </View>
        </Modal>
    )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ccc',
    },
    switchLabel: {
        fontSize: 16,
        color: '#f1f6faff',
        flexShrink: 1,
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
    paddingLeft:25,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#eff7e9",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#eff7e9",
    flex: 1,
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