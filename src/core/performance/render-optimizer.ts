/**
 * Render Optimizer
 * 
 * Optimizes rendering order, batching, and level of detail
 */

import { CanvasElement } from '../../types/canvas';
import { Bounds, LODLevel, PerformanceError, PerformanceMetrics } from '../../types/performance';

/**
 * Render optimizer for improving rendering performance
 */
export class RenderOptimizer {
    /**
     * Optimize rendering order for better performance
     * 
     * Sorts elements by:
     * 1. Type (shapes first, then lines, then text)
     * 2. Z-index
     * 3. Distance from viewport center
     * 
     * @param elements Canvas elements
     * @param viewport Viewport bounds
     * @returns Optimized element order
     */
    optimizeRenderOrder(
        elements: readonly CanvasElement[],
        viewport: Bounds
    ): readonly CanvasElement[] {
        try {
            if (!Array.isArray(elements)) {
                throw new PerformanceError('Elements must be an array', { elements });
            }

            if (!viewport || typeof viewport.x !== 'number') {
                throw new PerformanceError('Invalid viewport bounds', { viewport });
            }

            const viewportCenterX = viewport.x + viewport.width / 2;
            const viewportCenterY = viewport.y + viewport.height / 2;

            const typeOrder: Record<string, number> = {
                rectangle: 0,
                ellipse: 0,
                diamond: 0,
                triangle: 0,
                frame: 1,
                line: 2,
                arrow: 2,
                connector: 2,
                freedraw: 3,
                text: 4,
                sticky: 5,
                image: 1,
            };

            return [...elements].sort((a, b) => {
                // Sort by type first
                const typeA = typeOrder[a.type] ?? 10;
                const typeB = typeOrder[b.type] ?? 10;

                if (typeA !== typeB) {
                    return typeA - typeB;
                }

                // Then by z-index
                if (a.zIndex !== b.zIndex) {
                    return a.zIndex - b.zIndex;
                }

                // Then by distance from viewport center
                const distA = Math.hypot(
                    a.x + a.width / 2 - viewportCenterX,
                    a.y + a.height / 2 - viewportCenterY
                );

                const distB = Math.hypot(
                    b.x + b.width / 2 - viewportCenterX,
                    b.y + b.height / 2 - viewportCenterY
                );

                return distA - distB;
            });
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to optimize render order', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Group elements for batch rendering
     * 
     * Groups elements by type to reduce state changes
     * 
     * @param elements Canvas elements
     * @returns Grouped elements
     */
    groupForBatching(
        elements: readonly CanvasElement[]
    ): readonly (readonly CanvasElement[])[] {
        try {
            if (!Array.isArray(elements)) {
                throw new PerformanceError('Elements must be an array', { elements });
            }

            const groups = new Map<string, CanvasElement[]>();

            elements.forEach((element) => {
                const key = element.type;
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key)!.push(element);
            });

            return Array.from(groups.values());
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to group elements for batching', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get level of detail for element based on zoom level
     * 
     * @param element Canvas element
     * @param zoom Zoom level (scale)
     * @returns LOD level
     */
    getLOD(element: CanvasElement, zoom: number): LODLevel {
        try {
            if (!element || typeof element.width !== 'number') {
                throw new PerformanceError('Invalid element', { element });
            }

            if (zoom <= 0) {
                throw new PerformanceError('Zoom must be positive', { zoom });
            }

            // Calculate effective size on screen
            const effectiveSize = Math.min(element.width, element.height) * zoom;

            // High LOD: element is large on screen
            if (effectiveSize > 100) {
                return 'high';
            }

            // Medium LOD: element is medium on screen
            if (effectiveSize > 30) {
                return 'medium';
            }

            // Low LOD: element is small on screen
            return 'low';
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get LOD', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Simplify element for lower LOD
     * 
     * @param element Canvas element
     * @param lod Level of detail
     * @returns Simplified element
     */
    simplifyElement(element: CanvasElement, lod: LODLevel): CanvasElement {
        try {
            if (!element) {
                throw new PerformanceError('Element is required', { element });
            }

            if (!['high', 'medium', 'low'].includes(lod)) {
                throw new PerformanceError('Invalid LOD level', { lod });
            }

            // For low LOD, reduce detail
            if (lod === 'low') {
                return {
                    ...element,
                    opacity: element.opacity * 0.8, // Slightly reduce opacity
                };
            }

            // For medium LOD, keep most details
            if (lod === 'medium') {
                return element;
            }

            // For high LOD, keep all details
            return element;
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to simplify element', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get optimization recommendations based on metrics
     * 
     * @param elements Canvas elements
     * @param metrics Performance metrics
     * @returns Array of recommendations
     */
    getOptimizationTips(
        elements: readonly CanvasElement[],
        metrics: PerformanceMetrics
    ): readonly string[] {
        try {
            if (!Array.isArray(elements)) {
                throw new PerformanceError('Elements must be an array', { elements });
            }

            if (!metrics || typeof metrics.fps !== 'number') {
                throw new PerformanceError('Invalid metrics', { metrics });
            }

            const tips: string[] = [];

            // Check FPS
            if (metrics.fps < 30) {
                tips.push('FPS is low. Consider reducing element count or enabling virtualization.');
            }

            // Check render time
            if (metrics.renderTime > 16) {
                tips.push('Render time exceeds 16ms. Consider optimizing element rendering.');
            }

            // Check element count
            if (metrics.elementCount > 1000) {
                tips.push('Large number of elements. Consider grouping or using frames.');
            }

            // Check culling efficiency
            const cullingRatio = 1 - metrics.visibleElementCount / metrics.elementCount;
            if (cullingRatio < 0.3 && metrics.elementCount > 500) {
                tips.push('Low culling efficiency. Consider organizing elements better.');
            }

            // Check memory usage
            if (metrics.memoryUsage > 100 * 1024 * 1024) {
                tips.push('High memory usage. Consider clearing cache or reducing element complexity.');
            }

            return tips;
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get optimization tips', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}

/**
 * Global render optimizer instance
 */
export const renderOptimizer = new RenderOptimizer();
