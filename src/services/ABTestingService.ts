/**
 * A/B Testing framework for UI/UX experiments
 * Requirements: 3.3, 3.4
 */

import { AnalyticsService } from './AnalyticsService';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ErrorFactory } from '../utils/ErrorFactory';
import { ErrorType } from '../types/errors';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficAllocation: number; // Percentage of users to include (0-100)
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience?: ABTestAudience;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // Percentage of test traffic (0-100)
  config: Record<string, any>;
  isControl: boolean;
}

export interface ABTestAudience {
  userSegments?: string[];
  platforms?: ('ios' | 'android' | 'web')[];
  countries?: string[];
  minAppVersion?: string;
  maxAppVersion?: string;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
  exposedAt?: Date;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  sampleSize: number;
  conversionRate?: number;
  statisticalSignificance?: number;
}

export class ABTestingService {
  private static instance: ABTestingService | null = null;
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, ABTestAssignment[]> = new Map();
  private results: Map<string, ABTestResult[]> = new Map();
  private analyticsService: AnalyticsService;
  private errorHandlingService: ErrorHandlingService;

  private constructor() {
    this.analyticsService = AnalyticsService.getInstance();
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.initializeDefaultTests();
  }

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  /**
   * Create a new A/B test
   */
  async createTest(test: Omit<ABTest, 'id'>): Promise<string> {
    try {
      const testId = this.generateTestId();
      const fullTest: ABTest = {
        ...test,
        id: testId,
      };

      // Validate test configuration
      this.validateTest(fullTest);

      this.tests.set(testId, fullTest);
      this.assignments.set(testId, []);
      this.results.set(testId, []);

      await this.analyticsService.trackEvent('ab_test_created', {
        test_id: testId,
        test_name: test.name,
        variant_count: test.variants.length,
        traffic_allocation: test.trafficAllocation,
      });

      return testId;
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.VALIDATION_ERROR,
          'Failed to create A/B test',
          {
            context: { testName: test.name },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
      throw error;
    }
  }

  /**
   * Get variant assignment for a user
   */
  async getVariant(testId: string, userId: string): Promise<ABTestVariant | null> {
    try {
      const test = this.tests.get(testId);
      if (!test || test.status !== 'active') {
        return null;
      }

      // Check if user is already assigned
      const existingAssignment = this.getUserAssignment(testId, userId);
      if (existingAssignment) {
        const variant = test.variants.find(v => v.id === existingAssignment.variantId);
        if (variant) {
          // Mark as exposed if not already
          if (!existingAssignment.exposedAt) {
            existingAssignment.exposedAt = new Date();
            await this.trackExposure(testId, existingAssignment.variantId, userId);
          }
          return variant;
        }
      }

      // Check if user should be included in test
      if (!this.shouldIncludeUser(test, userId)) {
        return null;
      }

      // Assign user to variant
      const variant = this.assignUserToVariant(test, userId);
      if (variant) {
        const assignment: ABTestAssignment = {
          testId,
          variantId: variant.id,
          userId,
          assignedAt: new Date(),
          exposedAt: new Date(),
        };

        const testAssignments = this.assignments.get(testId) || [];
        testAssignments.push(assignment);
        this.assignments.set(testId, testAssignments);

        await this.trackAssignment(testId, variant.id, userId);
        await this.trackExposure(testId, variant.id, userId);

        return variant;
      }

      return null;
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to get A/B test variant',
          {
            context: { testId, userId },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
      return null;
    }
  }

  /**
   * Track conversion for A/B test
   */
  async trackConversion(
    testId: string,
    userId: string,
    metric: string,
    value: number = 1
  ): Promise<void> {
    try {
      const assignment = this.getUserAssignment(testId, userId);
      if (!assignment || !assignment.exposedAt) {
        return; // User not in test or not exposed
      }

      await this.analyticsService.trackEvent('ab_test_conversion', {
        test_id: testId,
        variant_id: assignment.variantId,
        user_id: userId,
        metric,
        value,
        time_to_conversion: Date.now() - assignment.exposedAt.getTime(),
      });

      // Update results
      this.updateTestResults(testId, assignment.variantId, metric, value);
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to track A/B test conversion',
          {
            context: { testId, userId, metric, value },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Get test results
   */
  getTestResults(testId: string): ABTestResult[] {
    return this.results.get(testId) || [];
  }

  /**
   * Get all active tests
   */
  getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter(test => test.status === 'active');
  }

  /**
   * Update test status
   */
  async updateTestStatus(testId: string, status: ABTest['status']): Promise<void> {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      test.status = status;
      this.tests.set(testId, test);

      await this.analyticsService.trackEvent('ab_test_status_changed', {
        test_id: testId,
        old_status: test.status,
        new_status: status,
      });
    } catch (error) {
      await this.errorHandlingService.handleError(
        ErrorFactory.createAppError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to update test status',
          {
            context: { testId, status },
            originalError: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * Get user's test assignments
   */
  getUserAssignments(userId: string): ABTestAssignment[] {
    const allAssignments: ABTestAssignment[] = [];
    
    this.assignments.forEach(testAssignments => {
      const userAssignments = testAssignments.filter(a => a.userId === userId);
      allAssignments.push(...userAssignments);
    });

    return allAssignments;
  }

  /**
   * Initialize default tests for the app
   */
  private initializeDefaultTests(): void {
    // Example: Swipe card design test
    const swipeCardTest: ABTest = {
      id: 'swipe_card_design_v1',
      name: 'Swipe Card Design Test',
      description: 'Test different swipe card layouts for better engagement',
      variants: [
        {
          id: 'control',
          name: 'Original Design',
          description: 'Current swipe card design',
          allocation: 50,
          isControl: true,
          config: {
            cardStyle: 'original',
            showPrice: true,
            showCategory: true,
          },
        },
        {
          id: 'minimal',
          name: 'Minimal Design',
          description: 'Simplified card with focus on image',
          allocation: 50,
          isControl: false,
          config: {
            cardStyle: 'minimal',
            showPrice: false,
            showCategory: false,
          },
        },
      ],
      trafficAllocation: 100,
      startDate: new Date(),
      status: 'active',
    };

    // Example: Onboarding flow test
    const onboardingTest: ABTest = {
      id: 'onboarding_flow_v1',
      name: 'Onboarding Flow Test',
      description: 'Test different onboarding flows for better conversion',
      variants: [
        {
          id: 'control',
          name: 'Standard Onboarding',
          description: 'Current 3-step onboarding',
          allocation: 33,
          isControl: true,
          config: {
            steps: 3,
            showTutorial: true,
            requireCategorySelection: true,
          },
        },
        {
          id: 'quick',
          name: 'Quick Onboarding',
          description: 'Simplified 1-step onboarding',
          allocation: 33,
          isControl: false,
          config: {
            steps: 1,
            showTutorial: false,
            requireCategorySelection: false,
          },
        },
        {
          id: 'guided',
          name: 'Guided Onboarding',
          description: 'Extended 5-step guided onboarding',
          allocation: 34,
          isControl: false,
          config: {
            steps: 5,
            showTutorial: true,
            requireCategorySelection: true,
            showPreferences: true,
          },
        },
      ],
      trafficAllocation: 50, // Only 50% of users
      startDate: new Date(),
      status: 'active',
    };

    this.tests.set(swipeCardTest.id, swipeCardTest);
    this.tests.set(onboardingTest.id, onboardingTest);
    this.assignments.set(swipeCardTest.id, []);
    this.assignments.set(onboardingTest.id, []);
    this.results.set(swipeCardTest.id, []);
    this.results.set(onboardingTest.id, []);
  }

  /**
   * Validate test configuration
   */
  private validateTest(test: ABTest): void {
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }

    const totalAllocation = test.variants.reduce((sum, v) => sum + v.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%');
    }

    const controlVariants = test.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Test must have exactly one control variant');
    }

    if (test.trafficAllocation < 0 || test.trafficAllocation > 100) {
      throw new Error('Traffic allocation must be between 0 and 100');
    }
  }

  /**
   * Check if user should be included in test
   */
  private shouldIncludeUser(test: ABTest, userId: string): boolean {
    // Check traffic allocation
    const userHash = this.hashUserId(userId);
    const trafficThreshold = test.trafficAllocation / 100;
    
    if (userHash > trafficThreshold) {
      return false;
    }

    // Check audience targeting (simplified)
    if (test.targetAudience) {
      // In a real implementation, you would check user segments, platform, etc.
      // For now, we'll include all users that pass traffic allocation
    }

    return true;
  }

  /**
   * Assign user to variant based on allocation
   */
  private assignUserToVariant(test: ABTest, userId: string): ABTestVariant | null {
    const userHash = this.hashUserId(userId);
    let cumulativeAllocation = 0;

    for (const variant of test.variants) {
      cumulativeAllocation += variant.allocation / 100;
      if (userHash <= cumulativeAllocation) {
        return variant;
      }
    }

    // Fallback to control variant
    return test.variants.find(v => v.isControl) || null;
  }

  /**
   * Get existing user assignment
   */
  private getUserAssignment(testId: string, userId: string): ABTestAssignment | null {
    const testAssignments = this.assignments.get(testId) || [];
    return testAssignments.find(a => a.userId === userId) || null;
  }

  /**
   * Hash user ID for consistent assignment
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track test assignment
   */
  private async trackAssignment(testId: string, variantId: string, userId: string): Promise<void> {
    await this.analyticsService.trackEvent('ab_test_assignment', {
      test_id: testId,
      variant_id: variantId,
      user_id: userId,
    });
  }

  /**
   * Track test exposure
   */
  private async trackExposure(testId: string, variantId: string, userId: string): Promise<void> {
    await this.analyticsService.trackEvent('ab_test_exposure', {
      test_id: testId,
      variant_id: variantId,
      user_id: userId,
    });
  }

  /**
   * Update test results
   */
  private updateTestResults(testId: string, variantId: string, metric: string, value: number): void {
    const testResults = this.results.get(testId) || [];
    
    let result = testResults.find(r => r.variantId === variantId && r.metric === metric);
    if (!result) {
      result = {
        testId,
        variantId,
        metric,
        value: 0,
        sampleSize: 0,
      };
      testResults.push(result);
    }

    result.value += value;
    result.sampleSize += 1;
    result.conversionRate = result.value / result.sampleSize;

    this.results.set(testId, testResults);
  }
}