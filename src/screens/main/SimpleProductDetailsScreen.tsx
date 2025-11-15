import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList, ProductCard } from '../../types';
import { AddToCartButton } from '../../components/product/AddToCartButton';
import { getSwipeActionService } from '../../services/SwipeActionService';
import { SimpleImageGallery } from '../../components/product/SimpleImageGallery';
import { ProductDetailsService } from '../../services/ProductDetailsService';

type ProductDetailsScreenRouteProp = RouteProp<MainStackParamList, 'ProductDetails'>;
type ProductDetailsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ProductDetails'>;

interface SimpleProductDetailsScreenProps {}

export const SimpleProductDetailsScreen: React.FC<SimpleProductDetailsScreenProps> = () => {
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const { productId, product: initialProduct } = route.params;

  const [product, setProduct] = useState<ProductCard | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Mock user ID - in real app this would come from auth context
  const userId = 'mock-user-id';
  const swipeActionService = getSwipeActionService(userId);

  useEffect(() => {
    // Load product details if not provided
    if (!initialProduct) {
      loadProductDetails();
    }
  }, []);

  const loadProductDetails = async (isRetry: boolean = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Use ProductDetailsService for optimized loading with caching
      const productDetails = await ProductDetailsService.getProductDetails(productId);
      setProduct(productDetails);
      
      // Reset retry count on success
      if (isRetry) {
        setRetryCount(0);
      }
    } catch (err) {
      const errorMessage = retryCount >= 2 
        ? 'Unable to load product details. Please check your connection and try again.'
        : 'Failed to load product details';
      setError(errorMessage);
      console.error('Error loading product details:', err);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      loadProductDetails(true);
    }
  };

  const handleClose = useCallback(() => {
    setIsVisible(false);
    navigation.goBack();
  }, [navigation]);

  const handleLike = useCallback(async () => {
    if (!product) return;
    
    try {
      await swipeActionService.onSwipeRight(product.id);
      Alert.alert('Added to Wishlist', 'Product has been added to your wishlist!');
    } catch (error) {
      console.error('Error liking product:', error);
      Alert.alert('Error', 'Failed to add product to wishlist');
    }
  }, [product, swipeActionService]);

  const handleSkip = useCallback(async () => {
    if (!product) return;
    
    try {
      await swipeActionService.onSwipeLeft(product.id);
      handleClose();
    } catch (error) {
      console.error('Error skipping product:', error);
      handleClose();
    }
  }, [product, swipeActionService, handleClose]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    
    try {
      await swipeActionService.onAddToCart(product.id);
      Alert.alert('Added to Cart', 'Product has been added to your cart!');
      // Close modal and go back to feed
      handleClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    }
  }, [product, swipeActionService, handleClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackground}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, (isRetrying || retryCount >= 3) && styles.retryButtonDisabled]} 
              onPress={handleRetry}
              disabled={isRetrying || retryCount >= 3}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.retryButtonText}>
                  {retryCount >= 3 ? 'Max retries reached' : 'Retry'}
                </Text>
              )}
            </TouchableOpacity>
            {retryCount > 0 && (
              <Text style={styles.retryCountText}>
                Attempt {retryCount} of 3
              </Text>
            )}
          </View>
        ) : product ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Image Gallery */}
            <SimpleImageGallery images={product.imageUrls} />

            {/* Paragraph text explaining product */}
            {/* <View>

            </View> */}

            {/* Product Information */}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.productPrice}>
                {product.currency}{product.price.toFixed(2)}
              </Text>
              <Text style={styles.productCategory}>{product.category.name}</Text>
              
              {!product.availability && (
                <Text style={styles.outOfStock}>Out of Stock</Text>
              )}

              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.productDescription}>{product.description}</Text>

              {/* Specifications */}
              {Object.keys(product.specifications).length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Specifications</Text>
                  <View style={styles.specificationsContainer}>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <View key={key} style={styles.specificationRow}>
                        <Text style={styles.specificationKey}>{key}:</Text>
                        <Text style={styles.specificationValue}>{String(value)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        ) : null}

        {/* Action Buttons */}
        {product && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <AddToCartButton
              onPress={handleAddToCart}
              disabled={!product.availability}
              style={[styles.actionButton, styles.cartButton]}
              textStyle={styles.cartButtonText}
              title={product.availability ? 'Add to Cart' : 'Out of Stock'}
            />

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Text style={styles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>
        )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: '#221e27',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#221e27',
    maxWidth: 600,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#221e27',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  retryButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  retryCountText: {
    fontSize: 12,
    color: '#b6b5b5ff',
    marginTop: 8,
    textAlign: 'center',
  },
  productInfo: {
    padding: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f3ededff',
    marginBottom: 8,
    lineHeight: 32,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1fa726ff',
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 16,
    color: '#afaeaeff',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  outOfStock: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f7f1f1ff',
    marginTop: 24,
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    color: '#f5ebebff',
    lineHeight: 24,
    marginBottom: 16,
  },
  specificationsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  specificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  specificationKey: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
    flex: 1,
  },
  specificationValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#c725f8ff',
  },
  skipButtonText: {
    color: '#b91decff',
    fontWeight: '600',
    fontSize: 16,
  },
  cartButton: {
    backgroundColor: '#08f88c',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  likeButton: {
    backgroundColor: '#c725f8ff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  likeButtonText: {
    color: '#f1fcf1ff',
    fontWeight: '600',
    fontSize: 16,
  },
});