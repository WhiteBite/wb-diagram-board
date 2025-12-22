/**
 * WB Canvas - Selection Overlay
 * 
 * Renders selection bounds and resize handles
 */

import { memo, useCallback } from 'react';
import { useCanvasStore, selectSelectedElements } from '../store/canvas-store';
import { Transform, Bounds, ResizeHandle } from '../types/canvas';

interface SelectionOverlayProps {
    transform: Transform;
}

export const SelectionOverlay = memo(function SelectionOverlay({ transform }: SelectionOverlayProps) {
    const selectedElements = useCanvasStore(selectSelectedElements);
    const setResizing = useCanvasStore((s) => s.setResizing);

    const handleMouseDown = useCallback((handle: ResizeHandle) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setResizing(true, handle);
    }, [setResizing]);

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
            className="resize-handle pointer-events-auto"
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

function getSelectionBounds(elements: { x: number; y: number; width: number; height: number }[]): Bounds | null {
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
