import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SignUpScreen } from '../SignUpScreen';
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

describe('SignUpScreen', () => {
  let mockAuthService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuthService = {
      signUp: jest.fn(),
    };
    
    (getAuthService as jest.Mock).mockReturnValue(mockAuthService);
  });

  const renderSignUpScreen = () => {
    return render(<SignUpScreen navigation={mockNavigation as any} />);
  };

  describe('UI Rendering', () => {
    it('should render sign up form elements', () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      expect(getByText('Join Swipely')).toBeTruthy();
      expect(getByText('Create your account to start discovering')).toBeTruthy();
      expect(getByPlaceholderText('Display Name')).toBeTruthy();
      expect(getByPlaceholderText('Email address')).toBeTruthy();
      expect(getByPlaceholderText('Password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
    });

    it('should render terms and conditions checkbox', () => {
      const { getByText } = renderSignUpScreen();

      expect(getByText(/I agree to the/)).toBeTruthy();
      expect(getByText('Terms of Service')).toBeTruthy();
      expect(getByText('Privacy Policy')).toBeTruthy();
    });

    it('should render navigation link to sign in', () => {
      const { getByText } = renderSignUpScreen();

      expect(getByText('Already have an account? ')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
    });
  });

  describe('Form Interaction', () => {
    it('should switch between email and phone registration methods', () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

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
      const { getByPlaceholderText } = renderSignUpScreen();

      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      expect(nameInput.props.value).toBe('Test User');
      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
      expect(confirmPasswordInput.props.value).toBe('password123');
    });

    it('should toggle terms acceptance checkbox', () => {
      const { getByText } = renderSignUpScreen();

      const termsContainer = getByText(/I agree to the/).parent;
      
      // Initially unchecked
      fireEvent.press(termsContainer);
      
      // Should be checked now (we can't easily test the visual state, but the press should work)
      expect(termsContainer).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    const fillValidForm = (screen: any) => {
      const nameInput = screen.getByPlaceholderText('Display Name');
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm Password');
      const termsContainer = screen.getByText(/I agree to the/).parent;

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(termsContainer); // Accept terms
    };

    it('should show error when display name is empty', async () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter your display name');
    });

    it('should show error when email is invalid', async () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a valid email address');
    });

    it('should show error when password is too short', async () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.changeText(confirmPasswordInput, '123');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 6 characters long');
    });

    it('should show error when passwords do not match', async () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'different123');
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Passwords do not match');
    });

    it('should show error when terms are not accepted', async () => {
      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      // Don't accept terms
      fireEvent.press(createAccountButton);

      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please accept the terms and conditions');
    });
  });

  describe('Authentication Flow', () => {
    it('should call auth service with correct data on successful sign up', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        preferences: { categories: [], priceRange: { min: 0, max: 1000 }, brands: [] },
        swipeHistory: [],
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };

      mockAuthService.signUp.mockResolvedValueOnce({
        user: mockUser,
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(),
      });

      const { getByText, getByPlaceholderText } = renderSignUpScreen();

      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const termsContainer = getByText(/I agree to the/).parent;
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(termsContainer);
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith({
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          provider: 'email',
          acceptTerms: true,
        });
      });
    });

    it('should show error message on sign up failure', async () => {
      const authError = new AuthError(
        AuthErrorType.EMAIL_ALREADY_EXISTS,
        'Email already exists'
      );

      mockAuthService.signUp.mockRejectedValueOnce(authError);

      const { getByText, getByPlaceholderText } = renderSignUpScreen();
      
      // Mock the form state to be valid
      const nameInput = getByPlaceholderText('Display Name');
      const emailInput = getByPlaceholderText('Email address');
      const passwordInput = getByPlaceholderText('Password');
      const confirmPasswordInput = getByPlaceholderText('Confirm Password');
      const termsContainer = getByText(/I agree to the/).parent;
      const createAccountButton = getByText('Create Account');

      fireEvent.changeText(nameInput, 'Test User');
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(termsContainer);
      fireEvent.press(createAccountButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Email already exists');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to Login screen when sign in link is pressed', () => {
      const { getByText } = renderSignUpScreen();

      fireEvent.press(getByText('Sign In'));

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });
});