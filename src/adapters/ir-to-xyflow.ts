/**
 * IR to XY Flow Adapter
 * 
 * Converts Intermediate Representation (IR) diagrams from @whitebite/diagram-converter
 * to XY Flow nodes and edges for rendering in the whiteboard.
 */

import type { Diagram, DiagramNode as IRNode, DiagramEdge as IREdge } from '@whitebite/diagram-converter';
import type { DiagramNode, DiagramEdge, DiagramNodeType, DiagramNodeData } from '../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../xyflow/types';
import { nanoid } from 'nanoid';

// =============================================================================
// Types
// =============================================================================

export interface ConversionResult {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    warnings: string[];
}

export interface ConversionOptions {
    /** Auto-layout nodes in a grid */
    autoLayout?: boolean;
    /** Starting X position */
    startX?: number;
    /** Starting Y position */
    startY?: number;
    /** Horizontal spacing between nodes */
    spacingX?: number;
    /** Vertical spacing between nodes */
    spacingY?: number;
    /** Nodes per row for grid layout */
    nodesPerRow?: number;
    /** Preserve original IDs when possible */
    preserveIds?: boolean;
}

const DEFAULT_OPTIONS: Required<ConversionOptions> = {
    autoLayout: true,
    startX: 100,
    startY: 100,
    spacingX: 200,
    spacingY: 150,
    nodesPerRow: 4,
    preserveIds: true,
};

// =============================================================================
// Shape Mapping
// =============================================================================

/**
 * Map IR node shape to XY Flow node type
 */
function mapNodeType(shape?: string): DiagramNodeType {
    if (!shape) return 'rectangle';

    switch (shape.toLowerCase()) {
        case 'circle':
        case 'ellipse':
        case 'oval':
            return 'ellipse';
        case 'diamond':
        case 'rhombus':
        case 'decision':
            return 'diamond';
        case 'note':
        case 'sticky':
        case 'comment':
            return 'sticky';
        case 'swimlane':
        case 'lane':
        case 'pool':
            return 'swimlane';
        case 'text':
        case 'label':
            return 'text';
        case 'rectangle':
        case 'box':
        case 'process':
        case 'rounded-rectangle':
        default:
            return 'rectangle';
    }
}

/**
 * Generate a unique ID for a node
 */
function generateNodeId(originalId: string | undefined, preserveIds: boolean): string {
    if (preserveIds && originalId) {
        // Clean the ID to be safe for XY Flow
        return originalId.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
    return nanoid(10);
}

/**
 * Generate a unique ID for an edge
 */
function generateEdgeId(
    edgeId: string | undefined,
    sourceId: string,
    targetId: string,
    index: number
): string {
    if (edgeId) {
        return edgeId.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
    return `edge-${sourceId}-${targetId}-${index}`;
}

// =============================================================================
// Main Conversion Function
// =============================================================================

/**
 * Convert IR diagram to XY Flow format
 * 
 * @param diagram - IR diagram from @whitebite/diagram-converter
 * @param options - Conversion options
 * @returns Converted nodes, edges, and any warnings
 * 
 * @example
 * ```ts
 * import { parseMermaid } from '@whitebite/diagram-converter';
 * import { irToXYFlow } from './adapters';
 * 
 * const diagram = parseMermaid(mermaidCode);
 * const { nodes, edges, warnings } = irToXYFlow(diagram);
 * ```
 */
export function irToXYFlow(
    diagram: Diagram,
    options: ConversionOptions = {}
): ConversionResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const warnings: string[] = [];
    const nodeIdMap = new Map<string, string>();

    // Convert nodes
    const nodes: DiagramNode[] = diagram.nodes.map((node: IRNode, index: number) => {
        const nodeType = mapNodeType(node.shape);
        const defaultSize = DEFAULT_NODE_SIZE[nodeType];

        // Generate unique ID and track mapping
        const nodeId = generateNodeId(node.id, opts.preserveIds);
        nodeIdMap.set(node.id, nodeId);

        // Calculate position
        let x: number, y: number;
        if (opts.autoLayout || !node.position) {
            const row = Math.floor(index / opts.nodesPerRow);
            const col = index % opts.nodesPerRow;
            x = opts.startX + col * opts.spacingX;
            y = opts.startY + row * opts.spacingY;
        } else {
            x = node.position.x ?? opts.startX + index * opts.spacingX;
            y = node.position.y ?? opts.startY;
        }

        // Build node data
        const data: DiagramNodeData = {
            label: node.label ?? node.id ?? 'Node',
            style: {
                fill: node.style?.fill,
                stroke: node.style?.stroke,
                strokeWidth: node.style?.strokeWidth,
            },
            textStyle: {
                fontSize: node.style?.fontSize,
                color: node.style?.fontColor,
            },
            width: node.size?.width ?? defaultSize.width,
            height: node.size?.height ?? defaultSize.height,
        };

        return {
            id: nodeId,
            type: nodeType,
            position: { x, y },
            data,
        } as DiagramNode;
    });

    // Convert edges
    const edges: DiagramEdge[] = [];

    diagram.edges.forEach((edge: IREdge, index: number) => {
        const sourceId = nodeIdMap.get(edge.source);
        const targetId = nodeIdMap.get(edge.target);

        // Validate source and target exist
        if (!sourceId) {
            warnings.push(`Edge source "${edge.source}" not found in nodes`);
            return;
        }
        if (!targetId) {
            warnings.push(`Edge target "${edge.target}" not found in nodes`);
            return;
        }

        const edgeId = generateEdgeId(edge.id, sourceId, targetId, index);

        // Determine route type based on edge metadata
        let routeType: 'straight' | 'step' | 'smoothstep' | 'bezier' = 'smoothstep';
        const metadata = edge.metadata as Record<string, unknown> | undefined;
        if (metadata?.routing === 'straight') {
            routeType = 'straight';
        } else if (metadata?.routing === 'orthogonal' || metadata?.routing === 'elbow') {
            routeType = 'step';
        }

        edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: 'arrow',
            data: {
                label: edge.label,
                routeType,
                style: {
                    stroke: edge.style?.stroke,
                    strokeWidth: edge.style?.strokeWidth,
                },
            },
            markerEnd: 'arrowEnd',
        } as DiagramEdge);
    });

    return { nodes, edges, warnings };
}

export { irToXYFlow as default };
