/**
 * FigJam Parser
 *
 * Parses FigJam JSON export format and converts to XY Flow nodes and edges.
 * FigJam exports contain nodes with various types and connectors.
 */

import { nanoid } from 'nanoid';
import type { DiagramNode, DiagramEdge, DiagramNodeType, StickyColor } from '../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

export interface FigJamParseResult {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    warnings: string[];
    metadata?: FigJamMetadata;
}

export interface FigJamMetadata {
    name?: string;
    version?: string;
    lastModified?: string;
    schemaVersion?: number;
}

/**
 * FigJam node types from export
 */
interface FigJamNode {
    id: string;
    name?: string;
    type: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    absoluteRenderBounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    characters?: string;
    fills?: FigJamFill[];
    strokes?: FigJamStroke[];
    strokeWeight?: number;
    cornerRadius?: number;
    children?: FigJamNode[];
    connectorStart?: FigJamConnectorEndpoint;
    connectorEnd?: FigJamConnectorEndpoint;
    connectorLineType?: string;
    connectorStartStrokeCap?: string;
    connectorEndStrokeCap?: string;
    // Sticky note specific
    stickyNoteColor?: string;
    // Shape specific
    shapeType?: string;
}

interface FigJamFill {
    type: string;
    color?: {
        r: number;
        g: number;
        b: number;
        a?: number;
    };
    opacity?: number;
}

interface FigJamStroke {
    type: string;
    color?: {
        r: number;
        g: number;
        b: number;
        a?: number;
    };
}

interface FigJamConnectorEndpoint {
    endpointNodeId?: string;
    position?: { x: number; y: number };
    magnet?: string;
}

interface FigJamDocument {
    document?: {
        id: string;
        name: string;
        type: string;
        children?: FigJamNode[];
    };
    name?: string;
    lastModified?: string;
    version?: string;
    schemaVersion?: number;
    nodes?: Record<string, FigJamNode>;
}

// =============================================================================
// Constants
// =============================================================================

const FIGJAM_TYPE_MAP: Record<string, DiagramNodeType> = {
    STICKY: 'sticky',
    SHAPE_WITH_TEXT: 'rectangle',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    POLYGON: 'diamond',
    STAR: 'hexagon',
    LINE: 'text',
    TEXT: 'text',
    FRAME: 'group',
    GROUP: 'group',
    SECTION: 'swimlane',
    CONNECTOR: 'text', // Connectors become edges, not nodes
    WIDGET: 'rectangle',
    STAMP: 'rectangle',
    // Shape types
    SQUARE: 'rectangle',
    ROUNDED_RECTANGLE: 'rounded-rectangle',
    DIAMOND: 'diamond',
    TRIANGLE_UP: 'diamond',
    TRIANGLE_DOWN: 'diamond',
    PARALLELOGRAM_RIGHT: 'parallelogram',
    PARALLELOGRAM_LEFT: 'parallelogram',
    TRAPEZOID: 'trapezoid',
    PENTAGON: 'hexagon',
    HEXAGON: 'hexagon',
    OCTAGON: 'hexagon',
    CIRCLE: 'ellipse',
    SEMICIRCLE: 'ellipse',
    CROSS: 'rectangle',
    PLUS: 'rectangle',
    ARROW_LEFT: 'rectangle',
    ARROW_RIGHT: 'rectangle',
    ARROW_UP: 'rectangle',
    ARROW_DOWN: 'rectangle',
};

const FIGJAM_STICKY_COLORS: Record<string, StickyColor> = {
    YELLOW: 'yellow',
    BLUE: 'blue',
    GREEN: 'green',
    PINK: 'pink',
    VIOLET: 'purple',
    ORANGE: 'orange',
    RED: 'pink',
    TEAL: 'green',
    LIGHT_GRAY: 'yellow',
    GRAY: 'yellow',
};

// =============================================================================
// Color Helpers
// =============================================================================

/**
 * Convert FigJam RGBA to hex color
 */
function rgbaToHex(color?: { r: number; g: number; b: number; a?: number }): string {
    if (!color) return '#ffffff';

    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get fill color from FigJam fills array
 */
function getFillColor(fills?: FigJamFill[]): string {
    if (!fills || fills.length === 0) return '#ffffff';

    const solidFill = fills.find((f) => f.type === 'SOLID' && f.color);
    if (solidFill?.color) {
        return rgbaToHex(solidFill.color);
    }

    return '#ffffff';
}

/**
 * Get stroke color from FigJam strokes array
 */
function getStrokeColor(strokes?: FigJamStroke[]): string {
    if (!strokes || strokes.length === 0) return '#1e293b';

    const solidStroke = strokes.find((s) => s.type === 'SOLID' && s.color);
    if (solidStroke?.color) {
        return rgbaToHex(solidStroke.color);
    }

    return '#1e293b';
}

// =============================================================================
// Node Conversion
// =============================================================================

/**
 * Get node type from FigJam node
 */
function getNodeType(node: FigJamNode): DiagramNodeType {
    // Check shape type first
    if (node.shapeType && FIGJAM_TYPE_MAP[node.shapeType]) {
        return FIGJAM_TYPE_MAP[node.shapeType];
    }

    // Check node type
    if (FIGJAM_TYPE_MAP[node.type]) {
        return FIGJAM_TYPE_MAP[node.type];
    }

    return 'rectangle';
}

/**
 * Get sticky color from FigJam sticky note
 */
function getStickyColor(colorName?: string): StickyColor {
    if (!colorName) return 'yellow';
    return FIGJAM_STICKY_COLORS[colorName] ?? 'yellow';
}

/**
 * Extract text content from FigJam node
 */
function getNodeLabel(node: FigJamNode): string {
    // Direct characters property
    if (node.characters) {
        return node.characters.trim();
    }

    // Check name
    if (node.name && !node.name.startsWith('Rectangle') && !node.name.startsWith('Ellipse')) {
        return node.name.trim();
    }

    // Check children for text nodes
    if (node.children) {
        for (const child of node.children) {
            if (child.type === 'TEXT' && child.characters) {
                return child.characters.trim();
            }
        }
    }

    return node.name ?? 'Node';
}

/**
 * Get node position from FigJam node
 */
function getNodePosition(node: FigJamNode): { x: number; y: number } {
    // Use absoluteBoundingBox if available
    if (node.absoluteBoundingBox) {
        return {
            x: node.absoluteBoundingBox.x,
            y: node.absoluteBoundingBox.y,
        };
    }

    // Use direct x/y
    return {
        x: node.x ?? 0,
        y: node.y ?? 0,
    };
}

/**
 * Get node size from FigJam node
 */
function getNodeSize(node: FigJamNode, nodeType: DiagramNodeType): { width: number; height: number } {
    // Use absoluteBoundingBox if available
    if (node.absoluteBoundingBox) {
        return {
            width: node.absoluteBoundingBox.width,
            height: node.absoluteBoundingBox.height,
        };
    }

    // Use direct width/height
    if (node.width && node.height) {
        return {
            width: node.width,
            height: node.height,
        };
    }

    // Default size
    return DEFAULT_NODE_SIZE[nodeType];
}

/**
 * Convert FigJam node to DiagramNode
 */
function convertNode(node: FigJamNode, _index: number): DiagramNode | null {
    // Skip connectors (they become edges)
    if (node.type === 'CONNECTOR') {
        return null;
    }

    const nodeType = getNodeType(node);
    const position = getNodePosition(node);
    const size = getNodeSize(node, nodeType);
    const label = getNodeLabel(node);

    const diagramNode: DiagramNode = {
        id: node.id || `node-${nanoid(8)}`,
        type: nodeType,
        position,
        data: {
            label,
            style: {
                fill: getFillColor(node.fills),
                stroke: getStrokeColor(node.strokes),
                strokeWidth: node.strokeWeight ?? 2,
                cornerRadius: node.cornerRadius,
            },
            width: size.width,
            height: size.height,
        },
    };

    // Add sticky-specific data
    if (node.type === 'STICKY' || nodeType === 'sticky') {
        diagramNode.data.stickyColor = getStickyColor(node.stickyNoteColor);
    }

    return diagramNode;
}

/**
 * Convert FigJam connector to DiagramEdge
 */
function convertConnector(node: FigJamNode, nodeIds: Set<string>): DiagramEdge | null {
    if (node.type !== 'CONNECTOR') {
        return null;
    }

    const sourceId = node.connectorStart?.endpointNodeId;
    const targetId = node.connectorEnd?.endpointNodeId;

    // Validate source and target
    if (!sourceId || !targetId) {
        return null;
    }

    if (!nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
        return null;
    }

    // Determine route type
    let routeType: 'straight' | 'step' | 'smoothstep' | 'bezier' = 'smoothstep';
    if (node.connectorLineType === 'STRAIGHT') {
        routeType = 'straight';
    } else if (node.connectorLineType === 'ELBOWED') {
        routeType = 'step';
    } else if (node.connectorLineType === 'CURVED') {
        routeType = 'bezier';
    }

    // Determine if has arrow markers
    const hasStartArrow = node.connectorStartStrokeCap === 'ARROW_LINES' ||
        node.connectorStartStrokeCap === 'ARROW_EQUILATERAL' ||
        node.connectorStartStrokeCap === 'TRIANGLE_FILLED';

    const hasEndArrow = node.connectorEndStrokeCap === 'ARROW_LINES' ||
        node.connectorEndStrokeCap === 'ARROW_EQUILATERAL' ||
        node.connectorEndStrokeCap === 'TRIANGLE_FILLED' ||
        node.connectorEndStrokeCap === undefined; // Default has arrow

    const edge: DiagramEdge = {
        id: node.id || `edge-${nanoid(8)}`,
        source: sourceId,
        target: targetId,
        type: 'arrow',
        data: {
            label: node.characters?.trim(),
            routeType,
            style: {
                stroke: getStrokeColor(node.strokes),
                strokeWidth: node.strokeWeight ?? 2,
            },
        },
        markerEnd: hasEndArrow ? 'arrowEnd' : undefined,
        markerStart: hasStartArrow ? 'arrowStart' : undefined,
    };

    return edge;
}

// =============================================================================
// Tree Traversal
// =============================================================================

/**
 * Recursively collect all nodes from FigJam tree
 */
function collectNodes(node: FigJamNode, result: FigJamNode[]): void {
    // Add current node if it's a valid type
    const validTypes = [
        'STICKY',
        'SHAPE_WITH_TEXT',
        'RECTANGLE',
        'ELLIPSE',
        'POLYGON',
        'STAR',
        'TEXT',
        'CONNECTOR',
        'WIDGET',
        'STAMP',
        'SECTION',
    ];

    if (validTypes.includes(node.type)) {
        result.push(node);
    }

    // Recurse into children
    if (node.children) {
        for (const child of node.children) {
            collectNodes(child, result);
        }
    }
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parse FigJam JSON content
 *
 * @param jsonContent - FigJam JSON string or object
 * @returns Parsed nodes, edges, and warnings
 *
 * @example
 * ```ts
 * const result = parseFigJam(jsonContent);
 * if (result.warnings.length > 0) {
 *   console.warn('Warnings:', result.warnings);
 * }
 * // Use result.nodes and result.edges
 * ```
 */
export function parseFigJam(jsonContent: string | object): FigJamParseResult {
    const warnings: string[] = [];
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    try {
        // Parse JSON if string
        const data: FigJamDocument = typeof jsonContent === 'string'
            ? JSON.parse(jsonContent)
            : jsonContent;

        // Extract metadata
        const metadata: FigJamMetadata = {
            name: data.name ?? data.document?.name,
            version: data.version,
            lastModified: data.lastModified,
            schemaVersion: data.schemaVersion,
        };

        // Collect all FigJam nodes
        const figJamNodes: FigJamNode[] = [];

        // Handle different export formats
        if (data.document?.children) {
            // Full document export
            for (const child of data.document.children) {
                collectNodes(child, figJamNodes);
            }
        } else if (data.nodes) {
            // Nodes map format
            for (const node of Object.values(data.nodes)) {
                collectNodes(node, figJamNodes);
            }
        } else if (Array.isArray(data)) {
            // Array of nodes
            for (const node of data as FigJamNode[]) {
                collectNodes(node, figJamNodes);
            }
        }

        // First pass: convert non-connector nodes
        const nodeIds = new Set<string>();
        figJamNodes.forEach((fjNode, index) => {
            if (fjNode.type !== 'CONNECTOR') {
                const node = convertNode(fjNode, index);
                if (node) {
                    nodes.push(node);
                    nodeIds.add(node.id);
                }
            }
        });

        // Second pass: convert connectors to edges
        figJamNodes.forEach((fjNode) => {
            if (fjNode.type === 'CONNECTOR') {
                const edge = convertConnector(fjNode, nodeIds);
                if (edge) {
                    edges.push(edge);
                } else if (fjNode.connectorStart?.endpointNodeId || fjNode.connectorEnd?.endpointNodeId) {
                    warnings.push(
                        `Connector ${fjNode.id} has invalid endpoints: ${fjNode.connectorStart?.endpointNodeId} -> ${fjNode.connectorEnd?.endpointNodeId}`
                    );
                }
            }
        });

        if (nodes.length === 0) {
            warnings.push('No nodes found in FigJam file');
        }

        return { nodes, edges, warnings, metadata };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        warnings.push(`Failed to parse FigJam file: ${message}`);
        return { nodes, edges, warnings };
    }
}

/**
 * Validate if content is a FigJam file
 */
export function isFigJamFile(content: string): boolean {
    try {
        const data = JSON.parse(content);
        return (
            data.document?.type === 'DOCUMENT' ||
            data.schemaVersion !== undefined ||
            (data.nodes && typeof data.nodes === 'object')
        );
    } catch {
        return false;
    }
}

export default parseFigJam;
