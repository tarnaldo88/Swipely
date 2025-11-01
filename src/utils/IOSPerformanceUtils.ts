import { Platform, InteractionManager, LayoutAnimation } from 'react-native';

export class IOSPerformanceOptimizer {
  private static memoryWarningListeners: (() => void)[] = [];
  private static isLowMemoryMode = false;

  static initialize() {
    if (Platform.OS !== 'ios') return;

    // Monitor memory warnings (iOS specific)
    this.setupMemoryWarningListener();
  }

  private static setupMemoryWarningListener() {
    // In a real app, you would use native modules to listen for memory warnings
    // For now, we'll simulate memory management
    const checkMemoryUsage = () => {
      // Simulate memory pressure detection
      const memoryUsage = this.getEstimatedMemoryUsage();
      
      if (memoryUsage > 0.8) {
        this.handleMemoryWarning();
      }
    };

    setInterval(checkMemoryUsage, 30000); // Check every 30 seconds
  }

  private static getEstimatedMemoryUsage(): number {
    // This is a simplified estimation
    // In a real app, you would use native modules to get actual memory usage
    return Math.random() * 0.6 + 0.2; // Random value between 0.2 and 0.8
  }

  private static handleMemoryWarning() {
    console.log('iOS Memory Warning: Optimizing performance');
    this.isLowMemoryMode = true;
    
    // Notify all listeners
    this.memoryWarningListeners.forEach(listener => listener());
    
    // Reset low memory mode after some time
    setTimeout(() => {
      this.isLowMemoryMode = false;
    }, 10000);
  }

  static addMemoryWarningListener(callback: () => void) {
    this.memoryWarningListeners.push(callback);
    
    return () => {
      const index = this.memoryWarningListeners.indexOf(callback);
      if (index > -1) {
        this.memoryWarningListeners.splice(index, 1);
      }
    };
  }

  static isInLowMemoryMode(): boolean {
    return this.isLowMemoryMode;
  }

  // Optimized image loading for iOS
  static getOptimizedImageProps(uri: string, width: number, height: number) {
    if (Platform.OS !== 'ios') {
      return { uri };
    }

    return {
      uri,
      cache: this.isLowMemoryMode ? 'reload' : 'default',
      // iOS-specific optimizations
      resizeMode: 'cover' as const,
      fadeDuration: this.isLowMemoryMode ? 0 : 300,
    };
  }

  // Optimized list rendering for iOS
  static getOptimizedFlatListProps() {
    if (Platform.OS !== 'ios') {
      return {};
    }

    return {
      removeClippedSubviews: true,
      maxToRenderPerBatch: this.isLowMemoryMode ? 3 : 5,
      updateCellsBatchingPeriod: this.isLowMemoryMode ? 100 : 50,
      initialNumToRender: this.isLowMemoryMode ? 3 : 5,
      windowSize: this.isLowMemoryMode ? 5 : 10,
      getItemLayout: (data: any, index: number) => ({
        length: 500, // Estimated item height
        offset: 500 * index,
        index,
      }),
    };
  }

  // iOS-specific layout animations
  static configureLayoutAnimation(type: 'spring' | 'linear' | 'easeInEaseOut' = 'easeInEaseOut') {
    if (Platform.OS !== 'ios') return;

    const animations = {
      spring: LayoutAnimation.Presets.spring,
      linear: LayoutAnimation.Presets.linear,
      easeInEaseOut: LayoutAnimation.Presets.easeInEaseOut,
    };

    LayoutAnimation.configureNext(animations[type]);
  }

  // Optimized interaction handling
  static runAfterInteractions(callback: () => void): Promise<void> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        callback();
        resolve();
      });
    });
  }

  // Memory-efficient image caching
  static clearImageCache() {
    if (Platform.OS !== 'ios') return;
    
    // In a real app, you would clear the image cache here
    console.log('Clearing iOS image cache for memory optimization');
  }

  // Optimize gesture handling for iOS
  static getOptimizedGestureConfig() {
    if (Platform.OS !== 'ios') {
      return {};
    }

    return {
      enableTrackpadTwoFingerGesture: true,
      shouldCancelWhenOutside: true,
      hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
    };
  }

  // iOS-specific animation optimizations
  static getOptimizedAnimationConfig(isLowMemory: boolean = this.isLowMemoryMode) {
    if (Platform.OS !== 'ios') {
      return {};
    }

    return {
      useNativeDriver: true,
      duration: isLowMemory ? 150 : 300,
      tension: isLowMemory ? 150 : 100,
      friction: isLowMemory ? 8 : 7,
    };
  }

  // Cleanup resources
  static cleanup() {
    this.memoryWarningListeners = [];
    this.isLowMemoryMode = false;
  }
}

// iOS-specific memory management hooks
export const useIOSMemoryOptimization = () => {
  const [isLowMemory, setIsLowMemory] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const removeListener = IOSPerformanceOptimizer.addMemoryWarningListener(() => {
      setIsLowMemory(true);
      
      // Reset after optimization period
      setTimeout(() => setIsLowMemory(false), 5000);
    });

    return removeListener;
  }, []);

  return {
    isLowMemory,
    clearImageCache: IOSPerformanceOptimizer.clearImageCache,
    getOptimizedImageProps: IOSPerformanceOptimizer.getOptimizedImageProps,
    runAfterInteractions: IOSPerformanceOptimizer.runAfterInteractions,
  };
};

// Initialize the performance optimizer
if (Platform.OS === 'ios') {
  IOSPerformanceOptimizer.initialize();
}