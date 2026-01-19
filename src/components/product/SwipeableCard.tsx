import React, { useCallback, memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
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
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProductCard, MainStackParamList } from '../../types';
import { getSwipeActionService } from '../../services/SwipeActionService';
import { AddToCartButton } from './AddToCartButton';
import { ViewDetailsButton } from './ViewDetailsButton';
import { OptimizedImage } from '../common/OptimizedImage';
import { GesturePerformanceManager } from '../../utils/PerformanceUtils';
import { AdvancedGestureHandler } from '../../utils/AdvancedGestureHandler';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { SwipeableCardStyles } from '@/screens/Styles/CardStyles';
import { SimplifiedAnimationController, FrameRateLimiter } from '../../utils/AnimationOptimizer';
import { SwipeOptimizer } from '../../utils/SwipeOptimizer';

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
  const opacity = useSharedValue(isTopCard ? 1 : 0.8);

  // Animation optimization
  const animationControllerRef = useRef<SimplifiedAnimationController | null>(null);
  const frameRateLimiterRef = useRef<FrameRateLimiter | null>(null);

  const swipeActionService = getSwipeActionService(userId);
  const { handleError } = useErrorHandler();

  // Initialize animation controller and frame rate limiter
  useEffect(() => {
    animationControllerRef.current = new SimplifiedAnimationController(5);
    frameRateLimiterRef.current = new FrameRateLimiter(60); // Target 60 FPS

    return () => {
      // Cleanup animations on unmount
      animationControllerRef.current?.cleanup();
    };
  }, []);

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
      AdvancedGestureHandler.initializeGesture(0, 0);
    })
    .onUpdate((event) => {
      // Frame rate limiting - only process if frame should render
      if (!frameRateLimiterRef.current?.shouldRenderFrame()) {
        return;
      }

      // Intelligent throttling: only update if movement exceeds pixel threshold
      if (!AdvancedGestureHandler.shouldProcessUpdate(event.translationX, event.translationY, {
        pixelThreshold: 2, // Only update if moved 2+ pixels
        timeThreshold: 8, // Only update every 8ms (~120fps)
      })) {
        return;
      }

      // Direct assignment - no interpolation overhead
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1;
    })
    .onEnd(() => {
      const swipeDirection = AdvancedGestureHandler.shouldCommitSwipe(
        translateX.value,
        SWIPE_THRESHOLD,
        0.5 // velocity threshold
      );

      if (swipeDirection === 'left') {
        const duration = AdvancedGestureHandler.getAnimationDuration(
          Math.abs(translateX.value),
          Math.abs(AdvancedGestureHandler.getVelocity().x),
          200,
          400
        );
        translateX.value = withTiming(-screenWidth * 1.5, { duration });
        translateY.value = withTiming(-100, { duration });
        opacity.value = withTiming(0, { duration });
        runOnJS(handleSwipeComplete)('left');
        runOnJS(GesturePerformanceManager.endGestureTracking)('swipe-left');
      } else if (swipeDirection === 'right') {
        const duration = AdvancedGestureHandler.getAnimationDuration(
          Math.abs(translateX.value),
          Math.abs(AdvancedGestureHandler.getVelocity().x),
          200,
          400
        );
        translateX.value = withTiming(screenWidth * 1.5, { duration });
        translateY.value = withTiming(-100, { duration });
        opacity.value = withTiming(0, { duration });
        runOnJS(handleSwipeComplete)('right');
        runOnJS(GesturePerformanceManager.endGestureTracking)('swipe-right');
      } else {
        // Snap back to center with spring animation
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        runOnJS(GesturePerformanceManager.endGestureTracking)('swipe-cancel');
      }

      AdvancedGestureHandler.resetGesture();
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    // Use optimized opacity calculation without interpolation overhead
    const opacities = AdvancedGestureHandler.calculateOverlayOpacity(translateX.value, SWIPE_THRESHOLD);
    return {
      opacity: opacities.like,
    };
  });

  const skipOverlayStyle = useAnimatedStyle(() => {
    // Use optimized opacity calculation without interpolation overhead
    const opacities = AdvancedGestureHandler.calculateOverlayOpacity(translateX.value, SWIPE_THRESHOLD);
    return {
      opacity: opacities.skip,
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
