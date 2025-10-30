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
    // Mock enhanced product data with more details
    const mockProducts: { [key: string]: ProductCard } = {
      'prod-1': {
        id: 'prod-1',
        title: 'Premium Wireless Bluetooth Headphones',
        price: 299.99,
        currency: 'USD',
        imageUrls: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
        ],
        category: { id: 'electronics', name: 'Electronics' },
        description: 'Experience premium sound quality with these wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort design. Perfect for music lovers and professionals who demand the best audio experience.',
        specifications: {
          'Battery Life': '30 hours',
          'Connectivity': 'Bluetooth 5.0',
          'Weight': '250g',
          'Noise Cancellation': 'Active',
          'Warranty': '2 years',
          'Driver Size': '40mm',
          'Frequency Response': '20Hz - 20kHz',
          'Charging Time': '2 hours',
        },
        availability: true,
      },
      'prod-2': {
        id: 'prod-2',
        title: 'Cotton Summer Dress',
        price: 49.99,
        currency: 'USD',
        imageUrls: [
          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
        ],
        category: { id: 'fashion', name: 'Fashion' },
        description: 'Comfortable cotton dress perfect for summer days. Made from 100% organic cotton with a flattering fit that works for any occasion.',
        specifications: {
          'Material': '100% Organic Cotton',
          'Sizes Available': 'XS, S, M, L, XL',
          'Care Instructions': 'Machine wash cold',
          'Origin': 'Made in USA',
          'Fit': 'Regular',
        },
        availability: true,
      },
    };

    const product = mockProducts[productId];
    if (!product) {
      // Generate a default product if not found in mock data
      return {
        id: productId,
        title: 'Product Details',
        price: 99.99,
        currency: 'USD',
        imageUrls: ['https://via.placeholder.com/400x400'],
        category: { id: 'general', name: 'General' },
        description: 'Product details are being loaded...',
        specifications: {},
        availability: true,
      };
    }

    return product;
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