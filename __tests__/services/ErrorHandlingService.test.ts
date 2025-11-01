/**
 * Tests for ErrorHandlingService
 * Requirements: 1.4, 3.1, 6.5
 */

import { ErrorHandlingService } from '../../src/services/ErrorHandlingService';
import { ErrorFactory } from '../../src/utils/ErrorFactory';
import { ErrorType, ErrorSeverity } from '../../src/types/errors';

// Mock console methods to avoid noise in tests
const originalConsole = console;
beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.log = originalConsole.log;
});

describe('ErrorHandlingService', () => {
  let errorHandlingService: ErrorHandlingService;

  beforeEach(() => {
    // Reset singleton instance for each test
    (ErrorHandlingService as any).instance = null;
    errorHandlingService = ErrorHandlingService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ErrorHandlingService.getInstance();
      const instance2 = ErrorHandlingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('handleError', () => {
    it('should handle AppError correctly', async () => {
      const error = ErrorFactory.createAppError(
        ErrorType.NETWORK_ERROR,
        'Test network error',
        { severity: ErrorSeverity.HIGH }
      );

      await expect(errorHandlingService.handleError(error)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[NETWORK_ERROR] Test network error'),
        expect.any(Object)
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');

      await expect(errorHandlingService.handleError(error)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[UNKNOWN_ERROR] Unknown error'),
        expect.any(Object)
      );
    });

    it('should handle string errors', async () => {
      const error = 'String error message';

      await expect(errorHandlingService.handleError(error)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[UNKNOWN_ERROR] String error message'),
        expect.any(Object)
      );
    });

    it('should call error listeners', async () => {
      const listener = jest.fn();
      const unsubscribe = errorHandlingService.addErrorListener(listener);

      const error = ErrorFactory.createAppError(
        ErrorType.VALIDATION_ERROR,
        'Test validation error'
      );

      await errorHandlingService.handleError(error);

      expect(listener).toHaveBeenCalledWith(error);
      unsubscribe();
    });
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await errorHandlingService.executeWithRetry(
        operation,
        'test-operation'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const retryableError = ErrorFactory.createNetworkError(
        'Network timeout',
        { statusCode: 504, retryable: true }
      );

      const operation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const result = await errorHandlingService.executeWithRetry(
        operation,
        'test-operation'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = ErrorFactory.createValidationError(
        'Invalid input',
        { field: 'email' }
      );

      const operation = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(
        errorHandlingService.executeWithRetry(operation, 'test-operation')
      ).rejects.toThrow('Invalid input');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const retryableError = ErrorFactory.createNetworkError(
        'Network error',
        { retryable: true }
      );

      const operation = jest.fn().mockRejectedValue(retryableError);

      await expect(
        errorHandlingService.executeWithRetry(operation, 'test-operation')
      ).rejects.toThrow('Network error');

      expect(operation).toHaveBeenCalledTimes(3); // Default max attempts
    });
  });

  describe('addErrorListener', () => {
    it('should add and remove error listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsubscribe1 = errorHandlingService.addErrorListener(listener1);
      const unsubscribe2 = errorHandlingService.addErrorListener(listener2);

      // Trigger error to test listeners
      const error = ErrorFactory.createAppError(ErrorType.UNKNOWN_ERROR, 'Test');
      errorHandlingService.handleError(error);

      expect(listener1).toHaveBeenCalledWith(error);
      expect(listener2).toHaveBeenCalledWith(error);

      // Remove first listener
      unsubscribe1();
      listener1.mockClear();
      listener2.mockClear();

      // Trigger another error
      errorHandlingService.handleError(error);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith(error);

      unsubscribe2();
    });

    it('should handle listener errors gracefully', async () => {
      const faultyListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });

      errorHandlingService.addErrorListener(faultyListener);

      const error = ErrorFactory.createAppError(ErrorType.UNKNOWN_ERROR, 'Test');
      
      // Should not throw even if listener throws
      await expect(errorHandlingService.handleError(error)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Error in error listener:',
        expect.any(Error)
      );
    });
  });

  describe('createRecoveryActions', () => {
    it('should create retry action for retryable errors', () => {
      const error = ErrorFactory.createNetworkError(
        'Network error',
        { retryable: true }
      );

      const actions = errorHandlingService.createRecoveryActions(error);
      
      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('retry');
      expect(actions[0].label).toBe('Try Again');
    });

    it('should create refresh action for data errors', () => {
      const error = ErrorFactory.createAppError(
        ErrorType.DATA_SYNC_ERROR,
        'Data sync failed'
      );

      const actions = errorHandlingService.createRecoveryActions(error);
      
      expect(actions.some(action => action.type === 'refresh')).toBe(true);
    });

    it('should create logout action for auth errors', () => {
      const error = ErrorFactory.createAuthError(
        'Session expired'
      );

      const actions = errorHandlingService.createRecoveryActions(error);
      
      expect(actions.some(action => action.type === 'logout')).toBe(true);
    });
  });

  describe('getUserMessage', () => {
    it('should return custom user message if provided', () => {
      const error = ErrorFactory.createAppError(
        ErrorType.NETWORK_ERROR,
        'Internal error',
        { userMessage: 'Custom user message' }
      );

      const message = errorHandlingService.getUserMessage(error);
      expect(message).toBe('Custom user message');
    });

    it('should return default message for error type', () => {
      const error = ErrorFactory.createAppError(
        ErrorType.NETWORK_ERROR,
        'Internal error'
      );

      const message = errorHandlingService.getUserMessage(error);
      expect(message).toBe('Network connection failed. Please check your internet connection.');
    });

    it('should return fallback message for unknown error type', () => {
      const error = ErrorFactory.createAppError(
        'CUSTOM_ERROR_TYPE' as ErrorType,
        'Custom error'
      );

      const message = errorHandlingService.getUserMessage(error);
      expect(message).toBe('An error occurred. Please try again.');
    });
  });
});

describe('ErrorFactory', () => {
  beforeEach(() => {
    ErrorFactory.setSessionId('test-session');
    ErrorFactory.setUserId('test-user');
  });

  describe('createAppError', () => {
    it('should create error with all properties', () => {
      const error = ErrorFactory.createAppError(
        ErrorType.VALIDATION_ERROR,
        'Test error',
        {
          severity: ErrorSeverity.HIGH,
          code: 'TEST_001',
          context: { field: 'email' },
          retryable: true,
          userMessage: 'User friendly message',
        }
      );

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe('TEST_001');
      expect(error.context).toEqual({ field: 'email' });
      expect(error.retryable).toBe(true);
      expect(error.userMessage).toBe('User friendly message');
      expect(error.userId).toBe('test-user');
      expect(error.sessionId).toBe('test-session');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use default values', () => {
      const error = ErrorFactory.createAppError(
        ErrorType.UNKNOWN_ERROR,
        'Test error'
      );

      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.retryable).toBe(false);
      expect(error.context).toEqual({});
    });
  });

  describe('createNetworkError', () => {
    it('should create network error with status code', () => {
      const error = ErrorFactory.createNetworkError(
        'Request failed',
        {
          statusCode: 500,
          endpoint: '/api/products',
          method: 'GET',
        }
      );

      expect(error.type).toBe(ErrorType.SERVER_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('/api/products');
      expect(error.method).toBe('GET');
      expect(error.retryable).toBe(true);
    });

    it('should determine error type from status code', () => {
      const timeoutError = ErrorFactory.createNetworkError('Timeout', { statusCode: 408 });
      expect(timeoutError.type).toBe(ErrorType.CONNECTION_TIMEOUT);

      const clientError = ErrorFactory.createNetworkError('Not found', { statusCode: 404 });
      expect(clientError.type).toBe(ErrorType.API_ERROR);

      const serverError = ErrorFactory.createNetworkError('Server error', { statusCode: 500 });
      expect(serverError.type).toBe(ErrorType.SERVER_ERROR);
    });
  });

  describe('createAuthError', () => {
    it('should create auth error', () => {
      const error = ErrorFactory.createAuthError(
        'Invalid credentials',
        { provider: 'email' }
      );

      expect(error.type).toBe(ErrorType.AUTH_ERROR);
      expect(error.provider).toBe('email');
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.retryable).toBe(false);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error', () => {
      const error = ErrorFactory.createValidationError(
        'Invalid email format',
        {
          field: 'email',
          value: 'invalid-email',
          constraints: ['must be valid email'],
        }
      );

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.field).toBe('email');
      expect(error.value).toBe('invalid-email');
      expect(error.constraints).toEqual(['must be valid email']);
      expect(error.severity).toBe(ErrorSeverity.LOW);
    });
  });

  describe('wrapUnknownError', () => {
    it('should wrap Error object', () => {
      const originalError = new Error('Original error');
      const wrappedError = ErrorFactory.wrapUnknownError(originalError);

      expect(wrappedError.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(wrappedError.message).toBe('Original error');
      expect(wrappedError.context?.originalError).toEqual({
        name: 'Error',
        message: 'Original error',
      });
    });

    it('should wrap string error', () => {
      const wrappedError = ErrorFactory.wrapUnknownError('String error');

      expect(wrappedError.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(wrappedError.message).toBe('String error');
    });

    it('should return AppError as-is', () => {
      const appError = ErrorFactory.createAppError(
        ErrorType.VALIDATION_ERROR,
        'Validation error'
      );

      const result = ErrorFactory.wrapUnknownError(appError);
      expect(result).toBe(appError);
    });
  });
});