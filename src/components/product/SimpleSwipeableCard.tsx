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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProductCard, MainStackParamList } from '../../types';
import { getSwipeActionService } from '../../services/SwipeActionService';
import { AddToCartButton } from './AddToCartButton';
import { ViewDetailsButton } from './ViewDetailsButton';
import { SimpleSwipeableCardtyles } from '@/screens/Styles/CardStyles';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;

type SimpleSwipeableCardNavigationProp = StackNavigationProp<MainStackParamList>;

interface SimpleSwipeableCardProps {
  product: ProductCard;
  userId: string;
  onSwipeLeft?: (productId: string) => void;
  onSwipeRight?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isTopCard?: boolean;
}

export const SimpleSwipeableCard: React.FC<SimpleSwipeableCardProps> = ({
  product,
  userId,
  onSwipeLeft,
  onSwipeRight,
  onAddToCart,
  onViewDetails,
  isTopCard = true,
}) => {
  const navigation = useNavigation<SimpleSwipeableCardNavigationProp>();
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
    <View style={SimpleSwipeableCardtyles.cardContainer}>
      <Pressable style={SimpleSwipeableCardtyles.card} onPress={handleViewDetails}>
        {/* Product Image */}
        <View style={SimpleSwipeableCardtyles.imageContainer}>
          <Image source={{ uri: primaryImage }} style={SimpleSwipeableCardtyles.productImage} />
        </View>

        {/* Product Info */}
        <View style={SimpleSwipeableCardtyles.productInfo}>
          <Text style={SimpleSwipeableCardtyles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <Text style={SimpleSwipeableCardtyles.productPrice}>{formattedPrice}</Text>
          <Text style={SimpleSwipeableCardtyles.productCategory}>{product.category.name}</Text>
          
          {!product.availability && (
            <Text style={SimpleSwipeableCardtyles.outOfStock}>Out of Stock</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={SimpleSwipeableCardtyles.actionButtons}>
          <TouchableOpacity
            style={[SimpleSwipeableCardtyles.actionButton, SimpleSwipeableCardtyles.skipButton]}
            onPress={() => handleSwipeComplete('left')}
            activeOpacity={0.7}
          >
            <Text style={SimpleSwipeableCardtyles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <AddToCartButton
            onPress={handleAddToCart}
            disabled={!product.availability}
            style={[SimpleSwipeableCardtyles.actionButton, SimpleSwipeableCardtyles.cartButton]}
            textStyle={SimpleSwipeableCardtyles.cartButtonText}
            title={product.availability ? 'Add to Cart' : 'Out of Stock'}
          />

          <TouchableOpacity
            style={[SimpleSwipeableCardtyles.actionButton, SimpleSwipeableCardtyles.likeButton]}
            onPress={() => handleSwipeComplete('right')}
            activeOpacity={0.7}
          >
            <Text style={SimpleSwipeableCardtyles.likeButtonText}>Like</Text>
          </TouchableOpacity>
        </View>

        {/* View Details Button */}
        <View style={SimpleSwipeableCardtyles.detailsButtonContainer}>
          <ViewDetailsButton
            onPress={handleViewDetails}
            style={SimpleSwipeableCardtyles.detailsButton}
            textStyle={SimpleSwipeableCardtyles.detailsButtonText}
            title="View Details"
          />
        </View>
      </Pressable>
    </View>
  );
};