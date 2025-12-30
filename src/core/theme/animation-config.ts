/**
 * WB Theme System - Animation Configuration
 * 
 * Animation presets, timing, and easing functions
 */

import { AnimationPreset, AnimationRegistry, ANIMATION_TIMINGS, EASING_FUNCTIONS, EasingFunction } from '../../types/theme';

// =============================================================================
// Animation Presets
// =============================================================================

/**
 * Fast animation preset (150ms)
 */
export const ANIMATION_FAST: AnimationPreset = {
  name: 'fast',
  duration: ANIMATION_TIMINGS.fast,
  easing: 'ease-out',
  delay: 0,
};

/**
 * Normal animation preset (300ms)
 */
export const ANIMATION_NORMAL: AnimationPreset = {
  name: 'normal',
  duration: ANIMATION_TIMINGS.normal,
  easing: 'ease-in-out',
  delay: 0,
};

/**
 * Slow animation preset (500ms)
 */
export const ANIMATION_SLOW: AnimationPreset = {
  name: 'slow',
  duration: ANIMATION_TIMINGS.slow,
  easing: 'ease-in',
  delay: 0,
};

/**
 * Instant animation preset (0ms)
 */
export const ANIMATION_INSTANT: AnimationPreset = {
  name: 'instant',
  duration: ANIMATION_TIMINGS.instant,
  easing: 'linear',
  delay: 0,
};

/**
 * Animation registry with all presets
 */
export const ANIMATION_REGISTRY: AnimationRegistry = {
  fast: ANIMATION_FAST,
  normal: ANIMATION_NORMAL,
  slow: ANIMATION_SLOW,
  instant: ANIMATION_INSTANT,
};

// =============================================================================
// Animation Utilities
// =============================================================================

/**
 * Get animation preset by name
 * @param name - Preset name
 * @returns Animation preset or undefined
 */
export function getAnimationPreset(name: string): AnimationPreset | undefined {
  return ANIMATION_REGISTRY[name as keyof AnimationRegistry];
}

/**
 * Get CSS transition string from preset
 * @param preset - Animation preset
 * @param property - CSS property to animate (default: 'all')
 * @returns CSS transition string
 */
export function getTransitionString(
  preset: AnimationPreset,
  property: string = 'all'
): string {
  const { duration, easing, delay = 0 } = preset;
  return `${property} ${duration}ms ${easing} ${delay}ms`;
}

/**
 * Get CSS animation string from preset
 * @param preset - Animation preset
 * @param animationName - Animation name
 * @returns CSS animation string
 */
export function getAnimationString(
  preset: AnimationPreset,
  animationName: string
): string {
  const { duration, easing, delay = 0 } = preset;
  return `${animationName} ${duration}ms ${easing} ${delay}ms forwards`;
}

/**
 * Combine multiple animation presets
 * @param presets - Animation presets to combine
 * @returns Combined animation string
 */
export function combineAnimations(presets: readonly AnimationPreset[]): string {
  return presets.map((p) => getAnimationString(p, p.name)).join(', ');
}

/**
 * Get easing function value
 * @param easing - Easing function name
 * @returns Easing function value
 */
export function getEasingValue(easing: string): string {
  return EASING_FUNCTIONS[easing as keyof typeof EASING_FUNCTIONS] || easing;
}

/**
 * Check if animations should be reduced based on system preference
 * @returns Whether to reduce motion
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation preset with reduced motion applied
 * @param preset - Original preset
 * @param reduceMotion - Whether to reduce motion
 * @returns Modified preset
 */
export function applyReduceMotion(
  preset: AnimationPreset,
  reduceMotion: boolean
): AnimationPreset {
  if (!reduceMotion) return preset;

  return {
    ...preset,
    duration: ANIMATION_TIMINGS.instant,
    delay: 0,
  };
}

/**
 * Create custom animation preset
 * @param name - Preset name
 * @param duration - Duration in milliseconds
 * @param easing - Easing function
 * @param delay - Optional delay in milliseconds
 * @returns Custom animation preset
 */
export function createAnimationPreset(
  name: string,
  duration: number,
  easing: EasingFunction,
  delay?: number
): AnimationPreset {
  return {
    name,
    duration,
    easing,
    delay,
  };
}

// =============================================================================
// Animation Keyframes
// =============================================================================

/**
 * Common animation keyframes
 */
export const ANIMATION_KEYFRAMES = {
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,
  slideInUp: `
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(0.625rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  slideInDown: `
    @keyframes slideInDown {
      from {
        opacity: 0;
        transform: translateY(-0.625rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  slideInLeft: `
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-0.625rem);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(0.625rem);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  scaleOut: `
    @keyframes scaleOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
  spin: `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
} as const;

/**
 * Get animation keyframes CSS
 * @returns CSS string with all keyframes
 */
export function getAnimationKeyframesCSS(): string {
  return Object.values(ANIMATION_KEYFRAMES).join('\n');
}
