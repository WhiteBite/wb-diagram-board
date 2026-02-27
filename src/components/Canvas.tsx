/**
 * WB Canvas - Main Canvas Component
 * 
 * Infinite canvas with pan, zoom, and element rendering
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { useCanvasStore, selectOrderedElements, selectTransform, selectActiveTool } from '../store/canvas-store';
import { useGuidesStore, selectGuides, selectSnapPoints } from '../store/guides-store';
import { Point, CanvasElement, ShapeElement, LineElement, ArrowElement, ConnectorElement, TextElement, StickyElement, FreedrawElement, FrameElement, createBaseElement, DEFAULT_TEXT_STYLE } from '../types/canvas';
import { RoughElementRenderer } from './elements/RoughElementRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { Grid } from './Grid';
import { TextEditor } from './TextEditor';
import { GuidesRenderer } from './guides';
import { useGuides } from '../hooks/useGuides';

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

    // Guides
    const guides = useGuidesStore(selectGuides);
    const snapPoints = useGuidesStore(selectSnapPoints);
    const guidesConfig = useGuidesStore((s) => s.config);
    const {
        updateGuidesForElement,
        updateSnapPointsForElement,
        startDragging,
        stopDragging,
    } = useGuides();

    // Actions
    const setTransform = useCanvasStore((s) => s.setTransform);
    const setPanning = useCanvasStore((s) => s.setPanning);
    const setDrawing = useCanvasStore((s) => s.setDrawing);
    const addElement = useCanvasStore((s) => s.addElement);
    const setSelection = useCanvasStore((s) => s.setSelection);
    const clearSelection = useCanvasStore((s) => s.clearSelection);
    const setHovered = useCanvasStore((s) => s.setHovered);
    const setActiveTool = useCanvasStore((s) => s.setTool);
    const updateElements = useCanvasStore((s) => s.updateElements);
    const updateElementSilent = useCanvasStore((s) => s.updateElementSilent);
    const updateFrameChildren = useCanvasStore((s) => s.updateFrameChildren);
    const deleteElements = useCanvasStore((s) => s.deleteElements);

    // Local state
    const [dragStart, setDragStart] = useState<Point | null>(null);
    const [dragStartCanvas, setDragStartCanvas] = useState<Point | null>(null);
    const [currentElement, setCurrentElement] = useState<CanvasElement | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [draggedElementStart, setDraggedElementStart] = useState<Map<string, Point>>(new Map());
    const [draggedElementOriginal, setDraggedElementOriginal] = useState<Map<string, Point>>(new Map()); // For undo history
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [shiftClickedElementId, setShiftClickedElementId] = useState<string | null>(null); // For Shift+click toggle
    const [hasDragged, setHasDragged] = useState(false); // Track if actual drag happened

    // Close editor when tool changes (except when switching to select after text/sticky creation)
    useEffect(() => {
        if (activeTool !== 'select' && activeTool !== 'text' && activeTool !== 'sticky') {
            setEditingTextId(null);
        }
    }, [activeTool]);
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
        // Read transform from store to get latest value
        const currentTransform = useCanvasStore.getState().transform;
        return {
            x: (screenX - currentTransform.x) / currentTransform.scale,
            y: (screenY - currentTransform.y) / currentTransform.scale,
        };
    }, []);

    /**
     * Updates all connectors that are bound to the given element
     * Called when an element is moved or resized
     * 
     * @param elementId - ID of the element that changed
     */
    const updateConnectorsForElement = useCallback((elementId: string) => {
        const state = useCanvasStore.getState();
        const element = state.elements[elementId];

        if (!element) return;

        // Find all connectors bound to this element
        const connectorsToUpdate = Object.values(state.elements).filter(
            (el): el is ConnectorElement =>
                el.type === 'connector' &&
                (el.startBinding?.elementId === elementId || el.endBinding?.elementId === elementId)
        );

        // Update each connector's waypoints
        connectorsToUpdate.forEach((connector) => {
            try {
                // For now, just update the connector's position to match element bounds
                // In a full implementation, this would recalculate the route
                updateElementSilent(connector.id, {
                    x: Math.min(element.x, element.x + element.width),
                    y: Math.min(element.y, element.y + element.height),
                });
            } catch (error) {
                console.error('[Canvas] Error updating connector:', error);
            }
        });
    }, [updateElementSilent]);

    /**
     * Deletes elements and any connectors bound to them
     * 
     * @param ids - IDs of elements to delete
     */
    const handleDeleteElements = useCallback((ids: string[]) => {
        const state = useCanvasStore.getState();
        const connectorsToDelete = Object.values(state.elements)
            .filter((el): el is ConnectorElement => el.type === 'connector')
            .filter(
                (connector) =>
                    ids.includes(connector.startBinding?.elementId || '') ||
                    ids.includes(connector.endBinding?.elementId || '')
            )
            .map((c) => c.id);

        // Delete both the selected elements and any bound connectors
        deleteElements([...ids, ...connectorsToDelete]);
    }, [deleteElements]);

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

        // Don't close editor or process other logic for text/sticky tool clicks
        if (activeTool === 'text' || activeTool === 'sticky') {
            // These tools handle editor opening themselves
            // Don't process the close-editor logic below
        } else if (editingTextId) {
            // Close editor if clicking outside of the editing element
            const editingElement = elements.find(el => el.id === editingTextId);
            if (editingElement) {
                const clickedOnEditor =
                    canvasPoint.x >= editingElement.x &&
                    canvasPoint.x <= editingElement.x + editingElement.width &&
                    canvasPoint.y >= editingElement.y &&
                    canvasPoint.y <= editingElement.y + editingElement.height;

                if (!clickedOnEditor) {
                    setEditingTextId(null);
                }
            }
        }

        // Space+drag for temporary pan (Miro-like) or Hand tool
        if (isSpacePressed || activeTool === 'hand') {
            setPanning(true);
            setDragStart({ x: screenX, y: screenY });
            return;
        }

        // Read activeTool from store to get latest value
        const currentActiveTool = useCanvasStore.getState().activeTool;

        // Select tool - start selection box or element drag
        if (currentActiveTool === 'select') {
            // Read elements directly from store to get latest state
            const currentState = useCanvasStore.getState();
            const currentElements = Object.values(currentState.elements);
            const clickedElement = findElementAtPoint(currentElements, canvasPoint);
            // Read selectedIds directly from store to get latest value
            const currentSelectedIds = currentState.selectedIds;
            console.log('[Canvas] Select tool click, clickedElement:', clickedElement?.id, 'type:', clickedElement?.type);
            console.log('[Canvas] Currently selected:', currentSelectedIds);

            if (clickedElement) {
                // Check if clicked element is a child of a selected frame
                let parentFrame: CanvasElement | null = null;
                for (const selectedId of currentSelectedIds) {
                    const selectedEl = currentState.elements[selectedId];
                    console.log('[Canvas] Checking selected element:', selectedId, 'type:', selectedEl?.type);
                    if (selectedEl && selectedEl.type === 'frame') {
                        const frameEl = selectedEl as FrameElement;
                        console.log('[Canvas] Frame children:', frameEl.childIds, 'clicked:', clickedElement.id);
                        if (frameEl.childIds.includes(clickedElement.id)) {
                            parentFrame = selectedEl;
                            console.log('[Canvas] Found parent frame!');
                            break;
                        }
                    }
                }

                // If clicked on a child of a selected frame, drag the frame instead
                if (parentFrame) {
                    console.log('[Canvas] Dragging parent frame instead of child');
                    setIsDraggingElement(true);
                    setDragStartCanvas(canvasPoint);

                    // Store initial positions for frame and all its children
                    // Read elements directly from store to get latest state
                    const currentElements = useCanvasStore.getState().elements;
                    const startPositions = new Map<string, Point>();
                    startPositions.set(parentFrame.id, { x: parentFrame.x, y: parentFrame.y });

                    const frameEl = parentFrame as FrameElement;
                    frameEl.childIds.forEach(childId => {
                        const childEl = currentElements[childId];
                        if (childEl) {
                            startPositions.set(childId, { x: childEl.x, y: childEl.y });
                        }
                    });
                    console.log('[Canvas] Parent frame drag - elements to move:', startPositions.size);
                    setDraggedElementStart(startPositions);
                    setDraggedElementOriginal(new Map(startPositions)); // Store for undo
                    return;
                }

                // Determine which elements to move
                let idsToMove: string[];
                const isAlreadySelected = currentSelectedIds.includes(clickedElement.id);

                if (e.shiftKey && isAlreadySelected) {
                    // Shift+click on already selected element
                    // Mark for potential deselection (will be handled in mouseUp if no drag)
                    setShiftClickedElementId(clickedElement.id);
                    idsToMove = currentSelectedIds;
                } else if (e.shiftKey && !isAlreadySelected) {
                    // Shift+click on unselected element - add to selection
                    idsToMove = [...currentSelectedIds, clickedElement.id];
                    setSelection(idsToMove);
                    setShiftClickedElementId(null);
                } else if (isAlreadySelected) {
                    // Clicked on already selected element - move all selected
                    idsToMove = currentSelectedIds;
                    setShiftClickedElementId(null);
                } else {
                    // Click on unselected element - select only this one
                    idsToMove = [clickedElement.id];
                    setSelection(idsToMove);
                    setShiftClickedElementId(null);
                }

                setHasDragged(false); // Reset drag tracking

                // Start dragging
                setIsDraggingElement(true);
                setDragStartCanvas(canvasPoint);

                // Store initial positions (including frame children)
                // Read elements directly from store to get latest state
                const currentElements = useCanvasStore.getState().elements;
                const startPositions = new Map<string, Point>();
                console.log('[Canvas] Starting drag for ids:', idsToMove);
                idsToMove.forEach(id => {
                    const el = currentElements[id];
                    if (el) {
                        console.log('[Canvas] Storing start position for:', id, 'type:', el.type, 'pos:', { x: el.x, y: el.y });
                        startPositions.set(id, { x: el.x, y: el.y });

                        // If this is a frame, also store children positions
                        if (el.type === 'frame') {
                            const frameEl = el as FrameElement;
                            console.log('[Canvas] Frame has children:', frameEl.childIds);
                            frameEl.childIds.forEach(childId => {
                                const childEl = currentElements[childId];
                                if (childEl) {
                                    console.log('[Canvas] Storing child position:', childId, 'pos:', { x: childEl.x, y: childEl.y });
                                    startPositions.set(childId, { x: childEl.x, y: childEl.y });
                                }
                            });
                        }
                    }
                });
                console.log('[Canvas] Total elements to drag:', startPositions.size);
                setDraggedElementStart(startPositions);
                setDraggedElementOriginal(new Map(startPositions)); // Store for undo

                // Start showing guides
                startDragging();
            } else {
                // Click on empty space - start selection box
                console.log('[Canvas] Starting selection box at:', canvasPoint);
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

        // Frame tool
        if (activeTool === 'frame') {
            setDrawing(true);
            const newElement: FrameElement = {
                ...createBaseElement('frame', snappedPoint.x, snappedPoint.y),
                type: 'frame',
                name: 'Frame',
                stroke: { ...currentStroke },
                fill: { type: 'none', color: '#ffffff' },
                childIds: [],
                clip: false,
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

        // Connector tool
        if (activeTool === 'connector') {
            setDrawing(true);
            const newElement: ConnectorElement = {
                ...createBaseElement('connector', snappedPoint.x, snappedPoint.y),
                type: 'connector',
                stroke: { ...currentStroke },
                startArrow: 'arrow',
                endArrow: 'arrow',
                routeType: 'straight',
                waypoints: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
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
            // Auto-switch to select tool
            setActiveTool('select');
            // Open editor immediately
            setEditingTextId(newElement.id);
            return; // Don't process other tool logic
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
            // Auto-switch to select tool
            setActiveTool('select');
            // Open editor immediately
            setEditingTextId(newElement.id);
            return; // Don't process other tool logic
        }

        // Freedraw tool
        if (activeTool === 'freedraw') {
            setDrawing(true);
            const newElement: FreedrawElement = {
                ...createBaseElement('freedraw', snappedPoint.x, snappedPoint.y),
                type: 'freedraw',
                points: [{ x: 0, y: 0 }],
                strokeColor: currentStroke.color,
                strokeWidth: currentStroke.width,
                strokeStyle: currentStroke.style,
                smoothing: true,
                simulatePressure: true,
                pressurePoints: [0.5], // Initial pressure
            };
            setCurrentElement(newElement);
        }

        // Eraser tool
        if (activeTool === 'eraser') {
            setDrawing(true);
            // Check if we're over an element and erase it immediately
            const hoveredElement = findElementAtPoint(elements, canvasPoint);
            if (hoveredElement && !hoveredElement.locked) {
                handleDeleteElements([hoveredElement.id]);
            }
        }
    }, [activeTool, elements, screenToCanvas, snapToGridPoint, currentStroke, currentFill, setPanning, setDrawing, clearSelection, editingTextId, handleDeleteElements, isSpacePressed]);

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
            let dx = canvasPoint.x - dragStartCanvas.x;
            let dy = canvasPoint.y - dragStartCanvas.y;

            // Mark that actual drag happened (for Shift+click vs Shift+drag distinction)
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                setHasDragged(true);
            }

            console.log('[Canvas] Dragging, dx:', dx, 'dy:', dy, 'draggedElementStart size:', draggedElementStart.size);

            // Shift+drag constraint - lock to horizontal or vertical axis
            if (e.shiftKey) {
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);
                if (absDx > absDy) {
                    // Horizontal constraint - lock Y
                    dy = 0;
                } else {
                    // Vertical constraint - lock X
                    dx = 0;
                }
                console.log('[Canvas] Shift constraint applied, dx:', dx, 'dy:', dy);
            }

            // Apply snap to grid to the delta, not individual positions
            // This preserves relative positioning between elements
            if (snapToGrid) {
                dx = Math.round(dx / gridSize) * gridSize;
                dy = Math.round(dy / gridSize) * gridSize;
                console.log('[Canvas] Snapped delta:', { dx, dy });
            }

            draggedElementStart.forEach((startPos, id) => {
                const el = elements.find(e => e.id === id);
                const newX = startPos.x + dx;
                const newY = startPos.y + dy;

                console.log('[Canvas] Updating element:', id, 'type:', el?.type, 'from:', startPos, 'to:', { x: newX, y: newY });
                updateElementSilent(id, { x: newX, y: newY });
            });

            // Update guides for the first dragged element
            if (draggedElementStart.size > 0) {
                const firstId = Array.from(draggedElementStart.keys())[0];
                const draggedElement = elements.find(e => e.id === firstId);
                if (draggedElement) {
                    updateGuidesForElement(draggedElement, elements);
                    updateSnapPointsForElement(draggedElement, elements);
                }
            }

            return;
        }

        // Drawing element
        if (isDrawing && currentElement && dragStart) {
            const snappedPoint = snapToGridPoint(canvasPoint);
            const startPoint = snapToGridPoint(screenToCanvas(dragStart.x, dragStart.y));

            // Shape elements (including frame)
            if (['rectangle', 'ellipse', 'diamond', 'triangle', 'frame'].includes(currentElement.type)) {
                // Calculate dimensions from unsnapped points for accurate Shift constraint
                const unsnappedStart = screenToCanvas(dragStart.x, dragStart.y);
                let width = Math.abs(canvasPoint.x - unsnappedStart.x);
                let height = Math.abs(canvasPoint.y - unsnappedStart.y);

                // Shift key constraint - make proportional (square/circle) BEFORE snapping
                if (e.shiftKey && currentElement.type !== 'frame') {
                    const size = Math.min(width, height);
                    width = size;
                    height = size;
                }

                // Apply snapping to dimensions
                if (snapToGrid) {
                    width = Math.round(width / gridSize) * gridSize;
                    height = Math.round(height / gridSize) * gridSize;
                }

                // Calculate position and snap it
                const x = Math.min(canvasPoint.x, unsnappedStart.x);
                const y = Math.min(canvasPoint.y, unsnappedStart.y);
                const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
                const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

                setCurrentElement({
                    ...currentElement,
                    x: finalX,
                    y: finalY,
                    width,
                    height,
                });
            }

            // Line/Arrow/Connector elements
            if (currentElement.type === 'line' || currentElement.type === 'arrow' || currentElement.type === 'connector') {
                let dx = snappedPoint.x - startPoint.x;
                let dy = snappedPoint.y - startPoint.y;

                // Shift key constraint - snap to horizontal, vertical, or 45-degree
                if (e.shiftKey) {
                    const absDx = Math.abs(dx);
                    const absDy = Math.abs(dy);

                    // Determine which constraint to apply
                    if (absDx > absDy * 2) {
                        // Horizontal - lock Y
                        dy = 0;
                    } else if (absDy > absDx * 2) {
                        // Vertical - lock X
                        dx = 0;
                    } else {
                        // 45-degree - make dx and dy equal
                        const size = Math.min(absDx, absDy);
                        dx = dx >= 0 ? size : -size;
                        dy = dy >= 0 ? size : -size;
                    }
                }

                const width = Math.abs(dx);
                const height = Math.abs(dy);

                if (currentElement.type === 'connector') {
                    // Connector uses waypoints instead of points
                    setCurrentElement({
                        ...currentElement,
                        x: Math.min(startPoint.x, startPoint.x + dx),
                        y: Math.min(startPoint.y, startPoint.y + dy),
                        width: Math.max(width, 1),
                        height: Math.max(height, 1),
                        waypoints: [
                            { x: dx >= 0 ? 0 : width, y: dy >= 0 ? 0 : height },
                            { x: dx >= 0 ? width : 0, y: dy >= 0 ? height : 0 },
                        ],
                    } as ConnectorElement);
                } else {
                    // Line and Arrow use points
                    setCurrentElement({
                        ...currentElement,
                        x: Math.min(startPoint.x, startPoint.x + dx),
                        y: Math.min(startPoint.y, startPoint.y + dy),
                        width: Math.max(width, 1),
                        height: Math.max(height, 1),
                        points: [
                            { x: dx >= 0 ? 0 : width, y: dy >= 0 ? 0 : height },
                            { x: dx >= 0 ? width : 0, y: dy >= 0 ? height : 0 },
                        ],
                    } as LineElement | ArrowElement);
                }
            }

            // Freedraw element - add points as we move
            if (currentElement.type === 'freedraw') {
                const freedraw = currentElement as FreedrawElement;
                const relativePoint = {
                    x: canvasPoint.x - freedraw.x,
                    y: canvasPoint.y - freedraw.y,
                };

                // Simulate pressure variation (0.3 to 1.0)
                const pressure = 0.5 + Math.random() * 0.5;

                // Calculate bounds
                const allPoints = [...freedraw.points, relativePoint];
                const minX = Math.min(...allPoints.map(p => p.x));
                const minY = Math.min(...allPoints.map(p => p.y));
                const maxX = Math.max(...allPoints.map(p => p.x));
                const maxY = Math.max(...allPoints.map(p => p.y));

                setCurrentElement({
                    ...freedraw,
                    points: [...freedraw.points, relativePoint],
                    pressurePoints: [...(freedraw.pressurePoints || []), pressure],
                    width: Math.max(maxX - minX, 1),
                    height: Math.max(maxY - minY, 1),
                });
            }
        }

        // Eraser tool - erase elements as we move over them
        if (activeTool === 'eraser' && isDrawing) {
            const hoveredElement = findElementAtPoint(elements, canvasPoint);
            if (hoveredElement && !hoveredElement.locked) {
                handleDeleteElements([hoveredElement.id]);
            }
        }

        // Hover detection
        if (activeTool === 'select' && !isDrawing && !isPanning) {
            const hoveredElement = findElementAtPoint(elements, canvasPoint);
            setHovered(hoveredElement?.id || null);
        }
    }, [isPanning, isDrawing, dragStart, transform, selectionBox, currentElement, activeTool, elements, screenToCanvas, snapToGridPoint, setTransform, setHovered, handleDeleteElements]);

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        // End panning
        if (isPanning) {
            setPanning(false);
        }

        // Handle Shift+click deselect (only if no drag happened)
        if (shiftClickedElementId && !hasDragged) {
            // Remove the element from selection
            const currentSelectedIds = useCanvasStore.getState().selectedIds;
            const newSelection = currentSelectedIds.filter(id => id !== shiftClickedElementId);
            setSelection(newSelection);
        }
        setShiftClickedElementId(null);
        setHasDragged(false);

        // End element dragging - record history for undo
        if (isDraggingElement && draggedElementStart.size > 0) {
            // Get current state to ensure we have latest positions
            const currentState = useCanvasStore.getState();
            const currentElements = currentState.elements;

            // Collect all updates for batch history entry
            const updates: Record<string, Partial<CanvasElement>> = {};
            let hasChanges = false;

            // Use original positions (from drag start) to check for actual changes
            draggedElementOriginal.forEach((originalPos, id) => {
                const el = currentElements[id];
                if (el && (el.x !== originalPos.x || el.y !== originalPos.y)) {
                    // Only record if position actually changed from original
                    updates[id] = { x: el.x, y: el.y };
                    hasChanges = true;
                }
            });

            // Use batch update to create single history entry for all moved elements
            if (hasChanges) {
                // First, restore original positions silently
                draggedElementOriginal.forEach((originalPos, id) => {
                    updateElementSilent(id, { x: originalPos.x, y: originalPos.y });
                });
                // Then apply updates with history
                updateElements(updates);
            }

            // Update frame children after drag (in case elements moved in/out of frames)
            setTimeout(() => {
                const state = useCanvasStore.getState();
                Object.values(state.elements).forEach((el) => {
                    if (el.type === 'frame') {
                        updateFrameChildren(el.id);
                    }
                });
            }, 0);

            setIsDraggingElement(false);
            setDragStartCanvas(null);
            setDraggedElementStart(new Map());
            setDraggedElementOriginal(new Map());
        }

        // End selection box
        if (selectionBox) {
            console.log('[Canvas] Ending selection box:', selectionBox);
            // Read elements directly from store to get latest state
            const currentElements = Object.values(useCanvasStore.getState().elements);
            const selectedElements = findElementsInBox(currentElements, selectionBox.start, selectionBox.end);
            console.log('[Canvas] Found elements in box:', selectedElements.length, selectedElements.map(e => e.id));
            setSelection(selectedElements.map((el) => el.id));
            setSelectionBox(null);
        }

        // End drawing - auto-switch to Select tool (Miro-like UX)
        if (isDrawing && currentElement) {
            // Enforce minimum size
            const minSize = currentElement.type === 'frame' ? 100 : 5;
            const finalWidth = Math.max(currentElement.width, minSize);
            const finalHeight = Math.max(currentElement.height, minSize);

            // Only create element if it has some size (even if tiny, we'll enforce minimum)
            if (currentElement.width > 0 && currentElement.height > 0) {
                const elementToAdd = {
                    ...currentElement,
                    width: finalWidth,
                    height: finalHeight,
                };

                addElement(elementToAdd);
                setSelection([elementToAdd.id]);

                // If it's a frame, detect and add children
                if (elementToAdd.type === 'frame') {
                    setTimeout(() => {
                        updateFrameChildren(elementToAdd.id);
                    }, 0);
                } else {
                    // If it's not a frame, check if it's inside any existing frames
                    const state = useCanvasStore.getState();
                    Object.values(state.elements).forEach((el) => {
                        if (el.type === 'frame') {
                            updateFrameChildren(el.id);
                        }
                    });
                }

                // Auto-switch to select tool after creating element (Miro-like UX)
                setActiveTool('select');
            }
            setCurrentElement(null);
            setDrawing(false);
        }

        // Stop showing guides
        stopDragging();
        setDragStart(null);
    }, [isPanning, isDrawing, isDraggingElement, selectionBox, currentElement, elements, setPanning, setDrawing, addElement, setSelection, setActiveTool, updateFrameChildren, shiftClickedElementId, hasDragged, stopDragging]);

    // Get cursor class
    const getCursorClass = () => {
        if (isPanning) return 'tool-hand panning';
        if (isSpacePressed) return 'tool-hand';
        if (isDraggingElement) return 'tool-move';
        if (activeTool === 'hand') return 'tool-hand';
        if (activeTool === 'select') return 'tool-select';
        if (activeTool === 'eraser') return 'tool-eraser';
        if (['rectangle', 'ellipse', 'diamond', 'triangle', 'line', 'arrow', 'freedraw'].includes(activeTool)) {
            return 'tool-draw';
        }
        if (activeTool === 'text') return 'tool-text';
        return '';
    };

    // Get cursor style for SVG (needed for getComputedStyle to work correctly)
    const getCursorStyle = (): string => {
        if (isPanning) return 'grabbing';
        if (isSpacePressed) return 'grab';
        if (isDraggingElement) return 'move';
        if (activeTool === 'hand') return 'grab';
        if (activeTool === 'select') return 'default';
        if (activeTool === 'eraser') return 'crosshair';
        if (['rectangle', 'ellipse', 'diamond', 'triangle', 'line', 'arrow', 'freedraw'].includes(activeTool)) {
            return 'crosshair';
        }
        if (activeTool === 'text') return 'text';
        return 'default';
    };

    // Handle double click for text editing
    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        console.log('[Canvas] Double click event');
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const canvasPoint = screenToCanvas(screenX, screenY);
        console.log('[Canvas] Double click at canvas point:', canvasPoint);

        const clickedElement = findElementAtPoint(elements, canvasPoint);
        console.log('[Canvas] Clicked element:', clickedElement);

        if (clickedElement && ['rectangle', 'ellipse', 'diamond', 'triangle', 'text', 'sticky'].includes(clickedElement.type)) {
            console.log('[Canvas] Opening editor for element:', clickedElement.id);
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
            {/* SVG Canvas - rendered first so page.locator('svg').first() finds it */}
            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                style={{ overflow: 'visible', cursor: getCursorStyle() }}
                data-testid="canvas-svg"
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

                    {/* Alignment guides */}
                    <GuidesRenderer
                        guides={guides}
                        snapPoints={snapPoints}
                        transform={transform}
                        visible={guidesConfig.showGuides && guides.length > 0}
                    />
                </g>
            </svg>

            {/* Grid - rendered after SVG so it appears on top visually but SVG is first in DOM */}
            {gridEnabled && <Grid transform={transform} gridSize={gridSize} darkMode={darkMode} />}

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

            {/* Drag preview - shows during element drag */}
            {isDraggingElement && draggedElementStart.size > 0 && (
                <div
                    data-testid="drag-preview"
                    className="drag-preview pointer-events-none"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1000,
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
    console.log('[findElementAtPoint] Searching for element at point:', point, 'in', elements.length, 'elements');
    // Search in reverse order (top elements first)
    for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        // Skip locked elements
        if (el.locked) continue;

        const isInside = (
            point.x >= el.x &&
            point.x <= el.x + el.width &&
            point.y >= el.y &&
            point.y <= el.y + el.height
        );
        console.log('[findElementAtPoint] Element', el.id, 'bounds:', { x: el.x, y: el.y, w: el.width, h: el.height }, 'isInside:', isInside);

        if (isInside) {
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

    console.log('[findElementsInBox] Box:', { minX, maxX, minY, maxY });
    console.log('[findElementsInBox] Elements to check:', elements.length);

    return elements.filter((el) => {
        // Skip locked elements
        if (el.locked) return false;

        const contained = (
            el.x >= minX &&
            el.x + el.width <= maxX &&
            el.y >= minY &&
            el.y + el.height <= maxY
        );

        console.log('[findElementsInBox] Element', el.id, 'bounds:', { x: el.x, y: el.y, w: el.width, h: el.height }, 'contained:', contained);

        return contained;
    });
}
