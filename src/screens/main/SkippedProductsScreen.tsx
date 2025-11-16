import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StatusBar,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MouseSwipeableCard } from '../../components/product/MouseSwipeableCard';
import { ProductCard, MainStackParamList } from '../../types';
import { getSkippedProductsService } from '../../services/SkippedProductsService';
import { getWishlistService } from '../../services/WishlistService';
import { getCartService } from '../../services/CartService';
import { SkippedProductStyles } from '../Styles/ProductStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SkippedProductsScreenRouteProp = RouteProp<MainStackParamList, 'SkippedProducts'>;
type SkippedProductsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'SkippedProducts'>;

// Mock user ID - in real app this would come from auth context
const MOCK_USER_ID = 'mock-user-123';

export const SkippedProductsScreen: React.FC = () => {
  const route = useRoute<SkippedProductsScreenRouteProp>();
  const navigation = useNavigation<SkippedProductsScreenNavigationProp>();
  const { category } = route.params;
  
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const skippedProductsService = getSkippedProductsService();
  const wishlistService = getWishlistService();
  const cartService = getCartService();

  useEffect(() => {
    loadSkippedProducts();
  }, [category]);

  const loadSkippedProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading skipped products for category:', category);
      
      const skippedItems = await skippedProductsService.getSkippedProductsByCategoryWithDetails(category);
      const productCards = skippedItems.map(item => item.product);
      
      console.log('Loaded skipped products:', productCards.length);
      setProducts(productCards);
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('Error loading skipped products:', error);
      Alert.alert('Error', 'Failed to load skipped products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeLeft = useCallback(async (productId: string) => {
    console.log('Swiped left on skipped product (skip again):', productId);
    setCurrentCardIndex(prev => prev + 1);
  }, []);

  const handleSwipeRight = useCallback(async (productId: string) => {
    console.log('Swiped right on skipped product (add to wishlist):', productId);
    try {
      // Remove from skipped products and add to wishlist
      await Promise.all([
        skippedProductsService.removeSkippedProduct(productId),
        wishlistService.addToWishlist(productId)
      ]);
      
      Alert.alert('Added to Wishlist!', 'Product has been removed from skipped items and added to your wishlist.');
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error processing swipe right:', error);
      Alert.alert('Error', 'Failed to process action. Please try again.');
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [skippedProductsService, wishlistService]);

  const handleAddToCart = useCallback(async (productId: string) => {
    console.log('Added skipped product to cart:', productId);
    try {
      // Remove from skipped products and add to cart
      await Promise.all([
        skippedProductsService.removeSkippedProduct(productId),
        cartService.addToCart(productId, 1)
      ]);
      
      Alert.alert('Added to Cart!', 'Product has been removed from skipped items and added to your cart.');
      // Automatically advance to next product
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
      // Still advance to next product even on error
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [skippedProductsService, cartService]);

  const handleViewDetails = useCallback((productId: string) => {
    console.log('Viewing details for skipped product:', productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      navigation.navigate('ProductDetails', { productId, product });
    }
  }, [products, navigation]);

  const handleClearAllSkipped = useCallback(() => {
    Alert.alert(
      'Clear All Skipped Products',
      `Are you sure you want to clear all skipped products in the ${category} category? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await skippedProductsService.clearSkippedProductsByCategory(category);
              Alert.alert('Cleared', 'All skipped products in this category have been cleared.');
              navigation.goBack();
            } catch (error) {
              console.error('Error clearing skipped products:', error);
              Alert.alert('Error', 'Failed to clear skipped products. Please try again.');
            }
          },
        },
      ]
    );
  }, [category, skippedProductsService, navigation]);

  const renderCard = (product: ProductCard, index: number) => {
    const isTopCard = index === currentCardIndex;
    const isVisible = index >= currentCardIndex && index < currentCardIndex + 3;
    
    if (!isVisible) return null;

    const zIndex = products.length - index;
    const scale = isTopCard ? 1 : 0.95 - (index - currentCardIndex) * 0.02;
    const translateY = (index - currentCardIndex) * 8;

    return (
      <View
        key={product.id}
        style={[
          SkippedProductStyles.cardWrapper,
          {
            zIndex,
            transform: [
              { scale },
              { translateY },
            ],
          },
        ]}
      >
        <MouseSwipeableCard
          product={product}
          userId={MOCK_USER_ID}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
          isTopCard={isTopCard}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={SkippedProductStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
        <View style={SkippedProductStyles.loadingContainer}>
          <Text style={SkippedProductStyles.loadingText}>Loading skipped products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={SkippedProductStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
        
        {/* Header */}
        <View style={SkippedProductStyles.header}>
          <TouchableOpacity style={SkippedProductStyles.backButton} onPress={() => navigation.goBack()}>
            <Text style={SkippedProductStyles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={SkippedProductStyles.headerTitle}>Skipped: {category}</Text>
          <View style={SkippedProductStyles.headerSpacer} />
        </View>

        <View style={SkippedProductStyles.emptyContainer}>
          <Text style={SkippedProductStyles.emptyTitle}>No Skipped Products</Text>
          <Text style={SkippedProductStyles.emptySubtitle}>
            You haven't skipped any products in the {category} category yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasMoreCards = currentCardIndex < products.length;

  return (
    <SafeAreaView style={SkippedProductStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#221e27" />
      
      {/* Header */}
      <View style={SkippedProductStyles.header}>
        <TouchableOpacity style={SkippedProductStyles.backButton} onPress={() => navigation.goBack()}>
          <Text style={SkippedProductStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={SkippedProductStyles.headerTitle}>Skipped: {category}</Text>
        <TouchableOpacity style={SkippedProductStyles.clearButton} onPress={handleClearAllSkipped}>
          <Text style={SkippedProductStyles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={SkippedProductStyles.subtitle}>
        <Text style={SkippedProductStyles.subtitleText}>
          {hasMoreCards 
            ? `${products.length - currentCardIndex} skipped products to review`
            : 'All skipped products reviewed!'
          }
        </Text>
        <Text style={SkippedProductStyles.instructionText}>
          Swipe right to add to wishlist • Swipe left to skip again
        </Text>
      </View>

      {/* Cards Container */}
      <View style={SkippedProductStyles.cardsContainer}>
        {hasMoreCards ? (
          <>
            {products.map((product, index) => renderCard(product, index))}
          </>
        ) : (
          <View style={SkippedProductStyles.allDoneContainer}>
            <Text style={SkippedProductStyles.allDoneTitle}>🎉 All Done!</Text>
            <Text style={SkippedProductStyles.allDoneSubtitle}>
              You've reviewed all skipped products in this category.
            </Text>
            <TouchableOpacity 
              style={SkippedProductStyles.backToFeedButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={SkippedProductStyles.backToFeedButtonText}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};