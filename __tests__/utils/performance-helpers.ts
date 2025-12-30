/**
 * Performance testing utilities and helpers
 * @module __tests__/utils/performance-helpers
 */

/**
 * Performance measurement result
 */
export interface PerformanceMeasurement {
    /** Operation name */
    name: string;
    /** Execution time in milliseconds */
    duration: number;
    /** Memory used in bytes */
    memoryUsed?: number;
    /** Timestamp when measurement started */
    startTime: number;
    /** Timestamp when measurement ended */
    endTime: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
    /** Benchmark name */
    name: string;
    /** Number of iterations */
    iterations: number;
    /** Minimum duration (ms) */
    min: number;
    /** Maximum duration (ms) */
    max: number;
    /** Average duration (ms) */
    avg: number;
    /** Median duration (ms) */
    median: number;
    /** Standard deviation */
    stdDev: number;
    /** All measurements */
    measurements: number[];
}

/**
 * Memory profile
 */
export interface MemoryProfile {
    /** Initial memory usage (bytes) */
    initialMemory: number;
    /** Peak memory usage (bytes) */
    peakMemory: number;
    /** Final memory usage (bytes) */
    finalMemory: number;
    /** Memory allocated (bytes) */
    allocated: number;
    /** Memory freed (bytes) */
    freed: number;
}

/**
 * Performance threshold
 */
export interface PerformanceThreshold {
    /** Operation name */
    name: string;
    /** Maximum acceptable duration (ms) */
    maxDuration: number;
    /** Minimum acceptable throughput (ops/sec) */
    minThroughput?: number;
}

/**
 * Measure execution time of a function
 * @param fn - Function to measure
 * @param name - Measurement name
 * @returns Performance measurement
 */
export async function measurePerformance<T>(
    fn: () => T | Promise<T>,
    name: string = 'operation'
): Promise<PerformanceMeasurement> {
    const startTime = performance.now();
    const initialMemory = getMemoryUsage();

    try {
        await fn();
    } catch (error) {
        // Continue measurement even if function throws
    }

    const endTime = performance.now();
    const finalMemory = getMemoryUsage();

    return {
        name,
        duration: endTime - startTime,
        memoryUsed: finalMemory - initialMemory,
        startTime,
        endTime,
    };
}

/**
 * Run benchmark with multiple iterations
 * @param fn - Function to benchmark
 * @param iterations - Number of iterations
 * @param name - Benchmark name
 * @returns Benchmark result
 */
export async function runBenchmark<T>(
    fn: () => T | Promise<T>,
    iterations: number = 100,
    name: string = 'benchmark'
): Promise<BenchmarkResult> {
    const measurements: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        try {
            await fn();
        } catch (error) {
            // Continue benchmark even if function throws
        }
        const endTime = performance.now();
        measurements.push(endTime - startTime);
    }

    return calculateBenchmarkStats(measurements, name, iterations);
}

/**
 * Calculate benchmark statistics
 * @param measurements - Array of measurements
 * @param name - Benchmark name
 * @param iterations - Number of iterations
 * @returns Benchmark result
 */
export function calculateBenchmarkStats(
    measurements: number[],
    name: string = 'benchmark',
    iterations: number = measurements.length
): BenchmarkResult {
    const sorted = [...measurements].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const median =
        measurements.length % 2 === 0
            ? (sorted[measurements.length / 2 - 1] + sorted[measurements.length / 2]) / 2
            : sorted[Math.floor(measurements.length / 2)];

    const variance =
        measurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
        measurements.length;
    const stdDev = Math.sqrt(variance);

    return {
        name,
        iterations,
        min,
        max,
        avg,
        median,
        stdDev,
        measurements,
    };
}

/**
 * Get current memory usage in bytes
 * @returns Memory usage in bytes
 */
export function getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
        return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
}

/**
 * Profile memory usage during function execution
 * @param fn - Function to profile
 * @returns Memory profile
 */
export async function profileMemory<T>(
    fn: () => T | Promise<T>
): Promise<MemoryProfile> {
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }

    const initialMemory = getMemoryUsage();
    let peakMemory = initialMemory;

    // Monitor memory during execution
    const interval = setInterval(() => {
        const current = getMemoryUsage();
        if (current > peakMemory) {
            peakMemory = current;
        }
    }, 10);

    try {
        await fn();
    } finally {
        clearInterval(interval);
    }

    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }

    const finalMemory = getMemoryUsage();

    return {
        initialMemory,
        peakMemory,
        finalMemory,
        allocated: peakMemory - initialMemory,
        freed: peakMemory - finalMemory,
    };
}

/**
 * Check if performance meets threshold
 * @param measurement - Performance measurement
 * @param threshold - Performance threshold
 * @returns True if performance meets threshold
 */
export function meetsThreshold(
    measurement: PerformanceMeasurement,
    threshold: PerformanceThreshold
): boolean {
    return measurement.duration <= threshold.maxDuration;
}

/**
 * Check if benchmark meets threshold
 * @param benchmark - Benchmark result
 * @param threshold - Performance threshold
 * @returns True if benchmark meets threshold
 */
export function benchmarkMeetsThreshold(
    benchmark: BenchmarkResult,
    threshold: PerformanceThreshold
): boolean {
    if (benchmark.avg > threshold.maxDuration) {
        return false;
    }

    if (threshold.minThroughput) {
        const throughput = 1000 / benchmark.avg; // ops/sec
        return throughput >= threshold.minThroughput;
    }

    return true;
}

/**
 * Format performance measurement for display
 * @param measurement - Performance measurement
 * @returns Formatted string
 */
export function formatMeasurement(measurement: PerformanceMeasurement): string {
    let result = `${measurement.name}: ${measurement.duration.toFixed(2)}ms`;

    if (measurement.memoryUsed) {
        result += ` (${formatBytes(measurement.memoryUsed)})`;
    }

    return result;
}

/**
 * Format benchmark result for display
 * @param benchmark - Benchmark result
 * @returns Formatted string
 */
export function formatBenchmark(benchmark: BenchmarkResult): string {
    return (
        `${benchmark.name}:\n` +
        `  Iterations: ${benchmark.iterations}\n` +
        `  Min: ${benchmark.min.toFixed(2)}ms\n` +
        `  Max: ${benchmark.max.toFixed(2)}ms\n` +
        `  Avg: ${benchmark.avg.toFixed(2)}ms\n` +
        `  Median: ${benchmark.median.toFixed(2)}ms\n` +
        `  StdDev: ${benchmark.stdDev.toFixed(2)}ms`
    );
}

/**
 * Format memory profile for display
 * @param profile - Memory profile
 * @returns Formatted string
 */
export function formatMemoryProfile(profile: MemoryProfile): string {
    return (
        `Memory Profile:\n` +
        `  Initial: ${formatBytes(profile.initialMemory)}\n` +
        `  Peak: ${formatBytes(profile.peakMemory)}\n` +
        `  Final: ${formatBytes(profile.finalMemory)}\n` +
        `  Allocated: ${formatBytes(profile.allocated)}\n` +
        `  Freed: ${formatBytes(profile.freed)}`
    );
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create performance observer
 * @param callback - Callback function
 * @returns Performance observer
 */
export function createPerformanceObserver(
    callback: (entries: PerformanceEntryList) => void
): PerformanceObserver {
    const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
    });

    return observer;
}

/**
 * Measure rendering performance
 * @param fn - Function that triggers rendering
 * @returns Rendering performance data
 */
export async function measureRenderingPerformance<T>(
    fn: () => T | Promise<T>
): Promise<{
    duration: number;
    frameCount: number;
    fps: number;
}> {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
            lastTime = currentTime;
        }
        requestAnimationFrame(countFrames);
    };

    const frameCounter = requestAnimationFrame(countFrames);

    const startTime = performance.now();
    await fn();
    const endTime = performance.now();

    cancelAnimationFrame(frameCounter);

    const duration = endTime - startTime;
    const fps = (frameCount / duration) * 1000;

    return {
        duration,
        frameCount,
        fps,
    };
}

/**
 * Measure DOM operation performance
 * @param fn - Function that performs DOM operations
 * @returns DOM operation performance data
 */
export async function measureDOMPerformance<T>(
    fn: () => T | Promise<T>
): Promise<{
    duration: number;
    reflows: number;
    repaints: number;
}> {
    // Note: Actual reflow/repaint counting requires browser APIs
    // This is a simplified version
    const startTime = performance.now();
    await fn();
    const endTime = performance.now();

    return {
        duration: endTime - startTime,
        reflows: 0, // Would need browser-specific APIs
        repaints: 0, // Would need browser-specific APIs
    };
}

/**
 * Compare two benchmark results
 * @param before - Benchmark before optimization
 * @param after - Benchmark after optimization
 * @returns Comparison result
 */
export function compareBenchmarks(
    before: BenchmarkResult,
    after: BenchmarkResult
): {
    improvement: number;
    percentChange: number;
    isImprovement: boolean;
} {
    const improvement = before.avg - after.avg;
    const percentChange = (improvement / before.avg) * 100;

    return {
        improvement,
        percentChange,
        isImprovement: improvement > 0,
    };
}

/**
 * Create performance report
 * @param benchmarks - Array of benchmark results
 * @returns Performance report
 */
export function createPerformanceReport(
    benchmarks: BenchmarkResult[]
): string {
    let report = 'Performance Report\n';
    report += '==================\n\n';

    for (const benchmark of benchmarks) {
        report += formatBenchmark(benchmark) + '\n\n';
    }

    return report;
}

/**
 * Assert performance threshold
 * @param measurement - Performance measurement
 * @param maxDuration - Maximum acceptable duration (ms)
 * @param message - Error message
 */
export function assertPerformance(
    measurement: PerformanceMeasurement,
    maxDuration: number,
    message?: string
): void {
    if (measurement.duration > maxDuration) {
        throw new Error(
            message ||
            `Performance threshold exceeded: ${measurement.duration.toFixed(2)}ms > ${maxDuration}ms`
        );
    }
}

/**
 * Assert benchmark performance
 * @param benchmark - Benchmark result
 * @param maxDuration - Maximum acceptable average duration (ms)
 * @param message - Error message
 */
export function assertBenchmarkPerformance(
    benchmark: BenchmarkResult,
    maxDuration: number,
    message?: string
): void {
    if (benchmark.avg > maxDuration) {
        throw new Error(
            message ||
            `Benchmark threshold exceeded: ${benchmark.avg.toFixed(2)}ms > ${maxDuration}ms`
        );
    }
}

export { };
