/**
 * Centralized error handling service with retry mechanisms and user-friendly messages
 * Requirements: 1.4, 5.5, 6.5
 */

import { 
  AppError, 
  ErrorType, 
  ErrorSeverity, 
  ErrorRecoveryAction, 
  ErrorDisplayOptions 
} from '../types/errors';
import { ErrorFactory } from '../utils/ErrorFactory';

interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableCrashReporting: boolean;
  enableUserNotifications: boolean;
  retryConfig: RetryConfig;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService | null = null;
  private config: ErrorHandlerConfig;
  private errorListeners: ((error: AppError) => void)[] = [];
  private retryAttempts: Map<string, number> = new Map();

  private constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      enableLogging: true,
      enableCrashReporting: true,
      enableUserNotifications: true,
      retryConfig: {
        maxAttempts: 3,
        delay: 1000,
        backoffMultiplier: 2,
        retryableErrors: [
          ErrorType.NETWORK_ERROR,
          ErrorType.CONNECTION_TIMEOUT,
          ErrorType.SERVER_ERROR,
          ErrorType.DATA_SYNC_ERROR,
        ],
      },
      ...config,
    };
  }

  static getInstance(config?: Partial<ErrorHandlerConfig>): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService(config);
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle an error with automatic retry and user notification
   */
  async handleError(
    error: unknown,
    context?: Record<string, any>,
    options?: Partial<ErrorDisplayOptions>
  ): Promise<void> {
    const appError = this.normalizeError(error, context);
    
    // Log the error
    if (this.config.enableLogging) {
      this.logError(appError);
    }

    // Report to crash reporting service
    if (this.config.enableCrashReporting && appError.severity === ErrorSeverity.CRITICAL) {
      this.reportCrash(appError);
    }

    // Notify error listeners
    this.notifyErrorListeners(appError);

    // Handle user notification and recovery
    if (this.config.enableUserNotifications && (options?.showToUser ?? true)) {
      await this.showUserError(appError, options);
    }
  }

  /**
   * Execute a function with automatic retry on failure
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    context?: Record<string, any>
  ): Promise<T> {
    const maxAttempts = this.config.retryConfig.maxAttempts;
    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Reset retry count on success
        this.retryAttempts.delete(operationId);
        
        return result;
      } catch (error) {
        lastError = this.normalizeError(error, { ...context, attempt, operationId });
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError) || attempt === maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.config.retryConfig.delay * 
          Math.pow(this.config.retryConfig.backoffMultiplier, attempt - 1);
        
        // Log retry attempt
        if (this.config.enableLogging) {
          console.warn(`Retrying operation ${operationId} (attempt ${attempt}/${maxAttempts}) after ${delay}ms:`, lastError.message);
        }

        // Wait before retry
        await this.delay(delay);
      }
    }

    // All retries failed, handle the final error
    if (lastError) {
      await this.handleError(lastError, context);
      throw lastError;
    }

    throw ErrorFactory.createAppError(
      ErrorType.UNKNOWN_ERROR,
      'Operation failed without error details',
      { context }
    );
  }

  /**
   * Add an error listener
   */
  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Create recovery actions for common error types
   */
  createRecoveryActions(error: AppError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    // Retry action for retryable errors
    if (error.retryable) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        action: async () => {
          // This would trigger a retry of the original operation
          // Implementation depends on the specific context
        },
      });
    }

    // Refresh action for data-related errors
    if ([ErrorType.DATA_SYNC_ERROR, ErrorType.API_ERROR].includes(error.type)) {
      actions.push({
        type: 'refresh',
        label: 'Refresh',
        action: async () => {
          // This would trigger a data refresh
          // Implementation depends on the specific context
        },
      });
    }

    // Logout action for auth errors
    if ([ErrorType.AUTH_ERROR, ErrorType.SESSION_EXPIRED].includes(error.type)) {
      actions.push({
        type: 'logout',
        label: 'Sign Out',
        action: async () => {
          // This would trigger logout
          // Implementation depends on the auth service
        },
      });
    }

    // Navigate to home for navigation errors
    if (error.type === ErrorType.NAVIGATION_ERROR) {
      actions.push({
        type: 'navigate',
        label: 'Go Home',
        action: async () => {
          // This would navigate to home screen
          // Implementation depends on the navigation service
        },
      });
    }

    return actions;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: AppError): string {
    if (error.userMessage) {
      return error.userMessage;
    }

    // Default messages based on error type
    const defaultMessages: Record<ErrorType, string> = {
      [ErrorType.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
      [ErrorType.CONNECTION_TIMEOUT]: 'Request timed out. Please try again.',
      [ErrorType.SERVER_ERROR]: 'Server is temporarily unavailable. Please try again later.',
      [ErrorType.API_ERROR]: 'An error occurred while processing your request.',
      [ErrorType.AUTH_ERROR]: 'Authentication failed. Please sign in again.',
      [ErrorType.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
      [ErrorType.INVALID_CREDENTIALS]: 'Invalid credentials. Please check your login information.',
      [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorType.DATA_SYNC_ERROR]: 'Unable to sync your data. Please try again.',
      [ErrorType.STORAGE_ERROR]: 'Unable to save your data. Please try again.',
      [ErrorType.GESTURE_ERROR]: 'Gesture not recognized. Please try again.',
      [ErrorType.NAVIGATION_ERROR]: 'Navigation failed. Please try again.',
      [ErrorType.RENDER_ERROR]: 'Display error occurred. Please refresh the app.',
      [ErrorType.PRODUCT_UNAVAILABLE]: 'This product is currently unavailable.',
      [ErrorType.CART_ERROR]: 'Unable to update your cart. Please try again.',
      [ErrorType.WISHLIST_ERROR]: 'Unable to update your wishlist. Please try again.',
      [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
      [ErrorType.PERFORMANCE_ERROR]: 'The app is running slowly. Please try restarting.',
    };

    return defaultMessages[error.type] || 'An error occurred. Please try again.';
  }

  private normalizeError(error: unknown, context?: Record<string, any>): AppError {
    if (error && typeof error === 'object' && 'type' in error) {
      return error as AppError;
    }

    return ErrorFactory.wrapUnknownError(error, context);
  }

  private isRetryableError(error: AppError): boolean {
    return error.retryable && 
           this.config.retryConfig.retryableErrors.includes(error.type);
  }

  private logError(error: AppError): void {
    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.type}] ${error.message}`;
    const logContext = {
      severity: error.severity,
      code: error.code,
      context: error.context,
      timestamp: error.timestamp,
      userId: error.userId,
      sessionId: error.sessionId,
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logContext);
        break;
      case 'warn':
        console.warn(logMessage, logContext);
        break;
      case 'info':
        console.info(logMessage, logContext);
        break;
      default:
        console.log(logMessage, logContext);
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  private reportCrash(error: AppError): void {
    // In production, this would integrate with crash reporting services
    // like Crashlytics, Sentry, or Bugsnag
    console.error('CRASH REPORT:', {
      type: error.type,
      message: error.message,
      stack: error.stack,
      context: error.context,
      timestamp: error.timestamp,
      userId: error.userId,
      sessionId: error.sessionId,
    });
  }

  private notifyErrorListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  private async showUserError(
    error: AppError, 
    options?: Partial<ErrorDisplayOptions>
  ): Promise<void> {
    // This would integrate with the UI notification system
    // For now, we'll just log it as this is a service layer
    const message = options?.userMessage || this.getUserMessage(error);
    const recoveryActions = options?.recoveryActions || this.createRecoveryActions(error);
    
    console.info('USER ERROR NOTIFICATION:', {
      message,
      severity: error.severity,
      recoveryActions: recoveryActions.map(action => action.label),
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}