/**
 * WB Canvas - Key Recorder
 * 
 * Records keyboard input for creating custom shortcuts
 */

import { KeyCode, KeyModifier, ShortcutError } from '../../types/shortcuts';

/**
 * KeyRecorder - Records keyboard input for custom shortcuts
 * 
 * Allows users to record their own keyboard shortcuts
 */
export class KeyRecorder {
    /** Whether recording is active */
    private isRecording: boolean = false;

    /** Keys pressed during recording */
    private recordedKeys: Set<KeyCode> = new Set();

    /** Modifiers pressed during recording */
    private recordedModifiers: Set<KeyModifier> = new Set();

    /** Recording timeout (5 seconds) */
    private readonly RECORDING_TIMEOUT = 5000;

    /** Timeout ID */
    private timeoutId: ReturnType<typeof setTimeout> | null = null;

    /** Callback when recording completes */
    private onComplete: ((keys: KeyCode[], modifiers: KeyModifier[]) => void) | null = null;

    /**
     * Create a new KeyRecorder
     */
    constructor() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    /**
     * Start recording keyboard input
     * 
     * @param onComplete - Callback when recording completes
     */
    startRecording(
        onComplete?: (keys: KeyCode[], modifiers: KeyModifier[]) => void
    ): void {
        if (this.isRecording) {
            throw new ShortcutError('Recording is already in progress');
        }

        this.isRecording = true;
        this.recordedKeys.clear();
        this.recordedModifiers.clear();
        this.onComplete = onComplete || null;

        // Set timeout to auto-stop recording
        this.timeoutId = setTimeout(() => {
            this.stopRecording();
        }, this.RECORDING_TIMEOUT);
    }

    /**
     * Stop recording and return the recorded keys
     * 
     * @returns Recorded keys and modifiers, or null if not recording
     */
    stopRecording(): { keys: KeyCode[]; modifiers: KeyModifier[] } | null {
        if (!this.isRecording) {
            return null;
        }

        this.isRecording = false;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        const result = {
            keys: Array.from(this.recordedKeys),
            modifiers: Array.from(this.recordedModifiers),
        };

        if (this.onComplete) {
            this.onComplete(result.keys, result.modifiers);
        }

        return result;
    }

    /**
     * Get current recording state
     * 
     * @returns Current recording state or null if not recording
     */
    getCurrentRecording(): { keys: KeyCode[]; modifiers: KeyModifier[] } | null {
        if (!this.isRecording) {
            return null;
        }

        return {
            keys: Array.from(this.recordedKeys),
            modifiers: Array.from(this.recordedModifiers),
        };
    }

    /**
     * Cancel recording
     */
    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.isRecording = false;
        this.recordedKeys.clear();
        this.recordedModifiers.clear();
        this.onComplete = null;
    }

    /**
     * Check if recording is active
     * 
     * @returns True if recording is active
     */
    isActive(): boolean {
        return this.isRecording;
    }

    /**
     * Validate recorded keys
     * 
     * @param keys - Keys to validate
     * @param modifiers - Modifiers to validate
     * @returns True if valid
     */
    isValid(keys: KeyCode[], modifiers: KeyModifier[]): boolean {
        // Must have at least one key
        if (!keys || keys.length === 0) {
            return false;
        }

        // Keys must be non-empty strings
        if (!keys.every((k) => typeof k === 'string' && k.length > 0)) {
            return false;
        }

        // Modifiers must be valid
        const validModifiers = new Set<KeyModifier>(['ctrl', 'shift', 'alt', 'meta']);
        if (!modifiers.every((m) => validModifiers.has(m))) {
            return false;
        }

        return true;
    }

    /**
     * Handle key down event
     * 
     * @param event - The keyboard event
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.isRecording) {
            return;
        }

        const key = this.normalizeKey(event.key);
        this.recordedKeys.add(key);

        // Track modifiers
        if (event.ctrlKey || event.metaKey) this.recordedModifiers.add('ctrl');
        if (event.shiftKey) this.recordedModifiers.add('shift');
        if (event.altKey) this.recordedModifiers.add('alt');
        if (event.metaKey && !event.ctrlKey) this.recordedModifiers.add('meta');
    }

    /**
     * Handle key up event
     * 
     * @param event - The keyboard event
     */
    private handleKeyUp(event: KeyboardEvent): void {
        if (!this.isRecording) {
            return;
        }

        // Update modifiers
        if (!event.ctrlKey && !event.metaKey) this.recordedModifiers.delete('ctrl');
        if (!event.shiftKey) this.recordedModifiers.delete('shift');
        if (!event.altKey) this.recordedModifiers.delete('alt');
        if (!event.metaKey) this.recordedModifiers.delete('meta');
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
}

/**
 * Global singleton instance
 */
export const keyRecorder = new KeyRecorder();
