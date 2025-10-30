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
    title: 'Premium Wireless Headphones',
    price: 299.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Experience premium sound quality with active noise cancellation, 30-hour battery life, and premium comfort design.',
    specifications: { 
      'Battery Life': '30 hours', 
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Noise Cancellation': 'Active',
      'Warranty': '2 years'
    },
    availability: true,
  },
  {
    id: 'prod-2',
    title: 'Elegant Summer Dress',
    price: 89.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Comfortable cotton dress perfect for summer days. Made from 100% organic cotton with a flattering fit.',
    specifications: { 
      'Material': '100% Organic Cotton', 
      'Sizes Available': 'XS, S, M, L, XL',
      'Care Instructions': 'Machine wash cold',
      'Origin': 'Made in USA'
    },
    availability: true,
  },
  {
    id: 'prod-3',
    title: 'Smart Security Camera',
    price: 179.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: '4K HD security camera with night vision, motion detection, and cloud storage.',
    specifications: { 
      'Resolution': '4K Ultra HD', 
      'Connectivity': 'WiFi + Ethernet', 
      'Storage': 'Cloud & Local',
      'Night Vision': 'Yes',
      'Weather Resistant': 'IP65'
    },
    availability: true,
  },
  {
    id: 'prod-4',
    title: 'Premium Yoga Mat',
    price: 59.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
    ],
    category: { id: 'sports', name: 'Sports & Outdoors' },
    description: 'Non-slip premium yoga mat with superior grip and cushioning for all yoga practices.',
    specifications: { 
      'Thickness': '6mm', 
      'Material': 'TPE Eco-Friendly', 
      'Size': '72" x 24"',
      'Weight': '2.5 lbs',
      'Non-Slip': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-5',
    title: 'Artisan Coffee Beans',
    price: 24.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Single-origin artisan coffee beans, medium roast with notes of chocolate and caramel.',
    specifications: { 
      'Weight': '12 oz', 
      'Roast': 'Medium', 
      'Origin': 'Colombian',
      'Grind': 'Whole Bean',
      'Organic': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-6',
    title: 'Luxury Skincare Set',
    price: 149.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Complete skincare routine with cleanser, serum, and moisturizer made from natural ingredients.',
    specifications: { 
      'Items Included': '3 products', 
      'Ingredients': 'Natural & Organic', 
      'Skin Type': 'All Types',
      'Cruelty Free': 'Yes',
      'Volume': '50ml each'
    },
    availability: true,
  },
  {
    id: 'prod-7',
    title: 'Minimalist Watch',
    price: 199.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
    ],
    category: { id: 'accessories', name: 'Accessories' },
    description: 'Elegant minimalist watch with leather strap and Swiss movement.',
    specifications: { 
      'Movement': 'Swiss Quartz', 
      'Case Material': 'Stainless Steel', 
      'Strap': 'Genuine Leather',
      'Water Resistance': '50m',
      'Warranty': '2 years'
    },
    availability: true,
  },
  {
    id: 'prod-8',
    title: 'Wireless Charging Pad',
    price: 39.99,
    currency: '$',
    imageUrls: [
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    specifications: { 
      'Charging Speed': '15W Fast Charge', 
      'Compatibility': 'Qi-enabled devices', 
      'LED Indicator': 'Yes',
      'Safety Features': 'Overcharge Protection',
      'Cable Included': 'USB-C'
    },
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