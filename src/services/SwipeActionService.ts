import * as Haptics from 'expo-haptics';
import { ProductFeedService } from './ProductFeedService';
import { SwipeAction, SwipeActionResponse } from '../types';

export interface SwipeActionHandler {
  onSwipeLeft: (productId: string) => Promise<void>;
  onSwipeRight: (productId: string) => Promise<void>;
  recordSwipeAction: (productId: string, action: 'like' | 'skip', userId: string) => Promise<SwipeActionResponse>;
}

export class SwipeActionService implements SwipeActionHandler {
  private userId: string;
  private hapticEnabled: boolean;

  constructor(userId: string, hapticEnabled: boolean = true) {
    this.userId = userId;
    this.hapticEnabled = hapticEnabled;
  }

  /**
   * Handle left swipe (skip) action
   */
  async onSwipeLeft(productId: string): Promise<void> {
    try {
      // Provide haptic feedback for skip action
      if (this.hapticEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Record the skip action
      await this.recordSwipeAction(productId, 'skip', this.userId);
    } catch (error) {
      console.error('Error handling left swipe:', error);
      throw error;
    }
  }

  /**
   * Handle right swipe (like) action
   */
  async onSwipeRight(productId: string): Promise<void> {
    try {
      // Provide haptic feedback for like action
      if (this.hapticEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Record the like action
      await this.recordSwipeAction(productId, 'like', this.userId);
    } catch (error) {
      console.error('Error handling right swipe:', error);
      throw error;
    }
  }

  /**
   * Record swipe action using ProductFeedService
   */
  async recordSwipeAction(
    productId: string, 
    action: 'like' | 'skip', 
    userId: string
  ): Promise<SwipeActionResponse> {
    try {
      return await ProductFeedService.recordSwipeAction(productId, action, userId);
    } catch (error) {
      console.error('Error recording swipe action:', error);
      throw error;
    }
  }

  /**
   * Handle cart action with haptic feedback
   */
  async onAddToCart(productId: string): Promise<void> {
    try {
      // Provide haptic feedback for cart action
      if (this.hapticEnabled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error handling add to cart:', error);
      throw error;
    }
  }

  /**
   * Handle view details action with subtle haptic feedback
   */
  async onViewDetails(productId: string): Promise<void> {
    try {
      // Provide subtle haptic feedback for details view
      if (this.hapticEnabled) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error('Error handling view details:', error);
      throw error;
    }
  }

  /**
   * Enable or disable haptic feedback
   */
  setHapticEnabled(enabled: boolean): void {
    this.hapticEnabled = enabled;
  }

  /**
   * Get current haptic setting
   */
  isHapticEnabled(): boolean {
    return this.hapticEnabled;
  }

  /**
   * Update user ID for the service
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get session swipe history
   */
  getSessionSwipeHistory(): SwipeAction[] {
    return ProductFeedService.getSessionSwipeHistory();
  }

  /**
   * Get liked products from current session
   */
  getLikedProductsFromSession(): string[] {
    return ProductFeedService.getLikedProductsFromSession();
  }

  /**
   * Get skipped products from current session
   */
  getSkippedProductsFromSession(): string[] {
    return ProductFeedService.getSkippedProductsFromSession();
  }

  /**
   * Clear current session data
   */
  clearSession(): void {
    ProductFeedService.clearSession();
  }
}

// Singleton instance for global use
let swipeActionServiceInstance: SwipeActionService | null = null;

export const getSwipeActionService = (userId?: string): SwipeActionService => {
  if (!swipeActionServiceInstance && userId) {
    swipeActionServiceInstance = new SwipeActionService(userId);
  } else if (swipeActionServiceInstance && userId) {
    swipeActionServiceInstance.setUserId(userId);
  }
  
  if (!swipeActionServiceInstance) {
    throw new Error('SwipeActionService not initialized. Please provide a userId.');
  }
  
  return swipeActionServiceInstance;
};

export const resetSwipeActionService = (): void => {
  swipeActionServiceInstance = null;
};