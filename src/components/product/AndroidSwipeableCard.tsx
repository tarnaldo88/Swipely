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
import { AndroidSwipeCardStyles } from '@/screens/Styles/CardStyles';

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
      <Animated.View style={[AndroidSwipeCardStyles.cardContainer, cardAnimatedStyle]}>
        <TouchableComponent
          onPress={handleViewDetails}
          background={TouchableNativeFeedback.Ripple(MaterialColors.primary, false)}
          useForeground={true}
        >
          <View style={[AndroidSwipeCardStyles.card, AndroidStyles.card]}>
            {/* Product Image */}
            <View style={AndroidSwipeCardStyles.imageContainer}>
              <Image source={{ uri: primaryImage }} style={AndroidSwipeCardStyles.productImage} />
              
              {/* Swipe Overlays */}
              <Animated.View style={[AndroidSwipeCardStyles.overlay, AndroidSwipeCardStyles.likeOverlay, likeOverlayStyle]}>
                <Image
                  source={require('../../../assets/SwipelyBag.png')}
                  style={AndroidSwipeCardStyles.logo}
                />
                <Text style={AndroidSwipeCardStyles.overlayText}>LIKE</Text>
              </Animated.View>
              
              <Animated.View style={[AndroidSwipeCardStyles.overlay, AndroidSwipeCardStyles.skipOverlay, skipOverlayStyle]}>
                <Text style={AndroidSwipeCardStyles.overlayText}>SKIP</Text>
              </Animated.View>
            </View>

            {/* Product Info with Material Design typography */}
            <View style={[AndroidSwipeCardStyles.productInfo, AndroidStyles.cardContent]}>
              <Text style={[AndroidSwipeCardStyles.productTitle, { fontSize: 16, fontWeight: '500', color: MaterialColors.textPrimary }]} numberOfLines={2}>
                {product.title}
              </Text>
              <Text style={[AndroidSwipeCardStyles.productPrice, { fontSize: 18, fontWeight: '700', color: MaterialColors.primary }]}>{formattedPrice}</Text>
              <Text style={[AndroidSwipeCardStyles.productCategory, { fontSize: 14, color: MaterialColors.textSecondary }]}>{product.category.name}</Text>
              
              {!product.availability && (
                <Text style={[AndroidSwipeCardStyles.outOfStock, { fontSize: 12, color: MaterialColors.error }]}>Out of Stock</Text>
              )}
            </View>

            {/* Material Design Action Buttons */}
            <View style={[AndroidSwipeCardStyles.actionButtons, AndroidStyles.cardActions]}>
              <TouchableNativeFeedback
                onPress={() => animateSwipe('left')}
                background={TouchableNativeFeedback.Ripple('#b91decff', true)}
              >
                <View style={[AndroidSwipeCardStyles.actionButton, AndroidSwipeCardStyles.skipButton]}>
                  <Text style={AndroidSwipeCardStyles.skipButtonText}>Skip</Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={handleAddToCart}
                disabled={!product.availability}
                background={TouchableNativeFeedback.Ripple('#FFFFFF', true)}
              >
                <View style={[AndroidSwipeCardStyles.actionButton, AndroidSwipeCardStyles.cartButton, !product.availability && AndroidSwipeCardStyles.disabledButton]}>
                  <Text style={[AndroidSwipeCardStyles.cartButtonText, !product.availability && AndroidSwipeCardStyles.disabledButtonText]}>
                    {product.availability ? 'Add to Cart' : 'Out of Stock'}
                  </Text>
                </View>
              </TouchableNativeFeedback>

              <TouchableNativeFeedback
                onPress={() => animateSwipe('right')}
                background={TouchableNativeFeedback.Ripple('#f1fcf1ff', true)}
              >
                <View style={[AndroidSwipeCardStyles.actionButton, AndroidSwipeCardStyles.likeButton]}>
                  <Text style={AndroidSwipeCardStyles.likeButtonText}>Like</Text>
                </View>
              </TouchableNativeFeedback>
            </View>

            {/* Material Design View Details Button */}
            <View style={AndroidSwipeCardStyles.detailsButtonContainer}>
              <TouchableNativeFeedback
                onPress={handleViewDetails}
                background={TouchableNativeFeedback.Ripple(MaterialColors.textSecondary, true)}
              >
                <View style={AndroidSwipeCardStyles.detailsButton}>
                  <Text style={AndroidSwipeCardStyles.detailsButtonText}>VIEW DETAILS</Text>
                </View>
              </TouchableNativeFeedback>
            </View>
          </View>
        </TouchableComponent>
      </Animated.View>
    </GestureDetector>
  );
};