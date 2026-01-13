/**
 * Image Cache Manager
 * Handles image caching, preloading, and memory management with proper lifecycle
 */

import { Image } from 'react-native';
import { ResourceLifecycleManager, MemoryMonitor } from './MemoryManagementSystem';

interface CachedImage {
  uri: string;
  timestamp: number;
  size: number;
  refCount: number; // Track how many components are using this image
}

const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENT_LOADS = 3;
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Every hour

export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache: Map<string, CachedImage> = new Map();
  private currentSize: number = 0;
  private loadingQueue: string[] = [];
  private activeLoads: number = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private resourceManager: ResourceLifecycleManager;
  private memoryMonitor: MemoryMonitor;

  private constructor() {
    this.resourceManager = new ResourceLifecycleManager();
    this.memoryMonitor = new MemoryMonitor(150, (usage) => {
      console.warn(`Memory usage exceeded threshold: ${usage}MB`);
      this.aggressiveCleanup();
    });
    this.startCleanupInterval();
  }

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  /**
   * Preload an image with reference counting
   */
  preloadImage(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.cache.has(uri)) {
        // Increment reference count
        const cached = this.cache.get(uri)!;
        cached.refCount++;
        resolve();
        return;
      }

      this.loadingQueue.push(uri);
      this.processQueue();

      Image.prefetch(uri)
        .then(() => {
          this.cache.set(uri, {
            uri,
            timestamp: Date.now(),
            size: 0, // Approximate size
            refCount: 1,
          });
          this.activeLoads--;
          this.processQueue();
          resolve();
        })
        .catch((error) => {
          console.error(`Failed to preload image: ${uri}`, error);
          this.activeLoads--;
          this.processQueue();
          reject(error);
        });
    });
  }

  /**
   * Preload multiple images
   */
  async preloadImages(uris: string[]): Promise<void> {
    const promises = uris.map(uri => this.preloadImage(uri).catch(() => {}));
    await Promise.all(promises);
  }

  /**
   * Release image reference
   */
  releaseImage(uri: string): void {
    const cached = this.cache.get(uri);
    if (cached && cached.refCount > 0) {
      cached.refCount--;
      
      // Remove if no longer referenced
      if (cached.refCount === 0) {
        this.cache.delete(uri);
        this.currentSize -= cached.size;
      }
    }
  }

  /**
   * Release multiple image references
   */
  releaseImages(uris: string[]): void {
    uris.forEach(uri => this.releaseImage(uri));
  }

  /**
   * Process loading queue
   */
  private processQueue(): void {
    while (this.activeLoads < MAX_CONCURRENT_LOADS && this.loadingQueue.length > 0) {
      const uri = this.loadingQueue.shift();
      if (uri && !this.cache.has(uri)) {
        this.activeLoads++;
        this.preloadImage(uri).catch(() => {});
      }
    }
  }

  /**
   * Check if image is cached
   */
  isCached(uri: string): boolean {
    return this.cache.has(uri);
  }

  /**
   * Clear cache completely
   */
  clearCache(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.loadingQueue = [];
    this.activeLoads = 0;
  }

  /**
   * Clear old cache entries
   */
  private clearOldEntries(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_EXPIRY && value.refCount === 0) {
        entriesToDelete.push(key);
        this.currentSize -= value.size;
      }
    });

    entriesToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Cleanup cache if it exceeds max size
   */
  private cleanupCache(): void {
    if (this.currentSize > MAX_CACHE_SIZE) {
      // Sort by timestamp and remove oldest entries (only unreferenced)
      const entries = Array.from(this.cache.entries())
        .filter(([, value]) => value.refCount === 0)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      let removed = 0;
      for (const [key, value] of entries) {
        if (this.currentSize <= MAX_CACHE_SIZE * 0.8) break;
        this.cache.delete(key);
        this.currentSize -= value.size;
        removed++;
      }

      if (removed > 0) {
        console.log(`Cleaned up ${removed} cached images`);
      }
    }
  }

  /**
   * Aggressive cleanup when memory is critical
   */
  private aggressiveCleanup(): void {
    // Remove all unreferenced images
    const entriesToDelete: string[] = [];
    this.cache.forEach((value, key) => {
      if (value.refCount === 0) {
        entriesToDelete.push(key);
        this.currentSize -= value.size;
      }
    });

    entriesToDelete.forEach(key => this.cache.delete(key));
    console.log(`Aggressive cleanup: removed ${entriesToDelete.length} images`);
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    this.cleanupTimer = setInterval(() => {
      this.clearOldEntries();
      this.cleanupCache();
    }, CLEANUP_INTERVAL);

    // Register cleanup for proper lifecycle management
    this.resourceManager.registerResource('image-cache-cleanup', () => {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    count: number;
    maxSize: number;
    referenced: number;
    unreferenced: number;
  } {
    let referenced = 0;
    let unreferenced = 0;

    this.cache.forEach((value) => {
      if (value.refCount > 0) {
        referenced++;
      } else {
        unreferenced++;
      }
    });

    return {
      size: this.currentSize,
      count: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      referenced,
      unreferenced,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearCache();
    this.resourceManager.cleanup();
  }
}

