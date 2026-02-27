/**
 * Performance Store
 * 
 * Zustand store for performance state management
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { PerformanceMetrics } from '../types/performance';

/**
 * Performance store state
 */
interface PerformanceState {
    /** Current performance metrics */
    readonly metrics: PerformanceMetrics;
    /** Virtualization enabled flag */
    readonly virtualizationEnabled: boolean;
    /** Cache enabled flag */
    readonly cacheEnabled: boolean;
    /** Profiler enabled flag */
    readonly profilerEnabled: boolean;
    /** Visible element IDs */
    readonly visibleElements: readonly string[];
    /** LOD enabled flag */
    readonly lodEnabled: boolean;
    /** Batch rendering enabled flag */
    readonly batchRenderingEnabled: boolean;
}

/**
 * Performance store actions
 */
interface PerformanceActions {
    /**
     * Update metrics
     * @param metrics Partial metrics to update
     */
    updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;

    /**
     * Toggle virtualization
     */
    toggleVirtualization: () => void;

    /**
     * Toggle cache
     */
    toggleCache: () => void;

    /**
     * Toggle profiler
     */
    toggleProfiler: () => void;

    /**
     * Toggle LOD
     */
    toggleLOD: () => void;

    /**
     * Toggle batch rendering
     */
    toggleBatchRendering: () => void;

    /**
     * Update visible elements
     * @param ids Element IDs
     */
    updateVisibleElements: (ids: readonly string[]) => void;

    /**
     * Get performance report
     * @returns Report string
     */
    getReport: () => string;

    /**
     * Reset to defaults
     */
    reset: () => void;
}

/**
 * Default metrics
 */
const DEFAULT_METRICS: PerformanceMetrics = {
    fps: 60,
    renderTime: 0,
    updateTime: 0,
    memoryUsage: 0,
    elementCount: 0,
    visibleElementCount: 0,
    timestamp: Date.now(),
};

/**
 * Create performance store
 */
export const usePerformanceStore = create<PerformanceState & PerformanceActions>()(
    immer((set, get) => ({
        // State
        metrics: DEFAULT_METRICS,
        virtualizationEnabled: true,
        cacheEnabled: true,
        profilerEnabled: false,
        visibleElements: [],
        lodEnabled: true,
        batchRenderingEnabled: true,

        // Actions
        updateMetrics: (metrics) => {
            set((state) => {
                state.metrics = {
                    ...state.metrics,
                    ...metrics,
                    timestamp: Date.now(),
                };
            });
        },

        toggleVirtualization: () => {
            set((state) => {
                state.virtualizationEnabled = !state.virtualizationEnabled;
            });
        },

        toggleCache: () => {
            set((state) => {
                state.cacheEnabled = !state.cacheEnabled;
            });
        },

        toggleProfiler: () => {
            set((state) => {
                state.profilerEnabled = !state.profilerEnabled;
            });
        },

        toggleLOD: () => {
            set((state) => {
                state.lodEnabled = !state.lodEnabled;
            });
        },

        toggleBatchRendering: () => {
            set((state) => {
                state.batchRenderingEnabled = !state.batchRenderingEnabled;
            });
        },

        updateVisibleElements: (ids) => {
            set((state) => {
                state.visibleElements = [...ids] as any;
            });
        },

        getReport: () => {
            const state = get();
            const lines: string[] = [
                '=== Performance Report ===',
                '',
                'Settings:',
                `  Virtualization: ${state.virtualizationEnabled ? 'ON' : 'OFF'}`,
                `  Cache: ${state.cacheEnabled ? 'ON' : 'OFF'}`,
                `  Profiler: ${state.profilerEnabled ? 'ON' : 'OFF'}`,
                `  LOD: ${state.lodEnabled ? 'ON' : 'OFF'}`,
                `  Batch Rendering: ${state.batchRenderingEnabled ? 'ON' : 'OFF'}`,
                '',
                'Metrics:',
                `  FPS: ${state.metrics.fps.toFixed(1)}`,
                `  Render Time: ${state.metrics.renderTime.toFixed(2)}ms`,
                `  Update Time: ${state.metrics.updateTime.toFixed(2)}ms`,
                `  Memory: ${(state.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
                `  Elements: ${state.metrics.elementCount}`,
                `  Visible: ${state.metrics.visibleElementCount}`,
            ];

            return lines.join('\n');
        },

        reset: () => {
            set((state) => {
                state.metrics = DEFAULT_METRICS;
                state.virtualizationEnabled = true;
                state.cacheEnabled = true;
                state.profilerEnabled = false;
                state.visibleElements = [];
                state.lodEnabled = true;
                state.batchRenderingEnabled = true;
            });
        },
    }))
);

/**
 * Selectors
 */
export const selectMetrics = (state: PerformanceState) => state.metrics;
export const selectVirtualizationEnabled = (state: PerformanceState) => state.virtualizationEnabled;
export const selectCacheEnabled = (state: PerformanceState) => state.cacheEnabled;
export const selectProfilerEnabled = (state: PerformanceState) => state.profilerEnabled;
export const selectVisibleElements = (state: PerformanceState) => state.visibleElements;
export const selectLODEnabled = (state: PerformanceState) => state.lodEnabled;
export const selectBatchRenderingEnabled = (state: PerformanceState) => state.batchRenderingEnabled;
