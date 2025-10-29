import { 
  ProductCard, 
  ProductFeedResponse, 
  CategoryPreferences, 
  SwipeAction,
  SwipeActionResponse 
} from '../types';
import { CategoryPreferenceService } from './CategoryPreferenceService';

interface FeedFilters {
  categories?: string[];
  priceRange?: { min: number; max: number };
  excludeProductIds?: string[];
}

interface PaginationParams {
  page: number;
  limit: number;
}

// Mock product data for development - in production this would come from API
const MOCK_PRODUCTS: ProductCard[] = [
  {
    id: 'prod-1',
    title: 'Wireless Bluetooth Headphones',
    price: 99.99,
    currency: 'USD',
    imageUrls: ['https://example.com/headphones1.jpg', 'https://example.com/headphones2.jpg'],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'High-quality wireless headphones with noise cancellation',
    specifications: { battery: '30 hours', connectivity: 'Bluetooth 5.0' },
    availability: true,
  },
  {
    id: 'prod-2',
    title: 'Cotton Summer Dress',
    price: 49.99,
    currency: 'USD',
    imageUrls: ['https://example.com/dress1.jpg'],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Comfortable cotton dress perfect for summer',
    specifications: { material: '100% Cotton', sizes: 'XS-XL' },
    availability: true,
  },
  {
    id: 'prod-3',
    title: 'Smart Home Security Camera',
    price: 129.99,
    currency: 'USD',
    imageUrls: ['https://example.com/camera1.jpg', 'https://example.com/camera2.jpg'],
    category: { id: 'electronics', name: 'Electronics' },
    description: '1080p HD security camera with night vision',
    specifications: { resolution: '1080p', connectivity: 'WiFi', storage: 'Cloud' },
    availability: true,
  },
  {
    id: 'prod-4',
    title: 'Yoga Mat Premium',
    price: 39.99,
    currency: 'USD',
    imageUrls: ['https://example.com/yoga1.jpg'],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Non-slip premium yoga mat for all levels',
    specifications: { thickness: '6mm', material: 'TPE', size: '72" x 24"' },
    availability: true,
  },
  {
    id: 'prod-5',
    title: 'Coffee Table Book: Photography',
    price: 24.99,
    currency: 'USD',
    imageUrls: ['https://example.com/book1.jpg'],
    category: { id: 'books', name: 'Books' },
    description: 'Beautiful collection of landscape photography',
    specifications: { pages: 200, format: 'Hardcover', dimensions: '10" x 12"' },
    availability: true,
  },
  {
    id: 'prod-6',
    title: 'Organic Face Moisturizer',
    price: 34.99,
    currency: 'USD',
    imageUrls: ['https://example.com/moisturizer1.jpg'],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Natural organic moisturizer for all skin types',
    specifications: { volume: '50ml', ingredients: 'Organic', skinType: 'All' },
    availability: true,
  },
];

export class ProductFeedService {
  private static swipeHistory: SwipeAction[] = [];
  private static sessionId: string = Date.now().toString();

  /**
   * Fetch products based on user preferences and filters
   */
  static async getProducts(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    try {
      // In production, this would be an API call
      await this.simulateNetworkDelay();

      let filteredProducts = [...MOCK_PRODUCTS];

      // Apply category filters
      if (filters?.categories && filters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          filters.categories!.includes(product.category.id)
        );
      }

      // Apply price range filters
      if (filters?.priceRange) {
        filteredProducts = filteredProducts.filter(product =>
          product.price >= filters.priceRange!.min &&
          product.price <= filters.priceRange!.max
        );
      }

      // Exclude already swiped products
      if (filters?.excludeProductIds && filters.excludeProductIds.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          !filters.excludeProductIds!.includes(product.id)
        );
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      return {
        products: paginatedProducts,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: filteredProducts.length,
          hasMore: endIndex < filteredProducts.length,
        },
        filters: {
          categories: filters?.categories || [],
          priceRange: filters?.priceRange,
        },
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  }

  /**
   * Get personalized product feed based on user preferences
   */
  static async getPersonalizedFeed(
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProductFeedResponse> {
    try {
      const userPreferences = await CategoryPreferenceService.getUserPreferences();
      
      // Get products that user has already swiped to exclude them
      const swipedProductIds = this.swipeHistory
        .filter(action => action.sessionId === this.sessionId)
        .map(action => action.productId);

      const filters: FeedFilters = {
        categories: userPreferences.selectedCategories.length > 0 
          ? userPreferences.selectedCategories 
          : undefined,
        excludeProductIds: swipedProductIds,
      };

      return await this.getProducts(pagination, filters);
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      throw new Error('Failed to get personalized feed');
    }
  }

  /**
   * Record a swipe action
   */
  static async recordSwipeAction(
    productId: string,
    action: 'like' | 'skip',
    userId: string
  ): Promise<SwipeActionResponse> {
    try {
      // In production, this would be an API call
      await this.simulateNetworkDelay();

      const swipeAction: SwipeAction = {
        userId,
        productId,
        action,
        timestamp: new Date(),
        sessionId: this.sessionId,
      };

      // Store locally for session management
      this.swipeHistory.push(swipeAction);

      // If user liked a product, we might want to update their preferences
      let updatedPreferences: CategoryPreferences | undefined;
      
      if (action === 'like') {
        const product = MOCK_PRODUCTS.find(p => p.id === productId);
        if (product) {
          try {
            await CategoryPreferenceService.addCategoryPreference(product.category.id);
            updatedPreferences = await CategoryPreferenceService.getUserPreferences();
          } catch (error) {
            console.warn('Failed to update preferences after like:', error);
          }
        }
      }

      return {
        success: true,
        message: `${action} action recorded successfully`,
        updatedPreferences,
      };
    } catch (error) {
      console.error('Error recording swipe action:', error);
      throw new Error('Failed to record swipe action');
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    categoryId: string,
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProductFeedResponse> {
    try {
      const filters: FeedFilters = {
        categories: [categoryId],
      };

      return await this.getProducts(pagination, filters);
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw new Error('Failed to get products by category');
    }
  }

  /**
   * Search products by query
   */
  static async searchProducts(
    query: string,
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters?: FeedFilters
  ): Promise<ProductFeedResponse> {
    try {
      // In production, this would be an API call with search functionality
      await this.simulateNetworkDelay();

      let filteredProducts = MOCK_PRODUCTS.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );

      // Apply additional filters
      if (filters?.categories && filters.categories.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          filters.categories!.includes(product.category.id)
        );
      }

      if (filters?.priceRange) {
        filteredProducts = filteredProducts.filter(product =>
          product.price >= filters.priceRange!.min &&
          product.price <= filters.priceRange!.max
        );
      }

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

      return {
        products: paginatedProducts,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: filteredProducts.length,
          hasMore: endIndex < filteredProducts.length,
        },
        filters: {
          categories: filters?.categories || [],
          priceRange: filters?.priceRange,
        },
      };
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Get user's swipe history for current session
   */
  static getSessionSwipeHistory(): SwipeAction[] {
    return this.swipeHistory.filter(action => action.sessionId === this.sessionId);
  }

  /**
   * Clear current session data
   */
  static clearSession(): void {
    this.swipeHistory = [];
    this.sessionId = Date.now().toString();
  }

  /**
   * Get liked products from current session
   */
  static getLikedProductsFromSession(): string[] {
    return this.swipeHistory
      .filter(action => action.sessionId === this.sessionId && action.action === 'like')
      .map(action => action.productId);
  }

  /**
   * Get skipped products from current session
   */
  static getSkippedProductsFromSession(): string[] {
    return this.swipeHistory
      .filter(action => action.sessionId === this.sessionId && action.action === 'skip')
      .map(action => action.productId);
  }

  /**
   * Simulate network delay for development
   */
  private static async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 500 + 200; // 200-700ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Refresh product feed (useful for pull-to-refresh)
   */
  static async refreshFeed(): Promise<ProductFeedResponse> {
    try {
      // Clear any cached data and get fresh feed
      return await this.getPersonalizedFeed({ page: 1, limit: 10 });
    } catch (error) {
      console.error('Error refreshing feed:', error);
      throw new Error('Failed to refresh feed');
    }
  }
}