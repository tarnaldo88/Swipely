import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  Pressable,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// Limit image width for large screens
const IMAGE_WIDTH = Math.min(screenWidth, 500);
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
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(0);

  const handleScroll = useCallback((event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / IMAGE_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, images.length]);

  const handleIndexChange = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentIndex(newIndex);
    }
  }, [images.length]);

  const handleImagePress = useCallback((index: number) => {
    setZoomedImageIndex(index);
    setShowZoomModal(true);
  }, []);

  const handleCloseZoom = useCallback(() => {
    setShowZoomModal(false);
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
    <>
      <View style={[styles.container, { height }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={IMAGE_WIDTH}
          decelerationRate="fast"
        >
          {images.map((imageUrl, index) => (
            <TouchableOpacity
              key={`image-${index}`}
              style={[styles.imageContainer, { width: IMAGE_WIDTH, height }]}
              onPress={() => handleImagePress(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrl }}
                style={[styles.image, { height, width: IMAGE_WIDTH }]}
                resizeMode="contain"
                defaultSource={require('../../../assets/icon.png')}
              />
            </TouchableOpacity>
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

      {/* Tap to zoom hint */}
      <View style={styles.zoomHintContainer}>
        <Text style={styles.zoomHintText}>Tap image to enlarge</Text>
      </View>
      </View>

      {/* Zoom Modal */}
      <Modal
        visible={showZoomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseZoom}
      >
        <Pressable style={styles.zoomModalOverlay} onPress={handleCloseZoom}>
          <View style={styles.zoomModalContent}>
            <TouchableOpacity style={styles.zoomCloseButton} onPress={handleCloseZoom}>
              <Text style={styles.zoomCloseButtonText}>✕</Text>
            </TouchableOpacity>
            
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.zoomScrollContent}
            >
              {images.map((imageUrl, index) => (
                <View key={`zoom-${index}`} style={styles.zoomImageContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.zoomImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            {images.length > 1 && (
              <View style={styles.zoomCounterContainer}>
                <Text style={styles.zoomCounterText}>
                  {zoomedImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#221e27',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#221e27',
    position: 'relative',
    maxWidth: 500,
  },
  image: {
    backgroundColor: 'transparent',
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
  zoomHintContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  zoomHintText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  zoomCloseButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  zoomScrollContent: {
    alignItems: 'center',
  },
  zoomImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  zoomCounterContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  zoomCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});