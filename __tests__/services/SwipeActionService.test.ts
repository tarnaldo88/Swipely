import { SwipeActionService, getSwipeActionService, resetSwipeActionService } from '../../src/services/SwipeActionService';
import { ProductFeedService } from '../../src/services/ProductFeedService';
import * as Haptics from 'expo-haptics';



// Mock ProductFeedService
jest.mock('../../src/services/ProductFeedService', () => ({
  ProductFeedService: {
    recordSwipeAction: jest.fn(),
    getSessionSwipeHistory: jest.fn(),
    getLikedProductsFromSession: jest.fn(),
    getSkippedProductsFromSession: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('SwipeActionService', () => {
  const mockUserId = 'test-user-1';
  const mockProductId = 'test-product-1';
  let service: SwipeActionService;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSwipeActionService();
    service = new SwipeActionService(mockUserId);
  });

  describe('Constructor', () => {
    it('should initialize with userId and haptic enabled by default', () => {
      const newService = new SwipeActionService(mockUserId);
      expect(newService.isHapticEnabled()).toBe(true);
    });

    it('should initialize with haptic disabled when specified', () => {
      const newService = new SwipeActionService(mockUserId, false);
      expect(newService.isHapticEnabled()).toBe(false);
    });
  });

  describe('Swipe Actions', () => {
    describe('onSwipeLeft', () => {
      it('should provide haptic feedback and record skip action', async () => {
        const mockResponse = { success: true };
        (ProductFeedService.recordSwipeAction as jest.Mock).mockResolvedValue(mockResponse);

        await service.onSwipeLeft(mockProductId);

        expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
        expect(ProductFeedService.recordSwipeAction).toHaveBeenCalledWith(
          mockProductId,
          'skip',
          mockUserId
        );
      });

      it('should not provide haptic feedback when disabled', async () => {
        service.setHapticEnabled(false);
        const mockResponse = { success: true };
        (ProductFeedService.recordSwipeAction as jest.Mock).mockResolvedValue(mockResponse);

        await service.onSwipeLeft(mockProductId);

        expect(Haptics.impactAsync).not.toHaveBeenCalled();
        expect(ProductFeedService.recordSwipeAction).toHaveBeenCalledWith(
          mockProductId,
          'skip',
          mockUserId
        );
      });

      it('should handle errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (ProductFeedService.recordSwipeAction as jest.Mock).mockRejectedValue(new Error('Service error'));

        await expect(service.onSwipeLeft(mockProductId)).rejects.toThrow('Service error');
        expect(consoleSpy).toHaveBeenCalledWith('Error handling left swipe:', expect.any(Error));

        consoleSpy.mockRestore();
      });
    });

    describe('onSwipeRight', () => {
      it('should provide haptic feedback and record like action', async () => {
        const mockResponse = { success: true };
        (ProductFeedService.recordSwipeAction as jest.Mock).mockResolvedValue(mockResponse);

        await service.onSwipeRight(mockProductId);

        expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
        expect(ProductFeedService.recordSwipeAction).toHaveBeenCalledWith(
          mockProductId,
          'like',
          mockUserId
        );
      });

      it('should not provide haptic feedback when disabled', async () => {
        service.setHapticEnabled(false);
        const mockResponse = { success: true };
        (ProductFeedService.recordSwipeAction as jest.Mock).mockResolvedValue(mockResponse);

        await service.onSwipeRight(mockProductId);

        expect(Haptics.impactAsync).not.toHaveBeenCalled();
        expect(ProductFeedService.recordSwipeAction).toHaveBeenCalledWith(
          mockProductId,
          'like',
          mockUserId
        );
      });
    });
  });

  describe('Cart and Details Actions', () => {
    describe('onAddToCart', () => {
      it('should provide success haptic feedback', async () => {
        await service.onAddToCart(mockProductId);

        expect(Haptics.notificationAsync).toHaveBeenCalledWith(
          Haptics.NotificationFeedbackType.Success
        );
      });

      it('should not provide haptic feedback when disabled', async () => {
        service.setHapticEnabled(false);

        await service.onAddToCart(mockProductId);

        expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      });

      it('should handle errors gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        (Haptics.notificationAsync as jest.Mock).mockRejectedValue(new Error('Haptic error'));

        await expect(service.onAddToCart(mockProductId)).resolves.not.toThrow();

        expect(consoleSpy).toHaveBeenCalledWith('Error handling add to cart:', expect.any(Error));
        consoleSpy.mockRestore();
      });
    });

    describe('onViewDetails', () => {
      it('should provide selection haptic feedback', async () => {
        await service.onViewDetails(mockProductId);

        expect(Haptics.selectionAsync).toHaveBeenCalled();
      });

      it('should not provide haptic feedback when disabled', async () => {
        service.setHapticEnabled(false);

        await service.onViewDetails(mockProductId);

        expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Configuration Methods', () => {
    it('should enable and disable haptic feedback', () => {
      expect(service.isHapticEnabled()).toBe(true);

      service.setHapticEnabled(false);
      expect(service.isHapticEnabled()).toBe(false);

      service.setHapticEnabled(true);
      expect(service.isHapticEnabled()).toBe(true);
    });

    it('should update userId', async () => {
      const newUserId = 'new-user-id';
      service.setUserId(newUserId);
      
      // We can't directly test the private userId, but we can test it through actions
      await service.onSwipeLeft(mockProductId);
      expect(ProductFeedService.recordSwipeAction).toHaveBeenCalledWith(
        mockProductId,
        'skip',
        newUserId
      );
    });
  });

  describe('Session Management', () => {
    it('should delegate session methods to ProductFeedService', () => {
      const mockHistory = [{ userId: mockUserId, productId: mockProductId, action: 'like' as const, timestamp: new Date(), sessionId: 'session-1' }];
      const mockLikedProducts = ['product-1', 'product-2'];
      const mockSkippedProducts = ['product-3', 'product-4'];

      (ProductFeedService.getSessionSwipeHistory as jest.Mock).mockReturnValue(mockHistory);
      (ProductFeedService.getLikedProductsFromSession as jest.Mock).mockReturnValue(mockLikedProducts);
      (ProductFeedService.getSkippedProductsFromSession as jest.Mock).mockReturnValue(mockSkippedProducts);

      expect(service.getSessionSwipeHistory()).toEqual(mockHistory);
      expect(service.getLikedProductsFromSession()).toEqual(mockLikedProducts);
      expect(service.getSkippedProductsFromSession()).toEqual(mockSkippedProducts);

      service.clearSession();
      expect(ProductFeedService.clearSession).toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should create singleton instance with getSwipeActionService', () => {
      const instance1 = getSwipeActionService(mockUserId);
      const instance2 = getSwipeActionService();

      expect(instance1).toBe(instance2);
    });

    it('should update userId on existing instance', () => {
      const instance1 = getSwipeActionService(mockUserId);
      const newUserId = 'new-user-id';
      const instance2 = getSwipeActionService(newUserId);

      expect(instance1).toBe(instance2);
    });

    it('should throw error when no userId provided and no instance exists', () => {
      resetSwipeActionService();
      
      expect(() => getSwipeActionService()).toThrow(
        'SwipeActionService not initialized. Please provide a userId.'
      );
    });

    it('should reset singleton instance', () => {
      getSwipeActionService(mockUserId);
      resetSwipeActionService();
      
      expect(() => getSwipeActionService()).toThrow(
        'SwipeActionService not initialized. Please provide a userId.'
      );
    });
  });

  describe('recordSwipeAction', () => {
    it('should delegate to ProductFeedService.recordSwipeAction', async () => {
      const mockResponse = { success: true, message: 'Action recorded' };
      (ProductFeedService.recordSwipeAction as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.recordSwipeAction(mockProductId, 'like', mockUserId);

      expect(ProductFeedService.recordSwipeAction).toHaveBeenCalledWith(
        mockProductId,
        'like',
        mockUserId
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors from ProductFeedService', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (ProductFeedService.recordSwipeAction as jest.Mock).mockRejectedValue(new Error('Service error'));

      await expect(service.recordSwipeAction(mockProductId, 'like', mockUserId))
        .rejects.toThrow('Service error');

      expect(consoleSpy).toHaveBeenCalledWith('Error recording swipe action:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});