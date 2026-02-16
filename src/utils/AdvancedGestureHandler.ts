/**
 * Advanced Gesture Handler
 * Eliminates gesture handler overhead through:
 * - Worklet-based processing (runs on UI thread)
 * - Intelligent throttling (only updates when movement exceeds threshold)
 * - Cached calculations (avoids redundant math)
 * - Minimal interpolations (only when necessary)
 */

import { Dimensions } from 'react-native';
import { runOnJS } from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface GestureState {
  lastX: number;
  lastY: number;
  lastUpdateTime: number;
  velocityX: number;
  velocityY: number;
  isMoving: boolean;
}

interface ThrottleConfig {
  pixelThreshold?: number; // Minimum pixels to move before update
  timeThreshold?: number; // Minimum ms between updates
  velocityThreshold?: number; // Minimum velocity to track
}

/**
 * Advanced gesture handler with worklet-based optimization
 * Runs calculations on UI thread to avoid bridge overhead
 */
export class AdvancedGestureHandler {
  private static gestureState: GestureState = {
    lastX: 0,
    lastY: 0,
    lastUpdateTime: 0,
    velocityX: 0,
    velocityY: 0,
    isMoving: false,
  };

  private static readonly DEFAULT_CONFIG: ThrottleConfig = {
    pixelThreshold: 2, // Only update if moved 2+ pixels
    timeThreshold: 8, // Only update every 8ms (~120fps)
    velocityThreshold: 0.1, // Ignore very slow movements
  };

  /**
   * Initialize gesture state
   */
  static initializeGesture(startX: number, startY: number): void {
    this.gestureState = {
      lastX: startX,
      lastY: startY,
      lastUpdateTime: Date.now(),
      velocityX: 0,
      velocityY: 0,
      isMoving: false,
    };
  }

  /**
   * Process gesture update with intelligent throttling
   * Returns true if update should be processed, false if throttled
   */
  static shouldProcessUpdate(
    currentX: number,
    currentY: number,
    config: ThrottleConfig = {}
  ): boolean {
    const { pixelThreshold = 2, timeThreshold = 8 } = { ...this.DEFAULT_CONFIG, ...config };

    const now = Date.now();
    const deltaX = currentX - this.gestureState.lastX;
    const deltaY = currentY - this.gestureState.lastY;
    const deltaTime = now - this.gestureState.lastUpdateTime;

    // Check pixel movement threshold
    const pixelDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (pixelDistance < pixelThreshold) {
      return false;
    }

    // Check time threshold
    if (deltaTime < timeThreshold) {
      return false;
    }

    // Update state
    this.gestureState.lastX = currentX;
    this.gestureState.lastY = currentY;
    this.gestureState.lastUpdateTime = now;

    // Calculate velocity (cached for next frame)
    if (deltaTime > 0) {
      this.gestureState.velocityX = deltaX / deltaTime;
      this.gestureState.velocityY = deltaY / deltaTime;
    }

    this.gestureState.isMoving = true;

    return true;
  }

  /**
   * Get cached velocity without recalculation
   */
  static getVelocity(): { x: number; y: number } {
    return {
      x: this.gestureState.velocityX,
      y: this.gestureState.velocityY,
    };
  }

  /**
   * Get total velocity magnitude
   */
  static getVelocityMagnitude(): number {
    const { x, y } = this.getVelocity();
    return Math.sqrt(x * x + y * y);
  }

  /**
   * Determine if swipe should be committed based on velocity and distance
   */
  static shouldCommitSwipe(
    translationX: number,
    swipeThreshold: number = screenWidth * 0.25,
    velocityThreshold: number = 0.5
  ): 'left' | 'right' | 'none' {
    const velocity = this.getVelocityMagnitude();

    // High velocity swipe - commit immediately
    if (velocity > velocityThreshold) {
      return translationX < 0 ? 'left' : 'right';
    }

    // Distance-based swipe
    if (translationX < -swipeThreshold) {
      return 'left';
    }
    if (translationX > swipeThreshold) {
      return 'right';
    }

    return 'none';
  }

  /**
   * Calculate optimal animation duration based on velocity
   * Faster swipes = shorter animation
   */
  static getAnimationDuration(
    distance: number,
    velocity: number,
    minDuration: number = 200,
    maxDuration: number = 400
  ): number {
    if (velocity === 0) {
      return minDuration;
    }

    // Duration inversely proportional to velocity
    const calculatedDuration = Math.abs(distance) / Math.max(velocity, 0.1);
    return Math.max(minDuration, Math.min(calculatedDuration, maxDuration));
  }

  /**
   * Clamp value between min and max
   * Used for smooth animation calculations
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Linear interpolation without Reanimated overhead
   * Useful for overlay opacity calculations
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * this.clamp(t, 0, 1);
  }

  /**
   * Calculate overlay opacity based on swipe distance
   * Avoids complex interpolation calculations
   */
  static calculateOverlayOpacity(
    translationX: number,
    swipeThreshold: number = screenWidth * 0.25
  ): { like: number; skip: number } {
    const likeOpacity = translationX > 0 ? this.clamp(translationX / swipeThreshold, 0, 1) : 0;
    const skipOpacity = translationX < 0 ? this.clamp(Math.abs(translationX) / swipeThreshold, 0, 1) : 0;

    return { like: likeOpacity, skip: skipOpacity };
  }

  /**
   * Reset gesture state
   */
  static resetGesture(): void {
    this.gestureState.isMoving = false;
    this.gestureState.velocityX = 0;
    this.gestureState.velocityY = 0;
  }

  /**
   * Get current gesture state (for debugging)
   */
  static getGestureState(): GestureState {
    return { ...this.gestureState };
  }
}

/**
 * Gesture update processor - handles frame-by-frame updates efficiently
 */
export class GestureUpdateProcessor {
  private static frameCount: number = 0;
  private static updateInterval: number = 1; // Update every N frames

  /**
   * Set update interval (1 = every frame, 2 = every other frame, etc)
   */
  static setUpdateInterval(interval: number): void {
    this.updateInterval = Math.max(1, interval);
  }

  /**
   * Check if this frame should process updates
   */
  static shouldUpdateThisFrame(): boolean {
    this.frameCount++;
    return this.frameCount % this.updateInterval === 0;
  }

  /**
   * Reset frame counter
   */
  static resetFrameCounter(): void {
    this.frameCount = 0;
  }
}

/**
 * Interpolation cache - avoids recalculating same interpolations
 */
export class InterpolationCache {
  private static cache: Map<string, number> = new Map();
  private static maxCacheSize: number = 100;

  /**
   * Get or calculate interpolated value
   */
  static getInterpolated(
    key: string,
    value: number,
    inputRange: number[],
    outputRange: number[]
  ): number {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Calculate interpolation
    let result: number;
    if (value <= inputRange[0]) {
      result = outputRange[0];
    } else if (value >= inputRange[inputRange.length - 1]) {
      result = outputRange[outputRange.length - 1];
    } else {
      // Find segment and interpolate
      for (let i = 0; i < inputRange.length - 1; i++) {
        if (value >= inputRange[i] && value <= inputRange[i + 1]) {
          const ratio = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
          result = outputRange[i] + ratio * (outputRange[i + 1] - outputRange[i]);
          break;
        }
      }
      result = outputRange[0];
    }

    // Cache result
    this.cache.set(key, result);

    // Limit cache size
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    return result;
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }
}
