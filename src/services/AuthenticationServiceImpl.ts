import { 
  User, 
  LoginCredentials, 
  SignUpData, 
  AuthResult 
} from '../types';
import { 
  AuthenticationService, 
  AuthError, 
  AuthErrorType, 
  SessionStorage 
} from './AuthenticationService';
import { SecureStorageService } from './SecureStorageService';

/**
 * Authentication service implementation with API integration and secure storage
 * Handles user authentication, session management, and token refresh
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */
export class AuthenticationServiceImpl implements AuthenticationService {
  private currentUser: User | null = null;
  private sessionStorage: SessionStorage;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'https://api.swipely.com') {
    this.sessionStorage = new SecureStorageService();
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Sign in a user with provided credentials
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await this.makeApiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          phone: credentials.phone,
          password: credentials.password,
          provider: credentials.provider || 'email',
        }),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();
      const authResult: AuthResult = {
        user: {
          ...data.user,
          createdAt: new Date(data.user.createdAt),
          lastActiveAt: new Date(data.user.lastActiveAt),
          swipeHistory: data.user.swipeHistory?.map((action: any) => ({
            ...action,
            timestamp: new Date(action.timestamp),
          })) || [],
        },
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: new Date(data.expiresAt),
      };

      // Store tokens and user data
      await this.sessionStorage.storeTokens(authResult.token, authResult.refreshToken);
      await this.sessionStorage.storeUser(authResult.user);
      
      this.currentUser = authResult.user;

      return authResult;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      console.error('Sign in error:', error);
      throw new AuthError(
        AuthErrorType.NETWORK_ERROR,
        'Failed to sign in. Please check your connection and try again.',
        error as Error
      );
    }
  }

  /**
   * Sign up a new user with registration data
   */
  async signUp(userData: SignUpData): Promise<AuthResult> {
    try {
      const response = await this.makeApiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          displayName: userData.displayName,
          email: userData.email,
          phone: userData.phone,
          password: userData.password,
          provider: userData.provider || 'email',
        }),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();
      const authResult: AuthResult = {
        user: {
          ...data.user,
          createdAt: new Date(data.user.createdAt),
          lastActiveAt: new Date(data.user.lastActiveAt),
          swipeHistory: [],
        },
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: new Date(data.expiresAt),
      };

      // Store tokens and user data
      await this.sessionStorage.storeTokens(authResult.token, authResult.refreshToken);
      await this.sessionStorage.storeUser(authResult.user);
      
      this.currentUser = authResult.user;

      return authResult;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      console.error('Sign up error:', error);
      throw new AuthError(
        AuthErrorType.NETWORK_ERROR,
        'Failed to create account. Please check your connection and try again.',
        error as Error
      );
    }
  }

  /**
   * Sign out the current user and clear session data
   */
  async signOut(): Promise<void> {
    try {
      const token = await this.sessionStorage.getAccessToken();
      
      if (token) {
        // Attempt to notify server of logout (don't throw if this fails)
        try {
          await this.makeApiCall('/auth/signout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.warn('Failed to notify server of logout:', error);
        }
      }

      // Clear local storage regardless of server response
      await this.sessionStorage.clearAll();
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local data even if there's an error
      await this.sessionStorage.clearAll();
      this.currentUser = null;
    }
  }

  /**
   * Get the currently authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Refresh the current authentication token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await this.sessionStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new AuthError(
          AuthErrorType.SESSION_EXPIRED,
          'No refresh token available. Please sign in again.'
        );
      }

      const response = await this.makeApiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw await this.handleApiError(response);
      }

      const data = await response.json();
      
      // Store new tokens
      await this.sessionStorage.storeTokens(data.token, data.refreshToken);
      
      return data.token;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      console.error('Token refresh error:', error);
      throw new AuthError(
        AuthErrorType.SESSION_EXPIRED,
        'Session expired. Please sign in again.',
        error as Error
      );
    }
  }

  /**
   * Check if user session is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const token = await this.sessionStorage.getAccessToken();
      return token !== null;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Get current authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      return await this.sessionStorage.getAccessToken();
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * Initialize authentication service and restore session if available
   */
  async initialize(): Promise<void> {
    try {
      const [user, isValid] = await Promise.all([
        this.sessionStorage.getUser(),
        this.isSessionValid(),
      ]);

      if (user && isValid) {
        this.currentUser = user;
      } else {
        // Clear invalid session data
        await this.sessionStorage.clearAll();
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Authentication service initialization error:', error);
      this.currentUser = null;
    }
  }

  /**
   * Make authenticated API calls with automatic token refresh
   */
  private async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authorization header if token is available
    const token = await this.sessionStorage.getAccessToken();
    if (token && !endpoint.includes('/auth/')) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // If token expired, try to refresh and retry once
      if (response.status === 401 && token && !endpoint.includes('/auth/')) {
        try {
          const newToken = await this.refreshToken();
          requestOptions.headers = {
            ...requestOptions.headers,
            'Authorization': `Bearer ${newToken}`,
          };
          
          return await fetch(url, requestOptions);
        } catch (refreshError) {
          // If refresh fails, clear session and throw original error
          await this.signOut();
          throw new AuthError(
            AuthErrorType.SESSION_EXPIRED,
            'Session expired. Please sign in again.'
          );
        }
      }

      return response;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError(
        AuthErrorType.NETWORK_ERROR,
        'Network error. Please check your connection.',
        error as Error
      );
    }
  }

  /**
   * Handle API error responses and convert to AuthError
   */
  private async handleApiError(response: Response): Promise<AuthError> {
    try {
      const errorData = await response.json();
      const message = errorData.message || 'An error occurred';
      
      switch (response.status) {
        case 400:
          return new AuthError(AuthErrorType.INVALID_CREDENTIALS, message);
        case 401:
          return new AuthError(AuthErrorType.INVALID_CREDENTIALS, message);
        case 404:
          return new AuthError(AuthErrorType.USER_NOT_FOUND, message);
        case 409:
          return new AuthError(AuthErrorType.EMAIL_ALREADY_EXISTS, message);
        case 422:
          return new AuthError(AuthErrorType.WEAK_PASSWORD, message);
        default:
          return new AuthError(AuthErrorType.UNKNOWN_ERROR, message);
      }
    } catch (parseError) {
      return new AuthError(
        AuthErrorType.UNKNOWN_ERROR,
        `Server error (${response.status})`
      );
    }
  }
}