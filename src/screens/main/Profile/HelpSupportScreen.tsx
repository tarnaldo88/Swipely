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
import { FaqScreen } from "./FaqScreen";

interface HelpSupportScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ visible, onClose }) => {
    const [showFaq, setShowFaq] = useState(false);
    const [showContactUs, setShowContactUs] = useState(false);
    const [showTerms, setTerms] = useState(false);
    

    const toggleShowFaq = () => {
      setShowFaq((prev) => !prev);
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
                  style={[
                    styles.accountItem, 
                    showFaq && styles.activeAccountItem
                  ]}
                  onPress={toggleShowFaq}
                >
                  <Text
                    style={[
                      styles.accountLabel,
                      showFaq && styles.activeAccountLabel,
                    ]}
                  >
                    {showFaq ? "Close Frequently Asked Questions" : "Show Frequently Asked Questions"}
                  </Text>
                  <Text
                    style={[
                      styles.chevron,
                      showFaq && styles.activeChevron,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>

                {showFaq && (
                  <FaqScreen/>
                )}
                <TouchableOpacity 
                  style={[styles.accountItem, showContactUs && styles.activeAccountItem]}
                  onPress={handleContactSupport}
                >
                  <Text style={[styles.accountLabel, showContactUs && styles.activeChevron,]}>Contact Support</Text>
                  <Text style={[styles.chevron, showContactUs && styles.activeChevron,]}>›</Text>
                </TouchableOpacity> 
                <TouchableOpacity 
                  style={[styles.accountItem, showTerms && styles.activeAccountItem]}
                  onPress={handleTerms}
                >
                  <Text style={[styles.accountLabel, showTerms && styles.activeChevron,]}>Terms of Service</Text>
                  <Text style={[styles.chevron, showTerms && styles.activeChevron,]}>›</Text>
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
  activeAccountItem: {
    backgroundColor: "#E6D7F5", // light purple tint (visible feedback)
  },

  activeAccountLabel: {
    color: "#47006e", // same purple as your header
    fontWeight: "600",
  },

  activeChevron: {
    color: "#47006e",
  },
});