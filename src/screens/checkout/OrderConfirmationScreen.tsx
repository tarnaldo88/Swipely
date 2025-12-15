/**
 * Order Confirmation Screen
 * Displays order confirmation and details after successful payment
 * Final step in the checkout flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { CheckoutService } from '../../services/CheckoutService';
import { OrderService } from '../../services/OrderService';
import { Order, CartItem } from '../../types/checkout';
import { OrderConfirmationStyles } from '../Styles/OrderConfirmationStyles';

type OrderConfirmationScreenProps = StackScreenProps<any, 'Confirmation'>;

export const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrderData();
  }, []);

  const loadOrderData = async () => {
    try {
      const state = CheckoutService.getState();

      // Create order from checkout state
      if (state.cartItems.length > 0 && state.shippingAddress) {
        const calculation = CheckoutService.calculateTotals();

        const newOrder = OrderService.createOrder(
          state.cartItems,
          state.shippingAddress,
          calculation.subtotal,
          calculation.tax,
          calculation.shipping,
          'user-123' // In production, get from auth context
        );

        // Save order to history
        await OrderService.saveOrder(newOrder);
        setOrder(newOrder);

        // Clear checkout state
        CheckoutService.resetCheckout();
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      Alert.alert('Error', 'Failed to load order confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueShopping = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleViewOrderHistory = () => {
    navigation.navigate('OrderHistory');
  };

  const renderOrderItem = (item: CartItem) => (
    <View key={item.productId} style={OrderConfirmationStyles.orderItemContainer}>
      <Image source={{ uri: item.imageUrl }} style={OrderConfirmationStyles.itemImage} />

      <View style={OrderConfirmationStyles.itemDetails}>
        <Text style={OrderConfirmationStyles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={OrderConfirmationStyles.itemPrice}>${item.price.toFixed(2)}</Text>
        <Text style={OrderConfirmationStyles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>

      <Text style={OrderConfirmationStyles.itemTotal}>
        ${(item.price * item.quantity).toFixed(2)}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={OrderConfirmationStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={OrderConfirmationStyles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={OrderConfirmationStyles.errorContainer}>
        <Text style={OrderConfirmationStyles.errorText}>Failed to load order confirmation</Text>
        <TouchableOpacity
          style={OrderConfirmationStyles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={OrderConfirmationStyles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={OrderConfirmationStyles.container}>
      {/* Success Header */}
      <View style={OrderConfirmationStyles.successContainer}>
        <View style={OrderConfirmationStyles.checkmarkCircle}>
          <Text style={OrderConfirmationStyles.checkmark}>✓</Text>
        </View>
        <Text style={OrderConfirmationStyles.successTitle}>Order Confirmed!</Text>
        <Text style={OrderConfirmationStyles.successSubtitle}>
          Thank you for your purchase
        </Text>
      </View>

      {/* Order Details */}
      <View style={OrderConfirmationStyles.detailsContainer}>
        <View style={OrderConfirmationStyles.detailRow}>
          <Text style={OrderConfirmationStyles.detailLabel}>Order ID:</Text>
          <Text style={OrderConfirmationStyles.detailValue}>{order.orderId}</Text>
        </View>

        <View style={OrderConfirmationStyles.detailRow}>
          <Text style={OrderConfirmationStyles.detailLabel}>Confirmation #:</Text>
          <Text style={OrderConfirmationStyles.detailValue}>{order.confirmationNumber}</Text>
        </View>

        <View style={OrderConfirmationStyles.detailRow}>
          <Text style={OrderConfirmationStyles.detailLabel}>Order Date:</Text>
          <Text style={OrderConfirmationStyles.detailValue}>
            {order.createdAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={OrderConfirmationStyles.detailRow}>
          <Text style={OrderConfirmationStyles.detailLabel}>Estimated Delivery:</Text>
          <Text style={OrderConfirmationStyles.detailValue}>
            {order.estimatedDelivery.toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Shipping Address */}
      <View style={OrderConfirmationStyles.sectionContainer}>
        <Text style={OrderConfirmationStyles.sectionTitle}>Shipping Address</Text>
        <View style={OrderConfirmationStyles.addressContainer}>
          <Text style={OrderConfirmationStyles.addressText}>{order.shippingAddress.street}</Text>
          <Text style={OrderConfirmationStyles.addressText}>
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
          </Text>
          <Text style={OrderConfirmationStyles.addressText}>{order.shippingAddress.country}</Text>
        </View>
      </View>

      {/* Order Items */}
      <View style={OrderConfirmationStyles.sectionContainer}>
        <Text style={OrderConfirmationStyles.sectionTitle}>Order Items</Text>
        {order.items.map(item => renderOrderItem(item))}
      </View>

      {/* Order Summary */}
      <View style={OrderConfirmationStyles.summaryContainer}>
        <View style={OrderConfirmationStyles.summaryRow}>
          <Text style={OrderConfirmationStyles.summaryLabel}>Subtotal:</Text>
          <Text style={OrderConfirmationStyles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
        </View>

        <View style={OrderConfirmationStyles.summaryRow}>
          <Text style={OrderConfirmationStyles.summaryLabel}>Tax:</Text>
          <Text style={OrderConfirmationStyles.summaryValue}>${order.tax.toFixed(2)}</Text>
        </View>

        <View style={OrderConfirmationStyles.summaryRow}>
          <Text style={OrderConfirmationStyles.summaryLabel}>Shipping:</Text>
          <Text style={OrderConfirmationStyles.summaryValue}>${order.shipping.toFixed(2)}</Text>
        </View>

        <View style={[OrderConfirmationStyles.summaryRow, OrderConfirmationStyles.totalRow]}>
          <Text style={OrderConfirmationStyles.totalLabel}>Total:</Text>
          <Text style={OrderConfirmationStyles.totalValue}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={OrderConfirmationStyles.buttonContainer}>
        <TouchableOpacity
          style={OrderConfirmationStyles.secondaryButton}
          onPress={handleViewOrderHistory}
        >
          <Text style={OrderConfirmationStyles.secondaryButtonText}>View Order History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={OrderConfirmationStyles.primaryButton}
          onPress={handleContinueShopping}
        >
          <Text style={OrderConfirmationStyles.primaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
