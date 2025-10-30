import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;
const SWIPE_THRESHOLD = screenWidth * 0.2;

interface ImageGalleryProps {
  images: string[];
  height?: number;
  enableLazyLoading?: boolean;
  preloadRadius?: number;
}

interface OptimizedImageProps {
  uri: string;
  style: any;
  resizeMode: "cover" | "contain" | "stretch" | "repeat" | "center";
  shouldLoad: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(
  ({ uri, style, resizeMode, shouldLoad }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const handleLoadStart = useCallback(() => {
      setLoading(true);
      setError(false);
    }, []);

    const handleLoadEnd = useCallback(() => {
      setLoading(false);
    }, []);

    const handleError = useCallback(() => {
      setLoading(false);
      setError(true);
    }, []);

    if (!shouldLoad) {
      return (
        <View style={[style, styles.placeholderImage]}>
          <ActivityIndicator size="small" color="#999999" />
        </View>
      );
    }

    return (
      <View style={style}>
        <Image
          source={{ uri }}
          style={style}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          // Enable caching
          cache="force-cache"
        />
        {loading && (
          <View style={[styles.loadingOverlay, style]}>
            <ActivityIndicator size="small" color="#999999" />
          </View>
        )}
        {error && (
          <View style={[styles.errorOverlay, style]}>
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        )}
      </View>
    );
  }
);

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  height = IMAGE_HEIGHT,
  enableLazyLoading = true,
  preloadRadius = 1,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  // Memoize which images should be loaded based on current index and preload radius
  const shouldLoadImage = useMemo(() => {
    if (!enableLazyLoading) {
      return images.map(() => true);
    }

    return images.map((_, index) => {
      const distance = Math.abs(index - currentIndex);
      return distance <= preloadRadius;
    });
  }, [currentIndex, preloadRadius, enableLazyLoading, images.length]);

  const handleIndexChange = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
        scrollViewRef.current?.scrollTo({
          x: newIndex * screenWidth,
          animated: true,
        });
      }
    },
    [images.length]
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;

      // Add subtle scale effect
      const progress = Math.abs(event.translationX) / screenWidth;
      scale.value = 1 - progress * 0.05;
    },
    onEnd: (event) => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;

      if (shouldSwipeLeft && currentIndex < images.length - 1) {
        runOnJS(handleIndexChange)(currentIndex + 1);
      } else if (shouldSwipeRight && currentIndex > 0) {
        runOnJS(handleIndexChange)(currentIndex - 1);
      }

      // Reset animation values
      translateX.value = withSpring(0);
      scale.value = withSpring(1);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { scale: scale.value }],
    };
  });

  const handleScroll = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(contentOffsetX / screenWidth);
      if (
        newIndex !== currentIndex &&
        newIndex >= 0 &&
        newIndex < images.length
      ) {
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, images.length]
  );

  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>No images available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.galleryContainer, animatedStyle]}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((imageUrl, index) => (
              <View
                key={index}
                style={[styles.imageContainer, { width: screenWidth }]}
              >
                <OptimizedImage
                  uri={imageUrl}
                  style={[styles.image, { height }]}
                  resizeMode="cover"
                  shouldLoad={shouldLoadImage[index]}
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>

      {/* Image Indicators */}
      {images.length > 1 && (
        <View style={styles.indicatorContainer}>
          {images.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator,
              ]}
              onPress={() => handleIndexChange(index)}
            />
          ))}
        </View>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={() => handleIndexChange(currentIndex - 1)}
            >
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
          )}

          {currentIndex < images.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={() => handleIndexChange(currentIndex + 1)}
            >
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#F5F5F5",
  },
  galleryContainer: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    backgroundColor: "#F0F0F0",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999999",
    fontWeight: "500",
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#FFFFFF",
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  counterContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20,
  },
  prevButton: {
    left: 16,
  },
  nextButton: {
    right: 16,
  },
  navButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  placeholderImage: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(240, 240, 240, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
  },
});
