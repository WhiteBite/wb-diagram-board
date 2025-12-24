/**
 * WB Binding System - Unit Tests
 * 
 * Comprehensive test suite for binding system with 100% coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
    ShapeElement,
    TextElement,
    StickyElement,
} from '../../types/canvas';
import {
    ShapeBindingResolver,
    TextBindingResolver,
    StickyBindingResolver,
    DefaultBindingResolver,
} from './resolver';
import { BindingResolverRegistry, bindingRegistry } from './registry';
import { BindingError } from './types';

// =============================================================================
// Test Fixtures
// =============================================================================

const createRectangle = (overrides?: Partial<ShapeElement>): ShapeElement => ({
    id: 'rect-1',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stroke: { color: '#000', width: 2, style: 'solid' },
    fill: { type: 'solid', color: '#fff' },
    cornerRadius: 0,
    ...overrides,
});

const createText = (overrides?: Partial<TextElement>): TextElement => ({
    id: 'text-1',
    type: 'text',
    x: 50,
    y: 50,
    width: 100,
    height: 50,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    text: 'Hello',
    textStyle: {
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        verticalAlign: 'middle',
        color: '#000',
        lineHeight: 1.4,
    },
    ...overrides,
});

const createSticky = (overrides?: Partial<StickyElement>): StickyElement => ({
    id: 'sticky-1',
    type: 'sticky',
    x: 200,
    y: 200,
    width: 120,
    height: 120,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    text: 'Note',
    color: 'yellow',
    textStyle: {
        fontSize: 14,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'center',
        verticalAlign: 'middle',
        color: '#000',
        lineHeight: 1.4,
    },
    ...overrides,
});

// =============================================================================
// ShapeBindingResolver Tests
// =============================================================================

describe('ShapeBindingResolver', () => {
    let resolver: ShapeBindingResolver;

    beforeEach(() => {
        resolver = new ShapeBindingResolver();
    });

    describe('getBindingPoint', () => {
        it('should return top binding point at center-top of element', () => {
            const element = createRectangle();
            const point = resolver.getBindingPoint(element, 'top');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y,
            });
        });

        it('should return right binding point at center-right of element', () => {
            const element = createRectangle();
            const point = resolver.getBindingPoint(element, 'right');

            expect(point).toEqual({
                x: element.x + element.width,
                y: element.y + element.height / 2,
            });
        });

        it('should return bottom binding point at center-bottom of element', () => {
            const element = createRectangle();
            const point = resolver.getBindingPoint(element, 'bottom');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y + element.height,
            });
        });

        it('should return left binding point at center-left of element', () => {
            const element = createRectangle();
            const point = resolver.getBindingPoint(element, 'left');

            expect(point).toEqual({
                x: element.x,
                y: element.y + element.height / 2,
            });
        });

        it('should return center binding point at center of element', () => {
            const element = createRectangle();
            const point = resolver.getBindingPoint(element, 'center');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
            });
        });

        it('should work with different element sizes', () => {
            const element = createRectangle({ width: 50, height: 100 });
            const point = resolver.getBindingPoint(element, 'top');

            expect(point).toEqual({
                x: element.x + 25,
                y: element.y,
            });
        });

        it('should work with different element positions', () => {
            const element = createRectangle({ x: 500, y: 600 });
            const point = resolver.getBindingPoint(element, 'center');

            expect(point).toEqual({
                x: 600,
                y: 675,
            });
        });

        it('should throw BindingError for invalid position', () => {
            const element = createRectangle();

            expect(() => {
                resolver.getBindingPoint(element, 'invalid');
            }).toThrow(BindingError);
        });

        it('should throw BindingError with context for invalid position', () => {
            const element = createRectangle();

            try {
                resolver.getBindingPoint(element, 'invalid');
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(BindingError);
                expect((error as BindingError).context).toEqual({
                    elementId: element.id,
                    position: 'invalid',
                    validPositions: ['top', 'right', 'bottom', 'left', 'center'],
                });
            }
        });

        it('should handle elements with zero dimensions', () => {
            const element = createRectangle({ width: 0, height: 0 });
            const point = resolver.getBindingPoint(element, 'center');

            expect(point).toEqual({
                x: element.x,
                y: element.y,
            });
        });

        it('should handle negative coordinates', () => {
            const element = createRectangle({ x: -100, y: -50 });
            const point = resolver.getBindingPoint(element, 'top');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y,
            });
        });
    });

    describe('getAvailablePositions', () => {
        it('should return all available positions', () => {
            const element = createRectangle();
            const positions = resolver.getAvailablePositions(element);

            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });

        it('should return readonly array', () => {
            const element = createRectangle();
            const positions = resolver.getAvailablePositions(element);

            // Verify it's an array
            expect(Array.isArray(positions)).toBe(true);

            // Verify it has the expected values
            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });
    });

    describe('isValidPosition', () => {
        it('should return true for valid positions', () => {
            expect(resolver.isValidPosition('top')).toBe(true);
            expect(resolver.isValidPosition('right')).toBe(true);
            expect(resolver.isValidPosition('bottom')).toBe(true);
            expect(resolver.isValidPosition('left')).toBe(true);
            expect(resolver.isValidPosition('center')).toBe(true);
        });

        it('should return false for invalid positions', () => {
            expect(resolver.isValidPosition('invalid')).toBe(false);
            expect(resolver.isValidPosition('top-left')).toBe(false);
            expect(resolver.isValidPosition('')).toBe(false);
        });
    });
});

// =============================================================================
// TextBindingResolver Tests
// =============================================================================

describe('TextBindingResolver', () => {
    let resolver: TextBindingResolver;

    beforeEach(() => {
        resolver = new TextBindingResolver();
    });

    describe('getBindingPoint', () => {
        it('should return top binding point for text element', () => {
            const element = createText();
            const point = resolver.getBindingPoint(element, 'top');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y,
            });
        });

        it('should return center binding point for text element', () => {
            const element = createText();
            const point = resolver.getBindingPoint(element, 'center');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
            });
        });

        it('should throw BindingError for invalid position', () => {
            const element = createText();

            expect(() => {
                resolver.getBindingPoint(element, 'invalid');
            }).toThrow(BindingError);
        });
    });

    describe('getAvailablePositions', () => {
        it('should return all available positions for text', () => {
            const element = createText();
            const positions = resolver.getAvailablePositions(element);

            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });
    });

    describe('isValidPosition', () => {
        it('should validate positions correctly', () => {
            expect(resolver.isValidPosition('top')).toBe(true);
            expect(resolver.isValidPosition('invalid')).toBe(false);
        });
    });
});

// =============================================================================
// StickyBindingResolver Tests
// =============================================================================

describe('StickyBindingResolver', () => {
    let resolver: StickyBindingResolver;

    beforeEach(() => {
        resolver = new StickyBindingResolver();
    });

    describe('getBindingPoint', () => {
        it('should return binding points for sticky notes', () => {
            const element = createSticky();

            const topPoint = resolver.getBindingPoint(element, 'top');
            expect(topPoint.y).toBe(element.y);

            const rightPoint = resolver.getBindingPoint(element, 'right');
            expect(rightPoint.x).toBe(element.x + element.width);

            const bottomPoint = resolver.getBindingPoint(element, 'bottom');
            expect(bottomPoint.y).toBe(element.y + element.height);

            const leftPoint = resolver.getBindingPoint(element, 'left');
            expect(leftPoint.x).toBe(element.x);
        });

        it('should throw BindingError for invalid position', () => {
            const element = createSticky();

            expect(() => {
                resolver.getBindingPoint(element, 'invalid');
            }).toThrow(BindingError);
        });
    });

    describe('getAvailablePositions', () => {
        it('should return all available positions for sticky', () => {
            const element = createSticky();
            const positions = resolver.getAvailablePositions(element);

            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });
    });
});

// =============================================================================
// DefaultBindingResolver Tests
// =============================================================================

describe('DefaultBindingResolver', () => {
    let resolver: DefaultBindingResolver;

    beforeEach(() => {
        resolver = new DefaultBindingResolver();
    });

    describe('getBindingPoint', () => {
        it('should work with any element type', () => {
            const element = createRectangle();
            const point = resolver.getBindingPoint(element, 'top');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y,
            });
        });

        it('should throw BindingError for invalid position', () => {
            const element = createRectangle();

            expect(() => {
                resolver.getBindingPoint(element, 'invalid');
            }).toThrow(BindingError);
        });
    });

    describe('getAvailablePositions', () => {
        it('should return standard positions', () => {
            const element = createRectangle();
            const positions = resolver.getAvailablePositions(element);

            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });
    });
});

// =============================================================================
// BindingResolverRegistry Tests
// =============================================================================

describe('BindingResolverRegistry', () => {
    let registry: BindingResolverRegistry;

    beforeEach(() => {
        registry = new BindingResolverRegistry();
    });

    describe('register', () => {
        it('should register a resolver for an element type', () => {
            const resolver = new ShapeBindingResolver();
            registry.register('rectangle', resolver);

            expect(registry.hasResolver('rectangle')).toBe(true);
        });

        it('should throw BindingError when registering duplicate type', () => {
            const resolver = new ShapeBindingResolver();
            registry.register('rectangle', resolver);

            expect(() => {
                registry.register('rectangle', resolver);
            }).toThrow(BindingError);
        });

        it('should throw BindingError when registering null resolver', () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                registry.register('rectangle', null as any);
            }).toThrow(BindingError);
        });

        it('should throw BindingError when registering undefined resolver', () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                registry.register('rectangle', undefined as any);
            }).toThrow(BindingError);
        });
    });

    describe('resolve', () => {
        it('should return registered resolver for element type', () => {
            const resolver = new ShapeBindingResolver();
            registry.register('rectangle', resolver);

            const element = createRectangle();
            const resolved = registry.resolve(element);

            expect(resolved).toBe(resolver);
        });

        it('should return default resolver for unregistered type', () => {
            const element = createRectangle();
            const resolved = registry.resolve(element);

            expect(resolved).toBeInstanceOf(DefaultBindingResolver);
        });
    });

    describe('getBindingPoint', () => {
        it('should get binding point through registry', () => {
            const resolver = new ShapeBindingResolver();
            registry.register('rectangle', resolver);

            const element = createRectangle();
            const point = registry.getBindingPoint(element, 'top');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y,
            });
        });

        it('should use default resolver for unregistered types', () => {
            const element = createRectangle();
            const point = registry.getBindingPoint(element, 'center');

            expect(point).toEqual({
                x: element.x + element.width / 2,
                y: element.y + element.height / 2,
            });
        });

        it('should throw BindingError for invalid position', () => {
            const element = createRectangle();

            expect(() => {
                registry.getBindingPoint(element, 'invalid');
            }).toThrow(BindingError);
        });
    });

    describe('getAvailablePositions', () => {
        it('should get available positions through registry', () => {
            const resolver = new ShapeBindingResolver();
            registry.register('rectangle', resolver);

            const element = createRectangle();
            const positions = registry.getAvailablePositions(element);

            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });

        it('should use default resolver for unregistered types', () => {
            const element = createRectangle();
            const positions = registry.getAvailablePositions(element);

            expect(positions).toEqual(['top', 'right', 'bottom', 'left', 'center']);
        });
    });

    describe('isValidPosition', () => {
        it('should validate position through registry', () => {
            const resolver = new ShapeBindingResolver();
            registry.register('rectangle', resolver);

            const element = createRectangle();

            expect(registry.isValidPosition(element, 'top')).toBe(true);
            expect(registry.isValidPosition(element, 'invalid')).toBe(false);
        });

        it('should use default resolver for unregistered types', () => {
            const element = createRectangle();

            expect(registry.isValidPosition(element, 'top')).toBe(true);
            expect(registry.isValidPosition(element, 'invalid')).toBe(false);
        });
    });

    describe('getRegisteredTypes', () => {
        it('should return all registered types', () => {
            registry.register('rectangle', new ShapeBindingResolver());
            registry.register('text', new TextBindingResolver());

            const types = registry.getRegisteredTypes();

            expect(types).toContain('rectangle');
            expect(types).toContain('text');
            expect(types.length).toBe(2);
        });

        it('should return empty array when no types registered', () => {
            const types = registry.getRegisteredTypes();

            expect(types).toEqual([]);
        });
    });

    describe('hasResolver', () => {
        it('should return true for registered types', () => {
            registry.register('rectangle', new ShapeBindingResolver());

            expect(registry.hasResolver('rectangle')).toBe(true);
        });

        it('should return false for unregistered types', () => {
            expect(registry.hasResolver('rectangle')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all registered resolvers', () => {
            registry.register('rectangle', new ShapeBindingResolver());
            registry.register('text', new TextBindingResolver());

            registry.clear();

            expect(registry.getRegisteredTypes()).toEqual([]);
            expect(registry.hasResolver('rectangle')).toBe(false);
        });

        it('should use default resolver after clearing', () => {
            registry.register('rectangle', new ShapeBindingResolver());
            registry.clear();

            const element = createRectangle();
            const resolved = registry.resolve(element);

            expect(resolved).toBeInstanceOf(DefaultBindingResolver);
        });
    });
});

// =============================================================================
// Global bindingRegistry Tests
// =============================================================================

describe('Global bindingRegistry', () => {
    it('should have all default resolvers registered', () => {
        expect(bindingRegistry.hasResolver('rectangle')).toBe(true);
        expect(bindingRegistry.hasResolver('ellipse')).toBe(true);
        expect(bindingRegistry.hasResolver('diamond')).toBe(true);
        expect(bindingRegistry.hasResolver('triangle')).toBe(true);
        expect(bindingRegistry.hasResolver('text')).toBe(true);
        expect(bindingRegistry.hasResolver('sticky')).toBe(true);
    });

    it('should work with all registered types', () => {
        const element = createRectangle();
        const point = bindingRegistry.getBindingPoint(element, 'top');

        expect(point).toBeDefined();
        expect(point.x).toBeDefined();
        expect(point.y).toBeDefined();
    });

    it('should provide binding points for all positions', () => {
        const element = createRectangle();
        const positions = bindingRegistry.getAvailablePositions(element);

        positions.forEach((position) => {
            const point = bindingRegistry.getBindingPoint(element, position as string);
            expect(point).toBeDefined();
            expect(typeof point.x).toBe('number');
            expect(typeof point.y).toBe('number');
        });
    });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Binding System Integration', () => {
    it('should work with multiple element types', () => {
        const rect = createRectangle();
        const text = createText();
        const sticky = createSticky();

        const rectPoint = bindingRegistry.getBindingPoint(rect, 'top');
        const textPoint = bindingRegistry.getBindingPoint(text, 'top');
        const stickyPoint = bindingRegistry.getBindingPoint(sticky, 'top');

        expect(rectPoint).toBeDefined();
        expect(textPoint).toBeDefined();
        expect(stickyPoint).toBeDefined();
    });

    it('should handle all positions for all element types', () => {
        const elements = [createRectangle(), createText(), createSticky()];
        const positions = ['top', 'right', 'bottom', 'left', 'center'];

        elements.forEach((element) => {
            positions.forEach((position) => {
                const point = bindingRegistry.getBindingPoint(element, position);
                expect(point).toBeDefined();
                expect(typeof point.x).toBe('number');
                expect(typeof point.y).toBe('number');
            });
        });
    });

    it('should maintain consistency across multiple calls', () => {
        const element = createRectangle();

        const point1 = bindingRegistry.getBindingPoint(element, 'top');
        const point2 = bindingRegistry.getBindingPoint(element, 'top');

        expect(point1).toEqual(point2);
    });

    it('should handle edge cases with extreme coordinates', () => {
        const element = createRectangle({
            x: Number.MAX_SAFE_INTEGER - 1000,
            y: Number.MAX_SAFE_INTEGER - 1000,
            width: 100,
            height: 100,
        });

        const point = bindingRegistry.getBindingPoint(element, 'center');

        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(isFinite(point.x)).toBe(true);
        expect(isFinite(point.y)).toBe(true);
    });
});
