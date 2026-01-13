/**
 * State Management Optimizer
 * Provides optimized state management patterns to prevent unnecessary re-renders
 */

/**
 * Batch state updates to reduce re-renders
 * Collects multiple state updates and applies them together
 */
export class BatchStateUpdater<T> {
  private updates: Partial<T> = {};
  private isScheduled: boolean = false;
  private callback: (updates: Partial<T>) => void;
  private batchDelay: number = 0; // Immediate by default

  constructor(callback: (updates: Partial<T>) => void, batchDelay: number = 0) {
    this.callback = callback;
    this.batchDelay = batchDelay;
  }

  /**
   * Queue a state update
   */
  queue(updates: Partial<T>): void {
    this.updates = { ...this.updates, ...updates };

    if (!this.isScheduled) {
      this.isScheduled = true;
      if (this.batchDelay > 0) {
        setTimeout(() => this.flush(), this.batchDelay);
      } else {
        this.flush();
      }
    }
  }

  /**
   * Apply all queued updates at once
   */
  private flush(): void {
    if (Object.keys(this.updates).length > 0) {
      this.callback(this.updates);
      this.updates = {};
    }
    this.isScheduled = false;
  }

  /**
   * Clear pending updates
   */
  clear(): void {
    this.updates = {};
    this.isScheduled = false;
  }
}

/**
 * Memoization helper for arrays and objects
 * Prevents re-renders when data hasn't actually changed
 */
export class MemoizationHelper {
  private static cache: Map<string, any> = new Map();
  private static maxCacheSize: number = 100;

  /**
   * Memoize array - returns same reference if content hasn't changed
   */
  static memoizeArray<T>(key: string, array: T[]): T[] {
    const cached = this.cache.get(key);

    // Check if arrays are identical
    if (cached && Array.isArray(cached) && cached.length === array.length) {
      let isIdentical = true;
      for (let i = 0; i < array.length; i++) {
        if (cached[i] !== array[i]) {
          isIdentical = false;
          break;
        }
      }
      if (isIdentical) {
        return cached;
      }
    }

    // Store new array
    this.cache.set(key, array);
    this.maintainCacheSize();
    return array;
  }

  /**
   * Memoize object - returns same reference if content hasn't changed
   */
  static memoizeObject<T extends Record<string, any>>(key: string, obj: T): T {
    const cached = this.cache.get(key);

    // Check if objects are identical
    if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
      const cachedKeys = Object.keys(cached);
      const objKeys = Object.keys(obj);

      if (cachedKeys.length === objKeys.length) {
        let isIdentical = true;
        for (const k of objKeys) {
          if (cached[k] !== obj[k]) {
            isIdentical = false;
            break;
          }
        }
        if (isIdentical) {
          return cached;
        }
      }
    }

    // Store new object
    this.cache.set(key, obj);
    this.maintainCacheSize();
    return obj;
  }

  /**
   * Memoize value - returns same reference if value hasn't changed
   */
  static memoizeValue<T>(key: string, value: T): T {
    const cached = this.cache.get(key);
    if (cached === value) {
      return cached;
    }
    this.cache.set(key, value);
    this.maintainCacheSize();
    return value;
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Maintain cache size
   */
  private static maintainCacheSize(): void {
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}

/**
 * Selector pattern for derived state
 * Prevents re-renders when derived values haven't changed
 */
export class StateSelector<T, R> {
  private lastInput: T | undefined;
  private lastOutput: R | undefined;
  private selector: (state: T) => R;

  constructor(selector: (state: T) => R) {
    this.selector = selector;
  }

  /**
   * Get derived state - returns cached value if input hasn't changed
   */
  select(state: T): R {
    if (this.lastInput !== state) {
      this.lastInput = state;
      this.lastOutput = this.selector(state);
    }
    return this.lastOutput!;
  }

  /**
   * Reset cache
   */
  reset(): void {
    this.lastInput = undefined;
    this.lastOutput = undefined;
  }
}

/**
 * Debounced state updater
 * Prevents rapid state updates from causing excessive re-renders
 */
export class DebouncedStateUpdater<T> {
  private timeout: NodeJS.Timeout | null = null;
  private callback: (value: T) => void;
  private delay: number;

  constructor(callback: (value: T) => void, delay: number = 300) {
    this.callback = callback;
    this.delay = delay;
  }

  /**
   * Queue a debounced update
   */
  update(value: T): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.callback(value);
      this.timeout = null;
    }, this.delay);
  }

  /**
   * Cancel pending update
   */
  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  /**
   * Force immediate update
   */
  flush(value: T): void {
    this.cancel();
    this.callback(value);
  }
}

/**
 * Throttled state updater
 * Limits state updates to a maximum frequency
 */
export class ThrottledStateUpdater<T> {
  private lastUpdateTime: number = 0;
  private callback: (value: T) => void;
  private interval: number;
  private pendingValue: T | null = null;
  private timeout: NodeJS.Timeout | null = null;

  constructor(callback: (value: T) => void, interval: number = 100) {
    this.callback = callback;
    this.interval = interval;
  }

  /**
   * Queue a throttled update
   */
  update(value: T): void {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    if (timeSinceLastUpdate >= this.interval) {
      // Enough time has passed, update immediately
      this.lastUpdateTime = now;
      this.callback(value);
      this.pendingValue = null;

      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
    } else {
      // Not enough time, queue for later
      this.pendingValue = value;

      if (!this.timeout) {
        const delay = this.interval - timeSinceLastUpdate;
        this.timeout = setTimeout(() => {
          if (this.pendingValue !== null) {
            this.lastUpdateTime = Date.now();
            this.callback(this.pendingValue);
            this.pendingValue = null;
          }
          this.timeout = null;
        }, delay);
      }
    }
  }

  /**
   * Cancel pending update
   */
  cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.pendingValue = null;
  }

  /**
   * Force immediate update
   */
  flush(value: T): void {
    this.cancel();
    this.lastUpdateTime = Date.now();
    this.callback(value);
  }
}

/**
 * Conditional state updater
 * Only updates state if condition is met
 */
export class ConditionalStateUpdater<T> {
  private callback: (value: T) => void;
  private condition: (value: T) => boolean;

  constructor(callback: (value: T) => void, condition: (value: T) => boolean) {
    this.callback = callback;
    this.condition = condition;
  }

  /**
   * Update state if condition is met
   */
  update(value: T): void {
    if (this.condition(value)) {
      this.callback(value);
    }
  }
}

/**
 * State change detector
 * Detects which parts of state have changed
 */
export class StateChangeDetector<T extends Record<string, any>> {
  private lastState: T | null = null;
  private changedKeys: Set<string> = new Set();

  /**
   * Detect changes in state
   */
  detectChanges(newState: T): Set<string> {
    this.changedKeys.clear();

    if (!this.lastState) {
      // First time, all keys are "changed"
      this.changedKeys = new Set(Object.keys(newState));
    } else {
      // Compare each key
      const allKeys = new Set([
        ...Object.keys(this.lastState),
        ...Object.keys(newState),
      ]);

      for (const key of allKeys) {
        if (this.lastState[key] !== newState[key]) {
          this.changedKeys.add(key);
        }
      }
    }

    this.lastState = newState;
    return this.changedKeys;
  }

  /**
   * Check if specific key changed
   */
  hasChanged(key: string): boolean {
    return this.changedKeys.has(key);
  }

  /**
   * Get all changed keys
   */
  getChangedKeys(): string[] {
    return Array.from(this.changedKeys);
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.lastState = null;
    this.changedKeys.clear();
  }
}

/**
 * Render optimization tracker
 * Tracks and logs render performance
 */
export class RenderOptimizationTracker {
  private renderCount: number = 0;
  private lastRenderTime: number = 0;
  private renderTimes: number[] = [];
  private maxSamples: number = 100;

  /**
   * Record a render
   */
  recordRender(): void {
    this.renderCount++;
    const now = Date.now();
    const renderTime = now - this.lastRenderTime;
    this.lastRenderTime = now;

    this.renderTimes.push(renderTime);
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }
  }

  /**
   * Get render statistics
   */
  getStats(): {
    renderCount: number;
    averageRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
  } {
    if (this.renderTimes.length === 0) {
      return {
        renderCount: this.renderCount,
        averageRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
      };
    }

    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    const avg = sum / this.renderTimes.length;
    const max = Math.max(...this.renderTimes);
    const min = Math.min(...this.renderTimes);

    return {
      renderCount: this.renderCount,
      averageRenderTime: avg,
      maxRenderTime: max,
      minRenderTime: min,
    };
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.renderCount = 0;
    this.lastRenderTime = 0;
    this.renderTimes = [];
  }
}
