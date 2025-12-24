/**
 * WB Guides - useGuides Hook
 * 
 * Hook for managing alignment guides and snapping
 */

import { useCallback } from 'react';
import { useCanvasStore } from '../store/canvas-store';
import { useGuidesStore } from '../store/guides-store';
import { guideCalculator } from '../core/guides';
import { CanvasElement, Point } from '../types/canvas';

/**
 * Hook for managing alignment guides and snapping
 * 
 * @returns Object with guide management functions
 */
export function useGuides() {
    const guidesConfig = useGuidesStore((s) => s.config);
    const updateGuides = useGuidesStore((s) => s.updateGuides);
    const updateSnapPoints = useGuidesStore((s) => s.updateSnapPoints);
    const setDragging = useGuidesStore((s) => s.setDragging);

    const elements = useCanvasStore((s) => Object.values(s.elements));

    /**
     * Calculate and update guides for dragged element
     * @param draggedElement - Element being dragged
     * @param allElements - All elements on canvas
     */
    const updateGuidesForElement = useCallback(
        (draggedElement: CanvasElement, allElements: readonly CanvasElement[]) => {
            try {
                const guides = guideCalculator.calculateGuides(
                    draggedElement,
                    allElements,
                    guidesConfig
                );
                updateGuides(guides);
            } catch (error) {
                console.error('[useGuides] Failed to update guides:', error);
            }
        },
        [guidesConfig, updateGuides]
    );

    /**
     * Calculate and update snap points for dragged element
     * @param draggedElement - Element being dragged
     * @param allElements - All elements on canvas
     */
    const updateSnapPointsForElement = useCallback(
        (draggedElement: CanvasElement, allElements: readonly CanvasElement[]) => {
            try {
                const snapPoints = guideCalculator.findSnapPoints(
                    draggedElement,
                    allElements,
                    guidesConfig
                );
                updateSnapPoints(snapPoints);
            } catch (error) {
                console.error('[useGuides] Failed to update snap points:', error);
            }
        },
        [guidesConfig, updateSnapPoints]
    );

    /**
     * Get snapped position for element
     * @param draggedElement - Element being dragged
     * @param targetX - Target X position
     * @param targetY - Target Y position
     * @param allElements - All elements on canvas
     * @returns Snapped position
     */
    const getSnappedPosition = useCallback(
        (
            draggedElement: CanvasElement,
            targetX: number,
            targetY: number,
            allElements: readonly CanvasElement[]
        ): Point => {
            try {
                return guideCalculator.getSnappedPosition(
                    draggedElement,
                    targetX,
                    targetY,
                    allElements,
                    guidesConfig
                );
            } catch (error) {
                console.error('[useGuides] Failed to get snapped position:', error);
                return { x: targetX, y: targetY };
            }
        },
        [guidesConfig]
    );

    /**
     * Start dragging (show guides)
     */
    const startDragging = useCallback(() => {
        setDragging(true);
    }, [setDragging]);

    /**
     * Stop dragging (hide guides)
     */
    const stopDragging = useCallback(() => {
        setDragging(false);
        updateGuides([]);
        updateSnapPoints([]);
    }, [setDragging, updateGuides, updateSnapPoints]);

    /**
     * Check if elements are aligned
     * @param elementIds - IDs of elements to check
     * @param type - Alignment type
     * @returns True if elements are aligned
     */
    const checkAlignment = useCallback(
        (elementIds: string[], type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
            try {
                const elementsToCheck = elementIds
                    .map((id) => elements.find((el) => el.id === id))
                    .filter((el): el is CanvasElement => el !== undefined);

                return guideCalculator.checkAlignment(elementsToCheck, type);
            } catch (error) {
                console.error('[useGuides] Failed to check alignment:', error);
                return false;
            }
        },
        [elements]
    );

    return {
        guidesConfig,
        updateGuidesForElement,
        updateSnapPointsForElement,
        getSnappedPosition,
        startDragging,
        stopDragging,
        checkAlignment,
    };
}
