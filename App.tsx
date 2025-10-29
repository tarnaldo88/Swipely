import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import { store } from './src/store';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { getAuthService, initializeAuthService } from './src/services';
import { User } from './src/types';

const RootStack = createStackNavigator();

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initializeAuthService();
        const authService = getAuthService();
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth service:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

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
        // User is authenticated - show main app (placeholder for now)
        <RootStack.Screen name="Main" component={MainAppPlaceholder} />
      ) : (
        // User is not authenticated - show auth flow
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

// Placeholder component for the main app (will be implemented in future tasks)
function MainAppPlaceholder() {
  const handleSignOut = async () => {
    try {
      const authService = getAuthService();
      await authService.signOut();
      // In a real app, this would trigger a navigation reset
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={styles.mainContainer} testID="main-app-container">
      <Text style={styles.title} testID="main-app-title">Welcome to Swipely!</Text>
      <Text style={styles.subtitle} testID="main-app-subtitle">
        You are now authenticated. Main app features will be implemented in future tasks.
      </Text>
      <Text style={styles.signOutHint} onPress={handleSignOut}>
        Tap here to sign out (for testing)
      </Text>
      <StatusBar style="auto" />
    </View>
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  signOutHint: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    marginTop: 20,
  },
});
