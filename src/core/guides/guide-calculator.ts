/**
 * WB Guides - Guide Calculator
 * 
 * Calculates alignment guides and snap points for elements
 */

import { CanvasElement, Point, Bounds } from '../../types/canvas';
import {
    Guide,
    SnapPoint,
    GuidesConfig,
    SnapResult,
    AlignmentType,
    GuideError,
} from '../../types/guides';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get bounds of an element
 * @param element - Canvas element
 * @returns Element bounds
 */
function getElementBounds(element: CanvasElement): Bounds {
    return {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
    };
}

/**
 * Get bounds of multiple elements
 * @param elements - Array of canvas elements
 * @returns Combined bounds or null if empty
 */
function getElementsBounds(elements: readonly CanvasElement[]): Bounds | null {
    if (elements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach((el) => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Check if two numbers are approximately equal within threshold
 * @param a - First number
 * @param b - Second number
 * @param threshold - Threshold for comparison
 * @returns True if numbers are approximately equal
 */
function isApproximatelyEqual(a: number, b: number, threshold: number): boolean {
    return Math.abs(a - b) <= threshold;
}

// =============================================================================
// Guide Calculator Class
// =============================================================================

/**
 * Calculates alignment guides and snap points for canvas elements
 */
export class GuideCalculator {
    /**
     * Calculate alignment guides for an element relative to other elements
     * 
     * @param element - Element to calculate guides for
     * @param allElements - All elements on canvas
     * @param config - Guides configuration
     * @returns Array of alignment guides
     * @throws GuideError if element is not found in allElements
     */
    calculateGuides(
        element: CanvasElement,
        allElements: readonly CanvasElement[],
        config: GuidesConfig
    ): readonly Guide[] {
        try {
            if (!config.showGuides) {
                return [];
            }

            const guides: Guide[] = [];
            const elementBounds = getElementBounds(element);
            const threshold = config.snapThreshold;

            // Get other elements (exclude the current element)
            const otherElements = allElements.filter((el) => el.id !== element.id);

            if (otherElements.length === 0) {
                return [];
            }

            // Check vertical alignment (left, center, right)
            const verticalAlignments = new Map<number, string[]>();

            // Left edge
            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);
                if (isApproximatelyEqual(elementBounds.x, otherBounds.x, threshold)) {
                    const key = Math.round(elementBounds.x);
                    if (!verticalAlignments.has(key)) {
                        verticalAlignments.set(key, []);
                    }
                    verticalAlignments.get(key)!.push(other.id);
                }
            });

            // Center
            const elementCenterX = elementBounds.x + elementBounds.width / 2;
            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);
                const otherCenterX = otherBounds.x + otherBounds.width / 2;
                if (isApproximatelyEqual(elementCenterX, otherCenterX, threshold)) {
                    const key = Math.round(elementCenterX);
                    if (!verticalAlignments.has(key)) {
                        verticalAlignments.set(key, []);
                    }
                    verticalAlignments.get(key)!.push(other.id);
                }
            });

            // Right edge
            const elementRightX = elementBounds.x + elementBounds.width;
            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);
                const otherRightX = otherBounds.x + otherBounds.width;
                if (isApproximatelyEqual(elementRightX, otherRightX, threshold)) {
                    const key = Math.round(elementRightX);
                    if (!verticalAlignments.has(key)) {
                        verticalAlignments.set(key, []);
                    }
                    verticalAlignments.get(key)!.push(other.id);
                }
            });

            // Add vertical guides
            verticalAlignments.forEach((elementIds, position) => {
                if (elementIds.length > 0) {
                    guides.push({
                        type: 'vertical',
                        position,
                        elementIds: elementIds as readonly string[],
                        isActive: true,
                    });
                }
            });

            // Check horizontal alignment (top, middle, bottom)
            const horizontalAlignments = new Map<number, string[]>();

            // Top edge
            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);
                if (isApproximatelyEqual(elementBounds.y, otherBounds.y, threshold)) {
                    const key = Math.round(elementBounds.y);
                    if (!horizontalAlignments.has(key)) {
                        horizontalAlignments.set(key, []);
                    }
                    horizontalAlignments.get(key)!.push(other.id);
                }
            });

            // Middle
            const elementCenterY = elementBounds.y + elementBounds.height / 2;
            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);
                const otherCenterY = otherBounds.y + otherBounds.height / 2;
                if (isApproximatelyEqual(elementCenterY, otherCenterY, threshold)) {
                    const key = Math.round(elementCenterY);
                    if (!horizontalAlignments.has(key)) {
                        horizontalAlignments.set(key, []);
                    }
                    horizontalAlignments.get(key)!.push(other.id);
                }
            });

            // Bottom edge
            const elementBottomY = elementBounds.y + elementBounds.height;
            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);
                const otherBottomY = otherBounds.y + otherBounds.height;
                if (isApproximatelyEqual(elementBottomY, otherBottomY, threshold)) {
                    const key = Math.round(elementBottomY);
                    if (!horizontalAlignments.has(key)) {
                        horizontalAlignments.set(key, []);
                    }
                    horizontalAlignments.get(key)!.push(other.id);
                }
            });

            // Add horizontal guides
            horizontalAlignments.forEach((elementIds, position) => {
                if (elementIds.length > 0) {
                    guides.push({
                        type: 'horizontal',
                        position,
                        elementIds: elementIds as readonly string[],
                        isActive: true,
                    });
                }
            });

            return guides;
        } catch (error) {
            throw new GuideError('Failed to calculate guides', {
                elementId: element.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Find snap points for an element
     * 
     * @param element - Element to find snap points for
     * @param allElements - All elements on canvas
     * @param config - Guides configuration
     * @returns Array of snap points
     */
    findSnapPoints(
        element: CanvasElement,
        allElements: readonly CanvasElement[],
        config: GuidesConfig
    ): readonly SnapPoint[] {
        try {
            const snapPoints: SnapPoint[] = [];
            const elementBounds = getElementBounds(element);
            const threshold = config.snapThreshold;

            // Grid snap points
            if (config.snapToGrid) {
                const gridSize = config.gridSize;
                const gridX = Math.round(elementBounds.x / gridSize) * gridSize;
                const gridY = Math.round(elementBounds.y / gridSize) * gridSize;

                snapPoints.push({
                    x: gridX,
                    type: 'grid',
                    distance: Math.abs(elementBounds.x - gridX),
                });

                snapPoints.push({
                    y: gridY,
                    type: 'grid',
                    distance: Math.abs(elementBounds.y - gridY),
                });
            }

            // Element snap points
            if (config.snapToElements) {
                const otherElements = allElements.filter((el) => el.id !== element.id);

                otherElements.forEach((other) => {
                    const otherBounds = getElementBounds(other);

                    // Left edge
                    const leftDistance = Math.abs(elementBounds.x - otherBounds.x);
                    if (leftDistance <= threshold) {
                        snapPoints.push({
                            x: otherBounds.x,
                            type: 'edge',
                            distance: leftDistance,
                        });
                    }

                    // Right edge
                    const rightDistance = Math.abs(
                        elementBounds.x + elementBounds.width - (otherBounds.x + otherBounds.width)
                    );
                    if (rightDistance <= threshold) {
                        snapPoints.push({
                            x: otherBounds.x + otherBounds.width - elementBounds.width,
                            type: 'edge',
                            distance: rightDistance,
                        });
                    }

                    // Center X
                    const elementCenterX = elementBounds.x + elementBounds.width / 2;
                    const otherCenterX = otherBounds.x + otherBounds.width / 2;
                    const centerXDistance = Math.abs(elementCenterX - otherCenterX);
                    if (centerXDistance <= threshold) {
                        snapPoints.push({
                            x: otherCenterX - elementBounds.width / 2,
                            type: 'center',
                            distance: centerXDistance,
                        });
                    }

                    // Top edge
                    const topDistance = Math.abs(elementBounds.y - otherBounds.y);
                    if (topDistance <= threshold) {
                        snapPoints.push({
                            y: otherBounds.y,
                            type: 'edge',
                            distance: topDistance,
                        });
                    }

                    // Bottom edge
                    const bottomDistance = Math.abs(
                        elementBounds.y + elementBounds.height - (otherBounds.y + otherBounds.height)
                    );
                    if (bottomDistance <= threshold) {
                        snapPoints.push({
                            y: otherBounds.y + otherBounds.height - elementBounds.height,
                            type: 'edge',
                            distance: bottomDistance,
                        });
                    }

                    // Center Y
                    const elementCenterY = elementBounds.y + elementBounds.height / 2;
                    const otherCenterY = otherBounds.y + otherBounds.height / 2;
                    const centerYDistance = Math.abs(elementCenterY - otherCenterY);
                    if (centerYDistance <= threshold) {
                        snapPoints.push({
                            y: otherCenterY - elementBounds.height / 2,
                            type: 'center',
                            distance: centerYDistance,
                        });
                    }
                });
            }

            return snapPoints;
        } catch (error) {
            throw new GuideError('Failed to find snap points', {
                elementId: element.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get snapped position for an element
     * 
     * @param element - Element to snap
     * @param targetX - Target X position
     * @param targetY - Target Y position
     * @param allElements - All elements on canvas
     * @param config - Guides configuration
     * @returns Snapped position
     */
    getSnappedPosition(
        element: CanvasElement,
        targetX: number,
        targetY: number,
        allElements: readonly CanvasElement[],
        config: GuidesConfig
    ): Point {
        try {
            const snapPoints = this.findSnapPoints(element, allElements, config);
            let snappedX = targetX;
            let snappedY = targetY;

            // Find closest snap point for X
            let minXDistance = config.snapThreshold;
            snapPoints.forEach((point) => {
                if (point.x !== undefined && point.distance < minXDistance) {
                    snappedX = point.x;
                    minXDistance = point.distance;
                }
            });

            // Find closest snap point for Y
            let minYDistance = config.snapThreshold;
            snapPoints.forEach((point) => {
                if (point.y !== undefined && point.distance < minYDistance) {
                    snappedY = point.y;
                    minYDistance = point.distance;
                }
            });

            return { x: snappedX, y: snappedY };
        } catch (error) {
            throw new GuideError('Failed to get snapped position', {
                elementId: element.id,
                targetX,
                targetY,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Check if elements are aligned
     * 
     * @param elements - Elements to check
     * @param type - Alignment type
     * @returns True if all elements are aligned
     */
    checkAlignment(
        elements: readonly CanvasElement[],
        type: AlignmentType
    ): boolean {
        try {
            if (elements.length < 2) {
                return false;
            }

            const threshold = 1; // Pixel tolerance
            const bounds = elements.map((el) => getElementBounds(el));

            switch (type) {
                case 'left':
                    return bounds.every((b) => isApproximatelyEqual(b.x, bounds[0].x, threshold));

                case 'center':
                    return bounds.every((b) =>
                        isApproximatelyEqual(
                            b.x + b.width / 2,
                            bounds[0].x + bounds[0].width / 2,
                            threshold
                        )
                    );

                case 'right':
                    return bounds.every((b) =>
                        isApproximatelyEqual(
                            b.x + b.width,
                            bounds[0].x + bounds[0].width,
                            threshold
                        )
                    );

                case 'top':
                    return bounds.every((b) => isApproximatelyEqual(b.y, bounds[0].y, threshold));

                case 'middle':
                    return bounds.every((b) =>
                        isApproximatelyEqual(
                            b.y + b.height / 2,
                            bounds[0].y + bounds[0].height / 2,
                            threshold
                        )
                    );

                case 'bottom':
                    return bounds.every((b) =>
                        isApproximatelyEqual(
                            b.y + b.height,
                            bounds[0].y + bounds[0].height,
                            threshold
                        )
                    );

                default:
                    return false;
            }
        } catch (error) {
            throw new GuideError('Failed to check alignment', {
                elementCount: elements.length,
                type,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get snap result with guides
     * 
     * @param element - Element to snap
     * @param targetX - Target X position
     * @param targetY - Target Y position
     * @param allElements - All elements on canvas
     * @param config - Guides configuration
     * @returns Snap result with guides
     */
    getSnapResult(
        element: CanvasElement,
        targetX: number,
        targetY: number,
        allElements: readonly CanvasElement[],
        config: GuidesConfig
    ): SnapResult {
        try {
            const snappedPosition = this.getSnappedPosition(
                element,
                targetX,
                targetY,
                allElements,
                config
            );

            const guides = this.calculateGuides(element, allElements, config);

            return {
                x: snappedPosition.x,
                y: snappedPosition.y,
                snappedX: snappedPosition.x !== targetX,
                snappedY: snappedPosition.y !== targetY,
                guides,
            };
        } catch (error) {
            throw new GuideError('Failed to get snap result', {
                elementId: element.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}

/**
 * Singleton instance of GuideCalculator
 */
export const guideCalculator = new GuideCalculator();
