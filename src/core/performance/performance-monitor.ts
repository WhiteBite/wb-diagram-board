/**
 * Performance Monitor
 * 
 * Real-time performance monitoring and metrics collection
 */

import { PerformanceMetrics, PerformanceRecommendation, PerformanceError } from '../../types/performance';

/**
 * Performance monitor for real-time metrics collection
 */
export class PerformanceMonitor {
    private metrics: PerformanceMetrics[] = [];
    private isMonitoring = false;
    private frameCount = 0;
    private lastFrameTime = performance.now();
    private animationFrameId: number | null = null;
    private readonly maxMetricsHistory = 300; // Keep last 5 seconds at 60fps

    /**
     * Start monitoring performance
     */
    start(): void {
        try {
            if (this.isMonitoring) {
                return;
            }

            this.isMonitoring = true;
            this.frameCount = 0;
            this.lastFrameTime = performance.now();
            this.metrics = [];

            this.measureFrame();
        } catch (error) {
            throw new PerformanceError('Failed to start monitoring', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Stop monitoring performance
     */
    stop(): void {
        try {
            this.isMonitoring = false;

            if (this.animationFrameId !== null) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        } catch (error) {
            throw new PerformanceError('Failed to stop monitoring', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get current performance metrics
     * 
     * @returns Current metrics
     */
    getMetrics(): PerformanceMetrics {
        try {
            if (this.metrics.length === 0) {
                return this.createEmptyMetrics();
            }

            return this.metrics[this.metrics.length - 1];
        } catch (error) {
            throw new PerformanceError('Failed to get metrics', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get metrics history
     * 
     * @returns Array of metrics
     */
    getHistory(): readonly PerformanceMetrics[] {
        try {
            return Object.freeze([...this.metrics]);
        } catch (error) {
            throw new PerformanceError('Failed to get history', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get performance recommendations
     * 
     * @returns Array of recommendations
     */
    getRecommendations(): readonly PerformanceRecommendation[] {
        try {
            const recommendations: PerformanceRecommendation[] = [];
            const currentMetrics = this.getMetrics();

            // Check FPS
            if (currentMetrics.fps < 30) {
                recommendations.push({
                    severity: 'critical',
                    message: `FPS is ${currentMetrics.fps.toFixed(1)}, below 30 FPS target`,
                    action: 'Enable virtualization or reduce element count',
                });
            } else if (currentMetrics.fps < 50) {
                recommendations.push({
                    severity: 'warning',
                    message: `FPS is ${currentMetrics.fps.toFixed(1)}, below 60 FPS target`,
                    action: 'Consider optimizing render performance',
                });
            }

            // Check render time
            if (currentMetrics.renderTime > 16) {
                recommendations.push({
                    severity: 'warning',
                    message: `Render time is ${currentMetrics.renderTime.toFixed(2)}ms, exceeds 16ms budget`,
                    action: 'Optimize element rendering or use LOD',
                });
            }

            // Check memory
            if (currentMetrics.memoryUsage > 100 * 1024 * 1024) {
                recommendations.push({
                    severity: 'warning',
                    message: `Memory usage is ${(currentMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
                    action: 'Clear cache or reduce element complexity',
                });
            }

            // Check culling efficiency
            if (currentMetrics.elementCount > 0) {
                const cullingRatio = 1 - currentMetrics.visibleElementCount / currentMetrics.elementCount;
                if (cullingRatio < 0.2 && currentMetrics.elementCount > 500) {
                    recommendations.push({
                        severity: 'info',
                        message: 'Low culling efficiency',
                        action: 'Consider organizing elements better for better viewport culling',
                    });
                }
            }

            return recommendations;
        } catch (error) {
            throw new PerformanceError('Failed to get recommendations', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Export performance report
     * 
     * @returns Report as string
     */
    exportReport(): string {
        try {
            const currentMetrics = this.getMetrics();
            const history = this.getHistory();

            const lines: string[] = [
                '=== Performance Report ===',
                '',
                'Current Metrics:',
                `  FPS: ${currentMetrics.fps.toFixed(1)}`,
                `  Render Time: ${currentMetrics.renderTime.toFixed(2)}ms`,
                `  Update Time: ${currentMetrics.updateTime.toFixed(2)}ms`,
                `  Memory: ${(currentMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
                `  Elements: ${currentMetrics.elementCount}`,
                `  Visible: ${currentMetrics.visibleElementCount}`,
                '',
            ];

            if (history.length > 0) {
                const avgFps = history.reduce((sum, m) => sum + m.fps, 0) / history.length;
                const avgRenderTime = history.reduce((sum, m) => sum + m.renderTime, 0) / history.length;
                const maxRenderTime = Math.max(...history.map((m) => m.renderTime));

                lines.push('Average Metrics:');
                lines.push(`  Avg FPS: ${avgFps.toFixed(1)}`);
                lines.push(`  Avg Render Time: ${avgRenderTime.toFixed(2)}ms`);
                lines.push(`  Max Render Time: ${maxRenderTime.toFixed(2)}ms`);
                lines.push('');
            }

            const recommendations = this.getRecommendations();
            if (recommendations.length > 0) {
                lines.push('Recommendations:');
                recommendations.forEach((rec) => {
                    lines.push(`  [${rec.severity.toUpperCase()}] ${rec.message}`);
                    if (rec.action) {
                        lines.push(`    Action: ${rec.action}`);
                    }
                });
            }

            return lines.join('\n');
        } catch (error) {
            throw new PerformanceError('Failed to export report', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Update metrics with current values
     * 
     * @param elementCount Total element count
     * @param visibleElementCount Visible element count
     * @param renderTime Render time in ms
     * @param updateTime Update time in ms
     */
    updateMetrics(
        elementCount: number,
        visibleElementCount: number,
        renderTime: number,
        updateTime: number
    ): void {
        try {
            if (elementCount < 0 || visibleElementCount < 0) {
                throw new PerformanceError('Element counts must be non-negative', {
                    elementCount,
                    visibleElementCount,
                });
            }

            if (renderTime < 0 || updateTime < 0) {
                throw new PerformanceError('Times must be non-negative', {
                    renderTime,
                    updateTime,
                });
            }

            const now = performance.now();
            const deltaTime = now - this.lastFrameTime;
            const fps = deltaTime > 0 ? 1000 / deltaTime : 0;

            const memoryUsage = this.getMemoryUsage();

            const metrics: PerformanceMetrics = {
                fps: Math.min(fps, 60), // Cap at 60 FPS
                renderTime,
                updateTime,
                memoryUsage,
                elementCount,
                visibleElementCount,
                timestamp: Date.now(),
            };

            this.metrics.push(metrics);

            // Keep only recent metrics
            if (this.metrics.length > this.maxMetricsHistory) {
                this.metrics = this.metrics.slice(-this.maxMetricsHistory);
            }

            this.lastFrameTime = now;
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to update metrics', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Measure frame performance
     */
    private measureFrame(): void {
        if (!this.isMonitoring) {
            return;
        }

        this.frameCount++;
        this.animationFrameId = requestAnimationFrame(() => {
            this.measureFrame();
        });
    }

    /**
     * Get memory usage
     * 
     * @returns Memory usage in bytes
     */
    private getMemoryUsage(): number {
        try {
            // Check if performance.memory is available (Chrome only)
            const perfMemory = (performance as any).memory;
            if (perfMemory && typeof perfMemory.usedJSHeapSize === 'number') {
                return perfMemory.usedJSHeapSize;
            }
            return 0;
        } catch {
            return 0;
        }
    }

    /**
     * Create empty metrics object
     * 
     * @returns Empty metrics
     */
    private createEmptyMetrics(): PerformanceMetrics {
        return {
            fps: 0,
            renderTime: 0,
            updateTime: 0,
            memoryUsage: 0,
            elementCount: 0,
            visibleElementCount: 0,
            timestamp: Date.now(),
        };
    }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
