import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCategory, CategoryPreferences } from '../types';

const CATEGORY_PREFERENCES_KEY = '@swipely_category_preferences';
const AVAILABLE_CATEGORIES_KEY = '@swipely_available_categories';

// Mock categories for development - in production this would come from API
const MOCK_CATEGORIES: ProductCategory[] = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'home-garden', name: 'Home & Garden' },
  { id: 'sports', name: 'Sports & Outdoors' },
  { id: 'books', name: 'Books' },
  { id: 'beauty', name: 'Beauty & Personal Care' },
  { id: 'toys', name: 'Toys & Games' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'health', name: 'Health & Wellness' },
  { id: 'food', name: 'Food & Beverages' },
  { id: 'jewelry', name: 'Jewelry & Accessories' },
  { id: 'music', name: 'Music & Instruments' },
];

export class CategoryPreferenceService {
  /**
   * Get available product categories
   */
  static async getAvailableCategories(): Promise<ProductCategory[]> {
    try {
      // In production, this would fetch from API
      // For now, return mock data
      return MOCK_CATEGORIES;
    } catch (error) {
      console.error('Error fetching available categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get user's category preferences
   */
  static async getUserPreferences(): Promise<CategoryPreferences> {
    try {
      const stored = await AsyncStorage.getItem(CATEGORY_PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          selectedCategories: parsed.selectedCategories || [],
          lastUpdated: new Date(parsed.lastUpdated),
        };
      }
      
      // Return default preferences if none exist
      return {
        selectedCategories: [],
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw new Error('Failed to get user preferences');
    }
  }

  /**
   * Save user's category preferences
   */
  static async saveUserPreferences(preferences: CategoryPreferences): Promise<void> {
    try {
      const toStore = {
        selectedCategories: preferences.selectedCategories,
        lastUpdated: preferences.lastUpdated.toISOString(),
      };
      
      await AsyncStorage.setItem(CATEGORY_PREFERENCES_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }

  /**
   * Clear user's category preferences
   */
  static async clearUserPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CATEGORY_PREFERENCES_KEY);
    } catch (error) {
      console.error('Error clearing user preferences:', error);
      throw new Error('Failed to clear user preferences');
    }
  }

  /**
   * Check if user has set category preferences
   */
  static async hasUserPreferences(): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      return preferences.selectedCategories.length > 0;
    } catch (error) {
      console.error('Error checking user preferences:', error);
      return false;
    }
  }

  /**
   * Get categories by IDs
   */
  static async getCategoriesByIds(categoryIds: string[]): Promise<ProductCategory[]> {
    try {
      const allCategories = await this.getAvailableCategories();
      return allCategories.filter(category => categoryIds.includes(category.id));
    } catch (error) {
      console.error('Error getting categories by IDs:', error);
      throw new Error('Failed to get categories');
    }
  }

  /**
   * Update user preferences by adding a category
   */
  static async addCategoryPreference(categoryId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences.selectedCategories.includes(categoryId)) {
        preferences.selectedCategories.push(categoryId);
        preferences.lastUpdated = new Date();
        await this.saveUserPreferences(preferences);
      }
    } catch (error) {
      console.error('Error adding category preference:', error);
      throw new Error('Failed to add category preference');
    }
  }

  /**
   * Update user preferences by removing a category
   */
  static async removeCategoryPreference(categoryId: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      preferences.selectedCategories = preferences.selectedCategories.filter(
        id => id !== categoryId
      );
      preferences.lastUpdated = new Date();
      await this.saveUserPreferences(preferences);
    } catch (error) {
      console.error('Error removing category preference:', error);
      throw new Error('Failed to remove category preference');
    }
  }
}