/**
 * Store Types
 *
 * Type definitions for the enhanced Zustand store with:
 * - Multi-tab/multi-diagram support
 * - Layers system
 * - Search functionality
 * - Performance optimizations
 */

import type { DiagramNode, DiagramEdge } from '../xyflow/types';

// =============================================================================
// Layer Types
// =============================================================================

/**
 * Layer definition for organizing nodes
 */
export interface Layer {
    readonly id: string;
    readonly name: string;
    readonly visible: boolean;
    readonly locked: boolean;
    readonly color: string;
    readonly order: number; // Z-index order (higher = on top)
}

/**
 * Default layer that always exists
 */
export const DEFAULT_LAYER: Layer = {
    id: 'default',
    name: 'Default Layer',
    visible: true,
    locked: false,
    color: '#6366f1',
    order: 0,
};

// =============================================================================
// Tab/Diagram Types
// =============================================================================

/**
 * Viewport state for a diagram
 */
export interface Viewport {
    readonly x: number;
    readonly y: number;
    readonly zoom: number;
}

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
    readonly nodes: DiagramNode[];
    readonly edges: DiagramEdge[];
    readonly layers: Layer[];
    readonly timestamp: number;
    readonly description?: string;
}

/**
 * Single diagram tab state
 */
export interface DiagramTab {
    readonly id: string;
    readonly name: string;
    readonly nodes: DiagramNode[];
    readonly edges: DiagramEdge[];
    readonly layers: Layer[];
    readonly viewport: Viewport;
    readonly history: HistoryEntry[];
    readonly historyIndex: number;
    readonly isDirty: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
}

/**
 * Create a new empty diagram tab
 */
export function createDiagramTab(id: string, name: string = 'Untitled'): DiagramTab {
    const now = new Date().toISOString();
    return {
        id,
        name,
        nodes: [],
        edges: [],
        layers: [{ ...DEFAULT_LAYER }],
        viewport: { x: 0, y: 0, zoom: 1 },
        history: [],
        historyIndex: -1,
        isDirty: false,
        createdAt: now,
        updatedAt: now,
    };
}

// =============================================================================
// Search Types
// =============================================================================

/**
 * Search result item
 */
export interface SearchResult {
    readonly nodeId: string;
    readonly label: string;
    readonly type: string;
    readonly matchedText: string;
    readonly layerId?: string;
}

/**
 * Search state
 */
export interface SearchState {
    readonly query: string;
    readonly results: SearchResult[];
    readonly selectedIndex: number;
    readonly isOpen: boolean;
}

// =============================================================================
// Clipboard Types
// =============================================================================

/**
 * Clipboard data for copy/paste
 */
export interface ClipboardData {
    readonly nodes: DiagramNode[];
    readonly edges: DiagramEdge[];
    readonly sourceTabId?: string;
}

// =============================================================================
// Selection Types
// =============================================================================

/**
 * Selection state
 */
export interface SelectionState {
    readonly nodeIds: string[];
    readonly edgeIds: string[];
}

// =============================================================================
// Store Slice Types
// =============================================================================

/**
 * Tabs slice state and actions
 */
export interface TabsSlice {
    // State
    tabs: DiagramTab[];
    activeTabId: string | null;

    // Tab management
    createTab: (name?: string) => string;
    closeTab: (tabId: string) => void;
    switchTab: (tabId: string) => void;
    renameTab: (tabId: string, name: string) => void;
    duplicateTab: (tabId: string) => string;

    // Get current tab
    getActiveTab: () => DiagramTab | null;
    getTab: (tabId: string) => DiagramTab | null;
}

/**
 * Layers slice state and actions
 */
export interface LayersSlice {
    // Layer management (operates on active tab)
    createLayer: (name: string, color?: string) => string;
    deleteLayer: (layerId: string) => void;
    renameLayer: (layerId: string, name: string) => void;
    setLayerVisibility: (layerId: string, visible: boolean) => void;
    setLayerLocked: (layerId: string, locked: boolean) => void;
    setLayerColor: (layerId: string, color: string) => void;
    reorderLayers: (layerIds: string[]) => void;
    moveNodesToLayer: (nodeIds: string[], layerId: string) => void;

    // Get layers
    getLayers: () => Layer[];
    getLayerById: (layerId: string) => Layer | undefined;
    getNodesInLayer: (layerId: string) => DiagramNode[];
}

/**
 * Search slice state and actions
 */
export interface SearchSlice {
    // State
    search: SearchState;

    // Actions
    setSearchQuery: (query: string) => void;
    openSearch: () => void;
    closeSearch: () => void;
    selectSearchResult: (index: number) => void;
    navigateSearchResults: (direction: 'up' | 'down') => void;
    focusSearchResult: () => void; // Zoom to selected result
    clearSearch: () => void;
}

/**
 * Nodes/Edges slice (operates on active tab)
 */
export interface NodesEdgesSlice {
    // Computed (from active tab)
    nodes: DiagramNode[];
    edges: DiagramEdge[];

    // Node actions
    setNodes: (nodes: DiagramNode[]) => void;
    addNode: (node: DiagramNode) => void;
    removeNode: (nodeId: string) => void;
    updateNode: (nodeId: string, data: Partial<DiagramNode>) => void;
    updateNodeData: (nodeId: string, data: Partial<DiagramNode['data']>) => void;

    // Edge actions
    setEdges: (edges: DiagramEdge[]) => void;
    addEdge: (edge: DiagramEdge) => void;
    removeEdge: (edgeId: string) => void;
    updateEdge: (edgeId: string, data: Partial<DiagramEdge>) => void;
    updateEdgeLabel: (edgeId: string, label: string) => void;

    // Bulk actions
    clearAll: () => void;
}

/**
 * Selection slice
 */
export interface SelectionSlice {
    // State
    selection: SelectionState;

    // Actions
    selectNode: (nodeId: string, multiSelect?: boolean) => void;
    selectEdge: (edgeId: string, multiSelect?: boolean) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setSelection: (nodeIds: string[], edgeIds?: string[]) => void;
}

/**
 * Clipboard slice
 */
export interface ClipboardSlice {
    // State
    clipboard: ClipboardData | null;

    // Actions
    copy: () => void;
    cut: () => void;
    paste: () => void;
    duplicate: () => void;
}

/**
 * History slice (per-tab undo/redo)
 */
export interface HistorySlice {
    // Actions
    pushHistory: (description?: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    clearHistory: () => void;
}

/**
 * Z-Index slice
 */
export interface ZIndexSlice {
    bringToFront: (nodeId: string) => void;
    sendToBack: (nodeId: string) => void;
    moveUp: (nodeId: string) => void;
    moveDown: (nodeId: string) => void;
}

/**
 * Complete store type
 */
export interface DiagramStore extends
    TabsSlice,
    LayersSlice,
    SearchSlice,
    NodesEdgesSlice,
    SelectionSlice,
    ClipboardSlice,
    HistorySlice,
    ZIndexSlice {
    // Viewport (for active tab)
    viewport: Viewport;
    setViewport: (viewport: Viewport) => void;

    // Hidden/Locked nodes (legacy compatibility)
    hiddenNodeIds: Set<string>;
    lockedNodeIds: Set<string>;
    toggleNodeVisibility: (nodeId: string) => void;
    toggleNodeLocked: (nodeId: string) => void;
    isNodeHidden: (nodeId: string) => boolean;
    isNodeLocked: (nodeId: string) => boolean;

    // ReactFlow change handlers
    onNodesChange: (changes: import('@xyflow/react').NodeChange[]) => void;
    onEdgesChange: (changes: import('@xyflow/react').EdgeChange[]) => void;

    // Grouping
    groupSelected: () => void;
    ungroupSelected: () => void;
    canGroup: () => boolean;
    canUngroup: () => boolean;

    // Persistence
    currentDiagramId: string | null;
    isDirty: boolean;
    setCurrentDiagramId: (id: string | null) => void;
    setDirty: (dirty: boolean) => void;

    // Legacy compatibility
    selectedNodeIds: string[];
    setSelectedNodeIds: (ids: string[]) => void;
    deleteSelected: () => void;
}

// =============================================================================
// Selector Types for Performance
// =============================================================================

/**
 * Memoized selectors for performance optimization
 */
export interface DiagramSelectors {
    /** Get visible nodes (filtered by layer visibility) */
    selectVisibleNodes: (state: DiagramStore) => DiagramNode[];
    /** Get visible edges (filtered by connected node visibility) */
    selectVisibleEdges: (state: DiagramStore) => DiagramEdge[];
    /** Get nodes by layer */
    selectNodesByLayer: (state: DiagramStore, layerId: string) => DiagramNode[];
    /** Get selected nodes */
    selectSelectedNodes: (state: DiagramStore) => DiagramNode[];
    /** Get selected edges */
    selectSelectedEdges: (state: DiagramStore) => DiagramEdge[];
    /** Search nodes by query */
    selectSearchResults: (state: DiagramStore, query: string) => SearchResult[];
}
