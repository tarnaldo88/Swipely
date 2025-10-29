import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  User,
  LoginCredentials,
  SignUpData,
  AuthResult,
  UserPreferences,
} from '../types';
import {
  AuthenticationService,
  AuthError,
  AuthErrorType,
  SessionStorage,
} from './AuthenticationService';
import { SecureStorageService } from './SecureStorageService';

/**
 * Firebase Authentication Service Implementation
 * Integrates with Firebase Auth for user authentication
 */
export class FirebaseAuthService implements AuthenticationService {
  private currentUser: User | null = null;
  private sessionStorage: SessionStorage;
  private authStateListener: (() => void) | null = null;
  private authStateCallbacks: ((user: User | null) => void)[] = [];

  constructor() {
    this.sessionStorage = new SecureStorageService();
    this.setupAuthStateListener();
  }

  /**
   * Add a callback to be notified of auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.authStateCallbacks.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all callbacks of auth state change
   */
  private notifyAuthStateChange(user: User | null): void {
    this.authStateCallbacks.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Error in auth state callback:', error);
      }
    });
  }

  /**
   * Set up Firebase auth state listener
   */
  private setupAuthStateListener(): void {
    this.authStateListener = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        this.currentUser = await this.convertFirebaseUserToUser(firebaseUser);
        await this.sessionStorage.storeUser(this.currentUser);
      } else {
        // User is signed out
        this.currentUser = null;
        await this.sessionStorage.clearAll();
      }
      
      // Notify all listeners of the auth state change
      this.notifyAuthStateChange(this.currentUser);
    });
  }

  /**
   * Convert Firebase User to our User type
   */
  private async convertFirebaseUserToUser(firebaseUser: FirebaseUser): Promise<User> {
    // Try to get stored user preferences, or create default ones
    let preferences: UserPreferences;
    try {
      const storedUser = await this.sessionStorage.getUser();
      preferences = storedUser?.preferences || {
        categories: [],
        priceRange: { min: 0, max: 1000 },
        brands: [],
      };
    } catch {
      preferences = {
        categories: [],
        priceRange: { min: 0, max: 1000 },
        brands: [],
      };
    }

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      avatar: firebaseUser.photoURL || undefined,
      preferences,
      swipeHistory: [],
      createdAt: firebaseUser.metadata.creationTime 
        ? new Date(firebaseUser.metadata.creationTime) 
        : new Date(),
      lastActiveAt: new Date(),
    };
  }

  /**
   * Convert Firebase error to AuthError
   */
  private convertFirebaseError(error: any): AuthError {
    const errorCode = error.code;
    const errorMessage = error.message;

    switch (errorCode) {
      case 'auth/user-not-found':
        return new AuthError(AuthErrorType.USER_NOT_FOUND, 'No account found with this email.');
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Invalid email or password.');
      case 'auth/email-already-in-use':
        return new AuthError(AuthErrorType.EMAIL_ALREADY_EXISTS, 'An account with this email already exists.');
      case 'auth/weak-password':
        return new AuthError(AuthErrorType.WEAK_PASSWORD, 'Password should be at least 6 characters.');
      case 'auth/invalid-email':
        return new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Please enter a valid email address.');
      case 'auth/network-request-failed':
        return new AuthError(AuthErrorType.NETWORK_ERROR, 'Network error. Please check your connection.');
      case 'auth/too-many-requests':
        return new AuthError(AuthErrorType.UNKNOWN_ERROR, 'Too many failed attempts. Please try again later.');
      default:
        return new AuthError(AuthErrorType.UNKNOWN_ERROR, errorMessage || 'An unexpected error occurred.');
    }
  }

  /**
   * Sign in a user with email and password
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      if (!credentials.email || !credentials.password) {
        throw new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Email and password are required.');
      }

      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = await this.convertFirebaseUserToUser(userCredential.user);
      
      // Get Firebase ID token for API calls
      const token = await userCredential.user.getIdToken();
      
      const authResult: AuthResult = {
        user,
        token,
        refreshToken: userCredential.user.refreshToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      await this.sessionStorage.storeTokens(token, userCredential.user.refreshToken);
      this.currentUser = user;

      return authResult;
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      throw this.convertFirebaseError(error);
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(userData: SignUpData): Promise<AuthResult> {
    try {
      if (!userData.email || !userData.password) {
        throw new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Email and password are required.');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new AuthError(AuthErrorType.INVALID_CREDENTIALS, 'Passwords do not match.');
      }

      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Update the user's display name
      if (userData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName,
        });
      }

      const user = await this.convertFirebaseUserToUser(userCredential.user);
      
      // Get Firebase ID token for API calls
      const token = await userCredential.user.getIdToken();
      
      const authResult: AuthResult = {
        user,
        token,
        refreshToken: userCredential.user.refreshToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      await this.sessionStorage.storeTokens(token, userCredential.user.refreshToken);
      this.currentUser = user;

      return authResult;
    } catch (error: any) {
      console.error('Firebase sign up error:', error);
      throw this.convertFirebaseError(error);
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      await this.sessionStorage.clearAll();
      this.currentUser = null;
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      // Still clear local data even if Firebase signOut fails
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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new AuthError(AuthErrorType.SESSION_EXPIRED, 'No user is currently signed in.');
      }

      const token = await firebaseUser.getIdToken(true); // Force refresh
      await this.sessionStorage.storeTokens(token, firebaseUser.refreshToken);
      
      return token;
    } catch (error: any) {
      console.error('Firebase token refresh error:', error);
      throw this.convertFirebaseError(error);
    }
  }

  /**
   * Check if user session is valid
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return false;
      }

      // Try to get a fresh token to verify the session
      await firebaseUser.getIdToken(true);
      return true;
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
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        return null;
      }

      return await firebaseUser.getIdToken();
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
      // Firebase handles initialization automatically through onAuthStateChanged
      // Just wait a moment for the auth state to be determined
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            this.currentUser = await this.convertFirebaseUserToUser(firebaseUser);
          } else {
            this.currentUser = null;
          }
          unsubscribe();
          resolve();
        });
      });
    } catch (error) {
      console.error('Firebase auth service initialization error:', error);
      this.currentUser = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }
}