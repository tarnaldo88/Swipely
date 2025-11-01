/**
 * Tests for useErrorHandler hook
 * Requirements: 1.4, 3.1, 6.5
 */

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useErrorHandler, useAsyncOperation, useNetworkRequest } from '../../src/hooks/useErrorHandler';
import { ErrorFactory } from '../../src/utils/ErrorFactory';
import { ErrorType, ErrorSeverity } from '../../src/types/errors';

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock ErrorHandlingService
const mockHandleError = jest.fn();
const mockExecuteWithRetry = jest.fn();
const mockAddErrorListener = jest.fn(() => jest.fn()); // Returns unsubscribe function

jest.mock('../../src/services/ErrorHandlingService', () => ({
  ErrorHandlingService: {
    getInstance: jest.fn(() => ({
      handleError: mockHandleError,
      executeWithRetry: mockExecuteWithRetry,
      addErrorListener: mockAddErrorListener,
      getUserMessage: jest.fn((error) => error.userMessage || 'Default error message'),
      createRecoveryActions: jest.fn(() => []),
    })),
  },
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize without errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      expect(result.current).toHaveProperty('handleError');
      expect(result.current).toHaveProperty('executeWithRetry');
      expect(result.current).toHaveProperty('showErrorAlert');
    });

    it('should add error listener on mount', () => {
      renderHook(() => useErrorHandler());
      
      expect(mockAddErrorListener).toHaveBeenCalledTimes(1);
      expect(mockAddErrorListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('handleError', () => {
    it('should handle error through service', async () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };
      
      await act(async () => {
        await result.current.handleError(error, context);
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        context,
        expect.objectContaining({
          showToUser: true,
        })
      );
    });

    it('should respect showUserNotifications option', async () => {
      const { result } = renderHook(() => 
        useErrorHandler({ showUserNotifications: false })
      );
      
      const error = new Error('Test error');
      
      await act(async () => {
        await result.current.handleError(error);
      });

      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        undefined,
        expect.objectContaining({
          showToUser: false,
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      mockHandleError.mockRejectedValueOnce(new Error('Service error'));
      
      const { result } = renderHook(() => useErrorHandler());
      
      const error = new Error('Test error');
      
      await act(async () => {
        await result.current.handleError(error);
      });

      // Should not throw even if service fails
      expect(console.error).toHaveBeenCalledWith(
        'Error in error handler:',
        expect.any(Error)
      );
    });
  });

  describe('executeWithRetry', () => {
    it('should execute operation with retry when enabled', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      mockExecuteWithRetry.mockResolvedValue('success');
      
      const { result } = renderHook(() => useErrorHandler({ enableRetry: true }));
      
      let operationResult;
      await act(async () => {
        operationResult = await result.current.executeWithRetry(
          operation,
          'test-operation',
          { context: 'test' }
        );
      });

      expect(operationResult).toBe('success');
      expect(mockExecuteWithRetry).toHaveBeenCalledWith(
        operation,
        'test-operation',
        { context: 'test' }
      );
    });

    it('should execute operation without retry when disabled', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const { result } = renderHook(() => useErrorHandler({ enableRetry: false }));
      
      let operationResult;
      await act(async () => {
        operationResult = await result.current.executeWithRetry(
          operation,
          'test-operation'
        );
      });

      expect(operationResult).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockExecuteWithRetry).not.toHaveBeenCalled();
    });

    it('should handle operation errors when retry is disabled', async () => {
      const error = new Error('Operation error');
      const operation = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => useErrorHandler({ enableRetry: false }));
      
      await act(async () => {
        await expect(
          result.current.executeWithRetry(operation, 'test-operation')
        ).rejects.toThrow('Operation error');
      });

      expect(mockHandleError).toHaveBeenCalledWith(error, undefined);
    });
  });

  describe('showErrorAlert', () => {
    it('should show simple alert for errors without recovery actions', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const error = ErrorFactory.createAppError(
        ErrorType.NETWORK_ERROR,
        'Network error',
        { userMessage: 'Network connection failed' }
      );

      act(() => {
        result.current.showErrorAlert(error);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Network connection failed',
        [{ text: 'OK', style: 'default' }]
      );
    });

    it('should show alert with recovery actions', () => {
      const { result } = renderHook(() => useErrorHandler());
      
      const error = ErrorFactory.createAppError(
        ErrorType.NETWORK_ERROR,
        'Network error'
      );

      const recoveryActions = [
        {
          type: 'retry' as const,
          label: 'Try Again',
          action: jest.fn(),
        },
      ];

      act(() => {
        result.current.showErrorAlert(error, recoveryActions);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Default error message',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'Try Again',
            style: 'default',
          }),
          expect.objectContaining({
            text: 'Cancel',
            style: 'cancel',
          }),
        ])
      );
    });

    it('should use custom error messages', () => {
      const { result } = renderHook(() => 
        useErrorHandler({
          customErrorMessages: {
            [ErrorType.NETWORK_ERROR]: 'Custom network error message',
          },
        })
      );
      
      const error = ErrorFactory.createAppError(
        ErrorType.NETWORK_ERROR,
        'Network error'
      );

      act(() => {
        result.current.showErrorAlert(error);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Custom network error message',
        expect.any(Array)
      );
    });
  });
});

describe('useAsyncOperation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteWithRetry.mockImplementation((operation) => operation());
  });

  it('should execute async operation successfully', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => 
      useAsyncOperation(operation, [], {
        operationId: 'test-async',
        context: { component: 'TestComponent' },
      })
    );

    let operationResult;
    await act(async () => {
      operationResult = await result.current.execute();
    });

    expect(operationResult).toBe('success');
    expect(mockExecuteWithRetry).toHaveBeenCalledWith(
      operation,
      'test-async',
      { component: 'TestComponent' }
    );
  });

  it('should return null on operation failure', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
    mockExecuteWithRetry.mockRejectedValue(new Error('Operation failed'));
    
    const { result } = renderHook(() => useAsyncOperation(operation));

    let operationResult;
    await act(async () => {
      operationResult = await result.current.execute();
    });

    expect(operationResult).toBeNull();
  });

  it('should use default operation ID', async () => {
    const operation = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => useAsyncOperation(operation));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockExecuteWithRetry).toHaveBeenCalledWith(
      operation,
      'async-operation',
      undefined
    );
  });
});

describe('useNetworkRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteWithRetry.mockImplementation((operation) => operation());
  });

  it('should execute network request successfully', async () => {
    const requestFn = jest.fn().mockResolvedValue({ data: 'response' });
    
    const { result } = renderHook(() => 
      useNetworkRequest(requestFn, {
        requestId: 'test-request',
        endpoint: '/api/test',
        method: 'GET',
      })
    );

    let requestResult;
    await act(async () => {
      requestResult = await result.current.execute();
    });

    expect(requestResult).toEqual({ data: 'response' });
    expect(mockExecuteWithRetry).toHaveBeenCalledWith(
      requestFn,
      'test-request',
      { endpoint: '/api/test', method: 'GET' }
    );
  });

  it('should return null on request failure', async () => {
    const requestFn = jest.fn().mockRejectedValue(new Error('Network error'));
    mockExecuteWithRetry.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useNetworkRequest(requestFn));

    let requestResult;
    await act(async () => {
      requestResult = await result.current.execute();
    });

    expect(requestResult).toBeNull();
  });

  it('should use default request ID', async () => {
    const requestFn = jest.fn().mockResolvedValue('success');
    
    const { result } = renderHook(() => useNetworkRequest(requestFn));

    await act(async () => {
      await result.current.execute();
    });

    expect(mockExecuteWithRetry).toHaveBeenCalledWith(
      requestFn,
      'network-request',
      { endpoint: undefined, method: undefined }
    );
  });
});