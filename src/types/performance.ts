/**
 * Performance Optimization Types
 * 
 * Type definitions for performance monitoring, caching, and optimization
 */

/**
 * Performance metrics snapshot
 */
export interface PerformanceMetrics {
    /** Frames per second */
    readonly fps: number;
    /** Render time in milliseconds */
    readonly renderTime: number;
    /** Update time in milliseconds */
    readonly updateTime: number;
    /** Memory usage in bytes */
    readonly memoryUsage: number;
    /** Total element count */
    readonly elementCount: number;
    /** Visible element count after culling */
    readonly visibleElementCount: number;
    /** Timestamp of measurement */
    readonly timestamp: number;
}

/**
 * Cache entry with TTL support
 */
export interface CacheEntry<T> {
    /** Cached value */
    readonly value: T;
    /** Creation timestamp */
    readonly timestamp: number;
    /** Time to live in milliseconds */
    readonly ttl: number;
}

/**
 * Virtualization configuration
 */
export interface VirtualizationConfig {
    /** Enable/disable virtualization */
    readonly enabled: boolean;
    /** Buffer size in pixels around viewport */
    readonly bufferSize: number;
    /** Update interval in milliseconds */
    readonly updateInterval: number;
}

/**
 * Render optimization statistics
 */
export interface RenderStats {
    /** Total elements */
    readonly total: number;
    /** Visible elements */
    readonly visible: number;
    /** Culled elements */
    readonly culled: number;
    /** Batches created */
    readonly batches: number;
}

/**
 * Level of Detail configuration
 */
export type LODLevel = 'high' | 'medium' | 'low';

/**
 * Profiler entry
 */
export interface ProfilerEntry {
    /** Label for the measurement */
    readonly label: string;
    /** Duration in milliseconds */
    readonly duration: number;
    /** Timestamp */
    readonly timestamp: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    /** Cache hits */
    readonly hits: number;
    /** Cache misses */
    readonly misses: number;
    /** Current cache size in bytes */
    readonly size: number;
    /** Hit rate percentage */
    readonly hitRate: number;
}

/**
 * Performance recommendation
 */
export interface PerformanceRecommendation {
    /** Recommendation severity */
    readonly severity: 'info' | 'warning' | 'critical';
    /** Recommendation message */
    readonly message: string;
    /** Suggested action */
    readonly action?: string;
}

/**
 * Performance error class
 */
export class PerformanceError extends Error {
    /**
     * Create a performance error
     * @param message Error message
     * @param context Additional context
     */
    constructor(
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'PerformanceError';
        Object.setPrototypeOf(this, PerformanceError.prototype);
    }
}

/**
 * Bounds for intersection testing
 */
export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Transform for viewport calculations
 */
export interface Transform {
    x: number;
    y: number;
    scale: number;
}
