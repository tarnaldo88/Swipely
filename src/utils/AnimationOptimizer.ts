/**
 * Animation Optimizer
 * Reduces animated values, simplifies animations, implements frame rate limiting,
 * and uses native animations for better performance
 */

import { Animated, Easing } from 'react-native';

/**
 * Frame rate limiter - controls animation frame rate
 */
export class FrameRateLimiter {
  private targetFPS: number;
  private frameInterval: number;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  /**
   * Check if frame should be rendered
   */
  shouldRenderFrame(): boolean {
    const now = Date.now();
    if (now - this.lastFrameTime >= this.frameInterval) {
      this.lastFrameTime = now;
      this.frameCount++;
      return true;
    }
    return false;
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    return this.frameCount;
  }

  /**
   * Reset counter
   */
  reset(): void {
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}

/**
 * Native animation builder - creates optimized native animations
 */
export class NativeAnimationBuilder {
  /**
   * Create simple opacity animation
   */
  static createOpacityAnimation(
    initialValue: number = 0,
    finalValue: number = 1,
    duration: number = 300
  ): Animated.Value {
    const animatedValue = new Animated.Value(initialValue);

    Animated.timing(animatedValue, {
      toValue: finalValue,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    return animatedValue;
  }

  /**
   * Create simple translation animation
   */
  static createTranslationAnimation(
    initialValue: number = 0,
    finalValue: number = 0,
    duration: number = 300
  ): Animated.Value {
    const animatedValue = new Animated.Value(initialValue);

    Animated.timing(animatedValue, {
      toValue: finalValue,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    return animatedValue;
  }

  /**
   * Create spring animation (native)
   */
  static createSpringAnimation(
    initialValue: number = 0,
    finalValue: number = 0
  ): Animated.Value {
    const animatedValue = new Animated.Value(initialValue);

    Animated.spring(animatedValue, {
      toValue: finalValue,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();

    return animatedValue;
  }

  /**
   * Create sequence animation
   */
  static createSequenceAnimation(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.sequence(animations);
  }

  /**
   * Create parallel animation
   */
  static createParallelAnimation(
    animations: Animated.CompositeAnimation[]
  ): Animated.CompositeAnimation {
    return Animated.parallel(animations);
  }

  /**
   * Create loop animation
   */
  static createLoopAnimation(
    animation: Animated.CompositeAnimation,
    iterations: number = -1
  ): Animated.CompositeAnimation {
    return Animated.loop(animation, { iterations });
  }
}

/**
 * Animation pool - reuses animation instances
 */
export class AnimationPool {
  private availableAnimations: Animated.Value[] = [];
  private inUseAnimations: Set<Animated.Value> = new Set();
  private maxPoolSize: number;

  constructor(initialSize: number = 10, maxPoolSize: number = 50) {
    this.maxPoolSize = maxPoolSize;

    // Pre-allocate animations
    for (let i = 0; i < initialSize; i++) {
      this.availableAnimations.push(new Animated.Value(0));
    }
  }

  /**
   * Acquire animation from pool
   */
  acquire(initialValue: number = 0): Animated.Value {
    let animation: Animated.Value;

    if (this.availableAnimations.length > 0) {
      animation = this.availableAnimations.pop()!;
      animation.setValue(initialValue);
    } else {
      animation = new Animated.Value(initialValue);
    }

    this.inUseAnimations.add(animation);
    return animation;
  }

  /**
   * Release animation back to pool
   */
  release(animation: Animated.Value): void {
    if (this.inUseAnimations.has(animation)) {
      this.inUseAnimations.delete(animation);

      // Reset animation
      animation.setValue(0);

      // Only keep up to maxPoolSize
      if (this.availableAnimations.length < this.maxPoolSize) {
        this.availableAnimations.push(animation);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.availableAnimations.length,
      inUse: this.inUseAnimations.size,
      total: this.availableAnimations.length + this.inUseAnimations.size,
    };
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.availableAnimations = [];
    this.inUseAnimations.clear();
  }
}

/**
 * Simplified animation controller - manages simple animations
 */
export class SimplifiedAnimationController {
  private animationPool: AnimationPool;
  private activeAnimations: Map<string, Animated.Value> = new Map();

  constructor(poolSize: number = 10) {
    this.animationPool = new AnimationPool(poolSize);
  }

  /**
   * Animate opacity
   */
  animateOpacity(
    id: string,
    toValue: number,
    duration: number = 300
  ): Animated.Value {
    // Stop existing animation
    if (this.activeAnimations.has(id)) {
      const existing = this.activeAnimations.get(id)!;
      this.animationPool.release(existing);
    }

    // Create new animation
    const animation = this.animationPool.acquire(0);

    Animated.timing(animation, {
      toValue,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    this.activeAnimations.set(id, animation);
    return animation;
  }

  /**
   * Animate translation
   */
  animateTranslation(
    id: string,
    toValue: number,
    duration: number = 300
  ): Animated.Value {
    // Stop existing animation
    if (this.activeAnimations.has(id)) {
      const existing = this.activeAnimations.get(id)!;
      this.animationPool.release(existing);
    }

    // Create new animation
    const animation = this.animationPool.acquire(0);

    Animated.timing(animation, {
      toValue,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    this.activeAnimations.set(id, animation);
    return animation;
  }

  /**
   * Animate scale
   */
  animateScale(
    id: string,
    toValue: number,
    duration: number = 300
  ): Animated.Value {
    // Stop existing animation
    if (this.activeAnimations.has(id)) {
      const existing = this.activeAnimations.get(id)!;
      this.animationPool.release(existing);
    }

    // Create new animation
    const animation = this.animationPool.acquire(1);

    Animated.timing(animation, {
      toValue,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    this.activeAnimations.set(id, animation);
    return animation;
  }

  /**
   * Stop animation
   */
  stopAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.stopAnimation();
      this.animationPool.release(animation);
      this.activeAnimations.delete(id);
    }
  }

  /**
   * Stop all animations
   */
  stopAllAnimations(): void {
    for (const [id] of this.activeAnimations) {
      this.stopAnimation(id);
    }
  }

  /**
   * Get animation
   */
  getAnimation(id: string): Animated.Value | undefined {
    return this.activeAnimations.get(id);
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeAnimations: number;
    poolStats: { available: number; inUse: number; total: number };
  } {
    return {
      activeAnimations: this.activeAnimations.size,
      poolStats: this.animationPool.getStats(),
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopAllAnimations();
    this.animationPool.clear();
  }
}

/**
 * Easing presets for common animations
 */
export const EasingPresets = {
  // Simple easing
  linear: Easing.linear,
  easeIn: Easing.in(Easing.cubic),
  easeOut: Easing.out(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),

  // Bounce easing
  bounce: Easing.bounce,
  bounceIn: Easing.in(Easing.bounce),
  bounceOut: Easing.out(Easing.bounce),

  // Elastic easing
  elastic: Easing.elastic(1),

  // Quad easing
  quadIn: Easing.in(Easing.quad),
  quadOut: Easing.out(Easing.quad),
  quadInOut: Easing.inOut(Easing.quad),

  // Cubic easing
  cubicIn: Easing.in(Easing.cubic),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),
};

/**
 * Animation timing presets
 */
export const TimingPresets = {
  // Fast animations
  fast: 150,
  normal: 300,
  slow: 500,

  // Specific use cases
  swipe: 300,
  fade: 200,
  scale: 250,
  slide: 350,
};

/**
 * Animation configuration builder
 */
export class AnimationConfigBuilder {
  private config: {
    duration: number;
    easing: (value: number) => number;
    useNativeDriver: boolean;
  };

  constructor() {
    this.config = {
      duration: TimingPresets.normal,
      easing: EasingPresets.easeOut,
      useNativeDriver: true,
    };
  }

  /**
   * Set duration
   */
  setDuration(duration: number): this {
    this.config.duration = duration;
    return this;
  }

  /**
   * Set easing
   */
  setEasing(easing: (value: number) => number): this {
    this.config.easing = easing;
    return this;
  }

  /**
   * Set native driver
   */
  setUseNativeDriver(useNativeDriver: boolean): this {
    this.config.useNativeDriver = useNativeDriver;
    return this;
  }

  /**
   * Build configuration
   */
  build(): {
    duration: number;
    easing: (value: number) => number;
    useNativeDriver: boolean;
  } {
    return { ...this.config };
  }
}

/**
 * Animation performance monitor
 */
export class AnimationPerformanceMonitor {
  private animationStartTimes: Map<string, number> = new Map();
  private animationDurations: number[] = [];
  private maxSamples: number = 100;

  /**
   * Start tracking animation
   */
  startAnimation(id: string): void {
    this.animationStartTimes.set(id, Date.now());
  }

  /**
   * End tracking animation
   */
  endAnimation(id: string): void {
    const startTime = this.animationStartTimes.get(id);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.animationDurations.push(duration);

      if (this.animationDurations.length > this.maxSamples) {
        this.animationDurations.shift();
      }

      this.animationStartTimes.delete(id);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    averageDuration: number;
    maxDuration: number;
    minDuration: number;
    totalAnimations: number;
  } {
    if (this.animationDurations.length === 0) {
      return {
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        totalAnimations: 0,
      };
    }

    const sum = this.animationDurations.reduce((a, b) => a + b, 0);
    const avg = sum / this.animationDurations.length;
    const max = Math.max(...this.animationDurations);
    const min = Math.min(...this.animationDurations);

    return {
      averageDuration: avg,
      maxDuration: max,
      minDuration: min,
      totalAnimations: this.animationDurations.length,
    };
  }

  /**
   * Reset monitor
   */
  reset(): void {
    this.animationStartTimes.clear();
    this.animationDurations = [];
  }
}
