/**
 * Memory Management Hook
 * Provides automatic cleanup of event listeners, subscriptions, and timers
 */

import { useEffect, useRef } from 'react';
import {
  EventListenerManager,
  SubscriptionManager,
  TimerManager,
  CleanupHook,
} from '../utils/MemoryManagementSystem';

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListeners(componentName: string) {
  const managerRef = useRef<EventListenerManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new EventListenerManager(componentName);
  }

  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, []);

  return managerRef.current;
}

/**
 * Hook for managing subscriptions with automatic cleanup
 */
export function useSubscriptions() {
  const managerRef = useRef<SubscriptionManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new SubscriptionManager();
  }

  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, []);

  return managerRef.current;
}

/**
 * Hook for managing timers with automatic cleanup
 */
export function useTimers() {
  const managerRef = useRef<TimerManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new TimerManager();
  }

  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.cleanup();
      }
    };
  }, []);

  return managerRef.current;
}

/**
 * Hook for managing cleanup functions
 */
export function useCleanup() {
  const hookRef = useRef<CleanupHook | null>(null);

  if (!hookRef.current) {
    hookRef.current = new CleanupHook();
  }

  useEffect(() => {
    return () => {
      if (hookRef.current) {
        hookRef.current.cleanup();
      }
    };
  }, []);

  return hookRef.current;
}

/**
 * Combined hook for all memory management
 */
export function useMemoryManagement(componentName: string) {
  const eventListeners = useEventListeners(componentName);
  const subscriptions = useSubscriptions();
  const timers = useTimers();
  const cleanup = useCleanup();

  return {
    eventListeners,
    subscriptions,
    timers,
    cleanup,
  };
}

/**
 * Hook for managing image lifecycle
 */
export function useImageLifecycle(imageUris: string[]) {
  const cleanupHookRef = useRef<any>(null);
  const imageCacheManagerRef = useRef<any>(null);

  useEffect(() => {
    // Lazy load ImageCacheManager to avoid circular dependencies
    if (!imageCacheManagerRef.current) {
      const { ImageCacheManager } = require('../utils/ImageCacheManager');
      imageCacheManagerRef.current = ImageCacheManager.getInstance();
    }

    if (!cleanupHookRef.current) {
      const { CleanupHook } = require('../utils/MemoryManagementSystem');
      cleanupHookRef.current = new CleanupHook();
    }

    const manager = imageCacheManagerRef.current;
    const cleanupHook = cleanupHookRef.current;

    // Preload images
    manager.preloadImages(imageUris).catch((error: any) => {
      console.warn('Failed to preload images:', error);
    });

    // Register cleanup
    cleanupHook.onCleanup(() => {
      manager.releaseImages(imageUris);
    });

    return () => {
      manager.releaseImages(imageUris);
      cleanupHook.cleanup();
    };
  }, [imageUris]);
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitoring(
  thresholdMB: number = 150,
  onThresholdExceeded?: (usage: number) => void
) {
  const { MemoryMonitor } = require('../utils/MemoryManagementSystem');
  const monitorRef = useRef<any>(null);

  if (!monitorRef.current) {
    monitorRef.current = new MemoryMonitor(thresholdMB, onThresholdExceeded);
  }

  return monitorRef.current;
}
