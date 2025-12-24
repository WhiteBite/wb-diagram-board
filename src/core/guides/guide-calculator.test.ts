/**
 * WB Guides - Guide Calculator Tests
 * 
 * Unit tests for guide calculation and snap point detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GuideCalculator, guideCalculator } from './guide-calculator';
import { CanvasElement, createBaseElement, DEFAULT_STROKE, DEFAULT_FILL } from '../../types/canvas';
import { GuidesConfig, DEFAULT_GUIDES_CONFIG } from '../../types/guides';

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Create a test rectangle element
 */
function createTestRectangle(
    id: string,
    x: number,
    y: number,
    width: number = 100,
    height: number = 100
): CanvasElement {
    return {
        ...createBaseElement('rectangle', x, y),
        id,
        width,
        height,
        stroke: DEFAULT_STROKE,
        fill: DEFAULT_FILL,
        cornerRadius: 0,
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('GuideCalculator', () => {
    let calculator: GuideCalculator;
    let config: GuidesConfig;

    beforeEach(() => {
        calculator = new GuideCalculator();
        config = DEFAULT_GUIDES_CONFIG;
    });

    // =========================================================================
    // calculateGuides Tests
    // =========================================================================

    describe('calculateGuides', () => {
        it('should return empty array when guides are disabled', () => {
            const element = createTestRectangle('el1', 0, 0);
            const allElements = [element];
            const disabledConfig = { ...config, showGuides: false };

            const guides = calculator.calculateGuides(element, allElements, disabledConfig);

            expect(guides).toHaveLength(0);
        });

        it('should return empty array when no other elements exist', () => {
            const element = createTestRectangle('el1', 0, 0);
            const allElements = [element];

            const guides = calculator.calculateGuides(element, allElements, config);

            expect(guides).toHaveLength(0);
        });

        it('should detect vertical alignment (left edges)', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 100, 150);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides).toContainEqual(
                expect.objectContaining({
                    type: 'vertical',
                    position: 100,
                    isActive: true,
                })
            );
        });

        it('should detect vertical alignment (center)', () => {
            // Both elements have center at x=150
            const element1 = createTestRectangle('el1', 100, 0, 100, 100);
            const element2 = createTestRectangle('el2', 100, 150, 100, 100);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides).toContainEqual(
                expect.objectContaining({
                    type: 'vertical',
                    isActive: true,
                })
            );
        });

        it('should detect vertical alignment (right edges)', () => {
            // Both elements have right edge at x=200
            const element1 = createTestRectangle('el1', 100, 0, 100, 100);
            const element2 = createTestRectangle('el2', 150, 150, 50, 100);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides).toContainEqual(
                expect.objectContaining({
                    type: 'vertical',
                    isActive: true,
                })
            );
        });

        it('should detect horizontal alignment (top edges)', () => {
            const element1 = createTestRectangle('el1', 0, 100);
            const element2 = createTestRectangle('el2', 150, 100);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides).toContainEqual(
                expect.objectContaining({
                    type: 'horizontal',
                    position: 100,
                    isActive: true,
                })
            );
        });

        it('should detect horizontal alignment (middle)', () => {
            // Both elements have middle at y=150
            const element1 = createTestRectangle('el1', 0, 100, 100, 100);
            const element2 = createTestRectangle('el2', 150, 100, 100, 100);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides).toContainEqual(
                expect.objectContaining({
                    type: 'horizontal',
                    isActive: true,
                })
            );
        });

        it('should detect horizontal alignment (bottom edges)', () => {
            // Both elements have bottom edge at y=200
            const element1 = createTestRectangle('el1', 0, 100, 100, 100);
            const element2 = createTestRectangle('el2', 150, 150, 100, 50);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides).toContainEqual(
                expect.objectContaining({
                    type: 'horizontal',
                    isActive: true,
                })
            );
        });

        it('should respect snap threshold', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 115, 150); // 15px away
            const allElements = [element1, element2];
            const tightConfig = { ...config, snapThreshold: 10 };

            const guides = calculator.calculateGuides(element1, allElements, tightConfig);

            expect(guides).toHaveLength(0);
        });

        it('should include element IDs in guides', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 100, 150);
            const allElements = [element1, element2];

            const guides = calculator.calculateGuides(element1, allElements, config);

            expect(guides[0]?.elementIds).toContain('el2');
        });
    });

    // =========================================================================
    // findSnapPoints Tests
    // =========================================================================

    describe('findSnapPoints', () => {
        it('should return empty array when snapping is disabled', () => {
            const element = createTestRectangle('el1', 0, 0);
            const allElements = [element];
            const disabledConfig = {
                ...config,
                snapToGrid: false,
                snapToElements: false,
            };

            const snapPoints = calculator.findSnapPoints(element, allElements, disabledConfig);

            expect(snapPoints).toHaveLength(0);
        });

        it('should find grid snap points', () => {
            const element = createTestRectangle('el1', 15, 25);
            const allElements = [element];
            const gridConfig = { ...config, snapToGrid: true, snapToElements: false };

            const snapPoints = calculator.findSnapPoints(element, allElements, gridConfig);

            expect(snapPoints).toContainEqual(
                expect.objectContaining({
                    x: 20,
                    type: 'grid',
                })
            );

            expect(snapPoints).toContainEqual(
                expect.objectContaining({
                    y: 20,
                    type: 'grid',
                })
            );
        });

        it('should find element edge snap points', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 105, 150);
            const allElements = [element1, element2];
            const elementConfig = { ...config, snapToGrid: false, snapToElements: true };

            const snapPoints = calculator.findSnapPoints(element2, allElements, elementConfig);

            expect(snapPoints).toContainEqual(
                expect.objectContaining({
                    x: 100,
                    type: 'edge',
                })
            );
        });

        it('should find element center snap points', () => {
            // element1 center at x=150, element2 center at x=155
            const element1 = createTestRectangle('el1', 100, 0, 100, 100);
            const element2 = createTestRectangle('el2', 105, 150, 100, 100);
            const allElements = [element1, element2];
            const elementConfig = { ...config, snapToGrid: false, snapToElements: true };

            const snapPoints = calculator.findSnapPoints(element2, allElements, elementConfig);

            expect(snapPoints).toContainEqual(
                expect.objectContaining({
                    type: 'center',
                })
            );
        });

        it('should calculate correct distances', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 108, 150);
            const allElements = [element1, element2];
            const elementConfig = { ...config, snapToGrid: false, snapToElements: true };

            const snapPoints = calculator.findSnapPoints(element2, allElements, elementConfig);

            const edgeSnapPoint = snapPoints.find((p) => p.x === 100 && p.type === 'edge');
            expect(edgeSnapPoint?.distance).toBe(8);
        });

        it('should respect snap threshold for elements', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 115, 150);
            const allElements = [element1, element2];
            const tightConfig = { ...config, snapToGrid: false, snapToElements: true, snapThreshold: 10 };

            const snapPoints = calculator.findSnapPoints(element2, allElements, tightConfig);

            expect(snapPoints).toHaveLength(0);
        });
    });

    // =========================================================================
    // getSnappedPosition Tests
    // =========================================================================

    describe('getSnappedPosition', () => {
        it('should snap to grid', () => {
            const element = createTestRectangle('el1', 0, 0);
            const allElements = [element];
            const gridConfig = { ...config, snapToGrid: true, snapToElements: false };

            const snappedPos = calculator.getSnappedPosition(element, 15, 25, allElements, gridConfig);

            expect(snappedPos.x).toBe(20);
            expect(snappedPos.y).toBe(20);
        });

        it('should snap to element edges', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 0, 150);
            const allElements = [element1, element2];
            const elementConfig = { ...config, snapToGrid: false, snapToElements: true };

            const snappedPos = calculator.getSnappedPosition(element2, 105, 150, allElements, elementConfig);

            expect(snappedPos.x).toBe(100);
        });

        it('should not snap beyond threshold', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 0, 150);
            const allElements = [element1, element2];
            const tightConfig = { ...config, snapToGrid: false, snapToElements: true, snapThreshold: 5 };

            const snappedPos = calculator.getSnappedPosition(element2, 115, 150, allElements, tightConfig);

            expect(snappedPos.x).toBe(115);
        });

        it('should return original position when no snap points', () => {
            const element = createTestRectangle('el1', 0, 0);
            const allElements = [element];
            const disabledConfig = {
                ...config,
                snapToGrid: false,
                snapToElements: false,
            };

            const snappedPos = calculator.getSnappedPosition(element, 50, 75, allElements, disabledConfig);

            expect(snappedPos.x).toBe(50);
            expect(snappedPos.y).toBe(75);
        });
    });

    // =========================================================================
    // checkAlignment Tests
    // =========================================================================

    describe('checkAlignment', () => {
        it('should return false for single element', () => {
            const element = createTestRectangle('el1', 0, 0);

            const isAligned = calculator.checkAlignment([element], 'left');

            expect(isAligned).toBe(false);
        });

        it('should detect left alignment', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 100, 150);

            const isAligned = calculator.checkAlignment([element1, element2], 'left');

            expect(isAligned).toBe(true);
        });

        it('should detect center alignment', () => {
            // Both have center at x=150
            const element1 = createTestRectangle('el1', 100, 0, 100, 100);
            const element2 = createTestRectangle('el2', 100, 150, 100, 100);

            const isAligned = calculator.checkAlignment([element1, element2], 'center');

            expect(isAligned).toBe(true);
        });

        it('should detect right alignment', () => {
            // Both have right edge at x=200
            const element1 = createTestRectangle('el1', 100, 0, 100, 100);
            const element2 = createTestRectangle('el2', 150, 150, 50, 100);

            const isAligned = calculator.checkAlignment([element1, element2], 'right');

            expect(isAligned).toBe(true);
        });

        it('should detect top alignment', () => {
            const element1 = createTestRectangle('el1', 0, 100);
            const element2 = createTestRectangle('el2', 150, 100);

            const isAligned = calculator.checkAlignment([element1, element2], 'top');

            expect(isAligned).toBe(true);
        });

        it('should detect middle alignment', () => {
            // Both have middle at y=150
            const element1 = createTestRectangle('el1', 0, 100, 100, 100);
            const element2 = createTestRectangle('el2', 150, 100, 100, 100);

            const isAligned = calculator.checkAlignment([element1, element2], 'middle');

            expect(isAligned).toBe(true);
        });

        it('should detect bottom alignment', () => {
            // Both have bottom at y=200
            const element1 = createTestRectangle('el1', 0, 100, 100, 100);
            const element2 = createTestRectangle('el2', 150, 150, 100, 50);

            const isAligned = calculator.checkAlignment([element1, element2], 'bottom');

            expect(isAligned).toBe(true);
        });

        it('should return false for misaligned elements', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 150, 150);

            const isAligned = calculator.checkAlignment([element1, element2], 'left');

            expect(isAligned).toBe(false);
        });
    });

    // =========================================================================
    // getSnapResult Tests
    // =========================================================================

    describe('getSnapResult', () => {
        it('should return snap result with guides', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 0, 150);
            const allElements = [element1, element2];

            const result = calculator.getSnapResult(element2, 105, 150, allElements, config);

            expect(result).toHaveProperty('x');
            expect(result).toHaveProperty('y');
            expect(result).toHaveProperty('snappedX');
            expect(result).toHaveProperty('snappedY');
            expect(result).toHaveProperty('guides');
            expect(Array.isArray(result.guides)).toBe(true);
        });

        it('should indicate when snapping occurred', () => {
            const element1 = createTestRectangle('el1', 100, 0);
            const element2 = createTestRectangle('el2', 0, 150);
            const allElements = [element1, element2];
            const elementConfig = { ...config, snapToGrid: false, snapToElements: true };

            const result = calculator.getSnapResult(element2, 105, 150, allElements, elementConfig);

            expect(result.snappedX).toBe(true);
            expect(result.snappedY).toBe(false);
        });
    });

    // =========================================================================
    // Performance Tests
    // =========================================================================

    describe('performance', () => {
        it('should handle large number of elements efficiently', () => {
            const elements: CanvasElement[] = [];
            for (let i = 0; i < 100; i++) {
                elements.push(createTestRectangle(`el${i}`, i * 110, 0));
            }

            const startTime = performance.now();
            calculator.calculateGuides(elements[0]!, elements, config);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should handle large number of snap points efficiently', () => {
            const elements: CanvasElement[] = [];
            for (let i = 0; i < 100; i++) {
                elements.push(createTestRectangle(`el${i}`, i * 110, 0));
            }

            const startTime = performance.now();
            calculator.findSnapPoints(elements[0]!, elements, config);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(100);
        });
    });

    // =========================================================================
    // Singleton Tests
    // =========================================================================

    describe('singleton instance', () => {
        it('should provide singleton instance', () => {
            expect(guideCalculator).toBeInstanceOf(GuideCalculator);
        });

        it('should work with singleton instance', () => {
            const element = createTestRectangle('el1', 0, 0);
            const allElements = [element];

            const guides = guideCalculator.calculateGuides(element, allElements, config);

            expect(Array.isArray(guides)).toBe(true);
        });
    });
});
