import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import Accordion from "react-native-collapsible/Accordion";
import { FaqStyles } from "@/screens/Styles/ProfileStyles";

const SECTIONS = [
  {
    title: "First Question",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  {
    title: "Second Question",
    content: "Suspendisse potenti. Integer euismod orci vel ex dignissim.",
  },
  {
    title: "Third Question",
    content: "Suspendisse potenti. Integer euismod orci vel ex dignissim.",
  },
  {
    title: "Fourth Question",
    content: "Suspendisse potenti. Integer euismod orci vel ex dignissim.",
  },
];

export const FaqScreen: React.FC = () => {
  // ✅ useState replaces `state = { activeSections: [] }`
  const [activeSections, setActiveSections] = useState<number[]>([]);

  // ✅ Section title (optional — not always needed)
  const renderSectionTitle = (section: any) => (
    <View style={FaqStyles.sectionTitle}>
      <Text>{section.title}</Text>
    </View>
  );

  const renderHeader = (section: any, _: number, isActive: boolean) => (
    <View style={[FaqStyles.header, isActive ? FaqStyles.headerActive : null]}>
      <Text style={FaqStyles.headerText}>{section.title}</Text>
    </View>
  );

  const renderContent = (section: any) => (
    <View style={FaqStyles.content}>
      <Text style={FaqStyles.contentText}>{section.content}</Text>
    </View>
  );

  const updateSections = (sections: number[]) => {
    setActiveSections(sections);
  };

  return (
    <ScrollView style={FaqStyles.container}>
      <Accordion
        sections={SECTIONS}
        activeSections={activeSections}
        renderSectionTitle={renderSectionTitle}
        renderHeader={renderHeader}
        renderContent={renderContent}
        onChange={updateSections}
        touchableComponent={TouchableOpacity}
        expandMultiple={false} // allow only one open at a time
        underlayColor="transparent"
      />
    </ScrollView>
  );
};