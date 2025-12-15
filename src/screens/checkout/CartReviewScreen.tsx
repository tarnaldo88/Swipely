/**
 * Cart Review Screen
 * Displays cart items, allows quantity modification and item removal
 * First step in the checkout flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CheckoutService } from '../../services/CheckoutService';
import { CartItem, CartCalculation } from '../../types/checkout';
import { CartReviewStyles } from '../Styles/CartReviewStyles';

type CartReviewScreenProps = StackScreenProps<any, 'CartReview'>;

interface CartItemWithCalculation extends CartItem {
  itemTotal: number;
}

export const CartReviewScreen: React.FC<CartReviewScreenProps> = ({ navigation, route }) => {
  const [cartItems, setCartItems] = useState<CartItemWithCalculation[]>([]);
  const [totals, setTotals] = useState<CartCalculation>({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = () => {
    try {
      const state = CheckoutService.getState();
      const calculation = CheckoutService.calculateTotals();

      const itemsWithTotals: CartItemWithCalculation[] = state.cartItems.map(item => ({
        ...item,
        itemTotal: parseFloat((item.price * item.quantity).toFixed(2)),
      }));

      setCartItems(itemsWithTotals);
      setTotals(calculation);
    } catch (error) {
      console.error('Error loading cart data:', error);
      Alert.alert('Error', 'Failed to load cart data');
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }

    CheckoutService.updateCartItem(productId, newQuantity);
    loadCartData();
  };

  const handleRemoveItem = (productId: string, title: string) => {
    Alert.alert('Remove Item', `Remove ${title} from cart?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Remove',
        onPress: () => {
          CheckoutService.removeCartItem(productId);
          loadCartData();
        },
        style: 'destructive',
      },
    ]);
  };

  const handleProceedToShipping = async () => {
    setIsLoading(true);
    try {
      const state = CheckoutService.proceedToNextStep();

      if (state.error) {
        Alert.alert('Validation Error', state.error);
        setIsLoading(false);
        return;
      }

      navigation.navigate('Shipping');
    } catch (error) {
      console.error('Error proceeding to shipping:', error);
      Alert.alert('Error', 'Failed to proceed to shipping');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItemWithCalculation }) => (
    <View style={CartReviewStyles.cartItemContainer}>
      <Image source={{ uri: item.imageUrl }} style={CartReviewStyles.itemImage} />

      <View style={CartReviewStyles.itemDetails}>
        <Text style={CartReviewStyles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={CartReviewStyles.itemPrice}>${item.price.toFixed(2)}</Text>

        <View style={CartReviewStyles.quantityContainer}>
          <TouchableOpacity
            style={CartReviewStyles.quantityButton}
            onPress={() => handleQuantityChange(item.productId, item.quantity - 1)}
          >
            <Text style={CartReviewStyles.quantityButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={CartReviewStyles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={CartReviewStyles.quantityButton}
            onPress={() => handleQuantityChange(item.productId, item.quantity + 1)}
          >
            <Text style={CartReviewStyles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={CartReviewStyles.itemRightContainer}>
        <Text style={CartReviewStyles.itemTotal}>${item.itemTotal.toFixed(2)}</Text>
        <TouchableOpacity
          style={CartReviewStyles.removeButton}
          onPress={() => handleRemoveItem(item.productId, item.title)}
        >
          <Text style={CartReviewStyles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <View style={CartReviewStyles.emptyContainer}>
        <Text style={CartReviewStyles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity
          style={CartReviewStyles.continueShoppingButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={CartReviewStyles.continueShoppingText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={CartReviewStyles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={item => item.productId}
        contentContainerStyle={CartReviewStyles.listContent}
        scrollEnabled={true}
      />

      <View style={CartReviewStyles.summaryContainer}>
        <View style={CartReviewStyles.summaryRow}>
          <Text style={CartReviewStyles.summaryLabel}>Subtotal:</Text>
          <Text style={CartReviewStyles.summaryValue}>${totals.subtotal.toFixed(2)}</Text>
        </View>

        <View style={CartReviewStyles.summaryRow}>
          <Text style={CartReviewStyles.summaryLabel}>Tax:</Text>
          <Text style={CartReviewStyles.summaryValue}>${totals.tax.toFixed(2)}</Text>
        </View>

        <View style={CartReviewStyles.summaryRow}>
          <Text style={CartReviewStyles.summaryLabel}>Shipping:</Text>
          <Text style={CartReviewStyles.summaryValue}>${totals.shipping.toFixed(2)}</Text>
        </View>

        <View style={[CartReviewStyles.summaryRow, CartReviewStyles.totalRow]}>
          <Text style={CartReviewStyles.totalLabel}>Total:</Text>
          <Text style={CartReviewStyles.totalValue}>${totals.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[CartReviewStyles.proceedButton, isLoading && CartReviewStyles.proceedButtonDisabled]}
          onPress={handleProceedToShipping}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={CartReviewStyles.proceedButtonText}>Proceed to Shipping</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
