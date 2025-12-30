/**
 * AutoLayoutPanel - Panel for applying automatic layout to diagram nodes
 *
 * Features:
 * - Direction selection (TB, BT, LR, RL)
 * - One-click apply
 * - Dark mode support
 */

import { memo, useState, useCallback } from 'react';
import { useXYFlowStore } from '../../xyflow/store';
import {
    applyDagreLayout,
    getDirectionLabel,
    LAYOUT_DIRECTIONS,
    type LayoutDirection,
} from '../../utils/auto-layout';
import styles from './AutoLayoutPanel.module.css';

// =============================================================================
// Icons
// =============================================================================

const ArrowDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const LayoutIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// =============================================================================
// Direction Icon Map
// =============================================================================

const DIRECTION_ICONS: Record<LayoutDirection, React.ReactNode> = {
    TB: <ArrowDownIcon />,
    BT: <ArrowUpIcon />,
    LR: <ArrowRightIcon />,
    RL: <ArrowLeftIcon />,
};

// =============================================================================
// Component
// =============================================================================

export interface AutoLayoutPanelProps {
    /** Dark mode */
    isDark?: boolean;
    /** Callback when panel should close */
    onClose?: () => void;
}

export const AutoLayoutPanel = memo(function AutoLayoutPanel({
    isDark = false,
    onClose,
}: AutoLayoutPanelProps) {
    const [selectedDirection, setSelectedDirection] = useState<LayoutDirection>('TB');

    const nodes = useXYFlowStore((s) => s.nodes);
    const edges = useXYFlowStore((s) => s.edges);
    const setNodes = useXYFlowStore((s) => s.setNodes);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    const handleApplyLayout = useCallback(() => {
        if (nodes.length === 0) return;

        // Save to history before applying
        pushHistory(`Auto layout: ${getDirectionLabel(selectedDirection)}`);

        // Apply layout
        const result = applyDagreLayout(nodes, edges, {
            direction: selectedDirection,
            nodeSpacing: 50,
            rankSpacing: 100,
        });

        setNodes(result.nodes);
    }, [nodes, edges, selectedDirection, setNodes, pushHistory]);

    const handleDirectionClick = useCallback((direction: LayoutDirection) => {
        setSelectedDirection(direction);
    }, []);

    const panelClasses = [styles.panel, isDark && styles.dark].filter(Boolean).join(' ');

    const isDisabled = nodes.length < 2;

    return (
        <div className={panelClasses} role="dialog" aria-label="Auto Layout">
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>Auto Layout</h3>
                {onClose && (
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close"
                        title="Close"
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>

            {/* Direction Grid */}
            <div className={styles.directionGrid}>
                {LAYOUT_DIRECTIONS.map((direction) => (
                    <button
                        key={direction}
                        className={styles.directionButton}
                        onClick={() => handleDirectionClick(direction)}
                        aria-pressed={selectedDirection === direction}
                        title={getDirectionLabel(direction)}
                        style={{
                            backgroundColor:
                                selectedDirection === direction
                                    ? isDark
                                        ? 'rgba(129, 140, 248, 0.2)'
                                        : 'rgba(99, 102, 241, 0.1)'
                                    : undefined,
                            borderColor:
                                selectedDirection === direction
                                    ? isDark
                                        ? '#818cf8'
                                        : '#6366f1'
                                    : undefined,
                            color:
                                selectedDirection === direction
                                    ? isDark
                                        ? '#a5b4fc'
                                        : '#6366f1'
                                    : undefined,
                        }}
                    >
                        {DIRECTION_ICONS[direction]}
                        <span className={styles.directionLabel}>{direction}</span>
                    </button>
                ))}
            </div>

            {/* Apply Button */}
            <button
                className={styles.applyButton}
                onClick={handleApplyLayout}
                disabled={isDisabled}
                title={isDisabled ? 'Need at least 2 nodes' : 'Apply auto layout'}
            >
                <LayoutIcon />
                Apply Layout
            </button>
        </div>
    );
});

export default AutoLayoutPanel;
