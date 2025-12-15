/**
 * Order Details Screen
 * Displays detailed information about a specific order
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Order, CartItem } from '../../types/checkout';
import { OrderConfirmationStyles } from '../Styles/OrderConfirmationStyles';

type OrderDetailsScreenProps = StackScreenProps<any, 'OrderDetails'>;

export const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const order: Order = route.params?.order;

  if (!order) {
    return (
      <View style={OrderConfirmationStyles.errorContainer}>
        <Text style={OrderConfirmationStyles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={OrderConfirmationStyles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={OrderConfirmationStyles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  return (
    <ScrollView style={OrderConfirmationStyles.container}>
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
          <Text style={OrderConfirmationStyles.detailLabel}>Status:</Text>
          <Text style={OrderConfirmationStyles.detailValue}>{order.status}</Text>
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

      {/* Back Button */}
      <View style={OrderConfirmationStyles.buttonContainer}>
        <TouchableOpacity
          style={OrderConfirmationStyles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={OrderConfirmationStyles.primaryButtonText}>Back to Order History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
