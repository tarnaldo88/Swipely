import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCard } from '../types';

export interface OfflineData {
  products: ProductCard[];
  userPreferences: any;
  cartItems: any[];
  wishlistItems: any[];
  swipeHistory: any[];
  lastSync: number;
}

export interface CacheConfig {
  maxProducts: number;
  maxCacheAge: number; // in milliseconds
  enableImageCaching: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
}

export class OfflineModeService {
  private static instance: OfflineModeService;
  private isOfflineMode: boolean = false;
  private cacheConfig: CacheConfig = {
    maxProducts: 100,
    maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
    enableImageCaching: true,
    compressionLevel: 'medium',
  };

  private constructor() {
    this.initializeOfflineMode();
  }

  static getInstance(): OfflineModeService {
    if (!OfflineModeService.instance) {
      OfflineModeService.instance = new OfflineModeService();
    }
    return OfflineModeService.instance;
  }

  private async initializeOfflineMode() {
    try {
      const offlineData = await this.getOfflineData();
      if (offlineData) {
        console.log('Offline mode initialized with cached data');
      }
    } catch (error) {
      console.error('Error initializing offline mode:', error);
    }
  }

  // Cache management
  async cacheProductData(products: ProductCard[]): Promise<void> {
    try {
      const offlineData = await this.getOfflineData() || this.getEmptyOfflineData();
      
      // Limit the number of cached products
      const productsToCache = products.slice(0, this.cacheConfig.maxProducts);
      
      // Compress data if needed
      const compressedProducts = this.compressProductData(productsToCache);
      
      offlineData.products = compressedProducts;
      offlineData.lastSync = Date.now();
      
      await AsyncStorage.setItem('offline_data', JSON.stringify(offlineData));
      
      // Cache images if enabled
      if (this.cacheConfig.enableImageCaching) {
        await this.cacheProductImages(productsToCache);
      }
      
    } catch (error) {
      console.error('Error caching product data:', error);
    }
  }

  async getCachedProducts(): Promise<ProductCard[]> {
    try {
      const offlineData = await this.getOfflineData();
      
      if (!offlineData || this.isCacheExpired(offlineData.lastSync)) {
        return [];
      }
      
      return this.decompressProductData(offlineData.products);
    } catch (error) {
      console.error('Error getting cached products:', error);
      return [];
    }
  }

  async cacheUserData(userId: string, data: Partial<OfflineData>): Promise<void> {
    try {
      const offlineData = await this.getOfflineData() || this.getEmptyOfflineData();
      
      if (data.userPreferences) {
        offlineData.userPreferences = data.userPreferences;
      }
      
      if (data.cartItems) {
        offlineData.cartItems = data.cartItems;
      }
      
      if (data.wishlistItems) {
        offlineData.wishlistItems = data.wishlistItems;
      }
      
      if (data.swipeHistory) {
        offlineData.swipeHistory = data.swipeHistory;
      }
      
      offlineData.lastSync = Date.now();
      
      await AsyncStorage.setItem('offline_data', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error caching user data:', error);
    }
  }

  async getCachedUserData(): Promise<Partial<OfflineData>> {
    try {
      const offlineData = await this.getOfflineData();
      
      if (!offlineData) {
        return {};
      }
      
      return {
        userPreferences: offlineData.userPreferences,
        cartItems: offlineData.cartItems,
        wishlistItems: offlineData.wishlistItems,
        swipeHistory: offlineData.swipeHistory,
      };
    } catch (error) {
      console.error('Error getting cached user data:', error);
      return {};
    }
  }

  private async getOfflineData(): Promise<OfflineData | null> {
    try {
      const data = await AsyncStorage.getItem('offline_data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  private getEmptyOfflineData(): OfflineData {
    return {
      products: [],
      userPreferences: {},
      cartItems: [],
      wishlistItems: [],
      swipeHistory: [],
      lastSync: 0,
    };
  }

  private isCacheExpired(lastSync: number): boolean {
    return Date.now() - lastSync > this.cacheConfig.maxCacheAge;
  }

  private compressProductData(products: ProductCard[]): ProductCard[] {
    if (this.cacheConfig.compressionLevel === 'low') {
      return products;
    }
    
    return products.map(product => {
      const compressed = { ...product };
      
      if (this.cacheConfig.compressionLevel === 'medium') {
        // Remove some non-essential fields
        delete (compressed as any).specifications;
        compressed.imageUrls = compressed.imageUrls.slice(0, 2); // Keep only first 2 images
      } else if (this.cacheConfig.compressionLevel === 'high') {
        // Keep only essential fields
        return {
          id: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency,
          imageUrls: [product.imageUrls[0]], // Keep only first image
          category: product.category,
          availability: product.availability,
        } as ProductCard;
      }
      
      return compressed;
    });
  }

  private decompressProductData(products: ProductCard[]): ProductCard[] {
    // In a real implementation, you might need to restore some fields
    // For now, just return the products as-is
    return products;
  }

  private async cacheProductImages(products: ProductCard[]): Promise<void> {
    // In a real implementation, you would cache images locally
    // This is a placeholder for image caching logic
    try {
      const imagesToCache = products.flatMap(product => product.imageUrls.slice(0, 1)); // Cache first image only
      
      // Simulate image caching
      console.log(`Caching ${imagesToCache.length} product images for offline use`);
      
      // Store image cache metadata
      await AsyncStorage.setItem('cached_images', JSON.stringify(imagesToCache));
    } catch (error) {
      console.error('Error caching product images:', error);
    }
  }

  // Offline mode management
  setOfflineMode(isOffline: boolean): void {
    this.isOfflineMode = isOffline;
  }

  isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem('offline_data');
      await AsyncStorage.removeItem('cached_images');
      console.log('Offline cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const offlineData = await AsyncStorage.getItem('offline_data');
      const cachedImages = await AsyncStorage.getItem('cached_images');
      
      let size = 0;
      if (offlineData) size += offlineData.length;
      if (cachedImages) size += cachedImages.length;
      
      return size;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  async getCacheInfo(): Promise<{
    size: number;
    productCount: number;
    lastSync: number;
    isExpired: boolean;
  }> {
    try {
      const offlineData = await this.getOfflineData();
      const size = await this.getCacheSize();
      
      if (!offlineData) {
        return {
          size: 0,
          productCount: 0,
          lastSync: 0,
          isExpired: true,
        };
      }
      
      return {
        size,
        productCount: offlineData.products.length,
        lastSync: offlineData.lastSync,
        isExpired: this.isCacheExpired(offlineData.lastSync),
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return {
        size: 0,
        productCount: 0,
        lastSync: 0,
        isExpired: true,
      };
    }
  }

  // Configuration
  updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig };
  }

  // Offline-specific product operations
  async addToOfflineCart(productId: string, quantity: number = 1): Promise<void> {
    try {
      const offlineData = await this.getOfflineData() || this.getEmptyOfflineData();
      
      const existingItem = offlineData.cartItems.find(item => item.productId === productId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        offlineData.cartItems.push({
          productId,
          quantity,
          addedAt: Date.now(),
          offline: true,
        });
      }
      
      await AsyncStorage.setItem('offline_data', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error adding to offline cart:', error);
    }
  }

  async addToOfflineWishlist(productId: string): Promise<void> {
    try {
      const offlineData = await this.getOfflineData() || this.getEmptyOfflineData();
      
      if (!offlineData.wishlistItems.find(item => item.productId === productId)) {
        offlineData.wishlistItems.push({
          productId,
          addedAt: Date.now(),
          offline: true,
        });
        
        await AsyncStorage.setItem('offline_data', JSON.stringify(offlineData));
      }
    } catch (error) {
      console.error('Error adding to offline wishlist:', error);
    }
  }

  async recordOfflineSwipe(productId: string, action: 'like' | 'skip'): Promise<void> {
    try {
      const offlineData = await this.getOfflineData() || this.getEmptyOfflineData();
      
      offlineData.swipeHistory.push({
        productId,
        action,
        timestamp: Date.now(),
        offline: true,
      });
      
      await AsyncStorage.setItem('offline_data', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error recording offline swipe:', error);
    }
  }
}

export const offlineModeService = OfflineModeService.getInstance();