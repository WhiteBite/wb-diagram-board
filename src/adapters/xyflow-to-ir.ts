/**
 * XY Flow to IR Adapter
 * 
 * Converts XY Flow nodes and edges to the Intermediate Representation (IR) format
 * used by @whitebite/diagram-converter for export to various formats.
 */

import type {
    Diagram,
    DiagramNode as IRNode,
    DiagramEdge as IREdge,
    NodeShape,
    NodeStyle,
    EdgeStyle,
} from '@whitebite/diagram-converter';
import type { DiagramNode, DiagramEdge, DiagramNodeType } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

export interface ConversionResult {
    diagram: Diagram;
    warnings: string[];
}

export interface ConversionOptions {
    /** Diagram type for the output */
    diagramType?: 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'mindmap' | 'gantt' | 'pie' | 'generic';
    /** Include metadata in the output */
    includeMetadata?: boolean;
}

const DEFAULT_OPTIONS: Required<ConversionOptions> = {
    diagramType: 'flowchart',
    includeMetadata: true,
};

// =============================================================================
// Shape Mapping
// =============================================================================

/**
 * Map XY Flow node type to IR node shape
 */
function mapToIRShape(nodeType: DiagramNodeType | string | undefined): NodeShape {
    switch (nodeType) {
        case 'ellipse':
            return 'ellipse';
        case 'diamond':
            return 'diamond';
        case 'sticky':
            return 'note';
        case 'swimlane':
            return 'rectangle'; // IR doesn't have swimlane, use rectangle
        case 'text':
            return 'rectangle'; // IR doesn't have text-only, use rectangle
        case 'rectangle':
        default:
            return 'rectangle';
    }
}

// =============================================================================
// Main Conversion Function
// =============================================================================

/**
 * Convert XY Flow format to IR diagram
 * 
 * @param nodes - XY Flow nodes
 * @param edges - XY Flow edges
 * @param options - Conversion options
 * @returns Converted IR diagram and any warnings
 * 
 * @example
 * ```ts
 * import { xyflowToIR } from './adapters';
 * import { generateMermaid } from '@whitebite/diagram-converter';
 * 
 * const { diagram, warnings } = xyflowToIR(nodes, edges);
 * const mermaidCode = generateMermaid(diagram);
 * ```
 */
export function xyflowToIR(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    options: ConversionOptions = {}
): ConversionResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const warnings: string[] = [];

    // Convert nodes to IR format
    const irNodes: IRNode[] = nodes.map((node) => {
        const shape = mapToIRShape(node.type);

        // Build node style
        const style: NodeStyle = {};
        if (node.data.style?.fill) style.fill = node.data.style.fill;
        if (node.data.style?.stroke) style.stroke = node.data.style.stroke;
        if (node.data.style?.strokeWidth) style.strokeWidth = node.data.style.strokeWidth;
        if (node.data.textStyle?.fontSize) style.fontSize = node.data.textStyle.fontSize;
        if (node.data.textStyle?.color) style.fontColor = node.data.textStyle.color;

        const irNode: IRNode = {
            id: node.id,
            type: 'node',
            label: node.data.label,
            shape,
            position: {
                x: node.position.x,
                y: node.position.y,
            },
            size: {
                width: node.data.width ?? 150,
                height: node.data.height ?? 60,
            },
            style,
        };

        // Add metadata if enabled
        if (opts.includeMetadata) {
            irNode.metadata = {
                xyflowType: node.type,
                stickyColor: node.data.stickyColor,
                swimlaneTitle: node.data.swimlaneTitle,
                swimlaneOrientation: node.data.swimlaneOrientation,
            };
        }

        return irNode;
    });

    // Build node ID set for validation
    const nodeIds = new Set(irNodes.map(n => n.id));

    // Convert edges to IR format
    const irEdges: IREdge[] = [];

    edges.forEach((edge) => {
        // Validate source and target exist
        if (!nodeIds.has(edge.source)) {
            warnings.push(`Edge source "${edge.source}" not found in nodes`);
            return;
        }
        if (!nodeIds.has(edge.target)) {
            warnings.push(`Edge target "${edge.target}" not found in nodes`);
            return;
        }

        // Build edge style
        const style: EdgeStyle = {};
        if (edge.data?.style?.stroke) style.stroke = edge.data.style.stroke;
        if (edge.data?.style?.strokeWidth) style.strokeWidth = edge.data.style.strokeWidth;

        const irEdge: IREdge = {
            id: edge.id,
            type: 'edge',
            source: edge.source,
            target: edge.target,
            label: edge.data?.label,
            arrow: {
                sourceType: 'none',
                targetType: 'arrow',
                lineType: 'solid',
            },
            style,
        };

        // Add metadata if enabled
        if (opts.includeMetadata) {
            irEdge.metadata = {
                xyflowType: edge.type,
                routeType: edge.data?.routeType,
                animated: edge.data?.animated,
            };
        }

        irEdges.push(irEdge);
    });

    // Build the diagram
    const diagram: Diagram = {
        id: `xyflow-${Date.now()}`,
        type: opts.diagramType,
        nodes: irNodes,
        edges: irEdges,
        groups: [],
        metadata: opts.includeMetadata ? {
            source: 'xyflow',
            sourceVersion: '12.x',
            created: new Date().toISOString(),
        } : undefined,
    };

    return { diagram, warnings };
}

export { xyflowToIR as default };
