import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert
} from "react-native";

interface HelpSupportScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ visible, onClose }) => {
    const [showFaq, setShowFaq] = useState(false);

    const toggleShowFaq = () => {
      setShowFaq((prev) => !prev);
    };

    const handleFAQ = () => {
      Alert.alert("FAQ", "Frequently Asked Questions will be displayed here.");
    };

    const handleContactSupport = () => {
      Alert.alert("Contact Support", "Email: support@swipely.com\nPhone: 1-800-SWIPELY");
    };

    const handleTerms = () => {
      Alert.alert("Terms of Service", "Terms of Service will be displayed here.");
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
                <Text style={styles.headerTitle}>Help & Support</Text>
              </View>

              {/* Help & Support Content */}
              <View>
                <TouchableOpacity 
                  style={styles.accountItem} 
                  onPress={() => toggleShowFaq()}
                >
                  <Text style={styles.accountLabel}>
                    {showFaq ? "Close Show Frequently Asked Questions" : "Show Frequently Asked Questions"}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.accountItem}
                  onPress={handleContactSupport}
                >
                  <Text style={styles.accountLabel}>Contact Support</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity> 
                <TouchableOpacity 
                  style={styles.accountItem}
                  onPress={handleTerms}
                >
                  <Text style={styles.accountLabel}>Terms of Service</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>                   
              </View>
            </ScrollView>
          </View>            
        </Modal>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  scrollView: {
    flex: 1,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor:'#fff'
  },
  accountLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
  },
  chevron: {
    fontSize: 20,
    color: "#6C757D",
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
});