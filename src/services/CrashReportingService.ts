/**
 * Crash reporting and monitoring service
 * Requirements: 3.3, 3.4
 */

import { AppError, ErrorType, ErrorSeverity } from '../types/errors';

export interface CrashReport {
  id: string;
  timestamp: Date;
  error: AppError;
  stackTrace?: string;
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
  userInfo?: UserInfo;
  breadcrumbs: Breadcrumb[];
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  deviceModel: string;
  screenSize: { width: number; height: number };
  memoryUsage?: number;
  batteryLevel?: number;
  networkType?: string;
}

export interface AppInfo {
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  sessionId: string;
  launchTime: Date;
}

export interface UserInfo {
  userId: string;
  userAgent?: string;
  locale: string;
  timezone: string;
}

export interface Breadcrumb {
  timestamp: Date;
  category: 'navigation' | 'user_action' | 'network' | 'state_change' | 'error';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export class CrashReportingService {
  private static instance: CrashReportingService | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxBreadcrumbs = 50;
  private maxMetrics = 100;
  private deviceInfo: DeviceInfo;
  private appInfo: AppInfo;
  private userInfo?: UserInfo;

  private constructor() {
    this.deviceInfo = this.collectDeviceInfo();
    this.appInfo = this.collectAppInfo();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService();
    }
    return CrashReportingService.instance;
  }

  /**
   * Report a crash with full context
   */
  async reportCrash(error: AppError): Promise<void> {
    try {
      const crashReport: CrashReport = {
        id: this.generateCrashId(),
        timestamp: new Date(),
        error,
        stackTrace: error.stack,
        deviceInfo: this.deviceInfo,
        appInfo: this.appInfo,
        userInfo: this.userInfo,
        breadcrumbs: [...this.breadcrumbs],
      };

      // Log crash report locally
      console.error('CRASH REPORT:', crashReport);

      // In production, send to crash reporting service (Crashlytics, Sentry, Bugsnag)
      await this.sendCrashReport(crashReport);

      // Add crash as breadcrumb for future reports
      this.addBreadcrumb({
        category: 'error',
        message: `Crash reported: ${error.type}`,
        level: 'error',
        data: {
          errorType: error.type,
          errorMessage: error.message,
          crashId: crashReport.id,
        },
      });

    } catch (reportingError) {
      console.error('Failed to report crash:', reportingError);
    }
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.performanceMetrics.push(fullMetric);

    // Keep only the most recent metrics
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics);
    }

    // Report performance issues
    if (this.isPerformanceIssue(metric)) {
      this.reportPerformanceIssue(metric);
    }
  }

  /**
   * Set user information for crash reports
   */
  setUserInfo(userInfo: UserInfo): void {
    this.userInfo = userInfo;
  }

  /**
   * Track navigation events
   */
  trackNavigation(screenName: string, params?: Record<string, any>): void {
    this.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${screenName}`,
      level: 'info',
      data: {
        screen: screenName,
        params,
      },
    });
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, target?: string, data?: Record<string, any>): void {
    this.addBreadcrumb({
      category: 'user_action',
      message: `User ${action}${target ? ` on ${target}` : ''}`,
      level: 'info',
      data: {
        action,
        target,
        ...data,
      },
    });
  }

  /**
   * Track network requests
   */
  trackNetworkRequest(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number
  ): void {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    
    this.addBreadcrumb({
      category: 'network',
      message: `${method} ${url} ${statusCode ? `(${statusCode})` : ''}`,
      level,
      data: {
        method,
        url,
        statusCode,
        duration,
      },
    });
  }

  /**
   * Track state changes
   */
  trackStateChange(component: string, oldState: any, newState: any): void {
    this.addBreadcrumb({
      category: 'state_change',
      message: `State changed in ${component}`,
      level: 'info',
      data: {
        component,
        oldState: this.sanitizeState(oldState),
        newState: this.sanitizeState(newState),
      },
    });
  }

  /**
   * Get crash reporting summary
   */
  getSummary(): {
    breadcrumbCount: number;
    performanceMetricCount: number;
    recentErrors: Breadcrumb[];
    performanceIssues: PerformanceMetric[];
  } {
    const recentErrors = this.breadcrumbs
      .filter(b => b.level === 'error')
      .slice(-10);

    const performanceIssues = this.performanceMetrics
      .filter(m => this.isPerformanceIssue(m))
      .slice(-10);

    return {
      breadcrumbCount: this.breadcrumbs.length,
      performanceMetricCount: this.performanceMetrics.length,
      recentErrors,
      performanceIssues,
    };
  }

  /**
   * Clear all tracking data
   */
  clearData(): void {
    this.breadcrumbs = [];
    this.performanceMetrics = [];
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleUnhandledRejection(event.reason);
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handleGlobalError(event.error);
      });
    }

    // React Native specific error handling would go here
    // ErrorUtils.setGlobalHandler((error, isFatal) => {
    //   this.handleGlobalError(error, isFatal);
    // });
  }

  /**
   * Handle unhandled promise rejections
   */
  private async handleUnhandledRejection(reason: any): Promise<void> {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    this.addBreadcrumb({
      category: 'error',
      message: 'Unhandled promise rejection',
      level: 'error',
      data: {
        reason: error.message,
        stack: error.stack,
      },
    });

    // Don't report all unhandled rejections as crashes, but log them
    console.error('Unhandled promise rejection:', error);
  }

  /**
   * Handle global errors
   */
  private async handleGlobalError(error: Error, isFatal: boolean = false): Promise<void> {
    this.addBreadcrumb({
      category: 'error',
      message: `Global error: ${error.message}`,
      level: 'error',
      data: {
        message: error.message,
        stack: error.stack,
        isFatal,
      },
    });

    // Report fatal errors as crashes
    if (isFatal) {
      const appError = error as AppError;
      if (!appError.type) {
        (appError as any).type = ErrorType.UNKNOWN_ERROR;
        (appError as any).severity = ErrorSeverity.CRITICAL;
        (appError as any).timestamp = new Date();
        (appError as any).retryable = false;
      }
      
      await this.reportCrash(appError);
    }
  }

  /**
   * Collect device information
   */
  private collectDeviceInfo(): DeviceInfo {
    // This would be more comprehensive in a real app
    const screenSize = typeof window !== 'undefined' 
      ? { width: window.screen.width, height: window.screen.height }
      : { width: 0, height: 0 };

    return {
      platform: this.detectPlatform(),
      osVersion: this.getOSVersion(),
      deviceModel: this.getDeviceModel(),
      screenSize,
      memoryUsage: this.getMemoryUsage(),
      networkType: this.getNetworkType(),
    };
  }

  /**
   * Collect app information
   */
  private collectAppInfo(): AppInfo {
    return {
      version: '1.0.0', // Would come from app config
      buildNumber: '1', // Would come from app config
      environment: __DEV__ ? 'development' : 'production',
      sessionId: `session_${Date.now()}`,
      launchTime: new Date(),
    };
  }

  /**
   * Send crash report to service
   */
  private async sendCrashReport(crashReport: CrashReport): Promise<void> {
    try {
      // In production, this would send to crash reporting service
      // await fetch('/api/crash-reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(crashReport),
      // });
      
      console.log('Crash report sent:', crashReport.id);
    } catch (error) {
      console.error('Failed to send crash report:', error);
    }
  }

  /**
   * Check if metric indicates performance issue
   */
  private isPerformanceIssue(metric: Omit<PerformanceMetric, 'timestamp'>): boolean {
    switch (metric.name) {
      case 'render_time':
        return metric.value > 16; // More than 16ms (60fps threshold)
      case 'load_time':
        return metric.value > 1000; // More than 1 second
      case 'gesture_response':
        return metric.value > 100; // More than 100ms
      case 'memory_usage':
        return metric.value > 200; // More than 200MB
      default:
        return false;
    }
  }

  /**
   * Report performance issue
   */
  private reportPerformanceIssue(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.addBreadcrumb({
      category: 'error',
      message: `Performance issue: ${metric.name}`,
      level: 'warning',
      data: {
        metric: metric.name,
        value: metric.value,
        unit: metric.unit,
        threshold: this.getPerformanceThreshold(metric.name),
      },
    });
  }

  /**
   * Get performance threshold for metric
   */
  private getPerformanceThreshold(metricName: string): number {
    switch (metricName) {
      case 'render_time': return 16;
      case 'load_time': return 1000;
      case 'gesture_response': return 100;
      case 'memory_usage': return 200;
      default: return 0;
    }
  }

  /**
   * Sanitize state for logging (remove sensitive data)
   */
  private sanitizeState(state: any): any {
    if (typeof state !== 'object' || state === null) {
      return state;
    }

    const sanitized = { ...state };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Generate unique crash ID
   */
  private generateCrashId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect platform
   */
  private detectPlatform(): 'ios' | 'android' | 'web' {
    if (typeof window !== 'undefined') {
      return 'web';
    }
    // In React Native, you would use Platform.OS
    return 'android'; // Default for this example
  }

  /**
   * Get OS version
   */
  private getOSVersion(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return 'unknown';
  }

  /**
   * Get device model
   */
  private getDeviceModel(): string {
    if (typeof navigator !== 'undefined') {
      return navigator.platform;
    }
    return 'unknown';
  }

  /**
   * Get memory usage (approximation)
   */
  private getMemoryUsage(): number | undefined {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return undefined;
  }

  /**
   * Get network type
   */
  private getNetworkType(): string | undefined {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || connection?.type;
    }
    return undefined;
  }
}