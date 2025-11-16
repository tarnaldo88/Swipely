import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { AccountStyles } from "@/screens/Styles/ProfileStyles";

interface AccountSettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ visible, onClose }) => {

  return(
    <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={false}
            onRequestClose={onClose}
    >
      <View style={AccountStyles.container}>
        <ScrollView style={AccountStyles.scrollView}>
            {/* Header */}
            <View style={AccountStyles.header}>
              <TouchableOpacity onPress={onClose} style={AccountStyles.closeButton}>
                <Text style={AccountStyles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={AccountStyles.headerTitle}>Account Settings</Text>
            </View>
            {/* Account Settings options */}
            <View>
              <TouchableOpacity style={AccountStyles.accountItem}>
                <Text style={AccountStyles.accountLabel}>Option 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={AccountStyles.accountItem}>
                <Text style={AccountStyles.accountLabel}>Option 2</Text>
              </TouchableOpacity> 
              <TouchableOpacity style={AccountStyles.accountItem}>
                <Text style={AccountStyles.accountLabel}>Option 3</Text>
              </TouchableOpacity>                   
            </View>
        </ScrollView>
      </View>
    </Modal>
  );
};