/**
 * Performance benchmarks and baseline measurements
 * @module __tests__/performance/benchmarks
 */

/**
 * Performance benchmark baseline
 */
export interface BenchmarkBaseline {
    /** Operation name */
    name: string;
    /** Baseline duration in milliseconds */
    baseline: number;
    /** Maximum acceptable duration (ms) */
    threshold: number;
    /** Minimum acceptable throughput (ops/sec) */
    minThroughput?: number;
    /** Description */
    description: string;
}

/**
 * Element creation benchmarks
 */
export const ELEMENT_CREATION_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'create-rectangle',
        baseline: 5,
        threshold: 15,
        description: 'Create a rectangle element',
    },
    {
        name: 'create-ellipse',
        baseline: 5,
        threshold: 15,
        description: 'Create an ellipse element',
    },
    {
        name: 'create-line',
        baseline: 3,
        threshold: 10,
        description: 'Create a line element',
    },
    {
        name: 'create-text',
        baseline: 5,
        threshold: 15,
        description: 'Create a text element',
    },
    {
        name: 'create-100-elements',
        baseline: 500,
        threshold: 1000,
        description: 'Create 100 elements',
    },
    {
        name: 'create-500-elements',
        baseline: 2500,
        threshold: 5000,
        description: 'Create 500 elements',
    },
];

/**
 * Element manipulation benchmarks
 */
export const ELEMENT_MANIPULATION_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'select-element',
        baseline: 2,
        threshold: 10,
        description: 'Select a single element',
    },
    {
        name: 'select-multiple-elements',
        baseline: 5,
        threshold: 20,
        description: 'Select multiple elements',
    },
    {
        name: 'move-element',
        baseline: 3,
        threshold: 15,
        description: 'Move an element',
    },
    {
        name: 'resize-element',
        baseline: 3,
        threshold: 15,
        description: 'Resize an element',
    },
    {
        name: 'delete-element',
        baseline: 2,
        threshold: 10,
        description: 'Delete an element',
    },
    {
        name: 'duplicate-element',
        baseline: 5,
        threshold: 20,
        description: 'Duplicate an element',
    },
    {
        name: 'rotate-element',
        baseline: 2,
        threshold: 10,
        description: 'Rotate an element',
    },
];

/**
 * Undo/Redo benchmarks
 */
export const UNDO_REDO_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'undo-operation',
        baseline: 2,
        threshold: 10,
        description: 'Undo an operation',
    },
    {
        name: 'redo-operation',
        baseline: 2,
        threshold: 10,
        description: 'Redo an operation',
    },
    {
        name: 'undo-10-operations',
        baseline: 20,
        threshold: 50,
        description: 'Undo 10 operations',
    },
    {
        name: 'redo-10-operations',
        baseline: 20,
        threshold: 50,
        description: 'Redo 10 operations',
    },
];

/**
 * Rendering benchmarks
 */
export const RENDERING_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'render-10-elements',
        baseline: 50,
        threshold: 150,
        description: 'Render 10 elements',
    },
    {
        name: 'render-50-elements',
        baseline: 250,
        threshold: 750,
        description: 'Render 50 elements',
    },
    {
        name: 'render-100-elements',
        baseline: 500,
        threshold: 1500,
        description: 'Render 100 elements',
    },
    {
        name: 'render-500-elements',
        baseline: 2500,
        threshold: 7500,
        description: 'Render 500 elements',
    },
    {
        name: 'render-1000-elements',
        baseline: 5000,
        threshold: 15000,
        description: 'Render 1000 elements',
    },
];

/**
 * Zoom and pan benchmarks
 */
export const ZOOM_PAN_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'zoom-in',
        baseline: 2,
        threshold: 10,
        description: 'Zoom in',
    },
    {
        name: 'zoom-out',
        baseline: 2,
        threshold: 10,
        description: 'Zoom out',
    },
    {
        name: 'pan-canvas',
        baseline: 2,
        threshold: 10,
        description: 'Pan canvas',
    },
    {
        name: 'zoom-and-pan',
        baseline: 5,
        threshold: 20,
        description: 'Zoom and pan combined',
    },
];

/**
 * Copy/Paste benchmarks
 */
export const COPY_PASTE_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'copy-element',
        baseline: 2,
        threshold: 10,
        description: 'Copy an element',
    },
    {
        name: 'paste-element',
        baseline: 3,
        threshold: 15,
        description: 'Paste an element',
    },
    {
        name: 'copy-paste-cycle',
        baseline: 5,
        threshold: 25,
        description: 'Copy and paste cycle',
    },
    {
        name: 'paste-10-times',
        baseline: 30,
        threshold: 100,
        description: 'Paste 10 times',
    },
];

/**
 * Connector benchmarks
 */
export const CONNECTOR_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'create-connector',
        baseline: 5,
        threshold: 20,
        description: 'Create a connector',
    },
    {
        name: 'delete-connector',
        baseline: 2,
        threshold: 10,
        description: 'Delete a connector',
    },
    {
        name: 'move-connector-point',
        baseline: 3,
        threshold: 15,
        description: 'Move a connector point',
    },
    {
        name: 'create-10-connectors',
        baseline: 50,
        threshold: 200,
        description: 'Create 10 connectors',
    },
    {
        name: 'update-connector-during-drag',
        baseline: 16,
        threshold: 32,
        description: 'Update connector position during element drag (should be ~60fps)',
    },
    {
        name: 'batch-connector-update-10',
        baseline: 16,
        threshold: 50,
        description: 'Batch update 10 connectors simultaneously',
    },
    {
        name: 'batch-connector-update-50',
        baseline: 32,
        threshold: 100,
        description: 'Batch update 50 connectors simultaneously',
    },
];

/**
 * Binding points benchmarks
 */
export const BINDING_POINTS_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'calculate-binding-points',
        baseline: 1,
        threshold: 5,
        description: 'Calculate binding points for single element',
    },
    {
        name: 'calculate-binding-points-10',
        baseline: 5,
        threshold: 20,
        description: 'Calculate binding points for 10 elements',
    },
    {
        name: 'calculate-binding-points-100',
        baseline: 16,
        threshold: 50,
        description: 'Calculate binding points for 100 elements',
    },
    {
        name: 'binding-points-cache-hit',
        baseline: 0.1,
        threshold: 1,
        description: 'Retrieve binding points from cache',
    },
    {
        name: 'binding-points-cache-invalidation',
        baseline: 1,
        threshold: 5,
        description: 'Invalidate binding points cache for element',
    },
];

/**
 * Complex operation benchmarks
 */
export const COMPLEX_OPERATION_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'create-and-move-element',
        baseline: 10,
        threshold: 40,
        description: 'Create and move an element',
    },
    {
        name: 'create-multiple-and-select',
        baseline: 20,
        threshold: 80,
        description: 'Create multiple elements and select them',
    },
    {
        name: 'complex-workflow',
        baseline: 50,
        threshold: 200,
        description: 'Complex workflow with multiple operations',
    },
    {
        name: 'full-diagram-creation',
        baseline: 100,
        threshold: 400,
        description: 'Full diagram creation workflow',
    },
];

/**
 * Memory benchmarks
 */
export const MEMORY_BENCHMARKS: BenchmarkBaseline[] = [
    {
        name: 'memory-100-elements',
        baseline: 5 * 1024 * 1024, // 5MB
        threshold: 20 * 1024 * 1024, // 20MB
        description: 'Memory usage for 100 elements',
    },
    {
        name: 'memory-500-elements',
        baseline: 25 * 1024 * 1024, // 25MB
        threshold: 100 * 1024 * 1024, // 100MB
        description: 'Memory usage for 500 elements',
    },
    {
        name: 'memory-1000-elements',
        baseline: 50 * 1024 * 1024, // 50MB
        threshold: 200 * 1024 * 1024, // 200MB
        description: 'Memory usage for 1000 elements',
    },
];

/**
 * All benchmarks combined
 */
export const ALL_BENCHMARKS: BenchmarkBaseline[] = [
    ...ELEMENT_CREATION_BENCHMARKS,
    ...ELEMENT_MANIPULATION_BENCHMARKS,
    ...UNDO_REDO_BENCHMARKS,
    ...RENDERING_BENCHMARKS,
    ...ZOOM_PAN_BENCHMARKS,
    ...COPY_PASTE_BENCHMARKS,
    ...CONNECTOR_BENCHMARKS,
    ...BINDING_POINTS_BENCHMARKS,
    ...COMPLEX_OPERATION_BENCHMARKS,
    ...MEMORY_BENCHMARKS,
];

/**
 * Get benchmark by name
 * @param name - Benchmark name
 * @returns Benchmark or undefined
 */
export function getBenchmark(name: string): BenchmarkBaseline | undefined {
    return ALL_BENCHMARKS.find((b) => b.name === name);
}

/**
 * Get benchmarks by category
 * @param category - Category name
 * @returns Array of benchmarks
 */
export function getBenchmarksByCategory(
    category:
        | 'creation'
        | 'manipulation'
        | 'undo-redo'
        | 'rendering'
        | 'zoom-pan'
        | 'copy-paste'
        | 'connector'
        | 'binding-points'
        | 'complex'
        | 'memory'
): BenchmarkBaseline[] {
    switch (category) {
        case 'creation':
            return ELEMENT_CREATION_BENCHMARKS;
        case 'manipulation':
            return ELEMENT_MANIPULATION_BENCHMARKS;
        case 'undo-redo':
            return UNDO_REDO_BENCHMARKS;
        case 'rendering':
            return RENDERING_BENCHMARKS;
        case 'zoom-pan':
            return ZOOM_PAN_BENCHMARKS;
        case 'copy-paste':
            return COPY_PASTE_BENCHMARKS;
        case 'connector':
            return CONNECTOR_BENCHMARKS;
        case 'binding-points':
            return BINDING_POINTS_BENCHMARKS;
        case 'complex':
            return COMPLEX_OPERATION_BENCHMARKS;
        case 'memory':
            return MEMORY_BENCHMARKS;
        default:
            return [];
    }
}

/**
 * Performance targets for different scenarios
 */
export const PERFORMANCE_TARGETS = {
    /** User interaction should feel instant */
    INSTANT: 16, // 60fps
    /** User interaction should feel responsive */
    RESPONSIVE: 100,
    /** User interaction should feel fast */
    FAST: 300,
    /** User interaction should feel acceptable */
    ACCEPTABLE: 1000,
    /** Maximum acceptable time for any operation */
    MAX_ACCEPTABLE: 5000,
} as const;

/**
 * Memory limits for different scenarios
 */
export const MEMORY_LIMITS = {
    /** Small diagram */
    SMALL: 10 * 1024 * 1024, // 10MB
    /** Medium diagram */
    MEDIUM: 50 * 1024 * 1024, // 50MB
    /** Large diagram */
    LARGE: 200 * 1024 * 1024, // 200MB
    /** Maximum acceptable memory */
    MAX_ACCEPTABLE: 500 * 1024 * 1024, // 500MB
} as const;

/**
 * Throughput targets (operations per second)
 */
export const THROUGHPUT_TARGETS = {
    /** Element creation throughput */
    ELEMENT_CREATION: 200, // 200 elements/sec
    /** Element manipulation throughput */
    ELEMENT_MANIPULATION: 333, // 333 ops/sec
    /** Rendering throughput */
    RENDERING: 60, // 60 fps
    /** Undo/Redo throughput */
    UNDO_REDO: 500, // 500 ops/sec
} as const;

export { };
