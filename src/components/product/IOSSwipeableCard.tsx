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
      <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
        <Pressable style={[styles.card, IOSStyles.card]} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: primaryImage }} style={styles.productImage} />
            
            {/* Swipe Overlays */}
            <Animated.View style={[styles.overlay, styles.likeOverlay, likeOverlayStyle]}>
              <Image
                source={require('../../../assets/SwipelyBag.png')}
                style={styles.logo}
              />
              <Text style={styles.overlayText}>LIKE</Text>
            </Animated.View>
            
            <Animated.View style={[styles.overlay, styles.skipOverlay, skipOverlayStyle]}>
              <Text style={styles.overlayText}>SKIP</Text>
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => animateSwipe('left')}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cartButton, !product.availability && styles.disabledButton]}
              onPress={handleAddToCart}
              disabled={!product.availability}
              activeOpacity={0.7}
            >
              <Text style={[styles.cartButtonText, !product.availability && styles.disabledButtonText]}>
                {product.availability ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => animateSwipe('right')}
              activeOpacity={0.7}
            >
              <Text style={styles.likeButtonText}>Like</Text>
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
  logo: {
    width: 408,
    height: 204,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#221e27',
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
    backgroundColor: 'rgba(52, 199, 89, 0.85)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(255, 59, 48, 0.85)',
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
    color: '#e7e7e7ff',
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
    color: '#cececeff',
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
    backgroundColor: '#fff',
    borderColor: '#c725f8ff',
    borderWidth: 1,
  },
  skipButtonText: {
    color: '#b91decff',
    fontWeight: '600',
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: '#08f88c',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: '#c725f8ff',
    borderWidth: 1,
    borderColor: '#2bee31ff',
  },
  likeButtonText: {
    color: '#f1fcf1ff',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#999',
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21fa501c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#bbb8b8ff',
    fontSize: 13,
  },
});