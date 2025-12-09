import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
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
import { OptimizedImage } from '../common/OptimizedImage';
import { GesturePerformanceManager } from '../../utils/PerformanceUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { SwipeableCardStyles } from '@/screens/Styles/CardStyles';

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

export const SwipeableCard: React.FC<SwipeableCardProps> = memo(({
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
  const { handleError } = useErrorHandler();

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
        handleError(error, {
          productId: product.id,
          direction,
          component: 'SwipeableCard',
        });
      }
    },
    [product.id, swipeActionService, onSwipeLeft, onSwipeRight]
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(GesturePerformanceManager.startGestureTracking)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1; // Subtle vertical movement
    })
    .onEnd((event) => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD;

      if (shouldSwipeLeft) {
        translateX.value = withTiming(-screenWidth * 1.5, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(handleSwipeComplete)('left');
        runOnJS(GesturePerformanceManager.endGestureTracking)('swipe-left');
      } else if (shouldSwipeRight) {
        translateX.value = withTiming(screenWidth * 1.5, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(handleSwipeComplete)('right');
        runOnJS(GesturePerformanceManager.endGestureTracking)('swipe-right');
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(GesturePerformanceManager.endGestureTracking)('swipe-cancel');
      }
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
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[SwipeableCardStyles.cardContainer, cardAnimatedStyle]}>
        <Pressable style={SwipeableCardStyles.card} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={SwipeableCardStyles.imageContainer}>
            <OptimizedImage 
              uri={primaryImage} 
              style={SwipeableCardStyles.productImage}
              width={CARD_WIDTH}
              height={400}
              quality="high"
              resizeMode="cover"
            />
            
            {/* Swipe Overlays */}
            <Animated.View style={[SwipeableCardStyles.overlay, SwipeableCardStyles.likeOverlay, likeOverlayStyle]}>
              <OptimizedImage 
                uri={require('../../../assets/SwipelyBag.png')} 
                style={SwipeableCardStyles.logo}
                width={408}
                height={204}
                quality="medium"
                resizeMode="contain"
              />
              <Text style={SwipeableCardStyles.overlayText}>LIKE</Text>
            </Animated.View>
            
            <Animated.View style={[SwipeableCardStyles.overlay, SwipeableCardStyles.skipOverlay, skipOverlayStyle]}>
              <Text style={SwipeableCardStyles.overlayText}>SKIP</Text>
            </Animated.View>
          </View>

          {/* Product Info */}
          <View style={SwipeableCardStyles.productInfo}>
            <Text style={SwipeableCardStyles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={SwipeableCardStyles.productPrice}>{formattedPrice}</Text>
            <Text style={SwipeableCardStyles.productCategory}>{product.category.name}</Text>
            
            {!product.availability && (
              <Text style={SwipeableCardStyles.outOfStock}>Out of Stock</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={SwipeableCardStyles.actionButtons}>
            <TouchableOpacity
              style={[SwipeableCardStyles.actionButton, SwipeableCardStyles.skipButton]}
              onPress={() => handleSwipeComplete('left')}
              activeOpacity={0.7}
            >
              <Text style={SwipeableCardStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <AddToCartButton
              onPress={handleAddToCart}
              disabled={!product.availability}
              style={[SwipeableCardStyles.actionButton, SwipeableCardStyles.cartButton]}
              textStyle={SwipeableCardStyles.cartButtonText}
              title={product.availability ? 'Add to Cart' : 'Out of Stock'}
            />

            <TouchableOpacity
              style={[SwipeableCardStyles.actionButton, SwipeableCardStyles.likeButton]}
              onPress={() => handleSwipeComplete('right')}
              activeOpacity={0.7}
            >
              <Text style={SwipeableCardStyles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>

          {/* View Details Button */}
          <View style={SwipeableCardStyles.detailsButtonContainer}>
            <ViewDetailsButton
              onPress={handleViewDetails}
              style={SwipeableCardStyles.detailsButton}
              textStyle={SwipeableCardStyles.detailsButtonText}
              title="View Details"
            />
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
});

SwipeableCard.displayName = 'SwipeableCard';
