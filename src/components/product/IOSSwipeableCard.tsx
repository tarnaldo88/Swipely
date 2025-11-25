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
import { IOSCardStyles } from '@/screens/Styles/CardStyles';

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

  // Helper function to animate card swipe programmatically
  const animateSwipe = useCallback((direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? screenWidth * 1.5 : -screenWidth * 1.5;
    const targetRotation = direction === 'right' ? 30 : -30;

    translateX.value = withTiming(targetX, IOSAnimations.timing);
    translateY.value = withTiming(-100, IOSAnimations.timing);
    opacity.value = withTiming(0, IOSAnimations.timing);
    rotation.value = withTiming(targetRotation, IOSAnimations.timing);
    
    runOnJS(handleSwipeComplete)(direction);
  }, [translateX, translateY, opacity, rotation, handleSwipeComplete]);

  const handleAddToCart = useCallback(async () => {
    try {
      HapticFeedback.medium();
      await swipeActionService.onAddToCart(product.id);
      onAddToCart?.(product.id);
      
      // Automatically swipe to next card after adding to cart
      animateSwipe('right');
    } catch (error) {
      HapticFeedback.error();
      console.error('Error handling add to cart:', error);
    }
  }, [product.id, swipeActionService, onAddToCart, animateSwipe]);

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
      <Animated.View style={[IOSCardStyles.cardContainer, cardAnimatedStyle]}>
        <Pressable style={[IOSCardStyles.card, IOSStyles.card]} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={IOSCardStyles.imageContainer}>
            <Image source={{ uri: primaryImage }} style={IOSCardStyles.productImage} />
            
            {/* Swipe Overlays */}
            <Animated.View style={[IOSCardStyles.overlay, IOSCardStyles.likeOverlay, likeOverlayStyle]}>
              <Image
                source={require('../../../assets/SwipelyBag.png')}
                style={IOSCardStyles.logo}
              />
              <Text style={IOSCardStyles.overlayText}>LIKE</Text>
            </Animated.View>
            
            <Animated.View style={[IOSCardStyles.overlay, IOSCardStyles.skipOverlay, skipOverlayStyle]}>
              <Text style={IOSCardStyles.overlayText}>SKIP</Text>
            </Animated.View>
          </View>

          {/* Product Info with iOS styling */}
          <View style={IOSCardStyles.productInfo}>
            <Text style={[IOSCardStyles.productTitle, { fontSize: 17, fontWeight: '600' }]} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={[IOSCardStyles.productPrice, { fontSize: 20, fontWeight: '700' }]}>{formattedPrice}</Text>
            <Text style={[IOSCardStyles.productCategory, { fontSize: 15, color: '#8E8E93' }]}>{product.category.name}</Text>
            
            {!product.availability && (
              <Text style={[IOSCardStyles.outOfStock, { fontSize: 13, color: '#FF3B30' }]}>Out of Stock</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={IOSCardStyles.actionButtons}>
            <TouchableOpacity
              style={[IOSCardStyles.actionButton, IOSCardStyles.skipButton]}
              onPress={() => animateSwipe('left')}
              activeOpacity={0.7}
            >
              <Text style={IOSCardStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[IOSCardStyles.actionButton, IOSCardStyles.cartButton, !product.availability && IOSCardStyles.disabledButton]}
              onPress={handleAddToCart}
              disabled={!product.availability}
              activeOpacity={0.7}
            >
              <Text style={[IOSCardStyles.cartButtonText, !product.availability && IOSCardStyles.disabledButtonText]}>
                {product.availability ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[IOSCardStyles.actionButton, IOSCardStyles.likeButton]}
              onPress={() => animateSwipe('right')}
              activeOpacity={0.7}
            >
              <Text style={IOSCardStyles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>

          {/* iOS-style View Details Button */}
          <View style={IOSCardStyles.detailsButtonContainer}>
            <TouchableOpacity
              style={IOSCardStyles.detailsButton}
              onPress={handleViewDetails}
              activeOpacity={0.6}
            >
              <Text style={IOSCardStyles.detailsButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};