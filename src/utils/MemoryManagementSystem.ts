/**
 * Memory Management System
 * Handles cleanup of event listeners, memory management for large lists,
 * and proper image lifecycle management
 */

/**
 * Event listener manager - tracks and cleans up all event listeners
 */
export class EventListenerManager {
  private listeners: Map<string, { target: any; event: string; handler: any }[]> = new Map();
  private componentId: string;

  constructor(componentId: string) {
    this.componentId = componentId;
  }

  /**
   * Add event listener with automatic tracking
   */
  addEventListener(
    target: any,
    event: string,
    handler: (...args: any[]) => void,
    options?: any
  ): void {
    if (!target || !event || !handler) {
      console.warn('Invalid event listener parameters');
      return;
    }

    const key = `${this.componentId}-${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    // Add listener
    if (target.addEventListener) {
      target.addEventListener(event, handler, options);
    } else if (target.on) {
      target.on(event, handler);
    }

    // Track listener
    this.listeners.get(key)!.push({ target, event, handler });
  }

  /**
   * Remove specific event listener
   */
  removeEventListener(target: any, event: string, handler: any): void {
    if (target.removeEventListener) {
      target.removeEventListener(event, handler);
    } else if (target.off) {
      target.off(event, handler);
    }

    // Remove from tracking
    const key = `${this.componentId}-${event}`;
    const listeners = this.listeners.get(key);
    if (listeners) {
      const index = listeners.findIndex(
        (l) => l.target === target && l.handler === handler
      );
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Clean up all event listeners
   */
  cleanup(): void {
    for (const [, listeners] of this.listeners) {
      for (const { target, event, handler } of listeners) {
        if (target.removeEventListener) {
          target.removeEventListener(event, handler);
        } else if (target.off) {
          target.off(event, handler);
        }
      }
    }
    this.listeners.clear();
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(): number {
    let count = 0;
    for (const listeners of this.listeners.values()) {
      count += listeners.length;
    }
    return count;
  }
}

/**
 * Subscription manager - tracks and cleans up subscriptions
 */
export class SubscriptionManager {
  private subscriptions: Set<{ unsubscribe: () => void }> = new Set();

  /**
   * Add subscription with automatic tracking
   */
  addSubscription(subscription: { unsubscribe: () => void }): void {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      this.subscriptions.add(subscription);
    }
  }

  /**
   * Remove subscription
   */
  removeSubscription(subscription: { unsubscribe: () => void }): void {
    this.subscriptions.delete(subscription);
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    for (const subscription of this.subscriptions) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
    this.subscriptions.clear();
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

/**
 * Timer manager - tracks and cleans up timers
 */
export class TimerManager {
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();

  /**
   * Create managed timeout
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(timer);
    }, delay);
    this.timers.add(timer);
    return timer;
  }

  /**
   * Create managed interval
   */
  setInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(callback, delay);
    this.intervals.add(interval);
    return interval;
  }

  /**
   * Clear specific timeout
   */
  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  /**
   * Clear specific interval
   */
  clearInterval(interval: NodeJS.Timeout): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  /**
   * Clean up all timers and intervals
   */
  cleanup(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * Get timer count for debugging
   */
  getTimerCount(): number {
    return this.timers.size + this.intervals.size;
  }
}

/**
 * Memory pool for large lists - reuses objects to reduce GC pressure
 */
export class MemoryPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (item: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (item: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-allocate initial items
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /**
   * Acquire item from pool
   */
  acquire(): T {
    let item: T;
    if (this.available.length > 0) {
      item = this.available.pop()!;
    } else {
      item = this.factory();
    }
    this.inUse.add(item);
    return item;
  }

  /**
   * Release item back to pool
   */
  release(item: T): void {
    if (this.inUse.has(item)) {
      this.inUse.delete(item);
      this.reset(item);

      // Only keep items up to maxSize
      if (this.available.length < this.maxSize) {
        this.available.push(item);
      }
    }
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }
}

/**
 * Weak reference manager - automatically cleans up when objects are garbage collected
 */
export class WeakReferenceManager<T extends object> {
  private registry: FinalizationRegistry<string>;
  private references: Map<string, WeakRef<T>> = new Map();
  private onCleanup: (id: string) => void;

  constructor(onCleanup: (id: string) => void) {
    this.onCleanup = onCleanup;
    this.registry = new FinalizationRegistry((id: string) => {
      this.references.delete(id);
      onCleanup(id);
    });
  }

  /**
   * Add weak reference
   */
  add(id: string, object: T): void {
    const weakRef = new WeakRef(object);
    this.references.set(id, weakRef);
    this.registry.register(object, id);
  }

  /**
   * Get weak reference
   */
  get(id: string): T | undefined {
    const weakRef = this.references.get(id);
    return weakRef?.deref();
  }

  /**
   * Remove weak reference
   */
  remove(id: string): void {
    this.references.delete(id);
  }

  /**
   * Get all valid references
   */
  getAll(): Map<string, T> {
    const result = new Map<string, T>();
    for (const [id, weakRef] of this.references) {
      const obj = weakRef.deref();
      if (obj) {
        result.set(id, obj);
      }
    }
    return result;
  }

  /**
   * Clear all references
   */
  clear(): void {
    this.references.clear();
  }
}

/**
 * Resource lifecycle manager - manages creation and cleanup of resources
 */
export class ResourceLifecycleManager {
  private resources: Map<string, { cleanup: () => void }> = new Map();

  /**
   * Register resource with cleanup function
   */
  registerResource(id: string, cleanup: () => void): void {
    this.resources.set(id, { cleanup });
  }

  /**
   * Unregister resource
   */
  unregisterResource(id: string): void {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        resource.cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id}:`, error);
      }
      this.resources.delete(id);
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    for (const [id, resource] of this.resources) {
      try {
        resource.cleanup();
      } catch (error) {
        console.error(`Error cleaning up resource ${id}:`, error);
      }
    }
    this.resources.clear();
  }

  /**
   * Get resource count
   */
  getResourceCount(): number {
    return this.resources.size;
  }
}

/**
 * Memory monitor - tracks memory usage and alerts on issues
 */
export class MemoryMonitor {
  private samples: number[] = [];
  private maxSamples: number = 100;
  private threshold: number; // MB
  private onThresholdExceeded: (usage: number) => void;

  constructor(thresholdMB: number = 150, onThresholdExceeded?: (usage: number) => void) {
    this.threshold = thresholdMB;
    this.onThresholdExceeded = onThresholdExceeded || (() => {});
  }

  /**
   * Record memory sample
   */
  recordSample(memoryUsageMB: number): void {
    this.samples.push(memoryUsageMB);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Check threshold
    if (memoryUsageMB > this.threshold) {
      this.onThresholdExceeded(memoryUsageMB);
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    current: number;
    average: number;
    max: number;
    min: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.samples.length === 0) {
      return { current: 0, average: 0, max: 0, min: 0, trend: 'stable' };
    }

    const current = this.samples[this.samples.length - 1];
    const average = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const max = Math.max(...this.samples);
    const min = Math.min(...this.samples);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.samples.length >= 10) {
      const recent = this.samples.slice(-10);
      const older = this.samples.slice(-20, -10);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

      if (recentAvg > olderAvg * 1.1) {
        trend = 'increasing';
      } else if (recentAvg < olderAvg * 0.9) {
        trend = 'decreasing';
      }
    }

    return { current, average, max, min, trend };
  }

  /**
   * Reset monitor
   */
  reset(): void {
    this.samples = [];
  }
}

/**
 * Cleanup hook - manages cleanup on component unmount
 */
export class CleanupHook {
  private cleanupFunctions: (() => void)[] = [];

  /**
   * Register cleanup function
   */
  onCleanup(fn: () => void): void {
    this.cleanupFunctions.push(fn);
  }

  /**
   * Execute all cleanup functions
   */
  cleanup(): void {
    for (const fn of this.cleanupFunctions) {
      try {
        fn();
      } catch (error) {
        console.error('Error in cleanup function:', error);
      }
    }
    this.cleanupFunctions = [];
  }

  /**
   * Get cleanup function count
   */
  getCleanupCount(): number {
    return this.cleanupFunctions.length;
  }
}
