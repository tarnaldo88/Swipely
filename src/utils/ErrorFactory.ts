/**
 * Factory for creating standardized error objects
 * Requirements: 1.4, 5.5, 6.5
 */

import { 
  AppError, 
  NetworkError, 
  AuthError, 
  ValidationError, 
  BusinessError,
  ErrorType, 
  ErrorSeverity 
} from '../types/errors';

export class ErrorFactory {
  private static sessionId: string = Date.now().toString();
  private static userId?: string;

  static setSessionId(sessionId: string): void {
    ErrorFactory.sessionId = sessionId;
  }

  static setUserId(userId: string): void {
    ErrorFactory.userId = userId;
  }

  /**
   * Create a generic app error
   */
  static createAppError(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      code?: string;
      context?: Record<string, any>;
      retryable?: boolean;
      userMessage?: string;
      originalError?: Error;
    } = {}
  ): AppError {
    const error = new Error(message) as AppError;
    
    error.type = type;
    error.severity = options.severity || ErrorSeverity.MEDIUM;
    error.code = options.code;
    error.context = options.context || {};
    error.timestamp = new Date();
    error.userId = ErrorFactory.userId;
    error.sessionId = ErrorFactory.sessionId;
    error.retryable = options.retryable || false;
    error.userMessage = options.userMessage;

    // Preserve original stack trace if available
    if (options.originalError) {
      error.stack = options.originalError.stack;
      error.context.originalError = {
        name: options.originalError.name,
        message: options.originalError.message,
      };
    }

    return error;
  }

  /**
   * Create a network error
   */
  static createNetworkError(
    message: string,
    options: {
      statusCode?: number;
      endpoint?: string;
      method?: string;
      retryable?: boolean;
      originalError?: Error;
    } = {}
  ): NetworkError {
    const errorType = ErrorFactory.getNetworkErrorType(options.statusCode);
    const severity = ErrorFactory.getNetworkErrorSeverity(options.statusCode);
    
    const error = ErrorFactory.createAppError(
      errorType,
      message,
      {
        severity,
        retryable: options.retryable ?? ErrorFactory.isNetworkErrorRetryable(options.statusCode),
        userMessage: ErrorFactory.getNetworkErrorUserMessage(options.statusCode),
        originalError: options.originalError,
        context: {
          statusCode: options.statusCode,
          endpoint: options.endpoint,
          method: options.method,
        },
      }
    ) as NetworkError;

    error.statusCode = options.statusCode;
    error.endpoint = options.endpoint;
    error.method = options.method;

    return error;
  }

  /**
   * Create an authentication error
   */
  static createAuthError(
    message: string,
    options: {
      provider?: string;
      code?: string;
      originalError?: Error;
    } = {}
  ): AuthError {
    const error = ErrorFactory.createAppError(
      ErrorType.AUTH_ERROR,
      message,
      {
        severity: ErrorSeverity.HIGH,
        code: options.code,
        retryable: false,
        userMessage: 'Authentication failed. Please try signing in again.',
        originalError: options.originalError,
        context: {
          provider: options.provider,
        },
      }
    ) as AuthError;

    error.provider = options.provider;

    return error;
  }

  /**
   * Create a validation error
   */
  static createValidationError(
    message: string,
    options: {
      field?: string;
      value?: any;
      constraints?: string[];
      originalError?: Error;
    } = {}
  ): ValidationError {
    const error = ErrorFactory.createAppError(
      ErrorType.VALIDATION_ERROR,
      message,
      {
        severity: ErrorSeverity.LOW,
        retryable: false,
        userMessage: `Invalid ${options.field || 'input'}. Please check and try again.`,
        originalError: options.originalError,
        context: {
          field: options.field,
          value: options.value,
          constraints: options.constraints,
        },
      }
    ) as ValidationError;

    error.field = options.field;
    error.value = options.value;
    error.constraints = options.constraints;

    return error;
  }

  /**
   * Create a business logic error
   */
  static createBusinessError(
    type: ErrorType.PRODUCT_UNAVAILABLE | ErrorType.CART_ERROR | ErrorType.WISHLIST_ERROR,
    message: string,
    options: {
      resourceId?: string;
      resourceType?: string;
      retryable?: boolean;
      originalError?: Error;
    } = {}
  ): BusinessError {
    const userMessages = {
      [ErrorType.PRODUCT_UNAVAILABLE]: 'This product is currently unavailable.',
      [ErrorType.CART_ERROR]: 'Unable to update your cart. Please try again.',
      [ErrorType.WISHLIST_ERROR]: 'Unable to update your wishlist. Please try again.',
    };

    const error = ErrorFactory.createAppError(
      type,
      message,
      {
        severity: ErrorSeverity.MEDIUM,
        retryable: options.retryable ?? true,
        userMessage: userMessages[type],
        originalError: options.originalError,
        context: {
          resourceId: options.resourceId,
          resourceType: options.resourceType,
        },
      }
    ) as BusinessError;

    error.resourceId = options.resourceId;
    error.resourceType = options.resourceType;

    return error;
  }

  /**
   * Wrap an unknown error into a standardized AppError
   */
  static wrapUnknownError(error: unknown, context?: Record<string, any>): AppError {
    if (error instanceof Error && 'type' in error) {
      return error as AppError;
    }

    const message = error instanceof Error ? error.message : String(error);
    
    return ErrorFactory.createAppError(
      ErrorType.UNKNOWN_ERROR,
      message,
      {
        severity: ErrorSeverity.HIGH,
        retryable: false,
        userMessage: 'An unexpected error occurred. Please try again.',
        originalError: error instanceof Error ? error : undefined,
        context,
      }
    );
  }

  // Helper methods for network errors
  private static getNetworkErrorType(statusCode?: number): ErrorType {
    if (!statusCode) return ErrorType.NETWORK_ERROR;
    
    if (statusCode >= 500) return ErrorType.SERVER_ERROR;
    if (statusCode === 408 || statusCode === 504) return ErrorType.CONNECTION_TIMEOUT;
    return ErrorType.API_ERROR;
  }

  private static getNetworkErrorSeverity(statusCode?: number): ErrorSeverity {
    if (!statusCode) return ErrorSeverity.HIGH;
    
    if (statusCode >= 500) return ErrorSeverity.HIGH;
    if (statusCode >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  private static isNetworkErrorRetryable(statusCode?: number): boolean {
    if (!statusCode) return true;
    
    // Retry on server errors and timeouts
    if (statusCode >= 500 || statusCode === 408 || statusCode === 504) return true;
    
    // Don't retry on client errors (4xx)
    if (statusCode >= 400 && statusCode < 500) return false;
    
    return true;
  }

  private static getNetworkErrorUserMessage(statusCode?: number): string {
    if (!statusCode) return 'Network connection failed. Please check your internet connection.';
    
    if (statusCode >= 500) return 'Server is temporarily unavailable. Please try again later.';
    if (statusCode === 408 || statusCode === 504) return 'Request timed out. Please try again.';
    if (statusCode === 401) return 'Authentication required. Please sign in again.';
    if (statusCode === 403) return 'Access denied. You don\'t have permission to perform this action.';
    if (statusCode === 404) return 'The requested resource was not found.';
    
    return 'An error occurred while processing your request. Please try again.';
  }
}