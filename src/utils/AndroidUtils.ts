import { Platform, BackHandler, ToastAndroid, Dimensions, StatusBar } from 'react-native';

export interface AndroidFeatures {
  isAndroid: boolean;
  apiLevel: number;
  screenWidth: number;
  screenHeight: number;
  statusBarHeight: number;
  navigationBarHeight: number;
  hasNavigationBar: boolean;
}

export const getAndroidFeatures = (): AndroidFeatures => {
  const { width, height } = Dimensions.get('window');
  const screenData = Dimensions.get('screen');
  const isAndroid = Platform.OS === 'android';
  
  // Estimate API level (in a real app, you'd use a native module)
  const apiLevel = Platform.Version as number;
  
  // Calculate navigation bar height
  const hasNavigationBar = screenData.height > height;
  const navigationBarHeight = hasNavigationBar ? screenData.height - height : 0;
  
  return {
    isAndroid,
    apiLevel,
    screenWidth: width,
    screenHeight: height,
    statusBarHeight: StatusBar.currentHeight || 24,
    navigationBarHeight,
    hasNavigationBar,
  };
};

export class AndroidBackHandler {
  private static listeners: (() => boolean)[] = [];
  private static isInitialized = false;

  static initialize() {
    if (Platform.OS !== 'android' || this.isInitialized) return;
    
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    this.isInitialized = true;
  }

  private static handleBackPress = (): boolean => {
    // Execute listeners in reverse order (last added first)
    for (let i = this.listeners.length - 1; i >= 0; i--) {
      const listener = this.listeners[i];
      if (listener()) {
        return true; // Prevent default back action
      }
    }
    return false; // Allow default back action
  };

  static addListener(callback: () => boolean): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  static cleanup() {
    if (Platform.OS !== 'android') return;
    
    (BackHandler as any).removeEventListener?.('hardwareBackPress', this.handleBackPress);
    this.listeners = [];
    this.isInitialized = false;
  }
}

export const AndroidToast = {
  show: (message: string, duration: 'SHORT' | 'LONG' = 'SHORT') => {
    if (Platform.OS !== 'android') return;
    
    const toastDuration = duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG;
    ToastAndroid.show(message, toastDuration);
  },
  
  showWithGravity: (
    message: string, 
    duration: 'SHORT' | 'LONG' = 'SHORT',
    gravity: 'TOP' | 'BOTTOM' | 'CENTER' = 'BOTTOM'
  ) => {
    if (Platform.OS !== 'android') return;
    
    const toastDuration = duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG;
    const toastGravity = {
      TOP: ToastAndroid.TOP,
      BOTTOM: ToastAndroid.BOTTOM,
      CENTER: ToastAndroid.CENTER,
    }[gravity];
    
    ToastAndroid.showWithGravity(message, toastDuration, toastGravity);
  },
};

export const getAndroidNavigationOptions = () => ({
  headerStyle: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: 'transparent',
  },
  headerTintColor: '#1976D2',
  headerTitleStyle: {
    fontSize: 20,
    fontWeight: '500',
  },
  headerTitleAlign: 'left' as const,
  gestureEnabled: true,
  gestureDirection: 'horizontal' as const,
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

export const getAndroidModalOptions = () => ({
  presentation: 'modal' as const,
  headerStyle: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
  },
  headerTintColor: '#1976D2',
  headerTitleStyle: {
    fontSize: 20,
    fontWeight: '500',
  },
  headerTitleAlign: 'left' as const,
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

// Android-specific screen size utilities
export const AndroidScreenUtils = {
  isTablet: () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    const smallestWidth = Math.min(width, height);
    
    // Consider it a tablet if smallest width is >= 600dp and aspect ratio is reasonable
    return smallestWidth >= 600 && aspectRatio < 2.0;
  },
  
  getScreenCategory: () => {
    const { width } = Dimensions.get('window');
    
    if (width < 360) return 'small';
    if (width < 480) return 'normal';
    if (width < 720) return 'large';
    return 'xlarge';
  },
  
  getDensityCategory: () => {
    // This would typically come from native modules
    // For now, we'll estimate based on screen dimensions
    const { width, height } = Dimensions.get('window');
    const screenSize = Math.sqrt(width * width + height * height);
    
    if (screenSize < 800) return 'mdpi';
    if (screenSize < 1200) return 'hdpi';
    if (screenSize < 1600) return 'xhdpi';
    if (screenSize < 2400) return 'xxhdpi';
    return 'xxxhdpi';
  },
};

// Android-specific performance optimizations
export const AndroidPerformanceUtils = {
  enableHardwareAcceleration: () => {
    // This would typically be done in native code
    // For React Native, we can optimize by using native driver
    return {
      useNativeDriver: true,
      isInteraction: false,
    };
  },
  
  getOptimizedFlatListProps: () => ({
    removeClippedSubviews: true,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 10,
    getItemLayout: (data: any, index: number) => ({
      length: 500, // Estimated item height
      offset: 500 * index,
      index,
    }),
  }),
  
  optimizeImageLoading: (uri: string) => ({
    uri,
    cache: 'default',
    resizeMode: 'cover' as const,
    fadeDuration: 300,
  }),
};

// Initialize Android-specific features
if (Platform.OS === 'android') {
  AndroidBackHandler.initialize();
}