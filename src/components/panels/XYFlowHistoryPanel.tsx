/**
 * XY Flow History Panel
 *
 * History panel for XY Flow with:
 * - Undo/redo controls
 * - History timeline
 * - Jump to specific state
 * - Keyboard shortcuts
 */

import { memo, useCallback, useEffect } from 'react';
import { useXYFlowStore } from '../../xyflow/store';
import styles from './XYFlowHistoryPanel.module.css';

// =============================================================================
// Types
// =============================================================================

interface XYFlowHistoryPanelProps {
    readonly isDark?: boolean;
    readonly isVisible?: boolean;
    readonly onVisibilityChange?: (visible: boolean) => void;
}

interface HistoryItemProps {
    readonly description: string;
    readonly timestamp: number;
    readonly index: number;
    readonly isCurrent: boolean;
    readonly onClick: (index: number) => void;
}

// =============================================================================
// Icons
// =============================================================================

const UndoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
            d="M3 8H11C12.6569 8 14 9.34315 14 11C14 12.6569 12.6569 14 11 14H8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M6 5L3 8L6 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const RedoIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
            d="M13 8H5C3.34315 8 2 9.34315 2 11C2 12.6569 3.34315 14 5 14H8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M10 5L13 8L10 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const CloseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </svg>
);

const ClearIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
            d="M5 3V2H11V3M3 3H13M4 3V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// =============================================================================
// History Item Component
// =============================================================================

const HistoryItem = memo(function HistoryItem({
    description,
    timestamp,
    index,
    isCurrent,
    onClick,
}: HistoryItemProps) {
    const handleClick = useCallback(() => {
        onClick(index);
    }, [index, onClick]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(index);
            }
        },
        [index, onClick]
    );

    const timeString = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div
            className={`${styles.historyItem} ${isCurrent ? styles.current : ''}`}
            role="listitem"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-current={isCurrent ? 'true' : undefined}
        >
            <div className={styles.dot} aria-hidden="true" />
            <div className={styles.itemContent}>
                <span className={styles.itemLabel}>{description ?? 'State change'}</span>
                <span className={styles.itemTime}>{timeString}</span>
            </div>
        </div>
    );
});

// =============================================================================
// Main Panel Component
// =============================================================================

export const XYFlowHistoryPanel = memo(function XYFlowHistoryPanel({
    isDark = false,
    isVisible = true,
    onVisibilityChange,
}: XYFlowHistoryPanelProps) {
    // Store state
    const history = useXYFlowStore((state) => state.history);
    const historyIndex = useXYFlowStore((state) => state.historyIndex);

    // Store actions
    const undo = useXYFlowStore((state) => state.undo);
    const redo = useXYFlowStore((state) => state.redo);
    const canUndo = useXYFlowStore((state) => state.canUndo);
    const canRedo = useXYFlowStore((state) => state.canRedo);
    const jumpToHistory = useXYFlowStore((state) => state.jumpToHistory);
    const clearHistory = useXYFlowStore((state) => state.clearHistory);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo()) {
                    undo();
                }
            }
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
            if (
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
                ((e.ctrlKey || e.metaKey) && e.key === 'y')
            ) {
                e.preventDefault();
                if (canRedo()) {
                    redo();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

    const handleClose = useCallback(() => {
        onVisibilityChange?.(false);
    }, [onVisibilityChange]);

    const handleClearHistory = useCallback(() => {
        if (window.confirm('Clear all history? This cannot be undone.')) {
            clearHistory();
        }
    }, [clearHistory]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className={`${styles.historyPanel} ${isDark ? styles.dark : ''}`}>
            <div className={styles.header}>
                <h3>History</h3>
                <div className={styles.headerActions}>
                    {history.length > 0 && (
                        <button
                            className={styles.headerButton}
                            onClick={handleClearHistory}
                            aria-label="Clear history"
                            title="Clear history"
                        >
                            <ClearIcon />
                        </button>
                    )}
                    {onVisibilityChange && (
                        <button
                            className={styles.headerButton}
                            onClick={handleClose}
                            aria-label="Close history panel"
                            title="Close"
                        >
                            <CloseIcon />
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.controls}>
                <button
                    className={styles.controlButton}
                    onClick={undo}
                    disabled={!canUndo()}
                    aria-label="Undo"
                    title="Undo (Ctrl+Z)"
                >
                    <UndoIcon />
                    <span>Undo</span>
                </button>
                <button
                    className={styles.controlButton}
                    onClick={redo}
                    disabled={!canRedo()}
                    aria-label="Redo"
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <RedoIcon />
                    <span>Redo</span>
                </button>
            </div>

            <div className={styles.stats}>
                <span>
                    {history.length} {history.length === 1 ? 'entry' : 'entries'}
                </span>
                {historyIndex >= 0 && (
                    <span className={styles.position}>
                        Position: {historyIndex + 1}/{history.length}
                    </span>
                )}
            </div>

            {history.length === 0 ? (
                <div className={styles.empty}>
                    <p>No history yet</p>
                    <p className={styles.hint}>Actions will appear here</p>
                </div>
            ) : (
                <div className={styles.timeline} role="list" aria-label="History timeline">
                    {history.map((entry, index) => (
                        <HistoryItem
                            key={`${entry.timestamp}-${index}`}
                            description={entry.description ?? `Action ${index + 1}`}
                            timestamp={entry.timestamp}
                            index={index}
                            isCurrent={index === historyIndex + 1}
                            onClick={jumpToHistory}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

XYFlowHistoryPanel.displayName = 'XYFlowHistoryPanel';

export default XYFlowHistoryPanel;
