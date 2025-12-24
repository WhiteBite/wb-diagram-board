/**
 * WB Layers - Layers Panel Tests
 * 
 * Unit tests for the LayersPanel component and related functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { layerManager } from '../../core/layers/layer-manager';
import type { CanvasElement, FrameElement } from '../../types/canvas';
import { createBaseElement, createId } from '../../types/canvas';

// =============================================================================
// Test Data
// =============================================================================

/**
 * Create a test rectangle element
 */
function createTestRectangle(id: string = createId(), x = 0, y = 0): CanvasElement {
    const base = createBaseElement('rectangle', x, y);
    return {
        ...base,
        id,
        type: 'rectangle',
        width: 100,
        height: 100,
        stroke: { color: '#000', width: 2, style: 'solid' as const },
        fill: { type: 'solid' as const, color: '#fff' },
        cornerRadius: 0,
    };
}

/**
 * Create a test frame element
 */
function createTestFrame(id: string = createId(), childIds: string[] = []): CanvasElement {
    const base = createBaseElement('frame', 0, 0);
    return {
        ...base,
        id,
        type: 'frame',
        width: 200,
        height: 200,
        name: 'Frame',
        stroke: { color: '#000', width: 1, style: 'solid' as const },
        fill: { type: 'none' as const, color: '#fff' },
        childIds,
        clip: false,
    };
}

/**
 * Create a test text element
 */
function createTestText(id: string = createId(), text = 'Text'): CanvasElement {
    const base = createBaseElement('text', 0, 0);
    return {
        ...base,
        id,
        type: 'text',
        width: 100,
        height: 50,
        text,
        textStyle: {
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal' as const,
            fontStyle: 'normal' as const,
            textAlign: 'left' as const,
            verticalAlign: 'top' as const,
            color: '#000',
            lineHeight: 1.4,
        },
    };
}

// =============================================================================
// Layer Manager Tests
// =============================================================================

describe('LayerManager', () => {
    let manager: typeof layerManager;

    beforeEach(() => {
        manager = layerManager;
    });

    describe('getLayers', () => {
        it('should return empty array for empty elements', () => {
            const layers = manager.getLayers({}, []);
            expect(layers).toEqual([]);
        });

        it('should return layers in reverse z-order (top to bottom)', () => {
            const rect1 = createTestRectangle('rect-1');
            const rect2 = createTestRectangle('rect-2');
            const rect3 = createTestRectangle('rect-3');

            const elements = {
                'rect-1': rect1,
                'rect-2': rect2,
                'rect-3': rect3,
            };

            const elementOrder = ['rect-1', 'rect-2', 'rect-3'];
            const layers = manager.getLayers(elements, elementOrder);

            expect(layers).toHaveLength(3);
            expect(layers[0].id).toBe('rect-3'); // Top element first
            expect(layers[1].id).toBe('rect-2');
            expect(layers[2].id).toBe('rect-1'); // Bottom element last
        });

        it('should throw error for invalid arguments', () => {
            expect(() => {
                manager.getLayers(null as any, []);
            }).toThrow();
        });

        it('should filter out missing elements', () => {
            const rect1 = createTestRectangle('rect-1');
            const elements = { 'rect-1': rect1 };
            const elementOrder = ['rect-1', 'rect-2', 'rect-3']; // rect-2 and rect-3 don't exist

            const layers = manager.getLayers(elements, elementOrder);
            expect(layers).toHaveLength(1);
            expect(layers[0].id).toBe('rect-1');
        });
    });

    describe('getLayer', () => {
        it('should return layer for existing element', () => {
            const rect = createTestRectangle('rect-1');
            const elements = { 'rect-1': rect };

            const layer = manager.getLayer('rect-1', elements);
            expect(layer.id).toBe('rect-1');
            expect(layer.type).toBe('rectangle');
        });

        it('should throw error for non-existent element', () => {
            expect(() => {
                manager.getLayer('non-existent', {});
            }).toThrow('Element with ID');
        });

        it('should set visible based on opacity', () => {
            const rect = createTestRectangle('rect-1');
            rect.opacity = 0;
            const elements = { 'rect-1': rect };

            const layer = manager.getLayer('rect-1', elements);
            expect(layer.visible).toBe(false);
        });

        it('should set locked based on element locked state', () => {
            const rect = createTestRectangle('rect-1');
            rect.locked = true;
            const elements = { 'rect-1': rect };

            const layer = manager.getLayer('rect-1', elements);
            expect(layer.locked).toBe(true);
        });
    });

    describe('getChildLayers', () => {
        it('should return child layers for frame', () => {
            const child1 = createTestRectangle('child-1');
            const child2 = createTestRectangle('child-2');
            const frame = createTestFrame('frame-1', ['child-1', 'child-2']);

            const elements = {
                'frame-1': frame,
                'child-1': child1,
                'child-2': child2,
            };

            const children = manager.getChildLayers('frame-1', elements);
            expect(children).toHaveLength(2);
            expect(children[0].id).toBe('child-1');
            expect(children[1].id).toBe('child-2');
        });

        it('should throw error for non-frame element', () => {
            const rect = createTestRectangle('rect-1');
            const elements = { 'rect-1': rect };

            expect(() => {
                manager.getChildLayers('rect-1', elements);
            }).toThrow('not a frame');
        });

        it('should throw error for non-existent parent', () => {
            expect(() => {
                manager.getChildLayers('non-existent', {});
            }).toThrow('not found');
        });

        it('should filter out missing children', () => {
            const child1 = createTestRectangle('child-1');
            const frame = createTestFrame('frame-1', ['child-1', 'child-2']);

            const elements = {
                'frame-1': frame,
                'child-1': child1,
            };

            const children = manager.getChildLayers('frame-1', elements);
            expect(children).toHaveLength(1);
            expect(children[0].id).toBe('child-1');
        });
    });

    describe('getLayerHierarchy', () => {
        it('should return hierarchical structure', () => {
            const rect1 = createTestRectangle('rect-1');
            const rect2 = createTestRectangle('rect-2');
            const frame = createTestFrame('frame-1', ['rect-2']);

            const elements = {
                'rect-1': rect1,
                'frame-1': frame,
                'rect-2': rect2,
            };

            const elementOrder = ['rect-1', 'frame-1', 'rect-2'];
            const hierarchy = manager.getLayerHierarchy(elements, elementOrder);

            expect(hierarchy).toHaveLength(3);
            expect(hierarchy[0].layer.id).toBe('rect-2');
            expect(hierarchy[1].layer.id).toBe('frame-1');
            expect(hierarchy[2].layer.id).toBe('rect-1');
        });
    });

    describe('renameLayer', () => {
        it('should rename frame', () => {
            const frame = createTestFrame('frame-1');
            const elements = { 'frame-1': frame };

            const updated = manager.renameLayer('frame-1', 'New Frame', elements);
            expect(updated.name).toBe('New Frame');
        });

        it('should rename text element', () => {
            const text = createTestText('text-1', 'Old Text');
            const elements = { 'text-1': text };

            const updated = manager.renameLayer('text-1', 'New Text', elements);
            expect(updated.name).toBe('New Text');
        });

        it('should throw error for empty name', () => {
            const rect = createTestRectangle('rect-1');
            const elements = { 'rect-1': rect };

            expect(() => {
                manager.renameLayer('rect-1', '', elements);
            }).toThrow('cannot be empty');
        });

        it('should throw error for non-existent element', () => {
            expect(() => {
                manager.renameLayer('non-existent', 'New Name', {});
            }).toThrow('not found');
        });

        it('should trim whitespace from name', () => {
            const rect = createTestRectangle('rect-1');
            const elements = { 'rect-1': rect };

            const updated = manager.renameLayer('rect-1', '  Trimmed  ', elements);
            expect(updated.name).toBe('Trimmed');
        });
    });

    describe('reorderLayers', () => {
        it('should reorder elements', () => {
            const elementOrder = ['rect-1', 'rect-2', 'rect-3'];
            const newOrder = manager.reorderLayers(['rect-1'], 2, elementOrder);

            expect(newOrder).toEqual(['rect-2', 'rect-3', 'rect-1']);
        });

        it('should handle multiple elements', () => {
            const elementOrder = ['rect-1', 'rect-2', 'rect-3', 'rect-4'];
            const newOrder = manager.reorderLayers(['rect-1', 'rect-2'], 2, elementOrder);

            expect(newOrder).toEqual(['rect-3', 'rect-4', 'rect-1', 'rect-2']);
        });

        it('should throw error for invalid element IDs', () => {
            expect(() => {
                manager.reorderLayers([], 0, ['rect-1']);
            }).toThrow('non-empty array');
        });

        it('should throw error for out of bounds index', () => {
            expect(() => {
                manager.reorderLayers(['rect-1'], 10, ['rect-1']);
            }).toThrow('out of bounds');
        });
    });

    describe('getElementName', () => {
        it('should return frame name', () => {
            const frame = createTestFrame('frame-1');
            (frame as FrameElement).name = 'My Frame';

            const name = manager.getElementName(frame);
            expect(name).toBe('My Frame');
        });

        it('should return text content for text element', () => {
            const text = createTestText('text-1', 'Hello World');

            const name = manager.getElementName(text);
            expect(name).toBe('Hello World');
        });

        it('should truncate long text', () => {
            const text = createTestText('text-1', 'A'.repeat(50));

            const name = manager.getElementName(text);
            expect(name.length).toBeLessThanOrEqual(30);
        });

        it('should return type-based name for unnamed elements', () => {
            const rect = createTestRectangle('rect-1');

            const name = manager.getElementName(rect);
            expect(name).toContain('Rectangle');
        });

        it('should return custom name if set', () => {
            const rect = createTestRectangle('rect-1');
            (rect as any).customName = 'Custom Name';

            const name = manager.getElementName(rect);
            expect(name).toBe('Custom Name');
        });
    });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('LayerManager Integration', () => {
    it('should handle complex hierarchy', () => {
        const manager = layerManager;

        const rect1 = createTestRectangle('rect-1');
        const rect2 = createTestRectangle('rect-2');
        const rect3 = createTestRectangle('rect-3');
        const frame1 = createTestFrame('frame-1', ['rect-2']);
        const frame2 = createTestFrame('frame-2', ['rect-3']);

        const elements = {
            'rect-1': rect1,
            'frame-1': frame1,
            'rect-2': rect2,
            'frame-2': frame2,
            'rect-3': rect3,
        };

        const elementOrder = ['rect-1', 'frame-1', 'rect-2', 'frame-2', 'rect-3'];

        // Get all layers
        const layers = manager.getLayers(elements, elementOrder);
        expect(layers).toHaveLength(5);

        // Get frame children
        const frame1Children = manager.getChildLayers('frame-1', elements);
        expect(frame1Children).toHaveLength(1);
        expect(frame1Children[0].id).toBe('rect-2');

        // Get hierarchy
        const hierarchy = manager.getLayerHierarchy(elements, elementOrder);
        expect(hierarchy).toHaveLength(5);
    });

    it('should handle visibility and locked state', () => {
        const manager = layerManager;

        const rect = createTestRectangle('rect-1');
        rect.opacity = 0;
        rect.locked = true;

        const elements = { 'rect-1': rect };

        const layer = manager.getLayer('rect-1', elements);
        expect(layer.visible).toBe(false);
        expect(layer.locked).toBe(true);
    });
});
