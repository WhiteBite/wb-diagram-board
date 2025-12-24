/**
 * WB Layers - Zustand Store
 * 
 * State management for the layers panel UI
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// =============================================================================
// Store State Interface
// =============================================================================

/**
 * State for the layers panel
 * 
 * @property expandedGroups - Set of frame IDs that are expanded in the panel
 * @property selectedLayer - Currently selected layer ID
 * @property editingLayerId - ID of layer currently being edited (inline rename)
 * @property draggedLayerId - ID of layer being dragged
 * @property dragOverLayerId - ID of layer being dragged over
 */
interface LayersStoreState {
    readonly expandedGroups: Set<string>;
    readonly selectedLayer: string | null;
    readonly editingLayerId: string | null;
    readonly draggedLayerId: string | null;
    readonly dragOverLayerId: string | null;
}

// =============================================================================
// Store Actions Interface
// =============================================================================

/**
 * Actions for managing layers panel state
 */
interface LayersStoreActions {
    /**
     * Toggle expansion of a frame/group
     * 
     * @param id - ID of the frame to toggle
     * 
     * @example
     * store.toggleExpanded('frame-1');
     */
    toggleExpanded: (id: string) => void;

    /**
     * Expand a frame/group
     * 
     * @param id - ID of the frame to expand
     * 
     * @example
     * store.expandGroup('frame-1');
     */
    expandGroup: (id: string) => void;

    /**
     * Collapse a frame/group
     * 
     * @param id - ID of the frame to collapse
     * 
     * @example
     * store.collapseGroup('frame-1');
     */
    collapseGroup: (id: string) => void;

    /**
     * Select a layer
     * 
     * @param id - ID of the layer to select
     * 
     * @example
     * store.selectLayer('rect-1');
     */
    selectLayer: (id: string) => void;

    /**
     * Deselect the current layer
     * 
     * @example
     * store.deselectLayer();
     */
    deselectLayer: () => void;

    /**
     * Start editing a layer name (inline rename)
     * 
     * @param id - ID of the layer to edit
     * 
     * @example
     * store.startEditing('rect-1');
     */
    startEditing: (id: string) => void;

    /**
     * Stop editing the current layer
     * 
     * @example
     * store.stopEditing();
     */
    stopEditing: () => void;

    /**
     * Set the layer being dragged
     * 
     * @param id - ID of the layer being dragged, or null to clear
     * 
     * @example
     * store.setDraggedLayer('rect-1');
     */
    setDraggedLayer: (id: string | null) => void;

    /**
     * Set the layer being dragged over
     * 
     * @param id - ID of the layer being dragged over, or null to clear
     * 
     * @example
     * store.setDragOverLayer('frame-1');
     */
    setDragOverLayer: (id: string | null) => void;

    /**
     * Clear all drag state
     * 
     * @example
     * store.clearDragState();
     */
    clearDragState: () => void;

    /**
     * Reset the entire store to initial state
     * 
     * @example
     * store.reset();
     */
    reset: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: LayersStoreState = {
    expandedGroups: new Set(),
    selectedLayer: null,
    editingLayerId: null,
    draggedLayerId: null,
    dragOverLayerId: null,
};

// =============================================================================
// Store
// =============================================================================

/**
 * Zustand store for layers panel state management
 * 
 * Uses Immer middleware for immutable state updates.
 * 
 * @example
 * const { selectedLayer, selectLayer } = useLayersStore();
 * 
 * @example
 * // Subscribe to changes
 * const unsubscribe = useLayersStore.subscribe(
 *   (state) => state.selectedLayer,
 *   (selectedLayer) => console.log('Selected:', selectedLayer)
 * );
 */
export const useLayersStore = create<LayersStoreState & LayersStoreActions>()(
    immer((set) => ({
        ...initialState,

        // =====================================================================
        // Expansion
        // =====================================================================

        toggleExpanded: (id) => set((draft) => {
            if (draft.expandedGroups.has(id)) {
                draft.expandedGroups.delete(id);
            } else {
                draft.expandedGroups.add(id);
            }
        }),

        expandGroup: (id) => set((draft) => {
            draft.expandedGroups.add(id);
        }),

        collapseGroup: (id) => set((draft) => {
            draft.expandedGroups.delete(id);
        }),

        // =====================================================================
        // Selection
        // =====================================================================

        selectLayer: (id) => set((draft) => {
            draft.selectedLayer = id;
        }),

        deselectLayer: () => set((draft) => {
            draft.selectedLayer = null;
        }),

        // =====================================================================
        // Editing
        // =====================================================================

        startEditing: (id) => set((draft) => {
            draft.editingLayerId = id;
        }),

        stopEditing: () => set((draft) => {
            draft.editingLayerId = null;
        }),

        // =====================================================================
        // Drag & Drop
        // =====================================================================

        setDraggedLayer: (id) => set((draft) => {
            draft.draggedLayerId = id;
        }),

        setDragOverLayer: (id) => set((draft) => {
            draft.dragOverLayerId = id;
        }),

        clearDragState: () => set((draft) => {
            draft.draggedLayerId = null;
            draft.dragOverLayerId = null;
        }),

        // =====================================================================
        // Reset
        // =====================================================================

        reset: () => set(() => initialState),
    }))
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select whether a group is expanded
 * 
 * @param state - Store state
 * @param id - Group ID
 * @returns True if group is expanded
 * 
 * @example
 * const isExpanded = useLayersStore((state) => selectIsExpanded(state, 'frame-1'));
 */
export const selectIsExpanded = (state: LayersStoreState, id: string): boolean =>
    state.expandedGroups.has(id);

/**
 * Select whether a layer is selected
 * 
 * @param state - Store state
 * @param id - Layer ID
 * @returns True if layer is selected
 * 
 * @example
 * const isSelected = useLayersStore((state) => selectIsSelected(state, 'rect-1'));
 */
export const selectIsSelected = (state: LayersStoreState, id: string): boolean =>
    state.selectedLayer === id;

/**
 * Select whether a layer is being edited
 * 
 * @param state - Store state
 * @param id - Layer ID
 * @returns True if layer is being edited
 * 
 * @example
 * const isEditing = useLayersStore((state) => selectIsEditing(state, 'rect-1'));
 */
export const selectIsEditing = (state: LayersStoreState, id: string): boolean =>
    state.editingLayerId === id;

/**
 * Select whether a layer is being dragged
 * 
 * @param state - Store state
 * @param id - Layer ID
 * @returns True if layer is being dragged
 * 
 * @example
 * const isDragged = useLayersStore((state) => selectIsDragged(state, 'rect-1'));
 */
export const selectIsDragged = (state: LayersStoreState, id: string): boolean =>
    state.draggedLayerId === id;

/**
 * Select whether a layer is being dragged over
 * 
 * @param state - Store state
 * @param id - Layer ID
 * @returns True if layer is being dragged over
 * 
 * @example
 * const isDragOver = useLayersStore((state) => selectIsDragOver(state, 'frame-1'));
 */
export const selectIsDragOver = (state: LayersStoreState, id: string): boolean =>
    state.dragOverLayerId === id;
