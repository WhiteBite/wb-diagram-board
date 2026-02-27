import { CanvasElement } from '../core/types';

/**
 * Test data fixtures for e2e tests
 */

export const TEST_POSITIONS = {
    CENTER: { x: 400, y: 300 },
    TOP_LEFT: { x: 100, y: 100 },
    TOP_RIGHT: { x: 700, y: 100 },
    BOTTOM_LEFT: { x: 100, y: 500 },
    BOTTOM_RIGHT: { x: 700, y: 500 },
} as const;

export const TEST_SIZES = {
    SMALL: { width: 80, height: 60 },
    MEDIUM: { width: 120, height: 80 },
    LARGE: { width: 200, height: 150 },
} as const;

export const TEST_COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    RED: '#FF0000',
    GREEN: '#00FF00',
    BLUE: '#0000FF',
    YELLOW: '#FFFF00',
} as const;

export const TEST_STROKE_WIDTHS = {
    THIN: 1,
    NORMAL: 2,
    THICK: 4,
    EXTRA_THICK: 8,
} as const;

/**
 * Creates a mock rectangle element for testing
 */
export function createMockRectangle(overrides?: Partial<CanvasElement>): CanvasElement {
    return {
        id: 'test-rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        fillColor: TEST_COLORS.WHITE,
        ...overrides,
    };
}

/**
 * Creates a mock ellipse element for testing
 */
export function createMockEllipse(overrides?: Partial<CanvasElement>): CanvasElement {
    return {
        id: 'test-ellipse-1',
        type: 'ellipse',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        fillColor: TEST_COLORS.WHITE,
        ...overrides,
    };
}

/**
 * Creates a mock line element for testing
 */
export function createMockLine(overrides?: Partial<CanvasElement>): CanvasElement {
    return {
        id: 'test-line-1',
        type: 'line',
        x: 100,
        y: 100,
        width: 200,
        height: 0,
        points: [
            { x: 0, y: 0 },
            { x: 200, y: 0 },
        ],
        strokeColor: TEST_COLORS.BLACK,
        strokeWidth: TEST_STROKE_WIDTHS.NORMAL,
        ...overrides,
    };
}

/**
 * Creates a mock text element for testing
 */
export function createMockText(overrides?: Partial<CanvasElement>): CanvasElement {
    return {
        id: 'test-text-1',
        type: 'text',
        x: 100,
        y: 100,
        width: 150,
        height: 40,
        text: 'Test Text',
        fontSize: 16,
        fontFamily: 'Arial',
        textAlign: 'left',
        ...overrides,
    };
}
