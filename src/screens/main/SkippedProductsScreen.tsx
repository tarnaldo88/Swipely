import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
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
          styles.cardWrapper,
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
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading skipped products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skipped: {category}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Skipped Products</Text>
          <Text style={styles.emptySubtitle}>
            You haven't skipped any products in the {category} category yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasMoreCards = currentCardIndex < products.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#221e27" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Skipped: {category}</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAllSkipped}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitle}>
        <Text style={styles.subtitleText}>
          {hasMoreCards 
            ? `${products.length - currentCardIndex} skipped products to review`
            : 'All skipped products reviewed!'
          }
        </Text>
        <Text style={styles.instructionText}>
          Swipe right to add to wishlist • Swipe left to skip again
        </Text>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {hasMoreCards ? (
          <>
            {products.map((product, index) => renderCard(product, index))}
          </>
        ) : (
          <View style={styles.allDoneContainer}>
            <Text style={styles.allDoneTitle}>🎉 All Done!</Text>
            <Text style={styles.allDoneSubtitle}>
              You've reviewed all skipped products in this category.
            </Text>
            <TouchableOpacity 
              style={styles.backToFeedButton} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backToFeedButtonText}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#221e27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#221e27',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#08f88c',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e1ecf8ff',
    textAlign: 'center',
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#dc3545',
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#221e27',
    alignItems: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#d7dce0ff',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#a9b1b8ff',
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardWrapper: {
    position: 'absolute',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#d6e4d8ff',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d8dfe7ff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a9b1b8ff',
    textAlign: 'center',
    lineHeight: 24,
  },
  allDoneContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  allDoneTitle: {
    fontSize: 32,
    marginBottom: 16,
  },
  allDoneSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d5dee7ff',
    marginBottom: 24,
    textAlign: 'center',
  },
  backToFeedButton: {
    backgroundColor: '#08f88c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backToFeedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#221e27',
  },
});