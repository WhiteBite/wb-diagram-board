/**
 * Auto Layout Utility
 *
 * Uses dagre library to automatically layout nodes in a directed graph.
 * Supports multiple layout directions and configurable spacing.
 */

import dagre from 'dagre';
import type { DiagramNode, DiagramEdge } from '../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

/** Layout direction */
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

/** Layout options */
export interface LayoutOptions {
    /** Direction of the layout */
    direction?: LayoutDirection;
    /** Horizontal spacing between nodes */
    nodeSpacing?: number;
    /** Vertical spacing between ranks (levels) */
    rankSpacing?: number;
    /** Alignment within rank: 'UL' | 'UR' | 'DL' | 'DR' */
    align?: 'UL' | 'UR' | 'DL' | 'DR';
    /** Edge routing: 'polyline' | 'ortho' | 'spline' */
    edgeRouting?: 'polyline' | 'ortho' | 'spline';
}

/** Result of layout operation */
export interface LayoutResult {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
}

// =============================================================================
// Constants
// =============================================================================

/** Default layout options */
const DEFAULT_OPTIONS: Required<LayoutOptions> = {
    direction: 'TB',
    nodeSpacing: 50,
    rankSpacing: 100,
    align: 'UL',
    edgeRouting: 'polyline',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get node dimensions from node data or defaults
 */
function getNodeDimensions(node: DiagramNode): { width: number; height: number } {
    // Try to get from measured dimensions first
    if (node.measured?.width && node.measured?.height) {
        return { width: node.measured.width, height: node.measured.height };
    }

    // Try to get from node data
    if (node.data?.width && node.data?.height) {
        return { width: node.data.width, height: node.data.height };
    }

    // Try to get from node style
    if (node.style?.width && node.style?.height) {
        return {
            width: typeof node.style.width === 'number' ? node.style.width : parseInt(String(node.style.width), 10),
            height: typeof node.style.height === 'number' ? node.style.height : parseInt(String(node.style.height), 10),
        };
    }

    // Fall back to default size for node type
    const nodeType = node.type ?? 'rectangle';
    const defaultSize = DEFAULT_NODE_SIZE[nodeType as keyof typeof DEFAULT_NODE_SIZE];

    if (defaultSize) {
        return { width: defaultSize.width, height: defaultSize.height };
    }

    // Ultimate fallback
    return { width: 160, height: 80 };
}

// =============================================================================
// Main Layout Function
// =============================================================================

/**
 * Apply dagre layout to nodes and edges
 *
 * @param nodes - Array of diagram nodes
 * @param edges - Array of diagram edges
 * @param options - Layout options
 * @returns New nodes with updated positions
 */
export function applyDagreLayout(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    options: LayoutOptions = {}
): LayoutResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Skip layout if no nodes
    if (nodes.length === 0) {
        return { nodes: [], edges };
    }

    // Filter out group nodes - they shouldn't be part of the layout
    const layoutNodes = nodes.filter((n) => n.type !== 'group');

    // Skip layout if only one node
    if (layoutNodes.length <= 1) {
        return { nodes, edges };
    }

    // Create dagre graph
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph
    dagreGraph.setGraph({
        rankdir: opts.direction,
        nodesep: opts.nodeSpacing,
        ranksep: opts.rankSpacing,
        align: opts.align,
        edgesep: opts.nodeSpacing / 2,
        marginx: 50,
        marginy: 50,
    });

    // Add nodes to graph
    layoutNodes.forEach((node) => {
        const { width, height } = getNodeDimensions(node);
        dagreGraph.setNode(node.id, { width, height });
    });

    // Add edges to graph
    edges.forEach((edge) => {
        // Only add edges between nodes that are in the layout
        const sourceExists = layoutNodes.some((n) => n.id === edge.source);
        const targetExists = layoutNodes.some((n) => n.id === edge.target);

        if (sourceExists && targetExists) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    // Run layout algorithm
    dagre.layout(dagreGraph);

    // Apply new positions to nodes
    const newNodes = nodes.map((node) => {
        // Skip group nodes
        if (node.type === 'group') {
            return node;
        }

        const nodeWithPosition = dagreGraph.node(node.id);

        if (!nodeWithPosition) {
            return node;
        }

        const { width, height } = getNodeDimensions(node);

        // Dagre returns center position, convert to top-left
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2,
            },
        };
    });

    return { nodes: newNodes, edges };
}

/**
 * Get layout direction label for UI
 */
export function getDirectionLabel(direction: LayoutDirection): string {
    const labels: Record<LayoutDirection, string> = {
        TB: 'Top to Bottom',
        BT: 'Bottom to Top',
        LR: 'Left to Right',
        RL: 'Right to Left',
    };
    return labels[direction];
}

/**
 * Get layout direction icon name for UI
 */
export function getDirectionIcon(direction: LayoutDirection): string {
    const icons: Record<LayoutDirection, string> = {
        TB: 'arrow-down',
        BT: 'arrow-up',
        LR: 'arrow-right',
        RL: 'arrow-left',
    };
    return icons[direction];
}

/**
 * All available layout directions
 */
export const LAYOUT_DIRECTIONS: LayoutDirection[] = ['TB', 'LR', 'BT', 'RL'];
