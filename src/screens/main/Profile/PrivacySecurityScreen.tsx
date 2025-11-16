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
import { PrivacySecurityStyles } from "@/screens/Styles/ProfileStyles";

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
            <View style={PrivacySecurityStyles.container}>
                <ScrollView style={PrivacySecurityStyles.scrollView}>
                {/* Header */}
                <View style={PrivacySecurityStyles.header}>
                    <TouchableOpacity onPress={onClose} style={PrivacySecurityStyles.closeButton}>
                        <Text style={PrivacySecurityStyles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={PrivacySecurityStyles.headerTitle}>Privacy & Security</Text>
                </View>

                {/* {Privacy and Security settings} */}
                <View>
                    <TouchableOpacity style={PrivacySecurityStyles.securityItem} onPress={() => {togglePasswordChange()}}>
                    <Text style={PrivacySecurityStyles.pwChangeLabel}>
                        {showPasswordChange ? "Cancel Password Change" : "Change Password"}
                    </Text>
                    </TouchableOpacity>

                    {showPasswordChange && (
                        <View style={PrivacySecurityStyles.passwordSection}>
                            <TextInput
                            style={PrivacySecurityStyles.input}
                            placeholder="Old Password"
                            value={credentials.oldPassword}
                            onChangeText={(value) => updateCredentials("oldPassword", value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            />
                            <TextInput
                            style={PrivacySecurityStyles.input}
                            placeholder="New Password"
                            value={credentials.newPassword}
                            onChangeText={(value) => updateCredentials("newPassword", value)}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                            />
                            <TouchableOpacity style={PrivacySecurityStyles.submitButton} onPress={handlePasswordSubmit}>
                            <Text style={PrivacySecurityStyles.submitButtonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={PrivacySecurityStyles.headerTitle}>App Permissions</Text>
                    <View style={PrivacySecurityStyles.switchRow}>
                        <Text style={PrivacySecurityStyles.switchLabel}>Enable Location</Text>
                        <Switch
                        value={locationEnabled}
                        onValueChange={toggleLocationPermission}
                        />
                    </View>

                    {/* Notifications Toggle */}
                    <View style={PrivacySecurityStyles.switchRow}>
                        <Text style={PrivacySecurityStyles.switchLabel}>Allow Notifications</Text>
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