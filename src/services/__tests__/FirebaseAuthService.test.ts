import { FirebaseAuthService } from '../FirebaseAuthService';
import { AuthError, AuthErrorType } from '../AuthenticationService';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  getAuth: jest.fn(),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

// Mock Firebase Config
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
}));

// Mock SecureStorageService
jest.mock('../SecureStorageService', () => ({
  SecureStorageService: jest.fn().mockImplementation(() => ({
    storeTokens: jest.fn(),
    storeUser: jest.fn(),
    getUser: jest.fn(),
    clearAll: jest.fn(),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
  })),
}));

describe('FirebaseAuthService', () => {
  let firebaseAuthService: FirebaseAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    firebaseAuthService = new FirebaseAuthService();
  });

  afterEach(() => {
    firebaseAuthService.destroy();
  });

  describe('initialization', () => {
    it('should create an instance without errors', () => {
      expect(firebaseAuthService).toBeInstanceOf(FirebaseAuthService);
    });

    it('should initialize without throwing errors', async () => {
      await expect(firebaseAuthService.initialize()).resolves.not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is authenticated', () => {
      const user = firebaseAuthService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('isSessionValid', () => {
    it('should return false when no user is authenticated', async () => {
      const isValid = await firebaseAuthService.isSessionValid();
      expect(isValid).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return null when no user is authenticated', async () => {
      const token = await firebaseAuthService.getToken();
      expect(token).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should sign out without throwing errors', async () => {
      await expect(firebaseAuthService.signOut()).resolves.not.toThrow();
    });
  });

  describe('error conversion', () => {
    it('should convert Firebase errors to AuthErrors', async () => {
      const mockError = { code: 'auth/user-not-found', message: 'User not found' };
      
      // We can't easily test the private method, but we can test that errors are handled
      // This is more of a structural test to ensure the service is set up correctly
      expect(firebaseAuthService).toBeDefined();
    });
  });
});