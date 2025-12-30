/**
 * WB Theme System - Theme Manager
 * 
 * Core theme management: loading, switching, validation, and persistence
 */

import {
    Theme,
    ThemeCreateOptions,
    ThemeUpdateOptions,
    ThemeValidationResult,
    ThemeExport,
    ThemeColors,
    THEME_CSS_VARIABLES,
} from '../../types/theme';
import {
    LIGHT_THEME,
    THEME_PRESETS,
    getThemePreset,
    mergeThemeColors,
    mergeAnimationConfig,
} from './theme-presets';
import { nanoid } from 'nanoid';

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'wb-theme-manager';
const CUSTOM_THEMES_KEY = 'wb-custom-themes';
const EXPORT_VERSION = '1.0.0';

// =============================================================================
// Theme Manager Class
// =============================================================================

/**
 * Theme manager for loading, switching, and managing themes
 */
export class ThemeManager {
    private currentTheme: Theme;
    private themes: Map<string, Theme>;
    private customThemes: Map<string, Theme>;

    /**
     * Create theme manager instance
     * @param initialTheme - Initial theme (default: light)
     */
    constructor(initialTheme: Theme = LIGHT_THEME) {
        this.currentTheme = initialTheme;
        this.themes = new Map();
        this.customThemes = new Map();

        // Register built-in themes
        THEME_PRESETS.forEach((theme) => {
            this.themes.set(theme.id, theme);
        });

        // Load custom themes from storage
        this.loadCustomThemesFromStorage();
    }

    // =========================================================================
    // Theme Loading & Switching
    // =========================================================================

    /**
     * Get current active theme
     * @returns Current theme
     */
    getCurrentTheme(): Theme {
        return this.currentTheme;
    }

    /**
     * Load theme by ID
     * @param themeId - Theme ID
     * @returns Theme or undefined
     */
    loadTheme(themeId: string): Theme | undefined {
        const theme = this.themes.get(themeId) || this.customThemes.get(themeId);
        return theme;
    }

    /**
     * Switch to theme by ID
     * @param themeId - Theme ID
     * @throws Error if theme not found
     */
    switchTheme(themeId: string): void {
        const theme = this.loadTheme(themeId);
        if (!theme) {
            throw new Error(`Theme not found: ${themeId}`);
        }

        this.currentTheme = theme;
        this.applyThemeToDOM(theme);
        this.saveCurrentThemeToStorage();
    }

    /**
     * Get all available themes
     * @returns Array of all themes
     */
    getAllThemes(): readonly Theme[] {
        return [
            ...Array.from(this.themes.values()),
            ...Array.from(this.customThemes.values()),
        ];
    }

    /**
     * Get all built-in themes
     * @returns Array of built-in themes
     */
    getBuiltInThemes(): readonly Theme[] {
        return Array.from(this.themes.values());
    }

    /**
     * Get all custom themes
     * @returns Array of custom themes
     */
    getCustomThemes(): readonly Theme[] {
        return Array.from(this.customThemes.values());
    }

    // =========================================================================
    // Theme Creation & Management
    // =========================================================================

    /**
     * Create new custom theme
     * @param options - Theme creation options
     * @returns Created theme
     */
    createTheme(options: ThemeCreateOptions): Theme {
        const baseTheme = getThemePreset(
            options.type === 'dark' ? 'theme-dark' : 'theme-light'
        ) || LIGHT_THEME;

        const theme: Theme = {
            id: `theme-custom-${nanoid()}`,
            name: options.name,
            type: options.type,
            isDark: options.type === 'dark',
            colors: mergeThemeColors(options.colors || {}, baseTheme.colors),
            animations: mergeAnimationConfig(
                options.animations || {},
                baseTheme.animations
            ),
            isCustom: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Validate theme
        const validation = this.validateTheme(theme);
        if (!validation.isValid) {
            throw new Error(`Invalid theme: ${validation.errors.join(', ')}`);
        }

        this.customThemes.set(theme.id, theme);
        this.saveCustomThemesToStorage();

        return theme;
    }

    /**
     * Update existing theme
     * @param themeId - Theme ID
     * @param options - Update options
     * @throws Error if theme not found or is built-in
     */
    updateTheme(themeId: string, options: ThemeUpdateOptions): void {
        const theme = this.customThemes.get(themeId);
        if (!theme) {
            throw new Error(`Custom theme not found: ${themeId}`);
        }

        const updated: Theme = {
            ...theme,
            name: options.name ?? theme.name,
            colors: mergeThemeColors(options.colors || {}, theme.colors),
            animations: mergeAnimationConfig(
                options.animations || {},
                theme.animations
            ),
            updatedAt: Date.now(),
        };

        // Validate updated theme
        const validation = this.validateTheme(updated);
        if (!validation.isValid) {
            throw new Error(`Invalid theme: ${validation.errors.join(', ')}`);
        }

        this.customThemes.set(themeId, updated);

        // Update current theme if it's the one being updated
        if (this.currentTheme.id === themeId) {
            this.currentTheme = updated;
            this.applyThemeToDOM(updated);
        }

        this.saveCustomThemesToStorage();
    }

    /**
     * Delete custom theme
     * @param themeId - Theme ID
     * @throws Error if theme not found or is built-in
     */
    deleteTheme(themeId: string): void {
        if (this.themes.has(themeId)) {
            throw new Error('Cannot delete built-in theme');
        }

        if (!this.customThemes.has(themeId)) {
            throw new Error(`Custom theme not found: ${themeId}`);
        }

        this.customThemes.delete(themeId);

        // Switch to light theme if deleted theme was active
        if (this.currentTheme.id === themeId) {
            this.switchTheme('theme-light');
        }

        this.saveCustomThemesToStorage();
    }

    // =========================================================================
    // Theme Validation
    // =========================================================================

    /**
     * Validate theme
     * @param theme - Theme to validate
     * @returns Validation result
     */
    validateTheme(theme: Theme): ThemeValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate required fields
        if (!theme.id || typeof theme.id !== 'string') {
            errors.push('Theme must have a valid id');
        }

        if (!theme.name || typeof theme.name !== 'string') {
            errors.push('Theme must have a valid name');
        }

        if (!theme.type || !['light', 'dark', 'high-contrast'].includes(theme.type)) {
            errors.push('Theme must have a valid type');
        }

        if (typeof theme.isDark !== 'boolean') {
            errors.push('Theme must have isDark boolean');
        }

        // Validate colors
        if (!theme.colors || typeof theme.colors !== 'object') {
            errors.push('Theme must have colors object');
        } else {
            const requiredColors = Object.keys(THEME_CSS_VARIABLES);
            const themeColorKeys = Object.keys(theme.colors);

            for (const color of requiredColors) {
                if (!themeColorKeys.includes(color)) {
                    errors.push(`Missing required color: ${color}`);
                }
            }

            // Validate color format
            for (const [key, value] of Object.entries(theme.colors)) {
                if (typeof value !== 'string') {
                    errors.push(`Color ${key} must be a string`);
                } else if (!this.isValidColor(value)) {
                    warnings.push(`Color ${key} may not be a valid CSS color: ${value}`);
                }
            }
        }

        // Validate animations
        if (!theme.animations || typeof theme.animations !== 'object') {
            errors.push('Theme must have animations object');
        } else {
            if (typeof theme.animations.enabled !== 'boolean') {
                errors.push('animations.enabled must be boolean');
            }

            if (typeof theme.animations.duration !== 'number' || theme.animations.duration < 0) {
                errors.push('animations.duration must be non-negative number');
            }

            if (typeof theme.animations.easing !== 'string') {
                errors.push('animations.easing must be string');
            }

            if (typeof theme.animations.reduceMotion !== 'boolean') {
                errors.push('animations.reduceMotion must be boolean');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors as readonly string[],
            warnings: warnings as readonly string[],
        };
    }

    /**
     * Check if string is valid CSS color
     * @param color - Color string
     * @returns Whether color is valid
     */
    private isValidColor(color: string): boolean {
        // Basic validation - check if it's a valid CSS color format
        const s = new Option().style;
        s.color = color;
        return s.color !== '';
    }

    // =========================================================================
    // Theme Export & Import
    // =========================================================================

    /**
     * Export theme as JSON
     * @param themeId - Theme ID
     * @returns Theme export object
     * @throws Error if theme not found
     */
    exportTheme(themeId: string): ThemeExport {
        const theme = this.loadTheme(themeId);
        if (!theme) {
            throw new Error(`Theme not found: ${themeId}`);
        }

        return {
            version: EXPORT_VERSION,
            theme,
            exportedAt: Date.now(),
        };
    }

    /**
     * Export theme as JSON string
     * @param themeId - Theme ID
     * @returns JSON string
     */
    exportThemeAsJSON(themeId: string): string {
        const exported = this.exportTheme(themeId);
        return JSON.stringify(exported, null, 2);
    }

    /**
     * Import theme from JSON
     * @param json - JSON string
     * @returns Imported theme
     * @throws Error if JSON is invalid
     */
    importTheme(json: string): Theme {
        let exported: ThemeExport;

        try {
            exported = JSON.parse(json) as ThemeExport;
        } catch (error) {
            throw new Error('Invalid JSON format');
        }

        if (!exported.version || !exported.theme) {
            throw new Error('Invalid theme export format');
        }

        const theme = exported.theme as Theme;

        // Validate imported theme
        const validation = this.validateTheme(theme);
        if (!validation.isValid) {
            throw new Error(`Invalid imported theme: ${validation.errors.join(', ')}`);
        }

        // Create new ID for imported theme
        const importedTheme: Theme = {
            ...theme,
            id: `theme-imported-${nanoid()}`,
            isCustom: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this.customThemes.set(importedTheme.id, importedTheme);
        this.saveCustomThemesToStorage();

        return importedTheme;
    }

    // =========================================================================
    // DOM Application
    // =========================================================================

    /**
     * Apply theme to DOM
     * @param theme - Theme to apply
     */
    private applyThemeToDOM(theme: Theme): void {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;

        // Remove all theme classes first
        root.classList.remove('dark', 'high-contrast', 'sepia');

        // Apply color variables
        for (const [key, cssVar] of Object.entries(THEME_CSS_VARIABLES)) {
            const colorValue = theme.colors[key as keyof ThemeColors];
            if (colorValue) {
                root.style.setProperty(cssVar, colorValue);
            }
        }

        // Apply theme-specific classes
        if (theme.isDark) {
            root.classList.add('dark');
        }

        if (theme.type === 'high-contrast') {
            root.classList.add('high-contrast');
        }

        // Special handling for sepia theme
        if (theme.id === 'theme-sepia') {
            root.classList.add('sepia');
        }

        // Set data attribute for more specific CSS targeting
        root.setAttribute('data-theme', theme.id);

        // Dispatch custom event
        window.dispatchEvent(
            new CustomEvent('theme-changed', {
                detail: { theme },
            })
        );
    }

    // =========================================================================
    // Storage
    // =========================================================================

    /**
     * Save current theme to storage
     */
    private saveCurrentThemeToStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            localStorage.setItem(STORAGE_KEY, this.currentTheme.id);
        } catch (error) {
            console.error('[ThemeManager] Failed to save current theme:', error);
        }
    }

    /**
     * Load current theme from storage
     */
    loadCurrentThemeFromStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const themeId = localStorage.getItem(STORAGE_KEY);
            if (themeId) {
                const theme = this.loadTheme(themeId);
                if (theme) {
                    this.currentTheme = theme;
                    this.applyThemeToDOM(theme);
                }
            }
        } catch (error) {
            console.error('[ThemeManager] Failed to load current theme:', error);
        }
    }

    /**
     * Save custom themes to storage
     */
    private saveCustomThemesToStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const themes = Array.from(this.customThemes.values());
            localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
        } catch (error) {
            console.error('[ThemeManager] Failed to save custom themes:', error);
        }
    }

    /**
     * Load custom themes from storage
     */
    private loadCustomThemesFromStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const json = localStorage.getItem(CUSTOM_THEMES_KEY);
            if (json) {
                const themes = JSON.parse(json) as Theme[];
                themes.forEach((theme) => {
                    const validation = this.validateTheme(theme);
                    if (validation.isValid) {
                        this.customThemes.set(theme.id, theme);
                    }
                });
            }
        } catch (error) {
            console.error('[ThemeManager] Failed to load custom themes:', error);
        }
    }

    /**
     * Reset to default themes
     */
    resetToDefaults(): void {
        this.customThemes.clear();
        this.saveCustomThemesToStorage();
        this.switchTheme('theme-light');
    }

    // =========================================================================
    // System Preference Detection
    // =========================================================================

    /**
     * Detect system dark mode preference
     * @returns Whether system prefers dark mode
     */
    detectSystemPreference(): boolean {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /**
     * Listen to system preference changes
     * @param callback - Callback when preference changes
     * @returns Unsubscribe function
     */
    onSystemPreferenceChange(callback: (prefersDark: boolean) => void): () => void {
        if (typeof window === 'undefined') return () => { };

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => callback(e.matches);

        mediaQuery.addEventListener('change', handler);

        return () => {
            mediaQuery.removeEventListener('change', handler);
        };
    }
}

/**
 * Global theme manager instance
 */
export const themeManager = new ThemeManager();
