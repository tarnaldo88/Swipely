import { User, LoginCredentials, SignUpData, AuthResult } from '../types';

/**
 * Authentication service interface for managing user authentication,
 * session management, and secure token handling.
 * 
 * Requirements: 1.1, 1.3, 1.5
 */
export interface AuthenticationService {
  /**
   * Sign in a user with provided credentials
   * @param credentials - User login credentials (email/phone + password)
   * @returns Promise resolving to authentication result with user and tokens
   */
  signIn(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Sign up a new user with registration data
   * @param userData - User registration information
   * @returns Promise resolving to authentication result with user and tokens
   */
  signUp(userData: SignUpData): Promise<AuthResult>;

  /**
   * Sign out the current user and clear session data
   * @returns Promise that resolves when sign out is complete
   */
  signOut(): Promise<void>;

  /**
   * Get the currently authenticated user
   * @returns Current user object or null if not authenticated
   */
  getCurrentUser(): User | null;

  /**
   * Refresh the current authentication token
   * @returns Promise resolving to new access token
   */
  refreshToken(): Promise<string>;

  /**
   * Check if user session is valid
   * @returns Promise resolving to boolean indicating session validity
   */
  isSessionValid(): Promise<boolean>;

  /**
   * Get current authentication token
   * @returns Promise resolving to current access token or null if not authenticated
   */
  getToken(): Promise<string | null>;

  /**
   * Initialize authentication service and restore session if available
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
}

/**
 * Authentication error types for proper error handling
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Authentication error class for structured error handling
 */
export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Session storage interface for secure token management
 */
export interface SessionStorage {
  /**
   * Store authentication tokens securely
   */
  storeTokens(accessToken: string, refreshToken: string): Promise<void>;

  /**
   * Retrieve stored access token
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Retrieve stored refresh token
   */
  getRefreshToken(): Promise<string | null>;

  /**
   * Clear all stored authentication data
   */
  clearTokens(): Promise<void>;

  /**
   * Store user data
   */
  storeUser(user: User): Promise<void>;

  /**
   * Retrieve stored user data
   */
  getUser(): Promise<User | null>;

  /**
   * Clear stored user data
   */
  clearUser(): Promise<void>;

  /**
   * Clear all stored data (tokens and user data)
   */
  clearAll(): Promise<void>;
}