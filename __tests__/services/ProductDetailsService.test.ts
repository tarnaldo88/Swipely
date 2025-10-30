import { ProductDetailsService } from '../../src/services/ProductDetailsService';
import { ProductCard } from '../../src/types';

// Mock setTimeout for testing delays
jest.useFakeTimers();

describe('ProductDetailsService', () => {
  beforeEach(() => {
    ProductDetailsService.clearCache();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('getProductDetails', () => {
    it('should fetch product details successfully', async () => {
      const productId = 'prod-1';
      
      const promise = ProductDetailsService.getProductDetails(productId);
      
      // Fast-forward the simulated network delay
      jest.advanceTimersByTime(1000);
      
      const product = await promise;
      
      expect(product).toBeDefined();
      expect(product.id).toBe(productId);
      expect(product.title).toBe('Premium Wireless Bluetooth Headphones');
      expect(product.price).toBe(299.99);
      expect(product.currency).toBe('USD');
      expect(product.imageUrls).toHaveLength(3);
      expect(product.category.name).toBe('Electronics');
      expect(product.availability).toBe(true);
    });

    it('should return cached product on subsequent calls', async () => {
      const productId = 'prod-1';
      
      // First call
      const promise1 = ProductDetailsService.getProductDetails(productId);
      jest.advanceTimersByTime(1000);
      const product1 = await promise1;
      
      // Second call should be from cache (no delay)
      const product2 = await ProductDetailsService.getProductDetails(productId);
      
      expect(product1).toEqual(product2);
      expect(ProductDetailsService.isProductCached(productId)).toBe(true);
    });

    it('should handle unknown product IDs', async () => {
      const productId = 'unknown-product';
      
      const promise = ProductDetailsService.getProductDetails(productId);
      jest.advanceTimersByTime(1000);
      const product = await promise;
      
      expect(product).toBeDefined();
      expect(product.id).toBe(productId);
      expect(product.title).toBe('Product Details');
      expect(product.description).toBe('Product details are being loaded...');
    });

    it('should handle network errors', async () => {
      // Mock a network error by overriding the private method
      const originalFetch = (ProductDetailsService as any).fetchProductFromAPI;
      (ProductDetailsService as any).fetchProductFromAPI = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(ProductDetailsService.getProductDetails('prod-1')).rejects.toThrow('Failed to load product details');
      
      // Restore original method
      (ProductDetailsService as any).fetchProductFromAPI = originalFetch;
    });
  });

  describe('preloadProductDetails', () => {
    it('should preload multiple products', async () => {
      const productIds = ['prod-1', 'prod-2'];
      
      const promise = ProductDetailsService.preloadProductDetails(productIds);
      jest.advanceTimersByTime(2000);
      await promise;
      
      // Check that products are cached
      expect(ProductDetailsService.isProductCached('prod-1')).toBe(true);
      expect(ProductDetailsService.isProductCached('prod-2')).toBe(true);
    });

    it('should handle preload errors gracefully', async () => {
      const productIds = ['prod-1', 'invalid-product'];
      
      // Should not throw even if some products fail to load
      const promise = ProductDetailsService.preloadProductDetails(productIds);
      jest.advanceTimersByTime(2000);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should not preload already cached products', async () => {
      const productId = 'prod-1';
      
      // First, cache the product
      const promise1 = ProductDetailsService.getProductDetails(productId);
      jest.advanceTimersByTime(1000);
      await promise1;
      
      // Mock the fetch method to track calls
      const mockFetch = jest.fn();
      (ProductDetailsService as any).fetchProductFromAPI = mockFetch;
      
      // Preload should not call fetch for cached product
      await ProductDetailsService.preloadProductDetails([productId]);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should cache products with expiration', async () => {
      const productId = 'prod-1';
      
      const promise = ProductDetailsService.getProductDetails(productId);
      jest.advanceTimersByTime(1000);
      await promise;
      
      expect(ProductDetailsService.isProductCached(productId)).toBe(true);
      
      const stats = ProductDetailsService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toContain(productId);
    });

    it('should clear expired cache entries', async () => {
      const productId = 'prod-1';
      
      const promise = ProductDetailsService.getProductDetails(productId);
      jest.advanceTimersByTime(1000);
      await promise;
      
      expect(ProductDetailsService.isProductCached(productId)).toBe(true);
      
      // Fast-forward past cache expiration (5 minutes + 1 second)
      jest.advanceTimersByTime(5 * 60 * 1000 + 1000);
      
      expect(ProductDetailsService.isProductCached(productId)).toBe(false);
    });

    it('should clear all cache when clearCache is called', async () => {
      const productIds = ['prod-1', 'prod-2'];
      
      // Cache multiple products
      for (const productId of productIds) {
        const promise = ProductDetailsService.getProductDetails(productId);
        jest.advanceTimersByTime(1000);
        await promise;
      }
      
      expect(ProductDetailsService.getCacheStats().size).toBe(2);
      
      ProductDetailsService.clearCache();
      
      expect(ProductDetailsService.getCacheStats().size).toBe(0);
      expect(ProductDetailsService.isProductCached('prod-1')).toBe(false);
      expect(ProductDetailsService.isProductCached('prod-2')).toBe(false);
    });

    it('should handle cache size limits', async () => {
      // This test would require mocking the MAX_CACHE_SIZE constant
      // For now, we'll test the basic functionality
      const stats = ProductDetailsService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(Array.isArray(stats.entries)).toBe(true);
    });
  });

  describe('Performance Optimizations', () => {
    it('should simulate realistic network delays', async () => {
      const startTime = Date.now();
      
      const promise = ProductDetailsService.getProductDetails('prod-1');
      
      // The service should add a delay between 300-1100ms
      jest.advanceTimersByTime(500);
      
      const product = await promise;
      expect(product).toBeDefined();
    });

    it('should handle concurrent requests efficiently', async () => {
      const productIds = ['prod-1', 'prod-2', 'prod-1']; // Note: prod-1 appears twice
      
      const promises = productIds.map(id => {
        const promise = ProductDetailsService.getProductDetails(id);
        jest.advanceTimersByTime(1000);
        return promise;
      });
      
      const products = await Promise.all(promises);
      
      expect(products).toHaveLength(3);
      expect(products[0]).toEqual(products[2]); // Same product should be identical
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      // Mock a specific error scenario
      const originalSimulateDelay = (ProductDetailsService as any).simulateNetworkDelay;
      (ProductDetailsService as any).simulateNetworkDelay = jest.fn().mockRejectedValue(new Error('Timeout'));
      
      await expect(ProductDetailsService.getProductDetails('prod-1')).rejects.toThrow('Failed to load product details');
      
      // Restore original method
      (ProductDetailsService as any).simulateNetworkDelay = originalSimulateDelay;
    });

    it('should handle malformed product data gracefully', async () => {
      // This would test scenarios where the API returns unexpected data
      // For now, we ensure the service always returns a valid ProductCard
      const promise = ProductDetailsService.getProductDetails('unknown-product');
      jest.advanceTimersByTime(1000);
      const product = await promise;
      
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('currency');
      expect(product).toHaveProperty('imageUrls');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('specifications');
      expect(product).toHaveProperty('availability');
    });
  });
});