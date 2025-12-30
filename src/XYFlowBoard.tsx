/**
 * XYFlowBoard - Main diagram board component using XY Flow (React Flow)
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import {
    ReactFlow,
    Background,
    MiniMap,
    addEdge,
    reconnectEdge,
    useReactFlow,
    ConnectionLineType,
    ConnectionMode,
    type Connection,
    type OnConnect,
    type NodeMouseHandler,
    type EdgeMouseHandler,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './styles/xyflow.css';

import { nodeTypes } from './xyflow/nodes';
import { edgeTypes, EdgeMarkers } from './xyflow';
import { useXYFlowStore } from './xyflow/store';
import { SNAP_GRID, MIN_ZOOM, MAX_ZOOM, DEFAULT_VIEWPORT, Z_INDEX, STICKY_COLORS } from './xyflow/constants';
import type { StickyColor } from './xyflow/types';
import type { DiagramNode, DiagramEdge } from './xyflow/types';
import { DEFAULT_NODE_SIZE } from './xyflow/types';
import { NodeEditor } from './components/xyflow/NodeEditor';
import { EdgeEditor } from './components/xyflow/EdgeEditor';
import { EdgeStylePanel } from './components/xyflow/EdgeStylePanel';
import { QuickPicker } from './components/xyflow/QuickPicker';
import { ContextMenu, type ContextMenuType } from './components/xyflow/ContextMenu';
import { RadialMenu, type RadialMenuContext } from './components/xyflow/RadialMenu';
import { SmartGuides } from './components/xyflow/SmartGuides';
import { FloatingToolbar } from './components/xyflow/FloatingToolbar';
import { type OnConnectStartParams, Position } from '@xyflow/react';
import { useNodeEdit } from './hooks/useNodeEdit';
import { useEdgeEdit } from './hooks/useEdgeEdit';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSmartGuides } from './hooks/useSmartGuides';
import { useSmartConnection } from './hooks/useSmartConnection';
import { applyDagreLayout } from './utils/auto-layout';
import { nanoid } from 'nanoid';

// =============================================================================
// Types
// =============================================================================

/** Arrow type configuration */
interface ArrowTypeConfig {
    id: string;
    sourceType: 'none' | 'arrow' | 'diamond' | 'circle';
    targetType: 'none' | 'arrow' | 'diamond' | 'circle';
    lineType: 'solid' | 'dashed' | 'dotted';
}

interface XYFlowBoardProps {
    /** Show file toolbar */
    showFileToolbar?: boolean;
    /** Show minimap */
    showMinimap?: boolean;
    /** Show controls */
    showControls?: boolean;
    /** Show background grid */
    showBackground?: boolean;
    /** Enable snap to grid */
    snapToGrid?: boolean;
    /** Dark mode */
    dark?: boolean;
    /** Default arrow type for new connections */
    defaultArrowType?: ArrowTypeConfig;
    /** Callback when diagram changes */
    onChange?: (nodes: DiagramNode[], edges: DiagramEdge[]) => void;
    /** Show edge style panel when edge is selected */
    showEdgeStylePanel?: boolean;
    /** Enable smart guides for alignment */
    enableSmartGuides?: boolean;
}

/** Context menu state */
interface ContextMenuState {
    x: number;
    y: number;
    type: ContextMenuType;
    targetId?: string;
}

/** Radial menu state */
interface RadialMenuState {
    x: number;
    y: number;
    context: RadialMenuContext;
    targetNodeId?: string;
}

/** Quick picker state for predictive connections */
interface QuickPickerState {
    x: number;
    y: number;
    sourceNodeId: string;
    sourceHandleId: string | null;
}



// =============================================================================
// Inner Component (needs ReactFlowProvider context)
// =============================================================================

function XYFlowBoardInner({
    showMinimap = true,
    showBackground = true,
    snapToGrid = true,
    dark = false,
    defaultArrowType,
    onChange,
    showEdgeStylePanel = true,
    enableSmartGuides = true,
}: XYFlowBoardProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition, fitView } = useReactFlow();

    // Context menu state
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // Radial menu state
    const [radialMenu, setRadialMenu] = useState<RadialMenuState | null>(null);

    // Quick picker state
    const [quickPicker, setQuickPicker] = useState<QuickPickerState | null>(null);
    const connectionStartInfo = useRef<OnConnectStartParams | null>(null);

    // Selected edge for style panel
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

    // Space key for panning
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Store
    const nodes = useXYFlowStore((s) => s.nodes);
    const edges = useXYFlowStore((s) => s.edges);
    const setNodes = useXYFlowStore((s) => s.setNodes);
    const setEdges = useXYFlowStore((s) => s.setEdges);
    const onNodesChange = useXYFlowStore((s) => s.onNodesChange);
    const onEdgesChange = useXYFlowStore((s) => s.onEdgesChange);
    const addNode = useXYFlowStore((s) => s.addNode);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    // Clipboard and selection actions from store
    const copySelected = useXYFlowStore((s) => s.copySelected);
    const pasteClipboard = useXYFlowStore((s) => s.pasteClipboard);
    const cutSelected = useXYFlowStore((s) => s.cutSelected);
    const selectAll = useXYFlowStore((s) => s.selectAll);
    const duplicateSelected = useXYFlowStore((s) => s.duplicateSelected);
    const deleteSelected = useXYFlowStore((s) => s.deleteSelected);
    const clearSelection = useXYFlowStore((s) => s.clearSelection);
    const undo = useXYFlowStore((s) => s.undo);
    const redo = useXYFlowStore((s) => s.redo);
    const clipboard = useXYFlowStore((s) => s.clipboard);

    // Node editing
    const { editingNode, startEditing, saveEdit, cancelEdit } = useNodeEdit();

    // Edge editing
    const {
        editingEdge,
        startEditing: startEdgeEditing,
        saveEdit: saveEdgeEdit,
        cancelEdit: cancelEdgeEdit,
    } = useEdgeEdit();

    // Space key for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only activate if not typing in an input/textarea
            if (e.code === 'Space' && !editingNode && !editingEdge &&
                !(document.activeElement instanceof HTMLInputElement) &&
                !(document.activeElement instanceof HTMLTextAreaElement)) {
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [editingNode, editingEdge]);

    // Smart guides for alignment
    const { guides, calculateGuides, clearGuides } = useSmartGuides({
        threshold: 8,
        snapEnabled: enableSmartGuides,
        guidesEnabled: enableSmartGuides,
    });

    // Smart connection for sequential linking
    const { connectSequential } = useSmartConnection();

    // Move selected nodes with arrow keys
    const handleMoveNodes = useCallback((dx: number, dy: number) => {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length === 0) return;

        setNodes(nodes.map(n =>
            n.selected
                ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
                : n
        ));
    }, [nodes, setNodes]);

    // Auto-layout using dagre
    const handleAutoLayout = useCallback(() => {
        const { nodes: newNodes } = applyDagreLayout(nodes, edges, { direction: 'TB' });
        setNodes(newNodes);
        pushHistory('Auto-layout');
    }, [nodes, edges, setNodes, pushHistory]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onCopy: copySelected,
        onPaste: pasteClipboard,
        onCut: cutSelected,
        onSelectAll: selectAll,
        onDuplicate: duplicateSelected,
        onDelete: deleteSelected,
        onEscape: () => {
            // Close radial menu first, then context menu, then clear selection
            if (radialMenu) {
                setRadialMenu(null);
            } else if (contextMenu) {
                setContextMenu(null);
            } else {
                clearSelection();
                // Also deselect nodes in ReactFlow
                setNodes(nodes.map((n) => ({ ...n, selected: false })));
            }
        },
        onUndo: undo,
        onRedo: redo,
        onMoveNodes: handleMoveNodes,
        onConnectSequential: connectSequential,
        onAutoLayout: handleAutoLayout,
        enabled: !editingNode && !editingEdge, // Disable shortcuts when editing node/edge text
    });

    // Close context menu handler
    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Close radial menu handler
    const closeRadialMenu = useCallback(() => {
        setRadialMenu(null);
    }, []);

    // Listen for radialMenuEdit event from RadialMenu
    useEffect(() => {
        const handleRadialMenuEdit = (event: CustomEvent<{ nodeId: string }>) => {
            startEditing(event.detail.nodeId);
        };

        window.addEventListener('radialMenuEdit', handleRadialMenuEdit as EventListener);
        return () => {
            window.removeEventListener('radialMenuEdit', handleRadialMenuEdit as EventListener);
        };
    }, [startEditing]);

    // Listen for quickAdd event from nodes
    useEffect(() => {
        const handleQuickAdd = (event: CustomEvent<{ nodeId: string, position: Position }>) => {
            const { nodeId, position } = event.detail;

            // Get node element to find its screen position
            const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
            if (!nodeElement) return;

            const rect = nodeElement.getBoundingClientRect();
            const OFFSET = 120; // Distance from node for the picker

            let x = rect.left + rect.width / 2;
            let y = rect.top + rect.height / 2;

            // Offset the picker in the direction of the handle
            if (position === Position.Top) y = rect.top - OFFSET;
            else if (position === Position.Bottom) y = rect.bottom + OFFSET;
            else if (position === Position.Left) x = rect.left - OFFSET;
            else if (position === Position.Right) x = rect.right + OFFSET;

            setQuickPicker({
                x,
                y,
                sourceNodeId: nodeId,
                sourceHandleId: position,
            });
        };

        window.addEventListener('quickAdd' as any, handleQuickAdd as any);
        return () => {
            window.removeEventListener('quickAdd' as any, handleQuickAdd as any);
        };
    }, []);

    // Notify parent of changes
    useEffect(() => {
        onChange?.(nodes, edges);
    }, [nodes, edges, onChange]);

    // Track selected edge for style panel
    useEffect(() => {
        const selectedEdge = edges.find(e => e.selected);
        setSelectedEdgeId(selectedEdge?.id ?? null);
    }, [edges]);

    // Handle edge reconnection
    const onReconnect = useCallback(
        (oldEdge: DiagramEdge, newConnection: Connection) => {
            pushHistory(`Reconnect edge: ${oldEdge.id}`);
            setEdges(reconnectEdge(oldEdge as any, newConnection, edges as any) as any);
        },
        [edges, setEdges, pushHistory]
    );

    // Handle new connections
    const onConnectStart = useCallback((_event: any, params: OnConnectStartParams) => {
        connectionStartInfo.current = params;
    }, []);

    const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
        if (!connectionStartInfo.current) return;

        // Check if dropped on pane (not on a node/handle)
        const target = event.target as Element;
        const isPane = target.classList.contains('react-flow__pane');

        if (isPane) {
            const { clientX, clientY } = 'clientX' in event ? event : (event as TouchEvent).touches[0];

            setQuickPicker({
                x: clientX,
                y: clientY,
                sourceNodeId: connectionStartInfo.current.nodeId!,
                sourceHandleId: connectionStartInfo.current.handleId,
            });
        }

        connectionStartInfo.current = null;
    }, []);

    const onConnect: OnConnect = useCallback(
        (connection: Connection) => {
            // Determine markers based on arrow type (just ID, XY Flow adds url(#...) wrapper)
            let markerStart: string | undefined;
            let markerEnd: string | undefined;
            let strokeDasharray: string | undefined;

            if (defaultArrowType) {
                // Source marker
                if (defaultArrowType.sourceType === 'arrow') markerStart = 'arrow-start';
                else if (defaultArrowType.sourceType === 'diamond') markerStart = 'diamond-start';
                else if (defaultArrowType.sourceType === 'circle') markerStart = 'circle-start';

                // Target marker
                if (defaultArrowType.targetType === 'arrow') markerEnd = 'arrow';
                else if (defaultArrowType.targetType === 'diamond') markerEnd = 'diamond';
                else if (defaultArrowType.targetType === 'circle') markerEnd = 'circle';

                // Line style
                if (defaultArrowType.lineType === 'dashed') strokeDasharray = '8,4';
                else if (defaultArrowType.lineType === 'dotted') strokeDasharray = '2,2';
            } else {
                markerEnd = 'arrow';
            }

            const newEdge: DiagramEdge = {
                id: `edge-${nanoid(8)}`,
                source: connection.source!,
                target: connection.target!,
                sourceHandle: connection.sourceHandle,
                targetHandle: connection.targetHandle,
                type: 'arrow',
                data: {
                    routeType: 'smoothstep',
                    lineType: defaultArrowType?.lineType || 'solid',
                    sourceHead: defaultArrowType?.sourceType || 'none',
                    targetHead: defaultArrowType?.targetType || 'arrow',
                },
                style: {
                    strokeDasharray,
                    stroke: '#1e293b', // Default color
                },
                markerStart: markerStart,
                markerEnd: markerEnd,
            };
            setEdges(addEdge(newEdge, edges));
        },
        [edges, setEdges, defaultArrowType]
    );

    // Handle double-click on node to edit
    const onNodeDoubleClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            startEditing(node.id);
        },
        [startEditing]
    );

    // Handle double-click on edge to edit label
    const onEdgeDoubleClick: EdgeMouseHandler = useCallback(
        (event, edge) => {
            // Use click position for editor placement
            startEdgeEditing(edge.id, { x: event.clientX, y: event.clientY });
        },
        [startEdgeEditing]
    );

    // Context menu handlers - use RadialMenu for pane and node, ContextMenu for edge
    const onNodeContextMenu: NodeMouseHandler = useCallback(
        (event, node) => {
            event.preventDefault();
            // Close any existing menus
            setContextMenu(null);
            // Show radial menu for node
            setRadialMenu({
                x: event.clientX,
                y: event.clientY,
                context: 'node',
                targetNodeId: node.id,
            });
        },
        []
    );

    const onEdgeContextMenu: EdgeMouseHandler = useCallback(
        (event, edge) => {
            event.preventDefault();
            // Close radial menu if open
            setRadialMenu(null);
            // Show context menu for edge (radial menu not suitable for edge actions)
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                type: 'edge',
                targetId: edge.id,
            });
        },
        []
    );

    const onPaneContextMenu = useCallback(
        (event: MouseEvent | React.MouseEvent) => {
            event.preventDefault();
            // Close any existing menus
            setContextMenu(null);
            // Show radial menu for pane (empty canvas)
            setRadialMenu({
                x: event.clientX,
                y: event.clientY,
                context: 'pane',
            });
        },
        []
    );

    // Close context menu on pane click
    const onPaneClick = useCallback(() => {
        if (contextMenu) {
            setContextMenu(null);
        }
        if (radialMenu) {
            setRadialMenu(null);
        }
        if (quickPicker) {
            setQuickPicker(null);
        }
    }, [contextMenu, radialMenu, quickPicker]);

    const onQuickPickerSelect = useCallback((type: DiagramNode['type']) => {
        if (!quickPicker) return;

        const { x, y, sourceNodeId, sourceHandleId } = quickPicker;
        const sourceNode = nodes.find(n => n.id === sourceNodeId);
        const position = screenToFlowPosition({ x, y });
        const defaultSize = (DEFAULT_NODE_SIZE as any)[type] || { width: 150, height: 80 };

        // Inherit style from source node
        const sourceStyle = sourceNode?.style || {};
        const inheritedStyle = {
            ...sourceStyle,
            width: defaultSize.width,
            height: defaultSize.height,
        };

        const newNode: DiagramNode = {
            id: `node-${nanoid(8)}`,
            type,
            position: {
                x: position.x - defaultSize.width / 2,
                y: position.y - defaultSize.height / 2,
            },
            data: {
                ...sourceNode?.data, // Inherit data (like color keys)
                label: '',
                width: defaultSize.width,
                height: defaultSize.height,
            },
            style: inheritedStyle as React.CSSProperties
        };

        addNode(newNode);

        // Determine markers based on defaultArrowType (just ID, XY Flow adds url(#...) wrapper)
        let markerEnd: string | undefined = 'arrow';
        let strokeDasharray: string | undefined;

        if (defaultArrowType) {
            if (defaultArrowType.targetType === 'arrow') markerEnd = 'arrow';
            else if (defaultArrowType.targetType === 'diamond') markerEnd = 'diamond';
            else if (defaultArrowType.targetType === 'circle') markerEnd = 'circle';
            else if (defaultArrowType.targetType === 'none') markerEnd = undefined;

            if (defaultArrowType.lineType === 'dashed') strokeDasharray = '8,4';
            else if (defaultArrowType.lineType === 'dotted') strokeDasharray = '2,2';
        }

        // Create connection
        const newEdge: DiagramEdge = {
            id: `edge-${nanoid(8)}`,
            source: sourceNodeId,
            target: newNode.id,
            sourceHandle: sourceHandleId,
            targetHandle: sourceHandleId === Position.Top ? Position.Bottom :
                sourceHandleId === Position.Bottom ? Position.Top :
                    sourceHandleId === Position.Left ? Position.Right :
                        Position.Left,
            type: 'arrow',
            data: {
                routeType: 'smoothstep',
                lineType: defaultArrowType?.lineType || 'solid',
                sourceHead: defaultArrowType?.sourceType || 'none',
                targetHead: defaultArrowType?.targetType || 'arrow',
            },
            style: {
                strokeDasharray,
                stroke: '#1e293b',
            },
            markerEnd,
        };
        setEdges(addEdge(newEdge, edges));

        setQuickPicker(null);

        // Start editing the new node label immediately
        setTimeout(() => startEditing(newNode.id), 100);
    }, [quickPicker, screenToFlowPosition, addNode, setEdges, edges, defaultArrowType, startEditing]);

    // Handle node drag for smart guides
    const onNodeDrag = useCallback(
        (_event: React.MouseEvent, node: DiagramNode) => {
            if (!enableSmartGuides) return;
            calculateGuides(node.id, node.position, nodes);
        },
        [enableSmartGuides, calculateGuides, nodes]
    );

    // Save state before drag starts
    const onNodeDragStart = useCallback(
        (event: React.MouseEvent) => {
            if (event.altKey) {
                pushHistory('Duplicate on drag');
                duplicateSelected();
            } else {
                pushHistory('Move node');
            }
        },
        [pushHistory, duplicateSelected]
    );

    // Clear guides when drag ends
    const onNodeDragStop = useCallback(
        () => {
            clearGuides();
        },
        [clearGuides]
    );

    // Handle drop from toolbar
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/xyflow-node-type') as DiagramNode['type'];
            if (!type) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Use default size for the shape
            const defaultSize = (DEFAULT_NODE_SIZE as any)[type] || { width: 180, height: 100 };

            // Format label: capitalize and remove hyphens
            const label = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');

            const newNode: DiagramNode = {
                id: `node-${nanoid(8)}`,
                type,
                position: {
                    x: position.x - defaultSize.width / 2,
                    y: position.y - defaultSize.height / 2,
                },
                data: {
                    label,
                    width: defaultSize.width,
                    height: defaultSize.height,
                },
                // Set initial size in style for React Flow v12
                style: {
                    width: defaultSize.width,
                    height: defaultSize.height,
                }
            };

            addNode(newNode);
        },
        [screenToFlowPosition, addNode]
    );

    // Memoize node and edge types - cast to any to avoid strict type checking
    // XY Flow v12 has stricter types that don't match our custom node data
    const memoizedNodeTypes = useMemo(() => nodeTypes as any, []);
    const memoizedEdgeTypes = useMemo(() => edgeTypes as any, []);

    // Zoom to Fit handler
    const onZoomToFit = useCallback(() => {
        fitView({ padding: 0.2, duration: 800 });
    }, [fitView]);

    return (
        <div
            ref={reactFlowWrapper}
            className={`xyflow-board-container ${dark ? 'dark' : ''}`}
            style={{ width: '100%', height: '100%', position: 'relative' }}
        >
            <ReactFlow
                nodes={nodes as any}
                edges={edges as any}
                onNodesChange={onNodesChange as any}
                onEdgesChange={onEdgesChange as any}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onReconnect={onReconnect as any}
                onNodeDoubleClick={onNodeDoubleClick}
                onEdgeDoubleClick={onEdgeDoubleClick}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                onPaneContextMenu={onPaneContextMenu}
                onPaneClick={onPaneClick}
                onNodeDragStart={onNodeDragStart}
                onNodeDrag={onNodeDrag as any}
                onNodeDragStop={onNodeDragStop}
                onDragOver={onDragOver}
                onDrop={onDrop}
                nodeTypes={memoizedNodeTypes}
                edgeTypes={memoizedEdgeTypes}
                snapToGrid={snapToGrid}
                snapGrid={SNAP_GRID}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                defaultViewport={DEFAULT_VIEWPORT}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                deleteKeyCode={['Delete', 'Backspace']}
                multiSelectionKeyCode="Shift"
                selectionOnDrag={!isSpacePressed}
                panOnDrag={isSpacePressed ? [1] : [1, 2]}
                selectNodesOnDrag={false}
                connectionLineType={ConnectionLineType.SmoothStep}
                connectionLineStyle={{
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    strokeDasharray: '5,5',
                }}
                connectionMode={ConnectionMode.Loose}
                zoomOnDoubleClick={false}
                zoomOnScroll={true}
                panOnScroll={false}
                edgesFocusable={true}
                elementsSelectable={true}
                defaultEdgeOptions={{
                    type: 'arrow',
                }}
            >
                <EdgeMarkers />
                {showBackground && (
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                        color="rgba(0,0,0,0.1)"
                    />
                )}
                {/* Custom controls are in App.tsx */}
                {/* {showControls && <Controls />} */}
                {showMinimap && (
                    <MiniMap
                        nodeStrokeWidth={3}
                        zoomable
                        pannable
                        className="!bg-white/80 dark:!bg-slate-900/80 !backdrop-blur-md !border-gray-200 dark:!border-gray-800 !rounded-xl !shadow-2xl !m-4"
                        maskColor={dark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}
                    />
                )}

                <div className="xyflow-controls-custom">
                    <button
                        className="zoom-to-fit-button"
                        onClick={onZoomToFit}
                        title="Zoom to Fit"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                    </button>
                </div>
            </ReactFlow>

            {/* Smart alignment guides */}
            {enableSmartGuides && guides.length > 0 && (
                <SmartGuides guides={guides} isDark={dark} />
            )}

            {/* UI Overlays */}
            <div className="xyflow-overlays" style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
                {editingNode && (
                    <div style={{ pointerEvents: 'auto' }}>
                        <NodeEditor
                            nodeId={editingNode.nodeId}
                            initialValue={editingNode.initialValue}
                            position={editingNode.position}
                            dimensions={(editingNode as any).dimensions}
                            multiline={editingNode.multiline}
                            isDark={dark}
                            customStyle={(() => {
                                if (editingNode.nodeType === 'sticky') {
                                    const colorKey = (editingNode.data?.stickyColor as StickyColor) || 'yellow';
                                    const backgroundColor = STICKY_COLORS[colorKey] ?? STICKY_COLORS.yellow;
                                    return {
                                        backgroundColor,
                                        border: '2px solid #3b82f6',
                                        borderRadius: '4px',
                                        padding: '12px',
                                        fontSize: '14px',
                                        textAlign: 'center',
                                        minWidth: '150px',
                                        minHeight: '100px',
                                        color: '#333',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                    };
                                }
                                if (editingNode.nodeType === 'text') {
                                    return {
                                        backgroundColor: 'transparent',
                                        border: '1px dashed #3b82f6',
                                        padding: '4px',
                                        textAlign: 'center',
                                        boxShadow: 'none',
                                        borderRadius: '0',
                                    };
                                }
                                return {};
                            })()}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                        />
                    </div>
                )}
            </div>

            {/* Edge label editor overlay */}
            {editingEdge && (
                <EdgeEditor
                    edgeId={editingEdge.edgeId}
                    initialValue={editingEdge.initialValue}
                    position={editingEdge.position}
                    onSave={saveEdgeEdit}
                    onCancel={cancelEdgeEdit}
                />
            )}

            {/* Context menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    type={contextMenu.type}
                    targetId={contextMenu.targetId}
                    onClose={closeContextMenu}
                    dark={dark}
                />
            )}

            {/* Radial menu for pane and node context */}
            {radialMenu && (
                <RadialMenu
                    x={radialMenu.x}
                    y={radialMenu.y}
                    context={radialMenu.context}
                    targetNodeId={radialMenu.targetNodeId}
                    onClose={closeRadialMenu}
                    isDark={dark}
                    hasSelection={nodes.some((n) => n.selected)}
                    hasClipboard={clipboard !== null && clipboard.nodes.length > 0}
                />
            )}

            {/* Quick Picker for predictive connections */}
            {quickPicker && (
                <div className="xyflow-overlays" style={{ pointerEvents: 'none' }}>
                    <div style={{ pointerEvents: 'auto' }}>
                        <QuickPicker
                            x={quickPicker.x}
                            y={quickPicker.y}
                            onSelect={onQuickPickerSelect}
                            onClose={() => setQuickPicker(null)}
                            isDark={dark}
                        />
                    </div>
                </div>
            )}

            {/* Edge style panel - shows when edge is selected */}
            {showEdgeStylePanel && selectedEdgeId && (
                <div style={{
                    position: 'absolute',
                    bottom: '6rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: Z_INDEX.EDGE_STYLE_PANEL,
                }}>
                    <EdgeStylePanel
                        edgeId={selectedEdgeId}
                        isDark={dark}
                        onClose={() => setSelectedEdgeId(null)}
                    />
                </div>
            )}

            {/* Floating toolbar for selected nodes */}
            <FloatingToolbar isDark={dark} />
        </div>
    );
}

// =============================================================================
// Main Component (Provider is in App.tsx)
// =============================================================================

export function XYFlowBoard(props: XYFlowBoardProps) {
    return <XYFlowBoardInner {...props} />;
}

export default XYFlowBoard;
