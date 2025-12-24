/**
 * WB Layers - Layer Manager
 * 
 * Core business logic for managing layers and element hierarchy
 */

import type { CanvasElement, FrameElement } from '../../types/canvas';
import type { LayerItem, LayerHierarchy } from '../../types/layers';
import { LayerError } from '../../types/layers';

// =============================================================================
// Layer Manager Class
// =============================================================================

/**
 * Manages layer operations and element hierarchy
 * 
 * Provides methods for:
 * - Getting layers in display order
 * - Managing layer hierarchy (frames with children)
 * - Renaming layers
 * - Reordering layers
 * - Getting layer information
 * 
 * @example
 * const manager = new LayerManager();
 * const layers = manager.getLayers(elements);
 * const hierarchy = manager.getLayerHierarchy(elements);
 */
export class LayerManager {
    /**
     * Get all layers in reverse z-order (top to bottom)
     * 
     * Layers are returned in the order they should be displayed in the panel,
     * with the topmost element first.
     * 
     * @param elements - Map of all canvas elements
     * @param elementOrder - Array of element IDs in z-order
     * @returns Array of layer items in display order
     * 
     * @throws LayerError if elements or elementOrder is invalid
     * 
     * @example
     * const layers = manager.getLayers(elements, elementOrder);
     * // Returns layers from top to bottom
     */
    getLayers(
        elements: Record<string, CanvasElement>,
        elementOrder: string[]
    ): LayerItem[] {
        if (!elements || !elementOrder) {
            throw new LayerError(
                'Invalid arguments: elements and elementOrder are required',
                'INVALID_ARGS'
            );
        }

        // Return layers in reverse order (top to bottom)
        return [...elementOrder]
            .reverse()
            .map((id) => elements[id])
            .filter(Boolean)
            .map((element) => this.elementToLayer(element));
    }

    /**
     * Get a single layer by element ID
     * 
     * @param elementId - ID of the element
     * @param elements - Map of all canvas elements
     * @returns Layer item
     * 
     * @throws LayerError if element not found
     * 
     * @example
     * const layer = manager.getLayer('rect-1', elements);
     */
    getLayer(elementId: string, elements: Record<string, CanvasElement>): LayerItem {
        const element = elements[elementId];
        if (!element) {
            throw new LayerError(
                `Element with ID '${elementId}' not found`,
                'ELEMENT_NOT_FOUND',
                { elementId }
            );
        }

        return this.elementToLayer(element);
    }

    /**
     * Get child layers for a frame
     * 
     * @param parentId - ID of the frame element
     * @param elements - Map of all canvas elements
     * @returns Array of child layer items
     * 
     * @throws LayerError if parent is not a frame
     * 
     * @example
     * const children = manager.getChildLayers('frame-1', elements);
     */
    getChildLayers(parentId: string, elements: Record<string, CanvasElement>): LayerItem[] {
        const parent = elements[parentId];
        if (!parent) {
            throw new LayerError(
                `Parent element with ID '${parentId}' not found`,
                'PARENT_NOT_FOUND',
                { parentId }
            );
        }

        if (parent.type !== 'frame') {
            throw new LayerError(
                `Element '${parentId}' is not a frame (type: ${parent.type})`,
                'NOT_A_FRAME',
                { parentId, type: parent.type }
            );
        }

        const frame = parent as FrameElement;
        return frame.childIds
            .map((id) => elements[id])
            .filter(Boolean)
            .map((element) => this.elementToLayer(element));
    }

    /**
     * Get the hierarchical structure of layers
     * 
     * This method builds a tree structure showing frames and their children,
     * useful for displaying the layer hierarchy in the UI.
     * 
     * @param elements - Map of all canvas elements
     * @param elementOrder - Array of element IDs in z-order
     * @returns Array of layer hierarchies
     * 
     * @example
     * const hierarchy = manager.getLayerHierarchy(elements, elementOrder);
     * // Returns tree structure with frames and children
     */
    getLayerHierarchy(
        elements: Record<string, CanvasElement>,
        elementOrder: string[]
    ): LayerHierarchy[] {
        const layers = this.getLayers(elements, elementOrder);
        return layers.map((layer) => this.buildHierarchy(layer, elements, 0));
    }

    /**
     * Rename a layer
     * 
     * Updates the name of an element. For frames, this updates the frame's name property.
     * For other elements, this updates the element's text or creates a name property.
     * 
     * @param elementId - ID of the element to rename
     * @param newName - New name for the element
     * @param elements - Map of all canvas elements
     * @returns Updated layer item
     * 
     * @throws LayerError if element not found or name is invalid
     * 
     * @example
     * const updated = manager.renameLayer('rect-1', 'My Rectangle', elements);
     */
    renameLayer(
        elementId: string,
        newName: string,
        elements: Record<string, CanvasElement>
    ): LayerItem {
        if (!newName || newName.trim().length === 0) {
            throw new LayerError(
                'Layer name cannot be empty',
                'INVALID_NAME',
                { elementId, newName }
            );
        }

        const element = elements[elementId];
        if (!element) {
            throw new LayerError(
                `Element with ID '${elementId}' not found`,
                'ELEMENT_NOT_FOUND',
                { elementId }
            );
        }

        // Update element name based on type
        const trimmedName = newName.trim();
        const updated = { ...element };

        if (element.type === 'frame') {
            (updated as FrameElement).name = trimmedName;
        } else if (element.type === 'text') {
            (updated as any).text = trimmedName;
        } else if (element.type === 'sticky') {
            (updated as any).text = trimmedName;
        } else {
            // For other elements, store name in a custom property
            (updated as any).customName = trimmedName;
        }

        return this.elementToLayer(updated);
    }

    /**
     * Reorder layers by moving elements in the z-order
     * 
     * @param elementIds - IDs of elements to move
     * @param targetIndex - Target index in the element order
     * @param elementOrder - Current element order
     * @returns New element order
     * 
     * @throws LayerError if indices are invalid
     * 
     * @example
     * const newOrder = manager.reorderLayers(['rect-1', 'rect-2'], 5, elementOrder);
     */
    reorderLayers(
        elementIds: string[],
        targetIndex: number,
        elementOrder: string[]
    ): string[] {
        if (!Array.isArray(elementIds) || elementIds.length === 0) {
            throw new LayerError(
                'Element IDs must be a non-empty array',
                'INVALID_IDS',
                { elementIds }
            );
        }

        if (targetIndex < 0 || targetIndex > elementOrder.length) {
            throw new LayerError(
                `Target index ${targetIndex} is out of bounds`,
                'INVALID_INDEX',
                { targetIndex, length: elementOrder.length }
            );
        }

        // Create new order by removing elements and inserting at target
        const newOrder = elementOrder.filter((id) => !elementIds.includes(id));
        newOrder.splice(targetIndex, 0, ...elementIds);

        return newOrder;
    }

    /**
     * Get the display name for an element
     * 
     * @param element - The element
     * @returns Display name
     * 
     * @example
     * const name = manager.getElementName(element);
     */
    getElementName(element: CanvasElement): string {
        if (element.type === 'frame') {
            return (element as FrameElement).name || `Frame ${element.id.slice(0, 4)}`;
        }

        if (element.type === 'text') {
            const text = (element as any).text || '';
            return text.length > 0 ? text.slice(0, 30) : `Text ${element.id.slice(0, 4)}`;
        }

        if (element.type === 'sticky') {
            const text = (element as any).text || '';
            return text.length > 0 ? text.slice(0, 30) : `Sticky ${element.id.slice(0, 4)}`;
        }

        // For other elements, use type as name
        const customName = (element as any).customName;
        if (customName) {
            return customName;
        }

        return `${element.type.charAt(0).toUpperCase()}${element.type.slice(1)} ${element.id.slice(0, 4)}`;
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    /**
     * Convert a canvas element to a layer item
     * 
     * @param element - The canvas element
     * @returns Layer item
     */
    private elementToLayer(element: CanvasElement): LayerItem {
        const children = element.type === 'frame'
            ? (element as FrameElement).childIds
            : undefined;

        return {
            id: element.id,
            type: element.type,
            name: this.getElementName(element),
            visible: element.opacity > 0,
            locked: element.locked,
            children,
        };
    }

    /**
     * Build a hierarchical layer structure recursively
     * 
     * @param layer - The layer item
     * @param elements - Map of all canvas elements
     * @param depth - Current nesting depth
     * @returns Layer hierarchy
     */
    private buildHierarchy(
        layer: LayerItem,
        elements: Record<string, CanvasElement>,
        depth: number
    ): LayerHierarchy {
        const children: LayerHierarchy[] = [];

        if (layer.children && layer.children.length > 0) {
            layer.children.forEach((childId) => {
                const childElement = elements[childId];
                if (childElement) {
                    const childLayer = this.elementToLayer(childElement);
                    children.push(this.buildHierarchy(childLayer, elements, depth + 1));
                }
            });
        }

        return {
            layer,
            children: children as readonly LayerHierarchy[],
            depth,
        };
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Global layer manager instance
 */
export const layerManager = new LayerManager();
