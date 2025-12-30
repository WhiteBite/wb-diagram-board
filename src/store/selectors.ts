/**
 * Memoized Selectors for Performance Optimization
 *
 * Uses shallow comparison and memoization to prevent unnecessary re-renders
 * when working with large diagrams (1000+ elements).
 */

import type { DiagramNode, DiagramEdge } from '../xyflow/types';
import type { DiagramStore, SearchResult, Layer } from './types';

// =============================================================================
// Selector Cache
// =============================================================================

interface SelectorCache<T> {
    lastInput: unknown;
    lastResult: T;
}

const caches = new Map<string, SelectorCache<unknown>>();

/**
 * Simple memoization helper for selectors
 */
function memoize<TInput, TResult>(
    key: string,
    input: TInput,
    compute: () => TResult
): TResult {
    const cache = caches.get(key) as SelectorCache<TResult> | undefined;

    if (cache && cache.lastInput === input) {
        return cache.lastResult;
    }

    const result = compute();
    caches.set(key, { lastInput: input, lastResult: result });
    return result;
}

/**
 * Clear all selector caches (useful for testing)
 */
export function clearSelectorCaches(): void {
    caches.clear();
}

// =============================================================================
// Node Selectors
// =============================================================================

/**
 * Select visible nodes (filtered by layer visibility and hidden state)
 */
export function selectVisibleNodes(state: DiagramStore): DiagramNode[] {
    const { nodes, hiddenNodeIds } = state;
    const layers = state.getLayers();

    // Create a set of visible layer IDs for O(1) lookup
    const visibleLayerIds = new Set(
        layers.filter((l) => l.visible).map((l) => l.id)
    );

    // Cache key based on nodes length and hidden count
    const cacheKey = `visibleNodes-${nodes.length}-${hiddenNodeIds.size}-${visibleLayerIds.size}`;

    return memoize(cacheKey, nodes, () =>
        nodes.filter((node) => {
            // Check if node is individually hidden
            if (hiddenNodeIds.has(node.id)) return false;

            // Check if node's layer is visible
            const layerId = (node.data as { layerId?: string })?.layerId ?? 'default';
            return visibleLayerIds.has(layerId);
        })
    );
}

/**
 * Select visible edges (filtered by connected node visibility)
 */
export function selectVisibleEdges(state: DiagramStore): DiagramEdge[] {
    const { edges } = state;
    const visibleNodes = selectVisibleNodes(state);
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

    const cacheKey = `visibleEdges-${edges.length}-${visibleNodeIds.size}`;

    return memoize(cacheKey, edges, () =>
        edges.filter(
            (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        )
    );
}

/**
 * Select nodes by layer ID
 */
export function selectNodesByLayer(
    state: DiagramStore,
    layerId: string
): DiagramNode[] {
    const { nodes } = state;
    const cacheKey = `nodesByLayer-${layerId}-${nodes.length}`;

    return memoize(cacheKey, nodes, () =>
        nodes.filter((node) => {
            const nodeLayerId = (node.data as { layerId?: string })?.layerId ?? 'default';
            return nodeLayerId === layerId;
        })
    );
}

/**
 * Select selected nodes
 */
export function selectSelectedNodes(state: DiagramStore): DiagramNode[] {
    const { nodes, selection } = state;
    const selectedIds = new Set(selection.nodeIds);

    const cacheKey = `selectedNodes-${nodes.length}-${selectedIds.size}`;

    return memoize(cacheKey, nodes, () =>
        nodes.filter((node) => selectedIds.has(node.id))
    );
}

/**
 * Select selected edges
 */
export function selectSelectedEdges(state: DiagramStore): DiagramEdge[] {
    const { edges, selection } = state;
    const selectedIds = new Set(selection.edgeIds);

    const cacheKey = `selectedEdges-${edges.length}-${selectedIds.size}`;

    return memoize(cacheKey, edges, () =>
        edges.filter((edge) => selectedIds.has(edge.id))
    );
}

// =============================================================================
// Search Selectors
// =============================================================================

/**
 * Search nodes by query string
 * Searches in: label, id, type
 */
export function selectSearchResults(
    state: DiagramStore,
    query: string
): SearchResult[] {
    if (!query || query.trim().length === 0) {
        return [];
    }

    const { nodes } = state;
    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `search-${normalizedQuery}-${nodes.length}`;

    return memoize(cacheKey, nodes, () => {
        const results: SearchResult[] = [];

        for (const node of nodes) {
            const label = node.data?.label ?? '';
            const type = node.type ?? 'rectangle';
            const id = node.id;

            // Check label match
            if (label.toLowerCase().includes(normalizedQuery)) {
                results.push({
                    nodeId: node.id,
                    label,
                    type,
                    matchedText: label,
                    layerId: (node.data as { layerId?: string })?.layerId,
                });
                continue;
            }

            // Check ID match
            if (id.toLowerCase().includes(normalizedQuery)) {
                results.push({
                    nodeId: node.id,
                    label,
                    type,
                    matchedText: id,
                    layerId: (node.data as { layerId?: string })?.layerId,
                });
                continue;
            }

            // Check type match
            if (type.toLowerCase().includes(normalizedQuery)) {
                results.push({
                    nodeId: node.id,
                    label,
                    type,
                    matchedText: type,
                    layerId: (node.data as { layerId?: string })?.layerId,
                });
            }
        }

        return results;
    });
}

// =============================================================================
// Layer Selectors
// =============================================================================

/**
 * Select layers sorted by order (highest first for display)
 */
export function selectSortedLayers(state: DiagramStore): Layer[] {
    const layers = state.getLayers();
    const cacheKey = `sortedLayers-${layers.length}`;

    return memoize(cacheKey, layers, () =>
        [...layers].sort((a, b) => b.order - a.order)
    );
}

/**
 * Select node count per layer
 */
export function selectLayerNodeCounts(
    state: DiagramStore
): Map<string, number> {
    const { nodes } = state;
    const layers = state.getLayers();
    const cacheKey = `layerCounts-${nodes.length}-${layers.length}`;

    return memoize(cacheKey, nodes, () => {
        const counts = new Map<string, number>();

        // Initialize all layers with 0
        for (const layer of layers) {
            counts.set(layer.id, 0);
        }

        // Count nodes per layer
        for (const node of nodes) {
            const layerId = (node.data as { layerId?: string })?.layerId ?? 'default';
            counts.set(layerId, (counts.get(layerId) ?? 0) + 1);
        }

        return counts;
    });
}

// =============================================================================
// Statistics Selectors
// =============================================================================

/**
 * Get diagram statistics
 */
export function selectDiagramStats(state: DiagramStore): {
    nodeCount: number;
    edgeCount: number;
    layerCount: number;
    selectedCount: number;
    hiddenCount: number;
    lockedCount: number;
} {
    const { nodes, edges, hiddenNodeIds, lockedNodeIds, selection } = state;
    const layers = state.getLayers();

    return {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        layerCount: layers.length,
        selectedCount: selection.nodeIds.length + selection.edgeIds.length,
        hiddenCount: hiddenNodeIds.size,
        lockedCount: lockedNodeIds.size,
    };
}

// =============================================================================
// Shallow Equality Helpers
// =============================================================================

/**
 * Shallow compare two arrays
 */
export function shallowArrayEqual<T>(a: T[], b: T[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Shallow compare two objects
 */
export function shallowObjectEqual<T extends Record<string, unknown>>(
    a: T,
    b: T
): boolean {
    if (a === b) return true;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (a[key] !== b[key]) return false;
    }
    return true;
}

// =============================================================================
// Zustand Selector Hooks (for use with useStore)
// =============================================================================

/**
 * Create a selector that only triggers re-render when result changes
 * Use with: useXYFlowStore(selectVisibleNodesHook)
 */
export const selectVisibleNodesHook = (state: DiagramStore): DiagramNode[] =>
    selectVisibleNodes(state);

export const selectVisibleEdgesHook = (state: DiagramStore): DiagramEdge[] =>
    selectVisibleEdges(state);

export const selectSearchResultsHook = (query: string) =>
    (state: DiagramStore): SearchResult[] =>
        selectSearchResults(state, query);
