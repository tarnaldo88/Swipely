import AsyncStorage from '@react-native-async-storage/async-storage';
import { CategoryPreferenceService } from '../CategoryPreferenceService';
import { CategoryPreferences, ProductCategory } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('CategoryPreferenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableCategories', () => {
    it('should return available categories', async () => {
      const categories = await CategoryPreferenceService.getAvailableCategories();
      
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
    });

    it('should return categories with expected structure', async () => {
      const categories = await CategoryPreferenceService.getAvailableCategories();
      
      categories.forEach(category => {
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(category.id.length).toBeGreaterThan(0);
        expect(category.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getUserPreferences', () => {
    it('should return default preferences when none exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const preferences = await CategoryPreferenceService.getUserPreferences();

      expect(preferences.selectedCategories).toEqual([]);
      expect(preferences.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return stored preferences when they exist', async () => {
      const storedPreferences = {
        selectedCategories: ['electronics', 'fashion'],
        lastUpdated: new Date().toISOString(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedPreferences));

      const preferences = await CategoryPreferenceService.getUserPreferences();

      expect(preferences.selectedCategories).toEqual(['electronics', 'fashion']);
      expect(preferences.lastUpdated).toBeInstanceOf(Date);
    });

    it('should handle corrupted storage data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      await expect(CategoryPreferenceService.getUserPreferences()).rejects.toThrow();
    });
  });

  describe('saveUserPreferences', () => {
    it('should save preferences to storage', async () => {
      const preferences: CategoryPreferences = {
        selectedCategories: ['electronics', 'books'],
        lastUpdated: new Date(),
      };

      await CategoryPreferenceService.saveUserPreferences(preferences);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_category_preferences',
        expect.stringContaining('electronics')
      );
    });

    it('should handle storage errors', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const preferences: CategoryPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date(),
      };

      await expect(CategoryPreferenceService.saveUserPreferences(preferences)).rejects.toThrow();
    });
  });

  describe('hasUserPreferences', () => {
    it('should return false when no preferences exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const hasPreferences = await CategoryPreferenceService.hasUserPreferences();

      expect(hasPreferences).toBe(false);
    });

    it('should return false when preferences exist but no categories selected', async () => {
      const storedPreferences = {
        selectedCategories: [],
        lastUpdated: new Date().toISOString(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedPreferences));

      const hasPreferences = await CategoryPreferenceService.hasUserPreferences();

      expect(hasPreferences).toBe(false);
    });

    it('should return true when preferences exist with selected categories', async () => {
      const storedPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date().toISOString(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedPreferences));

      const hasPreferences = await CategoryPreferenceService.hasUserPreferences();

      expect(hasPreferences).toBe(true);
    });
  });

  describe('addCategoryPreference', () => {
    it('should add category to existing preferences', async () => {
      const existingPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date().toISOString(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPreferences));

      await CategoryPreferenceService.addCategoryPreference('fashion');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_category_preferences',
        expect.stringContaining('fashion')
      );
    });

    it('should not add duplicate categories', async () => {
      const existingPreferences = {
        selectedCategories: ['electronics'],
        lastUpdated: new Date().toISOString(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPreferences));

      await CategoryPreferenceService.addCategoryPreference('electronics');

      // Should not call setItem since category already exists
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeCategoryPreference', () => {
    it('should remove category from preferences', async () => {
      const existingPreferences = {
        selectedCategories: ['electronics', 'fashion'],
        lastUpdated: new Date().toISOString(),
      };
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingPreferences));

      await CategoryPreferenceService.removeCategoryPreference('electronics');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_category_preferences',
        expect.not.stringContaining('electronics')
      );
    });
  });

  describe('getCategoriesByIds', () => {
    it('should return categories matching provided IDs', async () => {
      const categories = await CategoryPreferenceService.getCategoriesByIds(['electronics', 'fashion']);

      expect(categories.length).toBe(2);
      expect(categories.find(c => c.id === 'electronics')).toBeDefined();
      expect(categories.find(c => c.id === 'fashion')).toBeDefined();
    });

    it('should return empty array for non-existent IDs', async () => {
      const categories = await CategoryPreferenceService.getCategoriesByIds(['non-existent']);

      expect(categories.length).toBe(0);
    });
  });

  describe('clearUserPreferences', () => {
    it('should clear preferences from storage', async () => {
      await CategoryPreferenceService.clearUserPreferences();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_category_preferences');
    });
  });
});