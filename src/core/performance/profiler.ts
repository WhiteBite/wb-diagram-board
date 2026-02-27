/**
 * Performance Profiler
 * 
 * Measures and tracks performance metrics
 */

import { ProfilerEntry, PerformanceError } from '../../types/performance';

/**
 * Performance profiler for measuring code execution time
 */
export class Profiler {
    private entries: ProfilerEntry[] = [];
    private startTimes = new Map<string, number>();
    private readonly maxEntries = 10000;

    /**
     * Start measuring a code block
     * 
     * @param label Measurement label
     * @throws PerformanceError if label is invalid
     */
    start(label: string): void {
        try {
            if (typeof label !== 'string' || label.length === 0) {
                throw new PerformanceError('Label must be a non-empty string', { label });
            }

            this.startTimes.set(label, performance.now());
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to start profiling', {
                error: error instanceof Error ? error.message : String(error),
                label,
            });
        }
    }

    /**
     * End measuring a code block
     * 
     * @param label Measurement label
     * @returns Duration in milliseconds
     * @throws PerformanceError if label was not started
     */
    end(label: string): number {
        try {
            if (typeof label !== 'string' || label.length === 0) {
                throw new PerformanceError('Label must be a non-empty string', { label });
            }

            const startTime = this.startTimes.get(label);
            if (startTime === undefined) {
                throw new PerformanceError('Profiler not started for label', { label });
            }

            const duration = performance.now() - startTime;
            this.startTimes.delete(label);

            const entry: ProfilerEntry = {
                label,
                duration,
                timestamp: Date.now(),
            };

            this.entries.push(entry);

            // Keep only recent entries to avoid memory bloat
            if (this.entries.length > this.maxEntries) {
                this.entries = this.entries.slice(-this.maxEntries);
            }

            return duration;
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to end profiling', {
                error: error instanceof Error ? error.message : String(error),
                label,
            });
        }
    }

    /**
     * Get all profiler entries
     * 
     * @returns Array of profiler entries
     */
    getMetrics(): readonly ProfilerEntry[] {
        try {
            return Object.freeze([...this.entries]);
        } catch (error) {
            throw new PerformanceError('Failed to get metrics', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get average time for a label
     * 
     * @param label Measurement label
     * @returns Average duration in milliseconds
     */
    getAverageTime(label: string): number {
        try {
            if (typeof label !== 'string' || label.length === 0) {
                throw new PerformanceError('Label must be a non-empty string', { label });
            }

            const matching = this.entries.filter((e) => e.label === label);

            if (matching.length === 0) {
                return 0;
            }

            const sum = matching.reduce((acc, e) => acc + e.duration, 0);
            return sum / matching.length;
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get average time', {
                error: error instanceof Error ? error.message : String(error),
                label,
            });
        }
    }

    /**
     * Get maximum time for a label
     * 
     * @param label Measurement label
     * @returns Maximum duration in milliseconds
     */
    getMaxTime(label: string): number {
        try {
            if (typeof label !== 'string' || label.length === 0) {
                throw new PerformanceError('Label must be a non-empty string', { label });
            }

            const matching = this.entries.filter((e) => e.label === label);

            if (matching.length === 0) {
                return 0;
            }

            return Math.max(...matching.map((e) => e.duration));
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get max time', {
                error: error instanceof Error ? error.message : String(error),
                label,
            });
        }
    }

    /**
     * Get minimum time for a label
     * 
     * @param label Measurement label
     * @returns Minimum duration in milliseconds
     */
    getMinTime(label: string): number {
        try {
            if (typeof label !== 'string' || label.length === 0) {
                throw new PerformanceError('Label must be a non-empty string', { label });
            }

            const matching = this.entries.filter((e) => e.label === label);

            if (matching.length === 0) {
                return 0;
            }

            return Math.min(...matching.map((e) => e.duration));
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get min time', {
                error: error instanceof Error ? error.message : String(error),
                label,
            });
        }
    }

    /**
     * Clear all profiler data
     */
    clear(): void {
        try {
            this.entries = [];
            this.startTimes.clear();
        } catch (error) {
            throw new PerformanceError('Failed to clear profiler', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get profiler report as string
     * 
     * @returns Formatted report
     */
    getReport(): string {
        try {
            const labels = new Set(this.entries.map((e) => e.label));
            const lines: string[] = ['=== Performance Report ==='];

            labels.forEach((label) => {
                const avg = this.getAverageTime(label);
                const max = this.getMaxTime(label);
                const min = this.getMinTime(label);
                const count = this.entries.filter((e) => e.label === label).length;

                lines.push(`${label}:`);
                lines.push(`  Count: ${count}`);
                lines.push(`  Avg: ${avg.toFixed(2)}ms`);
                lines.push(`  Min: ${min.toFixed(2)}ms`);
                lines.push(`  Max: ${max.toFixed(2)}ms`);
            });

            return lines.join('\n');
        } catch (error) {
            throw new PerformanceError('Failed to generate report', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}

/**
 * Global profiler instance
 */
export const profiler = new Profiler();
