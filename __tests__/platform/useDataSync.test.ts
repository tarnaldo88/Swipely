import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useDataSync, useOfflineData } from '../../src/hooks/useDataSync';
import { dataSyncService } from '../../src/services/DataSyncService';
import { offlineModeService } from '../../src/services/OfflineModeService';

// Mock the services
jest.mock('../../src/services/DataSyncService');
jest.mock('../../src/services/OfflineModeService');

// Mock AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
    currentState: 'active',
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('useDataSync Hook', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock service methods
    (dataSyncService.syncUserData as jest.Mock).mockResolvedValue({
      success: true,
      conflicts: [],
      syncedItems: 5,
      errors: [],
    });
    
    (dataSyncService.setConflictResolutionStrategy as jest.Mock).mockImplementation(() => {});
    (dataSyncService.setOnlineStatus as jest.Mock).mockImplementation(() => {});
    (dataSyncService.isDeviceOnline as jest.Mock).mockReturnValue(true);
    (dataSyncService.getDeviceId as jest.Mock).mockReturnValue('device-123');
    (dataSyncService.processSyncQueue as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDataSync(mockUserId));

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncTime).toBeNull();
      expect(result.current.syncResult).toBeNull();
      expect(result.current.conflicts).toEqual([]);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should perform manual sync', async () => {
      const { result } = renderHook(() => useDataSync(mockUserId));

      await act(async () => {
        const syncResult = await result.current.syncData();
        expect(syncResult.success).toBe(true);
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncTime).not.toBeNull();
      expect(result.current.syncResult?.success).toBe(true);
    });

    it('should handle sync errors', async () => {
      (dataSyncService.syncUserData as jest.Mock).mockRejectedValue(new Error('Sync failed'));

      const { result } = renderHook(() => useDataSync(mockUserId));

      await act(async () => {
        const syncResult = await result.current.syncData();
        expect(syncResult.success).toBe(false);
      });

      expect(result.current.error).toBe('Sync failed');
    });
  });

  describe('Auto Sync', () => {
    it('should perform auto sync at intervals', async () => {
      const { result } = renderHook(() => 
        useDataSync(mockUserId, { 
          autoSync: true, 
          syncInterval: 1000 // 1 second for testing
        })
      );

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(dataSyncService.syncUserData).toHaveBeenCalled();
    });

    it('should not auto sync when disabled', () => {
      renderHook(() => 
        useDataSync(mockUserId, { 
          autoSync: false, 
          syncInterval: 1000
        })
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(dataSyncService.syncUserData).not.toHaveBeenCalled();
    });

    it('should not sync when offline', async () => {
      (dataSyncService.isDeviceOnline as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => 
        useDataSync(mockUserId, { 
          autoSync: true, 
          syncInterval: 1000
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isOffline).toBe(true);
      expect(dataSyncService.syncUserData).not.toHaveBeenCalled();
    });
  });

  describe('App State Handling', () => {
    it('should sync when app becomes active', async () => {
      const mockAddEventListener = AppState.addEventListener as jest.Mock;
      let appStateHandler: (state: string) => void;

      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'change') {
          appStateHandler = handler;
        }
        return { remove: jest.fn() };
      });

      renderHook(() => 
        useDataSync(mockUserId, { 
          syncOnAppForeground: true 
        })
      );

      // Simulate app becoming active
      await act(async () => {
        appStateHandler!('active');
      });

      expect(dataSyncService.syncUserData).toHaveBeenCalled();
    });

    it('should not sync on app foreground when disabled', () => {
      const mockAddEventListener = AppState.addEventListener as jest.Mock;
      
      renderHook(() => 
        useDataSync(mockUserId, { 
          syncOnAppForeground: false 
        })
      );

      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Conflict Resolution', () => {
    it('should resolve conflicts manually', async () => {
      const mockConflicts = [
        {
          localData: {
            id: 'test',
            type: 'user_preferences' as const,
            data: { test: 'local' },
            timestamp: Date.now(),
            deviceId: 'device1',
            platform: 'ios' as const,
            version: 1,
          },
          remoteData: {
            id: 'test',
            type: 'user_preferences' as const,
            data: { test: 'remote' },
            timestamp: Date.now() + 1000,
            deviceId: 'device2',
            platform: 'android' as const,
            version: 1,
          },
          conflictType: 'timestamp' as const,
        },
      ];

      (dataSyncService.syncUserData as jest.Mock).mockResolvedValue({
        success: true,
        conflicts: mockConflicts,
        syncedItems: 1,
        errors: [],
      });

      const { result } = renderHook(() => useDataSync(mockUserId));

      await act(async () => {
        await result.current.syncData();
      });

      expect(result.current.conflicts).toHaveLength(1);

      await act(async () => {
        await result.current.resolveConflict(0, 'local');
      });

      expect(result.current.conflicts).toHaveLength(0);
    });
  });

  describe('Platform Info', () => {
    it('should provide platform information', () => {
      const { result } = renderHook(() => useDataSync(mockUserId));

      const platformInfo = result.current.getPlatformInfo();

      expect(platformInfo).toHaveProperty('platform');
      expect(platformInfo).toHaveProperty('deviceId');
      expect(platformInfo).toHaveProperty('isOnline');
    });
  });

  describe('Cache Management', () => {
    it('should get cache info', async () => {
      (offlineModeService.getCacheInfo as jest.Mock).mockResolvedValue({
        size: 1024,
        productCount: 10,
        lastSync: Date.now(),
        isExpired: false,
      });

      const { result } = renderHook(() => useDataSync(mockUserId));

      await act(async () => {
        const cacheInfo = await result.current.getCacheInfo();
        expect(cacheInfo.productCount).toBe(10);
      });
    });

    it('should clear cache', async () => {
      const { result } = renderHook(() => useDataSync(mockUserId));

      await act(async () => {
        await result.current.clearCache();
      });

      expect(offlineModeService.clearCache).toHaveBeenCalled();
    });
  });
});

describe('useOfflineData Hook', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock offline service methods
    (offlineModeService.addToOfflineCart as jest.Mock).mockResolvedValue(undefined);
    (offlineModeService.addToOfflineWishlist as jest.Mock).mockResolvedValue(undefined);
    (offlineModeService.recordOfflineSwipe as jest.Mock).mockResolvedValue(undefined);
    (offlineModeService.getCachedProducts as jest.Mock).mockResolvedValue([]);
    (offlineModeService.getCachedUserData as jest.Mock).mockResolvedValue({});
    (dataSyncService.isDeviceOnline as jest.Mock).mockReturnValue(false); // Start offline
  });

  describe('Offline Operations', () => {
    it('should add items to offline cart when offline', async () => {
      const { result } = renderHook(() => useOfflineData(mockUserId));

      // Wait for offline status to be detected
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.addToOfflineCart('product1', 2);
      });

      expect(offlineModeService.addToOfflineCart).toHaveBeenCalledWith('product1', 2);
    });

    it('should add items to offline wishlist when offline', async () => {
      const { result } = renderHook(() => useOfflineData(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.addToOfflineWishlist('product1');
      });

      expect(offlineModeService.addToOfflineWishlist).toHaveBeenCalledWith('product1');
    });

    it('should record offline swipe actions when offline', async () => {
      const { result } = renderHook(() => useOfflineData(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.recordOfflineSwipe('product1', 'like');
      });

      expect(offlineModeService.recordOfflineSwipe).toHaveBeenCalledWith('product1', 'like');
    });

    it('should not perform offline operations when online', async () => {
      (dataSyncService.isDeviceOnline as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useOfflineData(mockUserId));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        await result.current.addToOfflineCart('product1', 2);
      });

      expect(offlineModeService.addToOfflineCart).not.toHaveBeenCalled();
    });
  });

  describe('Cached Data Retrieval', () => {
    it('should get cached products', async () => {
      const mockProducts = [
        { id: 'product1', title: 'Test Product' },
      ];

      (offlineModeService.getCachedProducts as jest.Mock).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useOfflineData(mockUserId));

      await act(async () => {
        const products = await result.current.getCachedProducts();
        expect(products).toEqual(mockProducts);
      });
    });

    it('should get cached user data', async () => {
      const mockUserData = {
        userPreferences: { theme: 'dark' },
        cartItems: [{ productId: 'product1', quantity: 1 }],
      };

      (offlineModeService.getCachedUserData as jest.Mock).mockResolvedValue(mockUserData);

      const { result } = renderHook(() => useOfflineData(mockUserId));

      await act(async () => {
        const userData = await result.current.getCachedUserData();
        expect(userData).toEqual(mockUserData);
      });
    });
  });

  describe('Offline Status Detection', () => {
    it('should detect offline status correctly', async () => {
      const { result } = renderHook(() => useOfflineData(mockUserId));

      // Wait for offline status to be detected
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should update offline status when connectivity changes', async () => {
      const { result } = renderHook(() => useOfflineData(mockUserId));

      // Start offline
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isOffline).toBe(true);

      // Go online
      (dataSyncService.isDeviceOnline as jest.Mock).mockReturnValue(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 5100)); // Wait for status check interval
      });

      expect(result.current.isOffline).toBe(false);
    });
  });
});