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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
    currency: 'USD',
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
  {
    id: 'prod-9',
    title: 'Gaming Mechanical Keyboard',
    price: 159.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'RGB backlit mechanical gaming keyboard with tactile switches and programmable keys.',
    specifications: { 
      'Switch Type': 'Cherry MX Blue', 
      'Backlight': 'RGB', 
      'Connectivity': 'USB-C',
      'Key Layout': 'Full Size',
      'Programmable': 'Yes'
    },
    availability: true,
  },
  {
    id: 'prod-10',
    title: 'Leather Crossbody Bag',
    price: 129.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Handcrafted genuine leather crossbody bag with adjustable strap and multiple compartments.',
    specifications: { 
      'Material': 'Genuine Leather', 
      'Dimensions': '10" x 8" x 3"', 
      'Strap': 'Adjustable',
      'Compartments': '3',
      'Hardware': 'Antique Brass'
    },
    availability: true,
  },
  {
    id: 'prod-11',
    title: 'Smart Fitness Tracker',
    price: 199.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and 7-day battery life.',
    specifications: { 
      'Battery Life': '7 days', 
      'Water Resistance': '50m', 
      'GPS': 'Built-in',
      'Heart Rate': 'Continuous',
      'Display': 'AMOLED'
    },
    availability: true,
  },
  {
    id: 'prod-12',
    title: 'Organic Green Tea Set',
    price: 34.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop',
    ],
    category: { id: 'food', name: 'Food & Beverages' },
    description: 'Premium organic green tea collection with 6 different varieties from around the world.',
    specifications: { 
      'Varieties': '6 types', 
      'Weight': '2 oz each', 
      'Organic': 'Certified',
      'Origin': 'Multiple Countries',
      'Packaging': 'Resealable Tins'
    },
    availability: true,
  },
  {
    id: 'prod-13',
    title: 'Bluetooth Speaker',
    price: 79.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop',
    ],
    category: { id: 'electronics', name: 'Electronics' },
    description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
    specifications: { 
      'Battery Life': '12 hours', 
      'Water Rating': 'IPX7', 
      'Connectivity': 'Bluetooth 5.0',
      'Range': '30 feet',
      'Weight': '1.2 lbs'
    },
    availability: true,
  },
  {
    id: 'prod-14',
    title: 'Silk Scarf',
    price: 69.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop',
    ],
    category: { id: 'fashion', name: 'Fashion' },
    description: 'Luxurious 100% silk scarf with hand-painted floral design.',
    specifications: { 
      'Material': '100% Mulberry Silk', 
      'Size': '35" x 35"', 
      'Design': 'Hand-painted',
      'Care': 'Dry Clean Only',
      'Origin': 'Italy'
    },
    availability: true,
  },
  {
    id: 'prod-15',
    title: 'Essential Oil Diffuser',
    price: 49.99,
    currency: 'USD',
    imageUrls: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    ],
    category: { id: 'beauty', name: 'Beauty & Personal Care' },
    description: 'Ultrasonic essential oil diffuser with LED lights and timer settings.',
    specifications: { 
      'Capacity': '300ml', 
      'Runtime': '10 hours', 
      'LED Lights': '7 colors',
      'Timer': '1/3/6 hours',
      'Coverage': '300 sq ft'
    },
    availability: true,
  },
];

export class ProductFeedService {
  private static swipeHistory: SwipeAction[] = [];
  private static sessionId: string = Date.now().toString();

  /**
   * Get all available products (for accessing from other services)
   */
  static getAllProducts(): ProductCard[] {
    return [...MOCK_PRODUCTS];
  }

  /**
   * Get a specific product by ID
   */
  static getProductById(productId: string): ProductCard | null {
    return MOCK_PRODUCTS.find(product => product.id === productId) || null;
  }

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