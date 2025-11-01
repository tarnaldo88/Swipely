/**
 * React hook for A/B testing functionality
 * Requirements: 3.3, 3.4
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ABTestingService, ABTestVariant } from '../services/ABTestingService';
import { useErrorHandler } from './useErrorHandler';

interface UseABTestingOptions {
  userId?: string;
  enableTracking?: boolean;
}

interface UseABTestingReturn {
  getVariant: (testId: string) => ABTestVariant | null;
  trackConversion: (testId: string, metric: string, value?: number) => Promise<void>;
  isInTest: (testId: string) => boolean;
  getTestConfig: (testId: string, configKey: string, defaultValue?: any) => any;
  getAllVariants: () => Record<string, ABTestVariant | null>;
}

export function useABTesting(options: UseABTestingOptions = {}): UseABTestingReturn {
  const { userId, enableTracking = true } = options;
  const [variants, setVariants] = useState<Record<string, ABTestVariant | null>>({});
  const abTestingService = useRef(ABTestingService.getInstance());
  const { handleError } = useErrorHandler();
  const loadedTests = useRef<Set<string>>(new Set());

  const getVariant = useCallback((testId: string): ABTestVariant | null => {
    if (!userId) return null;

    // Return cached variant if available
    if (variants[testId] !== undefined) {
      return variants[testId];
    }

    // Load variant asynchronously if not loaded
    if (!loadedTests.current.has(testId)) {
      loadedTests.current.add(testId);
      
      abTestingService.current.getVariant(testId, userId)
        .then(variant => {
          setVariants(prev => ({ ...prev, [testId]: variant }));
        })
        .catch(error => {
          handleError(error, {
            testId,
            userId,
            component: 'useABTesting',
          });
          setVariants(prev => ({ ...prev, [testId]: null }));
        });
    }

    return null; // Return null while loading
  }, [userId, variants, handleError]);

  const trackConversion = useCallback(async (
    testId: string,
    metric: string,
    value: number = 1
  ): Promise<void> => {
    if (!userId || !enableTracking) return;

    try {
      await abTestingService.current.trackConversion(testId, userId, metric, value);
    } catch (error) {
      await handleError(error, {
        testId,
        userId,
        metric,
        value,
        component: 'useABTesting',
      });
    }
  }, [userId, enableTracking, handleError]);

  const isInTest = useCallback((testId: string): boolean => {
    const variant = getVariant(testId);
    return variant !== null;
  }, [getVariant]);

  const getTestConfig = useCallback((
    testId: string,
    configKey: string,
    defaultValue?: any
  ): any => {
    const variant = getVariant(testId);
    if (!variant || !variant.config) {
      return defaultValue;
    }
    return variant.config[configKey] ?? defaultValue;
  }, [getVariant]);

  const getAllVariants = useCallback((): Record<string, ABTestVariant | null> => {
    return { ...variants };
  }, [variants]);

  // Preload active tests on mount
  useEffect(() => {
    if (!userId) return;

    const loadActiveTests = async () => {
      try {
        const activeTests = abTestingService.current.getActiveTests();
        
        // Load variants for all active tests
        const variantPromises = activeTests.map(async test => {
          try {
            const variant = await abTestingService.current.getVariant(test.id, userId);
            return { testId: test.id, variant };
          } catch (error) {
            console.warn(`Failed to load variant for test ${test.id}:`, error);
            return { testId: test.id, variant: null };
          }
        });

        const results = await Promise.all(variantPromises);
        
        const newVariants: Record<string, ABTestVariant | null> = {};
        results.forEach(({ testId, variant }) => {
          newVariants[testId] = variant;
          loadedTests.current.add(testId);
        });

        setVariants(newVariants);
      } catch (error) {
        await handleError(error, {
          userId,
          component: 'useABTesting',
          operation: 'loadActiveTests',
        });
      }
    };

    loadActiveTests();
  }, [userId, handleError]);

  return {
    getVariant,
    trackConversion,
    isInTest,
    getTestConfig,
    getAllVariants,
  };
}

/**
 * Hook for specific A/B test
 */
export function useABTest(testId: string, userId?: string) {
  const { getVariant, trackConversion, isInTest, getTestConfig } = useABTesting({ userId });
  
  const variant = getVariant(testId);
  const inTest = isInTest(testId);
  
  const trackTestConversion = useCallback(async (metric: string, value?: number) => {
    await trackConversion(testId, metric, value);
  }, [testId, trackConversion]);

  const getConfig = useCallback((configKey: string, defaultValue?: any) => {
    return getTestConfig(testId, configKey, defaultValue);
  }, [testId, getTestConfig]);

  return {
    variant,
    inTest,
    isControl: variant?.isControl ?? false,
    config: variant?.config ?? {},
    trackConversion: trackTestConversion,
    getConfig,
  };
}

/**
 * Hook for feature flags (simplified A/B testing)
 */
export function useFeatureFlag(flagName: string, userId?: string, defaultValue: boolean = false) {
  const { getTestConfig, isInTest } = useABTesting({ userId });
  
  // Feature flags are implemented as A/B tests with boolean config
  const isEnabled = getTestConfig(flagName, 'enabled', defaultValue);
  const inTest = isInTest(flagName);
  
  return {
    isEnabled: inTest ? isEnabled : defaultValue,
    inTest,
  };
}

/**
 * Hook for UI variant testing
 */
export function useUIVariant(testId: string, userId?: string) {
  const { variant, inTest, getConfig, trackConversion } = useABTest(testId, userId);
  
  const getUIConfig = useCallback((configKey: string, defaultValue?: any) => {
    return getConfig(configKey, defaultValue);
  }, [getConfig]);

  const trackUIInteraction = useCallback(async (interactionType: string, value?: number) => {
    await trackConversion(`ui_${interactionType}`, value);
  }, [trackConversion]);

  return {
    variant,
    inTest,
    isControl: variant?.isControl ?? false,
    getUIConfig,
    trackUIInteraction,
    
    // Common UI config helpers
    getButtonStyle: (defaultStyle: any) => getUIConfig('buttonStyle', defaultStyle),
    getCardStyle: (defaultStyle: any) => getUIConfig('cardStyle', defaultStyle),
    getLayoutConfig: (defaultConfig: any) => getUIConfig('layout', defaultConfig),
    getColorScheme: (defaultScheme: any) => getUIConfig('colorScheme', defaultScheme),
  };
}

/**
 * Hook for onboarding A/B testing
 */
export function useOnboardingTest(userId?: string) {
  const testId = 'onboarding_flow_v1';
  const { variant, inTest, getConfig, trackConversion } = useABTest(testId, userId);
  
  const trackOnboardingStep = useCallback(async (step: number) => {
    await trackConversion('onboarding_step_completed', step);
  }, [trackConversion]);

  const trackOnboardingCompletion = useCallback(async () => {
    await trackConversion('onboarding_completed', 1);
  }, [trackConversion]);

  return {
    variant,
    inTest,
    isControl: variant?.isControl ?? false,
    
    // Onboarding config
    stepCount: getConfig('steps', 3),
    showTutorial: getConfig('showTutorial', true),
    requireCategorySelection: getConfig('requireCategorySelection', true),
    showPreferences: getConfig('showPreferences', false),
    
    // Tracking methods
    trackOnboardingStep,
    trackOnboardingCompletion,
  };
}

/**
 * Hook for swipe card design testing
 */
export function useSwipeCardTest(userId?: string) {
  const testId = 'swipe_card_design_v1';
  const { variant, inTest, getConfig, trackConversion } = useABTest(testId, userId);
  
  const trackCardInteraction = useCallback(async (interactionType: 'swipe' | 'tap' | 'view') => {
    await trackConversion(`card_${interactionType}`, 1);
  }, [trackConversion]);

  return {
    variant,
    inTest,
    isControl: variant?.isControl ?? false,
    
    // Card design config
    cardStyle: getConfig('cardStyle', 'original'),
    showPrice: getConfig('showPrice', true),
    showCategory: getConfig('showCategory', true),
    
    // Tracking methods
    trackCardInteraction,
  };
}