import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import { store } from "./src/store";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { MainNavigator } from "./src/navigation/MainNavigator";
import { getAuthService, initializeAuthService } from "./src/services";
import { User } from "./src/types";

const RootStack = createStackNavigator();

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initializeAuthService();
        const authService = getAuthService();

        // Set up auth state listener if the service supports it
        if (
          "onAuthStateChanged" in authService &&
          typeof authService.onAuthStateChanged === "function"
        ) {
          const unsubscribe = (authService as any).onAuthStateChanged(
            (user: User | null) => {
              setUser(user);
              setIsLoading(false);
            }
          );

          // Return cleanup function
          return unsubscribe;
        } else {
          // Fallback for services that don't support listeners
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize auth service:", error);
        setIsLoading(false);
      }
    };

    const cleanup = initializeAuth();

    // Return cleanup function
    return () => {
      if (cleanup && typeof cleanup.then === "function") {
        cleanup.then((unsubscribe: any) => {
          if (typeof unsubscribe === "function") {
            unsubscribe();
          }
        });
      }
    };
  }, []); // Remove user dependency to prevent infinite loops

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is authenticated - show main app
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        // User is not authenticated - show auth flow
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}



export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
  },

});
