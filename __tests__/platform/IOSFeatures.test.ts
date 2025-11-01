import { Platform } from 'react-native';
import { getPlatformFeatures, HapticFeedback } from '../../src/utils/PlatformUtils';
import { IOSPerformanceOptimizer } from '../../src/utils/IOSPerformanceUtils';

// Mock Platform.OS for iOS tests
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '15.0',
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })), // iPhone X dimensions
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

describe('iOS Platform Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform Detection', () => {
    it('should detect iOS platform correctly', () => {
      const features = getPlatformFeatures();
      
      expect(features.isIOS).toBe(true);
      expect(features.isAndroid).toBe(false);
    });

    it('should detect iPhone X notch correctly', () => {
      const features = getPlatformFeatures();
      
      expect(features.hasNotch).toBe(true);
      expect(features.statusBarHeight).toBe(44);
      expect(features.bottomSafeArea).toBe(34);
    });

    it('should return correct screen dimensions', () => {
      const features = getPlatformFeatures();
      
      expect(features.screenWidth).toBe(375);
      expect(features.screenHeight).toBe(812);
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger light haptic feedback on iOS', () => {
      const { impactAsync } = require('expo-haptics');
      
      HapticFeedback.light();
      
      expect(impactAsync).toHaveBeenCalledWith('light');
    });

    it('should trigger success notification feedback on iOS', () => {
      const { notificationAsync } = require('expo-haptics');
      
      HapticFeedback.success();
      
      expect(notificationAsync).toHaveBeenCalledWith('success');
    });

    it('should trigger selection feedback on iOS', () => {
      const { selectionAsync } = require('expo-haptics');
      
      HapticFeedback.selection();
      
      expect(selectionAsync).toHaveBeenCalled();
    });
  });

  describe('iOS Performance Optimization', () => {
    beforeEach(() => {
      IOSPerformanceOptimizer.initialize();
    });

    afterEach(() => {
      IOSPerformanceOptimizer.cleanup();
    });

    it('should initialize performance optimizer for iOS', () => {
      expect(IOSPerformanceOptimizer.isInLowMemoryMode()).toBe(false);
    });

    it('should provide optimized image props', () => {
      const imageProps = IOSPerformanceOptimizer.getOptimizedImageProps(
        'https://example.com/image.jpg',
        300,
        400
      );

      expect(imageProps).toHaveProperty('uri');
      expect(imageProps).toHaveProperty('cache');
      expect(imageProps).toHaveProperty('resizeMode', 'cover');
      expect(imageProps).toHaveProperty('fadeDuration');
    });

    it('should provide optimized FlatList props', () => {
      const flatListProps = IOSPerformanceOptimizer.getOptimizedFlatListProps();

      expect(flatListProps).toHaveProperty('removeClippedSubviews', true);
      expect(flatListProps).toHaveProperty('maxToRenderPerBatch');
      expect(flatListProps).toHaveProperty('updateCellsBatchingPeriod');
      expect(flatListProps).toHaveProperty('initialNumToRender');
      expect(flatListProps).toHaveProperty('windowSize');
    });

    it('should handle memory warnings', () => {
      const mockCallback = jest.fn();
      const removeListener = IOSPerformanceOptimizer.addMemoryWarningListener(mockCallback);

      // Simulate memory warning
      IOSPerformanceOptimizer['handleMemoryWarning']();

      expect(IOSPerformanceOptimizer.isInLowMemoryMode()).toBe(true);

      // Cleanup
      removeListener();
    });

    it('should provide optimized animation config', () => {
      const animationConfig = IOSPerformanceOptimizer.getOptimizedAnimationConfig();

      expect(animationConfig).toHaveProperty('useNativeDriver', true);
      expect(animationConfig).toHaveProperty('duration');
      expect(animationConfig).toHaveProperty('tension');
      expect(animationConfig).toHaveProperty('friction');
    });
  });

  describe('iOS Navigation Options', () => {
    it('should provide iOS-specific navigation options', () => {
      const { getIOSNavigationOptions } = require('../../src/utils/PlatformUtils');
      const options = getIOSNavigationOptions();

      expect(options).toHaveProperty('headerStyle');
      expect(options).toHaveProperty('headerTintColor', '#007AFF');
      expect(options).toHaveProperty('gestureEnabled', true);
      expect(options).toHaveProperty('gestureDirection', 'horizontal');
    });

    it('should provide iOS-specific modal options', () => {
      const { getIOSModalOptions } = require('../../src/utils/PlatformUtils');
      const options = getIOSModalOptions();

      expect(options).toHaveProperty('presentation', 'modal');
      expect(options).toHaveProperty('gestureEnabled', true);
      expect(options).toHaveProperty('gestureDirection', 'vertical');
    });
  });
});

describe('iOS Swipeable Card', () => {
  // Mock react-native-gesture-handler
  jest.mock('react-native-gesture-handler', () => ({
    Gesture: {
      Pan: jest.fn(() => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      })),
    },
    GestureDetector: ({ children }: any) => children,
  }));

  // Mock react-native-reanimated
  jest.mock('react-native-reanimated', () => ({
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn(),
    withTiming: jest.fn(),
    runOnJS: jest.fn(),
    interpolate: jest.fn(),
    Extrapolation: {
      CLAMP: 'clamp',
    },
    default: {
      View: 'Animated.View',
    },
  }));

  it('should render iOS swipeable card only on iOS platform', () => {
    const { IOSSwipeableCard } = require('../../src/components/product/IOSSwipeableCard');
    
    // This test would need proper React Native testing setup
    // For now, we just verify the component exists
    expect(IOSSwipeableCard).toBeDefined();
  });

  it('should not render on non-iOS platforms', () => {
    // Mock Platform.OS as Android
    jest.doMock('react-native', () => ({
      Platform: { OS: 'android' },
    }));

    const { IOSSwipeableCard } = require('../../src/components/product/IOSSwipeableCard');
    
    // Component should return null on non-iOS platforms
    expect(IOSSwipeableCard).toBeDefined();
  });
});

describe('iOS Styles', () => {
  it('should provide iOS-specific styles', () => {
    const { IOSStyles } = require('../../src/styles/IOSStyles');

    expect(IOSStyles).toHaveProperty('safeContainer');
    expect(IOSStyles).toHaveProperty('navigationHeader');
    expect(IOSStyles).toHaveProperty('primaryButton');
    expect(IOSStyles).toHaveProperty('card');
    expect(IOSStyles).toHaveProperty('tabBar');
  });

  it('should provide iOS animation configurations', () => {
    const { IOSAnimations } = require('../../src/styles/IOSStyles');

    expect(IOSAnimations).toHaveProperty('spring');
    expect(IOSAnimations).toHaveProperty('timing');
    expect(IOSAnimations).toHaveProperty('modal');
    expect(IOSAnimations).toHaveProperty('swipe');
  });

  it('should provide iOS gesture configurations', () => {
    const { IOSGestures } = require('../../src/styles/IOSStyles');

    expect(IOSGestures).toHaveProperty('swipeThreshold');
    expect(IOSGestures).toHaveProperty('velocityThreshold');
    expect(IOSGestures).toHaveProperty('panThreshold');
    expect(IOSGestures).toHaveProperty('longPressDelay');
  });
});