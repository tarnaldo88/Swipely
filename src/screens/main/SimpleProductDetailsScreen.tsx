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
import { SimpleProductDetailStyles } from '../Styles/ProductStyles';

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
      <View style={SimpleProductDetailStyles.modalBackground}>
        <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
        <SafeAreaView style={SimpleProductDetailStyles.safeArea}>
        {/* Header */}
        <View style={SimpleProductDetailStyles.header}>
          <TouchableOpacity
            style={SimpleProductDetailStyles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={SimpleProductDetailStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={SimpleProductDetailStyles.headerTitle}>Product Details</Text>
          <View style={SimpleProductDetailStyles.headerSpacer} />
        </View>

        {loading ? (
          <View style={SimpleProductDetailStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={SimpleProductDetailStyles.loadingText}>Loading product details...</Text>
          </View>
        ) : error ? (
          <View style={SimpleProductDetailStyles.errorContainer}>
            <Text style={SimpleProductDetailStyles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[SimpleProductDetailStyles.retryButton, (isRetrying || retryCount >= 3) && SimpleProductDetailStyles.retryButtonDisabled]} 
              onPress={handleRetry}
              disabled={isRetrying || retryCount >= 3}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={SimpleProductDetailStyles.retryButtonText}>
                  {retryCount >= 3 ? 'Max retries reached' : 'Retry'}
                </Text>
              )}
            </TouchableOpacity>
            {retryCount > 0 && (
              <Text style={SimpleProductDetailStyles.retryCountText}>
                Attempt {retryCount} of 3
              </Text>
            )}
          </View>
        ) : product ? (
          <ScrollView style={SimpleProductDetailStyles.content} showsVerticalScrollIndicator={false}>
            {/* Image Gallery */}
            <SimpleImageGallery images={product.imageUrls} />

            {/* Paragraph text explaining product */}
            {/* <View>

            </View> */}

            {/* Product Information */}
            <View style={SimpleProductDetailStyles.productInfo}>
              <Text style={SimpleProductDetailStyles.productTitle}>{product.title}</Text>
              <Text style={SimpleProductDetailStyles.productPrice}>
                {product.currency}{product.price.toFixed(2)}
              </Text>
              <Text style={SimpleProductDetailStyles.productCategory}>{product.category.name}</Text>
              
              {!product.availability && (
                <Text style={SimpleProductDetailStyles.outOfStock}>Out of Stock</Text>
              )}

              <Text style={SimpleProductDetailStyles.sectionTitle}>Description</Text>
              <Text style={SimpleProductDetailStyles.productDescription}>{product.description}</Text>

              {/* Specifications */}
              {Object.keys(product.specifications).length > 0 && (
                <>
                  <Text style={SimpleProductDetailStyles.sectionTitle}>Specifications</Text>
                  <View style={SimpleProductDetailStyles.specificationsContainer}>
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <View key={key} style={SimpleProductDetailStyles.specificationRow}>
                        <Text style={SimpleProductDetailStyles.specificationKey}>{key}:</Text>
                        <Text style={SimpleProductDetailStyles.specificationValue}>{String(value)}</Text>
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
          <View style={SimpleProductDetailStyles.actionButtons}>
            <TouchableOpacity
              style={[SimpleProductDetailStyles.actionButton, SimpleProductDetailStyles.skipButton]}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={SimpleProductDetailStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <AddToCartButton
              onPress={handleAddToCart}
              disabled={!product.availability}
              style={[SimpleProductDetailStyles.actionButton, SimpleProductDetailStyles.cartButton]}
              textStyle={SimpleProductDetailStyles.cartButtonText}
              title={product.availability ? 'Add to Cart' : 'Out of Stock'}
            />

            <TouchableOpacity
              style={[SimpleProductDetailStyles.actionButton, SimpleProductDetailStyles.likeButton]}
              onPress={handleLike}
              activeOpacity={0.7}
            >
              <Text style={SimpleProductDetailStyles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>
        )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

