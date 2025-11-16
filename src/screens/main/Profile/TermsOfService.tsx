import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import Accordion from "react-native-collapsible/Accordion";
import { TermStyles } from "@/screens/Styles/ProfileStyles";

const MOCKTOS = [
  {
    title: "1. Introduction",
    content:
      "Welcome to our app! By using our services, you agree to comply with and be bound by these Terms of Service. Please read them carefully before using our application."
  },
  {
    title: "2. Eligibility",
    content:
      "You must be at least 13 years old to use this service. By using the app, you confirm that you meet this requirement and have the legal capacity to enter into these Terms."
  },
  {
    title: "3. User Responsibilities",
    content:
      "You agree not to misuse the app or engage in any illegal or unauthorized activity. You are responsible for maintaining the confidentiality of your account and all activities under it."
  },
  {
    title: "4. Intellectual Property",
    content:
      "All content, design, logos, and code within the app are owned by the company or its licensors. You may not copy, modify, or distribute any materials without prior written consent."
  },
  {
    title: "5. Termination",
    content:
      "We may suspend or terminate your account at any time for violation of these Terms or for any behavior that may harm other users or the company’s interests."
  },
  {
    title: "6. Limitation of Liability",
    content:
      "We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Use the app at your own risk."
  },
  {
    title: "7. Changes to Terms",
    content:
      "We reserve the right to modify or update these Terms at any time. Continued use of the service after such changes constitutes acceptance of the new Terms."
  },
  {
    title: "8. Contact Information",
    content:
      "If you have questions or concerns about these Terms, please contact us at support@example.com."
  }
];

export const TermsOfService: React.FC = () => {
    const [activeSections, setActiveSections] = useState<number[]>([]);

    const renderHeader = (section: any, _: number, isActive: boolean) => (
        <View style={[TermStyles.header, isActive && TermStyles.activeHeader]}>
        <Text style={TermStyles.headerText}>{section.title}</Text>
        </View>
    );

    const renderContent = (section: any) => (
        <View style={TermStyles.content}>
        <Text style={TermStyles.contentText}>{section.content}</Text>
        </View>
    );
    
    return (
        <ScrollView>
            <Accordion 
                sections={MOCKTOS}
                activeSections={activeSections}
                renderHeader={renderHeader}
                renderContent={renderContent}
                onChange={(sections) => setActiveSections(sections)}
                underlayColor="transparent"
            />
        </ScrollView>
    );
};