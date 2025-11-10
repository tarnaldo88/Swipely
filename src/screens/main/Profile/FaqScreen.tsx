import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import Accordion from "react-native-collapsible/Accordion";

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
    <View style={styles.sectionTitle}>
      <Text>{section.title}</Text>
    </View>
  );

  const renderHeader = (section: any, _: number, isActive: boolean) => (
    <View style={[styles.header, isActive ? styles.headerActive : null]}>
      <Text style={styles.headerText}>{section.title}</Text>
    </View>
  );

  const renderContent = (section: any) => (
    <View style={styles.content}>
      <Text style={styles.contentText}>{section.content}</Text>
    </View>
  );

  const updateSections = (sections: number[]) => {
    setActiveSections(sections);
  };

  return (
    <ScrollView style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    backgroundColor: "#b8fcccff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerActive: {
    backgroundColor: "#3bfa8aff",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    backgroundColor: "#3f3939ff",
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: "#fff6f6ff",
    lineHeight: 20,
  },
  sectionTitle: {
    display: "none", // optional, can be removed
  },
});
