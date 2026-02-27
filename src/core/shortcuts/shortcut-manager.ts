/**
 * WB Canvas - Shortcut Manager
 * 
 * Core manager for keyboard shortcuts and hotkeys
 */

import {
    KeyBinding,
    ShortcutConfig,
    ShortcutConflict,
    ShortcutError,
    IShortcutManager,
    ShortcutCategory,
    KeyModifier,
    KeyCode,
} from '../../types/shortcuts';

/**
 * ShortcutManager - Manages keyboard shortcuts and hotkeys
 * 
 * Handles registration, conflict detection, and event handling
 */
export class ShortcutManager implements IShortcutManager {
    /** Map of binding ID to binding */
    private bindings: Map<string, KeyBinding> = new Map();

    /** Set of currently pressed keys */
    private pressedKeys: Set<KeyCode> = new Set();

    /** Set of currently pressed modifiers */
    private pressedModifiers: Set<KeyModifier> = new Set();

    /** Whether to enable global shortcuts */
    private enableGlobal: boolean = true;

    /** Whether to enable shortcuts in input fields */
    private enableInInput: boolean = false;

    /**
     * Create a new ShortcutManager
     */
    constructor() {
        this.setupEventListeners();
    }

    /**
     * Setup global event listeners
     */
    private setupEventListeners(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    /**
     * Register a new key binding
     * 
     * @param binding - The key binding to register
     * @throws ShortcutError if binding is invalid
     */
    register(binding: KeyBinding): void {
        // Validate binding
        if (!binding.id || !binding.id.trim()) {
            throw new ShortcutError('Binding ID cannot be empty', { binding });
        }

        if (!binding.keys || binding.keys.length === 0) {
            throw new ShortcutError('Binding must have at least one key', { binding });
        }

        if (typeof binding.action !== 'function') {
            throw new ShortcutError('Binding action must be a function', { binding });
        }

        // Check for conflicts
        if (this.hasConflict(binding)) {
            console.warn(`Shortcut conflict detected for binding: ${binding.id}`, {
                binding,
                conflicts: this.findConflicts(),
            });
        }

        // Register binding
        this.bindings.set(binding.id, binding);
    }

    /**
     * Unregister a key binding
     * 
     * @param id - The ID of the binding to unregister
     */
    unregister(id: string): void {
        this.bindings.delete(id);
    }

    /**
     * Get all registered bindings
     * 
     * @returns Array of all registered bindings
     */
    getBindings(): readonly KeyBinding[] {
        return Array.from(this.bindings.values());
    }

    /**
     * Get bindings by category
     * 
     * @param category - The category to filter by
     * @returns Array of bindings in the category
     */
    getBindingsByCategory(category: ShortcutCategory): readonly KeyBinding[] {
        return Array.from(this.bindings.values()).filter(
            (binding) => binding.category === category
        );
    }

    /**
     * Find all conflicting bindings
     * 
     * @returns Array of conflicts
     */
    findConflicts(): readonly ShortcutConflict[] {
        const conflicts: ShortcutConflict[] = [];
        const bindings = Array.from(this.bindings.values());

        for (let i = 0; i < bindings.length; i++) {
            for (let j = i + 1; j < bindings.length; j++) {
                if (this.bindingsConflict(bindings[i], bindings[j])) {
                    conflicts.push({
                        binding1: bindings[i],
                        binding2: bindings[j],
                    });
                }
            }
        }

        return conflicts;
    }

    /**
     * Check if a binding has conflicts
     * 
     * @param binding - The binding to check
     * @returns True if binding conflicts with existing bindings
     */
    hasConflict(binding: KeyBinding): boolean {
        for (const existing of this.bindings.values()) {
            if (existing.id !== binding.id && this.bindingsConflict(binding, existing)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if two bindings conflict
     * 
     * @param binding1 - First binding
     * @param binding2 - Second binding
     * @returns True if bindings conflict
     */
    private bindingsConflict(binding1: KeyBinding, binding2: KeyBinding): boolean {
        // Must have same keys
        if (binding1.keys.length !== binding2.keys.length) {
            return false;
        }

        const keys1 = new Set(binding1.keys.map((k) => k.toLowerCase()));
        const keys2 = new Set(binding2.keys.map((k) => k.toLowerCase()));

        if (keys1.size !== keys2.size) {
            return false;
        }

        for (const key of keys1) {
            if (!keys2.has(key)) {
                return false;
            }
        }

        // Must have same modifiers
        const mods1 = new Set(binding1.modifiers);
        const mods2 = new Set(binding2.modifiers);

        if (mods1.size !== mods2.size) {
            return false;
        }

        for (const mod of mods1) {
            if (!mods2.has(mod)) {
                return false;
            }
        }

        // Must be enabled
        if (!binding1.enabled || !binding2.enabled) {
            return false;
        }

        // Platform check
        const currentPlatform = this.getCurrentPlatform();
        const binding1Match = !binding1.platform || binding1.platform === currentPlatform;
        const binding2Match = !binding2.platform || binding2.platform === currentPlatform;

        return binding1Match && binding2Match;
    }

    /**
     * Get current platform
     * 
     * @returns Current platform
     */
    private getCurrentPlatform(): 'mac' | 'windows' | 'linux' {
        if (typeof navigator === 'undefined') return 'windows';

        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('mac')) return 'mac';
        if (ua.includes('linux')) return 'linux';
        return 'windows';
    }

    /**
     * Handle keyboard down event
     * 
     * @param event - The keyboard event
     */
    handleKeyDown(event: KeyboardEvent): void {
        // Check if we should process this event
        if (!this.shouldProcessEvent(event)) {
            return;
        }

        // Track pressed keys and modifiers
        const key = this.normalizeKey(event.key);
        this.pressedKeys.add(key);

        if (event.ctrlKey || event.metaKey) this.pressedModifiers.add('ctrl');
        if (event.shiftKey) this.pressedModifiers.add('shift');
        if (event.altKey) this.pressedModifiers.add('alt');
        if (event.metaKey && !event.ctrlKey) this.pressedModifiers.add('meta');

        // Find matching bindings
        const matchingBindings = this.findMatchingBindings();

        if (matchingBindings.length > 0) {
            event.preventDefault();

            // Execute all matching bindings
            for (const binding of matchingBindings) {
                try {
                    const result = binding.action();
                    if (result instanceof Promise) {
                        result.catch((error) => {
                            console.error(`Error executing shortcut ${binding.id}:`, error);
                        });
                    }
                } catch (error) {
                    console.error(`Error executing shortcut ${binding.id}:`, error);
                }
            }
        }
    }

    /**
     * Handle keyboard up event
     * 
     * @param event - The keyboard event
     */
    handleKeyUp(event: KeyboardEvent): void {
        const key = this.normalizeKey(event.key);
        this.pressedKeys.delete(key);

        // Update modifiers
        if (!event.ctrlKey && !event.metaKey) this.pressedModifiers.delete('ctrl');
        if (!event.shiftKey) this.pressedModifiers.delete('shift');
        if (!event.altKey) this.pressedModifiers.delete('alt');
        if (!event.metaKey) this.pressedModifiers.delete('meta');
    }

    /**
     * Check if event should be processed
     * 
     * @param event - The keyboard event
     * @returns True if event should be processed
     */
    private shouldProcessEvent(event: KeyboardEvent): boolean {
        const target = event.target as HTMLElement;

        // Check if target is an input field
        const isInput =
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target.contentEditable === 'true';

        if (isInput && !this.enableInInput) {
            return false;
        }

        return this.enableGlobal;
    }

    /**
     * Normalize key name
     * 
     * @param key - Raw key from event
     * @returns Normalized key
     */
    private normalizeKey(key: string): KeyCode {
        const keyMap: Record<string, string> = {
            ' ': 'Space',
            'Enter': 'Enter',
            'Escape': 'Escape',
            'Tab': 'Tab',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight',
        };

        return keyMap[key] || key.toLowerCase();
    }

    /**
     * Find bindings that match current pressed keys
     * 
     * @returns Array of matching bindings
     */
    private findMatchingBindings(): KeyBinding[] {
        const matching: KeyBinding[] = [];

        for (const binding of this.bindings.values()) {
            if (!binding.enabled) continue;

            // Check platform
            const currentPlatform = this.getCurrentPlatform();
            if (binding.platform && binding.platform !== currentPlatform) {
                continue;
            }

            // Check keys match
            if (binding.keys.length !== this.pressedKeys.size) {
                continue;
            }

            let keysMatch = true;
            for (const key of binding.keys) {
                if (!this.pressedKeys.has(this.normalizeKey(key))) {
                    keysMatch = false;
                    break;
                }
            }

            if (!keysMatch) continue;

            // Check modifiers match
            if (binding.modifiers.length !== this.pressedModifiers.size) {
                continue;
            }

            let modifiersMatch = true;
            for (const mod of binding.modifiers) {
                if (!this.pressedModifiers.has(mod)) {
                    modifiersMatch = false;
                    break;
                }
            }

            if (!modifiersMatch) continue;

            matching.push(binding);
        }

        return matching;
    }

    /**
     * Get human-readable string representation of a binding
     * 
     * @param binding - The binding to convert
     * @returns String like "Ctrl+Shift+S"
     */
    getKeyString(binding: KeyBinding): string {
        const parts: string[] = [];

        // Add modifiers
        const modifierOrder: KeyModifier[] = ['ctrl', 'alt', 'shift', 'meta'];
        for (const mod of modifierOrder) {
            if (binding.modifiers.includes(mod)) {
                parts.push(this.modifierToString(mod));
            }
        }

        // Add keys
        for (const key of binding.keys) {
            parts.push(this.keyToString(key));
        }

        return parts.join('+');
    }

    /**
     * Convert modifier to string
     * 
     * @param mod - The modifier
     * @returns String representation
     */
    private modifierToString(mod: KeyModifier): string {
        const map: Record<KeyModifier, string> = {
            ctrl: 'Ctrl',
            shift: 'Shift',
            alt: 'Alt',
            meta: 'Meta',
        };
        return map[mod];
    }

    /**
     * Convert key to string
     * 
     * @param key - The key
     * @returns String representation
     */
    private keyToString(key: KeyCode): string {
        const map: Record<string, string> = {
            ' ': 'Space',
            'Enter': 'Enter',
            'Escape': 'Esc',
            'Tab': 'Tab',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            '+': '+',
            '-': '-',
            '=': '=',
            '[': '[',
            ']': ']',
            '{': '{',
            '}': '}',
            ';': ';',
            ':': ':',
            "'": "'",
            '"': '"',
            ',': ',',
            '<': '<',
            '.': '.',
            '>': '>',
            '/': '/',
            '?': '?',
            '\\': '\\',
            '|': '|',
            '`': '`',
            '~': '~',
            '!': '!',
            '@': '@',
            '#': '#',
            '$': '$',
            '%': '%',
            '^': '^',
            '&': '&',
            '*': '*',
            '(': '(',
            ')': ')',
            '_': '_',
        };

        return map[key] || key.toUpperCase();
    }

    /**
     * Export current configuration
     * 
     * @returns Configuration object
     */
    exportConfig(): ShortcutConfig {
        return {
            bindings: Array.from(this.bindings.values()),
            enableGlobal: this.enableGlobal,
            enableInInput: this.enableInInput,
            conflictResolution: 'first',
        };
    }

    /**
     * Import configuration
     * 
     * @param config - Configuration to import
     * @throws ShortcutError if config is invalid
     */
    importConfig(config: ShortcutConfig): void {
        if (!config || !Array.isArray(config.bindings)) {
            throw new ShortcutError('Invalid configuration format', { config });
        }

        // Clear existing bindings
        this.bindings.clear();

        // Register new bindings
        for (const binding of config.bindings) {
            try {
                this.register(binding);
            } catch (error) {
                console.error(`Failed to import binding ${binding.id}:`, error);
            }
        }

        this.enableGlobal = config.enableGlobal;
        this.enableInInput = config.enableInInput;
    }

    /**
     * Reset to default shortcuts
     */
    resetToDefaults(): void {
        this.bindings.clear();
        this.pressedKeys.clear();
        this.pressedModifiers.clear();
    }

    /**
     * Clear all registered bindings
     */
    clear(): void {
        this.bindings.clear();
        this.pressedKeys.clear();
        this.pressedModifiers.clear();
    }
}

/**
 * Global singleton instance
 */
export const shortcutManager = new ShortcutManager();
