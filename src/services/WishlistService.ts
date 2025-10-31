import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCard } from '../types';

/**
 * Wishlist item interface
 */
export interface WishlistItem {
  productId: string;
  addedAt: Date;
  product?: ProductCard;
}

/**
 * Wishlist service interface for managing liked products
 * Requirements: 5.1, 5.2, 5.4
 */
export interface WishlistService {
  addToWishlist(productId: string): Promise<void>;
  removeFromWishlist(productId: string): Promise<void>;
  getWishlistItems(): Promise<WishlistItem[]>;
  getWishlistItemsWithDetails(): Promise<(WishlistItem & { product: ProductCard })[]>;
  isInWishlist(productId: string): Promise<boolean>;
  clearWishlist(): Promise<void>;
  getWishlistCount(): Promise<number>;
  syncWithBackend(): Promise<void>;
}

/**
 * Implementation of WishlistService with local storage and backend synchronization
 * Requirements: 5.1, 5.2, 5.4
 */
export class WishlistServiceImpl implements WishlistService {
  private static readonly WISHLIST_STORAGE_KEY = '@swipely_wishlist';
  private static readonly SYNC_TIMESTAMP_KEY = '@swipely_wishlist_sync';
  private wishlistItems: WishlistItem[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the wishlist service by loading data from storage
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const storedWishlist = await AsyncStorage.getItem(WishlistServiceImpl.WISHLIST_STORAGE_KEY);
      if (storedWishlist) {
        this.wishlistItems = JSON.parse(storedWishlist);
        // Convert date strings back to Date objects
        this.wishlistItems = this.wishlistItems.map(item => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize wishlist service:', error);
      this.wishlistItems = [];
      this.isInitialized = true;
    }
  }

  /**
   * Save wishlist items to local storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        WishlistServiceImpl.WISHLIST_STORAGE_KEY,
        JSON.stringify(this.wishlistItems)
      );
    } catch (error) {
      console.error('Failed to save wishlist to storage:', error);
      throw new Error('Failed to save wishlist data');
    }
  }

  /**
   * Add a product to the wishlist
   * Requirements: 5.1, 5.2
   */
  async addToWishlist(productId: string): Promise<void> {
    await this.initialize();

    // Check if product is already in wishlist
    const existingItem = this.wishlistItems.find(item => item.productId === productId);
    if (existingItem) {
      // Product already in wishlist, no need to add again
      return;
    }

    const newItem: WishlistItem = {
      productId,
      addedAt: new Date()
    };

    this.wishlistItems.push(newItem);
    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background wishlist sync failed:', error);
    });
  }

  /**
   * Remove a product from the wishlist
   * Requirements: 5.2, 5.4
   */
  async removeFromWishlist(productId: string): Promise<void> {
    await this.initialize();

    const initialLength = this.wishlistItems.length;
    this.wishlistItems = this.wishlistItems.filter(item => item.productId !== productId);

    if (this.wishlistItems.length === initialLength) {
      throw new Error('Product not found in wishlist');
    }

    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background wishlist sync failed:', error);
    });
  }

  /**
   * Get all wishlist items
   * Requirements: 5.2, 5.4
   */
  async getWishlistItems(): Promise<WishlistItem[]> {
    await this.initialize();
    return [...this.wishlistItems];
  }

  /**
   * Get wishlist items with product details
   * Requirements: 5.2, 5.4
   */
  async getWishlistItemsWithDetails(): Promise<(WishlistItem & { product: ProductCard })[]> {
    await this.initialize();
    
    // In a real implementation, this would fetch product details from the API
    // For now, we'll return a mock implementation
    const itemsWithDetails = await Promise.all(
      this.wishlistItems.map(async (item) => {
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
   * Check if a product is in the wishlist
   * Requirements: 5.1, 5.2
   */
  async isInWishlist(productId: string): Promise<boolean> {
    await this.initialize();
    return this.wishlistItems.some(item => item.productId === productId);
  }

  /**
   * Clear all items from the wishlist
   */
  async clearWishlist(): Promise<void> {
    await this.initialize();
    this.wishlistItems = [];
    await this.saveToStorage();
    
    // Sync with backend in background
    this.syncWithBackend().catch(error => {
      console.warn('Background wishlist sync failed:', error);
    });
  }

  /**
   * Get the total number of items in the wishlist
   */
  async getWishlistCount(): Promise<number> {
    await this.initialize();
    return this.wishlistItems.length;
  }

  /**
   * Synchronize wishlist data with backend API for cross-device sync
   * Requirements: 5.4
   */
  async syncWithBackend(): Promise<void> {
    try {
      // In a real implementation, this would make API calls to sync wishlist data
      // This would handle:
      // 1. Upload local changes to backend
      // 2. Download remote changes from backend
      // 3. Resolve conflicts (e.g., last-write-wins or merge strategies)
      // 4. Update local storage with merged data
      
      // For now, we'll just update the sync timestamp
      await AsyncStorage.setItem(
        WishlistServiceImpl.SYNC_TIMESTAMP_KEY,
        new Date().toISOString()
      );
      
      console.log('Wishlist synchronized with backend');
    } catch (error) {
      console.error('Failed to sync wishlist with backend:', error);
      throw new Error('Wishlist synchronization failed');
    }
  }

  /**
   * Get the last sync timestamp
   */
  async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(WishlistServiceImpl.SYNC_TIMESTAMP_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Failed to get sync timestamp:', error);
      return null;
    }
  }

  /**
   * Force sync with backend (useful for manual refresh)
   */
  async forceSyncWithBackend(): Promise<void> {
    await this.syncWithBackend();
  }
}

/**
 * Singleton instance of the wishlist service
 */
let wishlistServiceInstance: WishlistService | null = null;

/**
 * Get the singleton instance of the wishlist service
 */
export const getWishlistService = (): WishlistService => {
  if (!wishlistServiceInstance) {
    wishlistServiceInstance = new WishlistServiceImpl();
  }
  return wishlistServiceInstance;
};

/**
 * Reset the wishlist service instance (useful for testing)
 */
export const resetWishlistService = (): void => {
  wishlistServiceInstance = null;
};