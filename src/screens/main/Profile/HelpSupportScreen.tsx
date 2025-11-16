import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert,
  TextInput,
} from "react-native";
import { FaqScreen } from "./FaqScreen";
import Accordion from "react-native-collapsible/Accordion";
import { TermsOfService } from "./TermsOfService";
import { HelpSupportStyles } from "@/screens/Styles/ProfileStyles";

interface HelpSupportScreenProps {
  visible: boolean;
  onClose: () => void;
}

// const ContactSection = [
//   {
//     title: "Contact us at support@swipely.com",
//     content: "Phone Number: +1 555 555 5555"
//   }
// ];

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ visible, onClose }) => {
    const [showFaq, setShowFaq] = useState(false);
    const [showContactUs, setShowContactUs] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [activeSections, setActiveSections] = useState<number[]>([]);
    const [email, setEmail] = useState("");
    

    const toggleShowFaq = () => {
      setShowFaq((prev) => !prev);
    };

    const toggleContactSupport = () => {
      setShowContactUs((prev) => (!prev));
    };

    const toggleTerms = () => {
      setShowTerms((prev) => (!prev));
    };

    const contactUs = () => {
      return(
        <View style={HelpSupportStyles.accountItem}>
          <Text>Contact us at support@swipely.com</Text>
          <TextInput
            placeholder="Enter Email"
            onChangeText={setEmail}
          />
          <Text>Phone Number: +1 555 555 5555</Text>    
        </View>
      );
    };
    
    return(
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={false}
            onRequestClose={onClose}
        >
          <View style={HelpSupportStyles.container}>
            <ScrollView style={HelpSupportStyles.scrollView}>
              {/* Header */}
              <View style={HelpSupportStyles.header}>
                <TouchableOpacity onPress={onClose} style={HelpSupportStyles.closeButton}>
                  <Text style={HelpSupportStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={HelpSupportStyles.headerTitle}>Help & Support</Text>
              </View>

              {/* Help & Support Content */}
              <View>

                <TouchableOpacity 
                  style={[
                    HelpSupportStyles.accountItem, 
                    showFaq && HelpSupportStyles.activeAccountItem
                  ]}
                  onPress={toggleShowFaq}
                >
                  <Text
                    style={[
                      HelpSupportStyles.accountLabel,
                      showFaq && HelpSupportStyles.activeAccountLabel,
                    ]}
                  >
                    {showFaq ? "Close Frequently Asked Questions" : "Show Frequently Asked Questions"}
                  </Text>
                  <Text
                    style={[
                      HelpSupportStyles.chevron,
                      showFaq && HelpSupportStyles.activeChevron,
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>

                {showFaq && (
                  <FaqScreen/>
                )}
                <TouchableOpacity 
                  style={[HelpSupportStyles.accountItem, showContactUs && HelpSupportStyles.activeAccountItem]}
                  onPress={toggleContactSupport}
                >
                  <Text style={[HelpSupportStyles.accountLabel, showContactUs && HelpSupportStyles.activeChevron,]}>Contact Support</Text>
                  <Text style={[HelpSupportStyles.chevron, showContactUs && HelpSupportStyles.activeChevron,]}>›</Text>
                </TouchableOpacity> 

                {showContactUs && contactUs()}

                <TouchableOpacity 
                  style={[HelpSupportStyles.accountItem, showTerms && HelpSupportStyles.activeAccountItem]}
                  onPress={toggleTerms}
                >
                  <Text style={[HelpSupportStyles.accountLabel, showTerms && HelpSupportStyles.activeChevron,]}>Terms of Service</Text>
                  <Text style={[HelpSupportStyles.chevron, showTerms && HelpSupportStyles.activeChevron,]}>›</Text>
                </TouchableOpacity> 
                {showTerms && (
                  <TermsOfService/>
                )}                  
              </View>
            </ScrollView>
          </View>            
        </Modal>
    );
};