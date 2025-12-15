/**
 * Order History Screen
 * Displays user's past orders and allows viewing details and reordering
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { OrderService } from '../../services/OrderService';
import { Order } from '../../types/checkout';
import { OrderHistoryStyles } from '../Styles/OrderHistoryStyles';

type OrderHistoryScreenProps = StackScreenProps<any, 'OrderHistory'>;

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ navigation, route }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'shipped' | 'delivered'>('all');

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const userId = 'user-123'; // In production, get from auth context

      let loadedOrders: Order[];

      if (selectedFilter === 'all') {
        loadedOrders = await OrderService.getOrderHistory(userId);
      } else {
        loadedOrders = await OrderService.getOrdersByStatus(userId, selectedFilter);
      }

      setOrders(loadedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load order history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const handleFilterChange = (filter: 'all' | 'completed' | 'shipped' | 'delivered') => {
    setSelectedFilter(filter);
    // Reload orders with new filter
    setTimeout(() => loadOrders(), 0);
  };

  const handleViewOrderDetails = (order: Order) => {
    navigation.navigate('OrderDetails', { order });
  };

  const handleReorder = async (order: Order) => {
    Alert.alert('Reorder', `Reorder items from ${order.orderId}?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Reorder',
        onPress: async () => {
          try {
            const userId = 'user-123'; // In production, get from auth context
            const newOrder = await OrderService.createReorder(userId, order.orderId);

            if (newOrder) {
              Alert.alert('Success', 'Reorder created successfully');
              loadOrders();
            }
          } catch (error) {
            console.error('Error creating reorder:', error);
            Alert.alert('Error', 'Failed to create reorder');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#ff9800';
      case 'shipped':
        return '#2196f3';
      case 'delivered':
        return '#4caf50';
      default:
        return '#999';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={OrderHistoryStyles.orderItemContainer}
      onPress={() => handleViewOrderDetails(item)}
    >
      <View style={OrderHistoryStyles.orderHeader}>
        <View>
          <Text style={OrderHistoryStyles.orderId}>{item.orderId}</Text>
          <Text style={OrderHistoryStyles.orderDate}>
            {item.createdAt.toLocaleDateString()}
          </Text>
        </View>

        <View style={OrderHistoryStyles.statusContainer}>
          <View
            style={[
              OrderHistoryStyles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={OrderHistoryStyles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={OrderHistoryStyles.orderDetails}>
        <Text style={OrderHistoryStyles.itemCount}>
          {item.items.length} item{item.items.length !== 1 ? 's' : ''}
        </Text>
        <Text style={OrderHistoryStyles.orderTotal}>${item.total.toFixed(2)}</Text>
      </View>

      <View style={OrderHistoryStyles.orderActions}>
        <TouchableOpacity
          style={OrderHistoryStyles.detailsButton}
          onPress={() => handleViewOrderDetails(item)}
        >
          <Text style={OrderHistoryStyles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={OrderHistoryStyles.reorderButton}
          onPress={() => handleReorder(item)}
        >
          <Text style={OrderHistoryStyles.reorderButtonText}>Reorder</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={OrderHistoryStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={OrderHistoryStyles.loadingText}>Loading order history...</Text>
      </View>
    );
  }

  return (
    <View style={OrderHistoryStyles.container}>
      {/* Filter Buttons */}
      <View style={OrderHistoryStyles.filterContainer}>
        {(['all', 'completed', 'shipped', 'delivered'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              OrderHistoryStyles.filterButton,
              selectedFilter === filter && OrderHistoryStyles.filterButtonActive,
            ]}
            onPress={() => handleFilterChange(filter)}
          >
            <Text
              style={[
                OrderHistoryStyles.filterButtonText,
                selectedFilter === filter && OrderHistoryStyles.filterButtonTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={OrderHistoryStyles.emptyContainer}>
          <Text style={OrderHistoryStyles.emptyText}>No orders found</Text>
          <TouchableOpacity
            style={OrderHistoryStyles.shopButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={OrderHistoryStyles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.orderId}
          contentContainerStyle={OrderHistoryStyles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};
