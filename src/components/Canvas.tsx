/**
 * WB Canvas - Main Canvas Component
 * 
 * Infinite canvas with pan, zoom, and element rendering
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { useCanvasStore, selectOrderedElements, selectTransform, selectActiveTool } from '../store/canvas-store';
import { Point, CanvasElement, ShapeElement, LineElement, ArrowElement, TextElement, StickyElement, FreedrawElement, createBaseElement, DEFAULT_TEXT_STYLE } from '../types/canvas';
import { RoughElementRenderer } from './elements/RoughElementRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { Grid } from './Grid';
import { TextEditor } from './TextEditor';

interface CanvasProps {
    className?: string;
    darkMode?: boolean;
}

export function Canvas({ className = '', darkMode = false }: CanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Store
    const elements = useCanvasStore(selectOrderedElements);
    const transform = useCanvasStore(selectTransform);
    const activeTool = useCanvasStore(selectActiveTool);
    const gridEnabled = useCanvasStore((s) => s.gridEnabled);
    const snapToGrid = useCanvasStore((s) => s.snapToGrid);
    const gridSize = useCanvasStore((s) => s.gridSize);
    const selectedIds = useCanvasStore((s) => s.selectedIds);
    const isDrawing = useCanvasStore((s) => s.isDrawing);
    const isPanning = useCanvasStore((s) => s.isPanning);
    const currentStroke = useCanvasStore((s) => s.currentStroke);
    const currentFill = useCanvasStore((s) => s.currentFill);

    // Actions
    const setTransform = useCanvasStore((s) => s.setTransform);
    const setPanning = useCanvasStore((s) => s.setPanning);
    const setDrawing = useCanvasStore((s) => s.setDrawing);
    const addElement = useCanvasStore((s) => s.addElement);
    const setSelection = useCanvasStore((s) => s.setSelection);
    const clearSelection = useCanvasStore((s) => s.clearSelection);
    const setHovered = useCanvasStore((s) => s.setHovered);
    const setActiveTool = useCanvasStore((s) => s.setTool);

    // Actions
    const updateElement = useCanvasStore((s) => s.updateElement);
    const updateElementSilent = useCanvasStore((s) => s.updateElementSilent);

    // Local state
    const [dragStart, setDragStart] = useState<Point | null>(null);
    const [dragStartCanvas, setDragStartCanvas] = useState<Point | null>(null);
    const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [draggedElementStart, setDraggedElementStart] = useState<Map<string, Point>>(new Map());
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [resizeStart, setResizeStart] = useState<{ element: CanvasElement; point: Point } | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);

    // Get resize handle from store
    const resizeHandle = useCanvasStore((s) => s.resizeHandle);
    const setResizing = useCanvasStore((s) => s.setResizing);
    const storeIsResizing = useCanvasStore((s) => s.isResizing);

    // Track resize end - record to history
    useEffect(() => {
        if (!storeIsResizing && resizeStart) {
            // Resize ended - record to history
            const el = elements.find(e => e.id === selectedIds[0]);
            if (el) {
                updateElement(selectedIds[0], { x: el.x, y: el.y, width: el.width, height: el.height });
            }
            setResizeStart(null);
        }
    }, [storeIsResizing, selectedIds, elements, resizeStart, updateElement]);

    // Space key for temporary pan (Miro-like)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                // Don't trigger if typing in input
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setPanning(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setPanning]);

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
        return {
            x: (screenX - transform.x) / transform.scale,
            y: (screenY - transform.y) / transform.scale,
        };
    }, [transform]);

    // Snap point to grid
    const snapToGridPoint = useCallback((point: Point): Point => {
        if (!snapToGrid) return point;
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize,
        };
    }, [snapToGrid, gridSize]);

    // Handle wheel (zoom)
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom factor
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(transform.scale * delta, 0.1), 10);

        // Zoom towards mouse position
        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

        setTransform({ x: newX, y: newY, scale: newScale });
    }, [transform, setTransform]);

    // Handle mouse down
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Left click only

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = screenToCanvas(screenX, screenY);
        const snappedPoint = snapToGridPoint(canvasPoint);

        setDragStart({ x: screenX, y: screenY });

        // Space+drag for temporary pan (Miro-like) or Hand tool
        if (isSpacePressed || activeTool === 'hand') {
            setPanning(true);
            return;
        }

        // Select tool - start selection box or element drag
        if (activeTool === 'select') {
            const clickedElement = findElementAtPoint(elements, canvasPoint);
            if (clickedElement) {
                // Determine which elements to move
                let idsToMove: string[];
                if (selectedIds.includes(clickedElement.id)) {
                    // Clicked on already selected element - move all selected
                    idsToMove = selectedIds;
                } else if (e.shiftKey) {
                    // Shift+click - add to selection
                    idsToMove = [...selectedIds, clickedElement.id];
                    setSelection(idsToMove);
                } else {
                    // Click on unselected element - select only this one
                    idsToMove = [clickedElement.id];
                    setSelection(idsToMove);
                }

                // Start dragging
                setIsDraggingElement(true);
                setDragStartCanvas(canvasPoint);

                // Store initial positions
                const startPositions = new Map<string, Point>();
                idsToMove.forEach(id => {
                    const el = elements.find(e => e.id === id);
                    if (el) startPositions.set(id, { x: el.x, y: el.y });
                });
                setDraggedElementStart(startPositions);
            } else {
                // Click on empty space - start selection box
                clearSelection();
                setSelectionBox({ start: canvasPoint, end: canvasPoint });
            }
            return;
        }

        // Drawing tools - create new element
        if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(activeTool)) {
            setDrawing(true);
            const newElement: ShapeElement = {
                ...createBaseElement(activeTool as ShapeElement['type'], snappedPoint.x, snappedPoint.y),
                type: activeTool as ShapeElement['type'],
                stroke: { ...currentStroke },
                fill: { ...currentFill },
                cornerRadius: activeTool === 'rectangle' ? 0 : 0,
            };
            setCurrentElement(newElement);
        }

        // Line tool
        if (activeTool === 'line') {
            setDrawing(true);
            const newElement: LineElement = {
                ...createBaseElement('line', snappedPoint.x, snappedPoint.y),
                type: 'line',
                points: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
                stroke: { ...currentStroke },
                startArrow: 'none',
                endArrow: 'none',
            };
            setCurrentElement(newElement);
        }

        // Arrow tool
        if (activeTool === 'arrow') {
            setDrawing(true);
            const newElement: ArrowElement = {
                ...createBaseElement('arrow', snappedPoint.x, snappedPoint.y),
                type: 'arrow',
                points: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
                stroke: { ...currentStroke },
                startArrow: 'none',
                endArrow: 'arrow',
            };
            setCurrentElement(newElement);
        }

        // Text tool - create text element on click
        if (activeTool === 'text') {
            const newElement: TextElement = {
                ...createBaseElement('text', snappedPoint.x, snappedPoint.y),
                type: 'text',
                text: 'Text',
                textStyle: { ...DEFAULT_TEXT_STYLE },
                width: 100,
                height: 30,
            };
            addElement(newElement);
            setSelection([newElement.id]);
        }

        // Sticky note tool
        if (activeTool === 'sticky') {
            const newElement: StickyElement = {
                ...createBaseElement('sticky', snappedPoint.x, snappedPoint.y),
                type: 'sticky',
                text: '',
                textStyle: { ...DEFAULT_TEXT_STYLE, fontSize: 14 },
                color: 'yellow',
                width: 200,
                height: 200,
            };
            addElement(newElement);
            setSelection([newElement.id]);
        }

        // Freedraw tool
        if (activeTool === 'freedraw') {
            setDrawing(true);
            const newElement: FreedrawElement = {
                ...createBaseElement('freedraw', snappedPoint.x, snappedPoint.y),
                type: 'freedraw',
                points: [{ x: 0, y: 0 }],
                stroke: { ...currentStroke },
                simulatePressure: true,
            };
            setCurrentElement(newElement);
        }
    }, [activeTool, elements, screenToCanvas, snapToGridPoint, currentStroke, currentFill, setPanning, setDrawing, clearSelection]);

    // Handle mouse move
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = screenToCanvas(screenX, screenY);

        // Panning
        if (isPanning && dragStart) {
            const dx = screenX - dragStart.x;
            const dy = screenY - dragStart.y;
            setTransform({
                x: transform.x + dx,
                y: transform.y + dy,
            });
            setDragStart({ x: screenX, y: screenY });
            return;
        }

        // Selection box
        if (selectionBox) {
            setSelectionBox({ ...selectionBox, end: canvasPoint });
            return;
        }

        // Dragging selected elements
        if (isDraggingElement && dragStartCanvas && draggedElementStart.size > 0) {
            const dx = canvasPoint.x - dragStartCanvas.x;
            const dy = canvasPoint.y - dragStartCanvas.y;

            draggedElementStart.forEach((startPos, id) => {
                const newX = snapToGrid ? Math.round((startPos.x + dx) / gridSize) * gridSize : startPos.x + dx;
                const newY = snapToGrid ? Math.round((startPos.y + dy) / gridSize) * gridSize : startPos.y + dy;
                updateElementSilent(id, { x: newX, y: newY });
            });
            return;
        }

        // Resizing element
        if (storeIsResizing && resizeHandle && selectedIds.length === 1) {
            // Initialize resize start on first move
            if (!resizeStart) {
                const el = elements.find(e => e.id === selectedIds[0]);
                if (el) {
                    setResizeStart({ element: { ...el }, point: canvasPoint });
                }
                return;
            }

            const el = resizeStart.element;
            const dx = canvasPoint.x - resizeStart.point.x;
            const dy = canvasPoint.y - resizeStart.point.y;

            let newX = el.x;
            let newY = el.y;
            let newWidth = el.width;
            let newHeight = el.height;

            // Handle resize based on handle position
            switch (resizeHandle) {
                case 'nw':
                    newX = el.x + dx;
                    newY = el.y + dy;
                    newWidth = el.width - dx;
                    newHeight = el.height - dy;
                    break;
                case 'n':
                    newY = el.y + dy;
                    newHeight = el.height - dy;
                    break;
                case 'ne':
                    newY = el.y + dy;
                    newWidth = el.width + dx;
                    newHeight = el.height - dy;
                    break;
                case 'w':
                    newX = el.x + dx;
                    newWidth = el.width - dx;
                    break;
                case 'e':
                    newWidth = el.width + dx;
                    break;
                case 'sw':
                    newX = el.x + dx;
                    newWidth = el.width - dx;
                    newHeight = el.height + dy;
                    break;
                case 's':
                    newHeight = el.height + dy;
                    break;
                case 'se':
                    newWidth = el.width + dx;
                    newHeight = el.height + dy;
                    break;
            }

            // Ensure minimum size
            const minSize = 20;
            if (newWidth < minSize) {
                if (resizeHandle.includes('w')) newX = el.x + el.width - minSize;
                newWidth = minSize;
            }
            if (newHeight < minSize) {
                if (resizeHandle.includes('n')) newY = el.y + el.height - minSize;
                newHeight = minSize;
            }

            // Snap to grid
            if (snapToGrid) {
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;
                newWidth = Math.round(newWidth / gridSize) * gridSize;
                newHeight = Math.round(newHeight / gridSize) * gridSize;
            }

            updateElementSilent(selectedIds[0], { x: newX, y: newY, width: newWidth, height: newHeight });
            return;
        }

        // Drawing element
        if (isDrawing && currentElement && dragStart) {
            const snappedPoint = snapToGridPoint(canvasPoint);
            const startPoint = snapToGridPoint(screenToCanvas(dragStart.x, dragStart.y));

            // Shape elements
            if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(currentElement.type)) {
                const width = Math.abs(snappedPoint.x - startPoint.x);
                const height = Math.abs(snappedPoint.y - startPoint.y);
                const x = Math.min(snappedPoint.x, startPoint.x);
                const y = Math.min(snappedPoint.y, startPoint.y);

                setCurrentElement({
                    ...currentElement,
                    x,
                    y,
                    width,
                    height,
                });
            }

            // Line/Arrow elements
            if (currentElement.type === 'line' || currentElement.type === 'arrow') {
                const dx = snappedPoint.x - startPoint.x;
                const dy = snappedPoint.y - startPoint.y;
                const width = Math.abs(dx);
                const height = Math.abs(dy);

                setCurrentElement({
                    ...currentElement,
                    x: Math.min(startPoint.x, snappedPoint.x),
                    y: Math.min(startPoint.y, snappedPoint.y),
                    width: Math.max(width, 1),
                    height: Math.max(height, 1),
                    points: [
                        { x: dx >= 0 ? 0 : width, y: dy >= 0 ? 0 : height },
                        { x: dx >= 0 ? width : 0, y: dy >= 0 ? height : 0 },
                    ],
                } as LineElement | ArrowElement);
            }

            // Freedraw element - add points as we move
            if (currentElement.type === 'freedraw') {
                const freedraw = currentElement as FreedrawElement;
                const relativePoint = {
                    x: canvasPoint.x - freedraw.x,
                    y: canvasPoint.y - freedraw.y,
                };

                // Calculate bounds
                const allPoints = [...freedraw.points, relativePoint];
                const minX = Math.min(...allPoints.map(p => p.x));
                const minY = Math.min(...allPoints.map(p => p.y));
                const maxX = Math.max(...allPoints.map(p => p.x));
                const maxY = Math.max(...allPoints.map(p => p.y));

                setCurrentElement({
                    ...freedraw,
                    points: [...freedraw.points, relativePoint],
                    width: Math.max(maxX - minX, 1),
                    height: Math.max(maxY - minY, 1),
                });
            }
        }

        // Hover detection
        if (activeTool === 'select' && !isDrawing && !isPanning) {
            const hoveredElement = findElementAtPoint(elements, canvasPoint);
            setHovered(hoveredElement?.id || null);
        }
    }, [isPanning, isDrawing, dragStart, transform, selectionBox, currentElement, activeTool, elements, screenToCanvas, snapToGridPoint, setTransform, setHovered]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        // End panning
        if (isPanning) {
            setPanning(false);
        }

        // End resizing
        if (storeIsResizing) {
            setResizing(false, null);
        }

        // End element dragging - record history for undo
        if (isDraggingElement && draggedElementStart.size > 0) {
            // Record final positions to history
            draggedElementStart.forEach((startPos, id) => {
                const el = elements.find(e => e.id === id);
                if (el && (el.x !== startPos.x || el.y !== startPos.y)) {
                    // Only record if position actually changed
                    updateElement(id, { x: el.x, y: el.y });
                }
            });
            setIsDraggingElement(false);
            setDragStartCanvas(null);
            setDraggedElementStart(new Map());
        }

        // End selection box
        if (selectionBox) {
            const selectedElements = findElementsInBox(elements, selectionBox.start, selectionBox.end);
            setSelection(selectedElements.map((el) => el.id));
            setSelectionBox(null);
        }

        // End drawing - auto-switch to Select tool (Miro-like UX)
        if (isDrawing && currentElement) {
            if (currentElement.width > 5 && currentElement.height > 5) {
                addElement(currentElement);
                setSelection([currentElement.id]);
                // Auto-switch to select tool after creating element
                setActiveTool('select');
            }
            setCurrentElement(null);
            setDrawing(false);
        }

        setDragStart(null);
    }, [isPanning, isDrawing, isDraggingElement, selectionBox, currentElement, elements, setPanning, setDrawing, addElement, setSelection]);

    // Get cursor class
    const getCursorClass = () => {
        if (isPanning) return 'tool-hand panning';
        if (isSpacePressed) return 'tool-hand';
        if (isDraggingElement) return 'tool-move';
        if (activeTool === 'hand') return 'tool-hand';
        if (activeTool === 'select') return 'tool-select';
        if (['rectangle', 'ellipse', 'diamond', 'triangle', 'line', 'arrow', 'freedraw'].includes(activeTool)) {
            return 'tool-draw';
        }
        if (activeTool === 'text') return 'tool-text';
        return '';
    };

    // Handle double click for text editing
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = screenToCanvas(screenX, screenY);

        const clickedElement = findElementAtPoint(elements, canvasPoint);
        if (clickedElement && ['rectangle', 'ellipse', 'diamond', 'triangle', 'text', 'sticky'].includes(clickedElement.type)) {
            setEditingTextId(clickedElement.id);
        }
    }, [elements, screenToCanvas]);

    return (
        <div
            ref={canvasRef}
            className={`canvas-container ${getCursorClass()} ${className}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
        >
            {/* Grid */}
            {gridEnabled && <Grid transform={transform} gridSize={gridSize} darkMode={darkMode} />}

            {/* SVG Canvas */}
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                style={{ overflow: 'visible' }}
            >
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                    {/* Render elements */}
                    {elements.map((element) => (
                        <RoughElementRenderer
                            key={element.id}
                            element={element}
                            isSelected={selectedIds.includes(element.id)}
                        />
                    ))}

                    {/* Current drawing element */}
                    {currentElement && (
                        <RoughElementRenderer
                            element={currentElement}
                            isSelected={false}
                        />
                    )}
                </g>
            </svg>

            {/* Selection overlay */}
            <SelectionOverlay transform={transform} />

            {/* Selection box */}
            {selectionBox && (
                <div
                    className="selection-box"
                    style={{
                        left: Math.min(selectionBox.start.x, selectionBox.end.x) * transform.scale + transform.x,
                        top: Math.min(selectionBox.start.y, selectionBox.end.y) * transform.scale + transform.y,
                        width: Math.abs(selectionBox.end.x - selectionBox.start.x) * transform.scale,
                        height: Math.abs(selectionBox.end.y - selectionBox.start.y) * transform.scale,
                    }}
                />
            )}

            {/* Text editor */}
            {editingTextId && (
                <TextEditor
                    elementId={editingTextId}
                    transform={transform}
                    onClose={() => setEditingTextId(null)}
                />
            )}
        </div>
    );
}

// =============================================================================
// Helper Functions
// =============================================================================

function findElementAtPoint(elements: CanvasElement[], point: Point): CanvasElement | null {
    // Search in reverse order (top elements first)
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (
            point.x >= el.x &&
            point.x <= el.x + el.width &&
            point.y >= el.y &&
            point.y <= el.y + el.height
        ) {
            return el;
        }
    }
    return null;
}

function findElementsInBox(elements: CanvasElement[], start: Point, end: Point): CanvasElement[] {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    return elements.filter((el) => {
        return (
            el.x >= minX &&
            el.x + el.width <= maxX &&
            el.y >= minY &&
            el.y + el.height <= maxY
        );
    });
}
