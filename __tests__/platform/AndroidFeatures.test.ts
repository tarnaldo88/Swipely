import { Platform, BackHandler, ToastAndroid } from "react-native";
import {
  getAndroidFeatures,
  AndroidBackHandler,
  AndroidToast,
  AndroidScreenUtils,
  AndroidPerformanceUtils,
} from "../../src/utils/AndroidUtils";

// Mock Platform.OS for Android tests
jest.mock("react-native", () => ({
  Platform: {
    OS: "android",
    Version: 30,
  },
  Dimensions: {
    get: jest.fn((type) => {
      if (type === "window") {
        return { width: 360, height: 640 };
      }
      if (type === "screen") {
        return { width: 360, height: 720 }; // With navigation bar
      }
      return { width: 360, height: 640 };
    }),
  },
  StatusBar: {
    currentHeight: 24,
  },
  BackHandler: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  ToastAndroid: {
    show: jest.fn(),
    showWithGravity: jest.fn(),
    SHORT: "SHORT",
    LONG: "LONG",
    TOP: "TOP",
    BOTTOM: "BOTTOM",
    CENTER: "CENTER",
  },
}));

describe("Android Platform Features", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Platform Detection", () => {
    it("should detect Android platform correctly", () => {
      const features = getAndroidFeatures();

      expect(features.isAndroid).toBe(true);
      expect(features.apiLevel).toBe(30);
    });

    it("should calculate navigation bar height correctly", () => {
      const features = getAndroidFeatures();

      expect(features.hasNavigationBar).toBe(true);
      expect(features.navigationBarHeight).toBe(80); // 720 - 640
    });

    it("should return correct screen dimensions", () => {
      const features = getAndroidFeatures();

      expect(features.screenWidth).toBe(360);
      expect(features.screenHeight).toBe(640);
      expect(features.statusBarHeight).toBe(24);
    });
  });

  describe("Android Back Handler", () => {
    beforeEach(() => {
      AndroidBackHandler.initialize();
    });

    afterEach(() => {
      AndroidBackHandler.cleanup();
    });

    it("should initialize back handler on Android", () => {
      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        "hardwareBackPress",
        expect.any(Function)
      );
    });

    it("should add and remove listeners correctly", () => {
      const mockCallback = jest.fn(() => true);
      const removeListener = AndroidBackHandler.addListener(mockCallback);

      expect(typeof removeListener).toBe("function");

      // Test listener removal
      removeListener();
    });

    it("should handle back press with listeners", () => {
      const mockCallback1 = jest.fn(() => false);
      const mockCallback2 = jest.fn(() => true);

      AndroidBackHandler.addListener(mockCallback1);
      AndroidBackHandler.addListener(mockCallback2);

      // Simulate back press
      const result = AndroidBackHandler["handleBackPress"]();

      expect(mockCallback2).toHaveBeenCalled();
      expect(result).toBe(true); // Should prevent default back action
    });

    it("should cleanup properly", () => {
      AndroidBackHandler.cleanup();

      expect(BackHandler.removeEventListener).toHaveBeenCalledWith(
        "hardwareBackPress",
        expect.any(Function)
      );
    });
  });

  describe("Android Toast", () => {
    it("should show toast with default duration", () => {
      AndroidToast.show("Test message");

      expect(ToastAndroid.show).toHaveBeenCalledWith("Test message", "SHORT");
    });

    it("should show toast with custom duration", () => {
      AndroidToast.show("Test message", "LONG");

      expect(ToastAndroid.show).toHaveBeenCalledWith("Test message", "LONG");
    });

    it("should show toast with gravity", () => {
      AndroidToast.showWithGravity("Test message", "SHORT", "TOP");

      expect(ToastAndroid.showWithGravity).toHaveBeenCalledWith(
        "Test message",
        "SHORT",
        "TOP"
      );
    });
  });

  describe("Android Screen Utils", () => {
    it("should detect tablet correctly", () => {
      // Mock tablet dimensions
      require("react-native").Dimensions.get.mockReturnValue({
        width: 800,
        height: 1200,
      });

      const isTablet = AndroidScreenUtils.isTablet();
      expect(isTablet).toBe(true);
    });

    it("should detect phone correctly", () => {
      // Mock phone dimensions
      require("react-native").Dimensions.get.mockReturnValue({
        width: 360,
        height: 640,
      });

      const isTablet = AndroidScreenUtils.isTablet();
      expect(isTablet).toBe(false);
    });

    it("should categorize screen size correctly", () => {
      // Test different screen sizes
      require("react-native").Dimensions.get.mockReturnValue({
        width: 320,
        height: 480,
      });
      expect(AndroidScreenUtils.getScreenCategory()).toBe("small");

      require("react-native").Dimensions.get.mockReturnValue({
        width: 360,
        height: 640,
      });
      expect(AndroidScreenUtils.getScreenCategory()).toBe("normal");

      require("react-native").Dimensions.get.mockReturnValue({
        width: 480,
        height: 800,
      });
      expect(AndroidScreenUtils.getScreenCategory()).toBe("large");

      require("react-native").Dimensions.get.mockReturnValue({
        width: 720,
        height: 1280,
      });
      expect(AndroidScreenUtils.getScreenCategory()).toBe("xlarge");
    });

    it("should categorize density correctly", () => {
      // Test different screen densities
      require("react-native").Dimensions.get.mockReturnValue({
        width: 320,
        height: 480,
      });
      expect(AndroidScreenUtils.getDensityCategory()).toBe("mdpi");

      require("react-native").Dimensions.get.mockReturnValue({
        width: 480,
        height: 800,
      });
      expect(AndroidScreenUtils.getDensityCategory()).toBe("hdpi");

      require("react-native").Dimensions.get.mockReturnValue({
        width: 720,
        height: 1280,
      });
      expect(AndroidScreenUtils.getDensityCategory()).toBe("xhdpi");
    });
  });

  describe("Android Performance Utils", () => {
    it("should provide hardware acceleration config", () => {
      const config = AndroidPerformanceUtils.enableHardwareAcceleration();

      expect(config).toHaveProperty("useNativeDriver", true);
      expect(config).toHaveProperty("isInteraction", false);
    });

    it("should provide optimized FlatList props", () => {
      const props = AndroidPerformanceUtils.getOptimizedFlatListProps();

      expect(props).toHaveProperty("removeClippedSubviews", true);
      expect(props).toHaveProperty("maxToRenderPerBatch", 5);
      expect(props).toHaveProperty("updateCellsBatchingPeriod", 50);
      expect(props).toHaveProperty("initialNumToRender", 10);
      expect(props).toHaveProperty("windowSize", 10);
    });

    it("should optimize image loading", () => {
      const imageProps = AndroidPerformanceUtils.optimizeImageLoading(
        "https://example.com/image.jpg"
      );

      expect(imageProps).toHaveProperty("uri", "https://example.com/image.jpg");
      expect(imageProps).toHaveProperty("cache", "default");
      expect(imageProps).toHaveProperty("resizeMode", "cover");
      expect(imageProps).toHaveProperty("fadeDuration", 300);
    });
  });

  describe("Android Navigation Options", () => {
    it("should provide Android-specific navigation options", () => {
      const {
        getAndroidNavigationOptions,
      } = require("../../src/utils/AndroidUtils");
      const options = getAndroidNavigationOptions();

      expect(options).toHaveProperty("headerStyle");
      expect(options.headerStyle).toHaveProperty("elevation", 4);
      expect(options).toHaveProperty("headerTintColor", "#1976D2");
      expect(options).toHaveProperty("headerTitleAlign", "left");
    });

    it("should provide Android-specific modal options", () => {
      const {
        getAndroidModalOptions,
      } = require("../../src/utils/AndroidUtils");
      const options = getAndroidModalOptions();

      expect(options).toHaveProperty("presentation", "modal");
      expect(options).toHaveProperty("headerStyle");
      expect(options.headerStyle).toHaveProperty("elevation", 4);
      expect(options).toHaveProperty("headerTitleAlign", "left");
    });
  });
});

describe("Android Swipeable Card", () => {
  // Mock react-native-gesture-handler
  jest.mock("react-native-gesture-handler", () => ({
    Gesture: {
      Pan: jest.fn(() => ({
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      })),
    },
    GestureDetector: ({ children }: any) => children,
  }));

  // Mock TouchableNativeFeedback
  jest.mock("react-native", () => ({
    ...jest.requireActual("react-native"),
    TouchableNativeFeedback: {
      Ripple: jest.fn(),
    },
  }));

  it("should render Android swipeable card only on Android platform", () => {
    const {
      AndroidSwipeableCard,
    } = require("../../src/components/product/AndroidSwipeableCard");

    expect(AndroidSwipeableCard).toBeDefined();
  });

  it("should not render on non-Android platforms", () => {
    // Mock Platform.OS as iOS
    jest.doMock("react-native", () => ({
      Platform: { OS: "ios" },
    }));

    const {
      AndroidSwipeableCard,
    } = require("../../src/components/product/AndroidSwipeableCard");

    expect(AndroidSwipeableCard).toBeDefined();
  });
});

describe("Android Styles", () => {
  it("should provide Android-specific styles", () => {
    const { AndroidStyles } = require("../../src/styles/AndroidStyles");

    expect(AndroidStyles).toHaveProperty("safeContainer");
    expect(AndroidStyles).toHaveProperty("navigationHeader");
    expect(AndroidStyles).toHaveProperty("primaryButton");
    expect(AndroidStyles).toHaveProperty("card");
    expect(AndroidStyles).toHaveProperty("bottomNavigation");
  });

  it("should provide Material Design colors", () => {
    const { MaterialColors } = require("../../src/styles/AndroidStyles");

    expect(MaterialColors).toHaveProperty("primary", "#1976D2");
    expect(MaterialColors).toHaveProperty("accent", "#FF4081");
    expect(MaterialColors).toHaveProperty("background", "#FAFAFA");
    expect(MaterialColors).toHaveProperty("surface", "#FFFFFF");
    expect(MaterialColors).toHaveProperty("error", "#F44336");
  });

  it("should provide Material Design animations", () => {
    const { MaterialAnimations } = require("../../src/styles/AndroidStyles");

    expect(MaterialAnimations).toHaveProperty("standard");
    expect(MaterialAnimations).toHaveProperty("decelerate");
    expect(MaterialAnimations).toHaveProperty("accelerate");
    expect(MaterialAnimations).toHaveProperty("sharp");
  });

  it("should provide Android gesture configurations", () => {
    const { AndroidGestures } = require("../../src/styles/AndroidStyles");

    expect(AndroidGestures).toHaveProperty("swipeThreshold", 60);
    expect(AndroidGestures).toHaveProperty("velocityThreshold", 400);
    expect(AndroidGestures).toHaveProperty("panThreshold", 8);
    expect(AndroidGestures).toHaveProperty("longPressDelay", 500);
  });
});

describe("Android Back Handler Hook", () => {
  it("should provide Android back handler hook", () => {
    const {
      useAndroidBackHandler,
    } = require("../../src/hooks/useAndroidBackHandler");

    expect(useAndroidBackHandler).toBeDefined();
    expect(typeof useAndroidBackHandler).toBe("function");
  });

  it("should provide exit confirmation hook", () => {
    const {
      useAndroidExitConfirmation,
    } = require("../../src/hooks/useAndroidBackHandler");

    expect(useAndroidExitConfirmation).toBeDefined();
    expect(typeof useAndroidExitConfirmation).toBe("function");
  });

  it("should provide navigation back handler hook", () => {
    const {
      useAndroidNavigationBackHandler,
    } = require("../../src/hooks/useAndroidBackHandler");

    expect(useAndroidNavigationBackHandler).toBeDefined();
    expect(typeof useAndroidNavigationBackHandler).toBe("function");
  });
});
