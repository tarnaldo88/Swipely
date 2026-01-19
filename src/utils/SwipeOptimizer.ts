/**
 * Swipe Optimizer
 * Defers heavy operations during swipe animations to prevent UI freezing
 */

export class SwipeOptimizer {
  private static isAnimating = false;
  private static deferredOperations: Array<() => void> = [];
  private static animationTimeout: NodeJS.Timeout | null = null;

  /**
   * Mark animation as starting
   */
  static startAnimation(): void {
    this.isAnimating = true;
  }

  /**
   * Mark animation as ending
   */
  static endAnimation(duration: number = 300): void {
    // Keep isAnimating true for the duration of the animation
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }

    this.animationTimeout = setTimeout(() => {
      this.isAnimating = false;
      this.processDeferredOperations();
    }, duration);
  }

  /**
   * Check if currently animating
   */
  static isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  /**
   * Defer an operation if currently animating
   */
  static deferIfAnimating<T>(operation: () => T): T | void {
    if (this.isAnimating) {
      this.deferredOperations.push(operation);
      return;
    }
    return operation();
  }

  /**
   * Process all deferred operations
   */
  private static processDeferredOperations(): void {
    const operations = this.deferredOperations;
    this.deferredOperations = [];

    // Process operations in batches to avoid blocking
    operations.forEach(op => {
      try {
        op();
      } catch (error) {
        console.error('Error processing deferred operation:', error);
      }
    });
  }

  /**
   * Clear all deferred operations
   */
  static clear(): void {
    this.deferredOperations = [];
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    this.isAnimating = false;
  }
}

/**
 * Hook for managing swipe animation state
 */
export function useSwipeAnimation() {
  return {
    startAnimation: () => SwipeOptimizer.startAnimation(),
    endAnimation: (duration?: number) => SwipeOptimizer.endAnimation(duration),
    isAnimating: () => SwipeOptimizer.isCurrentlyAnimating(),
    deferIfAnimating: <T,>(op: () => T) => SwipeOptimizer.deferIfAnimating(op),
  };
}
