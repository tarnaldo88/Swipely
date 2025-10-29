import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorageService } from '../SecureStorageService';
import { User } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('SecureStorageService', () => {
  let storageService: SecureStorageService;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    displayName: 'Test User',
    preferences: {
      categories: ['electronics'],
      priceRange: { min: 0, max: 1000 },
      brands: ['apple'],
    },
    swipeHistory: [
      {
        userId: '1',
        productId: 'product1',
        action: 'like',
        timestamp: new Date('2023-01-01'),
        sessionId: 'session1',
      },
    ],
    createdAt: new Date('2023-01-01'),
    lastActiveAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new SecureStorageService();
  });

  describe('storeTokens', () => {
    it('should store access token, refresh token, and expiry time', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.storeTokens(accessToken, refreshToken);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_access_token',
        accessToken
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_refresh_token',
        refreshToken
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_token_expiry',
        expect.any(String)
      );
    });

    it('should throw error when storage fails', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        storageService.storeTokens('token', 'refresh')
      ).rejects.toThrow('Failed to store authentication tokens');
    });
  });

  describe('getAccessToken', () => {
    it('should return access token when valid and not expired', async () => {
      const token = 'valid-token';
      const futureExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(token) // access token
        .mockResolvedValueOnce(futureExpiry); // expiry time

      const result = await storageService.getAccessToken();

      expect(result).toBe(token);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@swipely_access_token');
    });

    it('should return null when token is expired', async () => {
      const token = 'expired-token';
      const pastExpiry = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(token) // access token
        .mockResolvedValueOnce(pastExpiry); // expiry time

      mockAsyncStorage.removeItem.mockResolvedValue();

      const result = await storageService.getAccessToken();

      expect(result).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(3); // clearTokens called
    });

    it('should return null when no token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storageService.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token when it exists', async () => {
      const refreshToken = 'refresh-token';
      mockAsyncStorage.getItem.mockResolvedValueOnce(refreshToken);

      const result = await storageService.getRefreshToken();

      expect(result).toBe(refreshToken);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@swipely_refresh_token');
    });

    it('should return null when no refresh token exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storageService.getRefreshToken();

      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove all token-related items', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await storageService.clearTokens();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(3);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_access_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_refresh_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_token_expiry');
    });

    it('should throw error when removal fails', async () => {
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Removal error'));

      await expect(storageService.clearTokens()).rejects.toThrow(
        'Failed to clear authentication tokens'
      );
    });
  });

  describe('storeUser', () => {
    it('should store user data as JSON string', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();

      await storageService.storeUser(mockUser);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@swipely_user_data',
        JSON.stringify(mockUser)
      );
    });

    it('should throw error when storage fails', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await expect(storageService.storeUser(mockUser)).rejects.toThrow(
        'Failed to store user data'
      );
    });
  });

  describe('getUser', () => {
    it('should return user data with converted dates', async () => {
      const storedUserData = JSON.stringify(mockUser);
      mockAsyncStorage.getItem.mockResolvedValueOnce(storedUserData);

      const result = await storageService.getUser();

      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.lastActiveAt).toBeInstanceOf(Date);
      expect(result?.swipeHistory[0].timestamp).toBeInstanceOf(Date);
    });

    it('should return null when no user data exists', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce(null);

      const result = await storageService.getUser();

      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid-json');

      const result = await storageService.getUser();

      expect(result).toBeNull();
    });
  });

  describe('clearUser', () => {
    it('should remove user data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await storageService.clearUser();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_user_data');
    });

    it('should throw error when removal fails', async () => {
      mockAsyncStorage.removeItem.mockRejectedValueOnce(new Error('Removal error'));

      await expect(storageService.clearUser()).rejects.toThrow(
        'Failed to clear user data'
      );
    });
  });

  describe('clearAll', () => {
    it('should clear both tokens and user data', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue();

      await storageService.clearAll();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(4);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_access_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_refresh_token');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_token_expiry');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@swipely_user_data');
    });
  });
});