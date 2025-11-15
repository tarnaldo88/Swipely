import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
  PanResponder,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { ProductCard, MainStackParamList } from "../../types";
import { getSwipeActionService } from "../../services/SwipeActionService";
import { AddToCartButton } from "./AddToCartButton";
import { ViewDetailsButton } from "./ViewDetailsButton";

const { width: screenWidth } = Dimensions.get("window");
// Limit card width for large screens (max 500px)
const CARD_WIDTH = Math.min(screenWidth * 0.9, 500);
const SWIPE_THRESHOLD = 100;

type MouseSwipeableCardNavigationProp = StackNavigationProp<MainStackParamList>;

interface MouseSwipeableCardProps {
  product: ProductCard;
  userId: string;
  onSwipeLeft?: (productId: string) => void;
  onSwipeRight?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  isTopCard?: boolean;
}

export const MouseSwipeableCard: React.FC<MouseSwipeableCardProps> = ({
  product,
  userId,
  onSwipeLeft,
  onSwipeRight,
  onAddToCart,
  onViewDetails,
  isTopCard = true,
}) => {
  const navigation = useNavigation<MouseSwipeableCardNavigationProp>();
  const swipeActionService = getSwipeActionService(userId);

  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  const handleSwipeComplete = useCallback(
    async (direction: "left" | "right") => {
      try {
        if (direction === "left") {
          await swipeActionService.onSwipeLeft(product.id);
          onSwipeLeft?.(product.id);
        } else {
          await swipeActionService.onSwipeRight(product.id);
          onSwipeRight?.(product.id);
        }
      } catch (error) {
        console.error("Error handling swipe:", error);
      }
    },
    [product.id, swipeActionService, onSwipeLeft, onSwipeRight]
  );

  const resetPosition = useCallback(() => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start();
  }, [pan, rotate]);

  const animateSwipe = useCallback(
    (direction: "left" | "right") => {
      const toValue = direction === "left" ? -screenWidth : screenWidth;

      Animated.parallel([
        Animated.timing(pan, {
          toValue: { x: toValue, y: -100 },
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(rotate, {
          toValue: direction === "left" ? -0.3 : 0.3,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => {
        handleSwipeComplete(direction);
      });
    },
    [pan, rotate, handleSwipeComplete]
  );

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to horizontal swipes
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 10
      );
    },
    onPanResponderGrant: () => {
      setIsDragging(true);
      pan.setOffset({
        x: (pan.x as any)._value,
        y: (pan.y as any)._value,
      });
    },
    onPanResponderMove: (evt, gestureState) => {
      // Update position and rotation based on drag
      pan.setValue({ x: gestureState.dx, y: gestureState.dy * 0.1 });
      rotate.setValue(gestureState.dx * 0.001);
    },
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      pan.flattenOffset();

      const { dx, vx } = gestureState;
      const shouldSwipeLeft = dx < -SWIPE_THRESHOLD || vx < -0.5;
      const shouldSwipeRight = dx > SWIPE_THRESHOLD || vx > 0.5;

      if (shouldSwipeLeft) {
        animateSwipe("left");
      } else if (shouldSwipeRight) {
        animateSwipe("right");
      } else {
        resetPosition();
      }
    },
  });

  const handleAddToCart = useCallback(async () => {
    try {
      await swipeActionService.onAddToCart(product.id);
      onAddToCart?.(product.id);
    } catch (error) {
      console.error("Error handling add to cart:", error);
    }
  }, [product.id, swipeActionService, onAddToCart]);

  const handleViewDetails = useCallback(async () => {
    if (isDragging) return; // Don't navigate while dragging

    try {
      await swipeActionService.onViewDetails(product.id);
      navigation.navigate("ProductDetails", {
        productId: product.id,
        product: product,
      });
      onViewDetails?.(product.id);
    } catch (error) {
      console.error("Error handling view details:", error);
    }
  }, [product, swipeActionService, navigation, onViewDetails, isDragging]);

  const primaryImage =
    product.imageUrls[0] || "https://via.placeholder.com/300x400";
  const formattedPrice = `${product.currency}${product.price.toFixed(2)}`;

  // Calculate overlay opacity based on pan position
  const likeOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const skipOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const cardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      {
        rotate: rotate.interpolate({
          inputRange: [-0.3, 0, 0.3],
          outputRange: ["-15deg", "0deg", "15deg"],
        }),
      },
    ],
  };

  return (
    <View style={styles.cardContainer}>
      <Animated.View
        style={[styles.card, cardStyle]}
        {...panResponder.panHandlers}
      >
        <Pressable style={styles.cardContent} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: primaryImage }} style={styles.productImage} />

            {/* Swipe Overlays */}
            <Animated.View
              style={[
                styles.overlay,
                styles.likeOverlay,
                { opacity: likeOpacity },
              ]}
            >
              <Image
                source={require("../../../assets/SwipelyBag.png")}
                style={styles.logo}
              />
              <Text style={styles.overlayText}>LIKE</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.overlay,
                styles.skipOverlay,
                { opacity: skipOpacity },
              ]}
            >
              <Text style={styles.overlayText}>SKIP</Text>
            </Animated.View>
          </View>

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.productPrice}> {formattedPrice}</Text>
            <Text style={styles.productCategory}>{product.category.name}</Text>

            {!product.availability && (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.skipButton]}
              onPress={() => animateSwipe("left")}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <AddToCartButton
              onPress={handleAddToCart}
              disabled={!product.availability}
              style={[styles.actionButton, styles.cartButton]}
              textStyle={styles.cartButtonText}
              title={product.availability ? "Add to Cart" : "Out of Stock"}
            />

            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton]}
              onPress={() => animateSwipe("right")}
              activeOpacity={0.7}
            >
              <Text style={styles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>

          {/* View Details Button */}
          <View style={styles.detailsButtonContainer}>
            <ViewDetailsButton
              onPress={handleViewDetails}
              style={styles.detailsButton}
              textStyle={styles.detailsButtonText}
              title="View Details"
            />
          </View>
        </Pressable>
      </Animated.View>

      {/* Swipe Instructions */}
      {isTopCard && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            💡 Drag left to skip, right to like, or use buttons below
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 408,
    height: 204,
    marginBottom: 20,
    resizeMode: "contain",
  },
  cardContainer: {
    paddingTop: 30,
    alignSelf: "center",
    borderColor: "#221e27",
  },
  card: {
    width: CARD_WIDTH,
    maxWidth: 500,
    backgroundColor: "#221e27",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderColor: "#221e27",
    alignSelf: "center",
  },
  cardContent: {
    borderRadius: 16,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 400,
    width: "100%",
    backgroundColor: "#f0f0f0",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  likeOverlay: {
    backgroundColor: "rgba(76, 175, 80, 0.8)",
  },
  skipOverlay: {
    backgroundColor: "rgba(244, 67, 54, 0.8)",
  },
  overlayText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e7e7e7ff",
    marginBottom: 8,
    lineHeight: 24,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#cececeff",
    marginBottom: 8,
  },
  outOfStock: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  skipButton: {
    backgroundColor: "#fff",
    borderColor: "#c725f8ff",
    borderWidth: 1,
  },
  skipButtonText: {
    color: "#b91decff",
    fontWeight: "600",
    fontSize: 14,
  },
  cartButton: {
    backgroundColor: "#08f88c",
  },
  cartButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  likeButton: {
    backgroundColor: "#c725f8ff",
    borderWidth: 1,
    borderColor: "#2bee31ff",
  },
  likeButtonText: {
    color: "#f1fcf1ff",
    fontWeight: "600",
    fontSize: 14,
  },
  detailsButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#21fa501c",
    paddingVertical: 10,
  },
  detailsButtonText: {
    color: "#bbb8b8ff",
    fontSize: 13,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: -40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionsText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
