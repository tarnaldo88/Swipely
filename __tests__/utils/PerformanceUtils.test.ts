/**
 * Tests for PerformanceUtils
 * Requirements: 1.4, 3.1, 6.5
 */

import {
  PerformanceMonitor,
  MemoryManager,
  GesturePerformanceManager,
  PerformanceUtils,
} from '../../src/utils/PerformanceUtils';

// Mock console methods
const originalConsole = console;
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.log = originalConsole.log;
});

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset singleton instance
    (PerformanceMonitor as any).instance = null;
    performanceMonitor = PerformanceMonitor.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('measureRender', () => {
    it('should measure render performance', () => {
      const renderFn = jest.fn(() => 'result');
      
      const result = performanceMonitor.measureRender('TestComponent', renderFn);
      
      expect(result).toBe('result');
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it('should report slow renders', () => {
      const slowRenderFn = jest.fn(() => {
        // Simulate slow render
        const start = Date.now();
        while (Date.now() - start < 20) {
          // Busy wait
        }
        return 'result';
      });

      performanceMonitor.measureRender('SlowComponent', slowRenderFn);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance issue:'),
        expect.stringContaining('Slow render: SlowComponent'),
        expect.any(Object)
      );
    });

    it('should handle render errors', () => {
      const errorRenderFn = jest.fn(() => {
        throw new Error('Render error');
      });

      expect(() => {
        performanceMonitor.measureRender('ErrorComponent', errorRenderFn);
      }).toThrow('Render error in ErrorComponent');
    });
  });

  describe('measureAsync', () => {
    it('should measure async operation performance', async () => {
      const asyncFn = jest.fn().mockResolvedValue('async result');
      
      const result = await performanceMonitor.measureAsync('AsyncOperation', asyncFn);
      
      expect(result).toBe('async result');
      expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    it('should report slow async operations', async () => {
      const slowAsyncFn = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return 'result';
      });

      await performanceMonitor.measureAsync('SlowAsyncOperation', slowAsyncFn);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance issue:'),
        expect.stringContaining('Slow async operation: SlowAsyncOperation'),
        expect.any(Object)
      );
    });

    it('should handle async operation errors', async () => {
      const errorAsyncFn = jest.fn().mockRejectedValue(new Error('Async error'));

      await expect(
        performanceMonitor.measureAsync('ErrorAsyncOperation', errorAsyncFn)
      ).rejects.toThrow('Async operation error in ErrorAsyncOperation');
    });
  });

  describe('checkMemoryUsage', () => {
    it('should check memory usage when performance.memory is available', () => {
      // Mock performance.memory
      const mockMemory = {
        usedJSHeapSize: 100 * 1024 * 1024, // 100MB
        totalJSHeapSize: 200 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024,
      };

      (global as any).performance = { memory: mockMemory };

      performanceMonitor.checkMemoryUsage();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.jsHeapSize).toBe(100); // Should be converted to MB
    });

    it('should report high memory usage', () => {
      // Mock high memory usage
      const mockMemory = {
        usedJSHeapSize: 200 * 1024 * 1024, // 200MB (above threshold)
        totalJSHeapSize: 300 * 1024 * 1024,
        jsHeapSizeLimit: 500 * 1024 * 1024,
      };

      (global as any).performance = { memory: mockMemory };

      performanceMonitor.checkMemoryUsage();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance issue:'),
        expect.stringContaining('High memory usage detected'),
        expect.any(Object)
      );
    });

    it('should handle missing performance.memory gracefully', () => {
      delete (global as any).performance;

      expect(() => {
        performanceMonitor.checkMemoryUsage();
      }).not.toThrow();
    });
  });

  describe('getMetrics and resetMetrics', () => {
    it('should return current metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toEqual({});
    });

    it('should reset metrics', () => {
      // Set some metrics first
      performanceMonitor.measureRender('TestComponent', () => 'result');
      
      let metrics = performanceMonitor.getMetrics();
      expect(metrics.renderTime).toBeDefined();

      performanceMonitor.resetMetrics();
      
      metrics = performanceMonitor.getMetrics();
      expect(metrics).toEqual({});
    });
  });

  describe('updateThresholds', () => {
    it('should update performance thresholds', () => {
      performanceMonitor.updateThresholds({
        maxRenderTime: 50,
        maxMemoryUsage: 300,
      });

      // Test that new thresholds are applied
      const slowRenderFn = jest.fn(() => {
        const start = Date.now();
        while (Date.now() - start < 60) {
          // Busy wait longer than new threshold
        }
        return 'result';
      });

      performanceMonitor.measureRender('TestComponent', slowRenderFn);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance issue:'),
        expect.any(String),
        expect.objectContaining({
          threshold: 50,
        })
      );
    });
  });
});

describe('MemoryManager', () => {
  beforeEach(() => {
    // Clear cleanup tasks and listeners
    (MemoryManager as any).cleanupTasks = [];
    (MemoryManager as any).memoryWarningListeners = [];
  });

  describe('registerCleanupTask', () => {
    it('should register and execute cleanup tasks', () => {
      const cleanupTask1 = jest.fn();
      const cleanupTask2 = jest.fn();

      const unregister1 = MemoryManager.registerCleanupTask(cleanupTask1);
      const unregister2 = MemoryManager.registerCleanupTask(cleanupTask2);

      MemoryManager.executeCleanup();

      expect(cleanupTask1).toHaveBeenCalledTimes(1);
      expect(cleanupTask2).toHaveBeenCalledTimes(1);

      // Test unregister
      unregister1();
      cleanupTask1.mockClear();
      cleanupTask2.mockClear();

      MemoryManager.executeCleanup();

      expect(cleanupTask1).not.toHaveBeenCalled();
      expect(cleanupTask2).toHaveBeenCalledTimes(1);

      unregister2();
    });

    it('should handle cleanup task errors gracefully', () => {
      const faultyTask = jest.fn(() => {
        throw new Error('Cleanup error');
      });
      const goodTask = jest.fn();

      MemoryManager.registerCleanupTask(faultyTask);
      MemoryManager.registerCleanupTask(goodTask);

      expect(() => {
        MemoryManager.executeCleanup();
      }).not.toThrow();

      expect(faultyTask).toHaveBeenCalledTimes(1);
      expect(goodTask).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup task'),
        expect.any(Error)
      );
    });
  });

  describe('addMemoryWarningListener', () => {
    it('should add and trigger memory warning listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = MemoryManager.addMemoryWarningListener(listener1);
      const unsubscribe2 = MemoryManager.addMemoryWarningListener(listener2);

      MemoryManager.triggerMemoryWarning();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      // Test unsubscribe
      unsubscribe1();
      listener1.mockClear();
      listener2.mockClear();

      MemoryManager.triggerMemoryWarning();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);

      unsubscribe2();
    });

    it('should handle listener errors gracefully', () => {
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      MemoryManager.addMemoryWarningListener(faultyListener);

      expect(() => {
        MemoryManager.triggerMemoryWarning();
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Memory warning listener'),
        expect.any(Error)
      );
    });
  });

  describe('triggerMemoryWarning', () => {
    it('should trigger memory warning and execute cleanup', () => {
      const listener = jest.fn();
      const cleanupTask = jest.fn();

      MemoryManager.addMemoryWarningListener(listener);
      MemoryManager.registerCleanupTask(cleanupTask);

      MemoryManager.triggerMemoryWarning();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(cleanupTask).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith('Memory warning triggered');
    });
  });
});

describe('GesturePerformanceManager', () => {
  beforeEach(() => {
    GesturePerformanceManager.resetGestureMetrics();
  });

  describe('gesture tracking', () => {
    it('should track gesture performance', () => {
      GesturePerformanceManager.startGestureTracking();
      
      // Simulate some delay
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }
      
      GesturePerformanceManager.endGestureTracking('swipe');

      const metrics = GesturePerformanceManager.getGestureMetrics();
      expect(metrics.count).toBe(1);
      expect(metrics.lastDuration).toBeGreaterThan(0);
    });

    it('should report slow gestures', () => {
      GesturePerformanceManager.startGestureTracking();
      
      // Simulate slow gesture
      const start = Date.now();
      while (Date.now() - start < 150) {
        // Busy wait longer than threshold
      }
      
      GesturePerformanceManager.endGestureTracking('slow_swipe');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow gesture detected:'),
        expect.any(Object)
      );
    });

    it('should reset gesture metrics', () => {
      GesturePerformanceManager.startGestureTracking();
      GesturePerformanceManager.endGestureTracking('swipe');

      let metrics = GesturePerformanceManager.getGestureMetrics();
      expect(metrics.count).toBe(1);

      GesturePerformanceManager.resetGestureMetrics();

      metrics = GesturePerformanceManager.getGestureMetrics();
      expect(metrics.count).toBe(0);
    });
  });
});

describe('PerformanceUtils', () => {
  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      const fn = jest.fn();
      const debouncedFn = PerformanceUtils.debounce(fn, 50);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Should not be called immediately
      expect(fn).not.toHaveBeenCalled();

      setTimeout(() => {
        // Should be called once with last arguments
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('arg3');
        done();
      }, 60);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      const fn = jest.fn();
      const throttledFn = PerformanceUtils.throttle(fn, 50);

      throttledFn('arg1');
      throttledFn('arg2');
      throttledFn('arg3');

      // Should be called immediately with first arguments
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');

      setTimeout(() => {
        throttledFn('arg4');
        // Should be called again after delay
        expect(fn).toHaveBeenCalledTimes(2);
        expect(fn).toHaveBeenCalledWith('arg4');
        done();
      }, 60);
    });
  });

  describe('runAfterInteractions', () => {
    it('should run task after interactions', async () => {
      const task = jest.fn(() => 'result');
      
      const result = await PerformanceUtils.runAfterInteractions(task);
      
      expect(result).toBe('result');
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should handle task errors', async () => {
      const errorTask = jest.fn(() => {
        throw new Error('Task error');
      });

      await expect(
        PerformanceUtils.runAfterInteractions(errorTask)
      ).rejects.toThrow('Task error');
    });
  });

  describe('getDevicePerformanceTier', () => {
    it('should return performance tier based on screen size', () => {
      // Mock Dimensions
      const mockDimensions = {
        get: jest.fn(() => ({ width: 1200, height: 800 })),
      };
      
      // Replace the import with mock
      jest.doMock('react-native', () => ({
        Dimensions: mockDimensions,
      }));

      const tier = PerformanceUtils.getDevicePerformanceTier();
      expect(['low', 'medium', 'high']).toContain(tier);
    });
  });

  describe('getOptimalBatchSize', () => {
    it('should return optimal batch size based on performance tier', () => {
      const baseSize = 10;
      const batchSize = PerformanceUtils.getOptimalBatchSize(baseSize);
      
      expect(batchSize).toBeGreaterThan(0);
      expect(batchSize).toBeLessThanOrEqual(baseSize * 1.5);
    });

    it('should use default base size when not provided', () => {
      const batchSize = PerformanceUtils.getOptimalBatchSize();
      expect(batchSize).toBeGreaterThan(0);
    });
  });
});