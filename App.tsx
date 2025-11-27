import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Text, AppState, AppStateStatus } from "react-native";
import { Provider } from "react-redux";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { createStackNavigator } from "@react-navigation/stack";
import { store } from "./src/store";
import { AuthNavigator } from "./src/navigation/AuthNavigator";
import { MainNavigator } from "./src/navigation/MainNavigator";
import { LinkingConfiguration } from "./src/navigation/LinkingConfiguration";
import { navigationService } from "./src/navigation/NavigationService";
import { getAuthService, initializeAuthService } from "./src/services";
import { User, RootStackParamList } from "./src/types";

const RootStack = createStackNavigator<RootStackParamList>();

// Global navigation reference
const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList> | null>();
let isNavigationReady = false;

// Navigation ready handler
const onNavigationReady = () => {
  isNavigationReady = true;
  if (navigationRef.current) {
    navigationService.setNavigationRef(navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>);
  }
};

// Navigation state change handler for analytics/logging
const onNavigationStateChange = (state: any) => {
  if (isNavigationReady) {
    // Log navigation events for analytics
    const currentRoute = navigationRef.current?.getCurrentRoute();
    if (currentRoute) {
      console.log('Navigation:', currentRoute.name, currentRoute.params);
    }
  }
};

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
  }, []);

  // Handle app state changes for session validation
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        try {
          const authService = getAuthService();
          const isValid = await authService.isSessionValid();
          if (!isValid) {
            // Session expired, sign out user
            await authService.signOut();
          }
        } catch (error) {
          console.error('Error validating session:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false, // Disable swipe back to prevent accidental navigation
      }}
    >
      {user ? (
        // User is authenticated - show main app
        <RootStack.Screen 
          name="Main" 
          component={MainNavigator}
          options={{
            animationTypeForReplace: isLoading ? 'pop' : 'push',
          }}
        />
      ) : (
        // User is not authenticated - show auth flow
        <RootStack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            animationTypeForReplace: isLoading ? 'pop' : 'push',
          }}
        />
      )}
    </RootStack.Navigator>
  );
}



export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <NavigationContainer 
          linking={LinkingConfiguration}
          onReady={onNavigationReady}
          onStateChange={onNavigationStateChange}
          ref={navigationRef}
        >
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
