import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  PanResponder,
  Animated,
  ScrollView,
  StatusBar,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getAuthService } from "../../../services";
import { User, CategoryPreferences, MainStackParamList } from "../../../types";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { height: screenHeight } = Dimensions.get("window");

interface AccountSettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}


type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface AccountSettings {
  selected: boolean;
}

export const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Animation values for modal presentation
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  useEffect(() => {
        if (visible) {
            // Animate modal in
            translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
            opacity.value = withTiming(1, { duration: 300 });
        }
  }, [visible]);

  if(!user) {
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
      </View>
    </SafeAreaView>
  } 

  const handleClose = useCallback(() => {
        translateY.value = withTiming(screenHeight, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
            runOnJS(onClose)();
        });
    }, [onClose]);

  return(
    <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={false}
            onRequestClose={handleClose}
    >
        <ScrollView style={styles.scrollView}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Account Settings</Text>
            </View>
            {/* Account Settings options */}
            <View>
              <TouchableOpacity style={styles.accountItem}>
                <Text style={styles.accountLabel}>Option 1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.accountItem}>
                <Text style={styles.accountLabel}>Option 2</Text>
              </TouchableOpacity> 
              <TouchableOpacity style={styles.accountItem}>
                <Text style={styles.accountLabel}>Option 3</Text>
              </TouchableOpacity>                   
            </View>
        </ScrollView>
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
    backgroundColor: "#47006e",
    borderBottomWidth: 1,
    borderBottomColor: "#3a8004",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#eff7e9",
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