/**
 * Test Fixtures - Reusable test data and configurations
 * 
 * Provides constants and factory functions for test data
 * Production-quality fixtures for E2E testing
 */

import { Point } from '../pages/CanvasComponent';
import { ToolType } from '../pages/ToolbarComponent';

// =============================================================================
// Position Constants
// =============================================================================

export const POSITIONS = {
    CENTER: { x: 400, y: 300 },
    TOP_LEFT: { x: 100, y: 100 },
    TOP_CENTER: { x: 400, y: 100 },
    TOP_RIGHT: { x: 700, y: 100 },
    MIDDLE_LEFT: { x: 100, y: 300 },
    MIDDLE_RIGHT: { x: 700, y: 300 },
    BOTTOM_LEFT: { x: 100, y: 500 },
    BOTTOM_CENTER: { x: 400, y: 500 },
    BOTTOM_RIGHT: { x: 700, y: 500 },
    // Additional positions for complex layouts
    QUADRANT_1: { x: 600, y: 150 },
    QUADRANT_2: { x: 200, y: 150 },
    QUADRANT_3: { x: 200, y: 450 },
    QUADRANT_4: { x: 600, y: 450 },
} as const;

// =============================================================================
// Size Constants
// =============================================================================

export const SIZES = {
    TINY: { width: 40, height: 30 },
    SMALL: { width: 80, height: 60 },
    MEDIUM: { width: 120, height: 80 },
    LARGE: { width: 200, height: 150 },
    EXTRA_LARGE: { width: 300, height: 200 },
} as const;

// =============================================================================
// Color Constants
// =============================================================================

export const COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    RED: '#FF0000',
    GREEN: '#00FF00',
    BLUE: '#0000FF',
    YELLOW: '#FFFF00',
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF',
    ORANGE: '#FFA500',
    PURPLE: '#800080',
    GRAY: '#808080',
    LIGHT_GRAY: '#D3D3D3',
    DARK_GRAY: '#404040',
} as const;

// =============================================================================
// Stroke Width Constants
// =============================================================================

export const STROKE_WIDTHS = {
    HAIRLINE: 0.5,
    THIN: 1,
    NORMAL: 2,
    MEDIUM: 3,
    THICK: 4,
    EXTRA_THICK: 8,
} as const;

// =============================================================================
// Timing Constants
// =============================================================================

export const TIMING = {
    SHORT_WAIT: 50,
    MEDIUM_WAIT: 100,
    LONG_WAIT: 300,
    ANIMATION_WAIT: 500,
    LOAD_WAIT: 1000,
    SAVE_WAIT: 500,
} as const;

// =============================================================================
// Performance Thresholds
// =============================================================================

export const PERFORMANCE_THRESHOLDS = {
    ELEMENT_CREATE_MS: 100,
    ELEMENT_SELECT_MS: 50,
    ELEMENT_MOVE_MS: 50,
    ELEMENT_DELETE_MS: 50,
    UNDO_REDO_MS: 100,
    SAVE_MS: 500,
    LOAD_MS: 1000,
    EXPORT_PNG_MS: 2000,
    EXPORT_SVG_MS: 1000,
    EXPORT_JSON_MS: 500,
    RENDER_100_ELEMENTS_MS: 3000,
    PAN_ZOOM_MS: 50,
} as const;

// =============================================================================
// Test Shape Configurations
// =============================================================================

export interface ShapeFixture {
    type: ToolType;
    from: Point;
    to: Point;
    name: string;
}

export const SHAPE_FIXTURES: ShapeFixture[] = [
    {
        type: 'rectangle',
        from: { x: 100, y: 100 },
        to: { x: 220, y: 180 },
        name: 'Rectangle 1',
    },
    {
        type: 'ellipse',
        from: { x: 250, y: 100 },
        to: { x: 370, y: 180 },
        name: 'Ellipse 1',
    },
    {
        type: 'diamond',
        from: { x: 400, y: 100 },
        to: { x: 520, y: 180 },
        name: 'Diamond 1',
    },
];

// =============================================================================
// Flowchart Fixtures
// =============================================================================

export interface FlowchartNode {
    type: ToolType;
    position: Point;
    size: { width: number; height: number };
    label?: string;
}

export const FLOWCHART_FIXTURES: FlowchartNode[] = [
    {
        type: 'ellipse',
        position: { x: 300, y: 50 },
        size: { width: 100, height: 50 },
        label: 'Start',
    },
    {
        type: 'rectangle',
        position: { x: 275, y: 150 },
        size: { width: 150, height: 60 },
        label: 'Process 1',
    },
    {
        type: 'diamond',
        position: { x: 290, y: 260 },
        size: { width: 120, height: 80 },
        label: 'Decision',
    },
    {
        type: 'rectangle',
        position: { x: 150, y: 380 },
        size: { width: 120, height: 60 },
        label: 'Process 2A',
    },
    {
        type: 'rectangle',
        position: { x: 430, y: 380 },
        size: { width: 120, height: 60 },
        label: 'Process 2B',
    },
    {
        type: 'ellipse',
        position: { x: 300, y: 500 },
        size: { width: 100, height: 50 },
        label: 'End',
    },
];

// =============================================================================
// Document Fixtures
// =============================================================================

export interface DocumentFixture {
    name: string;
    description?: string;
    shapes: ShapeFixture[];
}

export const DOCUMENT_FIXTURES: DocumentFixture[] = [
    {
        name: 'Simple Diagram',
        description: 'A simple diagram with basic shapes',
        shapes: SHAPE_FIXTURES.slice(0, 2),
    },
    {
        name: 'Complex Diagram',
        description: 'A more complex diagram with multiple shapes',
        shapes: SHAPE_FIXTURES,
    },
];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a grid of positions
 */
export function createPositionGrid(
    startX: number,
    startY: number,
    cols: number,
    rows: number,
    spacingX: number,
    spacingY: number
): Point[] {
    const positions: Point[] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            positions.push({
                x: startX + col * spacingX,
                y: startY + row * spacingY,
            });
        }
    }

    return positions;
}

/**
 * Create random positions within bounds
 */
export function createRandomPositions(
    count: number,
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
): Point[] {
    const positions: Point[] = [];

    for (let i = 0; i < count; i++) {
        positions.push({
            x: minX + Math.random() * (maxX - minX),
            y: minY + Math.random() * (maxY - minY),
        });
    }

    return positions;
}

/**
 * Create shape fixtures for a row
 */
export function createShapeRow(
    types: ToolType[],
    startX: number,
    y: number,
    spacing: number,
    size: { width: number; height: number }
): ShapeFixture[] {
    return types.map((type, index) => ({
        type,
        from: { x: startX + index * spacing, y },
        to: { x: startX + index * spacing + size.width, y: y + size.height },
        name: `${type}-${index}`,
    }));
}

/**
 * Generate unique document name
 */
export function generateDocumentName(prefix: string = 'Test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create test element data
 */
export function createTestElement(
    type: ToolType,
    x: number,
    y: number,
    width: number,
    height: number,
    overrides?: Record<string, unknown>
): Record<string, unknown> {
    return {
        id: `test-${type}-${Date.now()}`,
        type,
        x,
        y,
        width,
        height,
        strokeColor: COLORS.BLACK,
        fillColor: COLORS.WHITE,
        strokeWidth: STROKE_WIDTHS.NORMAL,
        ...overrides,
    };
}

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

export const SHORTCUTS = {
    UNDO: 'Control+z',
    REDO: 'Control+y',
    REDO_ALT: 'Control+Shift+z',
    COPY: 'Control+c',
    PASTE: 'Control+v',
    CUT: 'Control+x',
    DUPLICATE: 'Control+d',
    SELECT_ALL: 'Control+a',
    DELETE: 'Delete',
    DELETE_ALT: 'Backspace',
    GROUP: 'Control+g',
    UNGROUP: 'Control+Shift+g',
    BRING_FRONT: 'Control+]',
    SEND_BACK: 'Control+[',
    SAVE: 'Control+s',
    EXPORT: 'Control+Shift+e',
    ZOOM_IN: 'Control+=',
    ZOOM_OUT: 'Control+-',
    ZOOM_FIT: 'Control+1',
    ZOOM_100: 'Control+0',
    ESCAPE: 'Escape',
} as const;

// =============================================================================
// Test Scenarios
// =============================================================================

export interface TestScenario {
    name: string;
    description: string;
    setup: () => ShapeFixture[];
    expectedElementCount: number;
}

export const TEST_SCENARIOS: TestScenario[] = [
    {
        name: 'empty-canvas',
        description: 'Empty canvas with no elements',
        setup: () => [],
        expectedElementCount: 0,
    },
    {
        name: 'single-rectangle',
        description: 'Single rectangle in center',
        setup: () => [{
            type: 'rectangle' as ToolType,
            from: POSITIONS.CENTER,
            to: { x: POSITIONS.CENTER.x + 120, y: POSITIONS.CENTER.y + 80 },
            name: 'Single Rectangle',
        }],
        expectedElementCount: 1,
    },
    {
        name: 'basic-flowchart',
        description: 'Simple flowchart with 4 nodes',
        setup: () => FLOWCHART_FIXTURES.slice(0, 4).map((node, i) => ({
            type: node.type,
            from: node.position,
            to: { x: node.position.x + node.size.width, y: node.position.y + node.size.height },
            name: node.label || `Node ${i}`,
        })),
        expectedElementCount: 4,
    },
];

// =============================================================================
// Retry Configuration
// =============================================================================

export const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 100,
    timeout: 30000,
} as const;

// =============================================================================
// Viewport Sizes
// =============================================================================

export const VIEWPORTS = {
    DESKTOP: { width: 1920, height: 1080 },
    LAPTOP: { width: 1366, height: 768 },
    TABLET: { width: 1024, height: 768 },
    MOBILE: { width: 375, height: 667 },
} as const;

// =============================================================================
// Export Formats
// =============================================================================

export const EXPORT_FORMATS = {
    PNG: { extension: '.png', mimeType: 'image/png' },
    SVG: { extension: '.svg', mimeType: 'image/svg+xml' },
    JSON: { extension: '.json', mimeType: 'application/json' },
    PDF: { extension: '.pdf', mimeType: 'application/pdf' },
} as const;

// =============================================================================
// Element Type Configurations
// =============================================================================

export const ELEMENT_CONFIGS: Record<ToolType, { minSize: { width: number; height: number }; defaultSize: { width: number; height: number } }> = {
    select: { minSize: { width: 0, height: 0 }, defaultSize: { width: 0, height: 0 } },
    rectangle: { minSize: { width: 20, height: 20 }, defaultSize: { width: 120, height: 80 } },
    ellipse: { minSize: { width: 20, height: 20 }, defaultSize: { width: 100, height: 80 } },
    diamond: { minSize: { width: 30, height: 30 }, defaultSize: { width: 100, height: 100 } },
    triangle: { minSize: { width: 20, height: 20 }, defaultSize: { width: 100, height: 80 } },
    line: { minSize: { width: 10, height: 0 }, defaultSize: { width: 100, height: 0 } },
    arrow: { minSize: { width: 10, height: 0 }, defaultSize: { width: 100, height: 0 } },
    connector: { minSize: { width: 10, height: 0 }, defaultSize: { width: 100, height: 0 } },
    text: { minSize: { width: 50, height: 20 }, defaultSize: { width: 150, height: 30 } },
    sticky: { minSize: { width: 100, height: 100 }, defaultSize: { width: 200, height: 200 } },
    frame: { minSize: { width: 100, height: 100 }, defaultSize: { width: 400, height: 300 } },
    pen: { minSize: { width: 0, height: 0 }, defaultSize: { width: 0, height: 0 } },
    freedraw: { minSize: { width: 0, height: 0 }, defaultSize: { width: 0, height: 0 } },
    eraser: { minSize: { width: 0, height: 0 }, defaultSize: { width: 0, height: 0 } },
    hand: { minSize: { width: 0, height: 0 }, defaultSize: { width: 0, height: 0 } },
};
