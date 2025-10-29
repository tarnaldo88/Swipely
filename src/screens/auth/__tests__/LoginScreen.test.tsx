import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../LoginScreen';
import { getAuthService } from '../../../services';
import { AuthError, AuthErrorType } from '../../../services/AuthenticationService';

// Mock the auth service
jest.mock('../../../services', () => ({
  getAuthService: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

describe('LoginScreen', () => {
  let mockAuthService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthService = {
      signIn: jest.fn(),
    };
    
    (getAuthService as jest.Mock).mockReturnValue(mockAuthService);
  });

  const renderLoginScreen = () => {
    return render(<LoginScreen navigation={mockNavigation as any} />);
  };

  describe('UI Rendering', () => {
    it('should render login form elements', () => {
      const { getByText, getByPlaceholderText } = renderLoginScreen();

      expect(getByText('Welcome to Swipely')).toBeTruthy();
      expect(getByText('Sign in to discover amazing products')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Phone')).toBeTruthy();
      expect(getByPlaceholderText('Email address')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should render social login buttons', () => {
      const { getByText } = renderLoginScreen();

      expect(getByText('Or continue with')).toBeTruthy();
      expect(getByText('Google')).toBeTruthy();
      expect(getByText('Facebook')).toBeTruthy();
    });

    it('should render navigation links', () => {
      const { getByText } = renderLoginScreen();

      expect(getByText('Forgot Password?')).toBeTruthy();
      expect(getByText("Don't have an account? ")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });
  });

  describe('Form Interaction', () => {
    it('should switch between email and phone login methods', () => {
      const { getByText, getByPlaceholderText } = renderLoginScreen();

      // Initially should show email placeholder
      expect(getByPlaceholderText('Email address')).toBeTruthy();

      // Switch to phone
      fireEvent.press(getByText('Phone'));
      expect(getByPlaceholderText('Phone number')).toBeTruthy();

      // Switch back to email
      fireEvent.press(getByText('Email'));
      expect(getByPlaceholderText('Email address')).toBeTruthy();
    });

    it('should update input values', () => {
      const { getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const { getByText, getByPlaceholderText } = renderLoginScreen();

      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your email or phone number');
    });

    it('should show error when password is empty', async () => {
      const { getByText, getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText('Email address');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(signInButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your password');
    });
  });

  describe('Authentication Flow', () => {
    it('should call auth service with correct credentials on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        preferences: { categories: [], priceRange: { min: 0, max: 1000 }, brands: [] },
        swipeHistory: [],
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };

      mockAuthService.signIn.mockResolvedValueOnce({
        user: mockUser,
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      const { getByText, getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          provider: 'email',
        });
      });
    });

    it('should show error message on authentication failure', async () => {
      const authError = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid email or password'
      );

      mockAuthService.signIn.mockRejectedValueOnce(authError);

      const { getByText, getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid email or password');
      });
    });

    it('should show loading state during authentication', async () => {
      let resolveAuth: any;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });

      mockAuthService.signIn.mockReturnValueOnce(authPromise);

      const { getByText, getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const signInButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(signInButton);

      // Should show loading text
      expect(getByText('Signing In...')).toBeTruthy();

      // Resolve the promise
      resolveAuth({
        user: { id: '1', email: 'test@example.com' },
        token: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(),
      });

      await waitFor(() => {
        expect(getByText('Sign In')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to SignUp screen when sign up link is pressed', () => {
      const { getByText } = renderLoginScreen();

      fireEvent.press(getByText('Sign Up'));

      expect(mockNavigate).toHaveBeenCalledWith('SignUp');
    });

    it('should navigate to ForgotPassword screen when forgot password link is pressed', () => {
      const { getByText } = renderLoginScreen();

      fireEvent.press(getByText('Forgot Password?'));

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('Social Login', () => {
    it('should handle Google login', async () => {
      mockAuthService.signIn.mockResolvedValueOnce({
        user: { id: '1', email: 'google@example.com' },
        token: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(),
      });

      const { getByText } = renderLoginScreen();

      fireEvent.press(getByText('Google'));

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith({
          email: 'google@example.com',
          password: 'social_auth_token',
          provider: 'google',
        });
      });
    });

    it('should handle Facebook login', async () => {
      mockAuthService.signIn.mockResolvedValueOnce({
        user: { id: '1', email: 'facebook@example.com' },
        token: 'token',
        refreshToken: 'refresh',
        expiresAt: new Date(),
      });

      const { getByText } = renderLoginScreen();

      fireEvent.press(getByText('Facebook'));

      await waitFor(() => {
        expect(mockAuthService.signIn).toHaveBeenCalledWith({
          email: 'facebook@example.com',
          password: 'social_auth_token',
          provider: 'facebook',
        });
      });
    });
  });
});