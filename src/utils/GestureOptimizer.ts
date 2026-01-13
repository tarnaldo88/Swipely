/**
 * Gesture Optimizer
 * Optimizes gesture handling and animation performance
 */

import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface GestureConfig {
  debounceMs?: number;
  throttleMs?: number;
  minVelocity?: number;
  maxVelocity?: number;
}

export class GestureOptimizer {
  private static lastGestureTime: number = 0;
  private static gestureInProgress: boolean = false;
  private static velocityHistory: number[] = [];

  /**
   * Check if gesture should be processed (debounce)
   */
  static shouldProcessGesture(config: GestureConfig = {}): boolean {
    const { debounceMs = 16 } = config; // ~60fps
    const now = Date.now();

    if (now - this.lastGestureTime < debounceMs) {
      return false;
    }

    this.lastGestureTime = now;
    return true;
  }

  /**
   * Calculate swipe velocity
   */
  static calculateVelocity(
    translationX: number,
    translationY: number,
    duration: number
  ): number {
    if (duration === 0) return 0;
    return Math.sqrt(translationX ** 2 + translationY ** 2) / duration;
  }

  /**
   * Check if swipe velocity is valid
   */
  static isValidVelocity(velocity: number, config: GestureConfig = {}): boolean {
    const { minVelocity = 0.1, maxVelocity = 10 } = config;
    return velocity >= minVelocity && velocity <= maxVelocity;
  }

  /**
   * Determine swipe direction with optimization
   */
  static getSwipeDirection(
    translationX: number,
    translationY: number,
    threshold: number = screenWidth * 0.25
  ): 'left' | 'right' | 'none' {
    // Only consider horizontal swipes (ignore vertical movement)
    if (Math.abs(translationY) > Math.abs(translationX) * 0.5) {
      return 'none';
    }

    if (translationX < -threshold) {
      return 'left';
    }

    if (translationX > threshold) {
      return 'right';
    }

    return 'none';
  }

  /**
   * Optimize animation duration based on velocity
   */
  static getOptimizedDuration(velocity: number, baseDistance: number): number {
    const minDuration = 200;
    const maxDuration = 500;

    // Calculate duration based on velocity
    const calculatedDuration = Math.max(minDuration, baseDistance / (velocity || 1));

    return Math.min(calculatedDuration, maxDuration);
  }

  /**
   * Track gesture performance
   */
  static startGestureTracking(): void {
    this.gestureInProgress = true;
    this.velocityHistory = [];
  }

  /**
   * End gesture tracking
   */
  static endGestureTracking(): void {
    this.gestureInProgress = false;
    this.velocityHistory = [];
  }

  /**
   * Add velocity sample
   */
  static addVelocitySample(velocity: number): void {
    this.velocityHistory.push(velocity);

    // Keep only last 10 samples
    if (this.velocityHistory.length > 10) {
      this.velocityHistory.shift();
    }
  }

  /**
   * Get average velocity
   */
  static getAverageVelocity(): number {
    if (this.velocityHistory.length === 0) return 0;

    const sum = this.velocityHistory.reduce((a, b) => a + b, 0);
    return sum / this.velocityHistory.length;
  }

  /**
   * Check if gesture is in progress
   */
  static isGestureInProgress(): boolean {
    return this.gestureInProgress;
  }

  /**
   * Optimize interpolation calculation
   */
  static optimizeInterpolation(
    value: number,
    inputRange: number[],
    outputRange: number[]
  ): number {
    // Use linear interpolation for better performance
    if (value <= inputRange[0]) {
      return outputRange[0];
    }

    if (value >= inputRange[inputRange.length - 1]) {
      return outputRange[outputRange.length - 1];
    }

    // Find the segment
    for (let i = 0; i < inputRange.length - 1; i++) {
      if (value >= inputRange[i] && value <= inputRange[i + 1]) {
        const ratio = (value - inputRange[i]) / (inputRange[i + 1] - inputRange[i]);
        return outputRange[i] + ratio * (outputRange[i + 1] - outputRange[i]);
      }
    }

    return outputRange[0];
  }

  /**
   * Reduce animation frame rate for performance
   */
  static shouldUpdateFrame(frameCount: number, targetFPS: number = 30): boolean {
    const targetFrameInterval = 60 / targetFPS; // Assuming 60fps base
    return frameCount % Math.ceil(targetFrameInterval) === 0;
  }
}
