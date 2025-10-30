import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProductCard, MainStackParamList } from '../../types';
import { getSwipeActionService } from '../../services/SwipeActionService';
import { AddToCartButton } from './AddToCartButton';
import { ViewDetailsButton } from './ViewDetailsButton';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const SWIPE_THRESHOLD = screenWidth * 0.25;

type SwipeableCardNavigationProp = StackNavigationProp<MainStackParamList>;

interface SwipeableCardProps {
  product: ProductCard;
  userId: string;
  onSwipeLeft?: (productId: string) => void;
  onSwipeRight?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isTopCard?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
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

  const swipeActionService = getSwipeActionService(userId);

  const handleSwipeComplete = useCallback(
    async (direction: 'left' | 'right') => {
      try {
        if (direction === 'left') {
          await swipeActionService.onSwipeLeft(product.id);
          onSwipeLeft?.(product.id);
        } else {
          await swipeActionService.onSwipeRight(product.id);
          onSwipeRight?.(product.id);
        }
      } catch (error) {
        console.error('Error handling swipe:', error);
      }
    },
    [product.id, swipeActionService, onSwipeLeft, onSwipeRight]
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startX: number; startY: number }
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY * 0.1; // Subtle vertical movement
    },
    onEnd: (event) => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        translateX.value = withTiming(-screenWidth * 1.5, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(handleSwipeComplete)('left');
      } else if (shouldSwipeRight) {
        translateX.value = withTiming(screenWidth * 1.5, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(handleSwipeComplete)('right');
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
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
      Extrapolate.CLAMP
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
      Extrapolate.CLAMP
    );

    return {
      opacity: skipOpacity,
    };
  });

  const handleAddToCart = useCallback(async () => {
    try {
      await swipeActionService.onAddToCart(product.id);
      onAddToCart?.(product.id);
    } catch (error) {
      console.error('Error handling add to cart:', error);
    }
  }, [product.id, swipeActionService, onAddToCart]);

  const handleViewDetails = useCallback(async () => {
    try {
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

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        <Pressable style={styles.card} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: primaryImage }} style={styles.productImage} />
            
            {/* Swipe Overlays */}
            <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
              <Text style={styles.overlayText}>LIKE</Text>
            </Animated.View>
            
            <Animated.View style={[styles.overlay, styles.skipOverlay, skipOverlayStyle]}>
              <Text style={styles.overlayText}>SKIP</Text>
            </Animated.View>
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.productPrice}>{formattedPrice}</Text>
            <Text style={styles.productCategory}>{product.category.name}</Text>
            
            {!product.availability && (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => handleSwipeComplete('left')}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <AddToCartButton
              onPress={handleAddToCart}
              disabled={!product.availability}
              style={[styles.actionButton, styles.cartButton]}
              textStyle={styles.cartButtonText}
              title={product.availability ? 'Add to Cart' : 'Out of Stock'}
            />

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => handleSwipeComplete('right')}
              activeOpacity={0.7}
            >
              <Text style={styles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>

          {/* View Details Button */}
          <View style={styles.detailsButtonContainer}>
            <ViewDetailsButton
              onPress={handleViewDetails}
              style={styles.detailsButton}
              textStyle={styles.detailsButtonText}
              title="View Details"
            />
          </View>
        </Pressable>
      </Animated.View>
    </PanGestureHandler>
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
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
    borderRadius: 16,
  },
  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    lineHeight: 24,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  outOfStock: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  skipButtonText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: '#1976D2',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  likeButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 10,
  },
  detailsButtonText: {
    color: '#666666',
    fontSize: 13,
  },
});