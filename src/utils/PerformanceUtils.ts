/**
 * Performance utilities for memory management and optimization
 * Requirements: 3.1, 6.5
 */

import { InteractionManager, Dimensions } from 'react-native';
import { ErrorFactory } from './ErrorFactory';
import { ErrorType, ErrorSeverity } from '../types/errors';

interface PerformanceMetrics {
  memoryUsage?: number;
  renderTime?: number;
  interactionTime?: number;
  bundleSize?: number;
  jsHeapSize?: number;
}

interface PerformanceThresholds {
  maxMemoryUsage: number; // MB
  maxRenderTime: number; // ms
  maxInteractionTime: number; // ms
  maxJSHeapSize: number; // MB
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private metrics: PerformanceMetrics = {};
  private thresholds: PerformanceThresholds;
  private performanceObserver: PerformanceObserver | null = null;

  private constructor() {
    this.thresholds = {
      maxMemoryUsage: 200, // 200MB
      maxRenderTime: 16, // 16ms for 60fps
      maxInteractionTime: 100, // 100ms
      maxJSHeapSize: 150, // 150MB
    };

    this.initializePerformanceObserver();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance observer for web environments
   */
  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.handlePerformanceEntry(entry);
          });
        });

        this.performanceObserver.observe({ 
          entryTypes: ['measure', 'navigation', 'paint'] 
        });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }

  /**
   * Handle performance entries
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'measure':
        this.metrics.renderTime = entry.duration;
        if (entry.duration > this.thresholds.maxRenderTime) {
          this.reportPerformanceIssue('Slow render detected', {
            renderTime: entry.duration,
            threshold: this.thresholds.maxRenderTime,
          });
        }
        break;
      
      case 'navigation':
        this.metrics.interactionTime = entry.duration;
        if (entry.duration > this.thresholds.maxInteractionTime) {
          this.reportPerformanceIssue('Slow navigation detected', {
            navigationTime: entry.duration,
            threshold: this.thresholds.maxInteractionTime,
          });
        }
        break;
    }
  }

  /**
   * Measure render performance
   */
  measureRender<T>(name: string, renderFn: () => T): T {
    const startTime = Date.now();
    
    try {
      const result = renderFn();
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      this.metrics.renderTime = renderTime;
      
      if (renderTime > this.thresholds.maxRenderTime) {
        this.reportPerformanceIssue(`Slow render: ${name}`, {
          renderTime,
          threshold: this.thresholds.maxRenderTime,
          component: name,
        });
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const renderTime = endTime - startTime;
      
      throw ErrorFactory.createAppError(
        ErrorType.PERFORMANCE_ERROR,
        `Render error in ${name}`,
        {
          severity: ErrorSeverity.HIGH,
          context: { renderTime, component: name },
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }
  }

  /**
   * Measure async operation performance
   */
  async measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await asyncFn();
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (executionTime > this.thresholds.maxInteractionTime) {
        this.reportPerformanceIssue(`Slow async operation: ${name}`, {
          executionTime,
          threshold: this.thresholds.maxInteractionTime,
          operation: name,
        });
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      throw ErrorFactory.createAppError(
        ErrorType.PERFORMANCE_ERROR,
        `Async operation error in ${name}`,
        {
          severity: ErrorSeverity.HIGH,
          context: { executionTime, operation: name },
          originalError: error instanceof Error ? error : undefined,
        }
      );
    }
  }

  /**
   * Monitor memory usage (approximation for React Native)
   */
  checkMemoryUsage(): void {
    // React Native doesn't have direct memory API access
    // This is a placeholder for memory monitoring
    if (typeof performance !== 'undefined' && performance.memory) {
      const memoryInfo = performance.memory;
      const usedJSHeapSize = memoryInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
      
      this.metrics.jsHeapSize = usedJSHeapSize;
      
      if (usedJSHeapSize > this.thresholds.maxJSHeapSize) {
        this.reportPerformanceIssue('High memory usage detected', {
          jsHeapSize: usedJSHeapSize,
          threshold: this.thresholds.maxJSHeapSize,
        });
      }
    }
  }

  /**
   * Report performance issues
   */
  private reportPerformanceIssue(message: string, context: Record<string, any>): void {
    const error = ErrorFactory.createAppError(
      ErrorType.PERFORMANCE_ERROR,
      message,
      {
        severity: ErrorSeverity.MEDIUM,
        context,
        retryable: false,
      }
    );

    console.warn('Performance issue:', message, context);
    
    // In production, this would be sent to analytics/monitoring service
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {};
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static cleanupTasks: (() => void)[] = [];
  private static memoryWarningListeners: (() => void)[] = [];

  /**
   * Register a cleanup task to be executed on memory pressure
   */
  static registerCleanupTask(task: () => void): () => void {
    MemoryManager.cleanupTasks.push(task);
    
    // Return unregister function
    return () => {
      const index = MemoryManager.cleanupTasks.indexOf(task);
      if (index > -1) {
        MemoryManager.cleanupTasks.splice(index, 1);
      }
    };
  }

  /**
   * Execute all cleanup tasks
   */
  static executeCleanup(): void {
    console.log('Executing memory cleanup tasks...');
    
    MemoryManager.cleanupTasks.forEach((task, index) => {
      try {
        task();
      } catch (error) {
        console.error(`Cleanup task ${index} failed:`, error);
      }
    });
  }

  /**
   * Add memory warning listener
   */
  static addMemoryWarningListener(listener: () => void): () => void {
    MemoryManager.memoryWarningListeners.push(listener);
    
    return () => {
      const index = MemoryManager.memoryWarningListeners.indexOf(listener);
      if (index > -1) {
        MemoryManager.memoryWarningListeners.splice(index, 1);
      }
    };
  }

  /**
   * Trigger memory warning (for testing or manual cleanup)
   */
  static triggerMemoryWarning(): void {
    console.warn('Memory warning triggered');
    
    MemoryManager.memoryWarningListeners.forEach((listener, index) => {
      try {
        listener();
      } catch (error) {
        console.error(`Memory warning listener ${index} failed:`, error);
      }
    });
    
    // Execute cleanup tasks
    MemoryManager.executeCleanup();
  }
}

/**
 * Gesture performance utilities
 */
export class GesturePerformanceManager {
  private static gestureStartTime: number = 0;
  private static gestureCount: number = 0;

  /**
   * Start gesture performance tracking
   */
  static startGestureTracking(): void {
    GesturePerformanceManager.gestureStartTime = Date.now();
    GesturePerformanceManager.gestureCount += 1;
  }

  /**
   * End gesture performance tracking
   */
  static endGestureTracking(gestureName: string): void {
    const gestureTime = Date.now() - GesturePerformanceManager.gestureStartTime;
    
    console.debug('Gesture performance:', {
      gesture: gestureName,
      duration: gestureTime,
      count: GesturePerformanceManager.gestureCount,
    });

    // Report slow gestures
    if (gestureTime > 100) { // More than 100ms
      const error = ErrorFactory.createAppError(
        ErrorType.GESTURE_ERROR,
        `Slow gesture response: ${gestureName}`,
        {
          severity: ErrorSeverity.LOW,
          context: {
            gestureName,
            duration: gestureTime,
            count: GesturePerformanceManager.gestureCount,
          },
          retryable: false,
        }
      );

      console.warn('Slow gesture detected:', error);
    }
  }

  /**
   * Get gesture performance metrics
   */
  static getGestureMetrics(): { count: number; lastDuration: number } {
    return {
      count: GesturePerformanceManager.gestureCount,
      lastDuration: Date.now() - GesturePerformanceManager.gestureStartTime,
    };
  }

  /**
   * Reset gesture metrics
   */
  static resetGestureMetrics(): void {
    GesturePerformanceManager.gestureStartTime = 0;
    GesturePerformanceManager.gestureCount = 0;
  }
}

/**
 * Utility functions for performance optimization
 */
export const PerformanceUtils = {
  /**
   * Debounce function calls for performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Throttle function calls for performance
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  /**
   * Run task after interactions complete
   */
  runAfterInteractions<T>(task: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      InteractionManager.runAfterInteractions(() => {
        try {
          const result = task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  /**
   * Get device performance tier (approximation)
   */
  getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
    const { width, height } = Dimensions.get('window');
    const screenSize = width * height;
    
    // Simple heuristic based on screen size
    if (screenSize < 800 * 600) return 'low';
    if (screenSize < 1200 * 800) return 'medium';
    return 'high';
  },

  /**
   * Calculate optimal batch size based on device performance
   */
  getOptimalBatchSize(baseSize: number = 10): number {
    const tier = PerformanceUtils.getDevicePerformanceTier();
    
    switch (tier) {
      case 'low': return Math.max(1, Math.floor(baseSize * 0.5));
      case 'medium': return baseSize;
      case 'high': return Math.floor(baseSize * 1.5);
      default: return baseSize;
    }
  },
};