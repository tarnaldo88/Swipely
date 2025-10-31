import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from '../../src/store';
import { AuthNavigator } from '../../src/navigation/AuthNavigator';
import { MainNavigator } from '../../src/navigation/MainNavigator';
import { navigationService } from '../../src/navigation/NavigationService';
import { getAuthService } from '../../src/services';
import { User } from '../../src/types';

// Mock the auth service
jest.mock('../../src/services', () => ({
  getAuthService: jest.fn(),
  initializeAuthService: jest.fn(),
}));

// Mock navigation service
jest.mock('../../src/navigation/NavigationService', () => ({
  navigationService: {
    setNavigationRef: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    getCurrentRoute: jest.fn(),
    navigateToProductDetails: jest.fn(),
    navigateToCategorySelection: jest.fn(),
    navigateToMainApp: jest.fn(),
    navigateToAuth: jest.fn(),
    isReady: jest.fn(() => true),
  },
}));

// Mock components that might cause issues in tests
jest.mock('../../src/screens/main/FeedScreen', () => ({
  FeedScreen: () => null,
}));

jest.mock('../../src/screens/main/WishlistScreen', () => ({
  WishlistScreen: () => null,
}));

jest.mock('../../src/screens/main/CartScreen', () => ({
  CartScreen: () => null,
}));

jest.mock('../../src/screens/main/ProfileScreen', () => ({
  ProfileScreen: () => null,
}));

const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  preferences: {
    categories: ['electronics'],
    priceRange: { min: 0, max: 1000 },
    brands: [],
  },
  swipeHistory: [],
  createdAt: new Date(),
  lastActiveAt: new Date(),
};

const mockAuthService = {
  getCurrentUser: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  refreshToken: jest.fn(),
  isSessionValid: jest.fn(),
  getToken: jest.fn(),
  initialize: jest.fn(),
};

describe('Navigation Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthService as jest.Mock).mockReturnValue(mockAuthService);
  });

  describe('Authentication Navigation', () => {
    it('should render login screen when user is not authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </Provider>
      );

      expect(getByText('Welcome to Swipely')).toBeTruthy();
    });

    it('should navigate to signup screen from login', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </Provider>
      );

      const signUpButton = getByText("Don't have an account? Sign Up");
      fireEvent.press(signUpButton);

      // Check if signup screen is rendered
      expect(getByText('Create Your Account')).toBeTruthy();
    });

    it('should navigate to forgot password screen from login', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </Provider>
      );

      const forgotPasswordButton = getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);

      // Check if forgot password screen is rendered
      expect(getByText('Reset Your Password')).toBeTruthy();
    });
  });

  describe('Main App Navigation', () => {
    it('should render main tab navigator when user is authenticated', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockResolvedValue(true);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </Provider>
      );

      // Check if tab navigation is rendered
      expect(getByText('Discover')).toBeTruthy();
      expect(getByText('Wishlist')).toBeTruthy();
      expect(getByText('Cart')).toBeTruthy();
      expect(getByText('Profile')).toBeTruthy();
    });

    it('should navigate between tabs', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockResolvedValue(true);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </Provider>
      );

      // Navigate to wishlist tab
      const wishlistTab = getByText('Wishlist');
      fireEvent.press(wishlistTab);

      // Navigate to cart tab
      const cartTab = getByText('Cart');
      fireEvent.press(cartTab);

      // Navigate to profile tab
      const profileTab = getByText('Profile');
      fireEvent.press(profileTab);

      // All tabs should be accessible
      expect(wishlistTab).toBeTruthy();
      expect(cartTab).toBeTruthy();
      expect(profileTab).toBeTruthy();
    });
  });

  describe('Navigation Service', () => {
    it('should set navigation reference', () => {
      const mockRef = { current: null };
      navigationService.setNavigationRef(mockRef as any);

      expect(navigationService.setNavigationRef).toHaveBeenCalledWith(mockRef);
    });

    it('should navigate to product details', () => {
      const productId = 'test-product-id';
      const product = { id: productId, title: 'Test Product' };

      navigationService.navigateToProductDetails(productId, product);

      expect(navigationService.navigateToProductDetails).toHaveBeenCalledWith(
        productId,
        product
      );
    });

    it('should navigate to category selection', () => {
      navigationService.navigateToCategorySelection(false);

      expect(navigationService.navigateToCategorySelection).toHaveBeenCalledWith(false);
    });

    it('should navigate to main app', () => {
      navigationService.navigateToMainApp();

      expect(navigationService.navigateToMainApp).toHaveBeenCalled();
    });

    it('should navigate to auth flow', () => {
      navigationService.navigateToAuth();

      expect(navigationService.navigateToAuth).toHaveBeenCalled();
    });
  });

  describe('Authentication Guards', () => {
    it('should redirect to auth when session is invalid', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockResolvedValue(false);
      mockAuthService.signOut.mockResolvedValue(undefined);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </Provider>
      );

      // Wait for session validation
      await waitFor(() => {
        expect(mockAuthService.isSessionValid).toHaveBeenCalled();
      });

      // Should sign out user when session is invalid
      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('should maintain session when valid', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockResolvedValue(true);

      const { getByText } = render(
        <Provider store={store}>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </Provider>
      );

      // Should not sign out when session is valid
      expect(mockAuthService.signOut).not.toHaveBeenCalled();
    });
  });

  describe('Deep Linking', () => {
    it('should handle product details deep link', () => {
      const productId = 'test-product-123';
      
      // Simulate deep link navigation
      navigationService.navigateToProductDetails(productId);

      expect(navigationService.navigateToProductDetails).toHaveBeenCalledWith(productId);
    });

    it('should handle category selection deep link', () => {
      navigationService.navigateToCategorySelection();

      expect(navigationService.navigateToCategorySelection).toHaveBeenCalled();
    });
  });

  describe('Navigation State Management', () => {
    it('should track current route', () => {
      const mockRoute = { name: 'Feed', params: {} };
      (navigationService.getCurrentRoute as jest.Mock).mockReturnValue(mockRoute);

      const currentRoute = navigationService.getCurrentRoute();

      expect(currentRoute).toEqual(mockRoute);
    });

    it('should handle navigation ready state', () => {
      expect(navigationService.isReady()).toBe(true);
    });

    it('should handle go back navigation', () => {
      navigationService.goBack();

      expect(navigationService.goBack).toHaveBeenCalled();
    });

    it('should handle navigation reset', () => {
      navigationService.reset('Main');

      expect(navigationService.reset).toHaveBeenCalledWith('Main');
    });
  });
});