/**
 * KeyboardShortcutsHelp - Modal showing available keyboard shortcuts
 */

import { memo, useEffect, useCallback } from 'react';

export interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode?: boolean;
}

interface ShortcutItem {
    keys: string[];
    description: string;
}

const SHORTCUTS: ShortcutItem[] = [
    { keys: ['Ctrl', 'C'], description: 'Copy selected elements' },
    { keys: ['Ctrl', 'V'], description: 'Paste elements' },
    { keys: ['Ctrl', 'X'], description: 'Cut selected elements' },
    { keys: ['Ctrl', 'D'], description: 'Duplicate selected elements' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Y'], description: 'Redo' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
    { keys: ['Delete'], description: 'Delete selected elements' },
    { keys: ['Backspace'], description: 'Delete selected elements' },
    { keys: ['Ctrl', 'A'], description: 'Select all elements' },
    { keys: ['Escape'], description: 'Deselect all / Close modal' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['↑', '↓', '←', '→'], description: 'Move selected nodes (1px)' },
    { keys: ['Shift', '↑↓←→'], description: 'Move selected nodes (10px)' },
    { keys: ['Ctrl', 'L'], description: 'Connect selected nodes sequentially' },
    { keys: ['Ctrl', 'Shift', 'L'], description: 'Auto-layout (Tidy Up)' },
    { keys: ['Ctrl', 'Alt', 'C'], description: 'Copy style (Format Painter)' },
    { keys: ['Ctrl', 'Alt', 'V'], description: 'Paste style' },
];

const KeyBadge = memo(({ keyName, isDark }: { keyName: string; isDark?: boolean }) => (
    <kbd
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '1.5rem',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontWeight: 500,
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            color: isDark ? '#e5e7eb' : '#374151',
            border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`,
            borderRadius: '0.375rem',
            boxShadow: isDark
                ? '0 1px 2px rgba(0, 0, 0, 0.3)'
                : '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}
    >
        {keyName}
    </kbd>
));

KeyBadge.displayName = 'KeyBadge';

export const KeyboardShortcutsHelp = memo(({ isOpen, onClose, isDarkMode = false }: KeyboardShortcutsHelpProps) => {
    // Handle Escape key to close modal
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    borderRadius: '0.75rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    maxWidth: '28rem',
                    width: '100%',
                    maxHeight: '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.5rem',
                        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: isDarkMode ? '#f3f4f6' : '#111827',
                        }}
                    >
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2rem',
                            height: '2rem',
                            border: 'none',
                            borderRadius: '0.375rem',
                            backgroundColor: 'transparent',
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        aria-label="Close"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shortcuts list */}
                <div
                    style={{
                        padding: '1rem 1.5rem',
                        overflowY: 'auto',
                    }}
                >
                    <ul
                        style={{
                            listStyle: 'none',
                            margin: 0,
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}
                    >
                        {SHORTCUTS.map((shortcut, index) => (
                            <li
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.875rem',
                                        color: isDarkMode ? '#d1d5db' : '#4b5563',
                                    }}
                                >
                                    {shortcut.description}
                                </span>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    {shortcut.keys.map((key, keyIndex) => (
                                        <span key={keyIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {keyIndex > 0 && (
                                                <span style={{ color: isDarkMode ? '#6b7280' : '#9ca3af', fontSize: '0.75rem' }}>+</span>
                                            )}
                                            <KeyBadge keyName={key} isDark={isDarkMode} />
                                        </span>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                        backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb',
                    }}
                >
                    <p
                        style={{
                            margin: 0,
                            fontSize: '0.75rem',
                            color: isDarkMode ? '#6b7280' : '#9ca3af',
                            textAlign: 'center',
                        }}
                    >
                        Press <KeyBadge keyName="?" isDark={isDarkMode} /> anytime to show this help
                    </p>
                </div>
            </div>
        </div>
    );
});

KeyboardShortcutsHelp.displayName = 'KeyboardShortcutsHelp';
