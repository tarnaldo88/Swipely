/**
 * React hook for analytics tracking
 * Requirements: 3.3, 3.4
 */

import { useCallback, useEffect, useRef } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { CrashReportingService } from '../services/CrashReportingService';
import { useErrorHandler } from './useErrorHandler';

interface UseAnalyticsOptions {
  userId?: string;
  enableAutoTracking?: boolean;
  trackScreenViews?: boolean;
  trackUserActions?: boolean;
}

interface UseAnalyticsReturn {
  trackEvent: (eventName: string, properties?: Record<string, any>) => Promise<void>;
  trackSwipe: (
    productId: string,
    action: 'like' | 'skip',
    category: string,
    price: number,
    swipeMetrics?: {
      direction: 'left' | 'right';
      velocity?: number;
      duration?: number;
    }
  ) => Promise<void>;
  trackEngagement: (
    eventType: 'session_start' | 'session_end' | 'product_view' | 'cart_add' | 'details_view',
    properties?: Record<string, any>
  ) => Promise<void>;
  trackPerformance: (
    metricType: 'render_time' | 'load_time' | 'gesture_response' | 'memory_usage',
    value: number,
    context?: Record<string, any>
  ) => Promise<void>;
  getSwipePatterns: () => ReturnType<AnalyticsService['getSwipePatterns']>;
  getEngagementMetrics: () => ReturnType<AnalyticsService['calculateEngagementMetrics']>;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    userId,
    enableAutoTracking = true,
    trackScreenViews = true,
    trackUserActions = true,
  } = options;

  const analyticsService = useRef(AnalyticsService.getInstance());
  const crashReportingService = useRef(CrashReportingService.getInstance());
  const { handleError } = useErrorHandler();
  const sessionStarted = useRef(false);

  // Set user info for crash reporting
  useEffect(() => {
    if (userId) {
      crashReportingService.current.setUserInfo({
        userId,
        locale: 'en-US', // Would get from device/app settings
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
  }, [userId]);

  // Start session tracking
  useEffect(() => {
    if (enableAutoTracking && !sessionStarted.current) {
      sessionStarted.current = true;
      trackEngagement('session_start');
      
      // Track session end on unmount
      return () => {
        trackEngagement('session_end');
      };
    }
  }, [enableAutoTracking]);

  const trackEvent = useCallback(async (
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> => {
    try {
      await analyticsService.current.trackEvent(eventName, properties, userId);
      
      // Add breadcrumb for crash reporting
      crashReportingService.current.addBreadcrumb({
        category: 'user_action',
        message: `Event: ${eventName}`,
        level: 'info',
        data: properties,
      });
    } catch (error) {
      await handleError(error, {
        eventName,
        properties,
        component: 'useAnalytics',
      });
    }
  }, [userId, handleError]);

  const trackSwipe = useCallback(async (
    productId: string,
    action: 'like' | 'skip',
    category: string,
    price: number,
    swipeMetrics?: {
      direction: 'left' | 'right';
      velocity?: number;
      duration?: number;
    }
  ): Promise<void> => {
    try {
      await analyticsService.current.trackSwipe(
        productId,
        action,
        category,
        price,
        swipeMetrics,
        userId
      );

      // Track user action for crash reporting
      crashReportingService.current.trackUserAction(
        `swipe_${action}`,
        'product_card',
        {
          productId,
          category,
          price,
          ...swipeMetrics,
        }
      );
    } catch (error) {
      await handleError(error, {
        productId,
        action,
        category,
        component: 'useAnalytics',
      });
    }
  }, [userId, handleError]);

  const trackEngagement = useCallback(async (
    eventType: 'session_start' | 'session_end' | 'product_view' | 'cart_add' | 'details_view',
    properties?: Record<string, any>
  ): Promise<void> => {
    try {
      await analyticsService.current.trackEngagement(eventType, properties, userId);
      
      // Add breadcrumb for crash reporting
      crashReportingService.current.addBreadcrumb({
        category: 'user_action',
        message: `Engagement: ${eventType}`,
        level: 'info',
        data: properties,
      });
    } catch (error) {
      await handleError(error, {
        eventType,
        properties,
        component: 'useAnalytics',
      });
    }
  }, [userId, handleError]);

  const trackPerformance = useCallback(async (
    metricType: 'render_time' | 'load_time' | 'gesture_response' | 'memory_usage',
    value: number,
    context?: Record<string, any>
  ): Promise<void> => {
    try {
      await analyticsService.current.trackPerformance(metricType, value, context);
      
      // Record performance metric for crash reporting
      crashReportingService.current.recordPerformanceMetric({
        name: metricType,
        value,
        unit: getMetricUnit(metricType),
        context,
      });
    } catch (error) {
      await handleError(error, {
        metricType,
        value,
        context,
        component: 'useAnalytics',
      });
    }
  }, [handleError]);

  const getSwipePatterns = useCallback(() => {
    return analyticsService.current.getSwipePatterns(userId);
  }, [userId]);

  const getEngagementMetrics = useCallback(() => {
    return analyticsService.current.calculateEngagementMetrics();
  }, []);

  return {
    trackEvent,
    trackSwipe,
    trackEngagement,
    trackPerformance,
    getSwipePatterns,
    getEngagementMetrics,
  };
}

/**
 * Hook for tracking screen views automatically
 */
export function useScreenTracking(screenName: string, params?: Record<string, any>) {
  const { trackEvent } = useAnalytics();
  const crashReportingService = useRef(CrashReportingService.getInstance());

  useEffect(() => {
    // Track screen view
    trackEvent('screen_view', {
      screen_name: screenName,
      ...params,
    });

    // Track navigation for crash reporting
    crashReportingService.current.trackNavigation(screenName, params);
  }, [screenName, params, trackEvent]);
}

/**
 * Hook for tracking user interactions automatically
 */
export function useInteractionTracking() {
  const { trackEvent } = useAnalytics();
  const crashReportingService = useRef(CrashReportingService.getInstance());

  const trackInteraction = useCallback(async (
    interactionType: string,
    target: string,
    properties?: Record<string, any>
  ) => {
    await trackEvent('user_interaction', {
      interaction_type: interactionType,
      target,
      ...properties,
    });

    // Track for crash reporting
    crashReportingService.current.trackUserAction(interactionType, target, properties);
  }, [trackEvent]);

  return { trackInteraction };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceTracking() {
  const { trackPerformance } = useAnalytics();
  const renderStartTime = useRef<number>(0);

  const startRenderTracking = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderTracking = useCallback(async (componentName: string) => {
    const renderTime = performance.now() - renderStartTime.current;
    await trackPerformance('render_time', renderTime, {
      component: componentName,
    });
  }, [trackPerformance]);

  const trackLoadTime = useCallback(async (
    operation: string,
    startTime: number,
    context?: Record<string, any>
  ) => {
    const loadTime = performance.now() - startTime;
    await trackPerformance('load_time', loadTime, {
      operation,
      ...context,
    });
  }, [trackPerformance]);

  const trackGestureResponse = useCallback(async (
    gestureType: string,
    responseTime: number,
    context?: Record<string, any>
  ) => {
    await trackPerformance('gesture_response', responseTime, {
      gesture_type: gestureType,
      ...context,
    });
  }, [trackPerformance]);

  return {
    startRenderTracking,
    endRenderTracking,
    trackLoadTime,
    trackGestureResponse,
  };
}

// Helper function to get metric unit
function getMetricUnit(metricType: string): string {
  switch (metricType) {
    case 'render_time':
    case 'load_time':
    case 'gesture_response':
      return 'ms';
    case 'memory_usage':
      return 'MB';
    default:
      return 'unit';
  }
}