/**
 * WB Theme Panel - Theme Selector Component
 * 
 * UI component for theme selection and management
 */

import React, { useState, useCallback } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../types/theme';
import styles from './ThemePanel.module.css';

// =============================================================================
// Component Props
// =============================================================================

interface ThemePanelProps {
    /** Whether panel is open */
    readonly isOpen?: boolean;
    /** Callback when panel closes */
    readonly onClose?: () => void;
}

// =============================================================================
// Icons
// =============================================================================

const SunIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
);

const MoonIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const ExportIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
);

const TrashIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

// =============================================================================
// Theme Panel Component
// =============================================================================

export const ThemePanel: React.FC<ThemePanelProps> = ({ isOpen = true }) => {
    const {
        currentTheme,
        themes,
        isDarkMode,
        useSystemPreference,
        switchTheme,
        toggleDarkModeTheme,
        createCustomTheme,
        removeTheme,
        exportThemeAsJSON,
        importThemeFromJSON,
        resetToDefaults,
        enableSystemPreference,
        disableSystemPreference,
    } = useTheme();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [customThemeName, setCustomThemeName] = useState('');
    const [importError, setImportError] = useState<string | null>(null);

    const handleSelectTheme = useCallback(
        (themeId: string) => {
            switchTheme(themeId);
        },
        [switchTheme]
    );

    const handleCreateTheme = useCallback(() => {
        if (!customThemeName.trim()) return;

        try {
            const newTheme = createCustomTheme({
                name: customThemeName,
                type: isDarkMode ? 'dark' : 'light',
            });

            switchTheme(newTheme.id);
            setCustomThemeName('');
            setShowCreateForm(false);
        } catch (error) {
            console.error('[ThemePanel] Failed to create theme:', error);
        }
    }, [customThemeName, isDarkMode, createCustomTheme, switchTheme]);

    const handleDeleteTheme = useCallback(
        (themeId: string, e: React.MouseEvent) => {
            e.stopPropagation();
            if (confirm('Delete this theme?')) {
                try {
                    removeTheme(themeId);
                } catch (error) {
                    console.error('[ThemePanel] Failed to delete theme:', error);
                }
            }
        },
        [removeTheme]
    );

    const handleExportTheme = useCallback(
        (themeId: string, e: React.MouseEvent) => {
            e.stopPropagation();
            try {
                const json = exportThemeAsJSON(themeId);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `theme-${themeId}.json`;
                a.click();
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('[ThemePanel] Failed to export theme:', error);
            }
        },
        [exportThemeAsJSON]
    );

    const handleImportTheme = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const importedTheme = importThemeFromJSON(json);
                    switchTheme(importedTheme.id);
                    setImportError(null);
                } catch (error) {
                    setImportError(
                        error instanceof Error ? error.message : 'Failed to import theme'
                    );
                }
            };
            reader.readAsText(file);
            // Reset input
            event.target.value = '';
        },
        [importThemeFromJSON, switchTheme]
    );

    const handleSystemPreferenceChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.checked) {
                enableSystemPreference();
            } else {
                disableSystemPreference();
            }
        },
        [enableSystemPreference, disableSystemPreference]
    );

    if (!isOpen) return null;

    const builtInThemes = themes.filter((t) => !t.isCustom);
    const customThemes = themes.filter((t) => t.isCustom);

    return (
        <div className={styles.themePanel}>
            <div className={styles.content}>
                {/* Dark Mode Toggle */}
                <div className={styles.section}>
                    <div className={styles.toggle}>
                        <span className={styles.toggleLabel}>
                            {isDarkMode ? <MoonIcon /> : <SunIcon />}
                            Dark Mode
                        </span>
                        <button
                            className={`${styles.toggleSwitch} ${isDarkMode ? styles.active : ''}`}
                            onClick={toggleDarkModeTheme}
                            aria-label="Toggle dark mode"
                        />
                    </div>
                </div>

                {/* System Preference */}
                <div className={styles.section}>
                    <label className={styles.systemPreference}>
                        <span className={styles.systemPreferenceLabel}>
                            Use system preference
                        </span>
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={useSystemPreference}
                            onChange={handleSystemPreferenceChange}
                        />
                    </label>
                </div>

                {/* Built-in Themes */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Built-in Themes</h3>
                    <div className={styles.themeGrid}>
                        {builtInThemes.map((theme) => (
                            <ThemeCard
                                key={theme.id}
                                theme={theme}
                                isActive={currentTheme.id === theme.id}
                                onSelect={handleSelectTheme}
                                onExport={handleExportTheme}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom Themes */}
                {customThemes.length > 0 && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Custom Themes</h3>
                        <div className={styles.themeGrid}>
                            {customThemes.map((theme) => (
                                <ThemeCard
                                    key={theme.id}
                                    theme={theme}
                                    isActive={currentTheme.id === theme.id}
                                    onSelect={handleSelectTheme}
                                    onDelete={handleDeleteTheme}
                                    onExport={handleExportTheme}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Create Custom Theme */}
                <div className={styles.section}>
                    {!showCreateForm ? (
                        <button
                            className={`${styles.button} ${styles.buttonSecondary}`}
                            onClick={() => setShowCreateForm(true)}
                        >
                            + Create Custom Theme
                        </button>
                    ) : (
                        <div className={styles.formGroup}>
                            <input
                                type="text"
                                placeholder="Theme name..."
                                value={customThemeName}
                                onChange={(e) => setCustomThemeName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateTheme();
                                    if (e.key === 'Escape') {
                                        setShowCreateForm(false);
                                        setCustomThemeName('');
                                    }
                                }}
                                className={styles.input}
                                autoFocus
                            />
                            <div className={styles.formActions}>
                                <button
                                    className={styles.button}
                                    onClick={handleCreateTheme}
                                    disabled={!customThemeName.trim()}
                                >
                                    Create
                                </button>
                                <button
                                    className={`${styles.button} ${styles.buttonSecondary}`}
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        setCustomThemeName('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.divider} />

                {/* Import/Export */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Import / Export</h3>
                    <label className={`${styles.button} ${styles.buttonSecondary} ${styles.fileInputLabel}`}>
                        📥 Import Theme
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportTheme}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {importError && (
                        <div className={styles.errorMessage}>{importError}</div>
                    )}
                </div>

                {/* Reset */}
                <div className={styles.section}>
                    <button
                        className={`${styles.button} ${styles.buttonDanger}`}
                        onClick={() => {
                            if (confirm('Reset all themes to defaults? Custom themes will be deleted.')) {
                                resetToDefaults();
                            }
                        }}
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// Theme Card Component
// =============================================================================

interface ThemeCardProps {
    readonly theme: Theme;
    readonly isActive: boolean;
    readonly onSelect: (themeId: string) => void;
    readonly onDelete?: (themeId: string, e: React.MouseEvent) => void;
    readonly onExport: (themeId: string, e: React.MouseEvent) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
    theme,
    isActive,
    onSelect,
    onDelete,
    onExport,
}) => {
    return (
        <div
            className={`${styles.themeOption} ${isActive ? styles.selected : ''}`}
            onClick={() => onSelect(theme.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(theme.id);
                }
            }}
        >
            <div className={styles.themeName}>{theme.name}</div>
            <div className={styles.themePreview}>
                <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                />
                <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: theme.colors.secondary }}
                    title="Secondary"
                />
                <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: theme.colors.background }}
                    title="Background"
                />
            </div>
            <div className={styles.actionRow}>
                <span className={styles.themeType}>{theme.type}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                    <button
                        className={styles.actionButton}
                        onClick={(e) => onExport(theme.id, e)}
                        title="Export theme"
                    >
                        <ExportIcon />
                    </button>
                    {onDelete && theme.isCustom && (
                        <button
                            className={styles.actionButton}
                            onClick={(e) => onDelete(theme.id, e)}
                            title="Delete theme"
                        >
                            <TrashIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemePanel;
