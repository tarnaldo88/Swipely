import { ProductCard, Product, ProductDetailsResponse } from '../types';

interface ProductDetailsCache {
  [productId: string]: {
    data: ProductCard;
    timestamp: number;
    expiresAt: number;
  };
}

export class ProductDetailsService {
  private static cache: ProductDetailsCache = {};
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 50;

  /**
   * Get product details with caching and lazy loading
   */
  static async getProductDetails(productId: string): Promise<ProductCard> {
    try {
      // Check cache first
      const cachedProduct = this.getCachedProduct(productId);
      if (cachedProduct) {
        return cachedProduct;
      }

      // Simulate API call with lazy loading
      await this.simulateNetworkDelay();
      
      // Mock detailed product data - in production this would come from API
      const productDetails = await this.fetchProductFromAPI(productId);
      
      // Cache the result
      this.cacheProduct(productId, productDetails);
      
      return productDetails;
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Failed to load product details');
    }
  }

  /**
   * Preload product details for better performance
   */
  static async preloadProductDetails(productIds: string[]): Promise<void> {
    try {
      // Preload up to 3 products at a time to avoid overwhelming the network
      const batchSize = 3;
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (productId) => {
            try {
              if (!this.getCachedProduct(productId)) {
                await this.getProductDetails(productId);
              }
            } catch (error) {
              console.warn(`Failed to preload product ${productId}:`, error);
            }
          })
        );
      }
    } catch (error) {
      console.error('Error preloading product details:', error);
    }
  }

  /**
   * Get cached product if available and not expired
   */
  private static getCachedProduct(productId: string): ProductCard | null {
    const cached = this.cache[productId];
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      delete this.cache[productId];
      return null;
    }

    return cached.data;
  }

  /**
   * Cache product data with expiration
   */
  private static cacheProduct(productId: string, product: ProductCard): void {
    // Clean up old cache entries if we're at max size
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }

    const now = Date.now();
    this.cache[productId] = {
      data: product,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION,
    };
  }

  /**
   * Clean up expired cache entries
   */
  private static cleanupCache(): void {
    const now = Date.now();
    const entries = Object.entries(this.cache);
    
    // Remove expired entries
    entries.forEach(([productId, cached]) => {
      if (now > cached.expiresAt) {
        delete this.cache[productId];
      }
    });

    // If still at max size, remove oldest entries
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([_, cached]) => now <= cached.expiresAt)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2));
      toRemove.forEach(([productId]) => {
        delete this.cache[productId];
      });
    }
  }

  /**
   * Mock API call to fetch product details
   */
  private static async fetchProductFromAPI(productId: string): Promise<ProductCard> {
    // Import ProductFeedService to get product data
    const { ProductFeedService } = require('./ProductFeedService');
    
    // Try to get product from the main product feed
    const product = ProductFeedService.getProductById(productId);
    
    if (product) {
      return product;
    }

    // Generate a default product if not found in mock data
    return {
      id: productId,
      title: 'Product Unavailable',
      price: 0,
      currency: 'USD',
      imageUrls: ['https://via.placeholder.com/400x400?text=Product+Unavailable'],
      category: { id: 'general', name: 'General' },
      description: 'This product is currently unavailable.',
      specifications: {},
      availability: false,
    };
  }

  /**
   * Simulate network delay for development
   */
  private static async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 800 + 300; // 300-1100ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics for debugging
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache),
    };
  }

  /**
   * Check if product is cached
   */
  static isProductCached(productId: string): boolean {
    return this.getCachedProduct(productId) !== null;
  }
}