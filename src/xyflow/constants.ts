// Размеры по умолчанию
export const DEFAULT_NODE_WIDTH = 180;
export const DEFAULT_NODE_HEIGHT = 100;

// Цвета по умолчанию
export const DEFAULT_FILL = '#ffffff';
export const DEFAULT_STROKE = '#1e293b';
export const DEFAULT_STROKE_WIDTH = 2;

// Sticky note цвета
export const STICKY_COLORS = {
    yellow: '#fff9c4',
    green: '#c8e6c9',
    blue: '#bbdefb',
    pink: '#f8bbd9',
    purple: '#e1bee7',
    orange: '#ffe0b2',
} as const;

// Grid
export const GRID_SIZE = 20;
export const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE];

// Persistence
export const XYFLOW_PERSISTENCE_KEY = 'wb-diagram-board-xyflow';

// Viewport
export const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

// History
export const HISTORY_MAX_SIZE = 50;

// Z-Index hierarchy for UI layers
export const Z_INDEX = {
    // Canvas elements
    NODES: 10,
    EDGES: 5,

    // UI overlays
    MINIMAP: 20,
    CONTROLS: 20,
    TOOLBAR: 100,

    // Panels and menus
    EDGE_STYLE_PANEL: 150,
    CONTEXT_MENU: 200,

    // Modal overlays
    NODE_EDITOR_OVERLAY: 1000,
    NODE_EDITOR_INPUT: 1001,
} as const;
