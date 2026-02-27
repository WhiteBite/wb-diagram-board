/**
 * Excalidraw to WB Canvas Converter
 * 
 * Converts Excalidraw format to our canvas format
 */

import { CanvasElement, ShapeElement, LineElement, ArrowElement, TextElement, createId } from '../types/canvas';

interface ExcalidrawElement {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    angle?: number;
    strokeColor?: string;
    backgroundColor?: string;
    fillStyle?: string;
    strokeWidth?: number;
    strokeStyle?: string;
    opacity?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: string;
    verticalAlign?: string;
    points?: Array<[number, number]>;
    startArrowhead?: string | null;
    endArrowhead?: string | null;
    startBinding?: { elementId: string } | null;
    endBinding?: { elementId: string } | null;
}

interface ExcalidrawData {
    type: 'excalidraw';
    version: number;
    elements: ExcalidrawElement[];
}

/**
 * Convert Excalidraw data to WB Canvas format
 */
export function convertExcalidrawToCanvas(data: ExcalidrawData): Record<string, CanvasElement> {
    const elements: Record<string, CanvasElement> = {};
    const now = Date.now();

    data.elements.forEach((excalidrawEl, index) => {
        const canvasEl = convertElement(excalidrawEl, index, now);
        if (canvasEl) {
            elements[canvasEl.id] = canvasEl;
        }
    });

    return elements;
}

function convertElement(el: ExcalidrawElement, index: number, timestamp: number): CanvasElement | null {
    const baseProps = {
        id: el.id || createId(),
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        rotation: (el.angle || 0) * (180 / Math.PI), // Convert radians to degrees
        opacity: el.opacity ?? 1,
        locked: false,
        zIndex: index,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    // Shape elements
    if (['rectangle', 'ellipse', 'diamond'].includes(el.type)) {
        return {
            ...baseProps,
            type: el.type as 'rectangle' | 'ellipse' | 'diamond',
            stroke: {
                color: el.strokeColor || '#000000',
                width: el.strokeWidth || 1,
                style: mapStrokeStyle(el.strokeStyle),
            },
            fill: {
                type: mapFillStyle(el.fillStyle),
                color: el.backgroundColor || 'transparent',
            },
            cornerRadius: 0,
            text: el.text,
            textStyle: el.text ? {
                fontSize: el.fontSize || 16,
                fontFamily: mapFontFamily(el.fontFamily),
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: (el.textAlign as any) || 'center',
                verticalAlign: (el.verticalAlign as any) || 'middle',
                color: el.strokeColor || '#000000',
                lineHeight: 1.2,
            } : undefined,
        } as ShapeElement;
    }

    // Line elements
    if (el.type === 'line' && el.points) {
        const points = el.points.map(([x, y]) => ({ x, y }));

        // Check if it has arrowheads
        const hasArrowheads = el.startArrowhead || el.endArrowhead;

        if (hasArrowheads) {
            return {
                ...baseProps,
                type: 'arrow',
                points,
                stroke: {
                    color: el.strokeColor || '#000000',
                    width: el.strokeWidth || 1,
                    style: mapStrokeStyle(el.strokeStyle),
                },
                startArrow: mapArrowHead(el.startArrowhead),
                endArrow: mapArrowHead(el.endArrowhead),
                startBinding: el.startBinding ? {
                    elementId: el.startBinding.elementId,
                    focus: 0,
                    gap: 0,
                } : undefined,
                endBinding: el.endBinding ? {
                    elementId: el.endBinding.elementId,
                    focus: 0,
                    gap: 0,
                } : undefined,
            } as ArrowElement;
        } else {
            return {
                ...baseProps,
                type: 'line',
                points,
                stroke: {
                    color: el.strokeColor || '#000000',
                    width: el.strokeWidth || 1,
                    style: mapStrokeStyle(el.strokeStyle),
                },
                startArrow: 'none',
                endArrow: 'none',
            } as LineElement;
        }
    }

    // Arrow elements
    if (el.type === 'arrow' && el.points) {
        const points = el.points.map(([x, y]) => ({ x, y }));

        return {
            ...baseProps,
            type: 'arrow',
            points,
            stroke: {
                color: el.strokeColor || '#000000',
                width: el.strokeWidth || 1,
                style: mapStrokeStyle(el.strokeStyle),
            },
            startArrow: mapArrowHead(el.startArrowhead),
            endArrow: mapArrowHead(el.endArrowhead),
            startBinding: el.startBinding ? {
                elementId: el.startBinding.elementId,
                focus: 0,
                gap: 0,
            } : undefined,
            endBinding: el.endBinding ? {
                elementId: el.endBinding.elementId,
                focus: 0,
                gap: 0,
            } : undefined,
        } as ArrowElement;
    }

    // Text elements
    if (el.type === 'text' && el.text) {
        return {
            ...baseProps,
            type: 'text',
            text: el.text,
            textStyle: {
                fontSize: el.fontSize || 16,
                fontFamily: mapFontFamily(el.fontFamily),
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: (el.textAlign as any) || 'left',
                verticalAlign: 'top',
                color: el.strokeColor || '#000000',
                lineHeight: 1.2,
            },
        } as TextElement;
    }

    // Unsupported element type
    return null;
}

function mapStrokeStyle(style?: string): 'solid' | 'dashed' | 'dotted' {
    if (style === 'dashed') return 'dashed';
    if (style === 'dotted') return 'dotted';
    return 'solid';
}

function mapFillStyle(style?: string): 'solid' | 'hachure' | 'cross-hatch' | 'none' {
    if (style === 'hachure') return 'hachure';
    if (style === 'cross-hatch') return 'cross-hatch';
    if (style === 'solid') return 'solid';
    return 'none';
}

function mapFontFamily(family?: string): string {
    // Excalidraw uses: 1 = Virgil, 2 = Helvetica, 3 = Cascadia
    if (family === '1') return 'Virgil, sans-serif';
    if (family === '2') return 'Helvetica, Arial, sans-serif';
    if (family === '3') return 'Cascadia, monospace';
    return family || 'sans-serif';
}

function mapArrowHead(arrowhead?: string | null): 'none' | 'arrow' | 'triangle' | 'diamond' | 'circle' | 'bar' {
    if (!arrowhead) return 'none';
    if (arrowhead === 'arrow') return 'arrow';
    if (arrowhead === 'triangle') return 'triangle';
    if (arrowhead === 'diamond') return 'diamond';
    if (arrowhead === 'dot') return 'circle';
    if (arrowhead === 'bar') return 'bar';
    return 'arrow'; // default
}
