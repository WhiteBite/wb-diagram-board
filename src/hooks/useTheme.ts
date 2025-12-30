/**
 * WB Theme - useTheme Hook
 * 
 * Custom hook for theme management and switching
 */

import { useCallback, useEffect } from 'react';
import { useThemeStore } from '../store/theme-store';
import { Theme, ThemeCreateOptions, ThemeUpdateOptions } from '../types/theme';

/**
 * Hook for managing themes
 * 
 * @returns Object with theme management functions and state
 */
export function useTheme() {
    const currentTheme = useThemeStore((s) => s.currentTheme);
    const themes = useThemeStore((s) => s.themes);
    const systemPrefersDark = useThemeStore((s) => s.systemPrefersDark);
    const useSystemPreference = useThemeStore((s) => s.useSystemPreference);

    const setTheme = useThemeStore((s) => s.setTheme);
    const createTheme = useThemeStore((s) => s.createTheme);
    const updateTheme = useThemeStore((s) => s.updateTheme);
    const deleteTheme = useThemeStore((s) => s.deleteTheme);
    const exportTheme = useThemeStore((s) => s.exportTheme);
    const importTheme = useThemeStore((s) => s.importTheme);
    const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
    const setUseSystemPreference = useThemeStore((s) => s.setUseSystemPreference);
    const detectSystemPreference = useThemeStore((s) => s.detectSystemPreference);
    const resetToDefaults = useThemeStore((s) => s.resetToDefaults);

    /**
     * Switch to theme by ID
     */
    const switchTheme = useCallback(
        (themeId: string) => {
            try {
                setTheme(themeId);
            } catch (error) {
                console.error('[useTheme] Failed to switch theme:', error);
            }
        },
        [setTheme]
    );

    /**
     * Switch to dark theme
     */
    const switchToDark = useCallback(() => {
        switchTheme('theme-dark');
    }, [switchTheme]);

    /**
     * Switch to light theme
     */
    const switchToLight = useCallback(() => {
        switchTheme('theme-light');
    }, [switchTheme]);

    /**
     * Switch to high contrast theme
     */
    const switchToHighContrast = useCallback(() => {
        switchTheme('theme-high-contrast');
    }, [switchTheme]);

    /**
     * Create new custom theme
     */
    const createCustomTheme = useCallback(
        (options: ThemeCreateOptions): Theme => {
            try {
                return createTheme(options);
            } catch (error) {
                console.error('[useTheme] Failed to create theme:', error);
                throw error;
            }
        },
        [createTheme]
    );

    /**
     * Update theme
     */
    const updateCurrentTheme = useCallback(
        (themeId: string, options: ThemeUpdateOptions) => {
            try {
                updateTheme(themeId, options);
            } catch (error) {
                console.error('[useTheme] Failed to update theme:', error);
                throw error;
            }
        },
        [updateTheme]
    );

    /**
     * Delete theme
     */
    const removeTheme = useCallback(
        (themeId: string) => {
            try {
                deleteTheme(themeId);
            } catch (error) {
                console.error('[useTheme] Failed to delete theme:', error);
                throw error;
            }
        },
        [deleteTheme]
    );

    /**
     * Export theme as JSON string
     */
    const exportThemeAsJSON = useCallback(
        (themeId: string): string => {
            try {
                const exported = exportTheme(themeId);
                return JSON.stringify(exported, null, 2);
            } catch (error) {
                console.error('[useTheme] Failed to export theme:', error);
                throw error;
            }
        },
        [exportTheme]
    );

    /**
     * Import theme from JSON string
     */
    const importThemeFromJSON = useCallback(
        (json: string): Theme => {
            try {
                return importTheme(json);
            } catch (error) {
                console.error('[useTheme] Failed to import theme:', error);
                throw error;
            }
        },
        [importTheme]
    );

    /**
     * Toggle between dark and light mode
     */
    const toggleDarkModeTheme = useCallback(() => {
        toggleDarkMode();
    }, [toggleDarkMode]);

    /**
     * Enable system preference
     */
    const enableSystemPreference = useCallback(() => {
        setUseSystemPreference(true);
    }, [setUseSystemPreference]);

    /**
     * Disable system preference
     */
    const disableSystemPreference = useCallback(() => {
        setUseSystemPreference(false);
    }, [setUseSystemPreference]);

    /**
     * Get theme by ID
     */
    const getTheme = useCallback(
        (themeId: string): Theme | undefined => {
            return themes.find((t) => t.id === themeId);
        },
        [themes]
    );

    /**
     * Get all custom themes
     */
    const getCustomThemes = useCallback((): readonly Theme[] => {
        return themes.filter((t) => t.isCustom);
    }, [themes]);

    /**
     * Get all built-in themes
     */
    const getBuiltInThemes = useCallback((): readonly Theme[] => {
        return themes.filter((t) => !t.isCustom);
    }, [themes]);

    /**
     * Check if current theme is dark
     */
    const isDarkMode = currentTheme.isDark;

    /**
     * Check if current theme is custom
     */
    const isCustomTheme = currentTheme.isCustom;

    return {
        // State
        currentTheme,
        themes,
        systemPrefersDark,
        useSystemPreference,
        isDarkMode,
        isCustomTheme,

        // Theme switching
        switchTheme,
        switchToDark,
        switchToLight,
        switchToHighContrast,
        toggleDarkModeTheme,

        // Theme management
        createCustomTheme,
        updateCurrentTheme,
        removeTheme,
        getTheme,
        getCustomThemes,
        getBuiltInThemes,

        // Import/Export
        exportThemeAsJSON,
        importThemeFromJSON,

        // System preference
        enableSystemPreference,
        disableSystemPreference,
        detectSystemPreference,

        // Reset
        resetToDefaults,
    };
}

/**
 * Hook for listening to theme changes
 * 
 * @param callback - Callback when theme changes
 */
export function useThemeChange(callback: (theme: Theme) => void): void {
    const currentTheme = useThemeStore((s) => s.currentTheme);

    useEffect(() => {
        callback(currentTheme);
    }, [currentTheme, callback]);
}

/**
 * Hook for dark mode detection
 * 
 * @returns Whether dark mode is enabled
 */
export function useDarkMode(): boolean {
    const isDarkMode = useThemeStore((s) => s.currentTheme.isDark);
    return isDarkMode;
}

/**
 * Hook for system preference detection
 * 
 * @returns Whether system prefers dark mode
 */
export function useSystemDarkModePreference(): boolean {
    const systemPrefersDark = useThemeStore((s) => s.systemPrefersDark);
    return systemPrefersDark;
}
