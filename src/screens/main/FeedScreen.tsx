import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { MouseSwipeableCard } from '../../components/product/MouseSwipeableCard';
import { ProductCard } from '../../types';
import { ProductFeedService } from '../../services/ProductFeedService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Mock user ID - in real app this would come from auth context
const MOCK_USER_ID = 'mock-user-123';

export const FeedScreen: React.FC = () => {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductFeedService.getPersonalizedFeed({ page: 1, limit: 10 });
      setProducts(response.products);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await ProductFeedService.refreshFeed();
      setProducts(response.products);
      setCurrentCardIndex(0);
    } catch (error) {
      console.error('Error refreshing feed:', error);
      Alert.alert('Error', 'Failed to refresh feed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSwipeLeft = useCallback(async (productId: string) => {
    console.log('Swiped left on product:', productId);
    try {
      await ProductFeedService.recordSwipeAction(productId, 'skip', MOCK_USER_ID);
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error recording skip action:', error);
      setCurrentCardIndex(prev => prev + 1);
    }
  }, []);

  const handleSwipeRight = useCallback(async (productId: string) => {
    console.log('Swiped right on product:', productId);
    try {
      // Import services to add to wishlist
      const { getWishlistService } = require('../../services/WishlistService');
      const wishlistService = getWishlistService();
      
      // Add to wishlist and record swipe action
      await Promise.all([
        wishlistService.addToWishlist(productId),
        ProductFeedService.recordSwipeAction(productId, 'like', MOCK_USER_ID)
      ]);
      
      Alert.alert('Added to Wishlist!', 'Product has been added to your wishlist.');
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      Alert.alert('Error', 'Failed to add product to wishlist. Please try again.');
      setCurrentCardIndex(prev => prev + 1);
    }
  }, []);

  const handleAddToCart = useCallback(async (productId: string) => {
    console.log('Added to cart:', productId);
    try {
      // Import services to add to cart
      const { getCartService } = require('../../services/CartService');
      const cartService = getCartService();
      
      await cartService.addToCart(productId, 1);
      Alert.alert('Added to Cart!', 'Product has been added to your cart.');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
    }
  }, []);

  const handleViewDetails = useCallback((productId: string) => {
    console.log('Viewing details for product:', productId);
  }, []);

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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your personalized feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={styles.emptyTitle}>No Products Available</Text>
          <Text style={styles.emptySubtitle}>
            Pull down to refresh and discover new products!
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const hasMoreCards = currentCardIndex < products.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>
          {hasMoreCards 
            ? `${products.length - currentCardIndex} products to explore`
            : 'All caught up!'
          }
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
              You've seen all available products.
            </Text>
            <Text style={styles.allDoneAction}>
              Pull down to refresh for new products!
            </Text>
          </View>
        )}
      </View>

      {/* Pull to refresh hint */}
      <ScrollView
        style={styles.refreshScrollView}
        contentContainerStyle={styles.refreshContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1976D2"
            colors={['#1976D2']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.refreshHint}>
          <Text style={styles.refreshHintText}>Pull down to refresh</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6C757D',
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
    color: '#6C757D',
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
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
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
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  allDoneAction: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
  },
  refreshScrollView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  refreshContainer: {
    flex: 1,
  },
  refreshHint: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  refreshHintText: {
    fontSize: 14,
    color: '#ADB5BD',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});