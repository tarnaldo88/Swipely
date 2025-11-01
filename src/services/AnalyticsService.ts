/**
 * Analytics service for tracking user behavior and engagement
 * Requirements: 3.3, 3.4
 */

import { ErrorHandlingService } from './ErrorHandlingService';
import { ErrorFactory } from '../utils/ErrorFactory';
import { ErrorType } from '../types/errors';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface SwipeAnalytics {
  productId: string;
  action: 'like' | 'skip';
  category: string;
  price: number;
  swipeDirection: 'left' | 'right';
  swipeVelocity?: number;
  swipeDuration?: number;
  timestamp: Date;
}

export interface EngagementMetrics {
  sessionDuration: number;
  productsViewed: number;
  swipeCount: number;
  likeRate: number;
  skipRate: number;
  cartAdditions: number;
  detailsViews: number;
}

export interface UserBehaviorPattern {
  preferredCategories: string[];
  averageSessionDuration: number;
  peakUsageHours: number[];
  swipeVelocity: number;
  conversionRate: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private sessionStartTime: Date;
  private swipeAnalytics: SwipeAnalytics[] = [];
  private errorHandlingService: ErrorHandlingService;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track a generic analytics event
   */
  async trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: eventName,
        properties: properties || {},
        timestamp: new Date(),
        userId,
        sessionId: this.sessionId,
      };

      this.events.push(event);

      // In production, this would send to analytics service (Firebase, Mixpanel, etc.)
      console.log('Analytics Event:', event);

      // Batch send events periodically
      if (this.events.length >= 10) {
        await this.flushEvents();
      }
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to track analytics event',
          {
            context: { eventName, properties },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Track swipe actions with detailed analytics
   */
  async trackSwipe(
    productId: string,
    action: 'like' | 'skip',
    category: string,
    price: number,
    swipeMetrics?: {
      direction: 'left' | 'right';
      velocity?: number;
      duration?: number;
    },
    userId?: string
  ): Promise<void> {
    try {
      const swipeData: SwipeAnalytics = {
        productId,
        action,
        category,
        price,
        swipeDirection: swipeMetrics?.direction || (action === 'like' ? 'right' : 'left'),
        swipeVelocity: swipeMetrics?.velocity,
        swipeDuration: swipeMetrics?.duration,
        timestamp: new Date(),
      };

      this.swipeAnalytics.push(swipeData);

      // Track as general event
      await this.trackEvent('product_swipe', {
        product_id: productId,
        action,
        category,
        price,
        swipe_direction: swipeData.swipeDirection,
        swipe_velocity: swipeData.swipeVelocity,
        swipe_duration: swipeData.swipeDuration,
      }, userId);

      // Track category-specific metrics
      await this.trackEvent(`swipe_${action}`, {
        product_id: productId,
        category,
        price,
      }, userId);

    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to track swipe analytics',
          {
            context: { productId, action, category },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Track user engagement metrics
   */
  async trackEngagement(
    eventType: 'session_start' | 'session_end' | 'product_view' | 'cart_add' | 'details_view',
    properties?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      const engagementProperties = {
        ...properties,
        session_duration: this.getSessionDuration(),
        session_id: this.sessionId,
      };

      await this.trackEvent(`engagement_${eventType}`, engagementProperties, userId);

      // Track specific engagement patterns
      if (eventType === 'session_end') {
        const metrics = this.calculateEngagementMetrics();
        await this.trackEvent('session_metrics', metrics, userId);
      }
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to track engagement',
          {
            context: { eventType, properties },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    metricType: 'render_time' | 'load_time' | 'gesture_response' | 'memory_usage',
    value: number,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await this.trackEvent(`performance_${metricType}`, {
        value,
        unit: this.getMetricUnit(metricType),
        ...context,
      });
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.PERFORMANCE_ERROR,
          'Failed to track performance metric',
          {
            context: { metricType, value, context },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Get swipe patterns and analytics
   */
  getSwipePatterns(userId?: string): UserBehaviorPattern {
    const userSwipes = userId 
      ? this.swipeAnalytics.filter(s => this.events.some(e => e.userId === userId))
      : this.swipeAnalytics;

    const totalSwipes = userSwipes.length;
    const likes = userSwipes.filter(s => s.action === 'like').length;
    const skips = userSwipes.filter(s => s.action === 'skip').length;

    // Calculate preferred categories
    const categoryCount: Record<string, number> = {};
    userSwipes.forEach(swipe => {
      if (swipe.action === 'like') {
        categoryCount[swipe.category] = (categoryCount[swipe.category] || 0) + 1;
      }
    });

    const preferredCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Calculate average swipe velocity
    const velocities = userSwipes
      .filter(s => s.swipeVelocity !== undefined)
      .map(s => s.swipeVelocity!);
    const averageVelocity = velocities.length > 0 
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length 
      : 0;

    return {
      preferredCategories,
      averageSessionDuration: this.getSessionDuration(),
      peakUsageHours: this.calculatePeakUsageHours(),
      swipeVelocity: averageVelocity,
      conversionRate: totalSwipes > 0 ? likes / totalSwipes : 0,
    };
  }

  /**
   * Calculate engagement metrics for current session
   */
  calculateEngagementMetrics(): EngagementMetrics {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    
    const productsViewed = sessionEvents.filter(e => e.name === 'engagement_product_view').length;
    const swipeCount = this.swipeAnalytics.length;
    const likes = this.swipeAnalytics.filter(s => s.action === 'like').length;
    const skips = this.swipeAnalytics.filter(s => s.action === 'skip').length;
    const cartAdditions = sessionEvents.filter(e => e.name === 'engagement_cart_add').length;
    const detailsViews = sessionEvents.filter(e => e.name === 'engagement_details_view').length;

    return {
      sessionDuration: this.getSessionDuration(),
      productsViewed,
      swipeCount,
      likeRate: swipeCount > 0 ? likes / swipeCount : 0,
      skipRate: swipeCount > 0 ? skips / swipeCount : 0,
      cartAdditions,
      detailsViews,
    };
  }

  /**
   * Flush events to analytics service
   */
  async flushEvents(): Promise<void> {
    try {
      if (this.events.length === 0) return;

      // In production, this would send to analytics service
      console.log('Flushing analytics events:', this.events.length);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear events after successful send
      this.events = [];
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.NETWORK_ERROR,
          'Failed to flush analytics events',
          {
            context: { eventCount: this.events.length },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Start a new session
   */
  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.swipeAnalytics = [];
  }

  /**
   * Get current session duration in seconds
   */
  private getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get metric unit for performance tracking
   */
  private getMetricUnit(metricType: string): string {
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

  /**
   * Calculate peak usage hours (simplified)
   */
  private calculatePeakUsageHours(): number[] {
    const hourCounts: Record<number, number> = {};
    
    this.events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    totalEvents: number;
    totalSwipes: number;
    sessionDuration: number;
    topCategories: string[];
  } {
    const categoryCount: Record<string, number> = {};
    this.swipeAnalytics.forEach(swipe => {
      if (swipe.action === 'like') {
        categoryCount[swipe.category] = (categoryCount[swipe.category] || 0) + 1;
      }
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      totalEvents: this.events.length,
      totalSwipes: this.swipeAnalytics.length,
      sessionDuration: this.getSessionDuration(),
      topCategories,
    };
  }
}