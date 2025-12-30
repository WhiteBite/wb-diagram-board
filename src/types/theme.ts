/**
 * WB Theme System - Type Definitions
 * 
 * Type definitions for theme management, color palettes, and animations
 */

// =============================================================================
// Color Palette Types
// =============================================================================

/**
 * Color palette for a theme
 */
export interface ThemeColors {
    /** Primary brand color */
    readonly primary: string;
    /** Secondary brand color */
    readonly secondary: string;
    /** Background color */
    readonly background: string;
    /** Surface/card background color */
    readonly surface: string;
    /** Text color */
    readonly text: string;
    /** Muted text color */
    readonly textMuted: string;
    /** Border color */
    readonly border: string;
    /** Success state color */
    readonly success: string;
    /** Warning state color */
    readonly warning: string;
    /** Error state color */
    readonly error: string;
    /** Canvas background */
    readonly canvasBg: string;
    /** Canvas grid color */
    readonly canvasGrid: string;
    /** Canvas selection color */
    readonly canvasSelection: string;
    /** Toolbar background */
    readonly toolbarBg: string;
    /** Toolbar hover state */
    readonly toolbarHover: string;
    /** Toolbar active state */
    readonly toolbarActive: string;
    /** Element stroke color */
    readonly elementStroke: string;
    /** Element fill color */
    readonly elementFill: string;
    /** UI shadow color */
    readonly uiShadow: string;
}

// =============================================================================
// Animation Types
// =============================================================================

/**
 * Easing function type
 */
export type EasingFunction =
    | 'linear'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'cubic-bezier';

/**
 * Animation preset configuration
 */
export interface AnimationPreset {
    /** Preset name */
    readonly name: string;
    /** Animation duration in milliseconds */
    readonly duration: number;
    /** Easing function */
    readonly easing: EasingFunction;
    /** Optional delay in milliseconds */
    readonly delay?: number;
}

/**
 * Animation configuration for a theme
 */
export interface AnimationConfig {
    /** Whether animations are enabled */
    readonly enabled: boolean;
    /** Default animation duration */
    readonly duration: number;
    /** Default easing function */
    readonly easing: EasingFunction;
    /** Reduce motion preference */
    readonly reduceMotion: boolean;
}

/**
 * Animation registry with named presets
 */
export interface AnimationRegistry {
    readonly fast: AnimationPreset;
    readonly normal: AnimationPreset;
    readonly slow: AnimationPreset;
    readonly instant: AnimationPreset;
}

// =============================================================================
// Theme Types
// =============================================================================

/**
 * Theme preset type
 */
export type ThemePresetType = 'light' | 'dark' | 'high-contrast';

/**
 * Complete theme definition
 */
export interface Theme {
    /** Unique theme identifier */
    readonly id: string;
    /** Theme name */
    readonly name: string;
    /** Theme preset type */
    readonly type: ThemePresetType;
    /** Whether this is a dark theme */
    readonly isDark: boolean;
    /** Color palette */
    readonly colors: ThemeColors;
    /** Animation configuration */
    readonly animations: AnimationConfig;
    /** Whether this is a custom theme */
    readonly isCustom: boolean;
    /** Creation timestamp */
    readonly createdAt: number;
    /** Last update timestamp */
    readonly updatedAt: number;
}

/**
 * Theme creation options
 */
export interface ThemeCreateOptions {
    /** Theme name */
    readonly name: string;
    /** Theme type */
    readonly type: ThemePresetType;
    /** Color palette (partial, will be merged with defaults) */
    readonly colors?: Partial<ThemeColors>;
    /** Animation configuration (partial) */
    readonly animations?: Partial<AnimationConfig>;
}

/**
 * Theme update options
 */
export interface ThemeUpdateOptions {
    /** Theme name */
    readonly name?: string;
    /** Color palette updates */
    readonly colors?: Partial<ThemeColors>;
    /** Animation configuration updates */
    readonly animations?: Partial<AnimationConfig>;
}

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
    /** Whether theme is valid */
    readonly isValid: boolean;
    /** Validation errors */
    readonly errors: readonly string[];
    /** Validation warnings */
    readonly warnings: readonly string[];
}

/**
 * Theme export format
 */
export interface ThemeExport {
    /** Export version */
    readonly version: string;
    /** Theme data */
    readonly theme: Theme;
    /** Export timestamp */
    readonly exportedAt: number;
}

// =============================================================================
// Theme Store Types
// =============================================================================

/**
 * Theme store state
 */
export interface ThemeStoreState {
    /** Current active theme */
    readonly currentTheme: Theme;
    /** All available themes */
    readonly themes: readonly Theme[];
    /** System prefers dark mode */
    readonly systemPrefersDark: boolean;
    /** Use system preference */
    readonly useSystemPreference: boolean;
}

/**
 * Theme store actions
 */
export interface ThemeStoreActions {
    /** Set current theme by ID */
    setTheme: (themeId: string) => void;
    /** Create new custom theme */
    createTheme: (options: ThemeCreateOptions) => Theme;
    /** Update existing theme */
    updateTheme: (themeId: string, options: ThemeUpdateOptions) => void;
    /** Delete custom theme */
    deleteTheme: (themeId: string) => void;
    /** Export theme as JSON */
    exportTheme: (themeId: string) => ThemeExport;
    /** Import theme from JSON */
    importTheme: (json: string) => Theme;
    /** Toggle dark mode */
    toggleDarkMode: () => void;
    /** Set system preference usage */
    setUseSystemPreference: (use: boolean) => void;
    /** Detect system preference */
    detectSystemPreference: () => boolean;
    /** Reset to default themes */
    resetToDefaults: () => void;
}

// =============================================================================
// CSS Variable Types
// =============================================================================

/**
 * CSS variable mapping for theme colors
 */
export interface CSSVariableMap {
    readonly [key: string]: string;
}

/**
 * CSS variable names for theme
 */
export const THEME_CSS_VARIABLES = {
    // Primary colors
    primary: '--theme-primary',
    secondary: '--theme-secondary',

    // Backgrounds
    background: '--theme-background',
    surface: '--theme-surface',

    // Text
    text: '--theme-text',
    textMuted: '--theme-text-muted',

    // Borders
    border: '--theme-border',

    // States
    success: '--theme-success',
    warning: '--theme-warning',
    error: '--theme-error',

    // Canvas
    canvasBg: '--canvas-bg',
    canvasGrid: '--canvas-grid',
    canvasSelection: '--canvas-selection',

    // Toolbar
    toolbarBg: '--toolbar-bg',
    toolbarHover: '--toolbar-hover',
    toolbarActive: '--toolbar-active',

    // Elements
    elementStroke: '--element-stroke',
    elementFill: '--element-fill',

    // UI
    uiShadow: '--ui-shadow',
} as const;

// =============================================================================
// Animation Timing Types
// =============================================================================

/**
 * Animation timing constants
 */
export const ANIMATION_TIMINGS = {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
} as const;

/**
 * Easing function values
 */
export const EASING_FUNCTIONS = {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    cubicBezier: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
