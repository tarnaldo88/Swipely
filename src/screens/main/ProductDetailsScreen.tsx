import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { MainStackParamList, ProductCard, Product } from "../../types";
import { AddToCartButton } from "../../components/product/AddToCartButton";
import { getSwipeActionService } from "../../services/SwipeActionService";
import { ImageGallery } from "../../components/product/ImageGallery";
import { ProductDetailsService } from "../../services/ProductDetailsService";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type ProductDetailsScreenRouteProp = RouteProp<
  MainStackParamList,
  "ProductDetails"
>;
type ProductDetailsScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  "ProductDetails"
>;

interface ProductDetailsScreenProps {}

export const ProductDetailsScreen: React.FC<ProductDetailsScreenProps> = () => {
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const route = useRoute<ProductDetailsScreenRouteProp>();
  const { productId, product: initialProduct } = route.params;

  const [product, setProduct] = useState<ProductCard | null>(
    initialProduct || null
  );
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Animation values for modal presentation
  const translateY = useSharedValue(screenHeight);
  const opacity = useSharedValue(0);

  // Mock user ID - in real app this would come from auth context
  const userId = "mock-user-id";
  const swipeActionService = getSwipeActionService(userId);

  useEffect(() => {
    // Animate modal in
    translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 300 });

    // Load product details if not provided
    if (!initialProduct) {
      loadProductDetails();
    }
  }, []);

  const loadProductDetails = async (isRetry: boolean = false) => {
    try {
      if (isRetry) {
        setIsRetrying(true);
        setRetryCount((prev) => prev + 1);
      } else {
        setLoading(true);
      }
      setError(null);

      // Use ProductDetailsService for optimized loading with caching
      const productDetails = await ProductDetailsService.getProductDetails(
        productId
      );
      setProduct(productDetails);

      // Reset retry count on success
      if (isRetry) {
        setRetryCount(0);
      }
    } catch (err) {
      const errorMessage =
        retryCount >= 2
          ? "Unable to load product details. Please check your connection and try again."
          : "Failed to load product details";
      setError(errorMessage);
      console.error("Error loading product details:", err);
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
    translateY.value = withTiming(screenHeight, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(() => {
        setIsVisible(false);
        navigation.goBack();
      })();
    });
  }, [navigation]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 500) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const handleLike = useCallback(async () => {
    if (!product) return;

    try {
      await swipeActionService.onSwipeRight(product.id);
      Alert.alert(
        "Added to Wishlist",
        "Product has been added to your wishlist!"
      );
    } catch (error) {
      console.error("Error liking product:", error);
      Alert.alert("Error", "Failed to add product to wishlist");
    }
  }, [product, swipeActionService]);

  const handleSkip = useCallback(async () => {
    if (!product) return;

    try {
      await swipeActionService.onSwipeLeft(product.id);
      handleClose();
    } catch (error) {
      console.error("Error skipping product:", error);
      handleClose();
    }
  }, [product, swipeActionService, handleClose]);

  const handleAddToCart = useCallback(async () => {
    if (!product) return;

    try {
      await swipeActionService.onAddToCart(product.id);
      Alert.alert("Added to Cart", "Product has been added to your cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add product to cart");
    }
  }, [product, swipeActionService]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      <View style={styles.modalOverlay}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
            <SafeAreaView style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.dragIndicator} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1976D2" />
                  <Text style={styles.loadingText}>
                    Loading product details...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    style={[
                      styles.retryButton,
                      (isRetrying || retryCount >= 3) &&
                        styles.retryButtonDisabled,
                    ]}
                    onPress={handleRetry}
                    disabled={isRetrying || retryCount >= 3}
                  >
                    {isRetrying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.retryButtonText}>
                        {retryCount >= 3 ? "Max retries reached" : "Retry"}
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
                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Image Gallery with optimizations */}
                  <ImageGallery
                    images={product.imageUrls}
                    enableLazyLoading={true}
                    preloadRadius={1}
                  />

                  {/* Product Information */}
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>{product.title}</Text>
                    <Text style={styles.productPrice}>
                      {product.currency}
                      {product.price.toFixed(2)}
                    </Text>
                    <Text style={styles.productCategory}>
                      {product.category.name}
                    </Text>

                    {!product.availability && (
                      <Text style={styles.outOfStock}>Out of Stock</Text>
                    )}

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.productDescription}>
                      {product.description}
                    </Text>

                    {/* Specifications */}
                    {Object.keys(product.specifications).length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>Specifications</Text>
                        <View style={styles.specificationsContainer}>
                          {Object.entries(product.specifications).map(
                            ([key, value]) => (
                              <View key={key} style={styles.specificationRow}>
                                <Text style={styles.specificationKey}>
                                  {key}:
                                </Text>
                                <Text style={styles.specificationValue}>
                                  {String(value)}
                                </Text>
                              </View>
                            )
                          )}
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
                    title={
                      product.availability ? "Add to Cart" : "Out of Stock"
                    }
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
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    // maxWidth: 500,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    // maxWidth: 500,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: -20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  retryButtonDisabled: {
    backgroundColor: "#BDBDBD",
    opacity: 0.6,
  },
  retryCountText: {
    fontSize: 12,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },
  productInfo: {
    padding: 20,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
    lineHeight: 32,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  productCategory: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 16,
    textTransform: "capitalize",
  },
  outOfStock: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginTop: 24,
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 24,
    marginBottom: 16,
  },
  specificationsContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  specificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  specificationKey: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
    flex: 1,
  },
  specificationValue: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  skipButtonText: {
    color: "#F44336",
    fontWeight: "600",
    fontSize: 16,
  },
  cartButton: {
    backgroundColor: "#1976D2",
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  likeButton: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  likeButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 16,
  },
});
