import { describe, it, expect } from 'vitest';
import { xyflowToIR } from './xyflow-to-ir';
import type { DiagramNode, DiagramEdge } from '../xyflow/types';

describe('xyflowToIR', () => {
    describe('basic conversion', () => {
        it('should convert simple nodes and edges', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 100, y: 100 },
                    data: { label: 'Start' },
                },
                {
                    id: 'B',
                    type: 'rectangle',
                    position: { x: 300, y: 100 },
                    data: { label: 'End' },
                },
            ];

            const edges: DiagramEdge[] = [
                {
                    id: 'e1',
                    source: 'A',
                    target: 'B',
                    type: 'arrow',
                },
            ];

            const result = xyflowToIR(nodes, edges);

            expect(result.diagram.nodes).toHaveLength(2);
            expect(result.diagram.edges).toHaveLength(1);
            expect(result.warnings).toHaveLength(0);
        });

        it('should convert empty diagram', () => {
            const result = xyflowToIR([], []);

            expect(result.diagram.nodes).toHaveLength(0);
            expect(result.diagram.edges).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should preserve node labels', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 100, y: 100 },
                    data: { label: 'My Custom Label' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].label).toBe('My Custom Label');
        });

        it('should preserve node positions', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 250, y: 350 },
                    data: { label: 'Node' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].position?.x).toBe(250);
            expect(result.diagram.nodes[0].position?.y).toBe(350);
        });
    });

    describe('shape mapping', () => {
        it('should map rectangle to rectangle', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 0, y: 0 },
                    data: { label: 'Rect' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].shape).toBe('rectangle');
        });

        it('should map ellipse to ellipse', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'ellipse',
                    position: { x: 0, y: 0 },
                    data: { label: 'Ellipse' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].shape).toBe('ellipse');
        });

        it('should map diamond to diamond', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'diamond',
                    position: { x: 0, y: 0 },
                    data: { label: 'Diamond' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].shape).toBe('diamond');
        });

        it('should map sticky to note', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'sticky',
                    position: { x: 0, y: 0 },
                    data: { label: 'Sticky Note' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].shape).toBe('note');
        });

        it('should map text to rectangle', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'text',
                    position: { x: 0, y: 0 },
                    data: { label: 'Text' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].shape).toBe('rectangle');
        });

        it('should map swimlane to rectangle', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'swimlane',
                    position: { x: 0, y: 0 },
                    data: { label: 'Swimlane' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].shape).toBe('rectangle');
        });
    });

    describe('edge conversion', () => {
        it('should convert edges with correct source and target', () => {
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'rectangle', position: { x: 0, y: 0 }, data: { label: 'A' } },
                { id: 'B', type: 'rectangle', position: { x: 100, y: 0 }, data: { label: 'B' } },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'arrow' },
            ];

            const result = xyflowToIR(nodes, edges);

            expect(result.diagram.edges[0].source).toBe('A');
            expect(result.diagram.edges[0].target).toBe('B');
        });

        it('should preserve edge labels', () => {
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'rectangle', position: { x: 0, y: 0 }, data: { label: 'A' } },
                { id: 'B', type: 'rectangle', position: { x: 100, y: 0 }, data: { label: 'B' } },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'arrow', data: { label: 'connects' } },
            ];

            const result = xyflowToIR(nodes, edges);

            expect(result.diagram.edges[0].label).toBe('connects');
        });

        it('should warn when edge source not found', () => {
            const nodes: DiagramNode[] = [
                { id: 'B', type: 'rectangle', position: { x: 0, y: 0 }, data: { label: 'B' } },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'arrow' },
            ];

            const result = xyflowToIR(nodes, edges);

            expect(result.diagram.edges).toHaveLength(0);
            expect(result.warnings).toContain('Edge source "A" not found in nodes');
        });

        it('should warn when edge target not found', () => {
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'rectangle', position: { x: 0, y: 0 }, data: { label: 'A' } },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'arrow' },
            ];

            const result = xyflowToIR(nodes, edges);

            expect(result.diagram.edges).toHaveLength(0);
            expect(result.warnings).toContain('Edge target "B" not found in nodes');
        });

        it('should set default arrow types', () => {
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'rectangle', position: { x: 0, y: 0 }, data: { label: 'A' } },
                { id: 'B', type: 'rectangle', position: { x: 100, y: 0 }, data: { label: 'B' } },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'arrow' },
            ];

            const result = xyflowToIR(nodes, edges);

            expect(result.diagram.edges[0].arrow?.sourceType).toBe('none');
            expect(result.diagram.edges[0].arrow?.targetType).toBe('arrow');
            expect(result.diagram.edges[0].arrow?.lineType).toBe('solid');
        });
    });

    describe('style preservation', () => {
        it('should preserve node fill color', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'A',
                        style: { fill: '#ff0000' },
                    },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].style?.fill).toBe('#ff0000');
        });

        it('should preserve node stroke color', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'A',
                        style: { stroke: '#0000ff' },
                    },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].style?.stroke).toBe('#0000ff');
        });

        it('should preserve node size', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'A',
                        width: 200,
                        height: 100,
                    },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].size?.width).toBe(200);
            expect(result.diagram.nodes[0].size?.height).toBe(100);
        });

        it('should preserve text style', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'rectangle',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'A',
                        textStyle: {
                            fontSize: 16,
                            color: '#333333',
                        },
                    },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].style?.fontSize).toBe(16);
            expect(result.diagram.nodes[0].style?.fontColor).toBe('#333333');
        });
    });

    describe('metadata', () => {
        it('should include metadata by default', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'sticky',
                    position: { x: 0, y: 0 },
                    data: { label: 'A', stickyColor: 'yellow' },
                },
            ];

            const result = xyflowToIR(nodes, []);

            expect(result.diagram.nodes[0].metadata?.xyflowType).toBe('sticky');
            expect(result.diagram.nodes[0].metadata?.stickyColor).toBe('yellow');
        });

        it('should exclude metadata when includeMetadata is false', () => {
            const nodes: DiagramNode[] = [
                {
                    id: 'A',
                    type: 'sticky',
                    position: { x: 0, y: 0 },
                    data: { label: 'A', stickyColor: 'yellow' },
                },
            ];

            const result = xyflowToIR(nodes, [], { includeMetadata: false });

            expect(result.diagram.nodes[0].metadata).toBeUndefined();
        });

        it('should set diagram source metadata', () => {
            const result = xyflowToIR([], []);

            expect(result.diagram.metadata?.source).toBe('xyflow');
            expect(result.diagram.metadata?.sourceVersion).toBe('12.x');
        });
    });

    describe('diagram type', () => {
        it('should default to flowchart type', () => {
            const result = xyflowToIR([], []);

            expect(result.diagram.type).toBe('flowchart');
        });

        it('should respect custom diagram type', () => {
            const result = xyflowToIR([], [], { diagramType: 'sequence' });

            expect(result.diagram.type).toBe('sequence');
        });
    });

    describe('round-trip compatibility', () => {
        it('should produce valid IR that can be converted back', () => {
            const nodes: DiagramNode[] = [
                { id: 'A', type: 'rectangle', position: { x: 100, y: 100 }, data: { label: 'Start' } },
                { id: 'B', type: 'diamond', position: { x: 300, y: 100 }, data: { label: 'Decision' } },
                { id: 'C', type: 'ellipse', position: { x: 500, y: 100 }, data: { label: 'End' } },
            ];

            const edges: DiagramEdge[] = [
                { id: 'e1', source: 'A', target: 'B', type: 'arrow' },
                { id: 'e2', source: 'B', target: 'C', type: 'arrow', data: { label: 'Yes' } },
            ];

            const result = xyflowToIR(nodes, edges);

            // Verify structure is valid
            expect(result.diagram.id).toBeDefined();
            expect(result.diagram.type).toBeDefined();
            expect(result.diagram.nodes).toBeInstanceOf(Array);
            expect(result.diagram.edges).toBeInstanceOf(Array);
            expect(result.diagram.groups).toBeInstanceOf(Array);

            // Verify all nodes have required fields
            result.diagram.nodes.forEach(node => {
                expect(node.id).toBeDefined();
                expect(node.type).toBe('node');
                expect(node.label).toBeDefined();
                expect(node.shape).toBeDefined();
            });

            // Verify all edges have required fields
            result.diagram.edges.forEach(edge => {
                expect(edge.id).toBeDefined();
                expect(edge.type).toBe('edge');
                expect(edge.source).toBeDefined();
                expect(edge.target).toBeDefined();
            });
        });
    });
});
