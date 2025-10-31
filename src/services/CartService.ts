import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, ProductCard } from '../types';

/**
 * Cart service interface for managing shopping cart functionality
 * Requirements: 3.7, 5.3
 */
export interface CartService {
  addToCart(productId: string, quantity?: number): Promise<void>;
  removeFromCart(productId: string): Promise<void>;
  updateQuantity(productId: string, quantity: number): Promise<void>;
  getCartItems(): Promise<CartItem[]>;
  getCartItemsWithDetails(): Promise<(CartItem & { product: ProductCard })[]>;
  clearCart(): Promise<void>;
  getCartCount(): Promise<number>;
  syncWithBackend(): Promise<void>;
}

/**
 * Implementation of CartService with local storage and backend synchronization
 * Requirements: 3.7, 5.3
 */
export class CartServiceImpl implements CartService {
  private static readonly CART_STORAGE_KEY = '@swipely_cart';
  private static readonly SYNC_TIMESTAMP_KEY = '@swipely_cart_sync';
  private cartItems: CartItem[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the cart service by loading data from storage
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const storedCart = await AsyncStorage.getItem(CartServiceImpl.CART_STORAGE_KEY);
      if (storedCart) {
        this.cartItems = JSON.parse(storedCart);
        // Convert date strings back to Date objects
        this.cartItems = this.cartItems.map(item => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize cart service:', error);
      this.cartItems = [];
      this.isInitialized = true;
    }
  }

  /**
   * Save cart items to local storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CartServiceImpl.CART_STORAGE_KEY,
        JSON.stringify(this.cartItems)
      );
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
      throw new Error('Failed to save cart data');
    }
  }

  /**
   * Add a product to the cart
   * Requirements: 3.7
   */
  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    await this.initialize();

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const existingItemIndex = this.cartItems.findIndex(item => item.productId === productId);

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      this.cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      const newItem: CartItem = {
        productId,
        quantity,
        addedAt: new Date(),
        selectedVariants: {}
      };
      this.cartItems.push(newItem);
    }

    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background cart sync failed:', error);
    });
  }

  /**
   * Remove a product from the cart
   * Requirements: 5.3
   */
  async removeFromCart(productId: string): Promise<void> {
    await this.initialize();

    const initialLength = this.cartItems.length;
    this.cartItems = this.cartItems.filter(item => item.productId !== productId);

    if (this.cartItems.length === initialLength) {
      throw new Error('Product not found in cart');
    }

    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background cart sync failed:', error);
    });
  }

  /**
   * Update the quantity of a product in the cart
   * Requirements: 5.3
   */
  async updateQuantity(productId: string, quantity: number): Promise<void> {
    await this.initialize();

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    if (quantity === 0) {
      await this.removeFromCart(productId);
      return;
    }

    const itemIndex = this.cartItems.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      throw new Error('Product not found in cart');
    }

    this.cartItems[itemIndex].quantity = quantity;
    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background cart sync failed:', error);
    });
  }

  /**
   * Get all cart items
   * Requirements: 5.3
   */
  async getCartItems(): Promise<CartItem[]> {
    await this.initialize();
    return [...this.cartItems];
  }

  /**
   * Get cart items with product details
   * Requirements: 5.3
   */
  async getCartItemsWithDetails(): Promise<(CartItem & { product: ProductCard })[]> {
    await this.initialize();
    
    // In a real implementation, this would fetch product details from the API
    // For now, we'll return a mock implementation
    const itemsWithDetails = await Promise.all(
      this.cartItems.map(async (item) => {
        // Mock product data - in real implementation, fetch from ProductService
        const mockProduct: ProductCard = {
          id: item.productId,
          title: `Product ${item.productId}`,
          price: 99.99,
          currency: 'USD',
          imageUrls: [`https://example.com/product-${item.productId}.jpg`],
          category: { id: 'electronics', name: 'Electronics' },
          description: `Description for product ${item.productId}`,
          specifications: {},
          availability: true
        };

        return {
          ...item,
          product: mockProduct
        };
      })
    );

    return itemsWithDetails;
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(): Promise<void> {
    await this.initialize();
    this.cartItems = [];
    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background cart sync failed:', error);
    });
  }

  /**
   * Get the total number of items in the cart
   */
  async getCartCount(): Promise<number> {
    await this.initialize();
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Synchronize cart data with backend API
   * Requirements: 5.3
   */
  async syncWithBackend(): Promise<void> {
    try {
      // In a real implementation, this would make API calls to sync cart data
      // For now, we'll just update the sync timestamp
      await AsyncStorage.setItem(
        CartServiceImpl.SYNC_TIMESTAMP_KEY,
        new Date().toISOString()
      );
      
      console.log('Cart synchronized with backend');
    } catch (error) {
      console.error('Failed to sync cart with backend:', error);
      throw new Error('Cart synchronization failed');
    }
  }

  /**
   * Get the last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(CartServiceImpl.SYNC_TIMESTAMP_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Failed to get sync timestamp:', error);
      return null;
    }
  }
}

/**
 * Singleton instance of the cart service
 */
let cartServiceInstance: CartService | null = null;

/**
 * Get the singleton instance of the cart service
 */
export const getCartService = (): CartService => {
  if (!cartServiceInstance) {
    cartServiceInstance = new CartServiceImpl();
  }
  return cartServiceInstance;
};

/**
 * Reset the cart service instance (useful for testing)
 */
export const resetCartService = (): void => {
  cartServiceInstance = null;
};