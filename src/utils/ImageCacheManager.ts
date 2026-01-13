/**
 * Image Cache Manager
 * Handles image caching, preloading, and memory management
 */

import { Image } from 'react-native';

interface CachedImage {
  uri: string;
  timestamp: number;
  size: number;
}

const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CONCURRENT_LOADS = 3;

export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cache: Map<string, CachedImage> = new Map();
  private currentSize: number = 0;
  private loadingQueue: string[] = [];
  private activeLoads: number = 0;

  private constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  /**
   * Preload an image
   */
  preloadImage(uri: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.cache.has(uri)) {
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
   * Clear cache
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
      if (now - value.timestamp > CACHE_EXPIRY) {
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
      // Sort by timestamp and remove oldest entries
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      let removed = 0;
      for (const [key, value] of entries) {
        if (this.currentSize <= MAX_CACHE_SIZE * 0.8) break;
        this.cache.delete(key);
        this.currentSize -= value.size;
        removed++;
      }

      console.log(`Cleaned up ${removed} cached images`);
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.clearOldEntries();
      this.cleanupCache();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    count: number;
    maxSize: number;
  } {
    return {
      size: this.currentSize,
      count: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
    };
  }
}
