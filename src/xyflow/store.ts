/**
 * XY Flow Store
 *
 * Zustand store for XY Flow state management with:
 * - Nodes and edges state
 * - Selection management
 * - Visibility and lock toggles
 * - Undo/redo history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    applyNodeChanges,
    applyEdgeChanges,
    type NodeChange,
    type EdgeChange,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { DiagramNode, DiagramEdge } from './types';
import { XYFLOW_PERSISTENCE_KEY, HISTORY_MAX_SIZE } from './constants';
import type { CopiedStyle } from '../utils/style-utils';
import { extractStyle, applyStyle } from '../utils/style-utils';

// =============================================================================
// Types
// =============================================================================

interface HistoryEntry {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    timestamp: number;
    description?: string;
}

interface ClipboardData {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
}

/** Offset for pasted nodes to avoid overlap */
const PASTE_OFFSET = 20;

interface XYFlowStore {
    // State
    nodes: DiagramNode[];
    edges: DiagramEdge[];

    // Clipboard
    clipboard: ClipboardData | null;
    setClipboard: (data: ClipboardData | null) => void;
    copySelected: () => void;
    pasteClipboard: () => void;
    cutSelected: () => void;
    selectAll: () => void;
    duplicateSelected: () => void;
    deleteSelected: () => void;

    // Persistence state
    currentDiagramId: string | null;
    isDirty: boolean;

    // Persistence actions
    setCurrentDiagramId: (id: string | null) => void;
    setDirty: (dirty: boolean) => void;

    // Selection
    selectedNodeIds: string[];
    setSelectedNodeIds: (ids: string[]) => void;
    selectNode: (nodeId: string, multiSelect?: boolean) => void;
    clearSelection: () => void;

    // Node visibility/lock
    hiddenNodeIds: Set<string>;
    lockedNodeIds: Set<string>;
    toggleNodeVisibility: (nodeId: string) => void;
    toggleNodeLocked: (nodeId: string) => void;
    setNodeVisibility: (nodeId: string, visible: boolean) => void;
    setNodeLocked: (nodeId: string, locked: boolean) => void;
    isNodeHidden: (nodeId: string) => boolean;
    isNodeLocked: (nodeId: string) => boolean;

    // History
    history: HistoryEntry[];
    historyIndex: number;
    pushHistory: (description?: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    jumpToHistory: (index: number) => void;
    clearHistory: () => void;

    // Actions
    setNodes: (nodes: DiagramNode[]) => void;
    setEdges: (edges: DiagramEdge[]) => void;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    addNode: (node: DiagramNode) => void;
    addEdge: (edge: DiagramEdge) => void;
    removeNode: (nodeId: string) => void;
    removeEdge: (edgeId: string) => void;
    updateNode: (nodeId: string, data: Partial<DiagramNode>) => void;
    updateEdge: (edgeId: string, data: Partial<DiagramEdge>) => void;
    updateNodeData: (nodeId: string, data: Partial<DiagramNode['data']>) => void;
    updateEdgeLabel: (edgeId: string, label: string) => void;
    clearAll: () => void;

    // Z-index management
    bringToFront: (nodeId: string) => void;
    sendToBack: (nodeId: string) => void;
    moveNodeUp: (nodeId: string) => void;
    moveNodeDown: (nodeId: string) => void;

    // Grouping
    groupSelected: () => void;
    ungroupSelected: () => void;
    canGroup: () => boolean;
    canUngroup: () => boolean;

    // Format Painter (Style Copy/Paste)
    copiedStyle: CopiedStyle | null;
    setCopiedStyle: (style: CopiedStyle | null) => void;
    copyStyleFromSelected: () => boolean;
    applyStyleToSelected: () => boolean;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useXYFlowStore = create<XYFlowStore>()(
    persist(
        (set, get) => ({
            // Initial state
            nodes: [],
            edges: [],
            clipboard: null,
            copiedStyle: null,
            currentDiagramId: null,
            isDirty: false,
            selectedNodeIds: [],
            hiddenNodeIds: new Set<string>(),
            lockedNodeIds: new Set<string>(),
            history: [],
            historyIndex: -1,

            // Clipboard actions
            setClipboard: (data) => set({ clipboard: data }),

            copySelected: () => {
                const { nodes, edges } = get();
                const selectedNodes = nodes.filter((n) => n.selected);

                if (selectedNodes.length === 0) return;

                const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

                // Copy edges that connect selected nodes
                const selectedEdges = edges.filter(
                    (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
                );

                set({
                    clipboard: {
                        nodes: JSON.parse(JSON.stringify(selectedNodes)),
                        edges: JSON.parse(JSON.stringify(selectedEdges)),
                    },
                });
            },

            pasteClipboard: () => {
                const { clipboard, nodes, edges, pushHistory } = get();

                if (!clipboard || clipboard.nodes.length === 0) return;

                pushHistory('Paste nodes');

                // Create ID mapping for new nodes
                const idMap = new Map<string, string>();
                clipboard.nodes.forEach((node) => {
                    idMap.set(node.id, `node-${nanoid(8)}`);
                });

                // Create new nodes with offset and new IDs
                const newNodes: DiagramNode[] = clipboard.nodes.map((node) => ({
                    ...node,
                    id: idMap.get(node.id)!,
                    position: {
                        x: node.position.x + PASTE_OFFSET,
                        y: node.position.y + PASTE_OFFSET,
                    },
                    selected: true,
                }));

                // Create new edges with updated source/target IDs
                const newEdges: DiagramEdge[] = clipboard.edges.map((edge) => ({
                    ...edge,
                    id: `edge-${nanoid(8)}`,
                    source: idMap.get(edge.source) ?? edge.source,
                    target: idMap.get(edge.target) ?? edge.target,
                    selected: false,
                }));

                // Deselect existing nodes
                const updatedNodes = nodes.map((n) => ({ ...n, selected: false }));

                set({
                    nodes: [...updatedNodes, ...newNodes],
                    edges: [...edges, ...newEdges],
                });
            },

            cutSelected: () => {
                const { copySelected, deleteSelected } = get();
                copySelected();
                deleteSelected();
            },

            selectAll: () => {
                const { nodes } = get();
                set({
                    nodes: nodes.map((n) => ({ ...n, selected: true })),
                });
            },

            duplicateSelected: () => {
                const { copySelected, pasteClipboard } = get();
                copySelected();
                pasteClipboard();
            },

            deleteSelected: () => {
                const { nodes, edges, pushHistory, selectedNodeIds } = get();
                const selectedNodes = nodes.filter((n) => n.selected);
                const selectedEdges = edges.filter((e) => e.selected);

                if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

                pushHistory('Delete selected');

                const nodeIdsToDelete = new Set(selectedNodes.map((n) => n.id));

                set({
                    nodes: nodes.filter((n) => !nodeIdsToDelete.has(n.id)),
                    edges: edges.filter(
                        (e) =>
                            !e.selected &&
                            !nodeIdsToDelete.has(e.source) &&
                            !nodeIdsToDelete.has(e.target)
                    ),
                    selectedNodeIds: selectedNodeIds.filter((id) => !nodeIdsToDelete.has(id)),
                });
            },

            // Persistence actions
            setCurrentDiagramId: (id) => set({ currentDiagramId: id }),
            setDirty: (dirty) => set({ isDirty: dirty }),

            // Selection
            setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

            selectNode: (nodeId, multiSelect = false) => {
                const { selectedNodeIds } = get();
                if (multiSelect) {
                    if (selectedNodeIds.includes(nodeId)) {
                        set({ selectedNodeIds: selectedNodeIds.filter((id) => id !== nodeId) });
                    } else {
                        set({ selectedNodeIds: [...selectedNodeIds, nodeId] });
                    }
                } else {
                    set({ selectedNodeIds: [nodeId] });
                }
            },

            clearSelection: () => set({ selectedNodeIds: [] }),


            // Visibility
            toggleNodeVisibility: (nodeId) => {
                const { hiddenNodeIds } = get();
                const newHidden = new Set(hiddenNodeIds);
                if (newHidden.has(nodeId)) {
                    newHidden.delete(nodeId);
                } else {
                    newHidden.add(nodeId);
                }
                set({ hiddenNodeIds: newHidden });
            },

            setNodeVisibility: (nodeId, visible) => {
                const { hiddenNodeIds } = get();
                const newHidden = new Set(hiddenNodeIds);
                if (visible) {
                    newHidden.delete(nodeId);
                } else {
                    newHidden.add(nodeId);
                }
                set({ hiddenNodeIds: newHidden });
            },

            isNodeHidden: (nodeId) => get().hiddenNodeIds.has(nodeId),

            // Lock
            toggleNodeLocked: (nodeId) => {
                const { lockedNodeIds } = get();
                const newLocked = new Set(lockedNodeIds);
                if (newLocked.has(nodeId)) {
                    newLocked.delete(nodeId);
                } else {
                    newLocked.add(nodeId);
                }
                set({ lockedNodeIds: newLocked });
            },

            setNodeLocked: (nodeId, locked) => {
                const { lockedNodeIds } = get();
                const newLocked = new Set(lockedNodeIds);
                if (locked) {
                    newLocked.add(nodeId);
                } else {
                    newLocked.delete(nodeId);
                }
                set({ lockedNodeIds: newLocked });
            },

            isNodeLocked: (nodeId) => get().lockedNodeIds.has(nodeId),

            // =================================================================
            // History - Simple undo/redo
            // =================================================================
            // pushHistory saves current state BEFORE a change
            // undo restores the last saved state
            // redo moves forward in history

            pushHistory: (description) => {
                const { nodes, edges, history, historyIndex } = get();

                const entry: HistoryEntry = {
                    nodes: JSON.parse(JSON.stringify(nodes)),
                    edges: JSON.parse(JSON.stringify(edges)),
                    timestamp: Date.now(),
                    description,
                };

                // Truncate future history if we're not at the end
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(entry);

                // Limit history size
                while (newHistory.length > HISTORY_MAX_SIZE) {
                    newHistory.shift();
                }

                set({
                    history: newHistory,
                    historyIndex: newHistory.length - 1,
                });
            },

            undo: () => {
                const { history, historyIndex } = get();

                if (history.length === 0 || historyIndex < 0) return;

                const stateToRestore = history[historyIndex];
                if (!stateToRestore) return;

                set({
                    nodes: JSON.parse(JSON.stringify(stateToRestore.nodes)),
                    edges: JSON.parse(JSON.stringify(stateToRestore.edges)),
                    historyIndex: historyIndex - 1,
                });
            },

            redo: () => {
                const { history, historyIndex } = get();

                const nextIndex = historyIndex + 2;
                if (nextIndex >= history.length) return;

                const stateToRestore = history[nextIndex];
                if (!stateToRestore) return;

                set({
                    nodes: JSON.parse(JSON.stringify(stateToRestore.nodes)),
                    edges: JSON.parse(JSON.stringify(stateToRestore.edges)),
                    historyIndex: historyIndex + 1,
                });
            },

            canUndo: () => {
                const { history, historyIndex } = get();
                return history.length > 0 && historyIndex >= 0;
            },

            canRedo: () => {
                const { history, historyIndex } = get();
                return historyIndex + 2 < history.length;
            },

            jumpToHistory: (index) => {
                const { history } = get();
                if (index < 0 || index >= history.length) return;

                const entry = history[index];
                if (entry) {
                    set({
                        nodes: JSON.parse(JSON.stringify(entry.nodes)),
                        edges: JSON.parse(JSON.stringify(entry.edges)),
                        historyIndex: index - 1,
                    });
                }
            },

            clearHistory: () => set({ history: [], historyIndex: -1 }),

            // =================================================================
            // Node/Edge actions
            // =================================================================

            setNodes: (nodes) => set({ nodes }),
            setEdges: (edges) => set({ edges }),

            onNodesChange: (changes) => {
                const { lockedNodeIds } = get();
                const filteredChanges = changes.filter((change) => {
                    if (change.type === 'select') return true;
                    if ('id' in change && lockedNodeIds.has(change.id)) return false;
                    return true;
                });

                set({
                    nodes: applyNodeChanges(filteredChanges, get().nodes) as DiagramNode[],
                });
            },

            onEdgesChange: (changes) => {
                set({
                    edges: applyEdgeChanges(changes, get().edges) as DiagramEdge[],
                });
            },

            addNode: (node) => {
                const { pushHistory } = get();
                pushHistory(`Add node: ${node.data?.label ?? node.id}`);
                set({ nodes: [...get().nodes, node] });
            },

            addEdge: (edge) => {
                const { pushHistory } = get();
                pushHistory(`Add edge: ${edge.id}`);
                set({ edges: [...get().edges, edge] });
            },

            removeNode: (nodeId) => {
                const { pushHistory, selectedNodeIds } = get();
                pushHistory(`Remove node: ${nodeId}`);
                set({
                    nodes: get().nodes.filter((n) => n.id !== nodeId),
                    edges: get().edges.filter(
                        (e) => e.source !== nodeId && e.target !== nodeId
                    ),
                    selectedNodeIds: selectedNodeIds.filter((id) => id !== nodeId),
                });
            },

            removeEdge: (edgeId) => {
                const { pushHistory } = get();
                pushHistory(`Remove edge: ${edgeId}`);
                set({
                    edges: get().edges.filter((e) => e.id !== edgeId),
                });
            },

            updateNode: (nodeId, data) => {
                set({
                    nodes: get().nodes.map((n) =>
                        n.id === nodeId ? { ...n, ...data } : n
                    ),
                });
            },

            updateEdge: (edgeId, data) => {
                set({
                    edges: get().edges.map((e) =>
                        e.id === edgeId ? { ...e, ...data } : e
                    ),
                });
            },

            updateNodeData: (nodeId, data) => {
                set({
                    nodes: get().nodes.map((n) =>
                        n.id === nodeId
                            ? { ...n, data: { ...n.data, ...data } }
                            : n
                    ),
                });
            },

            updateEdgeLabel: (edgeId, label) => {
                set({
                    edges: get().edges.map((e) =>
                        e.id === edgeId
                            ? { ...e, data: { ...e.data, label } }
                            : e
                    ),
                });
            },

            clearAll: () => {
                const { pushHistory } = get();
                pushHistory('Clear all');
                set({
                    nodes: [],
                    edges: [],
                    selectedNodeIds: [],
                    hiddenNodeIds: new Set(),
                    lockedNodeIds: new Set(),
                });
            },


            // =================================================================
            // Z-index management
            // =================================================================

            bringToFront: (nodeId) => {
                const { nodes, pushHistory } = get();
                const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
                if (nodeIndex === -1 || nodeIndex === nodes.length - 1) return;

                pushHistory(`Bring to front: ${nodeId}`);
                const newNodes = [...nodes];
                const [node] = newNodes.splice(nodeIndex, 1);
                newNodes.push(node);
                set({ nodes: newNodes });
            },

            sendToBack: (nodeId) => {
                const { nodes, pushHistory } = get();
                const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
                if (nodeIndex === -1 || nodeIndex === 0) return;

                pushHistory(`Send to back: ${nodeId}`);
                const newNodes = [...nodes];
                const [node] = newNodes.splice(nodeIndex, 1);
                newNodes.unshift(node);
                set({ nodes: newNodes });
            },

            moveNodeUp: (nodeId) => {
                const { nodes, pushHistory } = get();
                const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
                if (nodeIndex === -1 || nodeIndex === nodes.length - 1) return;

                pushHistory(`Move up: ${nodeId}`);
                const newNodes = [...nodes];
                [newNodes[nodeIndex], newNodes[nodeIndex + 1]] = [
                    newNodes[nodeIndex + 1],
                    newNodes[nodeIndex],
                ];
                set({ nodes: newNodes });
            },

            moveNodeDown: (nodeId) => {
                const { nodes, pushHistory } = get();
                const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
                if (nodeIndex === -1 || nodeIndex === 0) return;

                pushHistory(`Move down: ${nodeId}`);
                const newNodes = [...nodes];
                [newNodes[nodeIndex], newNodes[nodeIndex - 1]] = [
                    newNodes[nodeIndex - 1],
                    newNodes[nodeIndex],
                ];
                set({ nodes: newNodes });
            },

            // =================================================================
            // Grouping
            // =================================================================

            groupSelected: () => {
                const { nodes, pushHistory } = get();
                const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'group');

                if (selectedNodes.length < 2) return;

                pushHistory('Group nodes');

                const PADDING = 40;
                const HEADER_HEIGHT = 32;

                let minX = Infinity;
                let minY = Infinity;
                let maxX = -Infinity;
                let maxY = -Infinity;

                selectedNodes.forEach((node) => {
                    const width = node.measured?.width ?? node.width ?? 150;
                    const height = node.measured?.height ?? node.height ?? 60;

                    minX = Math.min(minX, node.position.x);
                    minY = Math.min(minY, node.position.y);
                    maxX = Math.max(maxX, node.position.x + width);
                    maxY = Math.max(maxY, node.position.y + height);
                });

                const groupId = `group-${nanoid(8)}`;
                const groupNode: DiagramNode = {
                    id: groupId,
                    type: 'group',
                    position: {
                        x: minX - PADDING,
                        y: minY - PADDING - HEADER_HEIGHT,
                    },
                    style: {
                        width: maxX - minX + PADDING * 2,
                        height: maxY - minY + PADDING * 2 + HEADER_HEIGHT,
                    },
                    data: {
                        label: 'Group',
                    },
                    selected: false,
                };

                const updatedNodes = nodes.map((node) => {
                    if (node.selected && node.type !== 'group') {
                        return {
                            ...node,
                            parentId: groupId,
                            position: {
                                x: node.position.x - groupNode.position.x,
                                y: node.position.y - groupNode.position.y,
                            },
                            selected: false,
                            extent: 'parent' as const,
                        };
                    }
                    return { ...node, selected: false };
                });

                set({ nodes: [groupNode, ...updatedNodes] });
            },

            ungroupSelected: () => {
                const { nodes, pushHistory } = get();
                const selectedGroups = nodes.filter((n) => n.selected && n.type === 'group');

                if (selectedGroups.length === 0) return;

                pushHistory('Ungroup nodes');

                const groupIds = new Set(selectedGroups.map((g) => g.id));

                const updatedNodes = nodes
                    .filter((n) => !groupIds.has(n.id))
                    .map((node) => {
                        if (node.parentId && groupIds.has(node.parentId)) {
                            const parentGroup = selectedGroups.find((g) => g.id === node.parentId);
                            if (parentGroup) {
                                return {
                                    ...node,
                                    parentId: undefined,
                                    extent: undefined,
                                    position: {
                                        x: node.position.x + parentGroup.position.x,
                                        y: node.position.y + parentGroup.position.y,
                                    },
                                };
                            }
                        }
                        return node;
                    });

                set({ nodes: updatedNodes });
            },

            canGroup: () => {
                const { nodes } = get();
                const selectedNodes = nodes.filter((n) => n.selected && n.type !== 'group');
                return selectedNodes.length >= 2;
            },

            canUngroup: () => {
                const { nodes } = get();
                return nodes.some((n) => n.selected && n.type === 'group');
            },

            // =================================================================
            // Format Painter (Style Copy/Paste)
            // =================================================================

            setCopiedStyle: (style) => set({ copiedStyle: style }),

            copyStyleFromSelected: () => {
                const { nodes } = get();
                const selectedNodes = nodes.filter((n) => n.selected);

                // Need exactly one selected node to copy style from
                if (selectedNodes.length !== 1) {
                    return false;
                }

                const sourceNode = selectedNodes[0];
                const style = extractStyle(sourceNode);

                set({ copiedStyle: style });
                return true;
            },

            applyStyleToSelected: () => {
                const { nodes, copiedStyle, pushHistory } = get();

                if (!copiedStyle) {
                    return false;
                }

                const selectedNodes = nodes.filter((n) => n.selected);

                if (selectedNodes.length === 0) {
                    return false;
                }

                pushHistory('Apply style');

                const selectedIds = new Set(selectedNodes.map((n) => n.id));
                const updatedNodes = nodes.map((node) => {
                    if (selectedIds.has(node.id)) {
                        return applyStyle(node, copiedStyle);
                    }
                    return node;
                });

                set({ nodes: updatedNodes });
                return true;
            },
        }),
        {
            name: XYFLOW_PERSISTENCE_KEY,
            partialize: (state) => ({
                nodes: state.nodes,
                edges: state.edges,
                hiddenNodeIds: Array.from(state.hiddenNodeIds),
                lockedNodeIds: Array.from(state.lockedNodeIds),
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<XYFlowStore> & {
                    hiddenNodeIds?: string[];
                    lockedNodeIds?: string[];
                };
                return {
                    ...currentState,
                    ...persisted,
                    hiddenNodeIds: new Set(persisted.hiddenNodeIds ?? []),
                    lockedNodeIds: new Set(persisted.lockedNodeIds ?? []),
                };
            },
        }
    )
);
