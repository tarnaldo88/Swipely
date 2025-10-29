import { ProductFeedService } from '../ProductFeedService';
import { CategoryPreferenceService } from '../CategoryPreferenceService';
import { ProductFeedResponse, CategoryPreferences } from '../../types';

// Mock CategoryPreferenceService
jest.mock('../CategoryPreferenceService');
const mockCategoryPreferenceService = CategoryPreferenceService as jest.Mocked<typeof CategoryPreferenceService>;

describe('ProductFeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ProductFeedService.clearSession();
  });

  describe('getProducts', () => {
    it('should return products with pagination', async () => {
      const response = await ProductFeedService.getProducts({ page: 1, limit: 5 });

      expect(response).toHaveProperty('products');
      expect(response).toHaveProperty('pagination');
      expect(response).toHaveProperty('filters');
      expect(Array.isArray(response.products)).toBe(true);
      expect(response.products.length).toBeLessThanOrEqual(5);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(5);
    });

    it('should filter products by categories', async () => {
      const response = await ProductFeedService.getProducts(
        { page: 1, limit: 10 },
        { categories: ['electronics'] }
      );

      response.products.forEach(product => {
        expect(product.category.id).toBe('electronics');
      });
    });

    it('should filter products by price range', async () => {
      const response = await ProductFeedService.getProducts(
        { page: 1, limit: 10 },
        { priceRange: { min: 30, max: 100 } }
      );

      response.products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(30);
        expect(product.price).toBeLessThanOrEqual(100);
      });
    });

    it('should exclude specified product IDs', async () => {
      const response = await ProductFeedService.getProducts(
        { page: 1, limit: 10 },
        { excludeProductIds: ['prod-1', 'prod-2'] }
      );

      response.products.forEach(product => {
        expect(['prod-1', 'prod-2']).not.toContain(product.id);
      });
    });
  });

  describe('getPersonalizedFeed', () => {
    it('should return personalized feed based on user preferences', async () => {
      const mockPreferences: CategoryPreferences = {
        selectedCategories: ['electronics', 'fashion'],
        lastUpdated: new Date(),
      };
      mockCategoryPreferenceService.getUserPreferences.mockResolvedValue(mockPreferences);

      const response = await ProductFeedService.getPersonalizedFeed({ page: 1, limit: 5 });

      expect(response).toHaveProperty('products');
      expect(response.filters.categories).toEqual(['electronics', 'fashion']);
    });

    it('should exclude swiped products from feed', async () => {
      const mockPreferences: CategoryPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date(),
      };
      mockCategoryPreferenceService.getUserPreferences.mockResolvedValue(mockPreferences);

      // Record a swipe action first
      await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');

      const response = await ProductFeedService.getPersonalizedFeed({ page: 1, limit: 10 });

      response.products.forEach(product => {
        expect(product.id).not.toBe('prod-1');
      });
    });
  });

  describe('recordSwipeAction', () => {
    it('should record like action successfully', async () => {
      const response = await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');

      expect(response.success).toBe(true);
      expect(response.message).toContain('like action recorded');
    });

    it('should record skip action successfully', async () => {
      const response = await ProductFeedService.recordSwipeAction('prod-1', 'skip', 'user123');

      expect(response.success).toBe(true);
      expect(response.message).toContain('skip action recorded');
    });

    it('should update preferences when liking a product', async () => {
      mockCategoryPreferenceService.addCategoryPreference.mockResolvedValue();
      const mockUpdatedPreferences: CategoryPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date(),
      };
      mockCategoryPreferenceService.getUserPreferences.mockResolvedValue(mockUpdatedPreferences);

      const response = await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');

      expect(response.updatedPreferences).toBeDefined();
      expect(response.updatedPreferences?.selectedCategories).toContain('electronics');
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products for specific category', async () => {
      const response = await ProductFeedService.getProductsByCategory('electronics', { page: 1, limit: 5 });

      expect(response.filters.categories).toEqual(['electronics']);
      response.products.forEach(product => {
        expect(product.category.id).toBe('electronics');
      });
    });
  });

  describe('searchProducts', () => {
    it('should return products matching search query', async () => {
      const response = await ProductFeedService.searchProducts('headphones', { page: 1, limit: 10 });

      response.products.forEach(product => {
        const matchesTitle = product.title.toLowerCase().includes('headphones');
        const matchesDescription = product.description.toLowerCase().includes('headphones');
        expect(matchesTitle || matchesDescription).toBe(true);
      });
    });

    it('should return empty results for non-matching query', async () => {
      const response = await ProductFeedService.searchProducts('nonexistentproduct', { page: 1, limit: 10 });

      expect(response.products.length).toBe(0);
    });
  });

  describe('session management', () => {
    it('should track swipe history for current session', async () => {
      await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');
      await ProductFeedService.recordSwipeAction('prod-2', 'skip', 'user123');

      const history = ProductFeedService.getSessionSwipeHistory();

      expect(history.length).toBe(2);
      expect(history[0].productId).toBe('prod-1');
      expect(history[0].action).toBe('like');
      expect(history[1].productId).toBe('prod-2');
      expect(history[1].action).toBe('skip');
    });

    it('should get liked products from session', async () => {
      await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');
      await ProductFeedService.recordSwipeAction('prod-2', 'skip', 'user123');
      await ProductFeedService.recordSwipeAction('prod-3', 'like', 'user123');

      const likedProducts = ProductFeedService.getLikedProductsFromSession();

      expect(likedProducts).toEqual(['prod-1', 'prod-3']);
    });

    it('should get skipped products from session', async () => {
      await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');
      await ProductFeedService.recordSwipeAction('prod-2', 'skip', 'user123');
      await ProductFeedService.recordSwipeAction('prod-3', 'skip', 'user123');

      const skippedProducts = ProductFeedService.getSkippedProductsFromSession();

      expect(skippedProducts).toEqual(['prod-2', 'prod-3']);
    });

    it('should clear session data', async () => {
      await ProductFeedService.recordSwipeAction('prod-1', 'like', 'user123');

      ProductFeedService.clearSession();

      const history = ProductFeedService.getSessionSwipeHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('refreshFeed', () => {
    it('should refresh and return fresh feed', async () => {
      const mockPreferences: CategoryPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date(),
      };
      mockCategoryPreferenceService.getUserPreferences.mockResolvedValue(mockPreferences);

      const response = await ProductFeedService.refreshFeed();

      expect(response).toHaveProperty('products');
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.limit).toBe(10);
    });
  });
});