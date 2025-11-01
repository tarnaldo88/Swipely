import React, { useState, useEffect, useCallback, memo } from 'react';
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
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MouseSwipeableCard } from '../../components/product/MouseSwipeableCard';
import { ProductCard, MainStackParamList } from '../../types';
import { ProductFeedService } from '../../services/ProductFeedService';
import { getSkippedProductsService } from '../../services/SkippedProductsService';
import { OptimizedFlatList } from '../../components/common/OptimizedFlatList';
import { PerformanceMonitor, MemoryManager } from '../../utils/PerformanceUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type FeedScreenNavigationProp = StackNavigationProp<MainStackParamList>;

// Mock user ID - in real app this would come from auth context
const MOCK_USER_ID = 'mock-user-123';

export const FeedScreen: React.FC = memo(() => {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [skippedCategories, setSkippedCategories] = useState<{ category: string; count: number }[]>([]);
  
  const skippedProductsService = getSkippedProductsService();
  const { handleError, executeWithRetry } = useErrorHandler();
  const performanceMonitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    loadProducts();
    // Add some test skipped products for development
    addTestSkippedProducts();
  }, []);

  const addTestSkippedProducts = async () => {
    try {
      await skippedProductsService.addSkippedProduct('prod-1', 'electronics');
      await skippedProductsService.addSkippedProduct('prod-2', 'fashion');
      await skippedProductsService.addSkippedProduct('prod-3', 'electronics');
      console.log('Added test skipped products');
    } catch (error) {
      console.error('Error adding test skipped products:', error);
    }
  };

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
      // Get the product to extract its category
      const product = products.find(p => p.id === productId);
      const category = product?.category.id || 'general';
      
      // Add to skipped products and record swipe action
      await Promise.all([
        skippedProductsService.addSkippedProduct(productId, category),
        ProductFeedService.recordSwipeAction(productId, 'skip', MOCK_USER_ID)
      ]);
      
      console.log('Successfully added to skipped products and recorded skip action');
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error recording skip action:', error);
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [products, skippedProductsService]);

  const handleSwipeRight = useCallback(async (productId: string) => {
    console.log('Swiped right on product:', productId);
    try {
      // Import services to add to wishlist
      const { getWishlistService } = require('../../services/WishlistService');
      const wishlistService = getWishlistService();
      
      console.log('Adding product to wishlist:', productId);
      
      // Add to wishlist and record swipe action
      await wishlistService.addToWishlist(productId);
      console.log('Successfully added to wishlist');
      
      await ProductFeedService.recordSwipeAction(productId, 'like', MOCK_USER_ID);
      console.log('Successfully recorded swipe action');
      
      // Check if it was actually added
      const isInWishlist = await wishlistService.isInWishlist(productId);
      console.log('Product is in wishlist:', isInWishlist);
      
      const wishlistCount = await wishlistService.getWishlistCount();
      console.log('Total wishlist items:', wishlistCount);
      
      Alert.alert('Added to Wishlist!', `Product has been added to your wishlist. Total items: ${wishlistCount}`);
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
      
      console.log('Adding product to cart:', productId);
      await cartService.addToCart(productId, 1);
      console.log('Successfully added to cart');
      
      // Check if it was actually added
      const cartCount = await cartService.getCartCount();
      console.log('Total cart items:', cartCount);
      
      Alert.alert('Added to Cart!', `Product has been added to your cart. Total items: ${cartCount}`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart. Please try again.');
    }
  }, []);

  const handleViewDetails = useCallback((productId: string) => {
    console.log('Viewing details for product:', productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      navigation.navigate('ProductDetails', { productId, product });
    }
  }, [products, navigation]);

  const loadSkippedCategories = useCallback(async () => {
    try {
      const categories = await skippedProductsService.getAvailableCategories();
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const count = await skippedProductsService.getSkippedProductsCountByCategory(category);
          return { category, count };
        })
      );
      setSkippedCategories(categoriesWithCounts.filter(item => item.count > 0));
    } catch (error) {
      console.error('Error loading skipped categories:', error);
    }
  }, [skippedProductsService]);

  const handleShowSkippedProducts = useCallback(async () => {
    console.log('Skipped products button pressed');
    try {
      await loadSkippedCategories();
      console.log('Loaded skipped categories:', skippedCategories.length);
      setShowSkippedModal(true);
      console.log('Modal should be visible now');
    } catch (error) {
      console.error('Error showing skipped products:', error);
    }
  }, [loadSkippedCategories]);

  const handleNavigateToSkippedCategory = useCallback((category: string) => {
    setShowSkippedModal(false);
    navigation.navigate('SkippedProducts', { category });
  }, [navigation]);

  const renderCard = (product: ProductCard, index: number) => {
    const isTopCard = index === currentCardIndex;
    const isVisible = index >= currentCardIndex && index < currentCardIndex + 3;
    
    if (!isVisible) return null;

    const zIndex = Math.min(products.length - index, 100); // Cap z-index to stay below header
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
          <Text style={styles.loadingText}>Loading your personalized feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
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
      <StatusBar barStyle="light-content" backgroundColor="#221e27" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Discover</Text>
            <Text style={styles.headerSubtitle}>
              {hasMoreCards 
                ? `${products.length - currentCardIndex} products to explore`
                : 'All caught up!'
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.skippedButton} 
            onPress={handleShowSkippedProducts}
            activeOpacity={0.7}
          >
            <Text style={styles.skippedButtonIcon}>↻</Text>
            <Text style={styles.skippedButtonText}>View Skipped</Text>
          </TouchableOpacity>
        </View>
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
        pointerEvents="none"
      >
        <View style={[styles.refreshHint, { pointerEvents: 'auto' }]}>
          <Text style={styles.refreshHintText}>Pull down to refresh</Text>
        </View>
      </ScrollView>

      {/* Skipped Products Modal */}
      <Modal
        visible={showSkippedModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal close requested');
          setShowSkippedModal(false);
        }}
        onShow={() => console.log('Modal is now visible')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Skipped Products</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowSkippedModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {skippedCategories.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <Text style={styles.modalEmptyText}>No skipped products yet</Text>
                <Text style={styles.modalEmptySubtext}>
                  Products you skip will appear here organized by category
                </Text>
              </View>
            ) : (
              <FlatList
                data={skippedCategories}
                keyExtractor={(item) => item.category}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => handleNavigateToSkippedCategory(item.category)}
                  >
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                      </Text>
                      <Text style={styles.categoryCount}>
                        {item.count} skipped product{item.count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={styles.categoryChevron}>›</Text>
                  </TouchableOpacity>
                )}
                style={styles.categoriesList}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});

FeedScreen.displayName = 'FeedScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#221e27',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#221e27',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    zIndex: 1000,
    elevation: 10,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e1ecf8ff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d7dce0ff',
  },

  skippedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#08f88c',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skippedButtonIcon: {
    fontSize: 16,
    color: '#221e27',
    fontWeight: 'bold',
    marginRight: 6,
  },
  skippedButtonText: {
    fontSize: 12,
    color: '#221e27',
    fontWeight: '600',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  allDoneAction: {
    fontSize: 16,
    color: '#a1b1c0ff',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: 'bold',
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesList: {
    flex: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: '#6C757D',
  },
  categoryChevron: {
    fontSize: 20,
    color: '#6C757D',
  },
});