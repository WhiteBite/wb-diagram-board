/**
 * SearchPanel - Node search panel (Ctrl+F)
 *
 * Features:
 * - Search nodes by label
 * - Navigate through results (Enter for next, Shift+Enter for prev)
 * - Highlight and center on found nodes
 * - Keyboard shortcuts
 */

import { useCallback, useEffect, useRef, memo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useXYFlowStore } from '../../xyflow/store';
import { useSearch } from '../../hooks/useSearch';
import styles from './SearchPanel.module.css';

// =============================================================================
// Types
// =============================================================================

export interface SearchPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Callback when panel should close */
    onClose: () => void;
    /** Dark mode */
    isDark?: boolean;
}

// =============================================================================
// Icons
// =============================================================================

const Icons = {
    search: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
        </svg>
    ),
    chevronUp: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m18 15-6-6-6 6" />
        </svg>
    ),
    chevronDown: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
};

// =============================================================================
// Component
// =============================================================================

export const SearchPanel = memo(function SearchPanel({
    isOpen,
    onClose,
    isDark = false,
}: SearchPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { setCenter } = useReactFlow();
    const nodes = useXYFlowStore((s) => s.nodes);
    const setNodes = useXYFlowStore((s) => s.setNodes);

    const {
        query,
        search,
        currentIndex,
        currentNodeId,
        goToNext,
        goToPrev,
        clear,
        hasResults,
        totalResults,
    } = useSearch();

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            clear();
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, clear]);

    // Navigate to current result node
    useEffect(() => {
        if (!currentNodeId) return;

        const node = nodes.find((n) => n.id === currentNodeId);
        if (!node) return;

        // Calculate center position
        const width = node.measured?.width ?? (node.style?.width as number) ?? 180;
        const height = node.measured?.height ?? (node.style?.height as number) ?? 100;

        setCenter(node.position.x + width / 2, node.position.y + height / 2, {
            zoom: 1.2,
            duration: 300,
        });

        // Select the found node
        setNodes(
            nodes.map((n) => ({
                ...n,
                selected: n.id === currentNodeId,
            }))
        );
    }, [currentNodeId, nodes, setCenter, setNodes]);

    // Handle input change
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            search(e.target.value);
        },
        [search]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    if (e.shiftKey) {
                        goToPrev();
                    } else {
                        goToNext();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    goToNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    goToPrev();
                    break;
            }
        },
        [goToNext, goToPrev, onClose]
    );

    // Handle close
    const handleClose = useCallback(() => {
        clear();
        onClose();
    }, [clear, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isDark ? styles.dark : ''}`}>
            <div className={styles.container}>
                <div className={styles.panel}>
                    {/* Search icon */}
                    <span className={styles.searchIcon}>{Icons.search}</span>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search nodes..."
                        value={query}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        aria-label="Search nodes"
                    />

                    {/* Results counter */}
                    {query.trim() && (
                        <>
                            <span
                                className={`${styles.counter} ${!hasResults ? styles.counterEmpty : ''}`}
                            >
                                {hasResults ? (
                                    <>
                                        <span className={styles.counterHighlight}>
                                            {currentIndex + 1}
                                        </span>
                                        /{totalResults}
                                    </>
                                ) : (
                                    'No results'
                                )}
                            </span>

                            <span className={styles.divider} />

                            {/* Navigation buttons */}
                            <div className={styles.navButtons}>
                                <button
                                    type="button"
                                    className={styles.navButton}
                                    onClick={goToPrev}
                                    disabled={!hasResults}
                                    title="Previous result (Shift+Enter)"
                                    aria-label="Previous result"
                                >
                                    {Icons.chevronUp}
                                </button>
                                <button
                                    type="button"
                                    className={styles.navButton}
                                    onClick={goToNext}
                                    disabled={!hasResults}
                                    title="Next result (Enter)"
                                    aria-label="Next result"
                                >
                                    {Icons.chevronDown}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Keyboard hint */}
                    {!query.trim() && (
                        <div className={styles.hint}>
                            <kbd>Enter</kbd>
                            <span style={{ fontSize: '0.625rem', color: '#9ca3af' }}>next</span>
                        </div>
                    )}

                    <span className={styles.divider} />

                    {/* Close button */}
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={handleClose}
                        title="Close (Escape)"
                        aria-label="Close search"
                    >
                        {Icons.close}
                    </button>
                </div>
            </div>
        </div>
    );
});

export default SearchPanel;
