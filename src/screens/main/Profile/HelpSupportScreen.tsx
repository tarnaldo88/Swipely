import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal
} from "react-native";
import Accordion from 'react-native-collapsible/Accordion';

interface HelpSupportScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ visible, onClose }) => {

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
                <TouchableOpacity style={styles.accountItem}>
                  <Text style={styles.accountLabel}>FAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.accountItem}>
                  <Text style={styles.accountLabel}>Contact Support</Text>
                </TouchableOpacity> 
                <TouchableOpacity style={styles.accountItem}>
                  <Text style={styles.accountLabel}>Terms of Service</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
    backgroundColor:'#fff'
  },
  accountLabel: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
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