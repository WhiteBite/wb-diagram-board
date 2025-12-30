/**
 * Draw.io Parser
 *
 * Parses Draw.io XML format and converts to XY Flow nodes and edges.
 * Draw.io uses mxGraph XML format with compressed/encoded cell data.
 */

import { nanoid } from 'nanoid';
import type { DiagramNode, DiagramEdge, DiagramNodeType } from '../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

export interface DrawioParseResult {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    warnings: string[];
    metadata?: DrawioMetadata;
}

export interface DrawioMetadata {
    name?: string;
    version?: string;
    pageCount?: number;
    compressed?: boolean;
}

interface MxCell {
    id: string;
    value?: string;
    style?: string;
    vertex?: boolean;
    edge?: boolean;
    source?: string;
    target?: string;
    parent?: string;
    geometry?: MxGeometry;
}

interface MxGeometry {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    relative?: boolean;
    points?: Array<{ x: number; y: number }>;
}

// =============================================================================
// Constants
// =============================================================================

const STYLE_SHAPE_MAP: Record<string, DiagramNodeType> = {
    rectangle: 'rectangle',
    rounded: 'rounded-rectangle',
    ellipse: 'ellipse',
    rhombus: 'diamond',
    hexagon: 'hexagon',
    parallelogram: 'parallelogram',
    trapezoid: 'trapezoid',
    cylinder: 'cylinder',
    document: 'document',
    cloud: 'cloud',
    actor: 'actor',
    note: 'note',
    swimlane: 'swimlane',
    text: 'text',
    // Additional mappings
    process: 'rectangle',
    decision: 'diamond',
    terminator: 'rounded-rectangle',
    data: 'parallelogram',
    database: 'cylinder',
    predefinedProcess: 'rectangle',
    internalStorage: 'rectangle',
    manualInput: 'trapezoid',
    preparation: 'hexagon',
    delay: 'rounded-rectangle',
    storedData: 'cylinder',
    merge: 'diamond',
    connector: 'ellipse',
    or: 'ellipse',
    summing: 'ellipse',
    display: 'rounded-rectangle',
    offPageReference: 'rectangle',
    card: 'rectangle',
    tape: 'rectangle',
};

// =============================================================================
// XML Parsing Helpers
// =============================================================================

/**
 * Parse XML string to Document
 */
function parseXML(xmlString: string): Document {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');

    // Check for parsing errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error(`XML parsing error: ${parseError.textContent}`);
    }

    return doc;
}

/**
 * Decode base64 and decompress if needed
 */
function decodeDrawioData(data: string): string {
    try {
        // Try URL decode first
        let decoded = decodeURIComponent(data);

        // Try base64 decode
        try {
            decoded = atob(decoded);
        } catch {
            // Not base64, use as-is
        }

        // Try to decompress (pako would be needed for full support)
        // For now, return decoded string
        return decoded;
    } catch {
        return data;
    }
}

/**
 * Parse style string into key-value pairs
 */
function parseStyle(styleString?: string): Record<string, string> {
    if (!styleString) return {};

    const style: Record<string, string> = {};
    const parts = styleString.split(';');

    for (const part of parts) {
        if (!part.trim()) continue;

        const [key, value] = part.split('=');
        if (key) {
            style[key.trim()] = value?.trim() ?? '1';
        }
    }

    return style;
}

/**
 * Extract shape type from style
 */
function getShapeFromStyle(style: Record<string, string>): DiagramNodeType {
    // Check explicit shape
    if (style.shape) {
        const shapeName = style.shape.replace('mxgraph.', '').split('.').pop() ?? '';
        if (STYLE_SHAPE_MAP[shapeName]) {
            return STYLE_SHAPE_MAP[shapeName];
        }
    }

    // Check style flags
    if (style.rounded === '1') return 'rounded-rectangle';
    if (style.ellipse === '1') return 'ellipse';
    if (style.rhombus === '1') return 'diamond';
    if (style.swimlane === '1') return 'swimlane';
    if (style.text === '1') return 'text';

    // Default to rectangle
    return 'rectangle';
}

/**
 * Parse color from Draw.io format
 */
function parseColor(color?: string): string | undefined {
    if (!color || color === 'none') return undefined;

    // Handle hex colors
    if (color.startsWith('#')) return color;

    // Handle named colors
    const namedColors: Record<string, string> = {
        white: '#ffffff',
        black: '#000000',
        red: '#ff0000',
        green: '#00ff00',
        blue: '#0000ff',
        yellow: '#ffff00',
        orange: '#ffa500',
        purple: '#800080',
        gray: '#808080',
        grey: '#808080',
    };

    return namedColors[color.toLowerCase()] ?? color;
}

// =============================================================================
// Cell Parsing
// =============================================================================

/**
 * Parse mxCell element to MxCell object
 */
function parseMxCell(element: Element): MxCell {
    const cell: MxCell = {
        id: element.getAttribute('id') ?? nanoid(8),
        value: element.getAttribute('value') ?? undefined,
        style: element.getAttribute('style') ?? undefined,
        vertex: element.getAttribute('vertex') === '1',
        edge: element.getAttribute('edge') === '1',
        source: element.getAttribute('source') ?? undefined,
        target: element.getAttribute('target') ?? undefined,
        parent: element.getAttribute('parent') ?? undefined,
    };

    // Parse geometry
    const geometryEl = element.querySelector('mxGeometry');
    if (geometryEl) {
        cell.geometry = {
            x: parseFloat(geometryEl.getAttribute('x') ?? '0'),
            y: parseFloat(geometryEl.getAttribute('y') ?? '0'),
            width: parseFloat(geometryEl.getAttribute('width') ?? '100'),
            height: parseFloat(geometryEl.getAttribute('height') ?? '60'),
            relative: geometryEl.getAttribute('relative') === '1',
        };

        // Parse points for edges
        const pointsEl = geometryEl.querySelectorAll('mxPoint');
        if (pointsEl.length > 0) {
            cell.geometry.points = Array.from(pointsEl).map((p) => ({
                x: parseFloat(p.getAttribute('x') ?? '0'),
                y: parseFloat(p.getAttribute('y') ?? '0'),
            }));
        }
    }

    return cell;
}

/**
 * Convert MxCell to DiagramNode
 */
function cellToNode(cell: MxCell, index: number): DiagramNode | null {
    if (!cell.vertex || cell.edge) return null;

    const style = parseStyle(cell.style);
    const nodeType = getShapeFromStyle(style);
    const defaultSize = DEFAULT_NODE_SIZE[nodeType];

    // Extract label from value (may contain HTML)
    let label = cell.value ?? '';
    // Strip HTML tags for simple label
    label = label.replace(/<[^>]*>/g, '').trim() || `Node ${index + 1}`;

    const node: DiagramNode = {
        id: cell.id,
        type: nodeType,
        position: {
            x: cell.geometry?.x ?? index * 200,
            y: cell.geometry?.y ?? Math.floor(index / 4) * 150,
        },
        data: {
            label,
            style: {
                fill: parseColor(style.fillColor) ?? '#ffffff',
                stroke: parseColor(style.strokeColor) ?? '#1e293b',
                strokeWidth: parseInt(style.strokeWidth ?? '2', 10),
            },
            textStyle: {
                fontSize: parseInt(style.fontSize ?? '14', 10),
                color: parseColor(style.fontColor) ?? '#1e1e1e',
            },
            width: cell.geometry?.width ?? defaultSize.width,
            height: cell.geometry?.height ?? defaultSize.height,
        },
    };

    return node;
}

/**
 * Convert MxCell to DiagramEdge
 */
function cellToEdge(cell: MxCell, nodeIds: Set<string>): DiagramEdge | null {
    if (!cell.edge || !cell.source || !cell.target) return null;

    // Validate source and target exist
    if (!nodeIds.has(cell.source) || !nodeIds.has(cell.target)) {
        return null;
    }

    const style = parseStyle(cell.style);

    // Determine route type from style
    let routeType: 'straight' | 'step' | 'smoothstep' | 'bezier' = 'smoothstep';
    if (style.edgeStyle === 'orthogonalEdgeStyle' || style.elbow === 'vertical') {
        routeType = 'step';
    } else if (style.curved === '1') {
        routeType = 'bezier';
    } else if (style.edgeStyle === 'straightEdgeStyle') {
        routeType = 'straight';
    }

    const edge: DiagramEdge = {
        id: cell.id,
        source: cell.source,
        target: cell.target,
        type: 'arrow',
        data: {
            label: cell.value?.replace(/<[^>]*>/g, '').trim(),
            routeType,
            style: {
                stroke: parseColor(style.strokeColor) ?? '#1e293b',
                strokeWidth: parseInt(style.strokeWidth ?? '2', 10),
            },
        },
        markerEnd: style.endArrow !== 'none' ? 'arrowEnd' : undefined,
        markerStart: style.startArrow && style.startArrow !== 'none' ? 'arrowStart' : undefined,
    };

    return edge;
}

// =============================================================================
// Main Parser
// =============================================================================

/**
 * Parse Draw.io XML content
 *
 * @param xmlContent - Draw.io XML string
 * @returns Parsed nodes, edges, and warnings
 *
 * @example
 * ```ts
 * const result = parseDrawio(xmlContent);
 * if (result.warnings.length > 0) {
 *   console.warn('Warnings:', result.warnings);
 * }
 * // Use result.nodes and result.edges
 * ```
 */
export function parseDrawio(xmlContent: string): DrawioParseResult {
    const warnings: string[] = [];
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    try {
        // Parse XML
        const doc = parseXML(xmlContent);

        // Extract metadata
        const mxfile = doc.querySelector('mxfile');
        const metadata: DrawioMetadata = {
            name: mxfile?.getAttribute('host') ?? undefined,
            version: mxfile?.getAttribute('version') ?? undefined,
            compressed: mxfile?.getAttribute('compressed') === 'true',
        };

        // Find diagram content
        let diagramContent = xmlContent;

        // Check for compressed/encoded diagram
        const diagramEl = doc.querySelector('diagram');
        if (diagramEl?.textContent) {
            try {
                diagramContent = decodeDrawioData(diagramEl.textContent);
                // Re-parse if we decoded something
                if (diagramContent !== diagramEl.textContent) {
                    const innerDoc = parseXML(diagramContent);
                    // Continue with inner document
                    const cells = innerDoc.querySelectorAll('mxCell');
                    processCells(cells);
                    return { nodes, edges, warnings, metadata };
                }
            } catch (e) {
                warnings.push(`Could not decode diagram content: ${e}`);
            }
        }

        // Find all mxCell elements
        const cells = doc.querySelectorAll('mxCell');
        processCells(cells);

        function processCells(cells: NodeListOf<Element>) {
            const parsedCells: MxCell[] = [];

            // First pass: parse all cells
            cells.forEach((cellEl) => {
                const cell = parseMxCell(cellEl);
                parsedCells.push(cell);
            });

            // Second pass: convert vertices to nodes
            const nodeIds = new Set<string>();
            parsedCells.forEach((cell, index) => {
                if (cell.vertex && !cell.edge) {
                    const node = cellToNode(cell, index);
                    if (node) {
                        nodes.push(node);
                        nodeIds.add(node.id);
                    }
                }
            });

            // Third pass: convert edges
            parsedCells.forEach((cell) => {
                if (cell.edge) {
                    const edge = cellToEdge(cell, nodeIds);
                    if (edge) {
                        edges.push(edge);
                    } else if (cell.source || cell.target) {
                        warnings.push(
                            `Edge ${cell.id} has invalid source/target: ${cell.source} -> ${cell.target}`
                        );
                    }
                }
            });
        }

        if (nodes.length === 0) {
            warnings.push('No nodes found in Draw.io file');
        }

        return { nodes, edges, warnings, metadata };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        warnings.push(`Failed to parse Draw.io file: ${message}`);
        return { nodes, edges, warnings };
    }
}

/**
 * Validate if content is a Draw.io file
 */
export function isDrawioFile(content: string): boolean {
    return (
        content.includes('<mxfile') ||
        content.includes('<mxGraphModel') ||
        content.includes('mxCell')
    );
}

export default parseDrawio;
