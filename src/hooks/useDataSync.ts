import { useState, useEffect, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { dataSyncService, SyncResult, SyncConflict } from '../services/DataSyncService';
import { offlineModeService } from '../services/OfflineModeService';

export interface DataSyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncResult: SyncResult | null;
  conflicts: SyncConflict[];
  isOffline: boolean;
  error: string | null;
}

export interface DataSyncOptions {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  syncOnAppForeground: boolean;
  syncOnNetworkReconnect: boolean;
  conflictResolutionStrategy: 'latest_wins' | 'manual' | 'merge';
}

export const useDataSync = (
  userId: string,
  options: Partial<DataSyncOptions> = {}
) => {
  const defaultOptions: DataSyncOptions = {
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5 minutes
    syncOnAppForeground: true,
    syncOnNetworkReconnect: true,
    conflictResolutionStrategy: 'latest_wins',
  };

  const config = { ...defaultOptions, ...options };

  const [syncState, setSyncState] = useState<DataSyncState>({
    isSyncing: false,
    lastSyncTime: null,
    syncResult: null,
    conflicts: [],
    isOffline: false,
    error: null,
  });

  // Manual sync function
  const syncData = useCallback(async (): Promise<SyncResult> => {
    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Configure sync service
      dataSyncService.setConflictResolutionStrategy(config.conflictResolutionStrategy);

      // Perform sync
      const result = await dataSyncService.syncUserData(userId);

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        syncResult: result,
        conflicts: result.conflicts,
        error: result.success ? null : result.errors.join(', '),
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));

      return {
        success: false,
        conflicts: [],
        syncedItems: 0,
        errors: [errorMessage],
      };
    }
  }, [userId, config.conflictResolutionStrategy]);

  // Resolve conflicts manually
  const resolveConflict = useCallback(async (
    conflictIndex: number,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<void> => {
    const conflicts = syncState.conflicts;
    if (conflictIndex < 0 || conflictIndex >= conflicts.length) {
      return;
    }

    // In a real implementation, you would send the resolution to the sync service
    console.log(`Resolving conflict ${conflictIndex} with strategy: ${resolution}`);

    // Remove the resolved conflict from state
    setSyncState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter((_, index) => index !== conflictIndex),
    }));
  }, [syncState.conflicts]);

  // Check network status and update offline mode
  const updateOfflineStatus = useCallback(async () => {
    // In a real app, you would use NetInfo to check network status
    // For now, we'll simulate network status
    const isOnline = true; // Simulate online status
    
    setSyncState(prev => ({ ...prev, isOffline: !isOnline }));
    dataSyncService.setOnlineStatus(isOnline);
    offlineModeService.setOfflineMode(!isOnline);

    // Process sync queue when coming back online
    if (isOnline && syncState.isOffline) {
      await dataSyncService.processSyncQueue(userId);
      if (config.syncOnNetworkReconnect) {
        await syncData();
      }
    }
  }, [userId, syncState.isOffline, syncData, config.syncOnNetworkReconnect]);

  // Handle app state changes
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && config.syncOnAppForeground) {
      await updateOfflineStatus();
      if (!syncState.isOffline) {
        await syncData();
      }
    }
  }, [config.syncOnAppForeground, syncState.isOffline, syncData, updateOfflineStatus]);

  // Setup auto-sync interval
  useEffect(() => {
    if (!config.autoSync) return;

    const interval = setInterval(async () => {
      if (!syncState.isSyncing && !syncState.isOffline) {
        await syncData();
      }
    }, config.syncInterval);

    return () => clearInterval(interval);
  }, [config.autoSync, config.syncInterval, syncState.isSyncing, syncState.isOffline, syncData]);

  // Setup app state listener
  useEffect(() => {
    if (!config.syncOnAppForeground) return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [config.syncOnAppForeground, handleAppStateChange]);

  // Initialize sync on mount
  useEffect(() => {
    updateOfflineStatus();
    
    if (config.autoSync && !syncState.isOffline) {
      syncData();
    }
  }, [userId]); // Only run when userId changes

  // Platform-specific sync utilities
  const getPlatformInfo = useCallback(() => {
    return {
      platform: Platform.OS,
      deviceId: dataSyncService.getDeviceId(),
      isOnline: dataSyncService.isDeviceOnline(),
    };
  }, []);

  // Cache management for offline mode
  const getCacheInfo = useCallback(async () => {
    return await offlineModeService.getCacheInfo();
  }, []);

  const clearCache = useCallback(async () => {
    await offlineModeService.clearCache();
  }, []);

  // Force sync (ignores auto-sync settings)
  const forceSync = useCallback(async (): Promise<SyncResult> => {
    return await syncData();
  }, [syncData]);

  return {
    // State
    ...syncState,
    
    // Actions
    syncData,
    forceSync,
    resolveConflict,
    
    // Utilities
    getPlatformInfo,
    getCacheInfo,
    clearCache,
    
    // Configuration
    updateOfflineStatus,
  };
};

// Hook for offline-first data operations
export const useOfflineData = (userId: string) => {
  const [isOffline, setIsOffline] = useState(false);

  const addToOfflineCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (isOffline) {
      await offlineModeService.addToOfflineCart(productId, quantity);
    }
  }, [isOffline]);

  const addToOfflineWishlist = useCallback(async (productId: string) => {
    if (isOffline) {
      await offlineModeService.addToOfflineWishlist(productId);
    }
  }, [isOffline]);

  const recordOfflineSwipe = useCallback(async (productId: string, action: 'like' | 'skip') => {
    if (isOffline) {
      await offlineModeService.recordOfflineSwipe(productId, action);
    }
  }, [isOffline]);

  const getCachedProducts = useCallback(async () => {
    return await offlineModeService.getCachedProducts();
  }, []);

  const getCachedUserData = useCallback(async () => {
    return await offlineModeService.getCachedUserData();
  }, []);

  useEffect(() => {
    // Monitor offline status
    const checkOfflineStatus = () => {
      const offline = !dataSyncService.isDeviceOnline();
      setIsOffline(offline);
    };

    checkOfflineStatus();
    const interval = setInterval(checkOfflineStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    isOffline,
    addToOfflineCart,
    addToOfflineWishlist,
    recordOfflineSwipe,
    getCachedProducts,
    getCachedUserData,
  };
};