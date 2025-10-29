// Authentication services
export { 
  AuthenticationService, 
  AuthError, 
  AuthErrorType, 
  SessionStorage 
} from './AuthenticationService';

export { AuthenticationServiceImpl } from './AuthenticationServiceImpl';
export { FirebaseAuthService } from './FirebaseAuthService';
export { SecureStorageService } from './SecureStorageService';
export { getAuthService, initializeAuthService, AuthServiceFactory } from './AuthService';

// Category and preference services
export { CategoryPreferenceService } from './CategoryPreferenceService';

// Product feed services
export { ProductFeedService } from './ProductFeedService';