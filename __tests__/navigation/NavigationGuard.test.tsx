import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NavigationGuard } from '../../src/navigation/NavigationGuard';
import { getAuthService } from '../../src/services';
import { User } from '../../src/types';

// Mock the auth service
jest.mock('../../src/services', () => ({
  getAuthService: jest.fn(),
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
  isSessionValid: jest.fn(),
  signOut: jest.fn(),
};

const TestComponent = () => <Text>Protected Content</Text>;
const FallbackComponent = () => <Text>Fallback Content</Text>;

describe('NavigationGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthService as jest.Mock).mockReturnValue(mockAuthService);
  });

  describe('Authentication Required', () => {
    it('should render children when user is authenticated and session is valid', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockResolvedValue(true);

      const { getByText } = render(
        <NavigationGuard requireAuth={true}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });

      expect(mockAuthService.isSessionValid).toHaveBeenCalled();
      expect(mockAuthService.signOut).not.toHaveBeenCalled();
    });

    it('should sign out user when session is invalid', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockResolvedValue(false);
      mockAuthService.signOut.mockResolvedValue(undefined);

      const { getByText } = render(
        <NavigationGuard requireAuth={true}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Authentication required')).toBeTruthy();
      });

      expect(mockAuthService.isSessionValid).toHaveBeenCalled();
      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('should show unauthorized message when user is not authenticated', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const { getByText } = render(
        <NavigationGuard requireAuth={true}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Authentication required')).toBeTruthy();
      });

      expect(mockAuthService.isSessionValid).not.toHaveBeenCalled();
    });

    it('should render fallback when provided and user is not authenticated', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const { getByText } = render(
        <NavigationGuard requireAuth={true} fallback={<FallbackComponent />}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Fallback Content')).toBeTruthy();
      });
    });
  });

  describe('No Authentication Required', () => {
    it('should render children when user is not authenticated', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);

      const { getByText } = render(
        <NavigationGuard requireAuth={false}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeTruthy();
      });
    });

    it('should show already authenticated message when user is authenticated', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      const { getByText } = render(
        <NavigationGuard requireAuth={false}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Already authenticated')).toBeTruthy();
      });
    });

    it('should render fallback when provided and user is authenticated', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);

      const { getByText } = render(
        <NavigationGuard requireAuth={false} fallback={<FallbackComponent />}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Fallback Content')).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      const { getByText } = render(
        <NavigationGuard requireAuth={true}>
          <TestComponent />
        </NavigationGuard>
      );

      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle auth service errors gracefully', async () => {
      mockAuthService.getCurrentUser.mockImplementation(() => {
        throw new Error('Auth service error');
      });

      const { getByText } = render(
        <NavigationGuard requireAuth={true}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Authentication required')).toBeTruthy();
      });
    });

    it('should handle session validation errors', async () => {
      mockAuthService.getCurrentUser.mockReturnValue(mockUser);
      mockAuthService.isSessionValid.mockRejectedValue(new Error('Session validation error'));

      const { getByText } = render(
        <NavigationGuard requireAuth={true}>
          <TestComponent />
        </NavigationGuard>
      );

      await waitFor(() => {
        expect(getByText('Authentication required')).toBeTruthy();
      });
    });
  });
});