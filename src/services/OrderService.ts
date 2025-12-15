/**
 * Order Service
 * Manages order creation, persistence, and history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Order, CartItem, ShippingAddress } from '../types/checkout';

const ORDERS_STORAGE_KEY = 'swipely_orders';

export class OrderService {
  /**
   * Create a new order
   */
  static createOrder(
    items: CartItem[],
    shippingAddress: ShippingAddress,
    subtotal: number,
    tax: number,
    shipping: number,
    userId: string
  ): Order {
    const orderId = `ORD-${Date.now()}`;
    const confirmationNumber = `CONF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days

    return {
      orderId,
      confirmationNumber,
      userId,
      items: [...items],
      shippingAddress: { ...shippingAddress },
      subtotal,
      tax,
      shipping,
      total: parseFloat((subtotal + tax + shipping).toFixed(2)),
      status: 'completed',
      createdAt: now,
      estimatedDelivery,
    };
  }

  /**
   * Save order to local storage
   */
  static async saveOrder(order: Order): Promise<void> {
    try {
      const existingOrders = await this.getOrderHistory(order.userId);
      const updatedOrders = [order, ...existingOrders];

      await AsyncStorage.setItem(
        `${ORDERS_STORAGE_KEY}_${order.userId}`,
        JSON.stringify(updatedOrders)
      );
    } catch (error) {
      console.error('Error saving order:', error);
      throw new Error('Failed to save order');
    }
  }

  /**
   * Get order history for a user
   */
  static async getOrderHistory(userId: string): Promise<Order[]> {
    try {
      const data = await AsyncStorage.getItem(`${ORDERS_STORAGE_KEY}_${userId}`);

      if (!data) {
        return [];
      }

      const orders = JSON.parse(data) as Order[];

      // Convert date strings back to Date objects
      return orders.map(order => ({
        ...order,
        createdAt: new Date(order.createdAt),
        estimatedDelivery: new Date(order.estimatedDelivery),
      }));
    } catch (error) {
      console.error('Error retrieving order history:', error);
      throw new Error('Failed to retrieve order history');
    }
  }

  /**
   * Get a specific order by ID
   */
  static async getOrderById(userId: string, orderId: string): Promise<Order | null> {
    try {
      const orders = await this.getOrderHistory(userId);
      return orders.find(order => order.orderId === orderId) || null;
    } catch (error) {
      console.error('Error retrieving order:', error);
      throw new Error('Failed to retrieve order');
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    userId: string,
    orderId: string,
    status: 'completed' | 'shipped' | 'delivered'
  ): Promise<Order | null> {
    try {
      const orders = await this.getOrderHistory(userId);
      const orderIndex = orders.findIndex(order => order.orderId === orderId);

      if (orderIndex === -1) {
        return null;
      }

      orders[orderIndex].status = status;

      await AsyncStorage.setItem(
        `${ORDERS_STORAGE_KEY}_${userId}`,
        JSON.stringify(orders)
      );

      return orders[orderIndex];
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }

  /**
   * Get orders by status
   */
  static async getOrdersByStatus(
    userId: string,
    status: 'completed' | 'shipped' | 'delivered'
  ): Promise<Order[]> {
    try {
      const orders = await this.getOrderHistory(userId);
      return orders.filter(order => order.status === status);
    } catch (error) {
      console.error('Error retrieving orders by status:', error);
      throw new Error('Failed to retrieve orders');
    }
  }

  /**
   * Get recent orders
   */
  static async getRecentOrders(userId: string, limit: number = 10): Promise<Order[]> {
    try {
      const orders = await this.getOrderHistory(userId);
      return orders.slice(0, limit);
    } catch (error) {
      console.error('Error retrieving recent orders:', error);
      throw new Error('Failed to retrieve recent orders');
    }
  }

  /**
   * Create a reorder from an existing order
   */
  static async createReorder(userId: string, orderId: string): Promise<Order | null> {
    try {
      const originalOrder = await this.getOrderById(userId, orderId);

      if (!originalOrder) {
        return null;
      }

      // Create new order with same items and address
      const newOrder = this.createOrder(
        originalOrder.items,
        originalOrder.shippingAddress,
        originalOrder.subtotal,
        originalOrder.tax,
        originalOrder.shipping,
        userId
      );

      await this.saveOrder(newOrder);
      return newOrder;
    } catch (error) {
      console.error('Error creating reorder:', error);
      throw new Error('Failed to create reorder');
    }
  }

  /**
   * Delete an order (for testing/cleanup)
   */
  static async deleteOrder(userId: string, orderId: string): Promise<boolean> {
    try {
      const orders = await this.getOrderHistory(userId);
      const filteredOrders = orders.filter(order => order.orderId !== orderId);

      if (filteredOrders.length === orders.length) {
        return false; // Order not found
      }

      await AsyncStorage.setItem(
        `${ORDERS_STORAGE_KEY}_${userId}`,
        JSON.stringify(filteredOrders)
      );

      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw new Error('Failed to delete order');
    }
  }

  /**
   * Clear all orders for a user (for testing/cleanup)
   */
  static async clearOrderHistory(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${ORDERS_STORAGE_KEY}_${userId}`);
    } catch (error) {
      console.error('Error clearing order history:', error);
      throw new Error('Failed to clear order history');
    }
  }

  /**
   * Get order statistics
   */
  static async getOrderStatistics(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
  }> {
    try {
      const orders = await this.getOrderHistory(userId);

      const totalOrders = orders.length;
      const totalSpent = parseFloat(
        orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)
      );
      const averageOrderValue = totalOrders > 0 ? parseFloat((totalSpent / totalOrders).toFixed(2)) : 0;

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
      };
    } catch (error) {
      console.error('Error calculating order statistics:', error);
      throw new Error('Failed to calculate order statistics');
    }
  }
}
