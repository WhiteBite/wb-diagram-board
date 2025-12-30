/**
 * XY Flow Layers Panel
 *
 * Layers panel for XY Flow nodes with:
 * - Node list with type icons
 * - Visibility toggle
 * - Lock toggle
 * - Selection state
 * - Drag to reorder (z-index)
 * - Keyboard navigation
 */

import { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useXYFlowStore } from '../../xyflow/store';
import type { DiagramNode, DiagramNodeType } from '../../xyflow/types';
import styles from './XYFlowLayersPanel.module.css';

// =============================================================================
// Types
// =============================================================================

interface LayerItemProps {
    readonly node: DiagramNode;
    readonly isSelected: boolean;
    readonly isHidden: boolean;
    readonly isLocked: boolean;
    readonly index: number;
    readonly onSelect: (nodeId: string, multiSelect?: boolean) => void;
    readonly onToggleVisibility: (nodeId: string) => void;
    readonly onToggleLocked: (nodeId: string) => void;
    readonly onDragStart: (nodeId: string, index: number) => void;
    readonly onDragOver: (index: number) => void;
    readonly onDragEnd: () => void;
    readonly isDragTarget: boolean;
    readonly isDragging: boolean;
}

interface XYFlowLayersPanelProps {
    readonly isDark?: boolean;
}

// =============================================================================
// Icons
// =============================================================================

const NodeTypeIcon = memo(function NodeTypeIcon({ type }: { type: DiagramNodeType }) {
    switch (type) {
        case 'rectangle':
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            );
        case 'ellipse':
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            );
        case 'diamond':
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 2L14 8L8 14L2 8L8 2Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            );
        case 'text':
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 4H13M8 4V12M5 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );
        case 'sticky':
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 2H13V11L10 14H3V2Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 11V14L13 11H10Z" fill="currentColor" />
                </svg>
            );
        case 'swimlane':
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="2" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            );
        default:
            return (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
            );
    }
});

const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2L14 14M6.5 6.5C6.18 6.82 6 7.39 6 8C6 9.1 6.9 10 8 10C8.61 10 9.18 9.82 9.5 9.5M4 4.5C2.8 5.5 1.8 6.8 1 8C1 8 3.5 13 8 13C9.3 13 10.5 12.6 11.5 12M8 3C12.5 3 15 8 15 8C15 8 14.5 9 13.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5V7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const UnlockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="3" y="7" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 7V5C5 3.34 6.34 2 8 2C9.66 2 11 3.34 11 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

// =============================================================================
// Layer Item Component
// =============================================================================

const LayerItem = memo(function LayerItem({
    node,
    isSelected,
    isHidden,
    isLocked,
    index,
    onSelect,
    onToggleVisibility,
    onToggleLocked,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragTarget,
    isDragging,
}: LayerItemProps) {
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            onSelect(node.id, e.ctrlKey || e.metaKey);
        },
        [node.id, onSelect]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(node.id, e.ctrlKey || e.metaKey);
            }
        },
        [node.id, onSelect]
    );

    const handleDragStart = useCallback(
        (e: React.DragEvent) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', node.id);
            onDragStart(node.id, index);
        },
        [node.id, index, onDragStart]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            onDragOver(index);
        },
        [index, onDragOver]
    );

    const label = node.data?.label ?? node.id;
    const nodeType = (node.type ?? 'rectangle') as DiagramNodeType;

    return (
        <div
            className={`${styles.layerItem} ${isSelected ? styles.selected : ''} ${isDragTarget ? styles.dragTarget : ''} ${isDragging ? styles.dragging : ''} ${isHidden ? styles.hidden : ''}`}
            role="treeitem"
            aria-selected={isSelected}
            aria-label={`${label}, ${nodeType}${isHidden ? ', hidden' : ''}${isLocked ? ', locked' : ''}`}
            tabIndex={0}
            draggable={!isLocked}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={onDragEnd}
        >
            <div className={styles.nodeIcon}>
                <NodeTypeIcon type={nodeType} />
            </div>

            <span className={styles.nodeLabel} title={label}>
                {label}
            </span>

            <div className={styles.actions}>
                <button
                    className={`${styles.actionButton} ${isHidden ? styles.active : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(node.id);
                    }}
                    aria-label={isHidden ? 'Show node' : 'Hide node'}
                    title={isHidden ? 'Show' : 'Hide'}
                >
                    {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                </button>

                <button
                    className={`${styles.actionButton} ${isLocked ? styles.active : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLocked(node.id);
                    }}
                    aria-label={isLocked ? 'Unlock node' : 'Lock node'}
                    title={isLocked ? 'Unlock' : 'Lock'}
                >
                    {isLocked ? <LockIcon /> : <UnlockIcon />}
                </button>
            </div>
        </div>
    );
});

// =============================================================================
// Main Panel Component
// =============================================================================

export const XYFlowLayersPanel = memo(function XYFlowLayersPanel({
    isDark = false,
}: XYFlowLayersPanelProps) {
    // Store state
    const nodes = useXYFlowStore((state) => state.nodes);
    const selectedNodeIds = useXYFlowStore((state) => state.selectedNodeIds);
    const hiddenNodeIds = useXYFlowStore((state) => state.hiddenNodeIds);
    const lockedNodeIds = useXYFlowStore((state) => state.lockedNodeIds);

    // Store actions
    const setSelectedNodeIds = useXYFlowStore((state) => state.setSelectedNodeIds);
    const toggleNodeVisibility = useXYFlowStore((state) => state.toggleNodeVisibility);
    const toggleNodeLocked = useXYFlowStore((state) => state.toggleNodeLocked);
    const setNodes = useXYFlowStore((state) => state.setNodes);
    const pushHistory = useXYFlowStore((state) => state.pushHistory);

    // Drag state
    const [dragState, setDragState] = useState<{
        draggingId: string | null;
        draggingIndex: number;
        targetIndex: number;
    }>({
        draggingId: null,
        draggingIndex: -1,
        targetIndex: -1,
    });

    // Ref for keyboard navigation
    const listRef = useRef<HTMLDivElement>(null);

    // Nodes in reverse order (top layer first)
    const reversedNodes = useMemo(() => [...nodes].reverse(), [nodes]);

    // Handlers
    const handleSelect = useCallback(
        (nodeId: string, multiSelect?: boolean) => {
            if (multiSelect) {
                if (selectedNodeIds.includes(nodeId)) {
                    setSelectedNodeIds(selectedNodeIds.filter((id) => id !== nodeId));
                } else {
                    setSelectedNodeIds([...selectedNodeIds, nodeId]);
                }
            } else {
                setSelectedNodeIds([nodeId]);
            }
        },
        [selectedNodeIds, setSelectedNodeIds]
    );

    const handleDragStart = useCallback((nodeId: string, index: number) => {
        setDragState({
            draggingId: nodeId,
            draggingIndex: index,
            targetIndex: index,
        });
    }, []);

    const handleDragOver = useCallback((index: number) => {
        setDragState((prev) => ({
            ...prev,
            targetIndex: index,
        }));
    }, []);

    const handleDragEnd = useCallback(() => {
        const { draggingId, draggingIndex, targetIndex } = dragState;

        if (draggingId && draggingIndex !== targetIndex && targetIndex !== -1) {
            // Reorder nodes (remember we're showing reversed)
            const actualFromIndex = nodes.length - 1 - draggingIndex;
            const actualToIndex = nodes.length - 1 - targetIndex;

            const newNodes = [...nodes];
            const [movedNode] = newNodes.splice(actualFromIndex, 1);
            newNodes.splice(actualToIndex, 0, movedNode);

            pushHistory('Reorder layers');
            setNodes(newNodes);
        }

        setDragState({
            draggingId: null,
            draggingIndex: -1,
            targetIndex: -1,
        });
    }, [dragState, nodes, setNodes, pushHistory]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!listRef.current?.contains(document.activeElement)) return;

            const focusedIndex = Array.from(
                listRef.current.querySelectorAll('[role="treeitem"]')
            ).indexOf(document.activeElement as Element);

            if (focusedIndex === -1) return;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (focusedIndex > 0) {
                        const items = listRef.current.querySelectorAll('[role="treeitem"]');
                        (items[focusedIndex - 1] as HTMLElement)?.focus();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    {
                        const items = listRef.current.querySelectorAll('[role="treeitem"]');
                        if (focusedIndex < items.length - 1) {
                            (items[focusedIndex + 1] as HTMLElement)?.focus();
                        }
                    }
                    break;
                case 'Home':
                    e.preventDefault();
                    {
                        const items = listRef.current.querySelectorAll('[role="treeitem"]');
                        (items[0] as HTMLElement)?.focus();
                    }
                    break;
                case 'End':
                    e.preventDefault();
                    {
                        const items = listRef.current.querySelectorAll('[role="treeitem"]');
                        (items[items.length - 1] as HTMLElement)?.focus();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className={`${styles.layersPanel} ${isDark ? styles.dark : ''}`}>
            <div className={styles.header}>
                <h3>Layers</h3>
                <span className={styles.count}>{nodes.length}</span>
            </div>

            {nodes.length === 0 ? (
                <div className={styles.empty}>
                    <p>No nodes on canvas</p>
                </div>
            ) : (
                <div
                    ref={listRef}
                    className={styles.list}
                    role="tree"
                    aria-label="Layers"
                >
                    {reversedNodes.map((node, index) => (
                        <LayerItem
                            key={node.id}
                            node={node}
                            index={index}
                            isSelected={selectedNodeIds.includes(node.id)}
                            isHidden={hiddenNodeIds.has(node.id)}
                            isLocked={lockedNodeIds.has(node.id)}
                            onSelect={handleSelect}
                            onToggleVisibility={toggleNodeVisibility}
                            onToggleLocked={toggleNodeLocked}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            isDragTarget={dragState.targetIndex === index && dragState.draggingId !== node.id}
                            isDragging={dragState.draggingId === node.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

XYFlowLayersPanel.displayName = 'XYFlowLayersPanel';

export default XYFlowLayersPanel;
