/**
 * XY Flow Types
 *
 * Type definitions for XY Flow (React Flow) integration
 */

import type { Node, Edge } from '@xyflow/react';

// =============================================================================
// Node Types
// =============================================================================

export type DiagramNodeType =
    | 'rectangle'
    | 'rounded-rectangle'
    | 'ellipse'
    | 'circle'
    | 'diamond'
    | 'hexagon'
    | 'parallelogram'
    | 'trapezoid'
    | 'cylinder'
    | 'document'
    | 'cloud'
    | 'actor'
    | 'note'
    | 'text'
    | 'sticky'
    | 'swimlane'
    | 'group'
    | 'table'
    | 'checklist'
    | 'code'
    | 'image';

// =============================================================================
// Sticky Colors
// =============================================================================

export type StickyColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

// Note: STICKY_COLORS constant is defined in constants.ts

// =============================================================================
// Node Data
// =============================================================================

export interface NodeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
    [key: string]: unknown;
}

export interface TextStyle {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    [key: string]: unknown;
}

/**
 * Node data interface with index signature for XY Flow v12 compatibility
 */
export interface DiagramNodeData {
    label: string;
    style?: NodeStyle;
    textStyle?: TextStyle;
    width?: number;
    height?: number;
    // Icon support (Lucide icon name)
    icon?: string;
    iconPosition?: 'left' | 'right' | 'top' | 'bottom';
    iconSize?: number;
    iconColor?: string;
    // Sticky-specific
    stickyColor?: StickyColor;
    // Swimlane-specific
    swimlaneTitle?: string;
    swimlaneOrientation?: 'horizontal' | 'vertical';
    // Group-specific
    isCollapsed?: boolean;
    // Table-specific
    tableColumns?: TableColumn[];
    tableRows?: TableRow[];
    // Checklist-specific
    checklistItems?: ChecklistItem[];
    // Code-specific
    codeContent?: string;
    codeLanguage?: string;
    // Dynamic ports
    customPorts?: CustomPort[];
    // Index signature for XY Flow compatibility
    [key: string]: unknown;
}

/**
 * Table column definition
 */
export interface TableColumn {
    id: string;
    header: string;
    width?: number;
}

/**
 * Table row definition
 */
export interface TableRow {
    id: string;
    cells: Record<string, string>;
}

/**
 * Checklist item definition
 */
export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

/**
 * Custom port definition for dynamic handles
 */
export interface CustomPort {
    id: string;
    position: 'top' | 'right' | 'bottom' | 'left';
    offset: number; // 0-100 percentage along the edge
    label?: string;
}

/**
 * Typed node for XY Flow
 * Uses generic Node type with our custom data
 */
export type DiagramNode = Node<DiagramNodeData, DiagramNodeType>;

// =============================================================================
// Edge Types
// =============================================================================

export type DiagramEdgeType = 'arrow' | 'connector';

export type RouteType = 'straight' | 'step' | 'smoothstep' | 'bezier';

export interface EdgeStyle {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    [key: string]: unknown;
}

export interface DiagramEdgeData {
    label?: string;
    routeType?: RouteType;
    animated?: boolean;
    style?: EdgeStyle;
    [key: string]: unknown;
}

/**
 * Typed edge for XY Flow
 */
export type DiagramEdge = Edge<DiagramEdgeData>;

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_NODE_STYLE: NodeStyle = {
    fill: 'var(--element-fill, #ffffff)',
    stroke: 'var(--element-stroke, #1e293b)',
    strokeWidth: 2,
    cornerRadius: 4,
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 'normal',
    color: 'var(--theme-text, #1e1e1e)',
    textAlign: 'center',
};

export const DEFAULT_NODE_SIZE = {
    rectangle: { width: 180, height: 80 },
    'rounded-rectangle': { width: 180, height: 80 },
    ellipse: { width: 180, height: 90 },
    circle: { width: 140, height: 140 },
    diamond: { width: 160, height: 160 },
    hexagon: { width: 180, height: 100 },
    parallelogram: { width: 220, height: 80 },
    trapezoid: { width: 220, height: 80 },
    cylinder: { width: 160, height: 120 },
    document: { width: 160, height: 110 },
    cloud: { width: 220, height: 140 },
    actor: { width: 100, height: 150 },
    note: { width: 180, height: 120 },
    text: { width: 200, height: 50 },
    sticky: { width: 200, height: 180 },
    swimlane: { width: 450, height: 650 },
    group: { width: 450, height: 350 },
    table: { width: 350, height: 250 },
    checklist: { width: 250, height: 220 },
    code: { width: 380, height: 240 },
    image: { width: 200, height: 150 },
} as const;

/**
 * Minimum node sizes for NodeResizer constraints
 */
export const MIN_NODE_SIZE: Record<string, { width: number; height: number }> = {
    'rectangle': { width: 80, height: 40 },
    'ellipse': { width: 80, height: 60 },
    'diamond': { width: 80, height: 80 },
    'hexagon': { width: 100, height: 60 },
    'parallelogram': { width: 100, height: 50 },
    'trapezoid': { width: 100, height: 50 },
    'cylinder': { width: 80, height: 100 },
    'document': { width: 100, height: 80 },
    'cloud': { width: 120, height: 80 },
    'actor': { width: 60, height: 100 },
    'note': { width: 100, height: 80 },
    'circle': { width: 80, height: 80 },
    'rounded-rectangle': { width: 80, height: 40 },
    'text': { width: 100, height: 30 },
    'sticky': { width: 150, height: 100 },
    'swimlane': { width: 150, height: 200 },
    'group': { width: 200, height: 150 },
    'table': { width: 200, height: 120 },
    'checklist': { width: 180, height: 100 },
    'code': { width: 200, height: 100 },
    'image': { width: 50, height: 50 },
};
