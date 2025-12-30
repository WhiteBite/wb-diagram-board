/**
 * Diagram Generators - Generate large diagrams for performance testing
 *
 * Provides utilities to create realistic test diagrams at scale
 */

import { Page } from '@playwright/test';
import { DiagramPage } from '../pages/DiagramPage';
import { Point } from '../pages/CanvasComponent';

// =============================================================================
// Types
// =============================================================================

export interface GeneratorOptions {
    /** Starting X position */
    startX?: number;
    /** Starting Y position */
    startY?: number;
    /** Spacing between elements */
    spacing?: number;
    /** Element width */
    width?: number;
    /** Element height */
    height?: number;
    /** Add connections between elements */
    withConnections?: boolean;
    /** Connection density (0-1) */
    connectionDensity?: number;
    /** Batch size for creation */
    batchSize?: number;
    /** Delay between batches in ms */
    batchDelay?: number;
}

export interface GeneratedDiagram {
    /** Created element IDs */
    elementIds: string[];
    /** Created connection IDs */
    connectionIds: string[];
    /** Time to generate in ms */
    generationTime: number;
    /** Element count */
    elementCount: number;
}

export interface GridOptions extends GeneratorOptions {
    /** Number of rows */
    rows: number;
    /** Number of columns */
    cols: number;
}

export interface FlowchartOptions extends GeneratorOptions {
    /** Number of nodes */
    nodeCount: number;
    /** Number of branches */
    branches?: number;
    /** Max depth of flowchart */
    maxDepth?: number;
}

export interface NetworkOptions extends GeneratorOptions {
    /** Number of nodes */
    nodeCount: number;
    /** Average connections per node */
    avgConnections?: number;
    /** Cluster count */
    clusters?: number;
}

// =============================================================================
// Default Options
// =============================================================================

const DEFAULT_OPTIONS: Required<GeneratorOptions> = {
    startX: 50,
    startY: 50,
    spacing: 100,
    width: 80,
    height: 60,
    withConnections: false,
    connectionDensity: 0.1,
    batchSize: 50,
    batchDelay: 10,
};

// =============================================================================
// Core Generators
// =============================================================================

/**
 * Generate a grid of elements
 */
export async function generateGrid(
    diagram: DiagramPage,
    options: GridOptions
): Promise<GeneratedDiagram> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();
    const elementIds: string[] = [];

    await diagram.toolbar.selectTool('rectangle');

    for (let row = 0; row < opts.rows; row++) {
        for (let col = 0; col < opts.cols; col++) {
            const x = opts.startX + col * opts.spacing;
            const y = opts.startY + row * opts.spacing;

            const id = await diagram.canvas.draw(
                { x, y },
                { x: x + opts.width, y: y + opts.height }
            );
            elementIds.push(id);

            // Batch delay
            if (elementIds.length % opts.batchSize === 0) {
                await diagram.page.waitForTimeout(opts.batchDelay);
            }
        }
    }

    const connectionIds: string[] = [];
    if (opts.withConnections) {
        // Add horizontal connections
        await diagram.toolbar.selectTool('arrow');
        for (let row = 0; row < opts.rows; row++) {
            for (let col = 0; col < opts.cols - 1; col++) {
                if (Math.random() < opts.connectionDensity) {
                    const fromX = opts.startX + col * opts.spacing + opts.width;
                    const fromY = opts.startY + row * opts.spacing + opts.height / 2;
                    const toX = opts.startX + (col + 1) * opts.spacing;
                    const toY = fromY;

                    const id = await diagram.canvas.draw(
                        { x: fromX, y: fromY },
                        { x: toX, y: toY }
                    );
                    connectionIds.push(id);
                }
            }
        }
    }

    return {
        elementIds,
        connectionIds,
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

/**
 * Generate elements in bulk using direct store manipulation
 * Much faster than UI-based creation for large counts
 */
export async function generateBulkElements(
    page: Page,
    count: number,
    options: Partial<GeneratorOptions> = {}
): Promise<GeneratedDiagram> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const cols = Math.ceil(Math.sqrt(count));
    const startTime = performance.now();

    const elementIds = await page.evaluate(
        ({ count, opts, cols }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return [];

            const state = store.getState ? store.getState() : store;
            const ids: string[] = [];

            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const id = `perf-test-${Date.now()}-${i}`;

                const element = {
                    id,
                    type: 'rectangle',
                    x: opts.startX + col * opts.spacing,
                    y: opts.startY + row * opts.spacing,
                    width: opts.width,
                    height: opts.height,
                    strokeColor: '#000000',
                    fillColor: '#ffffff',
                    strokeWidth: 2,
                    rotation: 0,
                };

                if (state.addElement) {
                    state.addElement(element);
                } else if (state.elements) {
                    state.elements[id] = element;
                    if (state.elementOrder) {
                        state.elementOrder.push(id);
                    }
                }

                ids.push(id);
            }

            return ids;
        },
        { count, opts, cols }
    );

    return {
        elementIds,
        connectionIds: [],
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

/**
 * Generate a flowchart-like diagram
 */
export async function generateFlowchart(
    diagram: DiagramPage,
    options: FlowchartOptions
): Promise<GeneratedDiagram> {
    const opts = {
        ...DEFAULT_OPTIONS,
        branches: 2,
        maxDepth: 5,
        ...options,
    };

    const startTime = performance.now();
    const elementIds: string[] = [];
    const connectionIds: string[] = [];

    const shapes = ['rectangle', 'ellipse', 'diamond'] as const;
    const nodesPerLevel = Math.ceil(opts.nodeCount / opts.maxDepth);

    // Create nodes level by level
    for (let level = 0; level < opts.maxDepth; level++) {
        const nodesInLevel = Math.min(
            nodesPerLevel,
            opts.nodeCount - elementIds.length
        );

        for (let i = 0; i < nodesInLevel; i++) {
            const shape = shapes[level % shapes.length];
            await diagram.toolbar.selectTool(shape as any);

            const x = opts.startX + i * opts.spacing * 1.5;
            const y = opts.startY + level * opts.spacing * 1.5;

            const id = await diagram.canvas.draw(
                { x, y },
                { x: x + opts.width, y: y + opts.height }
            );
            elementIds.push(id);
        }

        // Batch delay
        await diagram.page.waitForTimeout(opts.batchDelay);
    }

    // Add connections between levels
    if (opts.withConnections) {
        await diagram.toolbar.selectTool('arrow');

        for (let level = 0; level < opts.maxDepth - 1; level++) {
            const levelStart = level * nodesPerLevel;
            const nextLevelStart = (level + 1) * nodesPerLevel;

            for (let i = 0; i < nodesPerLevel && levelStart + i < elementIds.length; i++) {
                // Connect to next level
                const targetIndex = nextLevelStart + (i % nodesPerLevel);
                if (targetIndex < elementIds.length && Math.random() < opts.connectionDensity * 3) {
                    const fromX = opts.startX + i * opts.spacing * 1.5 + opts.width / 2;
                    const fromY = opts.startY + level * opts.spacing * 1.5 + opts.height;
                    const toX = opts.startX + (targetIndex - nextLevelStart) * opts.spacing * 1.5 + opts.width / 2;
                    const toY = opts.startY + (level + 1) * opts.spacing * 1.5;

                    const id = await diagram.canvas.draw(
                        { x: fromX, y: fromY },
                        { x: toX, y: toY }
                    );
                    connectionIds.push(id);
                }
            }
        }
    }

    return {
        elementIds,
        connectionIds,
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

/**
 * Generate a network/graph diagram
 */
export async function generateNetwork(
    diagram: DiagramPage,
    options: NetworkOptions
): Promise<GeneratedDiagram> {
    const opts = {
        ...DEFAULT_OPTIONS,
        avgConnections: 3,
        clusters: 3,
        ...options,
    };

    const startTime = performance.now();
    const elementIds: string[] = [];
    const connectionIds: string[] = [];

    const nodesPerCluster = Math.ceil(opts.nodeCount / opts.clusters);

    // Create nodes in clusters
    await diagram.toolbar.selectTool('ellipse');

    for (let cluster = 0; cluster < opts.clusters; cluster++) {
        const clusterCenterX = opts.startX + cluster * opts.spacing * 5;
        const clusterCenterY = opts.startY + (cluster % 2) * opts.spacing * 3;

        for (let i = 0; i < nodesPerCluster && elementIds.length < opts.nodeCount; i++) {
            const angle = (i / nodesPerCluster) * Math.PI * 2;
            const radius = opts.spacing * 1.5;

            const x = clusterCenterX + Math.cos(angle) * radius;
            const y = clusterCenterY + Math.sin(angle) * radius;

            const id = await diagram.canvas.draw(
                { x, y },
                { x: x + opts.width * 0.8, y: y + opts.height * 0.8 }
            );
            elementIds.push(id);

            if (elementIds.length % opts.batchSize === 0) {
                await diagram.page.waitForTimeout(opts.batchDelay);
            }
        }
    }

    // Add connections
    if (opts.withConnections) {
        await diagram.toolbar.selectTool('line');

        const totalConnections = Math.floor(opts.nodeCount * opts.avgConnections / 2);

        for (let i = 0; i < totalConnections; i++) {
            const fromIdx = Math.floor(Math.random() * elementIds.length);
            let toIdx = Math.floor(Math.random() * elementIds.length);

            // Avoid self-connections
            while (toIdx === fromIdx) {
                toIdx = Math.floor(Math.random() * elementIds.length);
            }

            // Calculate positions (approximate)
            const fromCluster = Math.floor(fromIdx / nodesPerCluster);
            const fromInCluster = fromIdx % nodesPerCluster;
            const toCluster = Math.floor(toIdx / nodesPerCluster);
            const toInCluster = toIdx % nodesPerCluster;

            const fromAngle = (fromInCluster / nodesPerCluster) * Math.PI * 2;
            const toAngle = (toInCluster / nodesPerCluster) * Math.PI * 2;
            const radius = opts.spacing * 1.5;

            const fromX = opts.startX + fromCluster * opts.spacing * 5 + Math.cos(fromAngle) * radius + opts.width * 0.4;
            const fromY = opts.startY + (fromCluster % 2) * opts.spacing * 3 + Math.sin(fromAngle) * radius + opts.height * 0.4;
            const toX = opts.startX + toCluster * opts.spacing * 5 + Math.cos(toAngle) * radius + opts.width * 0.4;
            const toY = opts.startY + (toCluster % 2) * opts.spacing * 3 + Math.sin(toAngle) * radius + opts.height * 0.4;

            const id = await diagram.canvas.draw(
                { x: fromX, y: fromY },
                { x: toX, y: toY }
            );
            connectionIds.push(id);

            if (connectionIds.length % opts.batchSize === 0) {
                await diagram.page.waitForTimeout(opts.batchDelay);
            }
        }
    }

    return {
        elementIds,
        connectionIds,
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

/**
 * Generate mixed diagram with various element types
 */
export async function generateMixedDiagram(
    diagram: DiagramPage,
    count: number,
    options: Partial<GeneratorOptions> = {}
): Promise<GeneratedDiagram> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();
    const elementIds: string[] = [];

    const tools = ['rectangle', 'ellipse', 'diamond', 'text'] as const;
    const cols = Math.ceil(Math.sqrt(count));

    for (let i = 0; i < count; i++) {
        const tool = tools[i % tools.length];
        await diagram.toolbar.selectTool(tool as any);

        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = opts.startX + col * opts.spacing;
        const y = opts.startY + row * opts.spacing;

        const id = await diagram.canvas.draw(
            { x, y },
            { x: x + opts.width, y: y + opts.height }
        );
        elementIds.push(id);

        if (i % opts.batchSize === 0) {
            await diagram.page.waitForTimeout(opts.batchDelay);
        }
    }

    return {
        elementIds,
        connectionIds: [],
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

// =============================================================================
// Specialized Generators
// =============================================================================

/**
 * Generate diagram optimized for pan/zoom testing
 * Creates elements spread across a large area
 */
export async function generateSpreadDiagram(
    page: Page,
    count: number,
    spreadFactor: number = 10
): Promise<GeneratedDiagram> {
    const startTime = performance.now();
    const spacing = 100 * spreadFactor;

    const elementIds = await page.evaluate(
        ({ count, spacing }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return [];

            const state = store.getState ? store.getState() : store;
            const ids: string[] = [];
            const cols = Math.ceil(Math.sqrt(count));

            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const id = `spread-${Date.now()}-${i}`;

                const element = {
                    id,
                    type: 'rectangle',
                    x: col * spacing,
                    y: row * spacing,
                    width: 80,
                    height: 60,
                    strokeColor: '#000000',
                    fillColor: '#ffffff',
                    strokeWidth: 2,
                    rotation: 0,
                };

                if (state.addElement) {
                    state.addElement(element);
                } else if (state.elements) {
                    state.elements[id] = element;
                    if (state.elementOrder) {
                        state.elementOrder.push(id);
                    }
                }

                ids.push(id);
            }

            return ids;
        },
        { count, spacing }
    );

    return {
        elementIds,
        connectionIds: [],
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

/**
 * Generate diagram with many overlapping elements
 * Tests rendering performance with occlusion
 */
export async function generateOverlappingDiagram(
    page: Page,
    count: number,
    overlapPercent: number = 50
): Promise<GeneratedDiagram> {
    const startTime = performance.now();
    const overlapOffset = (100 - overlapPercent) / 100;

    const elementIds = await page.evaluate(
        ({ count, overlapOffset }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return [];

            const state = store.getState ? store.getState() : store;
            const ids: string[] = [];
            const width = 100;
            const height = 80;

            for (let i = 0; i < count; i++) {
                const id = `overlap-${Date.now()}-${i}`;

                const element = {
                    id,
                    type: 'rectangle',
                    x: 100 + i * width * overlapOffset,
                    y: 100 + (i % 10) * height * overlapOffset,
                    width,
                    height,
                    strokeColor: '#000000',
                    fillColor: `hsl(${(i * 37) % 360}, 70%, 80%)`,
                    strokeWidth: 2,
                    rotation: 0,
                };

                if (state.addElement) {
                    state.addElement(element);
                } else if (state.elements) {
                    state.elements[id] = element;
                    if (state.elementOrder) {
                        state.elementOrder.push(id);
                    }
                }

                ids.push(id);
            }

            return ids;
        },
        { count, overlapOffset }
    );

    return {
        elementIds,
        connectionIds: [],
        generationTime: performance.now() - startTime,
        elementCount: elementIds.length,
    };
}

/**
 * Generate diagram with complex connections
 * Tests connection rendering performance
 */
export async function generateConnectedDiagram(
    page: Page,
    nodeCount: number,
    connectionCount: number
): Promise<GeneratedDiagram> {
    const startTime = performance.now();
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const spacing = 150;

    const result = await page.evaluate(
        ({ nodeCount, connectionCount, cols, spacing }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return { elementIds: [], connectionIds: [] };

            const state = store.getState ? store.getState() : store;
            const elementIds: string[] = [];
            const connectionIds: string[] = [];

            // Create nodes
            for (let i = 0; i < nodeCount; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const id = `node-${Date.now()}-${i}`;

                const element = {
                    id,
                    type: 'ellipse',
                    x: 50 + col * spacing,
                    y: 50 + row * spacing,
                    width: 60,
                    height: 60,
                    strokeColor: '#000000',
                    fillColor: '#e0e0ff',
                    strokeWidth: 2,
                    rotation: 0,
                };

                if (state.addElement) {
                    state.addElement(element);
                } else if (state.elements) {
                    state.elements[id] = element;
                    if (state.elementOrder) {
                        state.elementOrder.push(id);
                    }
                }

                elementIds.push(id);
            }

            // Create connections
            for (let i = 0; i < connectionCount; i++) {
                const fromIdx = Math.floor(Math.random() * nodeCount);
                let toIdx = Math.floor(Math.random() * nodeCount);
                while (toIdx === fromIdx) {
                    toIdx = Math.floor(Math.random() * nodeCount);
                }

                const fromCol = fromIdx % cols;
                const fromRow = Math.floor(fromIdx / cols);
                const toCol = toIdx % cols;
                const toRow = Math.floor(toIdx / cols);

                const id = `conn-${Date.now()}-${i}`;

                const connection = {
                    id,
                    type: 'arrow',
                    x: 50 + fromCol * spacing + 30,
                    y: 50 + fromRow * spacing + 30,
                    width: (toCol - fromCol) * spacing,
                    height: (toRow - fromRow) * spacing,
                    strokeColor: '#666666',
                    strokeWidth: 1,
                    rotation: 0,
                };

                if (state.addElement) {
                    state.addElement(connection);
                } else if (state.elements) {
                    state.elements[id] = connection;
                    if (state.elementOrder) {
                        state.elementOrder.push(id);
                    }
                }

                connectionIds.push(id);
            }

            return { elementIds, connectionIds };
        },
        { nodeCount, connectionCount, cols, spacing }
    );

    return {
        ...result,
        generationTime: performance.now() - startTime,
        elementCount: result.elementIds.length + result.connectionIds.length,
    };
}

// =============================================================================
// Cleanup Utilities
// =============================================================================

/**
 * Clear all generated elements
 */
export async function clearGeneratedElements(page: Page): Promise<void> {
    await page.evaluate(() => {
        const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
        if (!store) return;

        const state = store.getState ? store.getState() : store;

        if (state.clear) {
            state.clear();
        } else if (state.elements) {
            state.elements = {};
            state.elementOrder = [];
            state.selectedIds = [];
        }
    });
}

/**
 * Get current element count
 */
export async function getElementCount(page: Page): Promise<number> {
    return page.evaluate(() => {
        const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
        if (!store) return 0;

        const state = store.getState ? store.getState() : store;
        return state.elementOrder?.length || Object.keys(state.elements || {}).length;
    });
}
