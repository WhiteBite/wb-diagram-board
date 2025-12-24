/**
 * WB Canvas - Zustand Store
 * 
 * Global state management with undo/redo support
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    CanvasState,
    CanvasElement,
    Tool,
    Transform,
    StrokeStyle,
    FillStyle,
    TextStyle,
    HistoryEntry,
    ResizeHandle,
    Point,
    Bounds,
    FrameElement,
    ConnectorElement,
    Binding,
    createId,
    DEFAULT_STROKE,
    DEFAULT_FILL,
    DEFAULT_TEXT_STYLE,
} from '../types/canvas';
import { routerRegistry } from '../core/routing';

// =============================================================================
// Store Actions Interface
// =============================================================================

interface CanvasActions {
    // Elements
    addElement: (element: CanvasElement) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    updateElements: (updates: Record<string, Partial<CanvasElement>>) => void; // Batch update with single history entry
    updateElementSilent: (id: string, updates: Partial<CanvasElement>) => void; // No history
    deleteElements: (ids: string[]) => void;
    duplicateElements: (ids: string[]) => CanvasElement[];
    setElementLocked: (id: string, locked: boolean) => void;
    toggleLocked: (ids: string[]) => void;

    // Selection
    setSelection: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    clearSelection: () => void;
    selectAll: () => void;
    setHovered: (id: string | null) => void;

    // Transform
    setTransform: (transform: Partial<Transform>) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToFit: () => void;
    resetZoom: () => void;

    // Tool
    setTool: (tool: Tool) => void;

    // Styles
    setStroke: (stroke: Partial<StrokeStyle>) => void;
    setFill: (fill: Partial<FillStyle>) => void;
    setTextStyle: (style: Partial<TextStyle>) => void;

    // Grid
    toggleGrid: () => void;
    toggleSnapToGrid: () => void;
    setGridSize: (size: number) => void;
    toggleRoughStyle: () => void;
    setDarkMode: (darkMode: boolean) => void;

    // History
    undo: () => void;
    redo: () => void;
    pushHistory: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;

    // UI State
    setDrawing: (isDrawing: boolean) => void;
    setPanning: (isPanning: boolean) => void;
    setResizing: (isResizing: boolean, handle?: ResizeHandle | null) => void;

    // Clipboard
    copy: () => void;
    cut: () => void;
    paste: (offset?: Point) => void;

    // Z-Order
    bringToFront: (ids: string[]) => void;
    sendToBack: (ids: string[]) => void;
    bringForward: (ids: string[]) => void;
    sendBackward: (ids: string[]) => void;

    // Grouping
    group: (ids: string[]) => string;
    ungroup: (groupId: string) => void;

    // Layers
    renameElement: (id: string, name: string) => void;
    toggleElementVisibility: (id: string) => void;
    toggleElementLocked: (id: string) => void;
    reorderElements: (elementIds: string[], targetIndex: number) => void;

    // Frame children management
    updateFrameChildren: (frameId: string) => void;
    addChildToFrame: (frameId: string, childId: string) => void;
    removeChildFromFrame: (frameId: string, childId: string) => void;
    moveFrameWithChildren: (frameId: string, dx: number, dy: number) => void;

    // Alignment
    alignElements: (ids: string[], alignment: AlignmentType) => void;
    distributeElements: (ids: string[], direction: 'horizontal' | 'vertical') => void;

    // Routing
    updateConnectorRoute: (connectorId: string) => void;

    // Binding
    bindConnector: (connectorId: string, startBinding: Binding, endBinding: Binding) => void;
    updateConnectorBindings: (elementId: string) => void;

    // Storage
    markDirty: () => void;
    markClean: () => void;

    // Import/Export
    exportToJSON: () => string;
    importFromJSON: (json: string) => void;
    clear: () => void;
}

type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

// =============================================================================
// Initial State
// =============================================================================

const initialState: CanvasState = {
    elements: {},
    elementOrder: [],
    transform: { x: 0, y: 0, scale: 1 },
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 20,
    selectedIds: [],
    hoveredId: null,
    activeTool: 'select',
    currentStroke: DEFAULT_STROKE,
    currentFill: DEFAULT_FILL,
    currentTextStyle: DEFAULT_TEXT_STYLE,
    roughStyle: false, // Clean style by default for tech interviews
    darkMode: false,
    history: [],
    historyIndex: -1,
    isDrawing: false,
    isPanning: false,
    isResizing: false,
    resizeHandle: null,
    clipboard: [],
};

// =============================================================================
// Store
// =============================================================================

export const useCanvasStore = create<CanvasState & CanvasActions>()(
    immer((set, get) => ({
        ...initialState,

        // =====================================================================
        // Elements
        // =====================================================================

        addElement: (element) => {
            const before: Record<string, CanvasElement | null> = { [element.id]: null };
            const after: Record<string, CanvasElement | null> = { [element.id]: element };

            set((draft) => {
                draft.elements[element.id] = element;
                draft.elementOrder.push(element.id);
            });

            get().pushHistory({ type: 'add', elementIds: [element.id], before, after });
        },

        updateElement: (id, updates) => {
            const element = get().elements[id];
            if (!element) return;

            const before: Record<string, CanvasElement | null> = { [id]: { ...element } };

            set((draft) => {
                Object.assign(draft.elements[id], updates, { updatedAt: Date.now() });
            });

            const after: Record<string, CanvasElement | null> = { [id]: get().elements[id] };
            get().pushHistory({ type: 'update', elementIds: [id], before, after });
        },

        // Batch update multiple elements with single history entry
        updateElements: (updates) => {
            const state = get();
            const elementIds = Object.keys(updates);
            if (elementIds.length === 0) return;

            const before: Record<string, CanvasElement | null> = {};
            const after: Record<string, CanvasElement | null> = {};

            // Capture before state
            elementIds.forEach((id) => {
                const element = state.elements[id];
                if (element) {
                    before[id] = { ...element };
                }
            });

            // Apply updates
            set((draft) => {
                elementIds.forEach((id) => {
                    if (draft.elements[id]) {
                        Object.assign(draft.elements[id], updates[id], { updatedAt: Date.now() });
                    }
                });
            });

            // Capture after state
            const newState = get();
            elementIds.forEach((id) => {
                after[id] = newState.elements[id] || null;
            });

            // Push single history entry for all updates
            get().pushHistory({ type: 'update', elementIds, before, after });
        },

        // Update without recording history (for drag operations)
        updateElementSilent: (id, updates) => {
            const element = get().elements[id];
            if (!element) return;

            set((draft) => {
                Object.assign(draft.elements[id], updates, { updatedAt: Date.now() });
            });
        },

        deleteElements: (ids) => {
            const state = get();
            const before: Record<string, CanvasElement | null> = {};
            const after: Record<string, CanvasElement | null> = {};

            ids.forEach((id) => {
                before[id] = state.elements[id] || null;
                after[id] = null;
            });

            set((draft) => {
                ids.forEach((id) => {
                    delete draft.elements[id];
                    const idx = draft.elementOrder.indexOf(id);
                    if (idx !== -1) draft.elementOrder.splice(idx, 1);
                });
                draft.selectedIds = draft.selectedIds.filter((id) => !ids.includes(id));
            });

            get().pushHistory({ type: 'delete', elementIds: ids, before, after });
        },

        duplicateElements: (ids) => {
            const state = get();
            const newElements: CanvasElement[] = [];
            const offset = 20;

            ids.forEach((id) => {
                const element = state.elements[id];
                if (element) {
                    const newElement = {
                        ...JSON.parse(JSON.stringify(element)),
                        id: createId(),
                        x: element.x + offset,
                        y: element.y + offset,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };
                    newElements.push(newElement);
                }
            });

            set((draft) => {
                newElements.forEach((el) => {
                    draft.elements[el.id] = el;
                    draft.elementOrder.push(el.id);
                });
                draft.selectedIds = newElements.map((el) => el.id);
            });

            return newElements;
        },

        // =====================================================================
        // Selection
        // =====================================================================

        setSelection: (ids) => set((draft) => {
            draft.selectedIds = ids;

            // Update frame children when selecting a frame
            ids.forEach(id => {
                const el = draft.elements[id];
                if (el && el.type === 'frame') {
                    // Find all elements inside frame bounds
                    const childIds: string[] = [];
                    Object.values(draft.elements).forEach((childEl) => {
                        // Skip the frame itself and other frames
                        if (childEl.id === id || childEl.type === 'frame') return;

                        // Check if element is completely inside frame bounds
                        const isInside =
                            childEl.x >= el.x &&
                            childEl.y >= el.y &&
                            childEl.x + childEl.width <= el.x + el.width &&
                            childEl.y + childEl.height <= el.y + el.height;

                        if (isInside) {
                            childIds.push(childEl.id);
                        }
                    });

                    // Update frame's childIds
                    (draft.elements[id] as FrameElement).childIds = childIds;
                }
            });
        }),

        addToSelection: (id) => set((draft) => {
            if (!draft.selectedIds.includes(id)) {
                draft.selectedIds.push(id);
            }
        }),

        removeFromSelection: (id) => set((draft) => {
            draft.selectedIds = draft.selectedIds.filter((i) => i !== id);
        }),

        clearSelection: () => set((draft) => { draft.selectedIds = []; }),

        selectAll: () => set((draft) => {
            draft.selectedIds = Object.keys(draft.elements).filter(
                (id) => !draft.elements[id].locked
            );
        }),

        setHovered: (id) => set((draft) => { draft.hoveredId = id; }),

        // =====================================================================
        // Transform
        // =====================================================================

        setTransform: (transform) => set((draft) => {
            Object.assign(draft.transform, transform);
        }),

        zoomIn: () => set((draft) => {
            draft.transform.scale = Math.min(draft.transform.scale * 1.2, 10);
        }),

        zoomOut: () => set((draft) => {
            draft.transform.scale = Math.max(draft.transform.scale / 1.2, 0.1);
        }),

        zoomToFit: () => {
            const state = get();
            const elements = Object.values(state.elements);
            if (elements.length === 0) return;

            const bounds = getElementsBounds(elements);
            if (!bounds) return;

            // Calculate zoom to fit with padding
            const padding = 100;
            const viewWidth = window.innerWidth - padding * 2;
            const viewHeight = window.innerHeight - padding * 2;
            const scale = Math.min(
                viewWidth / bounds.width,
                viewHeight / bounds.height,
                1
            );

            set((draft) => {
                draft.transform = {
                    x: -bounds.x * scale + (window.innerWidth - bounds.width * scale) / 2,
                    y: -bounds.y * scale + (window.innerHeight - bounds.height * scale) / 2,
                    scale,
                };
            });
        },

        resetZoom: () => set((draft) => {
            draft.transform = { x: 0, y: 0, scale: 1 };
        }),

        // =====================================================================
        // Tool
        // =====================================================================

        setTool: (tool) => set((draft) => {
            draft.activeTool = tool;
            // Clear selection when switching to eraser (eraser doesn't work with selection)
            if (tool === 'eraser') {
                draft.selectedIds = [];
            }
            // Selection is preserved when switching to other tools (Miro-like behavior)
        }),

        // =====================================================================
        // Styles
        // =====================================================================

        setStroke: (stroke) => set((draft) => {
            Object.assign(draft.currentStroke, stroke);
        }),

        setFill: (fill) => set((draft) => {
            Object.assign(draft.currentFill, fill);
        }),

        setTextStyle: (style) => set((draft) => {
            Object.assign(draft.currentTextStyle, style);
        }),

        // =====================================================================
        // Grid
        // =====================================================================

        toggleGrid: () => set((draft) => { draft.gridEnabled = !draft.gridEnabled; }),
        toggleSnapToGrid: () => set((draft) => { draft.snapToGrid = !draft.snapToGrid; }),
        setGridSize: (size) => set((draft) => { draft.gridSize = size; }),
        toggleRoughStyle: () => set((draft) => { draft.roughStyle = !draft.roughStyle; }),
        setDarkMode: (darkMode) => set((draft) => { draft.darkMode = darkMode; }),

        // =====================================================================
        // History
        // =====================================================================

        pushHistory: (entry) => set((draft) => {
            // Remove any redo entries
            draft.history = draft.history.slice(0, draft.historyIndex + 1);

            // Add new entry
            draft.history.push({
                ...entry,
                id: createId(),
                timestamp: Date.now(),
            });

            draft.historyIndex = draft.history.length - 1;

            // Limit history size
            if (draft.history.length > 100) {
                draft.history.shift();
                draft.historyIndex--;
            }
        }),

        undo: () => {
            const state = get();
            if (state.historyIndex < 0) return;

            const entry = state.history[state.historyIndex];

            set((draft) => {
                // Restore previous state
                entry.elementIds.forEach((id) => {
                    const before = entry.before[id];
                    if (before === null) {
                        delete draft.elements[id];
                        const idx = draft.elementOrder.indexOf(id);
                        if (idx !== -1) draft.elementOrder.splice(idx, 1);
                    } else {
                        draft.elements[id] = before;
                        if (!draft.elementOrder.includes(id)) {
                            draft.elementOrder.push(id);
                        }
                    }
                });

                draft.historyIndex--;
            });
        },

        redo: () => {
            const state = get();
            if (state.historyIndex >= state.history.length - 1) return;

            const entry = state.history[state.historyIndex + 1];

            set((draft) => {
                // Apply next state
                entry.elementIds.forEach((id) => {
                    const after = entry.after[id];
                    if (after === null) {
                        delete draft.elements[id];
                        const idx = draft.elementOrder.indexOf(id);
                        if (idx !== -1) draft.elementOrder.splice(idx, 1);
                    } else {
                        draft.elements[id] = after;
                        if (!draft.elementOrder.includes(id)) {
                            draft.elementOrder.push(id);
                        }
                    }
                });

                draft.historyIndex++;
            });
        },

        // =====================================================================
        // UI State
        // =====================================================================

        setDrawing: (isDrawing) => set((draft) => { draft.isDrawing = isDrawing; }),
        setPanning: (isPanning) => set((draft) => { draft.isPanning = isPanning; }),
        setResizing: (isResizing, handle = null) => set((draft) => {
            draft.isResizing = isResizing;
            draft.resizeHandle = handle;
        }),

        // =====================================================================
        // Clipboard
        // =====================================================================

        copy: () => {
            const state = get();
            const elements = state.selectedIds
                .map((id) => state.elements[id])
                .filter(Boolean);

            set((draft) => {
                draft.clipboard = JSON.parse(JSON.stringify(elements));
            });
        },

        cut: () => {
            const state = get();
            state.copy();
            state.deleteElements(state.selectedIds);
        },

        paste: (offset = { x: 20, y: 20 }) => {
            const state = get();
            if (state.clipboard.length === 0) return;

            const newElements: CanvasElement[] = state.clipboard.map((el) => ({
                ...JSON.parse(JSON.stringify(el)),
                id: createId(),
                x: el.x + offset.x,
                y: el.y + offset.y,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }));

            set((draft) => {
                newElements.forEach((el) => {
                    draft.elements[el.id] = el;
                    draft.elementOrder.push(el.id);
                });
                draft.selectedIds = newElements.map((el) => el.id);
            });
        },

        // =====================================================================
        // Z-Order
        // =====================================================================

        bringToFront: (ids) => set((draft) => {
            const remaining = draft.elementOrder.filter((id) => !ids.includes(id));
            draft.elementOrder = [...remaining, ...ids];
        }),

        sendToBack: (ids) => set((draft) => {
            const remaining = draft.elementOrder.filter((id) => !ids.includes(id));
            draft.elementOrder = [...ids, ...remaining];
        }),

        bringForward: (ids) => set((draft) => {
            ids.forEach((id) => {
                const idx = draft.elementOrder.indexOf(id);
                if (idx < draft.elementOrder.length - 1) {
                    [draft.elementOrder[idx], draft.elementOrder[idx + 1]] =
                        [draft.elementOrder[idx + 1], draft.elementOrder[idx]];
                }
            });
        }),

        sendBackward: (ids) => set((draft) => {
            ids.forEach((id) => {
                const idx = draft.elementOrder.indexOf(id);
                if (idx > 0) {
                    [draft.elementOrder[idx], draft.elementOrder[idx - 1]] =
                        [draft.elementOrder[idx - 1], draft.elementOrder[idx]];
                }
            });
        }),

        // =====================================================================
        // Locking
        // =====================================================================

        setElementLocked: (id, locked) => {
            const element = get().elements[id];
            if (!element) return;

            set((draft) => {
                draft.elements[id].locked = locked;
            });
        },

        toggleLocked: (ids) => {
            const state = get();
            const allLocked = ids.every(id => state.elements[id]?.locked);

            set((draft) => {
                ids.forEach(id => {
                    if (draft.elements[id]) {
                        draft.elements[id].locked = !allLocked;
                    }
                });
            });
        },

        // =====================================================================
        // Grouping
        // =====================================================================

        group: (ids) => {
            const groupId = createId();
            set((draft) => {
                ids.forEach((id) => {
                    if (draft.elements[id]) {
                        draft.elements[id].groupId = groupId;
                    }
                });
            });
            return groupId;
        },

        ungroup: (groupId) => set((draft) => {
            Object.values(draft.elements).forEach((el) => {
                if (el.groupId === groupId) {
                    el.groupId = undefined;
                }
            });
        }),

        // =====================================================================
        // Layers
        // =====================================================================

        /**
         * Rename an element
         * 
         * Updates the display name of an element. For frames, updates the name property.
         * For text elements, updates the text content. For other elements, stores a custom name.
         * 
         * @param id - ID of the element to rename
         * @param name - New name for the element
         * @throws Error if element not found or name is invalid
         */
        renameElement: (id, name) => {
            const state = get();
            const element = state.elements[id];

            if (!element) {
                console.error(`Element with ID '${id}' not found`);
                return;
            }

            if (!name || name.trim().length === 0) {
                console.error('Element name cannot be empty');
                return;
            }

            const trimmedName = name.trim();
            const before: Record<string, CanvasElement | null> = { [id]: { ...element } };

            set((draft) => {
                const el = draft.elements[id];
                if (!el) return;

                if (el.type === 'frame') {
                    (el as FrameElement).name = trimmedName;
                } else if (el.type === 'text') {
                    el.text = trimmedName;
                } else if (el.type === 'sticky') {
                    el.text = trimmedName;
                } else {
                    (el as any).customName = trimmedName;
                }
                el.updatedAt = Date.now();
            });

            const after: Record<string, CanvasElement | null> = { [id]: get().elements[id] };
            get().pushHistory({ type: 'update', elementIds: [id], before, after });
        },

        /**
         * Toggle element visibility
         * 
         * Toggles the visibility of an element by setting its opacity to 0 or 1.
         * 
         * @param id - ID of the element
         */
        toggleElementVisibility: (id) => {
            const state = get();
            const element = state.elements[id];

            if (!element) {
                console.error(`Element with ID '${id}' not found`);
                return;
            }

            const newOpacity = element.opacity > 0 ? 0 : 1;
            const before: Record<string, CanvasElement | null> = { [id]: { ...element } };

            set((draft) => {
                if (draft.elements[id]) {
                    draft.elements[id].opacity = newOpacity;
                    draft.elements[id].updatedAt = Date.now();
                }
            });

            const after: Record<string, CanvasElement | null> = { [id]: get().elements[id] };
            get().pushHistory({ type: 'update', elementIds: [id], before, after });
        },

        /**
         * Toggle element locked state
         * 
         * Toggles whether an element is locked (cannot be edited).
         * 
         * @param id - ID of the element
         */
        toggleElementLocked: (id) => {
            const state = get();
            const element = state.elements[id];

            if (!element) {
                console.error(`Element with ID '${id}' not found`);
                return;
            }

            const newLocked = !element.locked;
            const before: Record<string, CanvasElement | null> = { [id]: { ...element } };

            set((draft) => {
                if (draft.elements[id]) {
                    draft.elements[id].locked = newLocked;
                    draft.elements[id].updatedAt = Date.now();
                }
            });

            const after: Record<string, CanvasElement | null> = { [id]: get().elements[id] };
            get().pushHistory({ type: 'update', elementIds: [id], before, after });
        },

        /**
         * Reorder elements in the z-order
         * 
         * Moves elements to a specific position in the element order.
         * 
         * @param elementIds - IDs of elements to move
         * @param targetIndex - Target index in the element order
         */
        reorderElements: (elementIds, targetIndex) => {
            const state = get();

            if (!Array.isArray(elementIds) || elementIds.length === 0) {
                console.error('Element IDs must be a non-empty array');
                return;
            }

            if (targetIndex < 0 || targetIndex > state.elementOrder.length) {
                console.error(`Target index ${targetIndex} is out of bounds`);
                return;
            }

            set((draft) => {
                // Remove elements from current positions
                const newOrder = draft.elementOrder.filter((id) => !elementIds.includes(id));
                // Insert at target position
                newOrder.splice(targetIndex, 0, ...elementIds);
                draft.elementOrder = newOrder;
            });
        },

        // =====================================================================
        // Alignment
        // =====================================================================

        alignElements: (ids, alignment) => {
            const state = get();
            const elements = ids.map((id) => state.elements[id]).filter(Boolean);
            if (elements.length < 2) return;

            const bounds = getElementsBounds(elements);
            if (!bounds) return;

            set((draft) => {
                elements.forEach((el) => {
                    switch (alignment) {
                        case 'left':
                            draft.elements[el.id].x = bounds.x;
                            break;
                        case 'center':
                            draft.elements[el.id].x = bounds.x + (bounds.width - el.width) / 2;
                            break;
                        case 'right':
                            draft.elements[el.id].x = bounds.x + bounds.width - el.width;
                            break;
                        case 'top':
                            draft.elements[el.id].y = bounds.y;
                            break;
                        case 'middle':
                            draft.elements[el.id].y = bounds.y + (bounds.height - el.height) / 2;
                            break;
                        case 'bottom':
                            draft.elements[el.id].y = bounds.y + bounds.height - el.height;
                            break;
                    }
                });
            });
        },

        distributeElements: (ids, direction) => {
            const state = get();
            const elements = ids.map((id) => state.elements[id]).filter(Boolean);
            if (elements.length < 3) return;

            const sorted = [...elements].sort((a, b) =>
                direction === 'horizontal' ? a.x - b.x : a.y - b.y
            );

            const first = sorted[0];
            const last = sorted[sorted.length - 1];

            const totalSize = direction === 'horizontal'
                ? sorted.reduce((sum, el) => sum + el.width, 0)
                : sorted.reduce((sum, el) => sum + el.height, 0);

            const totalSpace = direction === 'horizontal'
                ? (last.x + last.width) - first.x - totalSize
                : (last.y + last.height) - first.y - totalSize;

            const gap = totalSpace / (sorted.length - 1);

            set((draft) => {
                let pos = direction === 'horizontal' ? first.x : first.y;
                sorted.forEach((el) => {
                    if (direction === 'horizontal') {
                        draft.elements[el.id].x = pos;
                        pos += el.width + gap;
                    } else {
                        draft.elements[el.id].y = pos;
                        pos += el.height + gap;
                    }
                });
            });
        },

        // =====================================================================
        // Frame Children Management
        // =====================================================================

        updateFrameChildren: (frameId) => {
            const state = get();
            const frame = state.elements[frameId];
            if (!frame || frame.type !== 'frame') return;

            // Find all elements inside frame bounds
            const childIds: string[] = [];
            Object.values(state.elements).forEach((el) => {
                // Skip the frame itself and other frames (no nested frames for now)
                if (el.id === frameId || el.type === 'frame') return;

                // Check if element is completely inside frame bounds
                const isInside =
                    el.x >= frame.x &&
                    el.y >= frame.y &&
                    el.x + el.width <= frame.x + frame.width &&
                    el.y + el.height <= frame.y + frame.height;

                if (isInside) {
                    childIds.push(el.id);
                }
            });

            // Update frame's childIds
            set((draft) => {
                if (draft.elements[frameId] && draft.elements[frameId].type === 'frame') {
                    (draft.elements[frameId] as FrameElement).childIds = childIds;
                }
            });
        },

        addChildToFrame: (frameId, childId) => {
            set((draft) => {
                const frame = draft.elements[frameId];
                if (frame && frame.type === 'frame') {
                    const frameEl = frame as FrameElement;
                    if (!frameEl.childIds.includes(childId)) {
                        frameEl.childIds.push(childId);
                    }
                }
            });
        },

        removeChildFromFrame: (frameId, childId) => {
            set((draft) => {
                const frame = draft.elements[frameId];
                if (frame && frame.type === 'frame') {
                    const frameEl = frame as FrameElement;
                    frameEl.childIds = frameEl.childIds.filter(id => id !== childId);
                }
            });
        },

        moveFrameWithChildren: (frameId, dx, dy) => {
            const state = get();
            const frame = state.elements[frameId];
            if (!frame || frame.type !== 'frame') return;

            const frameEl = frame as FrameElement;

            set((draft) => {
                // Move the frame
                draft.elements[frameId].x += dx;
                draft.elements[frameId].y += dy;

                // Move all children
                frameEl.childIds.forEach((childId) => {
                    if (draft.elements[childId]) {
                        draft.elements[childId].x += dx;
                        draft.elements[childId].y += dy;
                    }
                });
            });
        },

        // =====================================================================
        // Binding
        // =====================================================================

        /**
         * Bind a connector to start and end elements
         * 
         * @param connectorId - ID of the connector element
         * @param startBinding - Binding point for the start of the connector
         * @param endBinding - Binding point for the end of the connector
         * @throws Error if connector not found
         */
        bindConnector: (connectorId, startBinding, endBinding) => {
            const state = get();
            const connector = state.elements[connectorId];

            if (!connector) {
                throw new Error(`Connector with ID '${connectorId}' not found`);
            }

            if (connector.type !== 'connector') {
                throw new Error(`Element '${connectorId}' is not a connector (type: ${connector.type})`);
            }

            set((draft) => {
                const connectorEl = draft.elements[connectorId] as ConnectorElement;
                connectorEl.startBinding = startBinding;
                connectorEl.endBinding = endBinding;
                connectorEl.updatedAt = Date.now();
            });
        },

        /**
         * Update all connectors that are bound to a specific element
         * 
         * This method finds all connectors that have bindings to the given element
         * and updates them. This is typically called when an element is moved or resized.
         * 
         * @param elementId - ID of the element whose bindings should be updated
         * 
         * @example
         * // When an element is moved, update its connectors
         * store.updateElement('rect-1', { x: 200, y: 300 });
         * store.updateConnectorBindings('rect-1');
         */
        updateConnectorBindings: (elementId) => {
            const state = get();

            // Find all connectors bound to this element
            const connectors = Object.values(state.elements).filter(
                (el): el is ConnectorElement =>
                    el.type === 'connector' &&
                    (el.startBinding?.elementId === elementId || el.endBinding?.elementId === elementId)
            );

            if (connectors.length === 0) {
                return;
            }

            // Update each connector (waypoints will be recalculated by auto-routing system)
            set((draft) => {
                connectors.forEach((connector) => {
                    const connectorEl = draft.elements[connector.id] as ConnectorElement;
                    if (connectorEl) {
                        connectorEl.updatedAt = Date.now();
                    }
                });
            });
        },

        /**
         * Update the route (waypoints) of a connector using the auto-routing system
         * 
         * This method calculates the optimal path for a connector based on:
         * - The connector's routing type (straight, elbow, curved)
         * - The positions of the bound elements
         * - Optional obstacles to avoid
         * 
         * The method uses the routerRegistry to calculate waypoints and updates
         * the connector element with the new path.
         * 
         * @param connectorId - ID of the connector to update
         * 
         * @throws Error if connector not found or not properly bound
         * 
         * @example
         * // Update connector route after elements are moved
         * store.updateConnectorRoute('connector-1');
         */
        updateConnectorRoute: (connectorId) => {
            const state = get();
            const connector = state.elements[connectorId];

            // Validate connector exists
            if (!connector) {
                console.warn(`Connector with ID '${connectorId}' not found`);
                return;
            }

            // Validate connector type
            if (connector.type !== 'connector') {
                console.warn(`Element '${connectorId}' is not a connector (type: ${connector.type})`);
                return;
            }

            const connectorEl = connector as ConnectorElement;

            // Validate bindings exist
            if (!connectorEl.startBinding || !connectorEl.endBinding) {
                console.warn(`Connector '${connectorId}' is not fully bound`);
                return;
            }

            // Get bound elements
            const startElement = state.elements[connectorEl.startBinding.elementId];
            const endElement = state.elements[connectorEl.endBinding.elementId];

            if (!startElement || !endElement) {
                console.warn(`Bound elements not found for connector '${connectorId}'`);
                return;
            }

            try {
                // Calculate binding points (center of elements for now)
                const startPoint: Point = {
                    x: startElement.x + startElement.width / 2,
                    y: startElement.y + startElement.height / 2,
                };

                const endPoint: Point = {
                    x: endElement.x + endElement.width / 2,
                    y: endElement.y + endElement.height / 2,
                };

                // Get other elements as potential obstacles
                const obstacles: Bounds[] = Object.values(state.elements)
                    .filter((el) => el.id !== connectorId && el.type !== 'connector')
                    .map((el) => ({
                        x: el.x,
                        y: el.y,
                        width: el.width,
                        height: el.height,
                    }));

                // Calculate route using router registry
                const waypoints = routerRegistry.route(startPoint, endPoint, {
                    type: connectorEl.routeType,
                    obstacles,
                });

                // Update connector with new waypoints
                set((draft) => {
                    const el = draft.elements[connectorId] as ConnectorElement;
                    if (el) {
                        el.waypoints = Array.from(waypoints);
                        el.updatedAt = Date.now();
                    }
                });
            } catch (error) {
                console.error(`Failed to update route for connector '${connectorId}':`, error);
            }
        },

        // =====================================================================
        // Storage
        // =====================================================================

        /**
         * Mark the canvas as having unsaved changes
         * 
         * This is typically called when elements are modified
         */
        markDirty: () => {
            // Lazy import to avoid circular dependency
            import('./storage-store').then(({ useStorageStore }) => {
                useStorageStore.getState().markDirty();
            }).catch(err => console.error('Failed to mark dirty:', err));
        },

        /**
         * Mark the canvas as having no unsaved changes
         * 
         * This is typically called after saving
         */
        markClean: () => {
            // Lazy import to avoid circular dependency
            import('./storage-store').then(({ useStorageStore }) => {
                useStorageStore.getState().markClean();
            }).catch(err => console.error('Failed to mark clean:', err));
        },

        // =====================================================================
        // Import/Export
        // =====================================================================

        exportToJSON: () => {
            const state = get();
            return JSON.stringify({
                version: 1,
                elements: state.elements,
                elementOrder: state.elementOrder,
            }, null, 2);
        },

        importFromJSON: (json) => {
            try {
                const data = JSON.parse(json);
                set((draft) => {
                    draft.elements = data.elements || {};
                    draft.elementOrder = data.elementOrder || Object.keys(data.elements);
                    draft.selectedIds = [];
                    draft.history = [];
                    draft.historyIndex = -1;
                });
            } catch (e) {
                console.error('Failed to import JSON:', e);
            }
        },

        clear: () => set((draft) => {
            draft.elements = {};
            draft.elementOrder = [];
            draft.selectedIds = [];
            draft.history = [];
            draft.historyIndex = -1;
        }),
    }))
);

// =============================================================================
// Utility Functions
// =============================================================================

function getElementsBounds(elements: CanvasElement[]): Bounds | null {
    if (elements.length === 0) return null;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    elements.forEach((el) => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

// =============================================================================
// Selectors
// =============================================================================

export const selectElements = (state: CanvasState) => state.elements;
export const selectElementOrder = (state: CanvasState) => state.elementOrder;
export const selectSelectedIds = (state: CanvasState) => state.selectedIds;
export const selectTransform = (state: CanvasState) => state.transform;
export const selectActiveTool = (state: CanvasState) => state.activeTool;
export const selectCanUndo = (state: CanvasState) => state.historyIndex >= 0;
export const selectCanRedo = (state: CanvasState) => state.historyIndex < state.history.length - 1;

export const selectSelectedElements = (state: CanvasState) =>
    state.selectedIds.map((id) => state.elements[id]).filter(Boolean);

export const selectOrderedElements = (state: CanvasState) =>
    state.elementOrder.map((id) => state.elements[id]).filter(Boolean);
