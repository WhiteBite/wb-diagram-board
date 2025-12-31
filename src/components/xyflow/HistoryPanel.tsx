/**
 * HistoryPanel - Panel for visualizing and navigating undo/redo history
 *
 * Features:
 * - Display list of history entries with descriptions
 * - Navigate to any point in history
 * - Highlight current state
 * - Glassmorphism styling
 * - Dark mode support
 */

import { memo, useCallback, useEffect, useRef } from 'react';
import { useXYFlowStore } from '../../xyflow/store';
import styles from './HistoryPanel.module.css';

// =============================================================================
// Types
// =============================================================================

export interface HistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_VISIBLE_ENTRIES = 50;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format timestamp to relative time string
 */
function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return new Date(timestamp).toLocaleDateString();
}

/**
 * Get icon for action type based on description
 */
function getActionIcon(description?: string): string {
    if (!description) return '📝';

    const lower = description.toLowerCase();
    if (lower.includes('add')) return '➕';
    if (lower.includes('remove') || lower.includes('delete')) return '🗑️';
    if (lower.includes('paste')) return '📋';
    if (lower.includes('group')) return '📦';
    if (lower.includes('ungroup')) return '📤';
    if (lower.includes('move')) return '↕️';
    if (lower.includes('bring') || lower.includes('front')) return '⬆️';
    if (lower.includes('send') || lower.includes('back')) return '⬇️';
    if (lower.includes('clear')) return '🧹';
    if (lower.includes('style')) return '🎨';

    return '📝';
}

// =============================================================================
// Main Component
// =============================================================================

export const HistoryPanel = memo(function HistoryPanel({
    isOpen,
    onClose,
    isDarkMode = false,
}: HistoryPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Store selectors
    const history = useXYFlowStore((s) => s.history);
    const historyIndex = useXYFlowStore((s) => s.historyIndex);
    const jumpToHistory = useXYFlowStore((s) => s.jumpToHistory);
    const clearHistory = useXYFlowStore((s) => s.clearHistory);
    const canUndo = useXYFlowStore((s) => s.canUndo());
    const canRedo = useXYFlowStore((s) => s.canRedo());

    // Limit visible entries
    const visibleHistory = history.slice(-MAX_VISIBLE_ENTRIES);
    const offset = Math.max(0, history.length - MAX_VISIBLE_ENTRIES);

    // Handle navigation to history entry
    const handleJumpToHistory = useCallback(
        (index: number) => {
            jumpToHistory(index);
        },
        [jumpToHistory]
    );

    // Handle clear history
    const handleClearHistory = useCallback(() => {
        if (window.confirm('Clear all history? This cannot be undone.')) {
            clearHistory();
        }
    }, [clearHistory]);

    // Scroll to current entry when panel opens or history changes
    useEffect(() => {
        if (isOpen && listRef.current) {
            const currentIndex = historyIndex - offset;
            const currentElement = listRef.current.children[currentIndex] as HTMLElement;
            if (currentElement) {
                currentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [isOpen, historyIndex, offset]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const panelClasses = [styles.panel, isDarkMode && styles.dark].filter(Boolean).join(' ');

    return (
        <div ref={panelRef} className={panelClasses} role="dialog" aria-label="History panel">
            {/* Header */}
            <div className={styles.header}>
                <span className={styles.title}>
                    <span className={styles.titleIcon}>🕐</span>
                    History
                </span>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close history panel"
                >
                    ✕
                </button>
            </div>

            {/* Status bar */}
            <div className={styles.statusBar}>
                <span className={styles.statusText}>
                    {history.length} {history.length === 1 ? 'action' : 'actions'}
                </span>
                <div className={styles.statusActions}>
                    <span
                        className={`${styles.statusIndicator} ${canUndo ? styles.active : ''}`}
                        title={canUndo ? 'Can undo' : 'Nothing to undo'}
                    >
                        ↩️
                    </span>
                    <span
                        className={`${styles.statusIndicator} ${canRedo ? styles.active : ''}`}
                        title={canRedo ? 'Can redo' : 'Nothing to redo'}
                    >
                        ↪️
                    </span>
                </div>
            </div>

            {/* History list */}
            <div className={styles.listContainer}>
                {history.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📭</span>
                        <span className={styles.emptyText}>No history yet</span>
                        <span className={styles.emptyHint}>
                            Actions will appear here as you edit
                        </span>
                    </div>
                ) : (
                    <ul ref={listRef} className={styles.list}>
                        {visibleHistory.map((entry, index) => {
                            const actualIndex = index + offset;
                            const isCurrent = actualIndex === historyIndex;
                            const isFuture = actualIndex > historyIndex + 1;
                            const isPast = actualIndex <= historyIndex;

                            return (
                                <li
                                    key={`${entry.timestamp}-${actualIndex}`}
                                    className={`
                                        ${styles.item}
                                        ${isCurrent ? styles.itemCurrent : ''}
                                        ${isFuture ? styles.itemFuture : ''}
                                        ${isPast ? styles.itemPast : ''}
                                    `}
                                    onClick={() => handleJumpToHistory(actualIndex)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleJumpToHistory(actualIndex);
                                        }
                                    }}
                                    aria-current={isCurrent ? 'true' : undefined}
                                >
                                    <span className={styles.itemIcon}>
                                        {getActionIcon(entry.description)}
                                    </span>
                                    <div className={styles.itemContent}>
                                        <span className={styles.itemDescription}>
                                            {entry.description || `Action ${actualIndex + 1}`}
                                        </span>
                                        <span className={styles.itemTime}>
                                            {formatRelativeTime(entry.timestamp)}
                                        </span>
                                    </div>
                                    {isCurrent && (
                                        <span className={styles.currentBadge}>Current</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
                <div className={styles.footer}>
                    <button
                        className={styles.clearButton}
                        onClick={handleClearHistory}
                        title="Clear all history"
                    >
                        🗑️ Clear History
                    </button>
                </div>
            )}
        </div>
    );
});

export default HistoryPanel;
