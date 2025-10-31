import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCard } from '../types';

/**
 * Skipped product item interface
 */
export interface SkippedProductItem {
  productId: string;
  skippedAt: Date;
  category: string;
  product?: ProductCard;
}

/**
 * Skipped products service interface for managing skipped products
 */
export interface SkippedProductsService {
  addSkippedProduct(productId: string, category: string): Promise<void>;
  removeSkippedProduct(productId: string): Promise<void>;
  getSkippedProducts(): Promise<SkippedProductItem[]>;
  getSkippedProductsByCategory(category: string): Promise<SkippedProductItem[]>;
  getSkippedProductsWithDetails(): Promise<(SkippedProductItem & { product: ProductCard })[]>;
  getSkippedProductsByCategoryWithDetails(category: string): Promise<(SkippedProductItem & { product: ProductCard })[]>;
  isProductSkipped(productId: string): Promise<boolean>;
  clearSkippedProducts(): Promise<void>;
  clearSkippedProductsByCategory(category: string): Promise<void>;
  getSkippedProductsCount(): Promise<number>;
  getSkippedProductsCountByCategory(category: string): Promise<number>;
  getAvailableCategories(): Promise<string[]>;
}

/**
 * Implementation of SkippedProductsService with local storage
 */
export class SkippedProductsServiceImpl implements SkippedProductsService {
  private static readonly SKIPPED_STORAGE_KEY = '@swipely_skipped_products';
  private skippedProducts: SkippedProductItem[] = [];
  private isInitialized = false;

  constructor() {
    // Don't call initialize here since it's async
  }

  /**
   * Initialize the skipped products service by loading data from storage
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing skipped products service...');
      const storedSkipped = await AsyncStorage.getItem(SkippedProductsServiceImpl.SKIPPED_STORAGE_KEY);
      console.log('Stored skipped products data:', storedSkipped);
      
      if (storedSkipped) {
        this.skippedProducts = JSON.parse(storedSkipped);
        // Convert date strings back to Date objects
        this.skippedProducts = this.skippedProducts.map(item => ({
          ...item,
          skippedAt: new Date(item.skippedAt)
        }));
        console.log('Loaded skipped products from storage:', this.skippedProducts.length);
      } else {
        console.log('No stored skipped products data found');
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize skipped products service:', error);
      this.skippedProducts = [];
      this.isInitialized = true;
    }
  }

  /**
   * Save skipped products to local storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      console.log('Saving skipped products to storage:', this.skippedProducts.length, 'items');
      await AsyncStorage.setItem(
        SkippedProductsServiceImpl.SKIPPED_STORAGE_KEY,
        JSON.stringify(this.skippedProducts)
      );
      console.log('Successfully saved skipped products to storage');
    } catch (error) {
      console.error('Failed to save skipped products to storage:', error);
      throw new Error('Failed to save skipped products data');
    }
  }

  /**
   * Add a product to the skipped products list
   */
  async addSkippedProduct(productId: string, category: string): Promise<void> {
    await this.initialize();

    // Check if product is already in skipped list
    const existingItem = this.skippedProducts.find(item => item.productId === productId);
    if (existingItem) {
      // Product already skipped, update the timestamp
      existingItem.skippedAt = new Date();
      await this.saveToStorage();
      return;
    }

    const newItem: SkippedProductItem = {
      productId,
      category,
      skippedAt: new Date()
    };

    this.skippedProducts.push(newItem);
    await this.saveToStorage();
  }

  /**
   * Remove a product from the skipped products list
   */
  async removeSkippedProduct(productId: string): Promise<void> {
    await this.initialize();

    const initialLength = this.skippedProducts.length;
    this.skippedProducts = this.skippedProducts.filter(item => item.productId !== productId);

    if (this.skippedProducts.length === initialLength) {
      throw new Error('Product not found in skipped products');
    }

    await this.saveToStorage();
  }

  /**
   * Get all skipped products
   */
  async getSkippedProducts(): Promise<SkippedProductItem[]> {
    await this.initialize();
    return [...this.skippedProducts];
  }

  /**
   * Get skipped products by category
   */
  async getSkippedProductsByCategory(category: string): Promise<SkippedProductItem[]> {
    await this.initialize();
    return this.skippedProducts.filter(item => item.category === category);
  }

  /**
   * Get skipped products with product details
   */
  async getSkippedProductsWithDetails(): Promise<(SkippedProductItem & { product: ProductCard })[]> {
    await this.initialize();
    
    // Import ProductDetailsService to get product details
    const { ProductDetailsService } = require('./ProductDetailsService');
    
    const itemsWithDetails = await Promise.all(
      this.skippedProducts.map(async (item) => {
        try {
          const product = await ProductDetailsService.getProductDetails(item.productId);
          return {
            ...item,
            product
          };
        } catch (error) {
          console.warn(`Failed to load product details for skipped product ${item.productId}:`, error);
          // Return a fallback product if details can't be loaded
          const fallbackProduct: ProductCard = {
            id: item.productId,
            title: 'Product Unavailable',
            price: 0,
            currency: 'USD',
            imageUrls: ['https://via.placeholder.com/400x400?text=Product+Unavailable'],
            category: { id: item.category, name: item.category },
            description: 'This product is currently unavailable.',
            specifications: {},
            availability: false
          };
          return {
            ...item,
            product: fallbackProduct
          };
        }
      })
    );

    return itemsWithDetails;
  }

  /**
   * Get skipped products by category with product details
   */
  async getSkippedProductsByCategoryWithDetails(category: string): Promise<(SkippedProductItem & { product: ProductCard })[]> {
    await this.initialize();
    
    const categoryItems = this.skippedProducts.filter(item => item.category === category);
    
    // Import ProductDetailsService to get product details
    const { ProductDetailsService } = require('./ProductDetailsService');
    
    const itemsWithDetails = await Promise.all(
      categoryItems.map(async (item) => {
        try {
          const product = await ProductDetailsService.getProductDetails(item.productId);
          return {
            ...item,
            product
          };
        } catch (error) {
          console.warn(`Failed to load product details for skipped product ${item.productId}:`, error);
          // Return a fallback product if details can't be loaded
          const fallbackProduct: ProductCard = {
            id: item.productId,
            title: 'Product Unavailable',
            price: 0,
            currency: 'USD',
            imageUrls: ['https://via.placeholder.com/400x400?text=Product+Unavailable'],
            category: { id: item.category, name: item.category },
            description: 'This product is currently unavailable.',
            specifications: {},
            availability: false
          };
          return {
            ...item,
            product: fallbackProduct
          };
        }
      })
    );

    return itemsWithDetails;
  }

  /**
   * Check if a product is in the skipped products list
   */
  async isProductSkipped(productId: string): Promise<boolean> {
    await this.initialize();
    return this.skippedProducts.some(item => item.productId === productId);
  }

  /**
   * Clear all skipped products
   */
  async clearSkippedProducts(): Promise<void> {
    await this.initialize();
    this.skippedProducts = [];
    await this.saveToStorage();
  }

  /**
   * Clear skipped products by category
   */
  async clearSkippedProductsByCategory(category: string): Promise<void> {
    await this.initialize();
    this.skippedProducts = this.skippedProducts.filter(item => item.category !== category);
    await this.saveToStorage();
  }

  /**
   * Get the total number of skipped products
   */
  async getSkippedProductsCount(): Promise<number> {
    await this.initialize();
    return this.skippedProducts.length;
  }

  /**
   * Get the number of skipped products by category
   */
  async getSkippedProductsCountByCategory(category: string): Promise<number> {
    await this.initialize();
    return this.skippedProducts.filter(item => item.category === category).length;
  }

  /**
   * Get all available categories from skipped products
   */
  async getAvailableCategories(): Promise<string[]> {
    await this.initialize();
    const categories = [...new Set(this.skippedProducts.map(item => item.category))];
    return categories.sort();
  }
}

/**
 * Singleton instance of the skipped products service
 */
let skippedProductsServiceInstance: SkippedProductsService | null = null;

/**
 * Get the singleton instance of the skipped products service
 */
export const getSkippedProductsService = (): SkippedProductsService => {
  if (!skippedProductsServiceInstance) {
    skippedProductsServiceInstance = new SkippedProductsServiceImpl();
  }
  return skippedProductsServiceInstance;
};

/**
 * Reset the skipped products service instance (useful for testing)
 */
export const resetSkippedProductsService = (): void => {
  skippedProductsServiceInstance = null;
};