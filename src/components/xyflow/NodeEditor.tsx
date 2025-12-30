/**
 * NodeEditor - Inline text editor for node labels with markdown formatting
 *
 * Features:
 * - Basic markdown: **bold**, *italic*, ~~strikethrough~~
 * - Hotkeys: Ctrl+B (bold), Ctrl+I (italic), Ctrl+S (strikethrough)
 * - Edit/View mode toggle
 * - Auto-focus on open
 * - Save on Enter/blur, cancel on Escape
 */

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import styles from './NodeEditor.module.css';

// =============================================================================
// Types
// =============================================================================

export interface NodeEditorProps {
    /** Node ID being edited */
    nodeId: string;
    /** Initial text value */
    initialValue: string;
    /** Position in screen coordinates */
    position: { x: number; y: number };
    /** Node dimensions */
    dimensions?: { width: number; height: number };
    /** Whether to use multiline textarea */
    multiline?: boolean;
    /** Optional custom styles for the editor */
    customStyle?: React.CSSProperties;
    /** Callback when text is saved */
    onSave: (nodeId: string, value: string) => void;
    /** Callback when editing is cancelled */
    onCancel: () => void;
}

type EditorMode = 'edit'; // Only edit mode for a simpler experience

// =============================================================================
// Markdown Utilities
// =============================================================================

/**
 * Parse markdown text and return React elements
 */
function parseMarkdown(text: string): React.ReactNode {
    if (!text) return null;

    // Split by lines to handle multiline
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => (
        <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            {parseInlineMarkdown(line)}
        </span>
    ));
}

/**
 * Parse inline markdown (bold, italic, strikethrough)
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let keyIndex = 0;

    // Combined regex to find all markdown patterns
    const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~)/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }

        const fullMatch = match[0];
        keyIndex++;

        // Determine which pattern matched
        if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
            const content = fullMatch.slice(2, -2);
            result.push(<strong key={keyIndex}>{content}</strong>);
        } else if (fullMatch.startsWith('~~') && fullMatch.endsWith('~~')) {
            const content = fullMatch.slice(2, -2);
            result.push(<del key={keyIndex}>{content}</del>);
        } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
            const content = fullMatch.slice(1, -1);
            result.push(<em key={keyIndex}>{content}</em>);
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : [text];
}

/**
 * Wrap selected text with markdown syntax
 */
function wrapSelection(
    text: string,
    selectionStart: number,
    selectionEnd: number,
    wrapper: string
): { newText: string; newSelectionStart: number; newSelectionEnd: number } {
    const before = text.slice(0, selectionStart);
    const selected = text.slice(selectionStart, selectionEnd);
    const after = text.slice(selectionEnd);

    // Check if already wrapped
    const wrapperLen = wrapper.length;
    const isWrapped =
        before.endsWith(wrapper) &&
        after.startsWith(wrapper);

    if (isWrapped) {
        // Unwrap
        const newText = before.slice(0, -wrapperLen) + selected + after.slice(wrapperLen);
        return {
            newText,
            newSelectionStart: selectionStart - wrapperLen,
            newSelectionEnd: selectionEnd - wrapperLen,
        };
    }

    // Wrap
    const newText = before + wrapper + selected + wrapper + after;
    return {
        newText,
        newSelectionStart: selectionStart + wrapperLen,
        newSelectionEnd: selectionEnd + wrapperLen,
    };
}

// =============================================================================
// Formatting Toolbar
// =============================================================================

interface FormattingToolbarProps {
    onBold: () => void;
    onItalic: () => void;
    onStrikethrough: () => void;
}

const FormattingToolbar = memo(function FormattingToolbar({
    onBold,
    onItalic,
    onStrikethrough,
}: FormattingToolbarProps) {
    return (
        <div className={styles.formattingToolbar}>
            <button
                type="button"
                className={styles.formatButton}
                onClick={onBold}
                title="Bold (Ctrl+B)"
                aria-label="Bold"
            >
                <strong>B</strong>
            </button>
            <button
                type="button"
                className={styles.formatButton}
                onClick={onItalic}
                title="Italic (Ctrl+I)"
                aria-label="Italic"
            >
                <em>I</em>
            </button>
            <button
                type="button"
                className={styles.formatButton}
                onClick={onStrikethrough}
                title="Strikethrough (Ctrl+S)"
                aria-label="Strikethrough"
            >
                <del>S</del>
            </button>
        </div>
    );
});

// =============================================================================
// Component
// =============================================================================

export const NodeEditor = memo(function NodeEditor({
    nodeId,
    initialValue,
    position,
    dimensions,
    multiline = false,
    customStyle,
    onSave,
    onCancel,
}: NodeEditorProps) {
    const [value, setValue] = useState(initialValue);
    const [undoStack, setUndoStack] = useState<string[]>([initialValue]);
    const [undoIndex, setUndoIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    // Focus and select text on mount
    useEffect(() => {
        const input = inputRef.current;
        if (input) {
            input.focus();
            // Move cursor to end if it's not empty
            if (value.length > 0) {
                input.setSelectionRange(value.length, value.length);
            }
        }
    }, []);

    // Save to undo stack
    const saveToUndoStack = useCallback((newValue: string) => {
        setUndoStack(prev => {
            const newStack = prev.slice(0, undoIndex + 1);
            newStack.push(newValue);
            // Limit stack size
            if (newStack.length > 50) {
                newStack.shift();
            }
            return newStack;
        });
        setUndoIndex(prev => Math.min(prev + 1, 49));
    }, [undoIndex]);

    // Undo action
    const handleUndo = useCallback(() => {
        if (undoIndex > 0) {
            const newIndex = undoIndex - 1;
            setUndoIndex(newIndex);
            setValue(undoStack[newIndex]);
        }
    }, [undoIndex, undoStack]);

    // Redo action
    const handleRedo = useCallback(() => {
        if (undoIndex < undoStack.length - 1) {
            const newIndex = undoIndex + 1;
            setUndoIndex(newIndex);
            setValue(undoStack[newIndex]);
        }
    }, [undoIndex, undoStack]);

    // Apply formatting
    const applyFormatting = useCallback((wrapper: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;

        const { newText, newSelectionStart, newSelectionEnd } = wrapSelection(
            value,
            start,
            end,
            wrapper
        );

        setValue(newText);
        saveToUndoStack(newText);

        // Restore selection after state update
        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(newSelectionStart, newSelectionEnd);
        });
    }, [value, saveToUndoStack]);

    const handleBold = useCallback(() => applyFormatting('**'), [applyFormatting]);
    const handleItalic = useCallback(() => applyFormatting('*'), [applyFormatting]);
    const handleStrikethrough = useCallback(() => applyFormatting('~~'), [applyFormatting]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // Formatting hotkeys
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        handleBold();
                        return;
                    case 'i':
                        e.preventDefault();
                        handleItalic();
                        return;
                    case 's':
                        // Ctrl+Shift+S for strikethrough to avoid browser save
                        if (e.shiftKey) {
                            e.preventDefault();
                            handleStrikethrough();
                        }
                        return;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleRedo();
                        } else {
                            handleUndo();
                        }
                        return;
                    case 'y':
                        e.preventDefault();
                        handleRedo();
                        return;
                }
            }

            // Save/Cancel
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSave(nodeId, value);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            }
        },
        [nodeId, value, onSave, onCancel, handleBold, handleItalic, handleStrikethrough, handleUndo, handleRedo]
    );

    // Handle blur - save on focus loss
    const handleBlur = useCallback((e: React.FocusEvent) => {
        // Don't save if clicking on formatting buttons
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (relatedTarget?.closest(`.${styles.formattingToolbar}`)) {
            return;
        }
        onSave(nodeId, value);
    }, [nodeId, value, onSave]);

    // Handle overlay click - save editing
    const handleOverlayClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onSave(nodeId, value);
            }
        },
        [nodeId, value, onSave]
    );

    // Prevent event propagation to ReactFlow
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    // Handle value change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
    }, []);

    // Save to undo stack on blur or significant change
    const handleInputBlur = useCallback(() => {
        if (value !== undoStack[undoIndex]) {
            saveToUndoStack(value);
        }
    }, [value, undoStack, undoIndex, saveToUndoStack]);

    const editorStyle = {
        left: position.x + (dimensions?.width ?? 0) / 2,
        top: position.y + (dimensions?.height ?? 0) / 2,
        width: dimensions ? Math.max(dimensions.width, 120) : 200,
        height: dimensions ? Math.max(dimensions.height, 40) : 'auto',
        ...customStyle,
    };

    const commonProps = {
        ref: inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>,
        value,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        onBlur: handleBlur,
        onMouseDown: handleMouseDown,
        placeholder: 'Type something...',
        'aria-label': 'Edit node text',
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.editorContainer} style={editorStyle} onMouseDown={handleMouseDown}>
                {/* Formatting Toolbar */}
                <FormattingToolbar
                    onBold={handleBold}
                    onItalic={handleItalic}
                    onStrikethrough={handleStrikethrough}
                />

                {/* Editor */}
                {multiline ? (
                    <textarea
                        {...commonProps}
                        className={styles.editorTextarea}
                        onBlur={(e) => {
                            handleInputBlur();
                        }}
                    />
                ) : (
                    <input
                        {...commonProps}
                        className={styles.editor}
                        type="text"
                        onBlur={(e) => {
                            handleInputBlur();
                        }}
                    />
                )}

                {/* Keyboard hints */}
                <div className={styles.hints}>
                    <span>Enter to save</span>
                    <span>Esc to cancel</span>
                    <span>Ctrl+B bold</span>
                    <span>Ctrl+I italic</span>
                </div>
            </div>
        </div>
    );
});

NodeEditor.displayName = 'NodeEditor';
