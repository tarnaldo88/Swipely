import { Platform, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface PlatformFeatures {
  hasNotch: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
  statusBarHeight: number;
  bottomSafeArea: number;
}

export const getPlatformFeatures = (): PlatformFeatures => {
  const { width, height } = Dimensions.get('window');
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  
  // Detect iPhone X and newer models with notch
  const hasNotch = isIOS && (
    (width === 375 && height === 812) || // iPhone X, XS, 11 Pro
    (width === 414 && height === 896) || // iPhone XR, XS Max, 11, 11 Pro Max
    (width === 390 && height === 844) || // iPhone 12, 12 Pro
    (width === 428 && height === 926) || // iPhone 12 Pro Max
    (width === 375 && height === 812) || // iPhone 13 mini
    (width === 390 && height === 844) || // iPhone 13, 13 Pro
    (width === 428 && height === 926)    // iPhone 13 Pro Max
  );

  return {
    hasNotch,
    isIOS,
    isAndroid,
    screenWidth: width,
    screenHeight: height,
    statusBarHeight: isIOS ? (hasNotch ? 44 : 20) : 24,
    bottomSafeArea: hasNotch ? 34 : 0,
  };
};

export const HapticFeedback = {
  light: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  
  medium: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  
  heavy: () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  
  success: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  
  warning: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
  
  error: () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  
  selection: () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  },
};

export const getIOSNavigationOptions = () => ({
  headerStyle: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'transparent',
    elevation: 0,
  },
  headerTintColor: '#007AFF',
  headerTitleStyle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerBackTitle: '',
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 300,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 300,
      },
    },
  },
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
        ],
      },
    };
  },
});

export const getIOSModalOptions = () => ({
  presentation: 'modal' as const,
  headerStyle: {
    backgroundColor: '#F2F2F7',
  },
  headerTintColor: '#007AFF',
  headerTitleStyle: {
    fontSize: 17,
    fontWeight: '600',
  },
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        transform: [
          {
            translateY: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            }),
          },
        ],
      },
    };
  },
});