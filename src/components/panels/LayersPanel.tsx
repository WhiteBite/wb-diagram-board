/**
 * WB Layers - Layers Panel Component
 * 
 * Main panel for managing canvas elements and their properties
 */

import { memo, useCallback, useMemo } from 'react';
import type { CanvasElement } from '../../types/canvas';
import type { LayerItem as LayerItemType } from '../../types/layers';
import { layerManager } from '../../core/layers/layer-manager';
import { useLayersStore } from '../../store/layers-store';
import { LayerItem } from './LayerItem';
import styles from './LayersPanel.module.css';

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for the LayersPanel component
 */
interface LayersPanelProps {
    /** Map of all canvas elements */
    readonly elements: Record<string, CanvasElement>;
    /** Array of element IDs in z-order */
    readonly elementOrder: string[];
    /** IDs of currently selected elements */
    readonly selectedIds: string[];
    /** Callback when element is selected */
    readonly onSelect: (id: string, multiSelect?: boolean) => void;
    /** Callback to toggle element visibility */
    readonly onToggleVisible: (id: string) => void;
    /** Callback to toggle element locked state */
    readonly onToggleLocked: (id: string) => void;
    /** Callback to rename element */
    readonly onRename: (id: string, newName: string) => void;
    /** Callback to reorder elements */
    readonly onReorder: (elementIds: string[], targetIndex: number) => void;
}

// =============================================================================
// Layers Panel Component
// =============================================================================

/**
 * Layers Panel component
 * 
 * Displays a hierarchical view of all canvas elements with support for:
 * - Element selection
 * - Visibility toggling
 * - Lock/unlock
 * - Inline renaming
 * - Drag & drop reordering
 * - Frame hierarchy display
 * 
 * @example
 * <LayersPanel
 *   elements={elements}
 *   elementOrder={elementOrder}
 *   selectedIds={selectedIds}
 *   onSelect={handleSelect}
 *   onToggleVisible={handleToggleVisible}
 *   onToggleLocked={handleToggleLocked}
 *   onRename={handleRename}
 *   onReorder={handleReorder}
 * />
 */
export const LayersPanel = memo(function LayersPanel({
    elements,
    elementOrder,
    selectedIds,
    onSelect,
    onToggleVisible,
    onToggleLocked,
    onRename,
    onReorder,
}: LayersPanelProps) {
    const expandedGroups = useLayersStore((state) => state.expandedGroups);
    const draggedLayerId = useLayersStore((state) => state.draggedLayerId);
    const setDraggedLayer = useLayersStore((state) => state.setDraggedLayer);
    const setDragOverLayer = useLayersStore((state) => state.setDragOverLayer);
    const clearDragState = useLayersStore((state) => state.clearDragState);
    const toggleExpanded = useLayersStore((state) => state.toggleExpanded);

    // =========================================================================
    // Memoized Values
    // =========================================================================

    /**
     * Get all layers in display order
     */
    const layers = useMemo(() => {
        try {
            return layerManager.getLayers(elements, elementOrder);
        } catch (error) {
            console.error('Failed to get layers:', error);
            return [];
        }
    }, [elements, elementOrder]);

    /**
     * Build hierarchical layer structure for rendering
     */
    const layerHierarchy = useMemo(() => {
        return layers.map((layer) => buildLayerTree(layer, elements, expandedGroups, 0));
    }, [layers, elements, expandedGroups]);

    /**
     * Flatten hierarchy for rendering
     */
    const flatLayers = useMemo(() => {
        const flat: Array<{ layer: LayerItemType; depth: number; hasChildren: boolean }> = [];

        const traverse = (
            layer: LayerItemType,
            depth: number,
            isExpanded: boolean
        ) => {
            const hasChildren = layer.children && layer.children.length > 0;
            flat.push({ layer, depth, hasChildren });

            if (isExpanded && hasChildren) {
                layer.children!.forEach((childId) => {
                    const childElement = elements[childId];
                    if (childElement) {
                        const childLayer = layerManager.getLayer(childId, elements);
                        const childIsExpanded = expandedGroups.has(childId);
                        traverse(childLayer, depth + 1, childIsExpanded);
                    }
                });
            }
        };

        layerHierarchy.forEach((item) => {
            const isExpanded: boolean = expandedGroups.has(item.layer.id);
            traverse(item.layer, 0, isExpanded);
        });

        return flat;
    }, [layerHierarchy, elements, expandedGroups]);

    // =========================================================================
    // Event Handlers
    // =========================================================================

    /**
     * Handle layer selection
     */
    const handleSelect = useCallback(
        (id: string, multiSelect?: boolean) => {
            onSelect(id, multiSelect);
        },
        [onSelect]
    );

    /**
     * Handle expand/collapse toggle
     */
    const handleToggleExpand = useCallback(
        (id: string) => {
            toggleExpanded(id);
        },
        [toggleExpanded]
    );

    /**
     * Handle visibility toggle
     */
    const handleToggleVisible = useCallback(
        (id: string) => {
            onToggleVisible(id);
        },
        [onToggleVisible]
    );

    /**
     * Handle locked toggle
     */
    const handleToggleLocked = useCallback(
        (id: string) => {
            onToggleLocked(id);
        },
        [onToggleLocked]
    );

    /**
     * Handle layer rename
     */
    const handleRename = useCallback(
        (id: string, newName: string) => {
            try {
                onRename(id, newName);
            } catch (error) {
                console.error('Failed to rename layer:', error);
            }
        },
        [onRename]
    );

    /**
     * Handle drag start
     */
    const handleDragStart = useCallback(
        (id: string) => {
            setDraggedLayer(id);
        },
        [setDraggedLayer]
    );

    /**
     * Handle drag over
     */
    const handleDragOver = useCallback(
        (id: string) => {
            setDragOverLayer(id);
        },
        [setDragOverLayer]
    );

    /**
     * Handle drop
     */
    const handleDrop = useCallback(
        (targetId: string) => {
            if (!draggedLayerId || draggedLayerId === targetId) {
                clearDragState();
                return;
            }

            try {
                // Find target index in element order
                const targetIndex = elementOrder.indexOf(targetId);
                if (targetIndex !== -1) {
                    onReorder([draggedLayerId], targetIndex);
                }
            } catch (error) {
                console.error('Failed to reorder layers:', error);
            } finally {
                clearDragState();
            }
        },
        [draggedLayerId, elementOrder, onReorder, clearDragState]
    );

    // =========================================================================
    // Render
    // =========================================================================

    if (flatLayers.length === 0) {
        return (
            <div className={styles.layersPanel}>
                <div className={styles.empty}>
                    <p>No elements on canvas</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.layersPanel}>
            <div className={styles.header}>
                <h3>Layers</h3>
                <span className={styles.count}>{flatLayers.length}</span>
            </div>

            <div className={styles.list}>
                {flatLayers.map(({ layer, depth, hasChildren }) => (
                    <LayerItem
                        key={layer.id}
                        layer={layer}
                        isSelected={selectedIds.includes(layer.id)}
                        isExpanded={expandedGroups.has(layer.id)}
                        hasChildren={hasChildren}
                        onSelect={handleSelect}
                        onToggleExpand={handleToggleExpand}
                        onToggleVisible={handleToggleVisible}
                        onToggleLocked={handleToggleLocked}
                        onRename={handleRename}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        depth={depth}
                    />
                ))}
            </div>
        </div>
    );
});

LayersPanel.displayName = 'LayersPanel';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build a layer tree structure
 */
function buildLayerTree(
    layer: LayerItemType,
    _elements: Record<string, CanvasElement>,
    _expandedGroups: Set<string>,
    depth: number
): { layer: LayerItemType; depth: number } {
    return {
        layer,
        depth,
    };
}
