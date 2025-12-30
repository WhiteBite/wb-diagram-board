/**
 * Auto Layout Tests
 */

import { describe, it, expect } from 'vitest';
import { applyDagreLayout, getDirectionLabel, LAYOUT_DIRECTIONS } from './auto-layout';
import type { DiagramNode, DiagramEdge } from '../xyflow/types';

// =============================================================================
// Test Fixtures
// =============================================================================

const createNode = (id: string, x = 0, y = 0): DiagramNode => ({
    id,
    type: 'rectangle',
    position: { x, y },
    data: { label: id },
});

const createEdge = (source: string, target: string): DiagramEdge => ({
    id: `${source}-${target}`,
    source,
    target,
    type: 'arrow',
});

// =============================================================================
// Tests
// =============================================================================

describe('applyDagreLayout', () => {
    it('should return empty arrays for empty input', () => {
        const result = applyDagreLayout([], []);
        expect(result.nodes).toEqual([]);
        expect(result.edges).toEqual([]);
    });

    it('should return unchanged nodes for single node', () => {
        const nodes = [createNode('A', 100, 100)];
        const result = applyDagreLayout(nodes, []);

        expect(result.nodes).toHaveLength(1);
        expect(result.nodes[0].id).toBe('A');
    });

    it('should layout two connected nodes vertically (TB)', () => {
        const nodes = [createNode('A'), createNode('B')];
        const edges = [createEdge('A', 'B')];

        const result = applyDagreLayout(nodes, edges, { direction: 'TB' });

        expect(result.nodes).toHaveLength(2);

        const nodeA = result.nodes.find(n => n.id === 'A')!;
        const nodeB = result.nodes.find(n => n.id === 'B')!;

        // In TB layout, A should be above B (smaller y)
        expect(nodeA.position.y).toBeLessThan(nodeB.position.y);
    });

    it('should layout two connected nodes horizontally (LR)', () => {
        const nodes = [createNode('A'), createNode('B')];
        const edges = [createEdge('A', 'B')];

        const result = applyDagreLayout(nodes, edges, { direction: 'LR' });

        expect(result.nodes).toHaveLength(2);

        const nodeA = result.nodes.find(n => n.id === 'A')!;
        const nodeB = result.nodes.find(n => n.id === 'B')!;

        // In LR layout, A should be to the left of B (smaller x)
        expect(nodeA.position.x).toBeLessThan(nodeB.position.x);
    });

    it('should layout nodes bottom to top (BT)', () => {
        const nodes = [createNode('A'), createNode('B')];
        const edges = [createEdge('A', 'B')];

        const result = applyDagreLayout(nodes, edges, { direction: 'BT' });

        const nodeA = result.nodes.find(n => n.id === 'A')!;
        const nodeB = result.nodes.find(n => n.id === 'B')!;

        // In BT layout, A should be below B (larger y)
        expect(nodeA.position.y).toBeGreaterThan(nodeB.position.y);
    });

    it('should layout nodes right to left (RL)', () => {
        const nodes = [createNode('A'), createNode('B')];
        const edges = [createEdge('A', 'B')];

        const result = applyDagreLayout(nodes, edges, { direction: 'RL' });

        const nodeA = result.nodes.find(n => n.id === 'A')!;
        const nodeB = result.nodes.find(n => n.id === 'B')!;

        // In RL layout, A should be to the right of B (larger x)
        expect(nodeA.position.x).toBeGreaterThan(nodeB.position.x);
    });

    it('should skip group nodes in layout', () => {
        const nodes: DiagramNode[] = [
            createNode('A'),
            createNode('B'),
            { ...createNode('group1'), type: 'group' },
        ];
        const edges = [createEdge('A', 'B')];

        const result = applyDagreLayout(nodes, edges);

        expect(result.nodes).toHaveLength(3);

        // Group node should keep its original position
        const groupNode = result.nodes.find(n => n.id === 'group1')!;
        expect(groupNode.position.x).toBe(0);
        expect(groupNode.position.y).toBe(0);
    });

    it('should preserve edges unchanged', () => {
        const nodes = [createNode('A'), createNode('B')];
        const edges = [createEdge('A', 'B')];

        const result = applyDagreLayout(nodes, edges);

        expect(result.edges).toEqual(edges);
    });

    it('should handle complex graph with multiple edges', () => {
        const nodes = [
            createNode('A'),
            createNode('B'),
            createNode('C'),
            createNode('D'),
        ];
        const edges = [
            createEdge('A', 'B'),
            createEdge('A', 'C'),
            createEdge('B', 'D'),
            createEdge('C', 'D'),
        ];

        const result = applyDagreLayout(nodes, edges, { direction: 'TB' });

        expect(result.nodes).toHaveLength(4);

        // All nodes should have valid positions
        result.nodes.forEach(node => {
            expect(typeof node.position.x).toBe('number');
            expect(typeof node.position.y).toBe('number');
            expect(Number.isFinite(node.position.x)).toBe(true);
            expect(Number.isFinite(node.position.y)).toBe(true);
        });
    });

    it('should respect custom spacing options', () => {
        const nodes = [createNode('A'), createNode('B')];
        const edges = [createEdge('A', 'B')];

        const resultSmall = applyDagreLayout(nodes, edges, {
            direction: 'TB',
            rankSpacing: 50,
        });

        const resultLarge = applyDagreLayout(nodes, edges, {
            direction: 'TB',
            rankSpacing: 200,
        });

        const smallGap = Math.abs(
            resultSmall.nodes[0].position.y - resultSmall.nodes[1].position.y
        );
        const largeGap = Math.abs(
            resultLarge.nodes[0].position.y - resultLarge.nodes[1].position.y
        );

        expect(largeGap).toBeGreaterThan(smallGap);
    });
});

describe('getDirectionLabel', () => {
    it('should return correct labels for all directions', () => {
        expect(getDirectionLabel('TB')).toBe('Top to Bottom');
        expect(getDirectionLabel('BT')).toBe('Bottom to Top');
        expect(getDirectionLabel('LR')).toBe('Left to Right');
        expect(getDirectionLabel('RL')).toBe('Right to Left');
    });
});

describe('LAYOUT_DIRECTIONS', () => {
    it('should contain all four directions', () => {
        expect(LAYOUT_DIRECTIONS).toContain('TB');
        expect(LAYOUT_DIRECTIONS).toContain('BT');
        expect(LAYOUT_DIRECTIONS).toContain('LR');
        expect(LAYOUT_DIRECTIONS).toContain('RL');
        expect(LAYOUT_DIRECTIONS).toHaveLength(4);
    });
});
