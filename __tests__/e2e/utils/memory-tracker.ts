/**
 * Memory Tracker - Memory monitoring and leak detection utilities
 *
 * Provides comprehensive memory tracking for performance testing
 */

import { Page } from '@playwright/test';

// =============================================================================
// Types
// =============================================================================

export interface MemorySnapshot {
    /** Timestamp of snapshot */
    timestamp: number;
    /** Used JS heap size in bytes */
    usedJSHeapSize: number;
    /** Total JS heap size in bytes */
    totalJSHeapSize: number;
    /** JS heap size limit in bytes */
    jsHeapSizeLimit: number;
    /** DOM node count */
    domNodeCount: number;
    /** Event listener count */
    eventListenerCount: number;
    /** Label for this snapshot */
    label?: string;
}

export interface MemoryDelta {
    /** Change in used heap size in bytes */
    heapDelta: number;
    /** Change in DOM nodes */
    domNodeDelta: number;
    /** Change in event listeners */
    listenerDelta: number;
    /** Percentage change in heap */
    heapDeltaPercent: number;
    /** Time between snapshots in ms */
    timeDelta: number;
}

export interface MemoryLeakResult {
    /** Whether a leak was detected */
    hasLeak: boolean;
    /** Leak severity: none, minor, moderate, severe */
    severity: 'none' | 'minor' | 'moderate' | 'severe';
    /** Memory growth in bytes */
    memoryGrowth: number;
    /** Memory growth percentage */
    memoryGrowthPercent: number;
    /** DOM node growth */
    domNodeGrowth: number;
    /** Event listener growth */
    listenerGrowth: number;
    /** Detailed message */
    message: string;
    /** All snapshots taken */
    snapshots: MemorySnapshot[];
}

export interface MemoryTrackerOptions {
    /** Interval between automatic snapshots in ms */
    snapshotInterval?: number;
    /** Maximum number of snapshots to keep */
    maxSnapshots?: number;
    /** Threshold for leak detection (percentage) */
    leakThresholdPercent?: number;
    /** Force garbage collection before snapshots */
    forceGC?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Required<MemoryTrackerOptions> = {
    snapshotInterval: 1000,
    maxSnapshots: 100,
    leakThresholdPercent: 20,
    forceGC: true,
};

const LEAK_THRESHOLDS = {
    MINOR: 10,      // 10% growth
    MODERATE: 25,   // 25% growth
    SEVERE: 50,     // 50% growth
} as const;

// =============================================================================
// Memory Snapshot Functions
// =============================================================================

/**
 * Take a memory snapshot
 */
export async function takeMemorySnapshot(
    page: Page,
    label?: string,
    forceGC: boolean = true
): Promise<MemorySnapshot | null> {
    // Try to force garbage collection if available
    if (forceGC) {
        await page.evaluate(() => {
            if ((window as any).gc) {
                (window as any).gc();
            }
        });
        // Wait for GC to complete
        await page.waitForTimeout(100);
    }

    return page.evaluate((snapshotLabel) => {
        const memory = (performance as any).memory;

        // Count DOM nodes
        const domNodeCount = document.getElementsByTagName('*').length;

        // Estimate event listener count (not perfectly accurate)
        let eventListenerCount = 0;
        try {
            const allElements = document.querySelectorAll('*');
            // This is an approximation - actual count requires devtools protocol
            eventListenerCount = allElements.length; // Placeholder
        } catch {
            eventListenerCount = 0;
        }

        if (!memory) {
            return {
                timestamp: Date.now(),
                usedJSHeapSize: 0,
                totalJSHeapSize: 0,
                jsHeapSizeLimit: 0,
                domNodeCount,
                eventListenerCount,
                label: snapshotLabel,
            };
        }

        return {
            timestamp: Date.now(),
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
            domNodeCount,
            eventListenerCount,
            label: snapshotLabel,
        };
    }, label);
}

/**
 * Calculate delta between two snapshots
 */
export function calculateMemoryDelta(
    before: MemorySnapshot,
    after: MemorySnapshot
): MemoryDelta {
    const heapDelta = after.usedJSHeapSize - before.usedJSHeapSize;
    const heapDeltaPercent = before.usedJSHeapSize > 0
        ? (heapDelta / before.usedJSHeapSize) * 100
        : 0;

    return {
        heapDelta,
        domNodeDelta: after.domNodeCount - before.domNodeCount,
        listenerDelta: after.eventListenerCount - before.eventListenerCount,
        heapDeltaPercent,
        timeDelta: after.timestamp - before.timestamp,
    };
}

// =============================================================================
// Memory Tracker Class
// =============================================================================

/**
 * Memory tracker for continuous monitoring
 */
export class MemoryTracker {
    private page: Page;
    private options: Required<MemoryTrackerOptions>;
    private snapshots: MemorySnapshot[] = [];
    private intervalId: NodeJS.Timeout | null = null;
    private isTracking: boolean = false;

    constructor(page: Page, options: MemoryTrackerOptions = {}) {
        this.page = page;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Start tracking memory
     */
    async start(): Promise<void> {
        if (this.isTracking) return;

        this.isTracking = true;
        this.snapshots = [];

        // Take initial snapshot
        const initial = await takeMemorySnapshot(this.page, 'initial', this.options.forceGC);
        if (initial) {
            this.snapshots.push(initial);
        }

        // Start interval tracking
        this.intervalId = setInterval(async () => {
            if (!this.isTracking) return;

            const snapshot = await takeMemorySnapshot(this.page, undefined, false);
            if (snapshot) {
                this.snapshots.push(snapshot);

                // Trim old snapshots
                if (this.snapshots.length > this.options.maxSnapshots) {
                    this.snapshots = this.snapshots.slice(-this.options.maxSnapshots);
                }
            }
        }, this.options.snapshotInterval);
    }

    /**
     * Stop tracking and get results
     */
    async stop(): Promise<MemoryLeakResult> {
        this.isTracking = false;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Take final snapshot
        const final = await takeMemorySnapshot(this.page, 'final', this.options.forceGC);
        if (final) {
            this.snapshots.push(final);
        }

        return this.analyzeForLeaks();
    }

    /**
     * Take a labeled snapshot
     */
    async snapshot(label: string): Promise<MemorySnapshot | null> {
        const snapshot = await takeMemorySnapshot(this.page, label, this.options.forceGC);
        if (snapshot) {
            this.snapshots.push(snapshot);
        }
        return snapshot;
    }

    /**
     * Get all snapshots
     */
    getSnapshots(): MemorySnapshot[] {
        return [...this.snapshots];
    }

    /**
     * Analyze snapshots for memory leaks
     */
    private analyzeForLeaks(): MemoryLeakResult {
        if (this.snapshots.length < 2) {
            return {
                hasLeak: false,
                severity: 'none',
                memoryGrowth: 0,
                memoryGrowthPercent: 0,
                domNodeGrowth: 0,
                listenerGrowth: 0,
                message: 'Insufficient snapshots for analysis',
                snapshots: this.snapshots,
            };
        }

        const first = this.snapshots[0];
        const last = this.snapshots[this.snapshots.length - 1];
        const delta = calculateMemoryDelta(first, last);

        let severity: 'none' | 'minor' | 'moderate' | 'severe' = 'none';
        let hasLeak = false;

        if (delta.heapDeltaPercent >= LEAK_THRESHOLDS.SEVERE) {
            severity = 'severe';
            hasLeak = true;
        } else if (delta.heapDeltaPercent >= LEAK_THRESHOLDS.MODERATE) {
            severity = 'moderate';
            hasLeak = true;
        } else if (delta.heapDeltaPercent >= LEAK_THRESHOLDS.MINOR) {
            severity = 'minor';
            hasLeak = true;
        }

        const message = this.generateLeakMessage(delta, severity);

        return {
            hasLeak,
            severity,
            memoryGrowth: delta.heapDelta,
            memoryGrowthPercent: delta.heapDeltaPercent,
            domNodeGrowth: delta.domNodeDelta,
            listenerGrowth: delta.listenerDelta,
            message,
            snapshots: this.snapshots,
        };
    }

    /**
     * Generate human-readable leak message
     */
    private generateLeakMessage(delta: MemoryDelta, severity: string): string {
        const heapMB = (delta.heapDelta / 1024 / 1024).toFixed(2);
        const lines: string[] = [];

        if (severity === 'none') {
            lines.push('No significant memory leak detected.');
        } else {
            lines.push(`Memory leak detected (${severity}):`);
        }

        lines.push(`  Heap growth: ${heapMB}MB (${delta.heapDeltaPercent.toFixed(1)}%)`);
        lines.push(`  DOM nodes: ${delta.domNodeDelta > 0 ? '+' : ''}${delta.domNodeDelta}`);
        lines.push(`  Time elapsed: ${(delta.timeDelta / 1000).toFixed(1)}s`);

        return lines.join('\n');
    }
}

// =============================================================================
// Leak Detection Functions
// =============================================================================

/**
 * Detect memory leaks during an operation cycle
 */
export async function detectMemoryLeak(
    page: Page,
    operation: () => Promise<void>,
    cycles: number = 5,
    options: MemoryTrackerOptions = {}
): Promise<MemoryLeakResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Initial snapshot
    const initialSnapshot = await takeMemorySnapshot(page, 'initial', opts.forceGC);
    if (!initialSnapshot) {
        return {
            hasLeak: false,
            severity: 'none',
            memoryGrowth: 0,
            memoryGrowthPercent: 0,
            domNodeGrowth: 0,
            listenerGrowth: 0,
            message: 'Could not take memory snapshot',
            snapshots: [],
        };
    }

    const snapshots: MemorySnapshot[] = [initialSnapshot];

    // Run operation cycles
    for (let i = 0; i < cycles; i++) {
        await operation();

        // Take snapshot after each cycle
        const snapshot = await takeMemorySnapshot(page, `cycle-${i + 1}`, opts.forceGC);
        if (snapshot) {
            snapshots.push(snapshot);
        }

        // Small delay between cycles
        await page.waitForTimeout(100);
    }

    // Final snapshot after GC
    await page.waitForTimeout(500);
    const finalSnapshot = await takeMemorySnapshot(page, 'final', true);
    if (finalSnapshot) {
        snapshots.push(finalSnapshot);
    }

    // Analyze trend
    return analyzeMemoryTrend(snapshots, opts.leakThresholdPercent);
}

/**
 * Analyze memory trend from snapshots
 */
function analyzeMemoryTrend(
    snapshots: MemorySnapshot[],
    thresholdPercent: number
): MemoryLeakResult {
    if (snapshots.length < 2) {
        return {
            hasLeak: false,
            severity: 'none',
            memoryGrowth: 0,
            memoryGrowthPercent: 0,
            domNodeGrowth: 0,
            listenerGrowth: 0,
            message: 'Insufficient snapshots',
            snapshots,
        };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    // Calculate overall growth
    const memoryGrowth = last.usedJSHeapSize - first.usedJSHeapSize;
    const memoryGrowthPercent = first.usedJSHeapSize > 0
        ? (memoryGrowth / first.usedJSHeapSize) * 100
        : 0;
    const domNodeGrowth = last.domNodeCount - first.domNodeCount;
    const listenerGrowth = last.eventListenerCount - first.eventListenerCount;

    // Check for consistent growth (indicates leak)
    let consistentGrowth = true;
    for (let i = 2; i < snapshots.length; i++) {
        const prev = snapshots[i - 1];
        const curr = snapshots[i];
        if (curr.usedJSHeapSize < prev.usedJSHeapSize * 0.95) {
            // Memory decreased significantly, might be GC
            consistentGrowth = false;
            break;
        }
    }

    // Determine severity
    let severity: 'none' | 'minor' | 'moderate' | 'severe' = 'none';
    let hasLeak = false;

    if (memoryGrowthPercent >= LEAK_THRESHOLDS.SEVERE && consistentGrowth) {
        severity = 'severe';
        hasLeak = true;
    } else if (memoryGrowthPercent >= LEAK_THRESHOLDS.MODERATE && consistentGrowth) {
        severity = 'moderate';
        hasLeak = true;
    } else if (memoryGrowthPercent >= LEAK_THRESHOLDS.MINOR && consistentGrowth) {
        severity = 'minor';
        hasLeak = true;
    } else if (memoryGrowthPercent >= thresholdPercent) {
        severity = 'minor';
        hasLeak = true;
    }

    const message = generateAnalysisMessage(
        memoryGrowth,
        memoryGrowthPercent,
        domNodeGrowth,
        consistentGrowth,
        severity
    );

    return {
        hasLeak,
        severity,
        memoryGrowth,
        memoryGrowthPercent,
        domNodeGrowth,
        listenerGrowth,
        message,
        snapshots,
    };
}

/**
 * Generate analysis message
 */
function generateAnalysisMessage(
    memoryGrowth: number,
    memoryGrowthPercent: number,
    domNodeGrowth: number,
    consistentGrowth: boolean,
    severity: string
): string {
    const heapMB = (memoryGrowth / 1024 / 1024).toFixed(2);
    const lines: string[] = [];

    if (severity === 'none') {
        lines.push('✅ No memory leak detected');
    } else {
        lines.push(`⚠️ Potential memory leak (${severity})`);
    }

    lines.push(`Memory growth: ${heapMB}MB (${memoryGrowthPercent.toFixed(1)}%)`);
    lines.push(`DOM node growth: ${domNodeGrowth}`);
    lines.push(`Consistent growth pattern: ${consistentGrowth ? 'Yes' : 'No'}`);

    if (severity !== 'none') {
        lines.push('');
        lines.push('Recommendations:');
        if (domNodeGrowth > 100) {
            lines.push('  - Check for DOM nodes not being removed');
        }
        if (consistentGrowth) {
            lines.push('  - Check for event listeners not being cleaned up');
            lines.push('  - Check for closures holding references');
        }
    }

    return lines.join('\n');
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get current memory usage in MB
 */
export async function getMemoryUsageMB(page: Page): Promise<number> {
    const snapshot = await takeMemorySnapshot(page, undefined, false);
    if (!snapshot) return 0;
    return snapshot.usedJSHeapSize / 1024 / 1024;
}

/**
 * Check if memory is within budget
 */
export async function isMemoryWithinBudget(
    page: Page,
    budgetMB: number
): Promise<{ withinBudget: boolean; currentMB: number; budgetMB: number }> {
    const currentMB = await getMemoryUsageMB(page);
    return {
        withinBudget: currentMB <= budgetMB,
        currentMB,
        budgetMB,
    };
}

/**
 * Format memory size for display
 */
export function formatMemorySize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

/**
 * Create memory report
 */
export function createMemoryReport(result: MemoryLeakResult): string {
    const lines: string[] = [
        '═'.repeat(60),
        'Memory Analysis Report',
        '═'.repeat(60),
        '',
        `Status: ${result.hasLeak ? '❌ LEAK DETECTED' : '✅ NO LEAK'}`,
        `Severity: ${result.severity.toUpperCase()}`,
        '',
        'Metrics:',
        `  Memory Growth: ${formatMemorySize(result.memoryGrowth)} (${result.memoryGrowthPercent.toFixed(1)}%)`,
        `  DOM Node Growth: ${result.domNodeGrowth}`,
        `  Listener Growth: ${result.listenerGrowth}`,
        '',
        'Snapshots:',
    ];

    for (const snapshot of result.snapshots) {
        const label = snapshot.label || 'snapshot';
        const heap = formatMemorySize(snapshot.usedJSHeapSize);
        lines.push(`  ${label}: ${heap} (${snapshot.domNodeCount} DOM nodes)`);
    }

    lines.push('', result.message, '═'.repeat(60));

    return lines.join('\n');
}
