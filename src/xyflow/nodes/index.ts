/**
 * XY Flow Custom Nodes
 * 
 * Export all custom node components and the nodeTypes registry
 */

import { RectangleNode } from './RectangleNode';
import { EllipseNode } from './EllipseNode';
import { DiamondNode } from './DiamondNode';
import { TextNode } from './TextNode';
import { StickyNode } from './StickyNode';
import { SwimlaneNode } from './SwimlaneNode';
import { GroupNode } from './GroupNode';
import { ImageNode } from './ImageNode';
import {
    HexagonNode,
    ParallelogramNode,
    TrapezoidNode,
    CylinderNode,
    DocumentNode,
    CloudNode,
    ActorNode,
    NoteNode,
    CircleNode,
    RoundedRectangleNode,
} from './ShapeNode';

/**
 * Node types registry for XY Flow
 * Pass this to ReactFlow's nodeTypes prop
 */
export const nodeTypes = {
    // Basic shapes
    rectangle: RectangleNode,
    'rounded-rectangle': RoundedRectangleNode,
    ellipse: EllipseNode,
    circle: CircleNode,
    diamond: DiamondNode,
    hexagon: HexagonNode,
    parallelogram: ParallelogramNode,
    trapezoid: TrapezoidNode,

    // Flowchart shapes
    cylinder: CylinderNode,
    document: DocumentNode,
    cloud: CloudNode,

    // UML shapes
    actor: ActorNode,
    note: NoteNode,

    // Text & Notes
    text: TextNode,
    sticky: StickyNode,

    // Containers
    swimlane: SwimlaneNode,
    group: GroupNode,

    // Media
    image: ImageNode,
} as const;

// Export individual components
export { RectangleNode } from './RectangleNode';
export { EllipseNode } from './EllipseNode';
export { DiamondNode } from './DiamondNode';
export { TextNode } from './TextNode';
export { StickyNode } from './StickyNode';
export { SwimlaneNode } from './SwimlaneNode';
export { GroupNode } from './GroupNode';
export { ImageNode } from './ImageNode';
export {
    HexagonNode,
    ParallelogramNode,
    TrapezoidNode,
    CylinderNode,
    DocumentNode,
    CloudNode,
    ActorNode,
    NoteNode,
    CircleNode,
    RoundedRectangleNode,
} from './ShapeNode';

// Type for node type keys
export type NodeTypeKey = keyof typeof nodeTypes;
