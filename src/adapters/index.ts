/**
 * Diagram Adapters
 *
 * Adapters for converting between diagram formats and IR (Intermediate Representation)
 * format used by @whitebite/diagram-converter.
 *
 * @example
 * ```ts
 * // Export XY Flow to Mermaid
 * import { xyflowToIR } from './adapters';
 * import { generateMermaid } from '@whitebite/diagram-converter';
 *
 * const { diagram } = xyflowToIR(nodes, edges);
 * const mermaid = generateMermaid(diagram);
 *
 * // Import Mermaid to XY Flow
 * import { irToXYFlow } from './adapters';
 * import { parseMermaid } from '@whitebite/diagram-converter';
 *
 * const diagram = parseMermaid(mermaidCode);
 * const { nodes, edges } = irToXYFlow(diagram);
 * ```
 */

// =============================================================================
// XY Flow ↔ IR conversion
// =============================================================================

export { irToXYFlow } from './ir-to-xyflow';
export type {
    ConversionResult as IRToXYFlowResult,
    ConversionOptions as IRToXYFlowOptions,
} from './ir-to-xyflow';

export { xyflowToIR } from './xyflow-to-ir';
export type {
    ConversionResult as XYFlowToIRResult,
    ConversionOptions as XYFlowToIROptions,
} from './xyflow-to-ir';

// =============================================================================
// Common Types (XY Flow compatible)
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
} from '@whitebite/diagram-converter';
