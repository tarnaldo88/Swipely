import { AuthenticationServiceImpl } from '../AuthenticationServiceImpl';
import { SecureStorageService } from '../SecureStorageService';
import { AuthError, AuthErrorType } from '../AuthenticationService';
import { LoginCredentials, SignUpData, User } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();

// Mock SecureStorageService
jest.mock('../SecureStorageService');

describe('AuthenticationServiceImpl', () => {
  let authService: AuthenticationServiceImpl;
  let mockStorageService: jest.Mocked<SecureStorageService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    displayName: 'Test User',
    preferences: {
      categories: ['electronics'],
      priceRange: { min: 0, max: 1000 },
      brands: ['apple'],
    },
    swipeHistory: [],
    createdAt: new Date('2023-01-01'),
    lastActiveAt: new Date('2023-01-01'),
  };

  const mockAuthResult = {
    user: mockUser,
    token: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock storage service
    mockStorageService = new SecureStorageService() as jest.Mocked<SecureStorageService>;
    
    // Create auth service instance
    authService = new AuthenticationServiceImpl('http://localhost:3000');
    
    // Replace the storage service with our mock
    (authService as any).sessionStorage = mockStorageService;
  });

  describe('signIn', () => {
    const validCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
      provider: 'email',
    };

    it('should successfully sign in with valid credentials', async () => {
      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResult,
      });

      mockStorageService.storeTokens.mockResolvedValueOnce();
      mockStorageService.storeUser.mockResolvedValueOnce();

      const result = await authService.signIn(validCredentials);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/signin',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: validCredentials.email,
            password: validCredentials.password,
            provider: 'email',
          }),
        })
      );

      expect(mockStorageService.storeTokens).toHaveBeenCalledWith(
        mockAuthResult.token,
        mockAuthResult.refreshToken
      );
      expect(mockStorageService.storeUser).toHaveBeenCalledWith(mockAuthResult.user);
      expect(result).toEqual(mockAuthResult);
      expect(authService.getCurrentUser()).toEqual(mockAuthResult.user);
    });

    it('should throw AuthError for invalid credentials', async () => {
      // Mock API error response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(authService.signIn(validCredentials)).rejects.toThrow(AuthError);
      
      try {
        await authService.signIn(validCredentials);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).message).toBe('Invalid credentials');
      }
    });

    it('should throw AuthError for network errors', async () => {
      // Mock network error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.signIn(validCredentials)).rejects.toThrow(AuthError);
      
      try {
        await authService.signIn(validCredentials);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).type).toBe(AuthErrorType.NETWORK_ERROR);
      }
    });
  });

  describe('signUp', () => {
    const validSignUpData: SignUpData = {
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      provider: 'email',
    };

    it('should successfully sign up with valid data', async () => {
      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResult,
      });

      mockStorageService.storeTokens.mockResolvedValueOnce();
      mockStorageService.storeUser.mockResolvedValueOnce();

      const result = await authService.signUp(validSignUpData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/signup',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            displayName: validSignUpData.displayName,
            email: validSignUpData.email,
            password: validSignUpData.password,
            provider: 'email',
          }),
        })
      );

      expect(result).toEqual(mockAuthResult);
      expect(authService.getCurrentUser()).toEqual(mockAuthResult.user);
    });

    it('should throw AuthError for email already exists', async () => {
      // Mock API error response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Email already exists' }),
      });

      try {
        await authService.signUp(validSignUpData);
        fail('Expected AuthError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).message).toBe('Email already exists');
      }
    });
  });

  describe('signOut', () => {
    it('should successfully sign out and clear storage', async () => {
      mockStorageService.getAccessToken.mockResolvedValueOnce('mock-token');
      mockStorageService.clearAll.mockResolvedValueOnce();

      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await authService.signOut();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/signout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );

      expect(mockStorageService.clearAll).toHaveBeenCalled();
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should clear storage even if API call fails', async () => {
      mockStorageService.getAccessToken.mockResolvedValueOnce('mock-token');
      mockStorageService.clearAll.mockResolvedValueOnce();

      // Mock API error
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await authService.signOut();

      expect(mockStorageService.clearAll).toHaveBeenCalled();
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const newToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';

      mockStorageService.getRefreshToken.mockResolvedValueOnce('old-refresh-token');
      mockStorageService.storeTokens.mockResolvedValueOnce();

      // Mock successful API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: newToken,
          refreshToken: newRefreshToken,
        }),
      });

      const result = await authService.refreshToken();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ refreshToken: 'old-refresh-token' }),
        })
      );

      expect(mockStorageService.storeTokens).toHaveBeenCalledWith(newToken, newRefreshToken);
      expect(result).toBe(newToken);
    });

    it('should throw AuthError when no refresh token available', async () => {
      mockStorageService.getRefreshToken.mockResolvedValueOnce(null);

      await expect(authService.refreshToken()).rejects.toThrow(AuthError);
      
      try {
        await authService.refreshToken();
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).type).toBe(AuthErrorType.SESSION_EXPIRED);
      }
    });
  });

  describe('isSessionValid', () => {
    it('should return true when valid token exists', async () => {
      mockStorageService.getAccessToken.mockResolvedValueOnce('valid-token');

      const result = await authService.isSessionValid();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      mockStorageService.getAccessToken.mockResolvedValueOnce(null);

      const result = await authService.isSessionValid();

      expect(result).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should restore user session when valid', async () => {
      mockStorageService.getUser.mockResolvedValueOnce(mockUser);
      mockStorageService.getAccessToken.mockResolvedValueOnce('valid-token');

      await authService.initialize();

      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should clear invalid session data', async () => {
      mockStorageService.getUser.mockResolvedValueOnce(mockUser);
      mockStorageService.getAccessToken.mockResolvedValueOnce(null);
      mockStorageService.clearAll.mockResolvedValueOnce();

      await authService.initialize();

      expect(mockStorageService.clearAll).toHaveBeenCalled();
      expect(authService.getCurrentUser()).toBeNull();
    });
  });
});