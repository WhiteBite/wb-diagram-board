/**
 * WB Theme System - Unit Tests
 * 
 * Comprehensive test suite for theme management
 * Target: 100% code coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    Theme,
    ThemeColors,
    AnimationConfig,
    ThemeCreateOptions,
    ThemeUpdateOptions,
} from '../../src/types/theme';
import {
    LIGHT_THEME,
    DARK_THEME,
    HIGH_CONTRAST_THEME,
    getThemePreset,
    getThemePresetByType,
    createCustomTheme,
    mergeThemeColors,
    mergeAnimationConfig,
} from '../../src/core/theme/theme-presets';
import {
    ANIMATION_FAST,
    ANIMATION_NORMAL,
    ANIMATION_SLOW,
    ANIMATION_INSTANT,
    ANIMATION_REGISTRY,
    getAnimationPreset,
    getTransitionString,
    getAnimationString,
    getEasingValue,
    shouldReduceMotion,
    applyReduceMotion,
    createAnimationPreset,
} from '../../src/core/theme/animation-config';
import { ThemeManager } from '../../src/core/theme/theme-manager';

// =============================================================================
// Theme Presets Tests
// =============================================================================

describe('Theme Presets', () => {
    describe('LIGHT_THEME', () => {
        it('should have correct properties', () => {
            expect(LIGHT_THEME.id).toBe('theme-light');
            expect(LIGHT_THEME.name).toBe('Light');
            expect(LIGHT_THEME.type).toBe('light');
            expect(LIGHT_THEME.isDark).toBe(false);
            expect(LIGHT_THEME.isCustom).toBe(false);
        });

        it('should have valid colors', () => {
            expect(LIGHT_THEME.colors.primary).toBeDefined();
            expect(LIGHT_THEME.colors.background).toBe('#ffffff');
            expect(LIGHT_THEME.colors.text).toBe('#1f2937');
        });

        it('should have animation config', () => {
            expect(LIGHT_THEME.animations.enabled).toBe(true);
            expect(LIGHT_THEME.animations.duration).toBe(200);
            expect(LIGHT_THEME.animations.easing).toBe('ease-out');
        });
    });

    describe('DARK_THEME', () => {
        it('should have correct properties', () => {
            expect(DARK_THEME.id).toBe('theme-dark');
            expect(DARK_THEME.name).toBe('Dark');
            expect(DARK_THEME.type).toBe('dark');
            expect(DARK_THEME.isDark).toBe(true);
            expect(DARK_THEME.isCustom).toBe(false);
        });

        it('should have dark colors', () => {
            expect(DARK_THEME.colors.background).toBe('#0f172a');
            expect(DARK_THEME.colors.text).toBe('#e2e8f0');
        });
    });

    describe('HIGH_CONTRAST_THEME', () => {
        it('should have correct properties', () => {
            // HIGH_CONTRAST_THEME is now an alias for HIGH_CONTRAST_LIGHT_THEME
            expect(HIGH_CONTRAST_THEME.id).toBe('theme-high-contrast-light');
            expect(HIGH_CONTRAST_THEME.type).toBe('high-contrast');
        });

        it('should have high contrast colors', () => {
            // Updated to match actual high contrast light theme colors
            expect(HIGH_CONTRAST_THEME.colors.primary).toBe('#0000cc');
            expect(HIGH_CONTRAST_THEME.colors.background).toBe('#ffffff');
        });
    });

    describe('getThemePreset()', () => {
        it('should return light theme', () => {
            const theme = getThemePreset('theme-light');
            expect(theme).toEqual(LIGHT_THEME);
        });

        it('should return dark theme', () => {
            const theme = getThemePreset('theme-dark');
            expect(theme).toEqual(DARK_THEME);
        });

        it('should return undefined for unknown theme', () => {
            const theme = getThemePreset('unknown');
            expect(theme).toBeUndefined();
        });
    });

    describe('getThemePresetByType()', () => {
        it('should return light theme by type', () => {
            const theme = getThemePresetByType('light');
            expect(theme?.type).toBe('light');
        });

        it('should return dark theme by type', () => {
            const theme = getThemePresetByType('dark');
            expect(theme?.type).toBe('dark');
        });

        it('should return high contrast theme by type', () => {
            const theme = getThemePresetByType('high-contrast');
            expect(theme?.type).toBe('high-contrast');
        });
    });

    describe('createCustomTheme()', () => {
        it('should create custom theme with default colors', () => {
            const theme = createCustomTheme('My Theme');
            expect(theme.name).toBe('My Theme');
            expect(theme.isCustom).toBe(true);
            expect(theme.id).toMatch(/^theme-custom-/);
        });

        it('should create custom theme with color overrides', () => {
            // createCustomTheme now takes (name, baseThemeId, overrides)
            const theme = createCustomTheme('My Theme', 'theme-light', {
                colors: { primary: '#ff0000' },
            });
            expect(theme.colors.primary).toBe('#ff0000');
            expect(theme.colors.background).toBe('#ffffff');
        });

        it('should create custom theme with animation overrides', () => {
            // createCustomTheme now takes (name, baseThemeId, overrides)
            const theme = createCustomTheme('My Theme', 'theme-light', {
                animations: { duration: 500 },
            });
            expect(theme.animations.duration).toBe(500);
            expect(theme.animations.enabled).toBe(true);
        });
    });

    describe('mergeThemeColors()', () => {
        it('should merge colors with defaults', () => {
            const merged = mergeThemeColors({ primary: '#ff0000' });
            expect(merged.primary).toBe('#ff0000');
            expect(merged.background).toBe('#ffffff');
        });

        it('should merge colors with custom base', () => {
            const merged = mergeThemeColors(
                { primary: '#ff0000' },
                DARK_THEME.colors
            );
            expect(merged.primary).toBe('#ff0000');
            expect(merged.background).toBe('#0f172a');
        });
    });

    describe('mergeAnimationConfig()', () => {
        it('should merge animation config with defaults', () => {
            const merged = mergeAnimationConfig({ duration: 500 });
            expect(merged.duration).toBe(500);
            expect(merged.enabled).toBe(true);
        });

        it('should merge animation config with custom base', () => {
            const base: AnimationConfig = {
                enabled: false,
                duration: 200,
                easing: 'linear',
                reduceMotion: false,
            };
            const merged = mergeAnimationConfig({ duration: 500 }, base);
            expect(merged.duration).toBe(500);
            expect(merged.enabled).toBe(false);
        });
    });
});

// =============================================================================
// Animation Config Tests
// =============================================================================

describe('Animation Config', () => {
    describe('Animation Presets', () => {
        it('should have fast preset', () => {
            expect(ANIMATION_FAST.name).toBe('fast');
            expect(ANIMATION_FAST.duration).toBe(150);
            expect(ANIMATION_FAST.easing).toBe('ease-out');
        });

        it('should have normal preset', () => {
            expect(ANIMATION_NORMAL.name).toBe('normal');
            expect(ANIMATION_NORMAL.duration).toBe(300);
            expect(ANIMATION_NORMAL.easing).toBe('ease-in-out');
        });

        it('should have slow preset', () => {
            expect(ANIMATION_SLOW.name).toBe('slow');
            expect(ANIMATION_SLOW.duration).toBe(500);
            expect(ANIMATION_SLOW.easing).toBe('ease-in');
        });

        it('should have instant preset', () => {
            expect(ANIMATION_INSTANT.name).toBe('instant');
            expect(ANIMATION_INSTANT.duration).toBe(0);
            expect(ANIMATION_INSTANT.easing).toBe('linear');
        });
    });

    describe('getAnimationPreset()', () => {
        it('should return fast preset', () => {
            const preset = getAnimationPreset('fast');
            expect(preset).toEqual(ANIMATION_FAST);
        });

        it('should return undefined for unknown preset', () => {
            const preset = getAnimationPreset('unknown');
            expect(preset).toBeUndefined();
        });
    });

    describe('getTransitionString()', () => {
        it('should generate transition string', () => {
            const transition = getTransitionString(ANIMATION_NORMAL);
            expect(transition).toContain('all');
            expect(transition).toContain('300ms');
            expect(transition).toContain('ease-in-out');
        });

        it('should generate transition string with specific property', () => {
            const transition = getTransitionString(ANIMATION_NORMAL, 'color');
            expect(transition).toContain('color');
            expect(transition).toContain('300ms');
        });

        it('should include delay in transition string', () => {
            const preset = { ...ANIMATION_NORMAL, delay: 100 };
            const transition = getTransitionString(preset);
            expect(transition).toContain('100ms');
        });
    });

    describe('getAnimationString()', () => {
        it('should generate animation string', () => {
            const animation = getAnimationString(ANIMATION_NORMAL, 'fadeIn');
            expect(animation).toContain('fadeIn');
            expect(animation).toContain('300ms');
            expect(animation).toContain('ease-in-out');
        });

        it('should include forwards fill mode', () => {
            const animation = getAnimationString(ANIMATION_NORMAL, 'fadeIn');
            expect(animation).toContain('forwards');
        });
    });

    describe('getEasingValue()', () => {
        it('should return easing value for linear', () => {
            const easing = getEasingValue('linear');
            expect(easing).toBe('linear');
        });

        it('should return easing value for ease-in', () => {
            const easing = getEasingValue('easeIn');
            expect(easing).toBe('ease-in');
        });

        it('should return original value for unknown easing', () => {
            const easing = getEasingValue('custom-easing');
            expect(easing).toBe('custom-easing');
        });
    });

    describe('applyReduceMotion()', () => {
        it('should not modify preset when reduceMotion is false', () => {
            const result = applyReduceMotion(ANIMATION_NORMAL, false);
            expect(result).toEqual(ANIMATION_NORMAL);
        });

        it('should set duration to 0 when reduceMotion is true', () => {
            const result = applyReduceMotion(ANIMATION_NORMAL, true);
            expect(result.duration).toBe(0);
            expect(result.delay).toBe(0);
        });
    });

    describe('createAnimationPreset()', () => {
        it('should create custom animation preset', () => {
            const preset = createAnimationPreset('custom', 400, 'ease-out', 50);
            expect(preset.name).toBe('custom');
            expect(preset.duration).toBe(400);
            expect(preset.easing).toBe('ease-out');
            expect(preset.delay).toBe(50);
        });

        it('should create preset without delay', () => {
            const preset = createAnimationPreset('custom', 400, 'ease-out');
            expect(preset.delay).toBeUndefined();
        });
    });
});

// =============================================================================
// Theme Manager Tests
// =============================================================================

describe('ThemeManager', () => {
    let manager: ThemeManager;

    beforeEach(() => {
        manager = new ThemeManager();
        // Mock localStorage
        const store: Record<string, string> = {};
        global.localStorage = {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => {
                store[key] = value;
            },
            removeItem: (key: string) => {
                delete store[key];
            },
            clear: () => {
                Object.keys(store).forEach((key) => delete store[key]);
            },
            length: 0,
            key: () => null,
        } as any;
    });

    describe('getCurrentTheme()', () => {
        it('should return current theme', () => {
            const theme = manager.getCurrentTheme();
            expect(theme).toBeDefined();
            expect(theme.id).toBe('theme-light');
        });
    });

    describe('loadTheme()', () => {
        it('should load built-in theme', () => {
            const theme = manager.loadTheme('theme-dark');
            expect(theme?.id).toBe('theme-dark');
        });

        it('should return undefined for unknown theme', () => {
            const theme = manager.loadTheme('unknown');
            expect(theme).toBeUndefined();
        });
    });

    describe('switchTheme()', () => {
        it('should switch to dark theme', () => {
            manager.switchTheme('theme-dark');
            expect(manager.getCurrentTheme().id).toBe('theme-dark');
        });

        it('should throw error for unknown theme', () => {
            expect(() => manager.switchTheme('unknown')).toThrow();
        });
    });

    describe('getAllThemes()', () => {
        it('should return all themes', () => {
            const themes = manager.getAllThemes();
            expect(themes.length).toBeGreaterThanOrEqual(3);
        });

        it('should include built-in themes', () => {
            const themes = manager.getAllThemes();
            const ids = themes.map((t) => t.id);
            expect(ids).toContain('theme-light');
            expect(ids).toContain('theme-dark');
            // Now we have high-contrast-light and high-contrast-dark instead of single high-contrast
            expect(ids).toContain('theme-high-contrast-light');
        });
    });

    describe('getBuiltInThemes()', () => {
        it('should return only built-in themes', () => {
            const themes = manager.getBuiltInThemes();
            // Now we have 5 built-in themes: light, dark, high-contrast-light, high-contrast-dark, sepia
            expect(themes.length).toBe(5);
            expect(themes.every((t) => !t.isCustom)).toBe(true);
        });
    });

    describe('getCustomThemes()', () => {
        it('should return empty array initially', () => {
            const themes = manager.getCustomThemes();
            expect(themes.length).toBe(0);
        });

        it('should return custom themes after creation', () => {
            manager.createTheme({
                name: 'Custom',
                type: 'light',
            });
            const themes = manager.getCustomThemes();
            expect(themes.length).toBe(1);
            expect(themes[0].isCustom).toBe(true);
        });
    });

    describe('createTheme()', () => {
        it('should create custom theme', () => {
            const theme = manager.createTheme({
                name: 'My Theme',
                type: 'light',
            });
            expect(theme.name).toBe('My Theme');
            expect(theme.isCustom).toBe(true);
        });

        it('should create theme with color overrides', () => {
            const theme = manager.createTheme({
                name: 'My Theme',
                type: 'light',
                colors: { primary: '#ff0000' },
            });
            expect(theme.colors.primary).toBe('#ff0000');
        });

        it('should throw error for invalid theme', () => {
            expect(() =>
                manager.createTheme({
                    name: '',
                    type: 'light',
                })
            ).toThrow();
        });
    });

    describe('updateTheme()', () => {
        it('should update custom theme', () => {
            const created = manager.createTheme({
                name: 'Original',
                type: 'light',
            });

            manager.updateTheme(created.id, {
                name: 'Updated',
            });

            const updated = manager.loadTheme(created.id);
            expect(updated?.name).toBe('Updated');
        });

        it('should throw error for unknown theme', () => {
            expect(() =>
                manager.updateTheme('unknown', { name: 'Updated' })
            ).toThrow();
        });

        it('should throw error for built-in theme', () => {
            expect(() =>
                manager.updateTheme('theme-light', { name: 'Updated' })
            ).toThrow();
        });
    });

    describe('deleteTheme()', () => {
        it('should delete custom theme', () => {
            const created = manager.createTheme({
                name: 'To Delete',
                type: 'light',
            });

            manager.deleteTheme(created.id);
            const deleted = manager.loadTheme(created.id);
            expect(deleted).toBeUndefined();
        });

        it('should throw error for built-in theme', () => {
            expect(() => manager.deleteTheme('theme-light')).toThrow();
        });

        it('should switch to light theme if deleted theme was active', () => {
            const created = manager.createTheme({
                name: 'To Delete',
                type: 'light',
            });

            manager.switchTheme(created.id);
            manager.deleteTheme(created.id);

            expect(manager.getCurrentTheme().id).toBe('theme-light');
        });
    });

    describe('validateTheme()', () => {
        it('should validate valid theme', () => {
            const result = manager.validateTheme(LIGHT_THEME);
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should detect missing id', () => {
            const invalid = { ...LIGHT_THEME, id: '' };
            const result = manager.validateTheme(invalid);
            expect(result.isValid).toBe(false);
            expect(result.errors.some((e) => e.includes('id'))).toBe(true);
        });

        it('should detect missing colors', () => {
            const invalid = { ...LIGHT_THEME, colors: {} as ThemeColors };
            const result = manager.validateTheme(invalid);
            expect(result.isValid).toBe(false);
        });

        it('should detect invalid animation config', () => {
            const invalid = {
                ...LIGHT_THEME,
                animations: { ...LIGHT_THEME.animations, duration: -1 },
            };
            const result = manager.validateTheme(invalid);
            expect(result.isValid).toBe(false);
        });
    });

    describe('exportTheme()', () => {
        it('should export theme', () => {
            const exported = manager.exportTheme('theme-light');
            expect(exported.version).toBe('1.0.0');
            expect(exported.theme.id).toBe('theme-light');
            expect(exported.exportedAt).toBeDefined();
        });

        it('should throw error for unknown theme', () => {
            expect(() => manager.exportTheme('unknown')).toThrow();
        });
    });

    describe('exportThemeAsJSON()', () => {
        it('should export theme as JSON string', () => {
            const json = manager.exportThemeAsJSON('theme-light');
            expect(typeof json).toBe('string');
            const parsed = JSON.parse(json);
            expect(parsed.theme.id).toBe('theme-light');
        });
    });

    describe('importTheme()', () => {
        it('should import theme from JSON', () => {
            const exported = manager.exportTheme('theme-light');
            const json = JSON.stringify(exported);

            const imported = manager.importTheme(json);
            expect(imported.name).toBe('Light');
            expect(imported.isCustom).toBe(true);
        });

        it('should throw error for invalid JSON', () => {
            expect(() => manager.importTheme('invalid')).toThrow();
        });

        it('should throw error for invalid theme format', () => {
            expect(() => manager.importTheme('{}')).toThrow();
        });
    });

    describe('resetToDefaults()', () => {
        it('should delete all custom themes', () => {
            manager.createTheme({ name: 'Custom', type: 'light' });
            manager.resetToDefaults();

            const custom = manager.getCustomThemes();
            expect(custom.length).toBe(0);
        });

        it('should switch to light theme', () => {
            manager.switchTheme('theme-dark');
            manager.resetToDefaults();

            expect(manager.getCurrentTheme().id).toBe('theme-light');
        });
    });

    describe('detectSystemPreference()', () => {
        it('should detect system preference', () => {
            const prefers = manager.detectSystemPreference();
            expect(typeof prefers).toBe('boolean');
        });
    });

    describe('onSystemPreferenceChange()', () => {
        it('should return unsubscribe function', () => {
            const unsubscribe = manager.onSystemPreferenceChange(() => { });
            expect(typeof unsubscribe).toBe('function');
        });
    });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Theme System Integration', () => {
    let manager: ThemeManager;

    beforeEach(() => {
        manager = new ThemeManager();
    });

    it('should create, update, and delete custom theme', () => {
        // Create
        const created = manager.createTheme({
            name: 'Integration Test',
            type: 'light',
            colors: { primary: '#ff0000' },
        });

        expect(created.colors.primary).toBe('#ff0000');

        // Update
        manager.updateTheme(created.id, {
            colors: { primary: '#00ff00' },
        });

        const updated = manager.loadTheme(created.id);
        expect(updated?.colors.primary).toBe('#00ff00');

        // Delete
        manager.deleteTheme(created.id);
        const deleted = manager.loadTheme(created.id);
        expect(deleted).toBeUndefined();
    });

    it('should export and import theme', () => {
        const created = manager.createTheme({
            name: 'Export Test',
            type: 'dark',
        });

        const json = manager.exportThemeAsJSON(created.id);
        const imported = manager.importTheme(json);

        expect(imported.name).toBe('Export Test');
        expect(imported.type).toBe('dark');
    });

    it('should handle multiple custom themes', () => {
        const theme1 = manager.createTheme({ name: 'Theme 1', type: 'light' });
        const theme2 = manager.createTheme({ name: 'Theme 2', type: 'dark' });

        const custom = manager.getCustomThemes();
        expect(custom.length).toBe(2);

        manager.switchTheme(theme1.id);
        expect(manager.getCurrentTheme().id).toBe(theme1.id);

        manager.switchTheme(theme2.id);
        expect(manager.getCurrentTheme().id).toBe(theme2.id);
    });
});
