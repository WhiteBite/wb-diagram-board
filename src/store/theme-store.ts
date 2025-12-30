/**
 * WB Theme Store - Zustand Store
 * 
 * Global state management for themes and animations
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    Theme,
    ThemeStoreState,
    ThemeStoreActions,
    ThemeCreateOptions,
    ThemeUpdateOptions,
    ThemeExport,
} from '../types/theme';
import { themeManager } from '../core/theme/theme-manager';
import { LIGHT_THEME } from '../core/theme/theme-presets';

// =============================================================================
// Store Type
// =============================================================================

type ThemeStore = ThemeStoreState & ThemeStoreActions;

// =============================================================================
// Store Creation
// =============================================================================

/**
 * Create theme store with Zustand
 */
export const useThemeStore = create<ThemeStore>()(
    immer((set, get) => {
        // Initialize system preference detection
        const systemPrefersDark = themeManager.detectSystemPreference();

        return {
            // =====================================================================
            // State
            // =====================================================================

            currentTheme: LIGHT_THEME,
            themes: Array.from(themeManager.getAllThemes()),
            systemPrefersDark,
            useSystemPreference: false,

            // =====================================================================
            // Actions
            // =====================================================================

            /**
             * Set current theme by ID
             */
            setTheme: (themeId: string) => {
                try {
                    themeManager.switchTheme(themeId);
                    const theme = themeManager.getCurrentTheme();

                    set((state) => {
                        state.currentTheme = theme;
                    });
                } catch (error) {
                    console.error('[ThemeStore] Failed to set theme:', error);
                }
            },

            /**
             * Create new custom theme
             */
            createTheme: (options: ThemeCreateOptions): Theme => {
                try {
                    const theme = themeManager.createTheme(options);

                    set((state) => {
                        state.themes = Array.from(themeManager.getAllThemes());
                    });

                    return theme;
                } catch (error) {
                    console.error('[ThemeStore] Failed to create theme:', error);
                    throw error;
                }
            },

            /**
             * Update existing theme
             */
            updateTheme: (themeId: string, options: ThemeUpdateOptions) => {
                try {
                    themeManager.updateTheme(themeId, options);
                    const currentTheme = themeManager.getCurrentTheme();

                    set((state) => {
                        state.currentTheme = currentTheme;
                        state.themes = Array.from(themeManager.getAllThemes());
                    });
                } catch (error) {
                    console.error('[ThemeStore] Failed to update theme:', error);
                    throw error;
                }
            },

            /**
             * Delete custom theme
             */
            deleteTheme: (themeId: string) => {
                try {
                    themeManager.deleteTheme(themeId);
                    const currentTheme = themeManager.getCurrentTheme();

                    set((state) => {
                        state.currentTheme = currentTheme;
                        state.themes = Array.from(themeManager.getAllThemes());
                    });
                } catch (error) {
                    console.error('[ThemeStore] Failed to delete theme:', error);
                    throw error;
                }
            },

            /**
             * Export theme as JSON
             */
            exportTheme: (themeId: string): ThemeExport => {
                try {
                    return themeManager.exportTheme(themeId);
                } catch (error) {
                    console.error('[ThemeStore] Failed to export theme:', error);
                    throw error;
                }
            },

            /**
             * Import theme from JSON
             */
            importTheme: (json: string): Theme => {
                try {
                    const theme = themeManager.importTheme(json);

                    set((state) => {
                        state.themes = Array.from(themeManager.getAllThemes());
                    });

                    return theme;
                } catch (error) {
                    console.error('[ThemeStore] Failed to import theme:', error);
                    throw error;
                }
            },

            /**
             * Toggle dark mode
             */
            toggleDarkMode: () => {
                const currentTheme = get().currentTheme;
                const targetThemeId = currentTheme.isDark ? 'theme-light' : 'theme-dark';

                try {
                    themeManager.switchTheme(targetThemeId);
                    const theme = themeManager.getCurrentTheme();

                    set((state) => {
                        state.currentTheme = theme;
                    });
                } catch (error) {
                    console.error('[ThemeStore] Failed to toggle dark mode:', error);
                }
            },

            /**
             * Set system preference usage
             */
            setUseSystemPreference: (use: boolean) => {
                set((state) => {
                    state.useSystemPreference = use;
                });

                if (use) {
                    const prefersDark = themeManager.detectSystemPreference();
                    const targetThemeId = prefersDark ? 'theme-dark' : 'theme-light';

                    try {
                        themeManager.switchTheme(targetThemeId);
                        const theme = themeManager.getCurrentTheme();

                        set((state) => {
                            state.currentTheme = theme;
                        });
                    } catch (error) {
                        console.error('[ThemeStore] Failed to apply system preference:', error);
                    }
                }
            },

            /**
             * Detect system preference
             */
            detectSystemPreference: (): boolean => {
                const prefersDark = themeManager.detectSystemPreference();

                set((state) => {
                    state.systemPrefersDark = prefersDark;
                });

                return prefersDark;
            },

            /**
             * Reset to default themes
             */
            resetToDefaults: () => {
                try {
                    themeManager.resetToDefaults();
                    const theme = themeManager.getCurrentTheme();

                    set((state) => {
                        state.currentTheme = theme;
                        state.themes = Array.from(themeManager.getAllThemes());
                    });
                } catch (error) {
                    console.error('[ThemeStore] Failed to reset to defaults:', error);
                }
            },
        };
    })
);

/**
 * Initialize theme store on app load
 */
export function initializeThemeStore(): void {
    // Load saved theme from storage
    themeManager.loadCurrentThemeFromStorage();

    // Update store with current theme
    const currentTheme = themeManager.getCurrentTheme();
    useThemeStore.setState({
        currentTheme,
        themes: Array.from(themeManager.getAllThemes()),
    });

    // Listen to system preference changes
    const unsubscribe = themeManager.onSystemPreferenceChange((prefersDark) => {
        useThemeStore.setState({ systemPrefersDark: prefersDark });

        // Auto-switch if using system preference
        const state = useThemeStore.getState();
        if (state.useSystemPreference) {
            const targetThemeId = prefersDark ? 'theme-dark' : 'theme-light';
            try {
                themeManager.switchTheme(targetThemeId);
                useThemeStore.setState({
                    currentTheme: themeManager.getCurrentTheme(),
                });
            } catch (error) {
                console.error('[ThemeStore] Failed to apply system preference:', error);
            }
        }
    });

    // Store unsubscribe function for cleanup
    (useThemeStore as any).__unsubscribeSystemPreference = unsubscribe;
}

/**
 * Cleanup theme store
 */
export function cleanupThemeStore(): void {
    const unsubscribe = (useThemeStore as any).__unsubscribeSystemPreference;
    if (typeof unsubscribe === 'function') {
        unsubscribe();
    }
}
