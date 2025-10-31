import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartServiceImpl, getCartService, resetCartService } from '../../src/services/CartService';
import { CartItem } from '../../src/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('CartService', () => {
  const mockProductId = 'test-product-1';
  const mockProductId2 = 'test-product-2';
  let service: CartServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    resetCartService();
    service = new CartServiceImpl();
  });

  describe('Initialization', () => {
    it('should initialize with empty cart when no stored data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const items = await service.getCartItems();
      expect(items).toEqual([]);
    });

    it('should load stored cart items on initialization', async () => {
      const storedItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 2,
          addedAt: new Date('2023-01-01'),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedItems));

      const newService = new CartServiceImpl();
      const items = await newService.getCartItems();
      
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(mockProductId);
      expect(items[0].quantity).toBe(2);
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const newService = new CartServiceImpl();
      const items = await newService.getCartItems();
      
      expect(items).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize cart service:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('addToCart', () => {
    it('should add new product to cart', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.addToCart(mockProductId, 1);
      const items = await service.getCartItems();

      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(mockProductId);
      expect(items[0].quantity).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should update quantity for existing product', async () => {
      const existingItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 1,
          addedAt: new Date(),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.addToCart(mockProductId, 2);
      const items = await service.getCartItems();

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it('should use default quantity of 1 when not specified', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.addToCart(mockProductId);
      const items = await service.getCartItems();

      expect(items[0].quantity).toBe(1);
    });

    it('should throw error for invalid quantity', async () => {
      await expect(service.addToCart(mockProductId, 0)).rejects.toThrow('Quantity must be greater than 0');
      await expect(service.addToCart(mockProductId, -1)).rejects.toThrow('Quantity must be greater than 0');
    });

    it('should handle storage errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.addToCart(mockProductId, 1)).rejects.toThrow('Failed to save cart data');
    });
  });

  describe('removeFromCart', () => {
    it('should remove product from cart', async () => {
      const existingItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 1,
          addedAt: new Date(),
          selectedVariants: {}
        },
        {
          productId: mockProductId2,
          quantity: 2,
          addedAt: new Date(),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.removeFromCart(mockProductId);
      const items = await service.getCartItems();

      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe(mockProductId2);
    });

    it('should throw error when product not found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      await expect(service.removeFromCart(mockProductId)).rejects.toThrow('Product not found in cart');
    });
  });

  describe('updateQuantity', () => {
    beforeEach(() => {
      const existingItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 2,
          addedAt: new Date(),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update product quantity', async () => {
      await service.updateQuantity(mockProductId, 5);
      const items = await service.getCartItems();

      expect(items[0].quantity).toBe(5);
    });

    it('should remove product when quantity is 0', async () => {
      await service.updateQuantity(mockProductId, 0);
      const items = await service.getCartItems();

      expect(items).toHaveLength(0);
    });

    it('should throw error for negative quantity', async () => {
      await expect(service.updateQuantity(mockProductId, -1)).rejects.toThrow('Quantity cannot be negative');
    });

    it('should throw error when product not found', async () => {
      await expect(service.updateQuantity('non-existent', 1)).rejects.toThrow('Product not found in cart');
    });
  });

  describe('getCartCount', () => {
    it('should return total quantity of all items', async () => {
      const existingItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 2,
          addedAt: new Date(),
          selectedVariants: {}
        },
        {
          productId: mockProductId2,
          quantity: 3,
          addedAt: new Date(),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));

      const count = await service.getCartCount();
      expect(count).toBe(5);
    });

    it('should return 0 for empty cart', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const count = await service.getCartCount();
      expect(count).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const existingItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 1,
          addedAt: new Date(),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await service.clearCart();
      const items = await service.getCartItems();

      expect(items).toHaveLength(0);
    });
  });

  describe('getCartItemsWithDetails', () => {
    it('should return cart items with mock product details', async () => {
      const existingItems: CartItem[] = [
        {
          productId: mockProductId,
          quantity: 1,
          addedAt: new Date(),
          selectedVariants: {}
        }
      ];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(existingItems));

      const itemsWithDetails = await service.getCartItemsWithDetails();

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
        '@swipely_cart_sync',
        expect.any(String)
      );
    });

    it('should handle sync errors', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Sync error'));

      await expect(service.syncWithBackend()).rejects.toThrow('Cart synchronization failed');
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

  describe('Singleton Pattern', () => {
    it('should return same instance from getCartService', () => {
      const instance1 = getCartService();
      const instance2 = getCartService();

      expect(instance1).toBe(instance2);
    });

    it('should reset singleton instance', () => {
      const instance1 = getCartService();
      resetCartService();
      const instance2 = getCartService();

      expect(instance1).not.toBe(instance2);
    });
  });
});