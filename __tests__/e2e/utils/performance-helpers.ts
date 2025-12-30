/**
 * Performance Helpers - Metrics collection and performance testing utilities
 *
 * Provides comprehensive performance measurement tools for E2E testing
 */

import { Page } from '@playwright/test';

// =============================================================================
// Types
// =============================================================================

export interface PerformanceMetrics {
    /** First Contentful Paint in ms */
    fcp: number | null;
    /** Largest Contentful Paint in ms */
    lcp: number | null;
    /** Time to Interactive in ms */
    tti: number | null;
    /** Cumulative Layout Shift score */
    cls: number | null;
    /** First Input Delay in ms */
    fid: number | null;
    /** Total Blocking Time in ms */
    tbt: number | null;
}

export interface FrameRateMetrics {
    /** Average FPS during measurement */
    averageFps: number;
    /** Minimum FPS recorded */
    minFps: number;
    /** Maximum FPS recorded */
    maxFps: number;
    /** Number of dropped frames */
    droppedFrames: number;
    /** Total frames measured */
    totalFrames: number;
    /** Frame times in ms */
    frameTimes: number[];
    /** Jank score (frames > 16.67ms) */
    jankScore: number;
}

export interface RenderMetrics {
    /** Time to first render in ms */
    firstRenderTime: number;
    /** Time to complete render in ms */
    totalRenderTime: number;
    /** Number of repaints */
    repaintCount: number;
    /** Number of reflows */
    reflowCount: number;
}

export interface PerformanceBudget {
    /** Max render time for N elements in ms */
    maxRenderTime: number;
    /** Min acceptable FPS */
    minFps: number;
    /** Max memory usage in MB */
    maxMemoryMB: number;
    /** Max FCP in ms */
    maxFcp?: number;
    /** Max LCP in ms */
    maxLcp?: number;
}

export interface PerformanceResult {
    passed: boolean;
    metrics: Record<string, number>;
    violations: string[];
    warnings: string[];
}

export interface TimingResult {
    duration: number;
    startTime: number;
    endTime: number;
}

export interface StatisticalResult {
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
    p95: number;
    p99: number;
    samples: number[];
}

// =============================================================================
// Performance Budgets
// =============================================================================

export const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
    '1000_ELEMENTS': {
        maxRenderTime: 100,
        minFps: 60,
        maxMemoryMB: 100,
        maxFcp: 1000,
        maxLcp: 2000,
    },
    '5000_ELEMENTS': {
        maxRenderTime: 500,
        minFps: 30,
        maxMemoryMB: 250,
        maxFcp: 2000,
        maxLcp: 4000,
    },
    '10000_ELEMENTS': {
        maxRenderTime: 2000,
        minFps: 15,
        maxMemoryMB: 500,
        maxFcp: 3000,
        maxLcp: 6000,
    },
} as const;

// =============================================================================
// Core Performance Measurement
// =============================================================================

/**
 * Measure execution time of an async operation
 */
export async function measureTime<T>(
    operation: () => Promise<T>
): Promise<{ result: T; timing: TimingResult }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();

    return {
        result,
        timing: {
            duration: endTime - startTime,
            startTime,
            endTime,
        },
    };
}

/**
 * Run operation multiple times and collect statistics
 */
export async function measureWithStatistics<T>(
    operation: () => Promise<T>,
    runs: number = 5,
    warmupRuns: number = 1
): Promise<{ results: T[]; stats: StatisticalResult }> {
    const samples: number[] = [];
    const results: T[] = [];

    // Warmup runs (not counted)
    for (let i = 0; i < warmupRuns; i++) {
        await operation();
    }

    // Actual measurement runs
    for (let i = 0; i < runs; i++) {
        const { result, timing } = await measureTime(operation);
        samples.push(timing.duration);
        results.push(result);
    }

    return {
        results,
        stats: calculateStatistics(samples),
    };
}

/**
 * Calculate statistical metrics from samples
 */
export function calculateStatistics(samples: number[]): StatisticalResult {
    if (samples.length === 0) {
        return {
            mean: 0,
            median: 0,
            min: 0,
            max: 0,
            stdDev: 0,
            p95: 0,
            p99: 0,
            samples: [],
        };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((a, b) => a + b, 0);
    const mean = sum / samples.length;

    const squaredDiffs = samples.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / samples.length;
    const stdDev = Math.sqrt(variance);

    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p99Index = Math.ceil(sorted.length * 0.99) - 1;

    return {
        mean,
        median,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        stdDev,
        p95: sorted[Math.min(p95Index, sorted.length - 1)],
        p99: sorted[Math.min(p99Index, sorted.length - 1)],
        samples,
    };
}

// =============================================================================
// Web Vitals Collection
// =============================================================================

/**
 * Collect Core Web Vitals metrics from page
 */
export async function collectWebVitals(page: Page): Promise<PerformanceMetrics> {
    return page.evaluate(() => {
        const metrics: PerformanceMetrics = {
            fcp: null,
            lcp: null,
            tti: null,
            cls: null,
            fid: null,
            tbt: null,
        };

        // Get paint timing
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
        if (fcpEntry) {
            metrics.fcp = fcpEntry.startTime;
        }

        // Get LCP from PerformanceObserver if available
        const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
        if (lcpEntries.length > 0) {
            metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
        }

        // Get navigation timing for TTI approximation
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (navEntries.length > 0) {
            const nav = navEntries[0];
            // Approximate TTI as domInteractive
            metrics.tti = nav.domInteractive;
        }

        // Get layout shift entries for CLS
        const layoutShiftEntries = performance.getEntriesByType('layout-shift') as any[];
        if (layoutShiftEntries.length > 0) {
            metrics.cls = layoutShiftEntries.reduce((sum, entry) => {
                if (!entry.hadRecentInput) {
                    return sum + entry.value;
                }
                return sum;
            }, 0);
        }

        return metrics;
    });
}

/**
 * Setup performance observers for continuous monitoring
 */
export async function setupPerformanceObservers(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as any).__perfMetrics = {
            lcp: 0,
            cls: 0,
            fid: 0,
            longTasks: [],
        };

        // LCP Observer
        try {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                (window as any).__perfMetrics.lcp = lastEntry.startTime;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            // Not supported
        }

        // CLS Observer
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as any[]) {
                    if (!entry.hadRecentInput) {
                        (window as any).__perfMetrics.cls += entry.value;
                    }
                }
            }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            // Not supported
        }

        // Long Task Observer
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    (window as any).__perfMetrics.longTasks.push({
                        duration: entry.duration,
                        startTime: entry.startTime,
                    });
                }
            }).observe({ type: 'longtask', buffered: true });
        } catch (e) {
            // Not supported
        }
    });
}

/**
 * Get collected performance metrics
 */
export async function getCollectedMetrics(page: Page): Promise<{
    lcp: number;
    cls: number;
    longTasks: Array<{ duration: number; startTime: number }>;
}> {
    return page.evaluate(() => {
        return (window as any).__perfMetrics || { lcp: 0, cls: 0, longTasks: [] };
    });
}

// =============================================================================
// Frame Rate Measurement
// =============================================================================

/**
 * Start measuring frame rate
 */
export async function startFrameRateMeasurement(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as any).__frameMetrics = {
            frameTimes: [] as number[],
            lastFrameTime: performance.now(),
            isRunning: true,
            rafId: 0,
        };

        const measureFrame = () => {
            const metrics = (window as any).__frameMetrics;
            if (!metrics.isRunning) return;

            const now = performance.now();
            const frameTime = now - metrics.lastFrameTime;
            metrics.frameTimes.push(frameTime);
            metrics.lastFrameTime = now;

            metrics.rafId = requestAnimationFrame(measureFrame);
        };

        (window as any).__frameMetrics.rafId = requestAnimationFrame(measureFrame);
    });
}

/**
 * Stop measuring frame rate and get results
 */
export async function stopFrameRateMeasurement(page: Page): Promise<FrameRateMetrics> {
    return page.evaluate(() => {
        const metrics = (window as any).__frameMetrics;
        if (!metrics) {
            return {
                averageFps: 0,
                minFps: 0,
                maxFps: 0,
                droppedFrames: 0,
                totalFrames: 0,
                frameTimes: [],
                jankScore: 0,
            };
        }

        metrics.isRunning = false;
        cancelAnimationFrame(metrics.rafId);

        const frameTimes = metrics.frameTimes.slice(1); // Skip first frame
        if (frameTimes.length === 0) {
            return {
                averageFps: 0,
                minFps: 0,
                maxFps: 0,
                droppedFrames: 0,
                totalFrames: 0,
                frameTimes: [],
                jankScore: 0,
            };
        }

        const avgFrameTime = frameTimes.reduce((a: number, b: number) => a + b, 0) / frameTimes.length;
        const minFrameTime = Math.min(...frameTimes);
        const maxFrameTime = Math.max(...frameTimes);

        // Count frames that took longer than 16.67ms (60fps threshold)
        const droppedFrames = frameTimes.filter((t: number) => t > 16.67).length;
        const jankScore = (droppedFrames / frameTimes.length) * 100;

        return {
            averageFps: 1000 / avgFrameTime,
            minFps: 1000 / maxFrameTime,
            maxFps: 1000 / minFrameTime,
            droppedFrames,
            totalFrames: frameTimes.length,
            frameTimes,
            jankScore,
        };
    });
}

/**
 * Measure frame rate during an operation
 */
export async function measureFrameRate(
    page: Page,
    operation: () => Promise<void>,
    durationMs: number = 1000
): Promise<FrameRateMetrics> {
    await startFrameRateMeasurement(page);
    await operation();
    await page.waitForTimeout(durationMs);
    return stopFrameRateMeasurement(page);
}

// =============================================================================
// Render Performance
// =============================================================================

/**
 * Measure render time for canvas operations
 */
export async function measureRenderTime(
    page: Page,
    operation: () => Promise<void>
): Promise<RenderMetrics> {
    // Mark start
    await page.evaluate(() => {
        (window as any).__renderStart = performance.now();
        (window as any).__repaintCount = 0;
        (window as any).__reflowCount = 0;
    });

    // Perform operation
    await operation();

    // Wait for render to complete
    await page.evaluate(() => {
        return new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    (window as any).__renderEnd = performance.now();
                    resolve();
                });
            });
        });
    });

    // Get metrics
    return page.evaluate(() => {
        const start = (window as any).__renderStart || 0;
        const end = (window as any).__renderEnd || performance.now();

        return {
            firstRenderTime: end - start,
            totalRenderTime: end - start,
            repaintCount: (window as any).__repaintCount || 0,
            reflowCount: (window as any).__reflowCount || 0,
        };
    });
}

/**
 * Wait for idle state (no pending renders)
 */
export async function waitForIdle(page: Page, timeout: number = 5000): Promise<void> {
    await page.evaluate((timeoutMs) => {
        return new Promise<void>((resolve, reject) => {
            const startTime = performance.now();

            const checkIdle = () => {
                if (performance.now() - startTime > timeoutMs) {
                    reject(new Error('Timeout waiting for idle'));
                    return;
                }

                // Use requestIdleCallback if available
                if ('requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(() => resolve(), { timeout: 100 });
                } else {
                    // Fallback: wait for two animation frames
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => resolve());
                    });
                }
            };

            checkIdle();
        });
    }, timeout);
}

// =============================================================================
// Performance Budget Validation
// =============================================================================

/**
 * Validate performance against budget
 */
export function validatePerformanceBudget(
    metrics: {
        renderTime?: number;
        fps?: number;
        memoryMB?: number;
        fcp?: number | null;
        lcp?: number | null;
    },
    budget: PerformanceBudget
): PerformanceResult {
    const violations: string[] = [];
    const warnings: string[] = [];
    const collectedMetrics: Record<string, number> = {};

    // Check render time
    if (metrics.renderTime !== undefined) {
        collectedMetrics.renderTime = metrics.renderTime;
        if (metrics.renderTime > budget.maxRenderTime) {
            violations.push(
                `Render time ${metrics.renderTime.toFixed(0)}ms exceeds budget ${budget.maxRenderTime}ms`
            );
        } else if (metrics.renderTime > budget.maxRenderTime * 0.8) {
            warnings.push(
                `Render time ${metrics.renderTime.toFixed(0)}ms is close to budget ${budget.maxRenderTime}ms`
            );
        }
    }

    // Check FPS
    if (metrics.fps !== undefined) {
        collectedMetrics.fps = metrics.fps;
        if (metrics.fps < budget.minFps) {
            violations.push(
                `FPS ${metrics.fps.toFixed(1)} is below minimum ${budget.minFps}`
            );
        } else if (metrics.fps < budget.minFps * 1.2) {
            warnings.push(
                `FPS ${metrics.fps.toFixed(1)} is close to minimum ${budget.minFps}`
            );
        }
    }

    // Check memory
    if (metrics.memoryMB !== undefined) {
        collectedMetrics.memoryMB = metrics.memoryMB;
        if (metrics.memoryMB > budget.maxMemoryMB) {
            violations.push(
                `Memory ${metrics.memoryMB.toFixed(1)}MB exceeds budget ${budget.maxMemoryMB}MB`
            );
        } else if (metrics.memoryMB > budget.maxMemoryMB * 0.8) {
            warnings.push(
                `Memory ${metrics.memoryMB.toFixed(1)}MB is close to budget ${budget.maxMemoryMB}MB`
            );
        }
    }

    // Check FCP
    if (metrics.fcp !== undefined && metrics.fcp !== null && budget.maxFcp) {
        collectedMetrics.fcp = metrics.fcp;
        if (metrics.fcp > budget.maxFcp) {
            violations.push(
                `FCP ${metrics.fcp.toFixed(0)}ms exceeds budget ${budget.maxFcp}ms`
            );
        }
    }

    // Check LCP
    if (metrics.lcp !== undefined && metrics.lcp !== null && budget.maxLcp) {
        collectedMetrics.lcp = metrics.lcp;
        if (metrics.lcp > budget.maxLcp) {
            violations.push(
                `LCP ${metrics.lcp.toFixed(0)}ms exceeds budget ${budget.maxLcp}ms`
            );
        }
    }

    return {
        passed: violations.length === 0,
        metrics: collectedMetrics,
        violations,
        warnings,
    };
}

// =============================================================================
// Reporting
// =============================================================================

/**
 * Format performance report for console output
 */
export function formatPerformanceReport(
    testName: string,
    result: PerformanceResult,
    stats?: StatisticalResult
): string {
    const lines: string[] = [
        `\n${'='.repeat(60)}`,
        `Performance Report: ${testName}`,
        `${'='.repeat(60)}`,
        '',
        `Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`,
        '',
        'Metrics:',
    ];

    for (const [key, value] of Object.entries(result.metrics)) {
        lines.push(`  ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
    }

    if (stats) {
        lines.push('', 'Statistics:');
        lines.push(`  Mean: ${stats.mean.toFixed(2)}ms`);
        lines.push(`  Median: ${stats.median.toFixed(2)}ms`);
        lines.push(`  Min: ${stats.min.toFixed(2)}ms`);
        lines.push(`  Max: ${stats.max.toFixed(2)}ms`);
        lines.push(`  Std Dev: ${stats.stdDev.toFixed(2)}ms`);
        lines.push(`  P95: ${stats.p95.toFixed(2)}ms`);
        lines.push(`  P99: ${stats.p99.toFixed(2)}ms`);
    }

    if (result.violations.length > 0) {
        lines.push('', 'Violations:');
        result.violations.forEach(v => lines.push(`  ❌ ${v}`));
    }

    if (result.warnings.length > 0) {
        lines.push('', 'Warnings:');
        result.warnings.forEach(w => lines.push(`  ⚠️ ${w}`));
    }

    lines.push(`${'='.repeat(60)}\n`);

    return lines.join('\n');
}

/**
 * Create JSON report for CI integration
 */
export function createJsonReport(
    testName: string,
    result: PerformanceResult,
    stats?: StatisticalResult
): Record<string, unknown> {
    return {
        testName,
        timestamp: new Date().toISOString(),
        passed: result.passed,
        metrics: result.metrics,
        statistics: stats ? {
            mean: stats.mean,
            median: stats.median,
            min: stats.min,
            max: stats.max,
            stdDev: stats.stdDev,
            p95: stats.p95,
            p99: stats.p99,
            sampleCount: stats.samples.length,
        } : null,
        violations: result.violations,
        warnings: result.warnings,
    };
}
