import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getAuthService } from '../services';
import { User } from '../types';

interface NavigationGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Navigation guard component that protects routes based on authentication status
 * Requirements: 1.1, 1.5, 2.1
 */
export const NavigationGuard: React.FC<NavigationGuardProps> = ({
  children,
  requireAuth = true,
  fallback,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authService = getAuthService();
        const currentUser = authService.getCurrentUser();
        
        if (currentUser && requireAuth) {
          // Validate session for authenticated routes
          const isValid = await authService.isSessionValid();
          if (!isValid) {
            await authService.signOut();
            setUser(null);
          } else {
            setUser(currentUser);
          }
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Navigation guard auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requireAuth]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.unauthorizedContainer}>
        <Text style={styles.unauthorizedText}>Authentication required</Text>
      </View>
    );
  }

  // Check if user should not be authenticated (e.g., login screen)
  if (!requireAuth && user) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.alreadyAuthContainer}>
        <Text style={styles.alreadyAuthText}>Already authenticated</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#6C757D',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#DC3545',
  },
  alreadyAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  alreadyAuthText: {
    fontSize: 16,
    color: '#28A745',
  },
});