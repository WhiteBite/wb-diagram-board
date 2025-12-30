/**
 * useSmartGuides Hook
 *
 * Provides smart alignment guides when dragging nodes.
 * Shows horizontal and vertical guide lines when nodes align.
 */

import { useState, useCallback, useMemo } from 'react';
import type { DiagramNode } from '../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

/** Guide line for alignment visualization */
export interface GuideLine {
    /** Unique identifier */
    id: string;
    /** Orientation of the guide */
    orientation: 'horizontal' | 'vertical';
    /** Position (x for vertical, y for horizontal) */
    position: number;
    /** Start coordinate */
    start: number;
    /** End coordinate */
    end: number;
}

/** Snap result with adjusted position */
export interface SnapResult {
    /** Adjusted x position (or original if no snap) */
    x: number;
    /** Adjusted y position (or original if no snap) */
    y: number;
    /** Whether x was snapped */
    snappedX: boolean;
    /** Whether y was snapped */
    snappedY: boolean;
}

/** Options for smart guides */
export interface SmartGuidesOptions {
    /** Snap threshold in pixels */
    threshold?: number;
    /** Enable snapping */
    snapEnabled?: boolean;
    /** Enable guide lines */
    guidesEnabled?: boolean;
}

/** Return type of useSmartGuides hook */
export interface UseSmartGuidesReturn {
    /** Current guide lines to render */
    guides: GuideLine[];
    /** Calculate guides and snap position for a dragging node */
    calculateGuides: (
        draggingNodeId: string,
        position: { x: number; y: number },
        nodes: DiagramNode[]
    ) => SnapResult;
    /** Clear all guides */
    clearGuides: () => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Default snap threshold in pixels */
const DEFAULT_THRESHOLD = 5;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get node bounds (position and dimensions)
 */
function getNodeBounds(node: DiagramNode): {
    left: number;
    right: number;
    top: number;
    bottom: number;
    centerX: number;
    centerY: number;
    width: number;
    height: number;
} {
    // Get dimensions from various sources
    let width = 160;
    let height = 80;

    if (node.measured?.width && node.measured?.height) {
        width = node.measured.width;
        height = node.measured.height;
    } else if (node.data?.width && node.data?.height) {
        width = node.data.width;
        height = node.data.height;
    } else if (node.style?.width && node.style?.height) {
        width = typeof node.style.width === 'number' ? node.style.width : parseInt(String(node.style.width), 10);
        height = typeof node.style.height === 'number' ? node.style.height : parseInt(String(node.style.height), 10);
    } else {
        const nodeType = node.type ?? 'rectangle';
        const defaultSize = DEFAULT_NODE_SIZE[nodeType as keyof typeof DEFAULT_NODE_SIZE];
        if (defaultSize) {
            width = defaultSize.width;
            height = defaultSize.height;
        }
    }

    const left = node.position.x;
    const top = node.position.y;
    const right = left + width;
    const bottom = top + height;
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    return { left, right, top, bottom, centerX, centerY, width, height };
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSmartGuides(options: SmartGuidesOptions = {}): UseSmartGuidesReturn {
    const {
        threshold = DEFAULT_THRESHOLD,
        snapEnabled = true,
        guidesEnabled = true,
    } = options;

    const [guides, setGuides] = useState<GuideLine[]>([]);

    const clearGuides = useCallback(() => {
        setGuides([]);
    }, []);

    const calculateGuides = useCallback(
        (
            draggingNodeId: string,
            position: { x: number; y: number },
            nodes: DiagramNode[]
        ): SnapResult => {
            // Filter out the dragging node and group nodes
            const otherNodes = nodes.filter(
                (n) => n.id !== draggingNodeId && n.type !== 'group'
            );

            if (otherNodes.length === 0) {
                clearGuides();
                return { x: position.x, y: position.y, snappedX: false, snappedY: false };
            }

            // Get dragging node to calculate its dimensions
            const draggingNode = nodes.find((n) => n.id === draggingNodeId);
            if (!draggingNode) {
                clearGuides();
                return { x: position.x, y: position.y, snappedX: false, snappedY: false };
            }

            // Create a temporary node with the new position
            const tempNode: DiagramNode = {
                ...draggingNode,
                position,
            };
            const draggingBounds = getNodeBounds(tempNode);

            // Collect alignment points
            const newGuides: GuideLine[] = [];
            let snappedX = false;
            let snappedY = false;
            let adjustedX = position.x;
            let adjustedY = position.y;

            // Check alignment with each other node
            for (const node of otherNodes) {
                const bounds = getNodeBounds(node);

                // Vertical alignments (x-axis)
                const verticalAlignments = [
                    { dragging: draggingBounds.left, other: bounds.left, type: 'left-left' },
                    { dragging: draggingBounds.left, other: bounds.right, type: 'left-right' },
                    { dragging: draggingBounds.right, other: bounds.left, type: 'right-left' },
                    { dragging: draggingBounds.right, other: bounds.right, type: 'right-right' },
                    { dragging: draggingBounds.centerX, other: bounds.centerX, type: 'center-center' },
                ];

                for (const align of verticalAlignments) {
                    const diff = Math.abs(align.dragging - align.other);
                    if (diff <= threshold) {
                        if (snapEnabled && !snappedX) {
                            // Adjust position based on alignment type
                            if (align.type.startsWith('left')) {
                                adjustedX = align.other;
                            } else if (align.type.startsWith('right')) {
                                adjustedX = align.other - draggingBounds.width;
                            } else {
                                adjustedX = align.other - draggingBounds.width / 2;
                            }
                            snappedX = true;
                        }

                        if (guidesEnabled) {
                            newGuides.push({
                                id: `v-${node.id}-${align.type}`,
                                orientation: 'vertical',
                                position: align.other,
                                start: Math.min(draggingBounds.top, bounds.top) - 20,
                                end: Math.max(draggingBounds.bottom, bounds.bottom) + 20,
                            });
                        }
                    }
                }

                // Horizontal alignments (y-axis)
                const horizontalAlignments = [
                    { dragging: draggingBounds.top, other: bounds.top, type: 'top-top' },
                    { dragging: draggingBounds.top, other: bounds.bottom, type: 'top-bottom' },
                    { dragging: draggingBounds.bottom, other: bounds.top, type: 'bottom-top' },
                    { dragging: draggingBounds.bottom, other: bounds.bottom, type: 'bottom-bottom' },
                    { dragging: draggingBounds.centerY, other: bounds.centerY, type: 'center-center' },
                ];

                for (const align of horizontalAlignments) {
                    const diff = Math.abs(align.dragging - align.other);
                    if (diff <= threshold) {
                        if (snapEnabled && !snappedY) {
                            // Adjust position based on alignment type
                            if (align.type.startsWith('top')) {
                                adjustedY = align.other;
                            } else if (align.type.startsWith('bottom')) {
                                adjustedY = align.other - draggingBounds.height;
                            } else {
                                adjustedY = align.other - draggingBounds.height / 2;
                            }
                            snappedY = true;
                        }

                        if (guidesEnabled) {
                            newGuides.push({
                                id: `h-${node.id}-${align.type}`,
                                orientation: 'horizontal',
                                position: align.other,
                                start: Math.min(draggingBounds.left, bounds.left) - 20,
                                end: Math.max(draggingBounds.right, bounds.right) + 20,
                            });
                        }
                    }
                }
            }

            // Deduplicate guides by position
            const uniqueGuides = newGuides.reduce<GuideLine[]>((acc, guide) => {
                const existing = acc.find(
                    (g) => g.orientation === guide.orientation && Math.abs(g.position - guide.position) < 1
                );
                if (existing) {
                    // Extend existing guide
                    existing.start = Math.min(existing.start, guide.start);
                    existing.end = Math.max(existing.end, guide.end);
                } else {
                    acc.push(guide);
                }
                return acc;
            }, []);

            setGuides(uniqueGuides);

            return {
                x: snappedX ? adjustedX : position.x,
                y: snappedY ? adjustedY : position.y,
                snappedX,
                snappedY,
            };
        },
        [threshold, snapEnabled, guidesEnabled, clearGuides]
    );

    return useMemo(
        () => ({
            guides,
            calculateGuides,
            clearGuides,
        }),
        [guides, calculateGuides, clearGuides]
    );
}

export default useSmartGuides;
