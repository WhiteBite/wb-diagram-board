/**
 * Virtualization Engine
 * 
 * Culls elements outside viewport to improve rendering performance
 */

import { CanvasElement } from '../../types/canvas';
import { Bounds, Transform, RenderStats, PerformanceError } from '../../types/performance';

/**
 * Virtualization engine for culling elements outside viewport
 */
export class VirtualizationEngine {
    /**
     * Get visible elements within viewport bounds
     * 
     * @param elements All canvas elements
     * @param viewport Viewport bounds
     * @param bufferSize Buffer size in pixels around viewport
     * @returns Visible elements
     * @throws PerformanceError if inputs are invalid
     */
    getVisibleElements(
        elements: readonly CanvasElement[],
        viewport: Bounds,
        bufferSize: number
    ): readonly CanvasElement[] {
        try {
            if (!Array.isArray(elements)) {
                throw new PerformanceError('Elements must be an array', { elements });
            }

            if (!viewport || typeof viewport.x !== 'number') {
                throw new PerformanceError('Invalid viewport bounds', { viewport });
            }

            if (bufferSize < 0) {
                throw new PerformanceError('Buffer size must be non-negative', { bufferSize });
            }

            return elements.filter((element) =>
                this.intersectsViewport(element, viewport, bufferSize)
            );
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get visible elements', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get elements to render with transform applied
     * 
     * @param elements All canvas elements
     * @param viewport Viewport bounds
     * @param transform Canvas transform
     * @param bufferSize Buffer size in pixels
     * @returns Elements to render
     */
    getElementsToRender(
        elements: readonly CanvasElement[],
        viewport: Bounds,
        transform: Transform,
        bufferSize: number
    ): readonly CanvasElement[] {
        try {
            if (!transform || typeof transform.scale !== 'number') {
                throw new PerformanceError('Invalid transform', { transform });
            }

            if (transform.scale <= 0) {
                throw new PerformanceError('Transform scale must be positive', { scale: transform.scale });
            }

            // Transform viewport to canvas coordinates
            const canvasViewport: Bounds = {
                x: (viewport.x - transform.x) / transform.scale,
                y: (viewport.y - transform.y) / transform.scale,
                width: viewport.width / transform.scale,
                height: viewport.height / transform.scale,
            };

            return this.getVisibleElements(elements, canvasViewport, bufferSize / transform.scale);
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get elements to render', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Check if element intersects with viewport
     * 
     * @param element Canvas element
     * @param viewport Viewport bounds
     * @param bufferSize Buffer size in pixels
     * @returns True if element intersects viewport
     */
    intersectsViewport(
        element: CanvasElement,
        viewport: Bounds,
        bufferSize: number
    ): boolean {
        try {
            if (!element || typeof element.x !== 'number') {
                throw new PerformanceError('Invalid element', { element });
            }

            const expandedViewport: Bounds = {
                x: viewport.x - bufferSize,
                y: viewport.y - bufferSize,
                width: viewport.width + bufferSize * 2,
                height: viewport.height + bufferSize * 2,
            };

            const elementBounds: Bounds = {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
            };

            return this.boundsIntersect(elementBounds, expandedViewport);
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to check viewport intersection', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get virtualization statistics
     * 
     * @param elements All elements
     * @param visibleElements Visible elements
     * @returns Statistics
     */
    getStats(
        elements: readonly CanvasElement[],
        visibleElements: readonly CanvasElement[]
    ): RenderStats {
        try {
            const total = elements.length;
            const visible = visibleElements.length;
            const culled = total - visible;

            return {
                total,
                visible,
                culled,
                batches: Math.ceil(visible / 100), // Estimate batches
            };
        } catch (error) {
            throw new PerformanceError('Failed to get virtualization stats', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Check if two bounds intersect
     * 
     * @param bounds1 First bounds
     * @param bounds2 Second bounds
     * @returns True if bounds intersect
     */
    private boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
        return !(
            bounds1.x + bounds1.width < bounds2.x ||
            bounds1.x > bounds2.x + bounds2.width ||
            bounds1.y + bounds1.height < bounds2.y ||
            bounds1.y > bounds2.y + bounds2.height
        );
    }
}

/**
 * Global virtualization engine instance
 */
export const virtualizationEngine = new VirtualizationEngine();
