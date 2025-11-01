/**
 * Comprehensive error types and interfaces for the Swipely app
 * Requirements: 1.4, 5.5, 6.5
 */

export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',
  API_ERROR = 'API_ERROR',
  
  // Authentication errors
  AUTH_ERROR = 'AUTH_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Data errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATA_SYNC_ERROR = 'DATA_SYNC_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  
  // UI/UX errors
  GESTURE_ERROR = 'GESTURE_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  
  // Business logic errors
  PRODUCT_UNAVAILABLE = 'PRODUCT_UNAVAILABLE',
  CART_ERROR = 'CART_ERROR',
  WISHLIST_ERROR = 'WISHLIST_ERROR',
  
  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  retryable: boolean;
  userMessage?: string;
}

export interface NetworkError extends AppError {
  type: ErrorType.NETWORK_ERROR | ErrorType.CONNECTION_TIMEOUT | ErrorType.SERVER_ERROR | ErrorType.API_ERROR;
  statusCode?: number;
  endpoint?: string;
  method?: string;
}

export interface AuthError extends AppError {
  type: ErrorType.AUTH_ERROR | ErrorType.SESSION_EXPIRED | ErrorType.INVALID_CREDENTIALS;
  provider?: string;
}

export interface ValidationError extends AppError {
  type: ErrorType.VALIDATION_ERROR;
  field?: string;
  value?: any;
  constraints?: string[];
}

export interface BusinessError extends AppError {
  type: ErrorType.PRODUCT_UNAVAILABLE | ErrorType.CART_ERROR | ErrorType.WISHLIST_ERROR;
  resourceId?: string;
  resourceType?: string;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'refresh' | 'navigate' | 'logout' | 'ignore';
  label: string;
  action: () => void | Promise<void>;
}

export interface ErrorDisplayOptions {
  showToUser: boolean;
  userMessage?: string;
  recoveryActions?: ErrorRecoveryAction[];
  autoRetry?: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
    backoffMultiplier?: number;
  };
}