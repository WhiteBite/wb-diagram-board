/**
 * WB Canvas - Shortcuts Store
 * 
 * Zustand store for managing keyboard shortcuts state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    KeyBinding,
    ShortcutConfig,
    ShortcutConflict,
    ShortcutError,
} from '../types/shortcuts';
import { shortcutManager } from '../core/shortcuts/shortcut-manager';
import { keyRecorder } from '../core/shortcuts/key-recorder';
import { getDefaultShortcuts } from '../core/shortcuts/default-shortcuts';

/**
 * Shortcuts store state
 */
interface ShortcutsState {
    /** All registered bindings */
    bindings: KeyBinding[];

    /** Whether recording is active */
    isRecording: boolean;

    /** Current conflicts */
    conflicts: ShortcutConflict[];

    /** Whether shortcuts are enabled */
    enabled: boolean;
}

/**
 * Shortcuts store actions
 */
interface ShortcutsActions {
    /**
     * Register a new binding
     * 
     * @param binding - The binding to register
     */
    registerBinding: (binding: KeyBinding) => void;

    /**
     * Unregister a binding
     * 
     * @param id - The ID of the binding to unregister
     */
    unregisterBinding: (id: string) => void;

    /**
     * Update a binding
     * 
     * @param id - The ID of the binding to update
     * @param updates - Partial updates to apply
     */
    updateBinding: (id: string, updates: Partial<KeyBinding>) => void;

    /**
     * Start recording a new shortcut
     */
    startRecording: () => void;

    /**
     * Stop recording
     */
    stopRecording: () => void;

    /**
     * Reset to default shortcuts
     */
    resetToDefaults: () => void;

    /**
     * Check for conflicts
     */
    checkConflicts: () => void;

    /**
     * Export configuration as JSON string
     * 
     * @returns JSON string
     */
    exportConfig: () => string;

    /**
     * Import configuration from JSON string
     * 
     * @param json - JSON string to import
     */
    importConfig: (json: string) => void;

    /**
     * Toggle shortcuts enabled/disabled
     */
    toggleEnabled: () => void;

    /**
     * Set enabled state
     * 
     * @param enabled - Whether shortcuts should be enabled
     */
    setEnabled: (enabled: boolean) => void;
}

/**
 * Initial state
 */
const createInitialState = (): ShortcutsState => ({
    bindings: Array.from(getDefaultShortcuts()),
    isRecording: false,
    conflicts: [],
    enabled: true,
});

/**
 * Create shortcuts store
 */
export const useShortcutsStore = create<ShortcutsState & ShortcutsActions>()(
    immer((set, get) => ({
        ...createInitialState(),

        // =====================================================================
        // Binding Management
        // =====================================================================

        registerBinding: (binding) => {
            try {
                shortcutManager.register(binding);

                set((draft) => {
                    // Remove old binding if it exists
                    draft.bindings = draft.bindings.filter((b) => b.id !== binding.id);
                    // Add new binding
                    draft.bindings.push(binding as any);
                });

                // Check for conflicts
                get().checkConflicts();
            } catch (error) {
                console.error('Failed to register binding:', error);
                throw error;
            }
        },

        unregisterBinding: (id) => {
            shortcutManager.unregister(id);

            set((draft) => {
                draft.bindings = draft.bindings.filter((b) => b.id !== id);
            });

            get().checkConflicts();
        },

        updateBinding: (id, updates) => {
            const state = get();
            const binding = state.bindings.find((b) => b.id === id);

            if (!binding) {
                throw new ShortcutError(`Binding not found: ${id}`);
            }

            const updated = { ...binding, ...updates };

            try {
                shortcutManager.unregister(id);
                shortcutManager.register(updated);

                set((draft) => {
                    const index = draft.bindings.findIndex((b) => b.id === id);
                    if (index !== -1) {
                        draft.bindings[index] = updated as any;
                    }
                });

                get().checkConflicts();
            } catch (error) {
                console.error('Failed to update binding:', error);
                throw error;
            }
        },

        // =====================================================================
        // Recording
        // =====================================================================

        startRecording: () => {
            try {
                keyRecorder.startRecording();

                set((draft) => {
                    draft.isRecording = true;
                });
            } catch (error) {
                console.error('Failed to start recording:', error);
                throw error;
            }
        },

        stopRecording: () => {
            const result = keyRecorder.stopRecording();

            set((draft) => {
                draft.isRecording = false;
            });

            return result;
        },

        // =====================================================================
        // Configuration
        // =====================================================================

        resetToDefaults: () => {
            shortcutManager.clear();

            const defaults = getDefaultShortcuts();
            for (const binding of defaults) {
                try {
                    shortcutManager.register(binding);
                } catch (error) {
                    console.error(`Failed to register default binding ${binding.id}:`, error);
                }
            }

            set((draft) => {
                draft.bindings = Array.from(defaults) as any;
            });

            get().checkConflicts();
        },

        checkConflicts: () => {
            const conflicts = shortcutManager.findConflicts();

            set((draft) => {
                draft.conflicts = Array.from(conflicts) as any;
            });
        },

        exportConfig: () => {
            const state = get();
            const config: ShortcutConfig = {
                bindings: state.bindings as any,
                enableGlobal: true,
                enableInInput: false,
                conflictResolution: 'first',
            };

            return JSON.stringify(config, null, 2);
        },

        importConfig: (json) => {
            try {
                const config = JSON.parse(json) as ShortcutConfig;

                if (!config || !Array.isArray(config.bindings)) {
                    throw new ShortcutError('Invalid configuration format');
                }

                shortcutManager.importConfig(config);

                set((draft) => {
                    draft.bindings = Array.from(config.bindings) as any;
                });

                get().checkConflicts();
            } catch (error) {
                console.error('Failed to import configuration:', error);
                throw error;
            }
        },

        // =====================================================================
        // State Management
        // =====================================================================

        toggleEnabled: () => {
            set((draft) => {
                draft.enabled = !draft.enabled;
            });
        },

        setEnabled: (enabled) => {
            set((draft) => {
                draft.enabled = enabled;
            });
        },
    }))
);

/**
 * Selector for bindings by category
 * 
 * @param category - The category to filter by
 * @returns Selector function
 */
export const selectBindingsByCategory = (category: string) => (state: ShortcutsState) =>
    state.bindings.filter((b) => b.category === category);

/**
 * Selector for all bindings
 */
export const selectBindings = (state: ShortcutsState): KeyBinding[] => state.bindings;

/**
 * Selector for conflicts
 */
export const selectConflicts = (state: ShortcutsState): ShortcutConflict[] => state.conflicts;

/**
 * Selector for recording state
 */
export const selectIsRecording = (state: ShortcutsState): boolean => state.isRecording;

/**
 * Selector for enabled state
 */
export const selectEnabled = (state: ShortcutsState): boolean => state.enabled;
