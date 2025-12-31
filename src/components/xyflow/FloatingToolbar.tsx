/**
 * FloatingToolbar - Floating toolbar for selected nodes
 *
 * Features:
 * - Appears above selected nodes
 * - Single node: color pickers, delete, duplicate
 * - Multiple nodes: alignment, distribution, grouping
 * - Viewport-aware positioning
 */

import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useXYFlowStore } from '../../xyflow/store';
import { useSmartConnection } from '../../hooks/useSmartConnection';
import { Z_INDEX } from '../../xyflow/constants';
import styles from './FloatingToolbar.module.css';

// =============================================================================
// Types
// =============================================================================

export interface FloatingToolbarProps {
    /** Dark mode */
    isDark?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const TOOLBAR_OFFSET_Y = 12; // Distance above selection
const VIEWPORT_PADDING = 8; // Minimum distance from viewport edges

const PRESET_FILL_COLORS = [
    '#ffffff', // White
    '#f1f5f9', // Slate 100
    '#dbeafe', // Blue 100
    '#dcfce7', // Green 100
    '#fef3c7', // Amber 100
    '#fee2e2', // Red 100
    '#f3e8ff', // Purple 100
    '#fce7f3', // Pink 100
];

const PRESET_STROKE_COLORS = [
    '#1e293b', // Slate 800
    '#3b82f6', // Blue 500
    '#22c55e', // Green 500
    '#f59e0b', // Amber 500
    '#ef4444', // Red 500
    '#8b5cf6', // Purple 500
    '#ec4899', // Pink 500
    '#64748b', // Slate 500
];

// =============================================================================
// Icons
// =============================================================================

const FillIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
);

const StrokeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
);

const DeleteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const DuplicateIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const AlignLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="4" x2="4" y2="20" />
        <rect x="8" y="6" width="12" height="4" rx="1" />
        <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
);

const AlignCenterHIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="4" x2="12" y2="20" />
        <rect x="4" y="6" width="16" height="4" rx="1" />
        <rect x="6" y="14" width="12" height="4" rx="1" />
    </svg>
);

const AlignRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="20" y1="4" x2="20" y2="20" />
        <rect x="4" y="6" width="12" height="4" rx="1" />
        <rect x="8" y="14" width="8" height="4" rx="1" />
    </svg>
);

const AlignTopIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="4" x2="20" y2="4" />
        <rect x="6" y="8" width="4" height="12" rx="1" />
        <rect x="14" y="8" width="4" height="8" rx="1" />
    </svg>
);

const AlignCenterVIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="12" x2="20" y2="12" />
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="6" width="4" height="12" rx="1" />
    </svg>
);

const AlignBottomIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="20" x2="20" y2="20" />
        <rect x="6" y="4" width="4" height="12" rx="1" />
        <rect x="14" y="8" width="4" height="8" rx="1" />
    </svg>
);

const DistributeHIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="8" width="4" height="8" rx="1" />
        <rect x="10" y="6" width="4" height="12" rx="1" />
        <rect x="18" y="8" width="4" height="8" rx="1" />
    </svg>
);

const DistributeVIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <rect x="6" y="10" width="12" height="4" rx="1" />
        <rect x="8" y="18" width="8" height="4" rx="1" />
    </svg>
);

const GroupIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="8" height="8" rx="1" />
        <rect x="14" y="2" width="8" height="8" rx="1" />
        <rect x="2" y="14" width="8" height="8" rx="1" />
        <rect x="14" y="14" width="8" height="8" rx="1" />
        <path d="M10 6h4M6 10v4M18 10v4M10 18h4" strokeDasharray="2 2" />
    </svg>
);

const UngroupIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="8" height="8" rx="1" />
        <rect x="14" y="2" width="8" height="8" rx="1" />
        <rect x="2" y="14" width="8" height="8" rx="1" />
        <rect x="14" y="14" width="8" height="8" rx="1" />
    </svg>
);

const ConnectSequentialIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="4" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
        <path d="M6 12h4M14 12h4" />
        <path d="M9 10l2 2-2 2" />
        <path d="M17 10l2 2-2 2" />
    </svg>
);

const ConnectToLastIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="4" cy="6" r="2" />
        <circle cx="4" cy="18" r="2" />
        <circle cx="20" cy="12" r="2" />
        <path d="M6 6l12 5" />
        <path d="M6 18l12-5" />
        <path d="M16 10l2 2-2 2" />
    </svg>
);

// =============================================================================
// Color Picker Popover
// =============================================================================

interface ColorPickerProps {
    currentColor: string;
    presetColors: string[];
    onColorChange: (color: string) => void;
    onClose: () => void;
    isDark?: boolean;
}

const ColorPicker = memo(function ColorPicker({
    currentColor,
    presetColors,
    onColorChange,
    onClose,
    isDark,
}: ColorPickerProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={popoverRef} className={`${styles.colorPicker} ${isDark ? styles.dark : ''}`}>
            <div className={styles.colorGrid}>
                {presetColors.map((color) => (
                    <button
                        key={color}
                        className={`${styles.colorSwatch} ${currentColor === color ? styles.selected : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                            onColorChange(color);
                            onClose();
                        }}
                        title={color}
                    />
                ))}
            </div>
            <div className={styles.customColorRow}>
                <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    className={styles.customColorInput}
                />
                <span className={styles.customColorLabel}>Custom</span>
            </div>
        </div>
    );
});

// =============================================================================
// Main Component
// =============================================================================

export const FloatingToolbar = memo(function FloatingToolbar({
    isDark = false,
}: FloatingToolbarProps) {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const { getViewport } = useReactFlow();

    // Store
    const nodes = useXYFlowStore((s) => s.nodes);
    const setNodes = useXYFlowStore((s) => s.setNodes);
    const updateNodeData = useXYFlowStore((s) => s.updateNodeData);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);
    const duplicateSelected = useXYFlowStore((s) => s.duplicateSelected);
    const deleteSelected = useXYFlowStore((s) => s.deleteSelected);
    const groupSelected = useXYFlowStore((s) => s.groupSelected);
    const ungroupSelected = useXYFlowStore((s) => s.ungroupSelected);
    const canGroup = useXYFlowStore((s) => s.canGroup);
    const canUngroup = useXYFlowStore((s) => s.canUngroup);

    // Smart connection
    const { connectSequential, connectToLast, canConnect } = useSmartConnection();

    // Color picker state
    const [showFillPicker, setShowFillPicker] = useState(false);
    const [showStrokePicker, setShowStrokePicker] = useState(false);

    // Get selected nodes
    const selectedNodes = useMemo(
        () => nodes.filter((n) => n.selected),
        [nodes]
    );

    const selectedCount = selectedNodes.length;
    const isSingleSelection = selectedCount === 1;
    const isMultiSelection = selectedCount > 1;

    // Get current colors from first selected node
    const currentFillColor = useMemo(() => {
        if (selectedNodes.length === 0) return '#ffffff';
        const firstNode = selectedNodes[0];
        return firstNode.data?.style?.fill ?? '#ffffff';
    }, [selectedNodes]);

    const currentStrokeColor = useMemo(() => {
        if (selectedNodes.length === 0) return '#1e293b';
        const firstNode = selectedNodes[0];
        return firstNode.data?.style?.stroke ?? '#1e293b';
    }, [selectedNodes]);

    // Calculate bounding box of selected nodes
    const boundingBox = useMemo(() => {
        if (selectedNodes.length === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        selectedNodes.forEach((node) => {
            const width = node.measured?.width ?? node.width ?? (node.style?.width as number) ?? 150;
            const height = node.measured?.height ?? node.height ?? (node.style?.height as number) ?? 60;

            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + width);
            maxY = Math.max(maxY, node.position.y + height);
        });

        return { minX, minY, maxX, maxY };
    }, [selectedNodes]);

    // Calculate toolbar position in screen coordinates
    const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!boundingBox || selectedNodes.length === 0) {
            setToolbarPosition(null);
            return;
        }

        const viewport = getViewport();
        const toolbarWidth = toolbarRef.current?.offsetWidth ?? 200;
        const toolbarHeight = toolbarRef.current?.offsetHeight ?? 40;

        // Convert flow coordinates to screen coordinates
        const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
        const topY = boundingBox.minY;

        let screenX = centerX * viewport.zoom + viewport.x - toolbarWidth / 2;
        let screenY = topY * viewport.zoom + viewport.y - toolbarHeight - TOOLBAR_OFFSET_Y;

        // Clamp to viewport bounds
        const viewportWidth = window.innerWidth;

        screenX = Math.max(VIEWPORT_PADDING, Math.min(screenX, viewportWidth - toolbarWidth - VIEWPORT_PADDING));
        screenY = Math.max(VIEWPORT_PADDING, screenY);

        // If toolbar would be above viewport, place it below selection
        if (screenY < VIEWPORT_PADDING) {
            const bottomY = boundingBox.maxY;
            screenY = bottomY * viewport.zoom + viewport.y + TOOLBAR_OFFSET_Y;
        }

        setToolbarPosition({ x: screenX, y: screenY });
    }, [boundingBox, selectedNodes.length, getViewport]);

    // Color change handlers
    const handleFillColorChange = useCallback((color: string) => {
        pushHistory('Change fill color');
        selectedNodes.forEach(node => {
            updateNodeData(node.id, {
                style: {
                    ...(node.data as any)?.style,
                    fill: color,
                }
            });
        });
    }, [selectedNodes, updateNodeData, pushHistory]);

    const handleStrokeColorChange = useCallback((color: string) => {
        pushHistory('Change stroke color');
        selectedNodes.forEach(node => {
            updateNodeData(node.id, {
                style: {
                    ...(node.data as any)?.style,
                    stroke: color,
                }
            });
        });
    }, [selectedNodes, updateNodeData, pushHistory]);

    // Alignment handlers
    const alignNodes = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
        if (!boundingBox || selectedNodes.length < 2) return;

        pushHistory(`Align ${alignment}`);

        setNodes(nodes.map((node) => {
            if (!node.selected) return node;

            const width = node.measured?.width ?? node.width ?? (node.style?.width as number) ?? 150;
            const height = node.measured?.height ?? node.height ?? (node.style?.height as number) ?? 60;

            let newX = node.position.x;
            let newY = node.position.y;

            switch (alignment) {
                case 'left':
                    newX = boundingBox.minX;
                    break;
                case 'center-h':
                    newX = (boundingBox.minX + boundingBox.maxX) / 2 - width / 2;
                    break;
                case 'right':
                    newX = boundingBox.maxX - width;
                    break;
                case 'top':
                    newY = boundingBox.minY;
                    break;
                case 'center-v':
                    newY = (boundingBox.minY + boundingBox.maxY) / 2 - height / 2;
                    break;
                case 'bottom':
                    newY = boundingBox.maxY - height;
                    break;
            }

            return {
                ...node,
                position: { x: newX, y: newY },
            };
        }));
    }, [boundingBox, selectedNodes.length, nodes, setNodes, pushHistory]);

    // Distribution handlers
    const distributeNodes = useCallback((direction: 'horizontal' | 'vertical') => {
        if (selectedNodes.length < 3) return;

        pushHistory(`Distribute ${direction}`);

        // Sort nodes by position
        const sortedNodes = [...selectedNodes].sort((a, b) => {
            if (direction === 'horizontal') {
                return a.position.x - b.position.x;
            }
            return a.position.y - b.position.y;
        });

        // Calculate total space and spacing
        const firstNode = sortedNodes[0];
        const lastNode = sortedNodes[sortedNodes.length - 1];

        if (direction === 'horizontal') {
            const lastWidth = lastNode.measured?.width ?? lastNode.width ?? (lastNode.style?.width as number) ?? 150;
            const totalWidth = (lastNode.position.x + lastWidth) - firstNode.position.x;
            const totalNodeWidth = sortedNodes.reduce((sum, n) => {
                return sum + (n.measured?.width ?? n.width ?? (n.style?.width as number) ?? 150);
            }, 0);
            const spacing = (totalWidth - totalNodeWidth) / (sortedNodes.length - 1);

            setNodes(nodes.map((node) => {
                if (!node.selected) return node;

                const sortedIndex = sortedNodes.findIndex((n) => n.id === node.id);
                if (sortedIndex <= 0 || sortedIndex === sortedNodes.length - 1) return node;

                const prevNodes = sortedNodes.slice(0, sortedIndex);
                let newX = firstNode.position.x;
                prevNodes.forEach((n) => {
                    const w = n.measured?.width ?? n.width ?? (n.style?.width as number) ?? 150;
                    newX += w + spacing;
                });

                return {
                    ...node,
                    position: { ...node.position, x: newX },
                };
            }));
        } else {
            const lastHeight = lastNode.measured?.height ?? lastNode.height ?? (lastNode.style?.height as number) ?? 60;
            const totalHeight = (lastNode.position.y + lastHeight) - firstNode.position.y;
            const totalNodeHeight = sortedNodes.reduce((sum, n) => {
                return sum + (n.measured?.height ?? n.height ?? (n.style?.height as number) ?? 60);
            }, 0);
            const spacing = (totalHeight - totalNodeHeight) / (sortedNodes.length - 1);

            setNodes(nodes.map((node) => {
                if (!node.selected) return node;

                const sortedIndex = sortedNodes.findIndex((n) => n.id === node.id);
                if (sortedIndex <= 0 || sortedIndex === sortedNodes.length - 1) return node;

                const prevNodes = sortedNodes.slice(0, sortedIndex);
                let newY = firstNode.position.y;
                prevNodes.forEach((n) => {
                    const h = n.measured?.height ?? n.height ?? (n.style?.height as number) ?? 60;
                    newY += h + spacing;
                });

                return {
                    ...node,
                    position: { ...node.position, y: newY },
                };
            }));
        }
    }, [selectedNodes, nodes, setNodes, pushHistory]);

    // Don't render if no selection
    if (selectedCount === 0 || !toolbarPosition) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                ref={toolbarRef}
                className={`${styles.toolbar} ${isDark ? styles.dark : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                style={{
                    position: 'fixed',
                    left: toolbarPosition.x,
                    top: toolbarPosition.y,
                    zIndex: Z_INDEX.CONTEXT_MENU + 10,
                }}
            >
                {/* Single node tools */}
                {isSingleSelection && (
                    <>
                        {/* Fill color */}
                        <div className={styles.toolGroup}>
                            <button
                                className={styles.toolButton}
                                onClick={() => setShowFillPicker(!showFillPicker)}
                                title="Fill color"
                            >
                                <span className={styles.colorIndicator} style={{ backgroundColor: currentFillColor }} />
                                <FillIcon />
                            </button>
                            {showFillPicker && (
                                <ColorPicker
                                    currentColor={currentFillColor}
                                    presetColors={PRESET_FILL_COLORS}
                                    onColorChange={handleFillColorChange}
                                    onClose={() => setShowFillPicker(false)}
                                    isDark={isDark}
                                />
                            )}
                        </div>

                        {/* Stroke color */}
                        <div className={styles.toolGroup}>
                            <button
                                className={styles.toolButton}
                                onClick={() => setShowStrokePicker(!showStrokePicker)}
                                title="Stroke color"
                            >
                                <span
                                    className={styles.colorIndicator}
                                    style={{ backgroundColor: 'transparent', border: `2px solid ${currentStrokeColor}` }}
                                />
                                <StrokeIcon />
                            </button>
                            {showStrokePicker && (
                                <ColorPicker
                                    currentColor={currentStrokeColor}
                                    presetColors={PRESET_STROKE_COLORS}
                                    onColorChange={handleStrokeColorChange}
                                    onClose={() => setShowStrokePicker(false)}
                                    isDark={isDark}
                                />
                            )}
                        </div>

                        <div className={styles.separator} />
                    </>
                )}

                {/* Multi-selection tools */}
                {isMultiSelection && (
                    <>
                        {/* Alignment */}
                        <div className={styles.toolGroup}>
                            <button
                                className={styles.toolButton}
                                onClick={() => alignNodes('left')}
                                title="Align left"
                            >
                                <AlignLeftIcon />
                            </button>
                            <button
                                className={styles.toolButton}
                                onClick={() => alignNodes('center-h')}
                                title="Align center horizontally"
                            >
                                <AlignCenterHIcon />
                            </button>
                            <button
                                className={styles.toolButton}
                                onClick={() => alignNodes('right')}
                                title="Align right"
                            >
                                <AlignRightIcon />
                            </button>
                        </div>

                        <div className={styles.toolGroup}>
                            <button
                                className={styles.toolButton}
                                onClick={() => alignNodes('top')}
                                title="Align top"
                            >
                                <AlignTopIcon />
                            </button>
                            <button
                                className={styles.toolButton}
                                onClick={() => alignNodes('center-v')}
                                title="Align center vertically"
                            >
                                <AlignCenterVIcon />
                            </button>
                            <button
                                className={styles.toolButton}
                                onClick={() => alignNodes('bottom')}
                                title="Align bottom"
                            >
                                <AlignBottomIcon />
                            </button>
                        </div>

                        {/* Distribution (only for 3+ nodes) */}
                        {selectedCount >= 3 && (
                            <div className={styles.toolGroup}>
                                <button
                                    className={styles.toolButton}
                                    onClick={() => distributeNodes('horizontal')}
                                    title="Distribute horizontally"
                                >
                                    <DistributeHIcon />
                                </button>
                                <button
                                    className={styles.toolButton}
                                    onClick={() => distributeNodes('vertical')}
                                    title="Distribute vertically"
                                >
                                    <DistributeVIcon />
                                </button>
                            </div>
                        )}

                        {/* Grouping */}
                        <div className={styles.toolGroup}>
                            {canGroup() && (
                                <button
                                    className={styles.toolButton}
                                    onClick={groupSelected}
                                    title="Group (Ctrl+G)"
                                >
                                    <GroupIcon />
                                </button>
                            )}
                            {canUngroup() && (
                                <button
                                    className={styles.toolButton}
                                    onClick={ungroupSelected}
                                    title="Ungroup (Ctrl+Shift+G)"
                                >
                                    <UngroupIcon />
                                </button>
                            )}
                        </div>

                        {/* Smart Connection */}
                        {canConnect && (
                            <div className={styles.toolGroup}>
                                <button
                                    className={styles.toolButton}
                                    onClick={connectSequential}
                                    title="Connect sequential (A → B → C)"
                                >
                                    <ConnectSequentialIcon />
                                </button>
                                <button
                                    className={styles.toolButton}
                                    onClick={connectToLast}
                                    title="Connect all to last"
                                >
                                    <ConnectToLastIcon />
                                </button>
                            </div>
                        )}

                        <div className={styles.separator} />
                    </>
                )}

                {/* Common tools */}
                <div className={styles.toolGroup}>
                    <button
                        className={styles.toolButton}
                        onClick={duplicateSelected}
                        title="Duplicate (Ctrl+D)"
                    >
                        <DuplicateIcon />
                    </button>
                    <button
                        className={`${styles.toolButton} ${styles.danger}`}
                        onClick={deleteSelected}
                        title="Delete (Del)"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

export default FloatingToolbar;
