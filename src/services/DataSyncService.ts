import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface SyncData {
  id: string;
  type: 'user_preferences' | 'cart_items' | 'wishlist_items' | 'swipe_history';
  data: any;
  timestamp: number;
  deviceId: string;
  platform: 'ios' | 'android';
  version: number;
}

export interface SyncConflict {
  localData: SyncData;
  remoteData: SyncData;
  conflictType: 'timestamp' | 'version' | 'device';
}

export interface SyncResult {
  success: boolean;
  conflicts: SyncConflict[];
  syncedItems: number;
  errors: string[];
}

export class DataSyncService {
  private static instance: DataSyncService;
  private deviceId: string = '';
  private isOnline: boolean = true;
  private syncQueue: SyncData[] = [];
  private conflictResolutionStrategy: 'latest_wins' | 'manual' | 'merge' = 'latest_wins';

  private constructor() {
    this.initializeDeviceId();
    this.setupNetworkListener();
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private async initializeDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('device_id', deviceId);
      }
      this.deviceId = deviceId;
    } catch (error) {
      console.error('Error initializing device ID:', error);
      this.deviceId = this.generateDeviceId();
    }
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const platform = Platform.OS;
    return `${platform}_${timestamp}_${random}`;
  }

  private setupNetworkListener() {
    // In a real app, you would use NetInfo to monitor network status
    // For now, we'll simulate network status
    this.isOnline = true;
  }

  // Sync user data across devices
  async syncUserData(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      conflicts: [],
      syncedItems: 0,
      errors: [],
    };

    try {
      if (!this.isOnline) {
        result.errors.push('Device is offline');
        return result;
      }

      // Get local data
      const localData = await this.getLocalSyncData(userId);
      
      // Get remote data (simulate API call)
      const remoteData = await this.getRemoteSyncData(userId);
      
      // Detect conflicts
      const conflicts = this.detectConflicts(localData, remoteData);
      result.conflicts = conflicts;

      // Resolve conflicts
      const resolvedData = await this.resolveConflicts(conflicts);
      
      // Merge non-conflicting data
      const mergedData = this.mergeData(localData, remoteData, resolvedData);
      
      // Save merged data locally
      await this.saveLocalSyncData(userId, mergedData);
      
      // Upload resolved data to remote
      await this.uploadSyncData(userId, mergedData);
      
      result.success = true;
      result.syncedItems = mergedData.length;
      
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      console.error('Data sync error:', error);
    }

    return result;
  }

  private async getLocalSyncData(userId: string): Promise<SyncData[]> {
    try {
      const keys = [
        `user_preferences_${userId}`,
        `cart_items_${userId}`,
        `wishlist_items_${userId}`,
        `swipe_history_${userId}`,
      ];

      const data: SyncData[] = [];
      
      for (const key of keys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const parsedItem = JSON.parse(item);
          data.push({
            id: key,
            type: this.getDataType(key),
            data: parsedItem,
            timestamp: parsedItem.lastModified || Date.now(),
            deviceId: this.deviceId,
            platform: Platform.OS as 'ios' | 'android',
            version: parsedItem.version || 1,
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting local sync data:', error);
      return [];
    }
  }

  private async getRemoteSyncData(userId: string): Promise<SyncData[]> {
    // Simulate API call to get remote data
    // In a real app, this would be an actual API call
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock remote data
      return [];
    } catch (error) {
      console.error('Error getting remote sync data:', error);
      return [];
    }
  }

  private detectConflicts(localData: SyncData[], remoteData: SyncData[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    
    for (const localItem of localData) {
      const remoteItem = remoteData.find(item => item.id === localItem.id);
      
      if (remoteItem) {
        // Check for timestamp conflicts
        if (Math.abs(localItem.timestamp - remoteItem.timestamp) > 1000) { // 1 second tolerance
          conflicts.push({
            localData: localItem,
            remoteData: remoteItem,
            conflictType: 'timestamp',
          });
        }
        
        // Check for version conflicts
        if (localItem.version !== remoteItem.version) {
          conflicts.push({
            localData: localItem,
            remoteData: remoteItem,
            conflictType: 'version',
          });
        }
        
        // Check for device conflicts
        if (localItem.deviceId !== remoteItem.deviceId && 
            localItem.timestamp === remoteItem.timestamp) {
          conflicts.push({
            localData: localItem,
            remoteData: remoteItem,
            conflictType: 'device',
          });
        }
      }
    }
    
    return conflicts;
  }

  private async resolveConflicts(conflicts: SyncConflict[]): Promise<SyncData[]> {
    const resolvedData: SyncData[] = [];
    
    for (const conflict of conflicts) {
      let resolvedItem: SyncData;
      
      switch (this.conflictResolutionStrategy) {
        case 'latest_wins':
          resolvedItem = conflict.localData.timestamp > conflict.remoteData.timestamp
            ? conflict.localData
            : conflict.remoteData;
          break;
          
        case 'merge':
          resolvedItem = await this.mergeConflictingData(conflict);
          break;
          
        case 'manual':
          // In a real app, you would present this to the user
          resolvedItem = conflict.localData; // Default to local for now
          break;
          
        default:
          resolvedItem = conflict.localData;
      }
      
      resolvedData.push(resolvedItem);
    }
    
    return resolvedData;
  }

  private async mergeConflictingData(conflict: SyncConflict): Promise<SyncData> {
    const { localData, remoteData } = conflict;
    
    // Merge strategy depends on data type
    switch (localData.type) {
      case 'user_preferences':
        return this.mergeUserPreferences(localData, remoteData);
        
      case 'cart_items':
        return this.mergeCartItems(localData, remoteData);
        
      case 'wishlist_items':
        return this.mergeWishlistItems(localData, remoteData);
        
      case 'swipe_history':
        return this.mergeSwipeHistory(localData, remoteData);
        
      default:
        return localData.timestamp > remoteData.timestamp ? localData : remoteData;
    }
  }

  private mergeUserPreferences(local: SyncData, remote: SyncData): SyncData {
    const mergedData = {
      ...remote.data,
      ...local.data,
      lastModified: Math.max(local.timestamp, remote.timestamp),
      version: Math.max(local.version, remote.version) + 1,
    };
    
    return {
      ...local,
      data: mergedData,
      timestamp: Date.now(),
      version: mergedData.version,
    };
  }

  private mergeCartItems(local: SyncData, remote: SyncData): SyncData {
    const localItems = local.data.items || [];
    const remoteItems = remote.data.items || [];
    
    // Merge cart items, keeping higher quantities for duplicates
    const mergedItems = [...remoteItems];
    
    for (const localItem of localItems) {
      const existingIndex = mergedItems.findIndex(item => item.productId === localItem.productId);
      
      if (existingIndex >= 0) {
        // Keep the item with higher quantity
        if (localItem.quantity > mergedItems[existingIndex].quantity) {
          mergedItems[existingIndex] = localItem;
        }
      } else {
        mergedItems.push(localItem);
      }
    }
    
    return {
      ...local,
      data: {
        items: mergedItems,
        lastModified: Date.now(),
        version: Math.max(local.version, remote.version) + 1,
      },
      timestamp: Date.now(),
      version: Math.max(local.version, remote.version) + 1,
    };
  }

  private mergeWishlistItems(local: SyncData, remote: SyncData): SyncData {
    const localItems = local.data.items || [];
    const remoteItems = remote.data.items || [];
    
    // Merge wishlist items (union of both lists)
    const mergedItems = [...remoteItems];
    
    for (const localItem of localItems) {
      if (!mergedItems.find(item => item.productId === localItem.productId)) {
        mergedItems.push(localItem);
      }
    }
    
    return {
      ...local,
      data: {
        items: mergedItems,
        lastModified: Date.now(),
        version: Math.max(local.version, remote.version) + 1,
      },
      timestamp: Date.now(),
      version: Math.max(local.version, remote.version) + 1,
    };
  }

  private mergeSwipeHistory(local: SyncData, remote: SyncData): SyncData {
    const localHistory = local.data.history || [];
    const remoteHistory = remote.data.history || [];
    
    // Merge swipe history, avoiding duplicates
    const mergedHistory = [...remoteHistory];
    
    for (const localSwipe of localHistory) {
      if (!mergedHistory.find(swipe => 
        swipe.productId === localSwipe.productId && 
        swipe.timestamp === localSwipe.timestamp
      )) {
        mergedHistory.push(localSwipe);
      }
    }
    
    // Sort by timestamp
    mergedHistory.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      ...local,
      data: {
        history: mergedHistory,
        lastModified: Date.now(),
        version: Math.max(local.version, remote.version) + 1,
      },
      timestamp: Date.now(),
      version: Math.max(local.version, remote.version) + 1,
    };
  }

  private mergeData(localData: SyncData[], remoteData: SyncData[], resolvedData: SyncData[]): SyncData[] {
    const merged = [...resolvedData];
    
    // Add non-conflicting remote data
    for (const remoteItem of remoteData) {
      if (!merged.find(item => item.id === remoteItem.id)) {
        merged.push(remoteItem);
      }
    }
    
    // Add non-conflicting local data
    for (const localItem of localData) {
      if (!merged.find(item => item.id === localItem.id)) {
        merged.push(localItem);
      }
    }
    
    return merged;
  }

  private async saveLocalSyncData(userId: string, data: SyncData[]): Promise<void> {
    try {
      for (const item of data) {
        await AsyncStorage.setItem(item.id, JSON.stringify(item.data));
      }
    } catch (error) {
      console.error('Error saving local sync data:', error);
    }
  }

  private async uploadSyncData(userId: string, data: SyncData[]): Promise<void> {
    // Simulate API call to upload data
    // In a real app, this would be an actual API call
    try {
      console.log(`Uploading ${data.length} items for user ${userId}`);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error uploading sync data:', error);
    }
  }

  private getDataType(key: string): SyncData['type'] {
    if (key.includes('user_preferences')) return 'user_preferences';
    if (key.includes('cart_items')) return 'cart_items';
    if (key.includes('wishlist_items')) return 'wishlist_items';
    if (key.includes('swipe_history')) return 'swipe_history';
    return 'user_preferences';
  }

  // Offline mode support
  async queueForSync(data: SyncData): Promise<void> {
    this.syncQueue.push(data);
    await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
  }

  async processSyncQueue(userId: string): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    
    try {
      // Process queued items
      for (const item of this.syncQueue) {
        await this.uploadSyncData(userId, [item]);
      }
      
      // Clear queue
      this.syncQueue = [];
      await AsyncStorage.removeItem('sync_queue');
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }

  // Configuration methods
  setConflictResolutionStrategy(strategy: 'latest_wins' | 'manual' | 'merge') {
    this.conflictResolutionStrategy = strategy;
  }

  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  isDeviceOnline(): boolean {
    return this.isOnline;
  }
}

export const dataSyncService = DataSyncService.getInstance();