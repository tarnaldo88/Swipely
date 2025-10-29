import { AuthenticationServiceImpl } from './AuthenticationServiceImpl';
import { AuthenticationService } from './AuthenticationService';

/**
 * Authentication service factory and singleton instance
 * Provides a centralized way to access the authentication service
 * 
 * Requirements: 1.1, 1.3, 1.5
 */
class AuthServiceFactory {
  private static instance: AuthenticationService | null = null;

  /**
   * Get the singleton instance of the authentication service
   */
  static getInstance(): AuthenticationService {
    if (!AuthServiceFactory.instance) {
      // In a real app, this URL would come from environment configuration
      const apiBaseUrl = __DEV__ 
        ? 'http://localhost:3000/api' 
        : 'https://api.swipely.com';
        
      AuthServiceFactory.instance = new AuthenticationServiceImpl(apiBaseUrl);
    }
    
    return AuthServiceFactory.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    AuthServiceFactory.instance = null;
  }
}

/**
 * Convenience function to get the authentication service instance
 */
export const getAuthService = (): AuthenticationService => {
  return AuthServiceFactory.getInstance();
};

/**
 * Initialize the authentication service
 * Should be called when the app starts
 */
export const initializeAuthService = async (): Promise<void> => {
  const authService = getAuthService();
  await authService.initialize();
};

// Export the factory for advanced use cases
export { AuthServiceFactory };