/**
 * WB Guides - Zustand Store
 * 
 * Global state management for alignment guides and snapping
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    Guide,
    SnapPoint,
    GuidesConfig,
    DEFAULT_GUIDES_CONFIG,
} from '../types/guides';

// =============================================================================
// Store State Interface
// =============================================================================

/**
 * State for guides and snapping system
 */
interface GuidesState {
    readonly guides: readonly Guide[];
    readonly snapPoints: readonly SnapPoint[];
    readonly config: GuidesConfig;
    readonly isDragging: boolean;
}

// =============================================================================
// Store Actions Interface
// =============================================================================

/**
 * Actions for guides and snapping system
 */
interface GuidesActions {
    /**
     * Update guides
     * @param guides - New guides array
     */
    updateGuides: (guides: readonly Guide[]) => void;

    /**
     * Update snap points
     * @param snapPoints - New snap points array
     */
    updateSnapPoints: (snapPoints: readonly SnapPoint[]) => void;

    /**
     * Update guides configuration
     * @param config - Partial configuration to merge
     */
    setConfig: (config: Partial<GuidesConfig>) => void;

    /**
     * Set dragging state
     * @param isDragging - Whether element is being dragged
     */
    setDragging: (isDragging: boolean) => void;

    /**
     * Toggle guides visibility
     */
    toggleGuides: () => void;

    /**
     * Toggle snap to grid
     */
    toggleSnapToGrid: () => void;

    /**
     * Toggle snap to elements
     */
    toggleSnapToElements: () => void;

    /**
     * Reset to default configuration
     */
    resetConfig: () => void;

    /**
     * Clear all guides and snap points
     */
    clear: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: GuidesState = {
    guides: [],
    snapPoints: [],
    config: DEFAULT_GUIDES_CONFIG,
    isDragging: false,
};

// =============================================================================
// Store
// =============================================================================

/**
 * Zustand store for guides and snapping system
 */
export const useGuidesStore = create<GuidesState & GuidesActions>()(
    immer((set) => ({
        ...initialState,

        // =====================================================================
        // Guides Management
        // =====================================================================

        updateGuides: (guides) =>
            set((draft) => {
                draft.guides = [...guides] as any;
            }),

        updateSnapPoints: (snapPoints) =>
            set((draft) => {
                draft.snapPoints = [...snapPoints] as any;
            }),

        // =====================================================================
        // Configuration
        // =====================================================================

        setConfig: (config) =>
            set((draft) => {
                Object.assign(draft.config, config);
            }),

        setDragging: (isDragging) =>
            set((draft) => {
                draft.isDragging = isDragging;
            }),

        toggleGuides: () =>
            set((draft) => {
                draft.config.showGuides = !draft.config.showGuides;
            }),

        toggleSnapToGrid: () =>
            set((draft) => {
                draft.config.snapToGrid = !draft.config.snapToGrid;
            }),

        toggleSnapToElements: () =>
            set((draft) => {
                draft.config.snapToElements = !draft.config.snapToElements;
            }),

        resetConfig: () =>
            set((draft) => {
                draft.config = DEFAULT_GUIDES_CONFIG;
            }),

        clear: () =>
            set((draft) => {
                draft.guides = [];
                draft.snapPoints = [];
                draft.isDragging = false;
            }),
    }))
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Select guides from store
 */
export const selectGuides = (state: GuidesState & GuidesActions) => state.guides;

/**
 * Select snap points from store
 */
export const selectSnapPoints = (state: GuidesState & GuidesActions) => state.snapPoints;

/**
 * Select guides config from store
 */
export const selectGuidesConfig = (state: GuidesState & GuidesActions) => state.config;

/**
 * Select dragging state from store
 */
export const selectIsDragging = (state: GuidesState & GuidesActions) => state.isDragging;
