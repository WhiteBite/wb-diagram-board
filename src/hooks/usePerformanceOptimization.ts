/**
 * Performance Optimization Hook
 * 
 * Integrates performance optimization into Canvas component
 */

import { useEffect, useCallback, useRef } from 'react';
import { CanvasElement, Bounds, Transform } from '../types/canvas';
import { usePerformanceStore, selectVirtualizationEnabled, selectCacheEnabled, selectLODEnabled } from '../store/performance-store';
import { virtualizationEngine, elementBoundsCache, profiler, renderOptimizer, performanceMonitor } from '../core/performance';

/**
 * Hook for performance optimization
 * 
 * @param elements Canvas elements
 * @param viewport Viewport bounds
 * @param transform Canvas transform
 * @param bufferSize Virtualization buffer size
 * @returns Optimized elements and performance data
 */
export function usePerformanceOptimization(
    elements: readonly CanvasElement[],
    viewport: Bounds,
    transform: Transform,
    bufferSize: number = 100
) {
    const virtualizationEnabled = usePerformanceStore(selectVirtualizationEnabled);
    const cacheEnabled = usePerformanceStore(selectCacheEnabled);
    const lodEnabled = usePerformanceStore(selectLODEnabled);
    const updateMetrics = usePerformanceStore((s) => s.updateMetrics);
    const updateVisibleElements = usePerformanceStore((s) => s.updateVisibleElements);

    const renderStartRef = useRef<number>(0);
    const updateStartRef = useRef<number>(0);

    /**
     * Get visible elements with virtualization
     */
    const getVisibleElements = useCallback(() => {
        try {
            profiler.start('virtualization');

            let visibleElements: readonly CanvasElement[] = elements;

            if (virtualizationEnabled) {
                visibleElements = virtualizationEngine.getElementsToRender(
                    elements,
                    viewport,
                    transform,
                    bufferSize
                );
            }

            profiler.end('virtualization');
            return visibleElements;
        } catch (error) {
            console.error('[usePerformanceOptimization] Error getting visible elements:', error);
            return elements;
        }
    }, [elements, viewport, transform, virtualizationEnabled, bufferSize]);

    /**
     * Get optimized render order
     */
    const getOptimizedElements = useCallback((visibleElements: readonly CanvasElement[]) => {
        try {
            profiler.start('render-optimization');

            let optimized: readonly CanvasElement[] = visibleElements;

            // Optimize render order
            optimized = renderOptimizer.optimizeRenderOrder(visibleElements, viewport);

            // Apply LOD if enabled
            if (lodEnabled) {
                optimized = optimized.map((element) => {
                    const lod = renderOptimizer.getLOD(element, transform.scale);
                    return renderOptimizer.simplifyElement(element, lod);
                });
            }

            profiler.end('render-optimization');
            return optimized;
        } catch (error) {
            console.error('[usePerformanceOptimization] Error optimizing elements:', error);
            return visibleElements;
        }
    }, [viewport, transform.scale, lodEnabled]);

    /**
     * Get element bounds with caching
     */
    const getElementBounds = useCallback((element: CanvasElement): Bounds => {
        try {
            if (!cacheEnabled) {
                return {
                    x: element.x,
                    y: element.y,
                    width: element.width,
                    height: element.height,
                };
            }

            const cacheKey = `bounds-${element.id}-${element.x}-${element.y}-${element.width}-${element.height}`;
            const cached = elementBoundsCache.get(cacheKey);

            if (cached) {
                return cached;
            }

            const bounds: Bounds = {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
            };

            elementBoundsCache.set(cacheKey, bounds);
            return bounds;
        } catch (error) {
            console.error('[usePerformanceOptimization] Error getting element bounds:', error);
            return {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
            };
        }
    }, [cacheEnabled]);

    /**
     * Start render measurement
     */
    const startRenderMeasurement = useCallback(() => {
        renderStartRef.current = performance.now();
    }, []);

    /**
     * End render measurement and update metrics
     */
    const endRenderMeasurement = useCallback((visibleElements: readonly CanvasElement[]) => {
        try {
            const renderTime = performance.now() - renderStartRef.current;
            const updateTime = performance.now() - updateStartRef.current;

            updateMetrics({
                renderTime,
                updateTime,
                elementCount: elements.length,
                visibleElementCount: visibleElements.length,
            });

            updateVisibleElements(visibleElements.map((e) => e.id));
        } catch (error) {
            console.error('[usePerformanceOptimization] Error updating metrics:', error);
        }
    }, [elements.length, updateMetrics, updateVisibleElements]);

    /**
     * Start update measurement
     */
    const startUpdateMeasurement = useCallback(() => {
        updateStartRef.current = performance.now();
    }, []);

    /**
     * Get performance report
     */
    const getPerformanceReport = useCallback(() => {
        try {
            const report = performanceMonitor.exportReport();
            return report;
        } catch (error) {
            console.error('[usePerformanceOptimization] Error getting report:', error);
            return 'Performance report unavailable';
        }
    }, []);

    /**
     * Get cache statistics
     */
    const getCacheStats = useCallback(() => {
        try {
            return elementBoundsCache.getStats();
        } catch (error) {
            console.error('[usePerformanceOptimization] Error getting cache stats:', error);
            return {
                hits: 0,
                misses: 0,
                size: 0,
                hitRate: 0,
            };
        }
    }, []);

    /**
     * Get profiler report
     */
    const getProfilerReport = useCallback(() => {
        try {
            return profiler.getReport();
        } catch (error) {
            console.error('[usePerformanceOptimization] Error getting profiler report:', error);
            return 'Profiler report unavailable';
        }
    }, []);

    // Start performance monitoring on mount
    useEffect(() => {
        try {
            performanceMonitor.start();
        } catch (error) {
            console.error('[usePerformanceOptimization] Error starting monitor:', error);
        }

        return () => {
            try {
                performanceMonitor.stop();
            } catch (error) {
                console.error('[usePerformanceOptimization] Error stopping monitor:', error);
            }
        };
    }, []);

    return {
        getVisibleElements,
        getOptimizedElements,
        getElementBounds,
        startRenderMeasurement,
        endRenderMeasurement,
        startUpdateMeasurement,
        getPerformanceReport,
        getCacheStats,
        getProfilerReport,
    };
}
