import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  RefreshControl,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProductCard, MainStackParamList } from '../../types';
import { ProductFeedService } from '../../services/ProductFeedService';
import { getSkippedProductsService } from '../../services/SkippedProductsService';
import { ImageCacheManager } from '../../utils/ImageCacheManager';
import { MemoizationHelper } from '../../utils/StateManagementOptimizer';
import { SkippedProductsModal } from '../../components/feed/SkippedProductsModal';
import { ToastNotification } from '../../components/feed/ToastNotification';
import { CardsContainer } from '../../components/feed/CardsContainer';
import { FeedHeader } from '../../components/feed/FeedHeader';
import { FeedScreenStyles } from '../Styles/ProductStyles';

type FeedScreenNavigationProp = StackNavigationProp<MainStackParamList>;

// Mock user ID - in real app this would come from auth context
const MOCK_USER_ID = 'mock-user-123';

export const FeedScreen: React.FC = memo(() => {
  const navigation = useNavigation<FeedScreenNavigationProp>();
  
  // Separate state into logical groups to minimize re-renders
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  // Modal state - separated to prevent re-rendering cards
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [skippedCategories, setSkippedCategories] = useState<{ category: string; count: number }[]>([]);
  
  // Toast state - separated to prevent re-rendering cards
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const skippedProductsService = getSkippedProductsService();
  const imageCacheManager = ImageCacheManager.getInstance();

  // Memoize products array to prevent unnecessary re-renders
  const memoizedProducts = useMemo(
    () => MemoizationHelper.memoizeArray('feed-products', products),
    [products]
  );

  // Memoize skipped categories to prevent unnecessary re-renders
  const memoizedSkippedCategories = useMemo(
    () => MemoizationHelper.memoizeArray('skipped-categories', skippedCategories),
    [skippedCategories]
  );

  // Preload images for next 3 cards
  useEffect(() => {
    if (memoizedProducts.length > 0) {
      const nextProducts = memoizedProducts.slice(currentCardIndex, currentCardIndex + 3);
      const imageUris = nextProducts.flatMap(p => p.imageUrls);
      
      if (imageUris.length > 0) {
        imageCacheManager.preloadImages(imageUris).catch(error => {
          console.warn('Failed to preload images:', error);
        });
      }
    }
  }, [currentCardIndex, memoizedProducts, imageCacheManager]);

  useEffect(() => {
    loadProducts();
    addTestSkippedProducts();

    const unsubscribe = navigation.addListener('focus', () => {
      // No-op: ProductDetailsScreen handles advancing
    });

    return unsubscribe;
  }, [navigation]);

  const addTestSkippedProducts = async () => {
    try {
      await skippedProductsService.addSkippedProduct('prod-1', 'electronics');
      await skippedProductsService.addSkippedProduct('prod-2', 'fashion');
      await skippedProductsService.addSkippedProduct('prod-3', 'electronics');
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
    try {
      const product = memoizedProducts.find(p => p.id === productId);
      const category = product?.category.id || 'general';
      
      await Promise.all([
        skippedProductsService.addSkippedProduct(productId, category),
        ProductFeedService.recordSwipeAction(productId, 'skip', MOCK_USER_ID)
      ]);
      
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error recording skip action:', error);
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [memoizedProducts, skippedProductsService]);

  const handleSwipeRight = useCallback(async (productId: string) => {
    try {
      const { getWishlistService } = require('../../services/WishlistService');
      const wishlistService = getWishlistService();
      
      await wishlistService.addToWishlist(productId);
      await ProductFeedService.recordSwipeAction(productId, 'like', MOCK_USER_ID);
      
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      showToastNotification('Failed to add product to wishlist. Please try again.');
      setCurrentCardIndex(prev => prev + 1);
    }
  }, []);

  const showToastNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 1000);
  }, []);

  const handleAddToCart = useCallback(async (productId: string) => {
    try {
      const { getCartService } = require('../../services/CartService');
      const cartService = getCartService();
      
      await cartService.addToCart(productId, 1);
      const cartCount = await cartService.getCartCount();
      
      showToastNotification(`Added to cart! (${cartCount} items)`);
      setCurrentCardIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToastNotification('Failed to add to cart');
      setCurrentCardIndex(prev => prev + 1);
    }
  }, [showToastNotification]);

  const handleViewDetails = useCallback((productId: string) => {
    const product = memoizedProducts.find(p => p.id === productId);
    if (product) {
      navigation.navigate('ProductDetails', { 
        productId, 
        product,
        onActionComplete: () => {
          setCurrentCardIndex(prev => prev + 1);
        }
      });
    }
  }, [memoizedProducts, navigation]);

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
    try {
      await loadSkippedCategories();
      setShowSkippedModal(true);
    } catch (error) {
      console.error('Error showing skipped products:', error);
    }
  }, [loadSkippedCategories]);

  const handleCloseModal = useCallback(() => {
    setShowSkippedModal(false);
  }, []);

  const handleNavigateToSkippedCategory = useCallback((category: string) => {
    navigation.navigate('SkippedProducts', { category });
  }, [navigation]);

  // Memoize derived values to prevent unnecessary calculations
  const hasMoreCards = useMemo(() => currentCardIndex < memoizedProducts.length, [currentCardIndex, memoizedProducts.length]);
  const remainingProducts = useMemo(() => memoizedProducts.length - currentCardIndex, [memoizedProducts.length, currentCardIndex]);

  if (loading) {
    return (
      <SafeAreaView style={FeedScreenStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
        <View style={FeedScreenStyles.loadingContainer}>
          <Text style={FeedScreenStyles.loadingText}>Loading your personalized feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (memoizedProducts.length === 0) {
    return (
      <SafeAreaView style={FeedScreenStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#221e27" />
        <ScrollView
          contentContainerStyle={FeedScreenStyles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <Text style={FeedScreenStyles.emptyTitle}>No Products Available</Text>
          <Text style={FeedScreenStyles.emptySubtitle}>
            Pull down to refresh and discover new products!
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={FeedScreenStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#221e27" />
      
      {/* Header - separated component */}
      <FeedHeader
        remainingProducts={remainingProducts}
        hasMoreCards={hasMoreCards}
        onShowSkippedProducts={handleShowSkippedProducts}
      />

      {/* Cards Container - separated component */}
      {hasMoreCards ? (
        <CardsContainer
          products={memoizedProducts}
          currentCardIndex={currentCardIndex}
          userId={MOCK_USER_ID}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onAddToCart={handleAddToCart}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <View style={FeedScreenStyles.allDoneContainer}>
          <Text style={FeedScreenStyles.allDoneTitle}>🎉 All Done!</Text>
          <Text style={FeedScreenStyles.allDoneSubtitle}>
            You've seen all available products.
          </Text>
          <Text style={FeedScreenStyles.allDoneAction}>
            Pull down to refresh for new products!
          </Text>
        </View>
      )}

      {/* Pull to refresh hint */}
      <ScrollView
        style={FeedScreenStyles.refreshScrollView}
        contentContainerStyle={FeedScreenStyles.refreshContainer}
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
        <View style={[FeedScreenStyles.refreshHint, { pointerEvents: 'auto' }]}>
          <Text style={FeedScreenStyles.refreshHintText}>Pull down to refresh</Text>
        </View>
      </ScrollView>

      {/* Skipped Products Modal - separated component */}
      <SkippedProductsModal
        visible={showSkippedModal}
        skippedCategories={memoizedSkippedCategories}
        onClose={handleCloseModal}
        onCategorySelect={handleNavigateToSkippedCategory}
      />

      {/* Toast Notification - separated component */}
      <ToastNotification
        visible={showToast}
        message={toastMessage}
      />
    </SafeAreaView>
  );
});

FeedScreen.displayName = 'FeedScreen';

