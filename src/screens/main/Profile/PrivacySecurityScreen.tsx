import React, { useCallback, useState, useRef } from "react";
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
  Switch,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getAuthService } from "../../../services";
import { User, CategoryPreferences, MainStackParamList } from "../../../types";
import { SafeAreaView } from 'react-native-safe-area-context';

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface PrivacySecurityScreenProps {
  navigation: any;
  route?: {
    params?: {
      isInitialSetup?: boolean;
    };
  };
}



export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = () => {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [credentials, updateCredentials] = useState<PasswordChange>({
            oldPassword: "",
            newPassword: "",
        });

    const togglePasswordChange = () => {
    return(
        <View>
            <TextInput
            style={styles.input}
            placeholder="Password"
            value={credentials.password}
            onChangeText={(value) => updateCredentials("password", value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={credentials.password}
            onChangeText={(value) => updateCredentials("password", value)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
    );
};
    return(
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <TouchableOpacity style={styles.securityItem} onPress={() => {togglePasswordChange()}}>
                    <Text style={styles.accountLabel}>Change Password</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#230234",
  },
  scrollView: {
    flex: 1,
  },
  securityItem: {
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
});