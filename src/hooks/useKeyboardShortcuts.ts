/**
 * Keyboard Shortcuts Hook
 *
 * Handles keyboard shortcuts for copy/paste/cut/duplicate operations
 */

import { useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseKeyboardShortcutsOptions {
    /** Called when Ctrl+C is pressed */
    onCopy: () => void;
    /** Called when Ctrl+V is pressed */
    onPaste: () => void;
    /** Called when Ctrl+X is pressed */
    onCut: () => void;
    /** Called when Ctrl+A is pressed */
    onSelectAll: () => void;
    /** Called when Ctrl+D is pressed */
    onDuplicate: () => void;
    /** Called when Escape is pressed */
    onEscape: () => void;
    /** Called when Delete/Backspace is pressed */
    onDelete?: () => void;
    /** Called when Ctrl+Z is pressed */
    onUndo?: () => void;
    /** Called when Ctrl+Shift+Z or Ctrl+Y is pressed */
    onRedo?: () => void;
    /** Called when Ctrl+Alt+C is pressed (copy style) */
    onCopyStyle?: () => void;
    /** Called when Ctrl+Alt+V is pressed (paste style) */
    onPasteStyle?: () => void;
    /** Called when Arrow keys are pressed to move selected nodes */
    onMoveNodes?: (dx: number, dy: number) => void;
    /** Called when Ctrl+L is pressed (smart connection) */
    onConnectSequential?: () => void;
    /** Called when Ctrl+Shift+L is pressed (auto-layout / Tidy Up) */
    onAutoLayout?: () => void;
    /** Whether shortcuts are enabled (default: true) */
    enabled?: boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for handling keyboard shortcuts in the diagram board
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onCopy: () => copySelected(),
 *   onPaste: () => pasteClipboard(),
 *   onCut: () => cutSelected(),
 *   onSelectAll: () => selectAll(),
 *   onDuplicate: () => duplicateSelected(),
 *   onEscape: () => clearSelection(),
 *   onCopyStyle: () => copyStyleFromSelected(),
 *   onPasteStyle: () => applyStyleToSelected(),
 * });
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
    const { enabled = true } = options;

    // Use refs to avoid stale closures
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Ignore if focus is in input/textarea/contenteditable
            const target = event.target as HTMLElement;
            if (
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target.isContentEditable
            ) {
                return;
            }

            const isCtrl = event.ctrlKey || event.metaKey;
            const isShift = event.shiftKey;
            const isAlt = event.altKey;
            // Use event.code for layout-independent key detection
            const code = event.code;
            // Fallback to key for special keys like Escape, Delete
            const key = event.key.toLowerCase();

            // Ctrl+C - Copy
            if (isCtrl && code === 'KeyC' && !isShift && !isAlt) {
                event.preventDefault();
                optionsRef.current.onCopy();
                return;
            }

            // Ctrl+Alt+C - Copy Style (Format Painter)
            if (isCtrl && isAlt && code === 'KeyC' && !isShift && optionsRef.current.onCopyStyle) {
                event.preventDefault();
                optionsRef.current.onCopyStyle();
                return;
            }

            // Ctrl+V - Paste
            if (isCtrl && code === 'KeyV' && !isShift && !isAlt) {
                event.preventDefault();
                optionsRef.current.onPaste();
                return;
            }

            // Ctrl+Alt+V - Paste Style (Format Painter)
            if (isCtrl && isAlt && code === 'KeyV' && !isShift && optionsRef.current.onPasteStyle) {
                event.preventDefault();
                optionsRef.current.onPasteStyle();
                return;
            }

            // Ctrl+X - Cut
            if (isCtrl && code === 'KeyX' && !isShift) {
                event.preventDefault();
                optionsRef.current.onCut();
                return;
            }

            // Ctrl+A - Select All
            if (isCtrl && code === 'KeyA' && !isShift) {
                event.preventDefault();
                optionsRef.current.onSelectAll();
                return;
            }

            // Ctrl+D - Duplicate
            if (isCtrl && code === 'KeyD' && !isShift) {
                event.preventDefault();
                optionsRef.current.onDuplicate();
                return;
            }

            // Ctrl+Z - Undo
            if (isCtrl && code === 'KeyZ' && !isShift && optionsRef.current.onUndo) {
                event.preventDefault();
                optionsRef.current.onUndo();
                return;
            }

            // Ctrl+Shift+Z or Ctrl+Y - Redo
            if (
                ((isCtrl && code === 'KeyZ' && isShift) || (isCtrl && code === 'KeyY')) &&
                optionsRef.current.onRedo
            ) {
                event.preventDefault();
                optionsRef.current.onRedo();
                return;
            }

            // Escape - Clear selection
            if (key === 'escape') {
                event.preventDefault();
                optionsRef.current.onEscape();
                return;
            }

            // Delete/Backspace - Delete selected
            if ((key === 'delete' || key === 'backspace') && optionsRef.current.onDelete) {
                event.preventDefault();
                optionsRef.current.onDelete();
                return;
            }

            // Arrow keys - Move selected nodes
            if (
                (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight') &&
                !isCtrl &&
                optionsRef.current.onMoveNodes
            ) {
                event.preventDefault();
                const step = isShift ? 10 : 1;
                const dx = code === 'ArrowLeft' ? -step : code === 'ArrowRight' ? step : 0;
                const dy = code === 'ArrowUp' ? -step : code === 'ArrowDown' ? step : 0;
                optionsRef.current.onMoveNodes(dx, dy);
                return;
            }

            // Ctrl+L - Smart connection (connect sequential)
            if (isCtrl && code === 'KeyL' && !isShift && !isAlt && optionsRef.current.onConnectSequential) {
                event.preventDefault();
                optionsRef.current.onConnectSequential();
                return;
            }

            // Ctrl+Shift+L - Auto-layout (Tidy Up)
            if (isCtrl && code === 'KeyL' && isShift && !isAlt && optionsRef.current.onAutoLayout) {
                event.preventDefault();
                optionsRef.current.onAutoLayout();
                return;
            }
        },
        [enabled]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;
