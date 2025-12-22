/**
 * Rough.js renderer utility for hand-drawn style elements
 */

import rough from 'roughjs';
import type { RoughSVG } from 'roughjs/bin/svg';
import type { Options } from 'roughjs/bin/core';
import { ShapeElement, LineElement, ArrowElement, FreedrawElement, StrokeStyle, FillStyle } from '../types/canvas';

// Rough.js options based on element styles
export function getRoughOptions(stroke: StrokeStyle, fill: FillStyle, seed?: number): Options {
    const options: Options = {
        seed: seed || Math.floor(Math.random() * 2 ** 31),
        roughness: 1.2,
        bowing: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fillStyle: fill.type === 'hachure' ? 'hachure' : fill.type === 'solid' ? 'solid' : undefined,
        fill: fill.type !== 'none' ? fill.color : undefined,
        hachureAngle: -41,
        hachureGap: 6,
        fillWeight: stroke.width * 0.5,
    };

    // Dashed/dotted lines
    if (stroke.style === 'dashed') {
        options.strokeLineDash = [8, 4];
    } else if (stroke.style === 'dotted') {
        options.strokeLineDash = [2, 4];
    }

    return options;
}

// Generate SVG path data for rough shapes
export function generateRoughShapeSVG(
    element: ShapeElement,
    rc: RoughSVG
): SVGGElement {
    const { x, y, width, height, stroke, fill, cornerRadius } = element;
    const options = getRoughOptions(stroke, fill, element.id.charCodeAt(0) * 1000);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    let node: SVGGElement;

    switch (element.type) {
        case 'rectangle':
            if (cornerRadius > 0) {
                // Rounded rectangle - approximate with path
                node = rc.path(
                    `M ${x + cornerRadius} ${y} 
                     L ${x + width - cornerRadius} ${y} 
                     Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
                     L ${x + width} ${y + height - cornerRadius}
                     Q ${x + width} ${y + height} ${x + width - cornerRadius} ${y + height}
                     L ${x + cornerRadius} ${y + height}
                     Q ${x} ${y + height} ${x} ${y + height - cornerRadius}
                     L ${x} ${y + cornerRadius}
                     Q ${x} ${y} ${x + cornerRadius} ${y}
                     Z`,
                    options
                );
            } else {
                node = rc.rectangle(x, y, width, height, options);
            }
            break;

        case 'ellipse':
            node = rc.ellipse(x + width / 2, y + height / 2, width, height, options);
            break;

        case 'diamond':
            node = rc.polygon([
                [x + width / 2, y],
                [x + width, y + height / 2],
                [x + width / 2, y + height],
                [x, y + height / 2],
            ], options);
            break;

        case 'triangle':
            node = rc.polygon([
                [x + width / 2, y],
                [x + width, y + height],
                [x, y + height],
            ], options);
            break;

        default:
            node = rc.rectangle(x, y, width, height, options);
    }

    g.appendChild(node);
    return g;
}

// Generate rough line
export function generateRoughLineSVG(
    element: LineElement | ArrowElement,
    rc: RoughSVG
): SVGGElement {
    const { x, y, points, stroke } = element;
    const options = getRoughOptions(stroke, { type: 'none', color: '' }, element.id.charCodeAt(0) * 1000);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (points.length >= 2) {
        const x1 = x + points[0].x;
        const y1 = y + points[0].y;
        const x2 = x + points[1].x;
        const y2 = y + points[1].y;

        const line = rc.line(x1, y1, x2, y2, options);
        g.appendChild(line);

        // Arrow heads for ArrowElement
        if (element.type === 'arrow') {
            const arrowElement = element as ArrowElement;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowLength = Math.max(16, stroke.width * 6);
            const arrowAngle = Math.PI / 7;

            if (arrowElement.endArrow === 'arrow') {
                const ax1 = x2 - arrowLength * Math.cos(angle - arrowAngle);
                const ay1 = y2 - arrowLength * Math.sin(angle - arrowAngle);
                const ax2 = x2 - arrowLength * Math.cos(angle + arrowAngle);
                const ay2 = y2 - arrowLength * Math.sin(angle + arrowAngle);

                const arrowHead = rc.polygon([
                    [x2, y2],
                    [ax1, ay1],
                    [ax2, ay2],
                ], { ...options, fill: stroke.color, fillStyle: 'solid' });
                g.appendChild(arrowHead);
            }

            if (arrowElement.startArrow === 'arrow') {
                const reverseAngle = angle + Math.PI;
                const ax1 = x1 - arrowLength * Math.cos(reverseAngle - arrowAngle);
                const ay1 = y1 - arrowLength * Math.sin(reverseAngle - arrowAngle);
                const ax2 = x1 - arrowLength * Math.cos(reverseAngle + arrowAngle);
                const ay2 = y1 - arrowLength * Math.sin(reverseAngle + arrowAngle);

                const arrowHead = rc.polygon([
                    [x1, y1],
                    [ax1, ay1],
                    [ax2, ay2],
                ], { ...options, fill: stroke.color, fillStyle: 'solid' });
                g.appendChild(arrowHead);
            }
        }
    }

    return g;
}

// Generate rough freedraw path
export function generateRoughFreedrawSVG(
    element: FreedrawElement,
    rc: RoughSVG
): SVGGElement {
    const { x, y, points, stroke } = element;
    const options = getRoughOptions(stroke, { type: 'none', color: '' }, element.id.charCodeAt(0) * 1000);
    options.roughness = 0.5; // Less rough for freedraw

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    if (points.length >= 2) {
        // Create path from points
        let pathData = `M ${x + points[0].x} ${y + points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${x + points[i].x} ${y + points[i].y}`;
        }

        const path = rc.path(pathData, { ...options, fill: undefined });
        g.appendChild(path);
    }

    return g;
}

// Create rough SVG instance
export function createRoughSVG(svg: SVGSVGElement): RoughSVG {
    return rough.svg(svg);
}
