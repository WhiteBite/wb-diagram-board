/**
 * WB Canvas - Keyboard Shortcuts Types
 * 
 * Type definitions for the keyboard shortcuts and hotkeys system
 */

/**
 * Keyboard modifier keys
 */
export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta';

/**
 * Keyboard codes (key names)
 */
export type KeyCode = string;

/**
 * Shortcut categories for organization
 */
export type ShortcutCategory = 'edit' | 'view' | 'tool' | 'element' | 'file';

/**
 * Platform-specific shortcuts
 */
export type Platform = 'mac' | 'windows' | 'linux';

/**
 * Conflict resolution strategy
 */
export type ConflictResolution = 'first' | 'last' | 'all';

/**
 * Key binding definition
 * 
 * Represents a keyboard shortcut that triggers an action
 */
export interface KeyBinding {
    /** Unique identifier for the binding */
    readonly id: string;

    /** Human-readable name */
    readonly name: string;

    /** Description of what the shortcut does */
    readonly description: string;

    /** Primary key(s) to press */
    readonly keys: readonly KeyCode[];

    /** Modifier keys (Ctrl, Shift, Alt, Meta) */
    readonly modifiers: readonly KeyModifier[];

    /** Action to execute when shortcut is triggered */
    readonly action: () => void | Promise<void>;

    /** Category for organization and filtering */
    readonly category: ShortcutCategory;

    /** Whether this binding is enabled */
    readonly enabled: boolean;

    /** Platform-specific binding (undefined = all platforms) */
    readonly platform?: Platform;
}

/**
 * Shortcut configuration
 * 
 * Complete configuration for the shortcuts system
 */
export interface ShortcutConfig {
    /** All registered key bindings */
    readonly bindings: readonly KeyBinding[];

    /** Whether to enable global shortcuts (outside input fields) */
    readonly enableGlobal: boolean;

    /** Whether to enable shortcuts inside input fields */
    readonly enableInInput: boolean;

    /** How to handle conflicting shortcuts */
    readonly conflictResolution: ConflictResolution;
}

/**
 * Shortcut conflict information
 * 
 * Represents two bindings that have the same key combination
 */
export interface ShortcutConflict {
    /** First conflicting binding */
    readonly binding1: KeyBinding;

    /** Second conflicting binding */
    readonly binding2: KeyBinding;
}

/**
 * Key recording state
 * 
 * Represents the current state of key recording
 */
export interface KeyRecordingState {
    /** Keys pressed during recording */
    readonly keys: readonly KeyCode[];

    /** Modifiers pressed during recording */
    readonly modifiers: readonly KeyModifier[];

    /** Whether recording is active */
    readonly isRecording: boolean;

    /** Timestamp when recording started */
    readonly startTime: number;
}

/**
 * Custom error for shortcut-related errors
 */
export class ShortcutError extends Error {
    /**
     * Create a new ShortcutError
     * 
     * @param message - Error message
     * @param context - Additional context information
     */
    constructor(
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ShortcutError';
        Object.setPrototypeOf(this, ShortcutError.prototype);
    }
}

/**
 * Shortcut manager interface
 * 
 * Defines the contract for managing keyboard shortcuts
 */
export interface IShortcutManager {
    /**
     * Register a new key binding
     * 
     * @param binding - The key binding to register
     * @throws ShortcutError if binding is invalid
     */
    register(binding: KeyBinding): void;

    /**
     * Unregister a key binding
     * 
     * @param id - The ID of the binding to unregister
     */
    unregister(id: string): void;

    /**
     * Get all registered bindings
     * 
     * @returns Array of all registered bindings
     */
    getBindings(): readonly KeyBinding[];

    /**
     * Get bindings by category
     * 
     * @param category - The category to filter by
     * @returns Array of bindings in the category
     */
    getBindingsByCategory(category: ShortcutCategory): readonly KeyBinding[];

    /**
     * Find all conflicting bindings
     * 
     * @returns Array of conflicts
     */
    findConflicts(): readonly ShortcutConflict[];

    /**
     * Check if a binding has conflicts
     * 
     * @param binding - The binding to check
     * @returns True if binding conflicts with existing bindings
     */
    hasConflict(binding: KeyBinding): boolean;

    /**
     * Handle keyboard down event
     * 
     * @param event - The keyboard event
     */
    handleKeyDown(event: KeyboardEvent): void;

    /**
     * Handle keyboard up event
     * 
     * @param event - The keyboard event
     */
    handleKeyUp(event: KeyboardEvent): void;

    /**
     * Get human-readable string representation of a binding
     * 
     * @param binding - The binding to convert
     * @returns String like "Ctrl+Shift+S"
     */
    getKeyString(binding: KeyBinding): string;

    /**
     * Export current configuration
     * 
     * @returns Configuration object
     */
    exportConfig(): ShortcutConfig;

    /**
     * Import configuration
     * 
     * @param config - Configuration to import
     * @throws ShortcutError if config is invalid
     */
    importConfig(config: ShortcutConfig): void;

    /**
     * Reset to default shortcuts
     */
    resetToDefaults(): void;

    /**
     * Clear all registered bindings
     */
    clear(): void;
}
