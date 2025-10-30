import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

interface SimpleImageGalleryProps {
  images: string[];
  height?: number;
}

export const SimpleImageGallery: React.FC<SimpleImageGalleryProps> = ({
  images,
  height = IMAGE_HEIGHT,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({});

  const handleScroll = useCallback((event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / screenWidth);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, images.length]);

  const handleIndexChange = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  }, [images.length]);

  const handleImageLoadStart = useCallback((index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: true }));
  }, []);

  const handleImageLoadEnd = useCallback((index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: false }));
  }, []);

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
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((imageUrl, index) => (
          <View key={index} style={[styles.imageContainer, { width: screenWidth }]}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { height }]}
              resizeMode="cover"
              onLoadStart={() => handleImageLoadStart(index)}
              onLoadEnd={() => handleImageLoadEnd(index)}
            />
            {loadingStates[index] && (
              <View style={[styles.loadingOverlay, { height }]}>
                <ActivityIndicator size="small" color="#999999" />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    backgroundColor: '#F0F0F0',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '500',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  counterContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});