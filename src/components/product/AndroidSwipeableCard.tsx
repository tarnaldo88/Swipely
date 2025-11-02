import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableNativeFeedback,
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
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProductCard, MainStackParamList } from '../../types';
import { getSwipeActionService } from '../../services/SwipeActionService';
import { AndroidToast } from '../../utils/AndroidUtils';
import { AndroidStyles, MaterialColors, MaterialAnimations, AndroidGestures } from '../../styles/AndroidStyles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const SWIPE_THRESHOLD = screenWidth * 0.25;

type SwipeableCardNavigationProp = StackNavigationProp<MainStackParamList>;

interface AndroidSwipeableCardProps {
  product: ProductCard;
  userId: string;
  onSwipeLeft?: (productId: string) => void;
  onSwipeRight?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isTopCard?: boolean;
}

export const AndroidSwipeableCard: React.FC<AndroidSwipeableCardProps> = ({
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
        if (direction === 'left') {
          AndroidToast.show('Product skipped', 'SHORT');
          await swipeActionService.onSwipeLeft(product.id);
          onSwipeLeft?.(product.id);
        } else {
          AndroidToast.show('Product liked!', 'SHORT');
          await swipeActionService.onSwipeRight(product.id);
          onSwipeRight?.(product.id);
        }
      } catch (error) {
        AndroidToast.show('Error processing action', 'SHORT');
        console.error('Error handling swipe:', error);
      }
    },
    [product.id, swipeActionService, onSwipeLeft, onSwipeRight]
  );

  // Android-specific gesture handling with Material Design physics
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1; // Subtle vertical movement
      
      // Material Design-style rotation
      rotation.value = interpolate(
        event.translationX,
        [-screenWidth / 2, 0, screenWidth / 2],
        [-12, 0, 12],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      const shouldSwipeLeft = translateX.value < -SWIPE_THRESHOLD || event.velocityX < -AndroidGestures.velocityThreshold;
      const shouldSwipeRight = translateX.value > SWIPE_THRESHOLD || event.velocityX > AndroidGestures.velocityThreshold;

      if (shouldSwipeLeft) {
        translateX.value = withTiming(-screenWidth * 1.5, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(-80, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(0, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        rotation.value = withTiming(-25, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(handleSwipeComplete)('left');
      } else if (shouldSwipeRight) {
        translateX.value = withTiming(screenWidth * 1.5, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        translateY.value = withTiming(-80, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(0, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        rotation.value = withTiming(25, {
          duration: MaterialAnimations.standard.duration,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(handleSwipeComplete)('right');
      } else {
        // Material Design spring animation back to center
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        rotation.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
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

  // Helper function to animate card swipe programmatically
  const animateSwipe = useCallback((direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? screenWidth * 1.5 : -screenWidth * 1.5;
    const targetRotation = direction === 'right' ? 25 : -25;

    translateX.value = withTiming(targetX, {
      duration: MaterialAnimations.standard.duration,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(-80, {
      duration: MaterialAnimations.standard.duration,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(0, {
      duration: MaterialAnimations.standard.duration,
      easing: Easing.out(Easing.cubic),
    });
    rotation.value = withTiming(targetRotation, {
      duration: MaterialAnimations.standard.duration,
      easing: Easing.out(Easing.cubic),
    });
    
    runOnJS(handleSwipeComplete)(direction);
  }, [translateX, translateY, opacity, rotation, handleSwipeComplete]);

  const handleAddToCart = useCallback(async () => {
    try {
      await swipeActionService.onAddToCart(product.id);
      AndroidToast.show('Added to cart!', 'SHORT');
      onAddToCart?.(product.id);
      
      // Automatically swipe to next card after adding to cart
      animateSwipe('right');
    } catch (error) {
      AndroidToast.show('Error adding to cart', 'SHORT');
      console.error('Error handling add to cart:', error);
    }
  }, [product.id, swipeActionService, onAddToCart, animateSwipe]);

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

  if (Platform.OS !== 'android') {
    return null; // This component is Android-specific
  }

  // Use TouchableNativeFeedback for Android ripple effect
  const TouchableComponent = Platform.OS === 'android' ? TouchableNativeFeedback : TouchableOpacity;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        <TouchableComponent
          onPress={handleViewDetails}
          background={TouchableNativeFeedback.Ripple(MaterialColors.primary, false)}
          useForeground={true}
        >
          <View style={[styles.card, AndroidStyles.card]}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: primaryImage }} style={styles.productImage} />
              
              {/* Material Design Swipe Overlays */}
              <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
                <View style={styles.overlayContent}>
                  <Text style={styles.overlayIcon}>👍</Text>
                  <Text style={styles.overlayText}>LIKE</Text>
                </View>
              </Animated.View>
              
              <Animated.View style={[styles.overlay, styles.skipOverlay, skipOverlayStyle]}>
                <View style={styles.overlayContent}>
                  <Text style={styles.overlayIcon}>👎</Text>
                  <Text style={styles.overlayText}>SKIP</Text>
                </View>
              </Animated.View>
            </View>

            {/* Product Info with Material Design typography */}
            <View style={[styles.productInfo, AndroidStyles.cardContent]}>
              <Text style={[styles.productTitle, { fontSize: 16, fontWeight: '500', color: MaterialColors.textPrimary }]} numberOfLines={2}>
                {product.title}
              </Text>
              <Text style={[styles.productPrice, { fontSize: 18, fontWeight: '700', color: MaterialColors.primary }]}>{formattedPrice}</Text>
              <Text style={[styles.productCategory, { fontSize: 14, color: MaterialColors.textSecondary }]}>{product.category.name}</Text>
              
              {!product.availability && (
                <Text style={[styles.outOfStock, { fontSize: 12, color: MaterialColors.error }]}>Out of Stock</Text>
              )}
            </View>

            {/* Material Design Action Buttons */}
            <View style={[styles.actionButtons, AndroidStyles.cardActions]}>
              <TouchableNativeFeedback
                onPress={() => animateSwipe('left')}
                background={TouchableNativeFeedback.Ripple(MaterialColors.error, true)}
              >
                <View style={[AndroidStyles.secondaryButton, styles.skipButton, { borderColor: MaterialColors.error }]}>
                  <Text style={[AndroidStyles.secondaryButtonText, { color: MaterialColors.error }]}>SKIP</Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={handleAddToCart}
                disabled={!product.availability}
                background={TouchableNativeFeedback.Ripple(MaterialColors.onPrimary, true)}
              >
                <View style={[
                  AndroidStyles.primaryButton, 
                  styles.cartButton,
                  !product.availability && styles.disabledButton
                ]}>
                  <Text style={[
                    AndroidStyles.primaryButtonText,
                    !product.availability && styles.disabledButtonText
                  ]}>
                    {product.availability ? 'ADD TO CART' : 'OUT OF STOCK'}
                  </Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={() => animateSwipe('right')}
                background={TouchableNativeFeedback.Ripple('#4CAF50', true)}
              >
                <View style={[AndroidStyles.secondaryButton, styles.likeButton, { borderColor: '#4CAF50' }]}>
                  <Text style={[AndroidStyles.secondaryButtonText, { color: '#4CAF50' }]}>LIKE</Text>
                </View>
              </TouchableNativeFeedback>
            </View>

            {/* Material Design View Details Button */}
            <View style={styles.detailsButtonContainer}>
              <TouchableNativeFeedback
                onPress={handleViewDetails}
                background={TouchableNativeFeedback.Ripple(MaterialColors.textSecondary, true)}
              >
                <View style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>VIEW DETAILS</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>
        </TouchableComponent>
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
    backgroundColor: MaterialColors.surface,
    borderRadius: 8,
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
    borderRadius: 8,
  },
  overlayContent: {
    alignItems: 'center',
  },
  overlayIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.85)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.85)',
  },
  overlayText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: MaterialColors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: MaterialColors.primary,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: MaterialColors.textSecondary,
    marginBottom: 8,
  },
  outOfStock: {
    fontSize: 12,
    color: MaterialColors.error,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  skipButton: {
    flex: 1,
  },
  cartButton: {
    flex: 1.5,
  },
  likeButton: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    elevation: 0,
  },
  disabledButtonText: {
    color: MaterialColors.textHint,
  },
  detailsButtonContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: MaterialColors.divider,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: MaterialColors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});