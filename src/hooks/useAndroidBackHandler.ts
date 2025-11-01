import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { AndroidBackHandler, AndroidToast } from '../utils/AndroidUtils';

export interface AndroidBackHandlerOptions {
  onBackPress?: () => boolean;
  showExitConfirmation?: boolean;
  exitMessage?: string;
  preventDefaultBack?: boolean;
}

export const useAndroidBackHandler = (options: AndroidBackHandlerOptions = {}) => {
  const {
    onBackPress,
    showExitConfirmation = false,
    exitMessage = 'Press back again to exit',
    preventDefaultBack = false,
  } = options;

  const handleBackPress = useCallback((): boolean => {
    // If custom handler is provided, use it
    if (onBackPress) {
      return onBackPress();
    }

    // If exit confirmation is enabled
    if (showExitConfirmation) {
      AndroidToast.show(exitMessage, 'SHORT');
      return true; // Prevent default back action
    }

    // If we want to prevent default back behavior
    if (preventDefaultBack) {
      return true;
    }

    // Allow default back action
    return false;
  }, [onBackPress, showExitConfirmation, exitMessage, preventDefaultBack]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const removeListener = AndroidBackHandler.addListener(handleBackPress);

    return () => {
      removeListener();
    };
  }, [handleBackPress]);

  return {
    isAndroid: Platform.OS === 'android',
  };
};

// Specific hook for handling exit confirmation
export const useAndroidExitConfirmation = (exitMessage?: string) => {
  let backPressCount = 0;
  let backPressTimer: NodeJS.Timeout | null = null;

  const handleExitConfirmation = useCallback((): boolean => {
    if (backPressCount === 0) {
      backPressCount = 1;
      AndroidToast.show(exitMessage || 'Press back again to exit', 'SHORT');
      
      // Reset counter after 2 seconds
      backPressTimer = setTimeout(() => {
        backPressCount = 0;
      }, 2000);
      
      return true; // Prevent exit
    } else {
      // Second press within 2 seconds - allow exit
      if (backPressTimer) {
        clearTimeout(backPressTimer);
      }
      return false; // Allow exit
    }
  }, [exitMessage]);

  useAndroidBackHandler({
    onBackPress: handleExitConfirmation,
  });

  return {
    isAndroid: Platform.OS === 'android',
  };
};

// Hook for navigation-aware back handling
export const useAndroidNavigationBackHandler = (
  navigation: any,
  customHandler?: () => boolean
) => {
  const handleNavigationBack = useCallback((): boolean => {
    // If custom handler is provided and returns true, prevent default
    if (customHandler && customHandler()) {
      return true;
    }

    // If we can go back in navigation stack
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true; // Prevent default back action
    }

    // Allow default back action (exit app)
    return false;
  }, [navigation, customHandler]);

  useAndroidBackHandler({
    onBackPress: handleNavigationBack,
  });

  return {
    isAndroid: Platform.OS === 'android',
    canGoBack: navigation.canGoBack(),
  };
};