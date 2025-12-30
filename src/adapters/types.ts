/**
 * Adapter Types
 *
 * Shared types for conversion between XY Flow and IR formats.
 */

import type {
    Diagram,
    DiagramNode,
    DiagramEdge,
    DiagramGroup,
    NodeShape,
    ArrowHeadType,
    LineType,
} from '@whitebite/diagram-converter';

// =============================================================================
// Common Types
// =============================================================================

/** Position in 2D space */
export interface Position {
    x: number;
    y: number;
}

/** Size dimensions */
export interface Size {
    width: number;
    height: number;
}

/** Bounding box */
export interface BoundingBox extends Position, Size { }

// =============================================================================
// IR Types (re-exported for convenience)
// =============================================================================

export type {
    Diagram,
    DiagramNode,
    DiagramEdge,
    DiagramGroup,
    NodeShape,
    ArrowHeadType,
    LineType,
};

// =============================================================================
// XY Flow Node Shape Mappings
// =============================================================================

/**
 * XY Flow node shape variants
 */
export type XYFlowShapeVariant =
    | 'rectangle'
    | 'rounded-rectangle'
    | 'ellipse'
    | 'diamond'
    | 'hexagon'
    | 'parallelogram'
    | 'trapezoid'
    | 'cylinder'
    | 'document'
    | 'cloud';

/**
 * Mapping from XY Flow shape variant to IR NodeShape
 */
export const XYFLOW_VARIANT_TO_SHAPE_MAP: Record<XYFlowShapeVariant, NodeShape> = {
    rectangle: 'rectangle',
    'rounded-rectangle': 'rounded-rectangle',
    ellipse: 'ellipse',
    diamond: 'diamond',
    hexagon: 'hexagon',
    parallelogram: 'parallelogram',
    trapezoid: 'trapezoid',
    cylinder: 'cylinder',
    document: 'document',
    cloud: 'cloud',
};

/**
 * Mapping from IR NodeShape to XY Flow shape variant
 */
export const SHAPE_TO_XYFLOW_VARIANT_MAP: Partial<Record<NodeShape, XYFlowShapeVariant>> = {
    rectangle: 'rectangle',
    'rounded-rectangle': 'rounded-rectangle',
    ellipse: 'ellipse',
    circle: 'ellipse',
    diamond: 'diamond',
    hexagon: 'hexagon',
    parallelogram: 'parallelogram',
    trapezoid: 'trapezoid',
    cylinder: 'cylinder',
    document: 'document',
    cloud: 'cloud',
    actor: 'ellipse',
    note: 'rectangle',
    custom: 'rectangle',
};

// =============================================================================
// Arrow/Edge Type Mappings
// =============================================================================

/** Arrow head type mapping to IR */
export const ARROWHEAD_TO_IR_MAP: Record<string, ArrowHeadType> = {
    none: 'none',
    arrow: 'arrow',
    arrowclosed: 'arrow',
    triangle: 'arrow',
    diamond: 'diamond',
    dot: 'circle',
    circle: 'circle',
};

/** IR arrow head type to XY Flow marker */
export const IR_TO_ARROWHEAD_MAP: Partial<Record<ArrowHeadType, string>> = {
    none: 'none',
    arrow: 'arrow',
    open: 'arrow',
    diamond: 'diamond',
    'diamond-filled': 'diamond',
    circle: 'dot',
    'circle-filled': 'dot',
    bar: 'none',
    cross: 'none',
};

/** Line type mapping to IR */
export const LINE_TYPE_TO_IR_MAP: Record<string, LineType> = {
    default: 'solid',
    straight: 'solid',
    step: 'solid',
    smoothstep: 'solid',
    bezier: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
};

/** IR line type to XY Flow edge type */
export const IR_TO_LINE_TYPE_MAP: Partial<Record<LineType, string>> = {
    solid: 'smoothstep',
    thick: 'smoothstep',
    dashed: 'smoothstep',
    dotted: 'smoothstep',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Map XY Flow shape variant to IR node shape
 */
export function mapXYFlowVariantToShape(variant: XYFlowShapeVariant): NodeShape {
    return XYFLOW_VARIANT_TO_SHAPE_MAP[variant] || 'rectangle';
}

/**
 * Map IR node shape to XY Flow shape variant
 */
export function mapShapeToXYFlowVariant(shape: NodeShape): XYFlowShapeVariant {
    return SHAPE_TO_XYFLOW_VARIANT_MAP[shape] || 'rectangle';
}

/**
 * Map arrow marker to IR arrow head type
 */
export function mapArrowheadToIR(arrowhead: string): ArrowHeadType {
    return ARROWHEAD_TO_IR_MAP[arrowhead] || 'none';
}

/**
 * Map IR arrow head type to XY Flow marker
 */
export function mapIRToArrowhead(arrowHead: ArrowHeadType): string {
    return IR_TO_ARROWHEAD_MAP[arrowHead] || 'none';
}

/**
 * Map edge type to IR line type
 */
export function mapEdgeTypeToLineType(edgeType: string): LineType {
    return LINE_TYPE_TO_IR_MAP[edgeType] || 'solid';
}

/**
 * Map IR line type to XY Flow edge type
 */
export function mapLineTypeToEdgeType(lineType: LineType): string {
    return IR_TO_LINE_TYPE_MAP[lineType] || 'smoothstep';
}
