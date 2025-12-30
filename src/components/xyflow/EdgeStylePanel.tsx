/**
 * EdgeStylePanel - Panel to edit selected edge style
 * 
 * Shows when an edge is selected, allows changing:
 * - Line type (solid, dashed, dotted)
 * - Arrow heads (source and target)
 * - Color
 */

import { memo, useCallback } from 'react';
import { useXYFlowStore } from '../../xyflow/store';
import styles from './EdgeStylePanel.module.css';

// =============================================================================
// Types
// =============================================================================

type LineType = 'solid' | 'dashed' | 'dotted';
type ArrowHead = 'none' | 'arrow' | 'open-arrow' | 'triangle' | 'diamond' | 'circle' | 'square';

interface EdgeStylePanelProps {
    edgeId: string;
    isDark?: boolean;
    onClose?: () => void;
}

// =============================================================================
// Line Type Options
// =============================================================================

const LINE_TYPES: { id: LineType; label: string; dasharray: string }[] = [
    { id: 'solid', label: 'Solid', dasharray: '' },
    { id: 'dashed', label: 'Dashed', dasharray: '8,4' },
    { id: 'dotted', label: 'Dotted', dasharray: '2,2' },
];

const ARROW_HEADS: { id: ArrowHead; label: string }[] = [
    { id: 'none', label: 'None' },
    { id: 'arrow', label: 'Arrow' },
    { id: 'open-arrow', label: 'Open Arrow' },
    { id: 'triangle', label: 'Triangle' },
    { id: 'diamond', label: 'Diamond' },
    { id: 'circle', label: 'Circle' },
    { id: 'square', label: 'Square' },
];

// =============================================================================
// Preview Components
// =============================================================================

const LinePreview = memo(({ type, isDark }: { type: LineType; isDark?: boolean }) => {
    const stroke = isDark ? '#94a3b8' : '#475569';
    const dasharray = LINE_TYPES.find(l => l.id === type)?.dasharray || '';

    return (
        <svg viewBox="0 0 40 8" className={styles.linePreview}>
            <line x1="2" y1="4" x2="38" y2="4" stroke={stroke} strokeWidth="2" strokeDasharray={dasharray} />
        </svg>
    );
});

LinePreview.displayName = 'LinePreview';

const ArrowHeadPreview = memo(({ type, isDark, isSource }: { type: ArrowHead; isDark?: boolean; isSource?: boolean }) => {
    const stroke = isDark ? '#94a3b8' : '#475569';

    return (
        <svg viewBox="0 0 24 16" className={styles.arrowPreview}>
            {type === 'none' && (
                <line x1="4" y1="8" x2="20" y2="8" stroke={stroke} strokeWidth="2" />
            )}
            {type === 'arrow' && (
                <>
                    <line x1="4" y1="8" x2="16" y2="8" stroke={stroke} strokeWidth="2" />
                    {isSource ? (
                        <polygon points="4,8 10,4 10,12" fill={stroke} />
                    ) : (
                        <polygon points="20,8 14,4 14,12" fill={stroke} />
                    )}
                </>
            )}
            {type === 'open-arrow' && (
                <>
                    <line x1="4" y1="8" x2="16" y2="8" stroke={stroke} strokeWidth="2" />
                    {isSource ? (
                        <polyline points="10,4 4,8 10,12" fill="none" stroke={stroke} strokeWidth="2" />
                    ) : (
                        <polyline points="14,4 20,8 14,12" fill="none" stroke={stroke} strokeWidth="2" />
                    )}
                </>
            )}
            {type === 'triangle' && (
                <>
                    <line x1="4" y1="8" x2="16" y2="8" stroke={stroke} strokeWidth="2" />
                    {isSource ? (
                        <polygon points="4,8 10,4 10,12" fill="none" stroke={stroke} strokeWidth="1.5" />
                    ) : (
                        <polygon points="20,8 14,4 14,12" fill="none" stroke={stroke} strokeWidth="1.5" />
                    )}
                </>
            )}
            {type === 'diamond' && (
                <>
                    <line x1="10" y1="8" x2="20" y2="8" stroke={stroke} strokeWidth="2" />
                    {isSource ? (
                        <polygon points="2,8 7,4 12,8 7,12" fill={stroke} />
                    ) : (
                        <polygon points="12,8 17,4 22,8 17,12" fill={stroke} />
                    )}
                </>
            )}
            {type === 'circle' && (
                <>
                    <line x1="8" y1="8" x2="20" y2="8" stroke={stroke} strokeWidth="2" />
                    {isSource ? (
                        <circle cx="5" cy="8" r="4" fill={stroke} />
                    ) : (
                        <circle cx="19" cy="8" r="4" fill={stroke} />
                    )}
                </>
            )}
            {type === 'square' && (
                <>
                    <line x1="8" y1="8" x2="20" y2="8" stroke={stroke} strokeWidth="2" />
                    {isSource ? (
                        <rect x="1" y="4" width="8" height="8" fill={stroke} />
                    ) : (
                        <rect x="15" y="4" width="8" height="8" fill={stroke} />
                    )}
                </>
            )}
        </svg>
    );
});

ArrowHeadPreview.displayName = 'ArrowHeadPreview';

// =============================================================================
// Main Component
// =============================================================================

export const EdgeStylePanel = memo(function EdgeStylePanel({
    edgeId,
    isDark = false,
    onClose,
}: EdgeStylePanelProps) {
    const edges = useXYFlowStore(s => s.edges);
    const setEdges = useXYFlowStore(s => s.setEdges);
    const pushHistory = useXYFlowStore(s => s.pushHistory);

    const edge = edges.find(e => e.id === edgeId);

    if (!edge) return null;

    // Get current style from edge data
    const currentLineType: LineType = (edge.data?.lineType as LineType) || 'solid';
    const currentSourceHead: ArrowHead = (edge.data?.sourceHead as ArrowHead) || 'none';
    const currentTargetHead: ArrowHead = (edge.data?.targetHead as ArrowHead) || 'arrow';
    const currentColor: string = (edge.style?.stroke as string) || '#1e293b';

    const handleSwapDirection = useCallback(() => {
        setEdges(edges.map(e => {
            if (e.id !== edgeId) return e;

            return {
                ...e,
                source: e.target,
                target: e.source,
                sourceHandle: e.targetHandle,
                targetHandle: e.sourceHandle,
            };
        }));
        pushHistory(`Swap direction: ${edgeId}`);
    }, [edgeId, edges, setEdges, pushHistory]);

    const updateEdge = useCallback((updates: Record<string, unknown>) => {
        pushHistory(`Update edge style: ${edgeId}`);
        setEdges(edges.map(e => {
            if (e.id !== edgeId) return e;

            const newData = { ...e.data, ...updates };
            const newStyle = { ...e.style };

            // Update stroke dasharray based on line type
            if (updates.lineType) {
                const lineType = LINE_TYPES.find(l => l.id === updates.lineType);
                if (lineType) {
                    const dasharray = lineType.dasharray || undefined;
                    newStyle.strokeDasharray = dasharray;
                    newData.style = { ...newData.style, strokeDasharray: dasharray };
                }
            }

            // Update color
            if (updates.color) {
                const color = updates.color as string;
                newStyle.stroke = color;
                newData.style = { ...newData.style, stroke: color };
            }

            // Recalculate markers based on head types
            const sourceHead = (newData.sourceHead as ArrowHead) || 'none';
            const targetHead = (newData.targetHead as ArrowHead) || 'arrow';

            // Map head type to marker ID (just the ID, not url())
            const getMarkerId = (head: ArrowHead, isStart: boolean): string | undefined => {
                if (head === 'none') return undefined;
                if (head === 'arrow') return isStart ? 'arrow-start' : 'arrow';
                if (head === 'open-arrow') return isStart ? 'open-arrow-start' : 'open-arrow';
                if (head === 'triangle') return isStart ? 'triangle-start' : 'triangle';
                if (head === 'diamond') return isStart ? 'diamond-start' : 'diamond';
                if (head === 'circle') return isStart ? 'circle-start' : 'circle';
                if (head === 'square') return isStart ? 'square-start' : 'square';
                return undefined;
            };

            const startMarkerId = getMarkerId(sourceHead, true);
            const endMarkerId = getMarkerId(targetHead, false);

            return {
                ...e,
                data: newData,
                style: newStyle,
                markerStart: startMarkerId,
                markerEnd: endMarkerId,
            };
        }));
    }, [edgeId, edges, setEdges, pushHistory]);

    return (
        <div className={`${styles.panel} ${isDark ? styles.dark : ''}`}>
            <div className={styles.header}>
                <span className={styles.title}>Edge Style</span>
                {onClose && (
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                )}
            </div>

            <div className={styles.content}>
                {/* Line Type */}
                <div className={styles.section}>
                    <label className={styles.label}>Line Type</label>
                    <div className={styles.optionGrid}>
                        {LINE_TYPES.map(line => (
                            <button
                                key={line.id}
                                className={`${styles.optionButton} ${currentLineType === line.id ? styles.selected : ''}`}
                                onClick={() => updateEdge({ lineType: line.id })}
                                title={line.label}
                            >
                                <LinePreview type={line.id} isDark={isDark} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Source Arrow */}
                <div className={styles.section}>
                    <label className={styles.label}>Start</label>
                    <div className={styles.optionGrid}>
                        {ARROW_HEADS.map(head => (
                            <button
                                key={head.id}
                                className={`${styles.optionButton} ${currentSourceHead === head.id ? styles.selected : ''}`}
                                onClick={() => updateEdge({ sourceHead: head.id })}
                                title={head.label}
                            >
                                <ArrowHeadPreview type={head.id} isDark={isDark} isSource />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Target Arrow */}
                <div className={styles.section}>
                    <label className={styles.label}>End</label>
                    <div className={styles.optionGrid}>
                        {ARROW_HEADS.map(head => (
                            <button
                                key={head.id}
                                className={`${styles.optionButton} ${currentTargetHead === head.id ? styles.selected : ''}`}
                                onClick={() => updateEdge({ targetHead: head.id })}
                                title={head.label}
                            >
                                <ArrowHeadPreview type={head.id} isDark={isDark} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color */}
                <div className={styles.section}>
                    <label className={styles.label}>Color</label>
                    <div className={styles.colorRow}>
                        <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => updateEdge({ color: e.target.value })}
                            className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{currentColor}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.section}>
                    <button
                        className={styles.actionButton}
                        onClick={handleSwapDirection}
                        title="Swap Start and End"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                            <path d="M17 8v12M17 20l4-4M17 20l-4-4" />
                        </svg>
                        Swap Direction
                    </button>
                </div>
            </div>
        </div>
    );
});

export default EdgeStylePanel;
