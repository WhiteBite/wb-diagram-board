/**
 * WB Canvas - Selection Overlay
 * 
 * Renders selection bounds and resize handles
 */

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { useCanvasStore, selectSelectedElements } from '../store/canvas-store';
import { Transform, Bounds, ResizeHandle, CanvasElement, Point } from '../types/canvas';

interface SelectionOverlayProps {
    transform: Transform;
}

export const SelectionOverlay = memo(function SelectionOverlay({ transform }: SelectionOverlayProps) {
    const selectedElements = useCanvasStore(selectSelectedElements);
    const getElement = useCanvasStore((s) => (id: string) => s.elements[id]);
    const updateElementSilent = useCanvasStore((s) => s.updateElementSilent);
    const pushHistory = useCanvasStore((s) => s.pushHistory);
    const snapToGrid = useCanvasStore((s) => s.snapToGrid);
    const gridSize = useCanvasStore((s) => s.gridSize);
    const updateFrameChildren = useCanvasStore((s) => s.updateFrameChildren);

    // Use ref to always have latest transform without recreating callback
    const transformRef = useRef(transform);
    transformRef.current = transform;

    // Local state for resize operation
    const [resizeState, setResizeState] = useState<{
        elementId: string;
        handle: ResizeHandle;
        initialElement: CanvasElement;
        startPoint: Point;
    } | null>(null);

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
        const t = transformRef.current;
        return {
            x: (screenX - t.x) / t.scale,
            y: (screenY - t.y) / t.scale,
        };
    }, []);

    // Handle window mouse move during resize
    useEffect(() => {
        if (!resizeState) return;

        const handleMouseMove = (e: MouseEvent) => {
            console.log('[SelectionOverlay] Resize mouse move');
            const canvasPoint = screenToCanvas(e.clientX, e.clientY);
            const { elementId, handle, initialElement, startPoint } = resizeState;

            const dx = canvasPoint.x - startPoint.x;
            const dy = canvasPoint.y - startPoint.y;

            let newX = initialElement.x;
            let newY = initialElement.y;
            let newWidth = initialElement.width;
            let newHeight = initialElement.height;

            // Handle resize based on handle position
            switch (handle) {
                case 'nw':
                    newX = initialElement.x + dx;
                    newY = initialElement.y + dy;
                    newWidth = initialElement.width - dx;
                    newHeight = initialElement.height - dy;
                    break;
                case 'n':
                    newY = initialElement.y + dy;
                    newHeight = initialElement.height - dy;
                    break;
                case 'ne':
                    newY = initialElement.y + dy;
                    newWidth = initialElement.width + dx;
                    newHeight = initialElement.height - dy;
                    break;
                case 'w':
                    newX = initialElement.x + dx;
                    newWidth = initialElement.width - dx;
                    break;
                case 'e':
                    newWidth = initialElement.width + dx;
                    break;
                case 'sw':
                    newX = initialElement.x + dx;
                    newWidth = initialElement.width - dx;
                    newHeight = initialElement.height + dy;
                    break;
                case 's':
                    newHeight = initialElement.height + dy;
                    break;
                case 'se':
                    newWidth = initialElement.width + dx;
                    newHeight = initialElement.height + dy;
                    break;
            }

            // Ensure minimum size
            const minSize = 20;
            if (newWidth < minSize) {
                if (handle.includes('w')) newX = initialElement.x + initialElement.width - minSize;
                newWidth = minSize;
            }
            if (newHeight < minSize) {
                if (handle.includes('n')) newY = initialElement.y + initialElement.height - minSize;
                newHeight = minSize;
            }

            // Snap to grid
            if (snapToGrid) {
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;
                newWidth = Math.round(newWidth / gridSize) * gridSize;
                newHeight = Math.round(newHeight / gridSize) * gridSize;
            }

            // Update element silently (no history entry yet)
            updateElementSilent(elementId, { x: newX, y: newY, width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            console.log('[SelectionOverlay] Resize mouse up');
            if (resizeState) {
                const { elementId, initialElement } = resizeState;
                const currentElement = getElement(elementId);

                if (currentElement) {
                    // Create history entry with proper before/after states
                    const before: Record<string, CanvasElement | null> = {
                        [elementId]: initialElement
                    };
                    const after: Record<string, CanvasElement | null> = {
                        [elementId]: { ...currentElement }
                    };

                    pushHistory({
                        type: 'update',
                        elementIds: [elementId],
                        before,
                        after
                    });

                    // If it's a frame, update children after resize
                    if (currentElement.type === 'frame') {
                        setTimeout(() => {
                            updateFrameChildren(elementId);
                        }, 0);
                    }
                }
            }
            setResizeState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizeState, screenToCanvas, updateElementSilent, pushHistory, getElement, snapToGrid, gridSize, updateFrameChildren]);

    const handleMouseDown = useCallback((handle: ResizeHandle) => (e: React.MouseEvent) => {
        console.log('[SelectionOverlay] handleMouseDown called:', { handle, button: e.button });
        e.preventDefault(); // Prevent text selection
        e.stopPropagation(); // Don't let Canvas handle this

        if (selectedElements.length !== 1) {
            console.log('[SelectionOverlay] Not exactly 1 element selected:', selectedElements.length);
            return;
        }

        const elementId = selectedElements[0].id;
        const initialElement = getElement(elementId);
        if (!initialElement) {
            console.log('[SelectionOverlay] Element not found:', elementId);
            return;
        }
        if (initialElement.locked) {
            console.log('[SelectionOverlay] Element is locked:', elementId);
            return;
        }

        console.log('[SelectionOverlay] Starting resize:', { handle, elementId, element: initialElement });

        // Start resize with window-level handlers
        const canvasPoint = screenToCanvas(e.clientX, e.clientY);
        setResizeState({
            elementId,
            handle,
            initialElement: { ...initialElement },
            startPoint: canvasPoint,
        });
    }, [selectedElements, getElement, screenToCanvas]);

    if (selectedElements.length === 0) return null;

    // Calculate combined bounds
    const bounds = getSelectionBounds(selectedElements);
    if (!bounds) return null;

    // Transform bounds to screen coordinates
    const screenBounds = {
        x: bounds.x * transform.scale + transform.x,
        y: bounds.y * transform.scale + transform.y,
        width: bounds.width * transform.scale,
        height: bounds.height * transform.scale,
    };

    const handleSize = 10;
    const rotationHandleOffset = 30;

    return (
        <div className="pointer-events-none absolute inset-0">
            {/* Selection border */}
            <div
                data-testid="selection-bounds"
                className="absolute border-2 border-indigo-500"
                style={{
                    left: screenBounds.x,
                    top: screenBounds.y,
                    width: screenBounds.width,
                    height: screenBounds.height,
                }}
            />

            {/* Resize handles */}
            {selectedElements.length === 1 && !selectedElements[0].locked && (
                <>
                    {/* Corner handles */}
                    <Handle
                        position="nw"
                        x={screenBounds.x - handleSize / 2}
                        y={screenBounds.y - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('nw')}
                    />
                    <Handle
                        position="ne"
                        x={screenBounds.x + screenBounds.width - handleSize / 2}
                        y={screenBounds.y - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('ne')}
                    />
                    <Handle
                        position="sw"
                        x={screenBounds.x - handleSize / 2}
                        y={screenBounds.y + screenBounds.height - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('sw')}
                    />
                    <Handle
                        position="se"
                        x={screenBounds.x + screenBounds.width - handleSize / 2}
                        y={screenBounds.y + screenBounds.height - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('se')}
                    />

                    {/* Edge handles */}
                    <Handle
                        position="n"
                        x={screenBounds.x + screenBounds.width / 2 - handleSize / 2}
                        y={screenBounds.y - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('n')}
                    />
                    <Handle
                        position="s"
                        x={screenBounds.x + screenBounds.width / 2 - handleSize / 2}
                        y={screenBounds.y + screenBounds.height - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('s')}
                    />
                    <Handle
                        position="w"
                        x={screenBounds.x - handleSize / 2}
                        y={screenBounds.y + screenBounds.height / 2 - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('w')}
                    />
                    <Handle
                        position="e"
                        x={screenBounds.x + screenBounds.width - handleSize / 2}
                        y={screenBounds.y + screenBounds.height / 2 - handleSize / 2}
                        size={handleSize}
                        onMouseDown={handleMouseDown('e')}
                    />

                    {/* Rotation handle */}
                    <div
                        className="absolute w-px bg-indigo-500"
                        style={{
                            left: screenBounds.x + screenBounds.width / 2,
                            top: screenBounds.y - rotationHandleOffset,
                            height: rotationHandleOffset,
                        }}
                    />
                    <div
                        className="rotation-handle pointer-events-auto"
                        style={{
                            left: screenBounds.x + screenBounds.width / 2 - 6,
                            top: screenBounds.y - rotationHandleOffset - 6,
                        }}
                        onMouseDown={handleMouseDown('rotation')}
                    />
                </>
            )}

            {/* Multi-selection info */}
            {selectedElements.length > 1 && (
                <div
                    className="absolute -top-6 left-0 text-xs text-indigo-600 font-medium"
                    style={{
                        left: screenBounds.x,
                        top: screenBounds.y - 24,
                    }}
                >
                    {selectedElements.length} elements selected
                </div>
            )}
        </div>
    );
});

// =============================================================================
// Handle Component
// =============================================================================

interface HandleProps {
    position: ResizeHandle;
    x: number;
    y: number;
    size: number;
    onMouseDown: (e: React.MouseEvent) => void;
}

function Handle({ position, x, y, size, onMouseDown }: HandleProps) {
    const getCursor = () => {
        switch (position) {
            case 'nw':
            case 'se':
                return 'nwse-resize';
            case 'ne':
            case 'sw':
                return 'nesw-resize';
            case 'n':
            case 's':
                return 'ns-resize';
            case 'e':
            case 'w':
                return 'ew-resize';
            default:
                return 'pointer';
        }
    };

    return (
        <div
            className="absolute resize-handle pointer-events-auto"
            data-testid="resize-handle"
            data-position={position}
            style={{
                left: x,
                top: y,
                width: size,
                height: size,
                cursor: getCursor(),
            }}
            onMouseDown={onMouseDown}
        />
    );
}

// =============================================================================
// Helper Functions
// =============================================================================

function getSelectionBounds(elements: CanvasElement[]): Bounds | null {
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
