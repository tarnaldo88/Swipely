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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getAuthService } from "../../services";
import { User, CategoryPreferences, MainStackParamList } from "../../types";
import { SafeAreaView } from "react-native-safe-area-context/lib/typescript/src/SafeAreaView";

type ProfileScreenNavigationProp = StackNavigationProp<MainStackParamList>;

interface AccountSettingsScreenProps {
  navigation: any;
  route?: {
    params?: {
      isInitialSetup?: boolean;
    };
  };
}

interface AccountSettings {
  selected: boolean;
}

export const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = () => {
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    if(!user) {

    } 

    return(
        <SafeAreaView>
            <View>

            </View>
        </SafeAreaView>
    );
};