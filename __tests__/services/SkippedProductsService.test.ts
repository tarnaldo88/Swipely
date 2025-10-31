import { getSkippedProductsService, resetSkippedProductsService } from '../../src/services/SkippedProductsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock ProductDetailsService
jest.mock('../../src/services/ProductDetailsService', () => ({
  ProductDetailsService: {
    getProductDetails: jest.fn().mockResolvedValue({
      id: 'test-product',
      title: 'Test Product',
      price: 99.99,
      currency: 'USD',
      imageUrls: ['https://example.com/image.jpg'],
      category: { id: 'electronics', name: 'Electronics' },
      description: 'Test product description',
      specifications: {},
      availability: true,
    }),
  },
}));

describe('SkippedProductsService', () => {
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSkippedProductsService();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('addSkippedProduct', () => {
    it('should add a product to skipped products', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      
      const count = await service.getSkippedProductsCount();
      expect(count).toBe(1);
      
      const isSkipped = await service.isProductSkipped('prod-1');
      expect(isSkipped).toBe(true);
    });

    it('should update timestamp if product is already skipped', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      const firstCount = await service.getSkippedProductsCount();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      const secondCount = await service.getSkippedProductsCount();
      
      expect(firstCount).toBe(1);
      expect(secondCount).toBe(1); // Should not duplicate
    });
  });

  describe('getSkippedProductsByCategory', () => {
    it('should return skipped products for specific category', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      await service.addSkippedProduct('prod-2', 'fashion');
      await service.addSkippedProduct('prod-3', 'electronics');
      
      const electronicsProducts = await service.getSkippedProductsByCategory('electronics');
      const fashionProducts = await service.getSkippedProductsByCategory('fashion');
      
      expect(electronicsProducts).toHaveLength(2);
      expect(fashionProducts).toHaveLength(1);
      expect(electronicsProducts[0].category).toBe('electronics');
      expect(fashionProducts[0].category).toBe('fashion');
    });
  });

  describe('getAvailableCategories', () => {
    it('should return unique categories from skipped products', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      await service.addSkippedProduct('prod-2', 'fashion');
      await service.addSkippedProduct('prod-3', 'electronics');
      await service.addSkippedProduct('prod-4', 'sports');
      
      const categories = await service.getAvailableCategories();
      
      expect(categories).toHaveLength(3);
      expect(categories).toContain('electronics');
      expect(categories).toContain('fashion');
      expect(categories).toContain('sports');
      expect(categories).toEqual(categories.sort()); // Should be sorted
    });
  });

  describe('clearSkippedProductsByCategory', () => {
    it('should clear skipped products for specific category only', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      await service.addSkippedProduct('prod-2', 'fashion');
      await service.addSkippedProduct('prod-3', 'electronics');
      
      await service.clearSkippedProductsByCategory('electronics');
      
      const electronicsCount = await service.getSkippedProductsCountByCategory('electronics');
      const fashionCount = await service.getSkippedProductsCountByCategory('fashion');
      const totalCount = await service.getSkippedProductsCount();
      
      expect(electronicsCount).toBe(0);
      expect(fashionCount).toBe(1);
      expect(totalCount).toBe(1);
    });
  });

  describe('removeSkippedProduct', () => {
    it('should remove a specific product from skipped products', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      await service.addSkippedProduct('prod-2', 'electronics');
      
      let count = await service.getSkippedProductsCount();
      expect(count).toBe(2);
      
      await service.removeSkippedProduct('prod-1');
      
      count = await service.getSkippedProductsCount();
      expect(count).toBe(1);
      
      const isSkipped = await service.isProductSkipped('prod-1');
      expect(isSkipped).toBe(false);
    });

    it('should throw error if product not found', async () => {
      const service = getSkippedProductsService();
      
      await expect(service.removeSkippedProduct('non-existent')).rejects.toThrow('Product not found in skipped products');
    });
  });

  describe('persistence', () => {
    it('should save to AsyncStorage when adding products', async () => {
      const service = getSkippedProductsService();
      
      await service.addSkippedProduct('prod-1', 'electronics');
      
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_skipped_products',
        expect.stringContaining('prod-1')
      );
    });

    it('should load from AsyncStorage on initialization', async () => {
      const mockData = JSON.stringify([
        {
          productId: 'prod-1',
          category: 'electronics',
          skippedAt: new Date().toISOString(),
        },
      ]);
      
      mockAsyncStorage.getItem.mockResolvedValueOnce(mockData);
      
      const service = getSkippedProductsService();
      const count = await service.getSkippedProductsCount();
      
      expect(count).toBe(1);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@swipely_skipped_products');
    });
  });
});