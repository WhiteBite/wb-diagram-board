import { describe, it, expect } from 'vitest';
import { irToXYFlow } from './ir-to-xyflow';
import type { Diagram, DiagramNode as IRNode, DiagramEdge as IREdge } from '@whitebite/diagram-converter';

// Helper to create a minimal valid IR node
function createIRNode(overrides: Partial<IRNode> & { id: string }): IRNode {
    return {
        type: 'node',
        label: overrides.label ?? overrides.id,
        shape: 'rectangle',
        style: {},
        ...overrides,
    };
}

// Helper to create a minimal valid IR edge
function createIREdge(overrides: Partial<IREdge> & { source: string; target: string }): IREdge {
    return {
        id: `${overrides.source}-${overrides.target}`,
        type: 'edge',
        arrow: { sourceType: 'none', targetType: 'arrow', lineType: 'solid' },
        style: {},
        ...overrides,
    };
}

// Helper to create a minimal valid diagram
function createDiagram(nodes: IRNode[], edges: IREdge[] = []): Diagram {
    return {
        id: 'test-diagram',
        type: 'flowchart',
        nodes,
        edges,
        groups: [],
    };
}

describe('irToXYFlow', () => {
    describe('basic conversion', () => {
        it('should convert simple diagram with nodes and edges', () => {
            const diagram = createDiagram(
                [
                    createIRNode({ id: 'A', label: 'Start' }),
                    createIRNode({ id: 'B', label: 'End' }),
                ],
                [
                    createIREdge({ source: 'A', target: 'B' }),
                ]
            );

            const result = irToXYFlow(diagram);

            expect(result.nodes).toHaveLength(2);
            expect(result.edges).toHaveLength(1);
            expect(result.warnings).toHaveLength(0);
        });

        it('should convert empty diagram', () => {
            const diagram = createDiagram([]);

            const result = irToXYFlow(diagram);

            expect(result.nodes).toHaveLength(0);
            expect(result.edges).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should preserve node labels', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'My Custom Label' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].data.label).toBe('My Custom Label');
        });

        it('should use node id as label fallback', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'NodeA', label: undefined as unknown as string }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].data.label).toBe('NodeA');
        });
    });

    describe('shape mapping', () => {
        it('should map circle to ellipse', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Circle', shape: 'circle' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('ellipse');
        });

        it('should map ellipse to ellipse', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Ellipse', shape: 'ellipse' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('ellipse');
        });

        it('should map diamond to diamond', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Diamond', shape: 'diamond' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('diamond');
        });

        it('should map rhombus to diamond', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Rhombus', shape: 'rhombus' as any }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('diamond');
        });

        it('should map note to sticky', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Note', shape: 'note' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('sticky');
        });

        it('should default unknown shapes to rectangle', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Unknown', shape: 'unknown-shape' as any }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('rectangle');
        });

        it('should map multiple shapes correctly', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'Circle', shape: 'circle' }),
                createIRNode({ id: 'B', label: 'Diamond', shape: 'diamond' }),
                createIRNode({ id: 'C', label: 'Rectangle', shape: 'rectangle' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].type).toBe('ellipse');
            expect(result.nodes[1].type).toBe('diamond');
            expect(result.nodes[2].type).toBe('rectangle');
        });
    });

    describe('auto-layout', () => {
        it('should auto-layout nodes in a grid', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'A' }),
                createIRNode({ id: 'B', label: 'B' }),
                createIRNode({ id: 'C', label: 'C' }),
                createIRNode({ id: 'D', label: 'D' }),
                createIRNode({ id: 'E', label: 'E' }),
            ]);

            const result = irToXYFlow(diagram, { nodesPerRow: 4 });

            // First row - same Y
            expect(result.nodes[0].position.y).toBe(result.nodes[1].position.y);
            expect(result.nodes[1].position.y).toBe(result.nodes[2].position.y);
            expect(result.nodes[2].position.y).toBe(result.nodes[3].position.y);

            // Second row - different Y
            expect(result.nodes[4].position.y).toBeGreaterThan(result.nodes[0].position.y);
        });

        it('should respect custom spacing options', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'A' }),
                createIRNode({ id: 'B', label: 'B' }),
            ]);

            const result = irToXYFlow(diagram, {
                startX: 50,
                startY: 50,
                spacingX: 300,
            });

            expect(result.nodes[0].position.x).toBe(50);
            expect(result.nodes[0].position.y).toBe(50);
            expect(result.nodes[1].position.x).toBe(350); // 50 + 300
        });

        it('should use original positions when autoLayout is false', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'A', position: { x: 500, y: 300 } }),
            ]);

            const result = irToXYFlow(diagram, { autoLayout: false });

            expect(result.nodes[0].position.x).toBe(500);
            expect(result.nodes[0].position.y).toBe(300);
        });
    });

    describe('edge conversion', () => {
        it('should convert edges with correct source and target', () => {
            const diagram = createDiagram(
                [
                    createIRNode({ id: 'A', label: 'A' }),
                    createIRNode({ id: 'B', label: 'B' }),
                ],
                [
                    createIREdge({ source: 'A', target: 'B' }),
                ]
            );

            const result = irToXYFlow(diagram);

            expect(result.edges[0].source).toBe('A');
            expect(result.edges[0].target).toBe('B');
        });

        it('should preserve edge labels', () => {
            const diagram = createDiagram(
                [
                    createIRNode({ id: 'A', label: 'A' }),
                    createIRNode({ id: 'B', label: 'B' }),
                ],
                [
                    createIREdge({ source: 'A', target: 'B', label: 'connects to' }),
                ]
            );

            const result = irToXYFlow(diagram);

            expect(result.edges[0].data?.label).toBe('connects to');
        });

        it('should warn when edge source not found', () => {
            const diagram = createDiagram(
                [
                    createIRNode({ id: 'B', label: 'B' }),
                ],
                [
                    createIREdge({ source: 'A', target: 'B' }),
                ]
            );

            const result = irToXYFlow(diagram);

            expect(result.edges).toHaveLength(0);
            expect(result.warnings).toContain('Edge source "A" not found in nodes');
        });

        it('should warn when edge target not found', () => {
            const diagram = createDiagram(
                [
                    createIRNode({ id: 'A', label: 'A' }),
                ],
                [
                    createIREdge({ source: 'A', target: 'B' }),
                ]
            );

            const result = irToXYFlow(diagram);

            expect(result.edges).toHaveLength(0);
            expect(result.warnings).toContain('Edge target "B" not found in nodes');
        });

        it('should set edge type to arrow', () => {
            const diagram = createDiagram(
                [
                    createIRNode({ id: 'A', label: 'A' }),
                    createIRNode({ id: 'B', label: 'B' }),
                ],
                [
                    createIREdge({ source: 'A', target: 'B' }),
                ]
            );

            const result = irToXYFlow(diagram);

            expect(result.edges[0].type).toBe('arrow');
        });
    });

    describe('style preservation', () => {
        it('should preserve node fill color', () => {
            const diagram = createDiagram([
                createIRNode({
                    id: 'A',
                    label: 'A',
                    style: { fill: '#ff0000' }
                }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].data.style?.fill).toBe('#ff0000');
        });

        it('should preserve node stroke color', () => {
            const diagram = createDiagram([
                createIRNode({
                    id: 'A',
                    label: 'A',
                    style: { stroke: '#0000ff' }
                }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].data.style?.stroke).toBe('#0000ff');
        });

        it('should preserve node size', () => {
            const diagram = createDiagram([
                createIRNode({
                    id: 'A',
                    label: 'A',
                    size: { width: 200, height: 100 }
                }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].data.width).toBe(200);
            expect(result.nodes[0].data.height).toBe(100);
        });

        it('should use default size when not specified', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'A', label: 'A' }),
            ]);

            const result = irToXYFlow(diagram);

            expect(result.nodes[0].data.width).toBe(160); // DEFAULT_NODE_SIZE.rectangle.width
            expect(result.nodes[0].data.height).toBe(80); // DEFAULT_NODE_SIZE.rectangle.height
        });
    });

    describe('ID handling', () => {
        it('should preserve IDs when preserveIds is true', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'my-node-id', label: 'A' }),
            ]);

            const result = irToXYFlow(diagram, { preserveIds: true });

            expect(result.nodes[0].id).toBe('my-node-id');
        });

        it('should sanitize IDs with special characters', () => {
            const diagram = createDiagram([
                createIRNode({ id: 'node:with:colons', label: 'A' }),
            ]);

            const result = irToXYFlow(diagram, { preserveIds: true });

            expect(result.nodes[0].id).toBe('node_with_colons');
        });
    });
});
