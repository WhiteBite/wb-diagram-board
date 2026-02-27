/**
 * WB Guides - Snap Engine
 * 
 * Applies snapping logic to element positions
 */

import { CanvasElement, Point, Bounds } from '../../types/canvas';
import { SnapPoint, GuideError } from '../../types/guides';

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
 * Calculate distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Euclidean distance
 */
function distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// =============================================================================
// Snap Engine Class
// =============================================================================

/**
 * Engine for applying snap logic to element positions
 */
export class SnapEngine {
    /**
     * Apply snapping to a position based on snap points
     * 
     * @param position - Current position
     * @param snapPoints - Available snap points
     * @param threshold - Snap threshold in pixels
     * @returns Snapped position
     * @throws GuideError if snap points are invalid
     */
    applySnap(
        position: Point,
        snapPoints: readonly SnapPoint[],
        threshold: number
    ): Point {
        try {
            if (snapPoints.length === 0) {
                return position;
            }

            let snappedX = position.x;
            let snappedY = position.y;

            // Find closest snap point for X
            let minXDistance = threshold;
            snapPoints.forEach((point) => {
                if (point.x !== undefined && point.distance < minXDistance) {
                    snappedX = point.x;
                    minXDistance = point.distance;
                }
            });

            // Find closest snap point for Y
            let minYDistance = threshold;
            snapPoints.forEach((point) => {
                if (point.y !== undefined && point.distance < minYDistance) {
                    snappedY = point.y;
                    minYDistance = point.distance;
                }
            });

            return { x: snappedX, y: snappedY };
        } catch (error) {
            throw new GuideError('Failed to apply snap', {
                position,
                snapPointCount: snapPoints.length,
                threshold,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get snap distance from position to snap points
     * 
     * @param position - Current position
     * @param snapPoints - Available snap points
     * @returns Distance to nearest snap point for X and Y
     */
    getSnapDistance(position: Point, snapPoints: readonly SnapPoint[]): { x: number; y: number } {
        try {
            let minXDistance = Infinity;
            let minYDistance = Infinity;

            snapPoints.forEach((point) => {
                if (point.x !== undefined) {
                    const xDistance = Math.abs(position.x - point.x);
                    minXDistance = Math.min(minXDistance, xDistance);
                }

                if (point.y !== undefined) {
                    const yDistance = Math.abs(position.y - point.y);
                    minYDistance = Math.min(minYDistance, yDistance);
                }
            });

            return {
                x: minXDistance === Infinity ? 0 : minXDistance,
                y: minYDistance === Infinity ? 0 : minYDistance,
            };
        } catch (error) {
            throw new GuideError('Failed to get snap distance', {
                position,
                snapPointCount: snapPoints.length,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Check if there is a nearby snap point
     * 
     * @param position - Current position
     * @param snapPoints - Available snap points
     * @param threshold - Snap threshold in pixels
     * @returns True if there is a snap point within threshold
     */
    hasNearbySnapPoint(
        position: Point,
        snapPoints: readonly SnapPoint[],
        threshold: number
    ): boolean {
        try {
            return snapPoints.some((point) => {
                if (point.x !== undefined && Math.abs(position.x - point.x) <= threshold) {
                    return true;
                }
                if (point.y !== undefined && Math.abs(position.y - point.y) <= threshold) {
                    return true;
                }
                return false;
            });
        } catch (error) {
            throw new GuideError('Failed to check nearby snap point', {
                position,
                snapPointCount: snapPoints.length,
                threshold,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get all snap points for an element
     * 
     * @param element - Element to get snap points for
     * @param allElements - All elements on canvas
     * @param gridSize - Grid size for grid snapping
     * @returns Array of snap points
     */
    getAllSnapPoints(
        element: CanvasElement,
        allElements: readonly CanvasElement[],
        gridSize: number
    ): readonly SnapPoint[] {
        try {
            const snapPoints: SnapPoint[] = [];
            const elementBounds = getElementBounds(element);

            // Grid snap points
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

            // Element snap points
            const otherElements = allElements.filter((el) => el.id !== element.id);

            otherElements.forEach((other) => {
                const otherBounds = getElementBounds(other);

                // Left edge
                snapPoints.push({
                    x: otherBounds.x,
                    type: 'edge',
                    distance: Math.abs(elementBounds.x - otherBounds.x),
                });

                // Right edge
                snapPoints.push({
                    x: otherBounds.x + otherBounds.width - elementBounds.width,
                    type: 'edge',
                    distance: Math.abs(
                        elementBounds.x + elementBounds.width - (otherBounds.x + otherBounds.width)
                    ),
                });

                // Center X
                const elementCenterX = elementBounds.x + elementBounds.width / 2;
                const otherCenterX = otherBounds.x + otherBounds.width / 2;
                snapPoints.push({
                    x: otherCenterX - elementBounds.width / 2,
                    type: 'center',
                    distance: Math.abs(elementCenterX - otherCenterX),
                });

                // Top edge
                snapPoints.push({
                    y: otherBounds.y,
                    type: 'edge',
                    distance: Math.abs(elementBounds.y - otherBounds.y),
                });

                // Bottom edge
                snapPoints.push({
                    y: otherBounds.y + otherBounds.height - elementBounds.height,
                    type: 'edge',
                    distance: Math.abs(
                        elementBounds.y + elementBounds.height - (otherBounds.y + otherBounds.height)
                    ),
                });

                // Center Y
                const elementCenterY = elementBounds.y + elementBounds.height / 2;
                const otherCenterY = otherBounds.y + otherBounds.height / 2;
                snapPoints.push({
                    y: otherCenterY - elementBounds.height / 2,
                    type: 'center',
                    distance: Math.abs(elementCenterY - otherCenterY),
                });
            });

            return snapPoints;
        } catch (error) {
            throw new GuideError('Failed to get all snap points', {
                elementId: element.id,
                elementCount: allElements.length,
                gridSize,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Snap position to grid
     * 
     * @param position - Position to snap
     * @param gridSize - Grid size
     * @returns Snapped position
     */
    snapToGrid(position: Point, gridSize: number): Point {
        try {
            return {
                x: Math.round(position.x / gridSize) * gridSize,
                y: Math.round(position.y / gridSize) * gridSize,
            };
        } catch (error) {
            throw new GuideError('Failed to snap to grid', {
                position,
                gridSize,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Snap position to element edges
     * 
     * @param position - Position to snap
     * @param element - Element to snap to
     * @param threshold - Snap threshold
     * @returns Snapped position
     */
    snapToElement(position: Point, element: CanvasElement, threshold: number): Point {
        try {
            const bounds = getElementBounds(element);
            let snappedX = position.x;
            let snappedY = position.y;

            // Snap to left edge
            if (Math.abs(position.x - bounds.x) <= threshold) {
                snappedX = bounds.x;
            }

            // Snap to right edge
            if (Math.abs(position.x - (bounds.x + bounds.width)) <= threshold) {
                snappedX = bounds.x + bounds.width;
            }

            // Snap to center X
            const centerX = bounds.x + bounds.width / 2;
            if (Math.abs(position.x - centerX) <= threshold) {
                snappedX = centerX;
            }

            // Snap to top edge
            if (Math.abs(position.y - bounds.y) <= threshold) {
                snappedY = bounds.y;
            }

            // Snap to bottom edge
            if (Math.abs(position.y - (bounds.y + bounds.height)) <= threshold) {
                snappedY = bounds.y + bounds.height;
            }

            // Snap to center Y
            const centerY = bounds.y + bounds.height / 2;
            if (Math.abs(position.y - centerY) <= threshold) {
                snappedY = centerY;
            }

            return { x: snappedX, y: snappedY };
        } catch (error) {
            throw new GuideError('Failed to snap to element', {
                position,
                elementId: element.id,
                threshold,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}

/**
 * Singleton instance of SnapEngine
 */
export const snapEngine = new SnapEngine();
