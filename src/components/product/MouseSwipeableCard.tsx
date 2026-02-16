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
import { MouseSwipeStyles } from "@/screens/Styles/CardStyles";

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
    (direction: "left" | "right") => {
      // Advance UI immediately
      if (direction === "left") {
        onSwipeLeft?.(product.id);
      } else {
        onSwipeRight?.(product.id);
      }

      // Run side effects after UI update (non-blocking)
      setTimeout(async () => {
        try {
          if (direction === "left") {
            await swipeActionService.onSwipeLeft(product.id);
          } else {
            await swipeActionService.onSwipeRight(product.id);
          }
        } catch (error) {
          console.error("Error handling swipe:", error);
        }
      }, 0);
    },
    [product.id, swipeActionService, onSwipeLeft, onSwipeRight]
  );

  const resetPosition = useCallback(() => {
    Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }),
      Animated.spring(rotate, {
        toValue: 0,
        useNativeDriver: true,
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
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: direction === "left" ? -0.3 : 0.3,
          duration: 300,
          useNativeDriver: true,
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
      if (onViewDetails) {
        onViewDetails(product.id);
      } else {
        navigation.navigate("ProductDetails", {
          productId: product.id,
          product: product,
        });
      }
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
    <View style={MouseSwipeStyles.cardContainer}>
      <Animated.View
        style={[MouseSwipeStyles.card, cardStyle]}
        {...panResponder.panHandlers}
      >
        <Pressable style={MouseSwipeStyles.cardContent} onPress={handleViewDetails}>
          {/* Product Image */}
          <View style={MouseSwipeStyles.imageContainer}>
            <Image source={{ uri: primaryImage }} style={MouseSwipeStyles.productImage} />

            {/* Swipe Overlays */}
            <Animated.View
              style={[
                MouseSwipeStyles.overlay,
                MouseSwipeStyles.likeOverlay,
                { opacity: likeOpacity },
              ]}
            >
              <Image
                source={require("../../../assets/SwipelyBag.png")}
                style={MouseSwipeStyles.logo}
              />
              <Text style={MouseSwipeStyles.overlayText}>LIKE</Text>
            </Animated.View>

            <Animated.View
              style={[
                MouseSwipeStyles.overlay,
                MouseSwipeStyles.skipOverlay,
                { opacity: skipOpacity },
              ]}
            >
              <Text style={MouseSwipeStyles.overlayText}>SKIP</Text>
            </Animated.View>
          </View>

          {/* Product Info */}
          <View style={MouseSwipeStyles.productInfo}>
            <Text style={MouseSwipeStyles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={MouseSwipeStyles.productPrice}> {formattedPrice}</Text>
            <Text style={MouseSwipeStyles.productCategory}>{product.category.name}</Text>

            {!product.availability && (
              <Text style={MouseSwipeStyles.outOfStock}>Out of Stock</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={MouseSwipeStyles.actionButtons}>
            <TouchableOpacity
              style={[MouseSwipeStyles.actionButton, MouseSwipeStyles.skipButton]}
              onPress={() => animateSwipe("left")}
              activeOpacity={0.7}
            >
              <Text style={MouseSwipeStyles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <AddToCartButton
              onPress={handleAddToCart}
              disabled={!product.availability}
              style={[MouseSwipeStyles.actionButton, MouseSwipeStyles.cartButton]}
              textStyle={MouseSwipeStyles.cartButtonText}
              title={product.availability ? "Add to Cart" : "Out of Stock"}
            />

            <TouchableOpacity
              style={[MouseSwipeStyles.actionButton, MouseSwipeStyles.likeButton]}
              onPress={() => animateSwipe("right")}
              activeOpacity={0.7}
            >
              <Text style={MouseSwipeStyles.likeButtonText}>Like</Text>
            </TouchableOpacity>
          </View>

          {/* View Details Button */}
          <View style={MouseSwipeStyles.detailsButtonContainer}>
            <ViewDetailsButton
              onPress={handleViewDetails}
              style={MouseSwipeStyles.detailsButton}
              textStyle={MouseSwipeStyles.detailsButtonText}
              title="View Details"
            />
          </View>
        </Pressable>
      </Animated.View>

      {/* Swipe Instructions */}
      {isTopCard && (
        <View style={MouseSwipeStyles.instructionsContainer}>
          <Text style={MouseSwipeStyles.instructionsText}>
            💡 Drag left to skip, right to like, or use buttons below
          </Text>
        </View>
      )}
    </View>
  );
};
