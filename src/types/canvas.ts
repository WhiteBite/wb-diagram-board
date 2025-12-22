/**
 * WB Canvas - Core Types
 * 
 * Type definitions for the collaborative whiteboard
 */

import { nanoid } from 'nanoid';

// =============================================================================
// Base Types
// =============================================================================

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Transform {
    x: number;
    y: number;
    scale: number;
}

// =============================================================================
// Element Types
// =============================================================================

export type ElementType =
    | 'rectangle'
    | 'ellipse'
    | 'diamond'
    | 'triangle'
    | 'line'
    | 'arrow'
    | 'freedraw'
    | 'text'
    | 'image'
    | 'frame'
    | 'sticky'
    | 'connector';

export interface BaseElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    locked: boolean;
    groupId?: string;
    zIndex: number;
    createdAt: number;
    updatedAt: number;
}

export interface StrokeStyle {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
}

export interface FillStyle {
    type: 'solid' | 'hachure' | 'cross-hatch' | 'none';
    color: string;
}

export interface TextStyle {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right';
    verticalAlign: 'top' | 'middle' | 'bottom';
    color: string;
    lineHeight: number;
}

// Shape elements (rectangle, ellipse, diamond, triangle)
export interface ShapeElement extends BaseElement {
    type: 'rectangle' | 'ellipse' | 'diamond' | 'triangle';
    stroke: StrokeStyle;
    fill: FillStyle;
    cornerRadius: number;
    text?: string;
    textStyle?: TextStyle;
}

// Line element
export interface LineElement extends BaseElement {
    type: 'line';
    points: Point[];
    stroke: StrokeStyle;
    startArrow: ArrowHead;
    endArrow: ArrowHead;
}

// Arrow element (smart connector)
export interface ArrowElement extends BaseElement {
    type: 'arrow';
    points: Point[];
    stroke: StrokeStyle;
    startArrow: ArrowHead;
    endArrow: ArrowHead;
    startBinding?: Binding;
    endBinding?: Binding;
    label?: string;
    labelStyle?: TextStyle;
}

export type ArrowHead = 'none' | 'arrow' | 'triangle' | 'diamond' | 'circle' | 'bar';

export interface Binding {
    elementId: string;
    focus: number; // -1 to 1, position on element edge
    gap: number;
}

// Freedraw element
export interface FreedrawElement extends BaseElement {
    type: 'freedraw';
    points: Point[];
    stroke: StrokeStyle;
    simulatePressure: boolean;
}

// Text element
export interface TextElement extends BaseElement {
    type: 'text';
    text: string;
    textStyle: TextStyle;
}

// Image element
export interface ImageElement extends BaseElement {
    type: 'image';
    src: string; // base64 or URL
    naturalWidth: number;
    naturalHeight: number;
    crop?: { x: number; y: number; width: number; height: number };
}

// Frame element (container)
export interface FrameElement extends BaseElement {
    type: 'frame';
    name: string;
    stroke: StrokeStyle;
    fill: FillStyle;
    childIds: string[];
    clip: boolean;
}

// Sticky note
export interface StickyElement extends BaseElement {
    type: 'sticky';
    text: string;
    textStyle: TextStyle;
    color: StickyColor;
}

export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

// Connector (auto-routing arrow)
export interface ConnectorElement extends BaseElement {
    type: 'connector';
    stroke: StrokeStyle;
    startArrow: ArrowHead;
    endArrow: ArrowHead;
    startBinding?: Binding;
    endBinding?: Binding;
    routeType: 'straight' | 'elbow' | 'curved';
    waypoints: Point[];
    label?: string;
    labelStyle?: TextStyle;
}

// Union type for all elements
export type CanvasElement =
    | ShapeElement
    | LineElement
    | ArrowElement
    | FreedrawElement
    | TextElement
    | ImageElement
    | FrameElement
    | StickyElement
    | ConnectorElement;

// =============================================================================
// Tool Types
// =============================================================================

export type Tool =
    | 'select'
    | 'hand'
    | 'rectangle'
    | 'ellipse'
    | 'diamond'
    | 'triangle'
    | 'line'
    | 'arrow'
    | 'freedraw'
    | 'text'
    | 'sticky'
    | 'frame'
    | 'connector'
    | 'eraser'
    | 'laser';

// =============================================================================
// Selection Types
// =============================================================================

export interface Selection {
    elementIds: string[];
    bounds: Bounds | null;
}

export type ResizeHandle =
    | 'nw' | 'n' | 'ne'
    | 'w' | 'e'
    | 'sw' | 's' | 'se'
    | 'rotation';

// =============================================================================
// History Types
// =============================================================================

export interface HistoryEntry {
    id: string;
    timestamp: number;
    type: 'add' | 'update' | 'delete' | 'batch';
    elementIds: string[];
    before: Record<string, CanvasElement | null>;
    after: Record<string, CanvasElement | null>;
}

// =============================================================================
// Canvas State
// =============================================================================

export interface CanvasState {
    // Elements
    elements: Record<string, CanvasElement>;
    elementOrder: string[]; // z-order

    // View
    transform: Transform;
    gridEnabled: boolean;
    snapToGrid: boolean;
    gridSize: number;

    // Selection
    selectedIds: string[];
    hoveredId: string | null;

    // Tool
    activeTool: Tool;

    // Styles (for new elements)
    currentStroke: StrokeStyle;
    currentFill: FillStyle;
    currentTextStyle: TextStyle;

    // Render style
    roughStyle: boolean; // true = hand-drawn, false = clean
    darkMode: boolean;

    // History
    history: HistoryEntry[];
    historyIndex: number;

    // UI State
    isDrawing: boolean;
    isPanning: boolean;
    isResizing: boolean;
    resizeHandle: ResizeHandle | null;

    // Clipboard
    clipboard: CanvasElement[];
}

// =============================================================================
// Factory Functions
// =============================================================================

export function createId(): string {
    return nanoid(10);
}

export function createBaseElement(type: ElementType, x: number, y: number): BaseElement {
    const now = Date.now();
    return {
        id: createId(),
        type,
        x,
        y,
        width: 0,
        height: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: now,
        createdAt: now,
        updatedAt: now,
    };
}

export const DEFAULT_STROKE: StrokeStyle = {
    color: '#e5e7eb', // Light color for dark mode canvas
    width: 2,
    style: 'solid',
};

export const DEFAULT_FILL: FillStyle = {
    type: 'solid',
    color: '#ffffff',
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
    fontSize: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    verticalAlign: 'middle',
    color: '#1e1e1e',
    lineHeight: 1.4,
};

export const STICKY_COLORS: Record<StickyColor, string> = {
    yellow: '#fff9c4',
    green: '#c8e6c9',
    blue: '#bbdefb',
    pink: '#f8bbd9',
    purple: '#e1bee7',
    orange: '#ffe0b2',
};
