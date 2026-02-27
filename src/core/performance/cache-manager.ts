/**
 * Cache Manager
 * 
 * Generic cache with TTL support and memory management
 */

import { CacheEntry, CacheStats, PerformanceError } from '../../types/performance';

/**
 * Generic cache manager with TTL support
 */
export class CacheManager<T> {
    private cache = new Map<string, CacheEntry<T>>();
    private hits = 0;
    private misses = 0;
    private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Create a cache manager
     * @param defaultTTL Default time to live in milliseconds
     * @param cleanupIntervalMs Cleanup interval in milliseconds
     */
    constructor(
        private readonly defaultTTL: number = 60000,
        cleanupIntervalMs: number = 30000
    ) {
        // Start periodic cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, cleanupIntervalMs);
    }

    /**
     * Get value from cache
     * 
     * @param key Cache key
     * @returns Cached value or undefined
     */
    get(key: string): T | undefined {
        try {
            if (typeof key !== 'string') {
                throw new PerformanceError('Cache key must be a string', { key });
            }

            const entry = this.cache.get(key);

            if (!entry) {
                this.misses++;
                return undefined;
            }

            // Check if entry has expired
            const now = Date.now();
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                this.misses++;
                return undefined;
            }

            this.hits++;
            return entry.value;
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to get cache entry', {
                error: error instanceof Error ? error.message : String(error),
                key,
            });
        }
    }

    /**
     * Set value in cache
     * 
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in milliseconds (uses default if not provided)
     */
    set(key: string, value: T, ttl?: number): void {
        try {
            if (typeof key !== 'string') {
                throw new PerformanceError('Cache key must be a string', { key });
            }

            if (value === null || value === undefined) {
                throw new PerformanceError('Cannot cache null or undefined values', { key });
            }

            const entry: CacheEntry<T> = {
                value,
                timestamp: Date.now(),
                ttl: ttl ?? this.defaultTTL,
            };

            this.cache.set(key, entry);
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to set cache entry', {
                error: error instanceof Error ? error.message : String(error),
                key,
            });
        }
    }

    /**
     * Delete value from cache
     * 
     * @param key Cache key
     */
    delete(key: string): void {
        try {
            if (typeof key !== 'string') {
                throw new PerformanceError('Cache key must be a string', { key });
            }

            this.cache.delete(key);
        } catch (error) {
            if (error instanceof PerformanceError) {
                throw error;
            }
            throw new PerformanceError('Failed to delete cache entry', {
                error: error instanceof Error ? error.message : String(error),
                key,
            });
        }
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        try {
            this.cache.clear();
            this.hits = 0;
            this.misses = 0;
        } catch (error) {
            throw new PerformanceError('Failed to clear cache', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get cache size in bytes (approximate)
     * 
     * @returns Size in bytes
     */
    getSize(): number {
        try {
            let size = 0;
            this.cache.forEach((entry) => {
                // Rough estimation: key + value + metadata
                size += (entry.timestamp.toString().length + 100);
            });
            return size;
        } catch (error) {
            throw new PerformanceError('Failed to get cache size', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Get cache statistics
     * 
     * @returns Cache statistics
     */
    getStats(): CacheStats {
        try {
            const total = this.hits + this.misses;
            const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

            return {
                hits: this.hits,
                misses: this.misses,
                size: this.getSize(),
                hitRate,
            };
        } catch (error) {
            throw new PerformanceError('Failed to get cache stats', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        try {
            const now = Date.now();
            let cleaned = 0;

            this.cache.forEach((entry, key) => {
                if (now - entry.timestamp > entry.ttl) {
                    this.cache.delete(key);
                    cleaned++;
                }
            });

            if (cleaned > 0) {
                // Silently clean up expired entries
            }
        } catch (error) {
            // Silently handle cleanup errors
            console.error('[CacheManager] Cleanup error:', error);
        }
    }

    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void {
        try {
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
            }
            this.clear();
        } catch (error) {
            console.error('[CacheManager] Destroy error:', error);
        }
    }
}

/**
 * Cache for element bounds
 */
export const elementBoundsCache = new CacheManager<{ x: number; y: number; width: number; height: number }>(
    5000 // 5 second TTL
);

/**
 * Cache for element paths
 */
export const elementPathCache = new CacheManager<Path2D>(
    5000 // 5 second TTL
);

/**
 * Cache for render results
 */
export const renderResultCache = new CacheManager<ImageData>(
    3000 // 3 second TTL
);
