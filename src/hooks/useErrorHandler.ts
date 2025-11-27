/**
 * React hook for error handling with user-friendly notifications
 * Requirements: 1.4, 5.5, 6.5
 */

import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { ErrorHandlingService } from '../services/ErrorHandlingService';
import { AppError, ErrorRecoveryAction, ErrorDisplayOptions } from '../types/errors';

interface UseErrorHandlerOptions {
  showUserNotifications?: boolean;
  enableRetry?: boolean;
  customErrorMessages?: Record<string, string>;
}

interface UseErrorHandlerReturn {
  handleError: (
    error: unknown, 
    context?: Record<string, any>, 
    options?: Partial<ErrorDisplayOptions>
  ) => Promise<void>;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    operationId: string,
    context?: Record<string, any>
  ) => Promise<T>;
  showErrorAlert: (error: AppError, recoveryActions?: ErrorRecoveryAction[]) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const errorHandlingService = useRef(ErrorHandlingService.getInstance());
  const {
    showUserNotifications = true,
    enableRetry = true,
    customErrorMessages = {},
  } = options;

  const showErrorAlert = useCallback((
    error: AppError, 
    recoveryActions?: ErrorRecoveryAction[]
  ) => {
    const message = customErrorMessages[error.type] || 
                   error.userMessage || 
                   errorHandlingService.current.getUserMessage(error);

    const actions = recoveryActions || errorHandlingService.current.createRecoveryActions(error);

    if (actions.length === 0) {
      // Simple alert with just OK button
      Alert.alert(
        'Error',
        message,
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      // Alert with recovery actions
      const alertButtons: any[] = actions.map(action => ({
        text: action.label,
        style: action.type === 'retry' ? 'default' : 'cancel',
        onPress: () => {
          try {
            action.action();
          } catch (actionError) {
            console.error('Error executing recovery action:', actionError);
          }
        },
      }));

      // Add cancel button if no cancel action exists
      if (!actions.some(action => action.type === 'ignore')) {
        alertButtons.push({
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {},
        });
      }

      Alert.alert(
        'Error',
        message,
        alertButtons
      );
    }
  }, [customErrorMessages]);

  const handleError = useCallback(async (
    error: unknown,
    context?: Record<string, any>,
    displayOptions?: Partial<ErrorDisplayOptions>
  ) => {
    const finalOptions: Partial<ErrorDisplayOptions> = {
      showToUser: showUserNotifications,
      ...displayOptions,
    };

    try {
      await errorHandlingService.current.handleError(error, context, finalOptions);
      
      // Show user alert if enabled and error should be shown to user
      if (showUserNotifications && finalOptions.showToUser) {
        const appError = error as AppError;
        if (appError && typeof appError === 'object' && 'type' in appError) {
          showErrorAlert(appError, finalOptions.recoveryActions);
        }
      }
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
    }
  }, [showUserNotifications, showErrorAlert]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId: string,
    context?: Record<string, any>
  ): Promise<T> => {
    if (!enableRetry) {
      try {
        return await operation();
      } catch (error) {
        await handleError(error, context);
        throw error;
      }
    }

    return errorHandlingService.current.executeWithRetry(operation, operationId, context);
  }, [enableRetry, handleError]);

  // Set up global error listener
  useEffect(() => {
    const unsubscribe = errorHandlingService.current.addErrorListener((error: AppError) => {
      // This could be used for additional error tracking or analytics
      console.debug('Global error captured:', error.type, error.message);
    });

    return unsubscribe;
  }, []);

  return {
    handleError,
    executeWithRetry,
    showErrorAlert,
  };
}

/**
 * Hook for handling async operations with automatic error handling
 */
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: UseErrorHandlerOptions & {
    operationId?: string;
    context?: Record<string, any>;
  } = {}
) {
  const { handleError, executeWithRetry } = useErrorHandler(options);
  const { operationId = 'async-operation', context } = options;

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      return await executeWithRetry(operation, operationId, context);
    } catch (error) {
      // Error is already handled by executeWithRetry
      return null;
    }
  }, [executeWithRetry, operation, operationId, context]);

  return { execute };
}

/**
 * Hook for handling network requests with automatic retry and error handling
 */
export function useNetworkRequest<T>(
  requestFn: () => Promise<T>,
  options: UseErrorHandlerOptions & {
    requestId?: string;
    endpoint?: string;
    method?: string;
  } = {}
) {
  const { handleError, executeWithRetry } = useErrorHandler(options);
  const { requestId = 'network-request', endpoint, method } = options;

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      return await executeWithRetry(
        requestFn, 
        requestId, 
        { endpoint, method }
      );
    } catch (error) {
      // Error is already handled by executeWithRetry
      return null;
    }
  }, [executeWithRetry, requestFn, requestId, endpoint, method]);

  return { execute };
}