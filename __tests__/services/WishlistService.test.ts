import AsyncStorage from '@react-native-async-storage/async-storage';
import { WishlistServiceImpl, getWishlistService, resetWishlistService, WishlistItem } from '../../src/services/WishlistService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('WishlistService', () => {
  const mockProductId = 'test-product-1';
  const mockProductId2 = 'test-product-2';
  let service: WishlistServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    resetWishlistService();
    service = new WishlistServiceImpl();
  });

  describe('Initialization', () => {
    it('should initialize with empty wishlist when no stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const items = await service.getWishlistItems();
      expect(items).toEqual([]);
    });

    it('should load stored wishlist items on initialization', async () => {
      const storedItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date('2023-01-01')
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedItems));

      const newService = new WishlistServiceImpl();
      const items = await newService.getWishlistItems();
      
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(mockProductId);
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const newService = new WishlistServiceImpl();
      const items = await newService.getWishlistItems();
      
      expect(items).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize wishlist service:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('addToWishlist', () => {
    it('should add new product to wishlist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.addToWishlist(mockProductId);
      const items = await service.getWishlistItems();

      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(mockProductId);
      expect(items[0].addedAt).toBeInstanceOf(Date);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should not add duplicate products to wishlist', async () => {
      const existingItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date()
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.addToWishlist(mockProductId);
      const items = await service.getWishlistItems();

      expect(items).toHaveLength(1);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.addToWishlist(mockProductId)).rejects.toThrow('Failed to save wishlist data');
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist', async () => {
      const existingItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date()
        },
        {
          productId: mockProductId2,
          addedAt: new Date()
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.removeFromWishlist(mockProductId);
      const items = await service.getWishlistItems();

      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(mockProductId2);
    });

    it('should throw error when product not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(service.removeFromWishlist(mockProductId)).rejects.toThrow('Product not found in wishlist');
    });
  });

  describe('isInWishlist', () => {
    it('should return true for products in wishlist', async () => {
      const existingItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date()
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));

      const isInWishlist = await service.isInWishlist(mockProductId);
      expect(isInWishlist).toBe(true);
    });

    it('should return false for products not in wishlist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const isInWishlist = await service.isInWishlist(mockProductId);
      expect(isInWishlist).toBe(false);
    });
  });

  describe('getWishlistCount', () => {
    it('should return correct count of wishlist items', async () => {
      const existingItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date()
        },
        {
          productId: mockProductId2,
          addedAt: new Date()
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));

      const count = await service.getWishlistCount();
      expect(count).toBe(2);
    });

    it('should return 0 for empty wishlist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const count = await service.getWishlistCount();
      expect(count).toBe(0);
    });
  });

  describe('clearWishlist', () => {
    it('should remove all items from wishlist', async () => {
      const existingItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date()
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.clearWishlist();
      const items = await service.getWishlistItems();

      expect(items).toHaveLength(0);
    });
  });

  describe('getWishlistItemsWithDetails', () => {
    it('should return wishlist items with mock product details', async () => {
      const existingItems: WishlistItem[] = [
        {
          productId: mockProductId,
          addedAt: new Date()
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));

      const itemsWithDetails = await service.getWishlistItemsWithDetails();

      expect(itemsWithDetails).toHaveLength(1);
      expect(itemsWithDetails[0].product).toBeDefined();
      expect(itemsWithDetails[0].product.id).toBe(mockProductId);
      expect(itemsWithDetails[0].product.title).toBe(`Product ${mockProductId}`);
    });
  });

  describe('syncWithBackend', () => {
    it('should update sync timestamp', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.syncWithBackend();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_wishlist_sync',
        expect.any(String)
      );
    });

    it('should handle sync errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Sync error'));

      await expect(service.syncWithBackend()).rejects.toThrow('Wishlist synchronization failed');
    });
  });

  describe('getLastSyncTimestamp', () => {
    it('should return sync timestamp when available', async () => {
      const mockTimestamp = new Date().toISOString();
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockTimestamp);

      const timestamp = await service.getLastSyncTimestamp();

      expect(timestamp).toEqual(new Date(mockTimestamp));
    });

    it('should return null when no sync timestamp', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const timestamp = await service.getLastSyncTimestamp();

      expect(timestamp).toBeNull();
    });
  });

  describe('forceSyncWithBackend', () => {
    it('should call syncWithBackend', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.forceSyncWithBackend();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_wishlist_sync',
        expect.any(String)
      );
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getWishlistService', () => {
      const instance1 = getWishlistService();
      const instance2 = getWishlistService();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton instance', () => {
      const instance1 = getWishlistService();
      resetWishlistService();
      const instance2 = getWishlistService();

      expect(instance1).not.toBe(instance2);
    });
  });
});