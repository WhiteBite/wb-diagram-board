/**
 * Test data fixtures and factories
 * @module __tests__/fixtures
 */

import { nanoid } from 'nanoid';

/**
 * Canvas element type
 */
export type ElementType = 'rectangle' | 'ellipse' | 'line' | 'text' | 'connector';

/**
 * Canvas element
 */
export interface CanvasElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    opacity?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    locked?: boolean;
    hidden?: boolean;
}

/**
 * Connector element
 */
export interface Connector {
    id: string;
    fromId: string;
    toId: string;
    fromPort?: string;
    toPort?: string;
    points?: Array<{ x: number; y: number }>;
    strokeColor?: string;
    strokeWidth?: number;
    lineType?: 'solid' | 'dashed' | 'dotted';
    arrowType?: 'none' | 'single' | 'double';
}

/**
 * Diagram
 */
export interface Diagram {
    id: string;
    name: string;
    elements: CanvasElement[];
    connectors: Connector[];
    metadata?: Record<string, unknown>;
}

/**
 * Test positions
 */
export const TEST_POSITIONS = {
    TOP_LEFT: { x: 50, y: 50 },
    TOP_CENTER: { x: 400, y: 50 },
    TOP_RIGHT: { x: 750, y: 50 },
    CENTER_LEFT: { x: 50, y: 300 },
    CENTER: { x: 400, y: 300 },
    CENTER_RIGHT: { x: 750, y: 300 },
    BOTTOM_LEFT: { x: 50, y: 550 },
    BOTTOM_CENTER: { x: 400, y: 550 },
    BOTTOM_RIGHT: { x: 750, y: 550 },
} as const;

/**
 * Test sizes
 */
export const TEST_SIZES = {
    SMALL: { width: 60, height: 40 },
    MEDIUM: { width: 120, height: 80 },
    LARGE: { width: 200, height: 150 },
    EXTRA_LARGE: { width: 300, height: 200 },
} as const;

/**
 * Test colors
 */
export const TEST_COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    RED: '#FF0000',
    GREEN: '#00FF00',
    BLUE: '#0000FF',
    YELLOW: '#FFFF00',
    CYAN: '#00FFFF',
    MAGENTA: '#FF00FF',
    GRAY: '#808080',
    LIGHT_GRAY: '#D3D3D3',
} as const;

/**
 * Test stroke widths
 */
export const TEST_STROKE_WIDTHS = {
    THIN: 1,
    NORMAL: 2,
    THICK: 4,
    EXTRA_THICK: 8,
} as const;

/**
 * Create a rectangle element
 * @param overrides - Property overrides
 * @returns Rectangle element
 */
export function createRectangle(
    overrides?: Partial<CanvasElement>
): CanvasElement {
    return {
        id: nanoid(),
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        fillColor: TEST_COLORS.WHITE,
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        opacity: 1,
        ...overrides,
    };
}

/**
 * Create an ellipse element
 * @param overrides - Property overrides
 * @returns Ellipse element
 */
export function createEllipse(
    overrides?: Partial<CanvasElement>
): CanvasElement {
    return {
        id: nanoid(),
        type: 'ellipse',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        fillColor: TEST_COLORS.WHITE,
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        opacity: 1,
        ...overrides,
    };
}

/**
 * Create a line element
 * @param overrides - Property overrides
 * @returns Line element
 */
export function createLine(
    overrides?: Partial<CanvasElement>
): CanvasElement {
    return {
        id: nanoid(),
        type: 'line',
        x: 100,
        y: 100,
        width: 200,
        height: 0,
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        opacity: 1,
        ...overrides,
    };
}

/**
 * Create a text element
 * @param overrides - Property overrides
 * @returns Text element
 */
export function createText(
    overrides?: Partial<CanvasElement>
): CanvasElement {
    return {
        id: nanoid(),
        type: 'text',
        x: 100,
        y: 100,
        width: 150,
        height: 40,
        text: 'Sample Text',
        fontSize: 16,
        fontFamily: 'Arial',
        fillColor: TEST_COLORS.BLACK,
        opacity: 1,
        ...overrides,
    };
}

/**
 * Create a connector
 * @param fromId - Source element ID
 * @param toId - Target element ID
 * @param overrides - Property overrides
 * @returns Connector
 */
export function createConnector(
    fromId: string,
    toId: string,
    overrides?: Partial<Connector>
): Connector {
    return {
        id: nanoid(),
        fromId,
        toId,
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        lineType: 'solid',
        arrowType: 'single',
        ...overrides,
    };
}

/**
 * Create a diagram with elements
 * @param elementCount - Number of elements to create
 * @param connectorCount - Number of connectors to create
 * @returns Diagram
 */
export function createDiagram(
    elementCount: number = 5,
    connectorCount: number = 3
): Diagram {
    const elements: CanvasElement[] = [];
    const connectors: Connector[] = [];

    // Create elements
    for (let i = 0; i < elementCount; i++) {
        const position = Object.values(TEST_POSITIONS)[i % Object.values(TEST_POSITIONS).length];
        const size = Object.values(TEST_SIZES)[i % Object.values(TEST_SIZES).length];

        elements.push(
            createRectangle({
                id: `element-${i}`,
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
            })
        );
    }

    // Create connectors
    for (let i = 0; i < connectorCount && i < elementCount - 1; i++) {
        connectors.push(
            createConnector(elements[i].id, elements[i + 1].id, {
                id: `connector-${i}`,
            })
        );
    }

    return {
        id: nanoid(),
        name: 'Test Diagram',
        elements,
        connectors,
    };
}

/**
 * Create a complex diagram with various element types
 * @returns Diagram with mixed element types
 */
export function createComplexDiagram(): Diagram {
    const elements: CanvasElement[] = [
        createRectangle({
            id: 'rect-1',
            x: 100,
            y: 100,
            width: 120,
            height: 80,
            fillColor: TEST_COLORS.BLUE,
        }),
        createEllipse({
            id: 'ellipse-1',
            x: 300,
            y: 100,
            width: 100,
            height: 100,
            fillColor: TEST_COLORS.RED,
        }),
        createText({
            id: 'text-1',
            x: 100,
            y: 250,
            width: 200,
            height: 40,
            text: 'Complex Diagram',
            fontSize: 18,
        }),
        createRectangle({
            id: 'rect-2',
            x: 100,
            y: 350,
            width: 120,
            height: 80,
            fillColor: TEST_COLORS.GREEN,
        }),
        createEllipse({
            id: 'ellipse-2',
            x: 300,
            y: 350,
            width: 100,
            height: 100,
            fillColor: TEST_COLORS.YELLOW,
        }),
    ];

    const connectors: Connector[] = [
        createConnector('rect-1', 'ellipse-1', { id: 'conn-1' }),
        createConnector('ellipse-1', 'text-1', { id: 'conn-2' }),
        createConnector('text-1', 'rect-2', { id: 'conn-3' }),
        createConnector('rect-2', 'ellipse-2', { id: 'conn-4' }),
    ];

    return {
        id: nanoid(),
        name: 'Complex Diagram',
        elements,
        connectors,
    };
}

/**
 * Create a large diagram for performance testing
 * @param elementCount - Number of elements
 * @returns Large diagram
 */
export function createLargeDiagram(elementCount: number = 1000): Diagram {
    const elements: CanvasElement[] = [];
    const connectors: Connector[] = [];

    // Create grid of elements
    const gridSize = Math.ceil(Math.sqrt(elementCount));
    const spacing = 150;

    for (let i = 0; i < elementCount; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        elements.push(
            createRectangle({
                id: `element-${i}`,
                x: col * spacing,
                y: row * spacing,
                width: 100,
                height: 60,
            })
        );
    }

    // Create connectors between adjacent elements
    for (let i = 0; i < elementCount - 1; i++) {
        if ((i + 1) % gridSize !== 0) {
            connectors.push(
                createConnector(elements[i].id, elements[i + 1].id, {
                    id: `connector-${i}`,
                })
            );
        }
    }

    return {
        id: nanoid(),
        name: 'Large Diagram',
        elements,
        connectors,
    };
}

/**
 * Create a diagram with deeply nested elements
 * @param depth - Nesting depth
 * @returns Nested diagram
 */
export function createNestedDiagram(depth: number = 5): Diagram {
    const elements: CanvasElement[] = [];
    const connectors: Connector[] = [];

    for (let i = 0; i < depth; i++) {
        elements.push(
            createRectangle({
                id: `element-${i}`,
                x: i * 150,
                y: 100,
                width: 120,
                height: 80,
            })
        );

        if (i > 0) {
            connectors.push(
                createConnector(elements[i - 1].id, elements[i].id, {
                    id: `connector-${i - 1}`,
                })
            );
        }
    }

    return {
        id: nanoid(),
        name: 'Nested Diagram',
        elements,
        connectors,
    };
}

/**
 * Create a diagram with all element types
 * @returns Diagram with all types
 */
export function createAllElementTypesDiagram(): Diagram {
    return {
        id: nanoid(),
        name: 'All Element Types',
        elements: [
            createRectangle({ id: 'rect', x: 50, y: 50 }),
            createEllipse({ id: 'ellipse', x: 250, y: 50 }),
            createLine({ id: 'line', x: 450, y: 50 }),
            createText({ id: 'text', x: 50, y: 200 }),
        ],
        connectors: [
            createConnector('rect', 'ellipse', { id: 'conn-1' }),
            createConnector('ellipse', 'line', { id: 'conn-2' }),
            createConnector('line', 'text', { id: 'conn-3' }),
        ],
    };
}

/**
 * Create sample diagrams for testing
 */
export const SAMPLE_DIAGRAMS = {
    simple: createDiagram(3, 2),
    complex: createComplexDiagram(),
    large: createLargeDiagram(100),
    nested: createNestedDiagram(5),
    allTypes: createAllElementTypesDiagram(),
} as const;

/**
 * Create sample elements for testing
 */
export const SAMPLE_ELEMENTS = {
    rectangle: createRectangle(),
    ellipse: createEllipse(),
    line: createLine(),
    text: createText(),
} as const;

/**
 * Create sample connectors for testing
 */
export const SAMPLE_CONNECTORS = {
    simple: createConnector(SAMPLE_ELEMENTS.rectangle.id, SAMPLE_ELEMENTS.ellipse.id),
    dashed: createConnector(SAMPLE_ELEMENTS.ellipse.id, SAMPLE_ELEMENTS.text.id, {
        lineType: 'dashed',
    }),
    dotted: createConnector(SAMPLE_ELEMENTS.text.id, SAMPLE_ELEMENTS.rectangle.id, {
        lineType: 'dotted',
    }),
} as const;

export { };
