/**
 * EdgeEditor - Inline text editor for edge labels
 *
 * Opens on double-click, saves on Enter/blur, cancels on Escape
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import styles from './NodeEditor.module.css';

// =============================================================================
// Types
// =============================================================================

export interface EdgeEditorProps {
    /** Edge ID being edited */
    edgeId: string;
    /** Initial text value */
    initialValue: string;
    /** Position in screen coordinates */
    position: { x: number; y: number };
    /** Callback when text is saved */
    onSave: (edgeId: string, value: string) => void;
    /** Callback when editing is cancelled */
    onCancel: () => void;
}

// =============================================================================
// Component
// =============================================================================

export const EdgeEditor = memo(function EdgeEditor({
    edgeId,
    initialValue,
    position,
    onSave,
    onCancel,
}: EdgeEditorProps) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus and select text on mount
    useEffect(() => {
        const input = inputRef.current;
        if (input) {
            input.focus();
            input.select();
        }
    }, []);

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onSave(edgeId, value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        },
        [edgeId, value, onSave, onCancel]
    );

    // Handle blur - save on focus loss
    const handleBlur = useCallback(() => {
        onSave(edgeId, value);
    }, [edgeId, value, onSave]);

    // Handle overlay click - save editing
    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onSave(edgeId, value);
            }
        },
        [edgeId, value, onSave]
    );

    // Prevent event propagation to ReactFlow
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onMouseDown={handleMouseDown}
                className={styles.editor}
                style={{
                    left: position.x,
                    top: position.y,
                }}
                placeholder="Enter label..."
                aria-label="Edit edge label"
            />
        </div>
    );
});

EdgeEditor.displayName = 'EdgeEditor';
