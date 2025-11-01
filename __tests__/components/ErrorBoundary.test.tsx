/**
 * Tests for ErrorBoundary component
 * Requirements: 1.4, 3.1, 6.5
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary';
import { Text } from 'react-native';

// Mock ErrorHandlingService
jest.mock('../../src/services/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    getInstance: jest.fn(() => ({
      handleError: jest.fn(),
    })),
  },
}));

// Mock ErrorFactory
jest.mock('../../src/utils/ErrorFactory', () => ({
  ErrorFactory: {
    createAppError: jest.fn((type, message, options) => ({
      type,
      message,
      ...options,
    })),
  },
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <Text>No error</Text>;
};

// Component that throws an error in useEffect
const ThrowErrorInEffect: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      throw new Error('Effect error');
    }
  }, [shouldThrow]);
  
  return <Text>Component with effect</Text>;
};

describe('ErrorBoundary', () => {
  // Mock console.error to avoid noise in tests
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('No error')).toBeTruthy();
  });

  it('should render error UI when child component throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    expect(getByText(/We're sorry, but something unexpected happened/)).toBeTruthy();
  });

  it('should render custom fallback UI when provided', () => {
    const customFallback = (error: Error) => (
      <Text>Custom error: {error.message}</Text>
    );

    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom error: Test error')).toBeTruthy();
  });

  it('should call onError callback when provided', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should handle retry functionality', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Click retry button
    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content again
    expect(getByText('No error')).toBeTruthy();
  });

  it('should handle report error functionality', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reportButton = getByText('Report Issue');
    fireEvent.press(reportButton);

    // Should log error report (mocked console.log)
    expect(console.log).toHaveBeenCalledWith(
      'Error reported by user:',
      expect.objectContaining({
        error: 'Test error',
        stack: expect.any(String),
        componentStack: expect.any(String),
      })
    );
  });

  it('should show debug information in development mode', () => {
    // Mock __DEV__ to be true
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = true;

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Debug Information:')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();

    // Restore __DEV__
    (global as any).__DEV__ = originalDev;
  });

  it('should not show debug information in production mode', () => {
    // Mock __DEV__ to be false
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;

    const { queryByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(queryByText('Debug Information:')).toBeNull();

    // Restore __DEV__
    (global as any).__DEV__ = originalDev;
  });

  it('should handle multiple error boundaries', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Outer boundary</Text>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </ErrorBoundary>
    );

    // Inner boundary should catch the error
    expect(getByText('Oops! Something went wrong')).toBeTruthy();
    // Outer boundary should still render its content
    expect(getByText('Outer boundary')).toBeTruthy();
  });

  it('should reset error state when children change', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be shown
    expect(getByText('Oops! Something went wrong')).toBeTruthy();

    // Re-render with different children
    rerender(
      <ErrorBoundary>
        <Text>Different component</Text>
      </ErrorBoundary>
    );

    // Should show new content
    expect(getByText('Different component')).toBeTruthy();
  });

  // Note: Error boundaries don't catch errors in event handlers or async code
  it('should not catch errors in event handlers', () => {
    const ErrorInHandler: React.FC = () => {
      const handlePress = () => {
        throw new Error('Handler error');
      };

      return <Text onPress={handlePress}>Click me</Text>;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ErrorInHandler />
      </ErrorBoundary>
    );

    // Component should render normally
    expect(getByText('Click me')).toBeTruthy();

    // Pressing should throw error (not caught by boundary)
    expect(() => {
      fireEvent.press(getByText('Click me'));
    }).toThrow('Handler error');
  });
});

describe('withErrorBoundary HOC', () => {
  const { withErrorBoundary } = require('../../src/components/common/ErrorBoundary');

  it('should wrap component with error boundary', () => {
    const TestComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('HOC test error');
      }
      return <Text>HOC test component</Text>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    const { getByText } = render(<WrappedComponent shouldThrow={false} />);
    expect(getByText('HOC test component')).toBeTruthy();
  });

  it('should catch errors in wrapped component', () => {
    const TestComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('HOC test error');
      }
      return <Text>HOC test component</Text>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    const { getByText } = render(<WrappedComponent shouldThrow={true} />);
    expect(getByText('Oops! Something went wrong')).toBeTruthy();
  });

  it('should pass error boundary props to HOC', () => {
    const TestComponent: React.FC = () => <ThrowError shouldThrow={true} />;
    const onError = jest.fn();

    const WrappedComponent = withErrorBoundary(TestComponent, { onError });

    render(<WrappedComponent />);

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should set correct display name', () => {
    const TestComponent: React.FC = () => <Text>Test</Text>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});