/**
 * Performance profiler for detailed analysis
 * @module __tests__/performance/profiler
 */

/**
 * Profile entry
 */
export interface ProfileEntry {
    /** Entry name */
    name: string;
    /** Entry type */
    type: 'measure' | 'mark' | 'function';
    /** Start time */
    startTime: number;
    /** Duration */
    duration: number;
    /** Metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Profile report
 */
export interface ProfileReport {
    /** Report name */
    name: string;
    /** Total duration */
    totalDuration: number;
    /** Entries */
    entries: ProfileEntry[];
    /** Summary statistics */
    summary: {
        count: number;
        min: number;
        max: number;
        avg: number;
        median: number;
    };
}

/**
 * Performance profiler
 */
export class Profiler {
    private entries: ProfileEntry[] = [];
    private marks: Map<string, number> = new Map();
    private startTime: number = 0;

    /**
     * Start profiling
     */
    start(): void {
        this.entries = [];
        this.marks.clear();
        this.startTime = performance.now();
    }

    /**
     * Mark a point in time
     * @param name - Mark name
     * @param metadata - Optional metadata
     */
    mark(name: string, metadata?: Record<string, unknown>): void {
        const now = performance.now();
        this.marks.set(name, now);
        this.entries.push({
            name,
            type: 'mark',
            startTime: now,
            duration: 0,
            metadata,
        });
    }

    /**
     * Measure time between two marks
     * @param name - Measure name
     * @param startMark - Start mark name
     * @param endMark - End mark name
     * @param metadata - Optional metadata
     */
    measure(
        name: string,
        startMark: string,
        endMark: string,
        metadata?: Record<string, unknown>
    ): void {
        const startTime = this.marks.get(startMark);
        const endTime = this.marks.get(endMark);

        if (startTime === undefined || endTime === undefined) {
            throw new Error(`Mark not found: ${startMark} or ${endMark}`);
        }

        const duration = endTime - startTime;
        this.entries.push({
            name,
            type: 'measure',
            startTime,
            duration,
            metadata,
        });
    }

    /**
     * Profile a function
     * @param name - Function name
     * @param fn - Function to profile
     * @param metadata - Optional metadata
     * @returns Function result
     */
    profileFunction<T>(
        name: string,
        fn: () => T,
        metadata?: Record<string, unknown>
    ): T {
        const startTime = performance.now();
        try {
            return fn();
        } finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.entries.push({
                name,
                type: 'function',
                startTime,
                duration,
                metadata,
            });
        }
    }

    /**
     * Profile an async function
     * @param name - Function name
     * @param fn - Async function to profile
     * @param metadata - Optional metadata
     * @returns Function result
     */
    async profileAsyncFunction<T>(
        name: string,
        fn: () => Promise<T>,
        metadata?: Record<string, unknown>
    ): Promise<T> {
        const startTime = performance.now();
        try {
            return await fn();
        } finally {
            const endTime = performance.now();
            const duration = endTime - startTime;
            this.entries.push({
                name,
                type: 'function',
                startTime,
                duration,
                metadata,
            });
        }
    }

    /**
     * Get profile report
     * @param name - Report name
     * @returns Profile report
     */
    getReport(name: string = 'Profile Report'): ProfileReport {
        const durations = this.entries.map((e) => e.duration);
        const sorted = [...durations].sort((a, b) => a - b);

        const totalDuration = this.entries.reduce((sum, e) => sum + e.duration, 0);
        const min = sorted[0] || 0;
        const max = sorted[sorted.length - 1] || 0;
        const avg = durations.length > 0 ? totalDuration / durations.length : 0;
        const median =
            durations.length % 2 === 0
                ? (sorted[durations.length / 2 - 1] + sorted[durations.length / 2]) / 2
                : sorted[Math.floor(durations.length / 2)];

        return {
            name,
            totalDuration,
            entries: this.entries,
            summary: {
                count: this.entries.length,
                min,
                max,
                avg,
                median,
            },
        };
    }

    /**
     * Format report as string
     * @param report - Profile report
     * @returns Formatted string
     */
    static formatReport(report: ProfileReport): string {
        let output = `\n${report.name}\n`;
        output += '='.repeat(report.name.length) + '\n\n';

        output += `Total Duration: ${report.totalDuration.toFixed(2)}ms\n`;
        output += `Entry Count: ${report.summary.count}\n\n`;

        output += 'Summary Statistics:\n';
        output += `  Min: ${report.summary.min.toFixed(2)}ms\n`;
        output += `  Max: ${report.summary.max.toFixed(2)}ms\n`;
        output += `  Avg: ${report.summary.avg.toFixed(2)}ms\n`;
        output += `  Median: ${report.summary.median.toFixed(2)}ms\n\n`;

        output += 'Entries:\n';
        for (const entry of report.entries) {
            output += `  ${entry.name} (${entry.type}): ${entry.duration.toFixed(2)}ms\n`;
            if (entry.metadata) {
                output += `    Metadata: ${JSON.stringify(entry.metadata)}\n`;
            }
        }

        return output;
    }

    /**
     * Clear profiler
     */
    clear(): void {
        this.entries = [];
        this.marks.clear();
    }
}

/**
 * Global profiler instance
 */
export const globalProfiler = new Profiler();

/**
 * CPU profiler
 */
export class CPUProfiler {
    private samples: number[] = [];
    private sampleInterval: number = 10; // ms
    private isRunning: boolean = false;

    /**
     * Start CPU profiling
     * @param sampleInterval - Sample interval in ms
     */
    start(sampleInterval: number = 10): void {
        this.sampleInterval = sampleInterval;
        this.samples = [];
        this.isRunning = true;

        const sample = () => {
            if (this.isRunning) {
                this.samples.push(performance.now());
                setTimeout(sample, this.sampleInterval);
            }
        };

        sample();
    }

    /**
     * Stop CPU profiling
     * @returns CPU profile data
     */
    stop(): {
        sampleCount: number;
        duration: number;
        avgSampleInterval: number;
    } {
        this.isRunning = false;

        if (this.samples.length < 2) {
            return {
                sampleCount: this.samples.length,
                duration: 0,
                avgSampleInterval: 0,
            };
        }

        const duration = this.samples[this.samples.length - 1] - this.samples[0];
        const avgSampleInterval = duration / (this.samples.length - 1);

        return {
            sampleCount: this.samples.length,
            duration,
            avgSampleInterval,
        };
    }
}

/**
 * Memory profiler
 */
export class MemoryProfiler {
    private snapshots: Array<{
        timestamp: number;
        memory: number;
    }> = [];

    /**
     * Take memory snapshot
     */
    snapshot(): void {
        const memory = this.getMemoryUsage();
        this.snapshots.push({
            timestamp: performance.now(),
            memory,
        });
    }

    /**
     * Get memory usage
     * @returns Memory usage in bytes
     */
    private getMemoryUsage(): number {
        if (typeof performance !== 'undefined' && (performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
    }

    /**
     * Get memory profile
     * @returns Memory profile data
     */
    getProfile(): {
        snapshotCount: number;
        initialMemory: number;
        peakMemory: number;
        finalMemory: number;
        allocated: number;
        freed: number;
        avgMemory: number;
    } {
        if (this.snapshots.length === 0) {
            return {
                snapshotCount: 0,
                initialMemory: 0,
                peakMemory: 0,
                finalMemory: 0,
                allocated: 0,
                freed: 0,
                avgMemory: 0,
            };
        }

        const initialMemory = this.snapshots[0].memory;
        const finalMemory = this.snapshots[this.snapshots.length - 1].memory;
        const peakMemory = Math.max(...this.snapshots.map((s) => s.memory));
        const avgMemory =
            this.snapshots.reduce((sum, s) => sum + s.memory, 0) / this.snapshots.length;

        return {
            snapshotCount: this.snapshots.length,
            initialMemory,
            peakMemory,
            finalMemory,
            allocated: peakMemory - initialMemory,
            freed: peakMemory - finalMemory,
            avgMemory,
        };
    }

    /**
     * Clear snapshots
     */
    clear(): void {
        this.snapshots = [];
    }
}

/**
 * Rendering profiler
 */
export class RenderingProfiler {
    private frameTimings: number[] = [];
    private isRunning: boolean = false;
    private frameCount: number = 0;

    /**
     * Start rendering profiling
     */
    start(): void {
        this.frameTimings = [];
        this.frameCount = 0;
        this.isRunning = true;

        const measureFrame = () => {
            if (this.isRunning) {
                const startTime = performance.now();
                requestAnimationFrame(() => {
                    const endTime = performance.now();
                    this.frameTimings.push(endTime - startTime);
                    this.frameCount++;
                    measureFrame();
                });
            }
        };

        measureFrame();
    }

    /**
     * Stop rendering profiling
     * @returns Rendering profile data
     */
    stop(): {
        frameCount: number;
        avgFrameTime: number;
        fps: number;
        minFrameTime: number;
        maxFrameTime: number;
    } {
        this.isRunning = false;

        if (this.frameTimings.length === 0) {
            return {
                frameCount: 0,
                avgFrameTime: 0,
                fps: 0,
                minFrameTime: 0,
                maxFrameTime: 0,
            };
        }

        const avgFrameTime =
            this.frameTimings.reduce((a, b) => a + b, 0) / this.frameTimings.length;
        const fps = 1000 / avgFrameTime;
        const minFrameTime = Math.min(...this.frameTimings);
        const maxFrameTime = Math.max(...this.frameTimings);

        return {
            frameCount: this.frameCount,
            avgFrameTime,
            fps,
            minFrameTime,
            maxFrameTime,
        };
    }
}

export { };
