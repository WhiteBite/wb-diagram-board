/**
 * WB Theme System - Theme Presets
 * 
 * Built-in theme presets: light, dark, high-contrast (light/dark), and sepia
 * Production-quality themes with WCAG AA compliance
 */

import { Theme, ThemeColors, AnimationConfig } from '../../types/theme';
import { nanoid } from 'nanoid';

// =============================================================================
// Light Theme Colors
// =============================================================================

const LIGHT_COLORS: ThemeColors = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#1f2937',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    canvasBg: '#f5f5f5',
    canvasGrid: '#e0e0e0',
    canvasSelection: '#6366f1',
    toolbarBg: '#ffffff',
    toolbarHover: '#f3f4f6',
    toolbarActive: '#e0e7ff',
    elementStroke: '#1e1e1e',
    elementFill: '#ffffff',
    uiShadow: 'rgba(0, 0, 0, 0.08)',
};

// =============================================================================
// Dark Theme Colors
// =============================================================================

const DARK_COLORS: ThemeColors = {
    primary: '#818cf8',
    secondary: '#a78bfa',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    border: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    canvasBg: '#1a1a2e',
    canvasGrid: '#2d2d44',
    canvasSelection: '#818cf8',
    toolbarBg: '#16213e',
    toolbarHover: '#1f3460',
    toolbarActive: '#3730a3',
    elementStroke: '#e5e7eb',
    elementFill: '#2d2d44',
    uiShadow: 'rgba(0, 0, 0, 0.3)',
};

// =============================================================================
// High Contrast Light Theme Colors (WCAG AAA compliant)
// =============================================================================

const HIGH_CONTRAST_LIGHT_COLORS: ThemeColors = {
    primary: '#0000cc',
    secondary: '#6600cc',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textMuted: '#1a1a1a',
    border: '#000000',
    success: '#006600',
    warning: '#cc6600',
    error: '#cc0000',
    canvasBg: '#ffffff',
    canvasGrid: '#999999',
    canvasSelection: '#0000cc',
    toolbarBg: '#ffffff',
    toolbarHover: '#d9d9d9',
    toolbarActive: '#0000cc',
    elementStroke: '#000000',
    elementFill: '#ffffff',
    uiShadow: 'rgba(0, 0, 0, 0.4)',
};

// =============================================================================
// High Contrast Dark Theme Colors (WCAG AAA compliant)
// =============================================================================

const HIGH_CONTRAST_DARK_COLORS: ThemeColors = {
    primary: '#66b3ff',
    secondary: '#cc99ff',
    background: '#000000',
    surface: '#0d0d0d',
    text: '#ffffff',
    textMuted: '#e6e6e6',
    border: '#ffffff',
    success: '#66ff66',
    warning: '#ffcc00',
    error: '#ff6666',
    canvasBg: '#000000',
    canvasGrid: '#404040',
    canvasSelection: '#66b3ff',
    toolbarBg: '#0d0d0d',
    toolbarHover: '#262626',
    toolbarActive: '#66b3ff',
    elementStroke: '#ffffff',
    elementFill: '#1a1a1a',
    uiShadow: 'rgba(255, 255, 255, 0.15)',
};

// =============================================================================
// Sepia Theme Colors (for comfortable reading)
// =============================================================================

const SEPIA_COLORS: ThemeColors = {
    primary: '#8b6914',
    secondary: '#a67c00',
    background: '#f4ecd8',
    surface: '#efe6d5',
    text: '#3d3d3d',
    textMuted: '#5c5c5c',
    border: '#d4c4a8',
    success: '#5d8a3e',
    warning: '#c9a227',
    error: '#b54a4a',
    canvasBg: '#f9f3e3',
    canvasGrid: '#e0d5c1',
    canvasSelection: '#8b6914',
    toolbarBg: '#f4ecd8',
    toolbarHover: '#e8dfc8',
    toolbarActive: '#d4c4a8',
    elementStroke: '#3d3d3d',
    elementFill: '#faf6ed',
    uiShadow: 'rgba(61, 61, 61, 0.1)',
};

// =============================================================================
// Default Animation Config
// =============================================================================

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
    enabled: true,
    duration: 200,
    easing: 'ease-out',
    reduceMotion: false,
};

/**
 * Reduced motion animation config
 */
const REDUCED_MOTION_CONFIG: AnimationConfig = {
    enabled: true,
    duration: 0,
    easing: 'linear',
    reduceMotion: true,
};

// =============================================================================
// Theme Presets
// =============================================================================

/**
 * Light theme preset (default)
 */
export const LIGHT_THEME: Theme = {
    id: 'theme-light',
    name: 'Light',
    type: 'light',
    isDark: false,
    colors: LIGHT_COLORS,
    animations: DEFAULT_ANIMATION_CONFIG,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

/**
 * Dark theme preset
 */
export const DARK_THEME: Theme = {
    id: 'theme-dark',
    name: 'Dark',
    type: 'dark',
    isDark: true,
    colors: DARK_COLORS,
    animations: DEFAULT_ANIMATION_CONFIG,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

/**
 * High contrast light theme preset (WCAG AAA)
 */
export const HIGH_CONTRAST_LIGHT_THEME: Theme = {
    id: 'theme-high-contrast-light',
    name: 'High Contrast Light',
    type: 'high-contrast',
    isDark: false,
    colors: HIGH_CONTRAST_LIGHT_COLORS,
    animations: DEFAULT_ANIMATION_CONFIG,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

/**
 * High contrast dark theme preset (WCAG AAA)
 */
export const HIGH_CONTRAST_DARK_THEME: Theme = {
    id: 'theme-high-contrast-dark',
    name: 'High Contrast Dark',
    type: 'high-contrast',
    isDark: true,
    colors: HIGH_CONTRAST_DARK_COLORS,
    animations: DEFAULT_ANIMATION_CONFIG,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

/**
 * Sepia theme preset (comfortable reading)
 */
export const SEPIA_THEME: Theme = {
    id: 'theme-sepia',
    name: 'Sepia',
    type: 'light',
    isDark: false,
    colors: SEPIA_COLORS,
    animations: DEFAULT_ANIMATION_CONFIG,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

/**
 * Legacy high contrast theme (alias for high-contrast-light)
 * @deprecated Use HIGH_CONTRAST_LIGHT_THEME instead
 */
export const HIGH_CONTRAST_THEME = HIGH_CONTRAST_LIGHT_THEME;

/**
 * All built-in theme presets
 */
export const THEME_PRESETS: readonly Theme[] = [
    LIGHT_THEME,
    DARK_THEME,
    HIGH_CONTRAST_LIGHT_THEME,
    HIGH_CONTRAST_DARK_THEME,
    SEPIA_THEME,
];

/**
 * Theme preset map for quick lookup
 */
export const THEME_PRESET_MAP: ReadonlyMap<string, Theme> = new Map(
    THEME_PRESETS.map((theme) => [theme.id, theme])
);

/**
 * Get theme preset by ID
 * @param themeId - Theme ID
 * @returns Theme preset or undefined
 */
export function getThemePreset(themeId: string): Theme | undefined {
    return THEME_PRESET_MAP.get(themeId);
}

/**
 * Get theme preset by type
 * @param type - Theme type
 * @param preferDark - Prefer dark variant for high-contrast
 * @returns Theme preset or undefined
 */
export function getThemePresetByType(
    type: 'light' | 'dark' | 'high-contrast',
    preferDark = false
): Theme | undefined {
    if (type === 'high-contrast') {
        return preferDark ? HIGH_CONTRAST_DARK_THEME : HIGH_CONTRAST_LIGHT_THEME;
    }
    return THEME_PRESETS.find((theme) => theme.type === type);
}

/**
 * Get all themes of a specific type
 * @param type - Theme type
 * @returns Array of themes
 */
export function getThemesByType(type: 'light' | 'dark' | 'high-contrast'): readonly Theme[] {
    return THEME_PRESETS.filter((theme) => theme.type === type);
}

/**
 * Get all dark themes
 * @returns Array of dark themes
 */
export function getDarkThemes(): readonly Theme[] {
    return THEME_PRESETS.filter((theme) => theme.isDark);
}

/**
 * Get all light themes
 * @returns Array of light themes
 */
export function getLightThemes(): readonly Theme[] {
    return THEME_PRESETS.filter((theme) => !theme.isDark);
}

/**
 * Create a custom theme based on a preset
 * @param baseName - Base theme name
 * @param baseThemeId - ID of theme to base on (default: light)
 * @param overrides - Color and animation overrides
 * @returns New custom theme
 */
export function createCustomTheme(
    baseName: string,
    baseThemeId: string = 'theme-light',
    overrides?: {
        colors?: Partial<ThemeColors>;
        animations?: Partial<AnimationConfig>;
    }
): Theme {
    const baseTheme = getThemePreset(baseThemeId) || LIGHT_THEME;

    return {
        id: `theme-custom-${nanoid()}`,
        name: baseName,
        type: baseTheme.type,
        isDark: baseTheme.isDark,
        colors: {
            ...baseTheme.colors,
            ...overrides?.colors,
        },
        animations: {
            ...baseTheme.animations,
            ...overrides?.animations,
        },
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/**
 * Clone a theme with a new ID and name
 * @param theme - Theme to clone
 * @param newName - New theme name
 * @returns Cloned theme
 */
export function cloneTheme(theme: Theme, newName: string): Theme {
    return {
        ...theme,
        id: `theme-custom-${nanoid()}`,
        name: newName,
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/**
 * Merge theme colors with defaults
 * @param colors - Partial colors
 * @param baseColors - Base colors to merge with
 * @returns Complete colors object
 */
export function mergeThemeColors(
    colors: Partial<ThemeColors>,
    baseColors: ThemeColors = LIGHT_COLORS
): ThemeColors {
    return {
        ...baseColors,
        ...colors,
    };
}

/**
 * Merge animation config with defaults
 * @param config - Partial animation config
 * @param baseConfig - Base config to merge with
 * @returns Complete animation config
 */
export function mergeAnimationConfig(
    config: Partial<AnimationConfig>,
    baseConfig: AnimationConfig = DEFAULT_ANIMATION_CONFIG
): AnimationConfig {
    return {
        ...baseConfig,
        ...config,
    };
}

/**
 * Get default animation config
 * @param reduceMotion - Whether to use reduced motion
 * @returns Animation config
 */
export function getDefaultAnimationConfig(reduceMotion = false): AnimationConfig {
    return reduceMotion ? REDUCED_MOTION_CONFIG : DEFAULT_ANIMATION_CONFIG;
}

/**
 * Color categories for theme customizer UI
 */
export const COLOR_CATEGORIES = {
    brand: ['primary', 'secondary'] as const,
    background: ['background', 'surface', 'canvasBg'] as const,
    text: ['text', 'textMuted'] as const,
    ui: ['border', 'toolbarBg', 'toolbarHover', 'toolbarActive', 'uiShadow'] as const,
    canvas: ['canvasGrid', 'canvasSelection', 'elementStroke', 'elementFill'] as const,
    status: ['success', 'warning', 'error'] as const,
} as const;

/**
 * Color labels for UI display
 */
export const COLOR_LABELS: Record<keyof ThemeColors, string> = {
    primary: 'Primary',
    secondary: 'Secondary',
    background: 'Background',
    surface: 'Surface',
    text: 'Text',
    textMuted: 'Muted Text',
    border: 'Border',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    canvasBg: 'Canvas Background',
    canvasGrid: 'Canvas Grid',
    canvasSelection: 'Selection',
    toolbarBg: 'Toolbar Background',
    toolbarHover: 'Toolbar Hover',
    toolbarActive: 'Toolbar Active',
    elementStroke: 'Element Stroke',
    elementFill: 'Element Fill',
    uiShadow: 'Shadow',
};
