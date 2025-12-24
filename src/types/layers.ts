/**
 * WB Layers - Type Definitions
 * 
 * Type definitions for the layers panel and layer management system
 */

import type { ElementType } from './canvas';

// =============================================================================
// Layer Types
// =============================================================================

/**
 * Represents a single layer item in the layers panel
 * 
 * @property id - Unique identifier of the element
 * @property type - Type of the element (rectangle, circle, etc.)
 * @property name - Display name of the layer
 * @property visible - Whether the element is visible on canvas
 * @property locked - Whether the element is locked (cannot be edited)
 * @property children - IDs of child elements (for frames)
 */
export interface LayerItem {
    readonly id: string;
    readonly type: ElementType;
    readonly name: string;
    readonly visible: boolean;
    readonly locked: boolean;
    readonly children?: readonly string[];
}

/**
 * Represents the state of the layers panel UI
 * 
 * @property expandedGroups - Set of frame/group IDs that are expanded
 * @property selectedLayer - Currently selected layer ID
 * @property editingLayerId - ID of layer being edited (inline rename)
 */
export interface LayersState {
    readonly expandedGroups: Set<string>;
    readonly selectedLayer: string | null;
    readonly editingLayerId: string | null;
}

/**
 * Represents a hierarchical layer structure for display
 * 
 * @property layer - The layer item data
 * @property children - Child layers (for frames)
 * @property depth - Nesting depth for indentation
 */
export interface LayerHierarchy {
    readonly layer: LayerItem;
    readonly children: readonly LayerHierarchy[];
    readonly depth: number;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Custom error class for layer-related operations
 * 
 * @example
 * throw new LayerError('Failed to rename layer', 'RENAME_FAILED', { elementId: 'rect-1' });
 */
export class LayerError extends Error {
    /**
     * Creates a new LayerError
     * 
     * @param message - Error message
     * @param code - Error code for categorization
     * @param context - Additional context information
     */
    constructor(
        message: string,
        public readonly code: string = 'LAYER_ERROR',
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'LayerError';
        Object.setPrototypeOf(this, LayerError.prototype);
    }
}

// =============================================================================
// Action Types
// =============================================================================

/**
 * Drag and drop operation data
 */
export interface DragDropData {
    readonly sourceId: string;
    readonly targetId: string;
    readonly position: 'before' | 'after' | 'inside';
}

/**
 * Layer rename operation data
 */
export interface RenameData {
    readonly elementId: string;
    readonly oldName: string;
    readonly newName: string;
}

/**
 * Visibility toggle operation data
 */
export interface VisibilityToggleData {
    readonly elementId: string;
    readonly visible: boolean;
}

/**
 * Lock toggle operation data
 */
export interface LockToggleData {
    readonly elementId: string;
    readonly locked: boolean;
}
