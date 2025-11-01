import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProductCard, MainStackParamList } from '../../types';
import { getSwipeActionService } from '../../services/SwipeActionService';
import { AddToCartButton } from './AddToCartButton';
import { ViewDetailsButton } from './ViewDetailsButton';
import { HapticFeedback, getPlatformFeatures } from '../../utils/PlatformUtils';
import { IOSStyles, IOSAnimations, IOSGestures } from '../../styles/IOSStyles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const SWIPE_THRESHOLD = screenWidth * 0.25;
const platformFeatures = getPlatformFeatures();

type SwipeableCardNavigationProp = StackNavigationProp<MainStackParamList>;

interface IOSSwipeableCardProps {
  product: ProductCard;
  userId: string;
  onSwipeLeft?: (productId: string) => void;
  onSwipeRight?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isTopCard?: boolean;
}

export const IOSSwipeableCard: React.FC<IOSSwipeableCardProps> = ({
  product,
  userId,
  onSwipeLeft,
  onSwipeRight,
  onAddToCart,
  onViewDetails,
  isTopCard = true,
}) => {
  const navigation = useNavigation<SwipeableCardNavigationProp>();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(isTopCard ? 1 : 0.95);
  const opacity = useSharedValue(isTopCard ? 1 : 0.8);
  const rotation = useSharedValue(0);

  const swipeActionService = getSwipeActionService(userId);

  const handleSwipeComplete = useCallback(
    async (direction: 'left' | 'right') => {
      try {
        // iOS-specific haptic feedback
        if (direction === 'left') {
          HapticFeedback.light();
          await swipeActionService.onSwipeLeft(product.id);
          onSwipeLeft?.(product.id);
        } else {
          HapticFeedback.success();
          await swipeActionService.onSwipeRight(product.id);
          onSwipeRight?.(product.id);
        }
      } catch (error) {
        HapticFeedback.error();
        console.error('Error handling swipe:', error);
      }
    },
    [product.id, swipeActionService, onSwipeLeft, onSwipeRight]
  );

  // iOS-specific gesture handling with improved physics
  const panGesture = Gesture.Pan()
    .onStart(() => {
      HapticFeedback.selection();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1; // Subtle vertical movement
      
      // iOS-style rotation based on horizontal movement
      rotation.value = interpolate(
        event.translationX,
        [-screenWidth / 2, 0, screenWidth / 2],
        [-15, 0, 15],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD || event.velocityX < -IOSGestures.velocityThreshold;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD || event.velocityX > IOSGestures.velocityThreshold;

      if (shouldSwipeLeft) {
        translateX.value = withTiming(-screenWidth * 1.5, IOSAnimations.timing);
        translateY.value = withTiming(-100, IOSAnimations.timing);
        opacity.value = withTiming(0, IOSAnimations.timing);
        rotation.value = withTiming(-30, IOSAnimations.timing);
        runOnJS(handleSwipeComplete)('left');
      } else if (shouldSwipeRight) {
        translateX.value = withTiming(screenWidth * 1.5, IOSAnimations.timing);
        translateY.value = withTiming(-100, IOSAnimations.timing);
        opacity.value = withTiming(0, IOSAnimations.timing);
        rotation.value = withTiming(30, IOSAnimations.timing);
        runOnJS(handleSwipeComplete)('right');
      } else {
        // iOS-style spring animation back to center
        translateX.value = withSpring(0, IOSAnimations.spring);
        translateY.value = withSpring(0, IOSAnimations.spring);
        rotation.value = withSpring(0, IOSAnimations.spring);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const likeOpacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: likeOpacity,
    };
  });

  const skipOverlayStyle = useAnimatedStyle(() => {
    const skipOpacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: skipOpacity,
    };
  });

  const handleAddToCart = useCallback(async () => {
    try {
      HapticFeedback.medium();
      await swipeActionService.onAddToCart(product.id);
      onAddToCart?.(product.id);
    } catch (error) {
      HapticFeedback.error();
      console.error('Error handling add to cart:', error);
    }
  }, [product.id, swipeActionService, onAddToCart]);

  const handleViewDetails = useCallback(async () => {
    try {
      HapticFeedback.light();
      await swipeActionService.onViewDetails(product.id);
      navigation.navigate('ProductDetails', { 
        productId: product.id, 
        product: product 
      });
      onViewDetails?.(product.id);
    } catch (error) {
      console.error('Error handling view details:', error);
    }
  }, [product, swipeActionService, navigation, onViewDetails]);

  const primaryImage = product.imageUrls[0] || 'https://via.placeholder.com/300x400';
  const formattedPrice = `${product.currency}${product.price.toFixed(2)}`;

  if (Platform.OS !== 'ios') {
    return null; // This component is iOS-specific
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        <Pressable style={[styles.card, IOSStyles.card]} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: primaryImage }} style={styles.productImage} />
            
            {/* iOS-style Swipe Overlays */}
            <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
              <View style={styles.overlayContent}>
                <Text style={styles.overlayEmoji}>💚</Text>
                <Text style={styles.overlayText}>LIKE</Text>
              </View>
            </Animated.View>
            
            <Animated.View style={[styles.overlay, styles.skipOverlay, skipOverlayStyle]}>
              <View style={styles.overlayContent}>
                <Text style={styles.overlayEmoji}>👎</Text>
                <Text style={styles.overlayText}>SKIP</Text>
              </View>
            </Animated.View>
          </View>

          {/* Product Info with iOS styling */}
          <View style={styles.productInfo}>
            <Text style={[styles.productTitle, { fontSize: 17, fontWeight: '600' }]} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={[styles.productPrice, { fontSize: 20, fontWeight: '700' }]}>{formattedPrice}</Text>
            <Text style={[styles.productCategory, { fontSize: 15, color: '#8E8E93' }]}>{product.category.name}</Text>
            
            {!product.availability && (
              <Text style={[styles.outOfStock, { fontSize: 13, color: '#FF3B30' }]}>Out of Stock</Text>
            )}
          </View>

          {/* iOS-style Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[IOSStyles.secondaryButton, styles.skipButton]}
              onPress={() => handleSwipeComplete('left')}
              activeOpacity={0.6}
            >
              <Text style={[IOSStyles.secondaryButtonText, { color: '#FF3B30' }]}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[IOSStyles.primaryButton, styles.cartButton, !product.availability && styles.disabledButton]}
              onPress={handleAddToCart}
              disabled={!product.availability}
              activeOpacity={0.6}
            >
              <Text style={[IOSStyles.primaryButtonText, !product.availability && styles.disabledButtonText]}>
                {product.availability ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[IOSStyles.secondaryButton, styles.likeButton]}
              onPress={() => handleSwipeComplete('right')}
              activeOpacity={0.6}
            >
              <Text style={[IOSStyles.secondaryButtonText, { color: '#34C759' }]}>Like</Text>
            </TouchableOpacity>
          </View>

          {/* iOS-style View Details Button */}
          <View style={styles.detailsButtonContainer}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewDetails}
              activeOpacity={0.6}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 400,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  likeOverlay: {
    backgroundColor: 'rgba(52, 199, 89, 0.85)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 22,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 8,
  },
  outOfStock: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    borderColor: '#FF3B30',
  },
  cartButton: {
    flex: 1.5,
  },
  likeButton: {
    flex: 1,
    borderColor: '#34C759',
  },
  disabledButton: {
    backgroundColor: '#F2F2F7',
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '400',
  },
});