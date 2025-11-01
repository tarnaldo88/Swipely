import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DataSyncService, dataSyncService } from '../../src/services/DataSyncService';
import { OfflineModeService, offlineModeService } from '../../src/services/OfflineModeService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('DataSyncService', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = DataSyncService.getInstance();
      const instance2 = DataSyncService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize device ID', async () => {
      const deviceId = dataSyncService.getDeviceId();
      
      expect(deviceId).toBeDefined();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBeGreaterThan(0);
    });

    it('should set online status', () => {
      dataSyncService.setOnlineStatus(false);
      expect(dataSyncService.isDeviceOnline()).toBe(false);
      
      dataSyncService.setOnlineStatus(true);
      expect(dataSyncService.isDeviceOnline()).toBe(true);
    });
  });

  describe('Data Synchronization', () => {
    it('should sync user data successfully', async () => {
      // Mock local data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key.includes('user_preferences')) {
          return Promise.resolve(JSON.stringify({
            categories: ['electronics', 'clothing'],
            lastModified: Date.now(),
            version: 1,
          }));
        }
        return Promise.resolve(null);
      });

      const result = await dataSyncService.syncUserData(mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle sync errors gracefully', async () => {
      // Mock AsyncStorage error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await dataSyncService.syncUserData(mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect conflicts correctly', async () => {
      // Mock conflicting data
      const localData = {
        id: 'user_preferences_test',
        type: 'user_preferences' as const,
        data: { categories: ['electronics'] },
        timestamp: Date.now(),
        deviceId: 'device1',
        platform: 'ios' as const,
        version: 1,
      };

      const remoteData = {
        id: 'user_preferences_test',
        type: 'user_preferences' as const,
        data: { categories: ['clothing'] },
        timestamp: Date.now() + 1000, // Different timestamp
        deviceId: 'device2',
        platform: 'android' as const,
        version: 1,
      };

      const conflicts = dataSyncService['detectConflicts']([localData], [remoteData]);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe('timestamp');
    });

    it('should resolve conflicts with latest_wins strategy', async () => {
      dataSyncService.setConflictResolutionStrategy('latest_wins');

      const conflict = {
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
      };

      const resolved = await dataSyncService['resolveConflicts']([conflict]);
      
      expect(resolved).toHaveLength(1);
      expect(resolved[0].data.test).toBe('remote'); // Remote is newer
    });
  });

  describe('Offline Queue', () => {
    it('should queue data for sync when offline', async () => {
      const testData = {
        id: 'test-data',
        type: 'user_preferences' as const,
        data: { test: 'value' },
        timestamp: Date.now(),
        deviceId: 'device1',
        platform: 'ios' as const,
        version: 1,
      };

      await dataSyncService.queueForSync(testData);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sync_queue',
        expect.stringContaining('test-data')
      );
    });

    it('should process sync queue when online', async () => {
      // Mock queued data
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'sync_queue') {
          return Promise.resolve(JSON.stringify([{
            id: 'queued-data',
            type: 'user_preferences',
            data: { test: 'queued' },
            timestamp: Date.now(),
            deviceId: 'device1',
            platform: 'ios',
            version: 1,
          }]));
        }
        return Promise.resolve(null);
      });

      dataSyncService.setOnlineStatus(true);
      await dataSyncService.processSyncQueue(mockUserId);
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('sync_queue');
    });
  });

  describe('Data Merging', () => {
    it('should merge user preferences correctly', () => {
      const local = {
        id: 'test',
        type: 'user_preferences' as const,
        data: { categories: ['electronics'], theme: 'dark' },
        timestamp: Date.now(),
        deviceId: 'device1',
        platform: 'ios' as const,
        version: 1,
      };

      const remote = {
        id: 'test',
        type: 'user_preferences' as const,
        data: { categories: ['clothing'], language: 'en' },
        timestamp: Date.now() + 1000,
        deviceId: 'device2',
        platform: 'android' as const,
        version: 1,
      };

      const merged = dataSyncService['mergeUserPreferences'](local, remote);
      
      expect(merged.data.categories).toEqual(['electronics']); // Local wins
      expect(merged.data.theme).toBe('dark'); // Local only
      expect(merged.data.language).toBe('en'); // Remote only
    });

    it('should merge cart items correctly', () => {
      const local = {
        id: 'test',
        type: 'cart_items' as const,
        data: {
          items: [
            { productId: 'product1', quantity: 2 },
            { productId: 'product2', quantity: 1 },
          ],
        },
        timestamp: Date.now(),
        deviceId: 'device1',
        platform: 'ios' as const,
        version: 1,
      };

      const remote = {
        id: 'test',
        type: 'cart_items' as const,
        data: {
          items: [
            { productId: 'product1', quantity: 1 }, // Lower quantity
            { productId: 'product3', quantity: 3 }, // New item
          ],
        },
        timestamp: Date.now() + 1000,
        deviceId: 'device2',
        platform: 'android' as const,
        version: 1,
      };

      const merged = dataSyncService['mergeCartItems'](local, remote);
      
      expect(merged.data.items).toHaveLength(3);
      expect(merged.data.items.find((item: any) => item.productId === 'product1')?.quantity).toBe(2); // Higher quantity wins
      expect(merged.data.items.find((item: any) => item.productId === 'product2')).toBeDefined(); // Local only
      expect(merged.data.items.find((item: any) => item.productId === 'product3')).toBeDefined(); // Remote only
    });

    it('should merge wishlist items correctly', () => {
      const local = {
        id: 'test',
        type: 'wishlist_items' as const,
        data: {
          items: [
            { productId: 'product1', addedAt: Date.now() },
            { productId: 'product2', addedAt: Date.now() },
          ],
        },
        timestamp: Date.now(),
        deviceId: 'device1',
        platform: 'ios' as const,
        version: 1,
      };

      const remote = {
        id: 'test',
        type: 'wishlist_items' as const,
        data: {
          items: [
            { productId: 'product1', addedAt: Date.now() }, // Duplicate
            { productId: 'product3', addedAt: Date.now() }, // New item
          ],
        },
        timestamp: Date.now() + 1000,
        deviceId: 'device2',
        platform: 'android' as const,
        version: 1,
      };

      const merged = dataSyncService['mergeWishlistItems'](local, remote);
      
      expect(merged.data.items).toHaveLength(3); // No duplicates
      expect(merged.data.items.map((item: any) => item.productId).sort()).toEqual(['product1', 'product2', 'product3']);
    });
  });
});

describe('OfflineModeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = OfflineModeService.getInstance();
      const instance2 = OfflineModeService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize offline mode', () => {
      expect(offlineModeService.isInOfflineMode()).toBe(false);
      
      offlineModeService.setOfflineMode(true);
      expect(offlineModeService.isInOfflineMode()).toBe(true);
    });
  });

  describe('Product Caching', () => {
    const mockProducts = [
      {
        id: 'product1',
        title: 'Test Product 1',
        price: 29.99,
        currency: '$',
        imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        category: { id: 'cat1', name: 'Electronics' },
        availability: true,
      },
      {
        id: 'product2',
        title: 'Test Product 2',
        price: 49.99,
        currency: '$',
        imageUrls: ['https://example.com/image3.jpg'],
        category: { id: 'cat2', name: 'Clothing' },
        availability: false,
      },
    ];

    it('should cache product data', async () => {
      await offlineModeService.cacheProductData(mockProducts);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data',
        expect.stringContaining('product1')
      );
    });

    it('should retrieve cached products', async () => {
      // Mock cached data
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        products: mockProducts,
        lastSync: Date.now(),
        userPreferences: {},
        cartItems: [],
        wishlistItems: [],
        swipeHistory: [],
      }));

      const cachedProducts = await offlineModeService.getCachedProducts();
      
      expect(cachedProducts).toHaveLength(2);
      expect(cachedProducts[0].id).toBe('product1');
    });

    it('should return empty array for expired cache', async () => {
      // Mock expired cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        products: mockProducts,
        lastSync: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        userPreferences: {},
        cartItems: [],
        wishlistItems: [],
        swipeHistory: [],
      }));

      const cachedProducts = await offlineModeService.getCachedProducts();
      
      expect(cachedProducts).toHaveLength(0);
    });
  });

  describe('Offline Operations', () => {
    it('should add items to offline cart', async () => {
      await offlineModeService.addToOfflineCart('product1', 2);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data',
        expect.stringContaining('product1')
      );
    });

    it('should add items to offline wishlist', async () => {
      await offlineModeService.addToOfflineWishlist('product1');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data',
        expect.stringContaining('product1')
      );
    });

    it('should record offline swipe actions', async () => {
      await offlineModeService.recordOfflineSwipe('product1', 'like');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'offline_data',
        expect.stringContaining('product1')
      );
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      await offlineModeService.clearCache();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('offline_data');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cached_images');
    });

    it('should get cache size', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'offline_data') return Promise.resolve('{"test": "data"}');
        if (key === 'cached_images') return Promise.resolve('["image1.jpg"]');
        return Promise.resolve(null);
      });

      const size = await offlineModeService.getCacheSize();
      
      expect(size).toBeGreaterThan(0);
    });

    it('should get cache info', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        products: [{ id: 'product1' }, { id: 'product2' }],
        lastSync: Date.now(),
        userPreferences: {},
        cartItems: [],
        wishlistItems: [],
        swipeHistory: [],
      }));

      const cacheInfo = await offlineModeService.getCacheInfo();
      
      expect(cacheInfo.productCount).toBe(2);
      expect(cacheInfo.isExpired).toBe(false);
      expect(cacheInfo.size).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should update cache configuration', () => {
      const newConfig = {
        maxProducts: 50,
        enableImageCaching: false,
      };

      offlineModeService.updateCacheConfig(newConfig);
      const config = offlineModeService.getCacheConfig();
      
      expect(config.maxProducts).toBe(50);
      expect(config.enableImageCaching).toBe(false);
    });

    it('should get current cache configuration', () => {
      const config = offlineModeService.getCacheConfig();
      
      expect(config).toHaveProperty('maxProducts');
      expect(config).toHaveProperty('maxCacheAge');
      expect(config).toHaveProperty('enableImageCaching');
      expect(config).toHaveProperty('compressionLevel');
    });
  });
});