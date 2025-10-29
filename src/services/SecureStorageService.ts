import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { SessionStorage } from './AuthenticationService';

/**
 * Secure storage service implementation using AsyncStorage
 * Provides secure token and user data management
 * 
 * Requirements: 1.3, 1.4, 1.5
 */
export class SecureStorageService implements SessionStorage {
  private static readonly ACCESS_TOKEN_KEY = '@swipely_access_token';
  private static readonly REFRESH_TOKEN_KEY = '@swipely_refresh_token';
  private static readonly USER_DATA_KEY = '@swipely_user_data';
  private static readonly TOKEN_EXPIRY_KEY = '@swipely_token_expiry';

  /**
   * Store authentication tokens securely
   */
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      await Promise.all([
        AsyncStorage.setItem(SecureStorageService.ACCESS_TOKEN_KEY, accessToken),
        AsyncStorage.setItem(SecureStorageService.REFRESH_TOKEN_KEY, refreshToken),
        AsyncStorage.setItem(SecureStorageService.TOKEN_EXPIRY_KEY, expiryTime.toISOString()),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(SecureStorageService.ACCESS_TOKEN_KEY);
      
      if (!token) {
        return null;
      }

      // Check if token is expired
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        await this.clearTokens();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Retrieve stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(SecureStorageService.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Clear all stored authentication data
   */
  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SecureStorageService.ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(SecureStorageService.REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(SecureStorageService.TOKEN_EXPIRY_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  /**
   * Store user data
   */
  async storeUser(user: User): Promise<void> {
    try {
      const userData = JSON.stringify(user);
      await AsyncStorage.setItem(SecureStorageService.USER_DATA_KEY, userData);
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve stored user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(SecureStorageService.USER_DATA_KEY);
      
      if (!userData) {
        return null;
      }

      const user = JSON.parse(userData);
      
      // Convert date strings back to Date objects
      if (user.createdAt) {
        user.createdAt = new Date(user.createdAt);
      }
      if (user.lastActiveAt) {
        user.lastActiveAt = new Date(user.lastActiveAt);
      }
      if (user.swipeHistory) {
        user.swipeHistory = user.swipeHistory.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp),
        }));
      }

      return user;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * Clear stored user data
   */
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SecureStorageService.USER_DATA_KEY);
    } catch (error) {
      console.error('Failed to clear user data:', error);
      throw new Error('Failed to clear user data');
    }
  }

  /**
   * Check if the stored token is expired
   */
  private async isTokenExpired(): Promise<boolean> {
    try {
      const expiryString = await AsyncStorage.getItem(SecureStorageService.TOKEN_EXPIRY_KEY);
      
      if (!expiryString) {
        return true;
      }

      const expiryTime = new Date(expiryString);
      return new Date() >= expiryTime;
    } catch (error) {
      console.error('Failed to check token expiry:', error);
      return true;
    }
  }

  /**
   * Clear all stored data (tokens and user data)
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.clearTokens(),
        this.clearUser(),
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear all stored data');
    }
  }
}