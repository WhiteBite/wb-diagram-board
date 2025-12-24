/**
 * WB Canvas - Connector Renderer
 * 
 * Renders connector elements with rough.js styling
 * Supports multiple arrow types and line styles
 */

import { memo, useRef, useEffect, useMemo } from 'react';
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';
import { ConnectorElement, StrokeStyle, Point, ArrowHead } from '../../types/canvas';

interface ConnectorRendererProps {
    readonly element: ConnectorElement;
    readonly isSelected: boolean;
}

/**
 * Gets rough.js options from stroke style
 * 
 * @param stroke - Stroke style configuration
 * @param seed - Seed for consistent roughness
 * @returns Rough.js options object
 */
function getRoughOptions(stroke: StrokeStyle, seed: number): Options {
    const options: Options = {
        seed,
        roughness: 1.5,
        bowing: 1.2,
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fill: undefined,
        fillStyle: undefined,
        curveFitting: 0.95,
        curveStepCount: 9,
    };

    if (stroke.style === 'dashed') {
        options.strokeLineDash = [12, 6];
    } else if (stroke.style === 'dotted') {
        options.strokeLineDash = [3, 6];
    }

    return options;
}

/**
 * Calculates arrow head points for a given direction
 * 
 * @param to - End point of arrow
 * @param from - Start point of arrow (for direction)
 * @param arrowLength - Length of arrow head
 * @param arrowAngle - Angle of arrow head sides
 * @returns Array of points for arrow polygon
 */
function calculateArrowPoints(
    to: Point,
    from: Point,
    arrowLength: number,
    arrowAngle: number
): Point[] {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    const p1 = {
        x: to.x - arrowLength * Math.cos(angle - arrowAngle),
        y: to.y - arrowLength * Math.sin(angle - arrowAngle),
    };

    const p2 = {
        x: to.x - arrowLength * Math.cos(angle + arrowAngle),
        y: to.y - arrowLength * Math.sin(angle + arrowAngle),
    };

    return [to, p1, p2];
}

/**
 * Renders a connector element with rough.js
 * Memoized for performance optimization
 * 
 * Supports:
 * - Multiple arrow types (arrow, triangle, diamond, circle, bar)
 * - Line styles (solid, dashed, dotted)
 * - Selection highlighting
 * - Multi-waypoint paths
 */
export const ConnectorRenderer = memo(function ConnectorRenderer({
    element,
    isSelected,
}: ConnectorRendererProps) {
    const { x, y, waypoints, stroke, startArrow, endArrow, opacity, id } = element;
    const gRef = useRef<SVGGElement>(null);

    // Generate stable seed based on element ID
    const seed = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }, [id]);

    useEffect(() => {
        if (!gRef.current || waypoints.length < 2) return;

        // Clear previous content
        gRef.current.innerHTML = '';

        const svg = gRef.current.ownerSVGElement;
        if (!svg) return;

        try {
            const rc = rough.svg(svg);
            const options = getRoughOptions(stroke, seed);

            // Draw main connector line through all waypoints
            if (waypoints.length === 2) {
                // Simple two-point line
                const x1 = x + waypoints[0].x;
                const y1 = y + waypoints[0].y;
                const x2 = x + waypoints[1].x;
                const y2 = y + waypoints[1].y;

                const line = rc.line(x1, y1, x2, y2, options);
                gRef.current.appendChild(line);
            } else {
                // Multi-point path using line segments
                for (let i = 0; i < waypoints.length - 1; i++) {
                    const x1 = x + waypoints[i].x;
                    const y1 = y + waypoints[i].y;
                    const x2 = x + waypoints[i + 1].x;
                    const y2 = y + waypoints[i + 1].y;

                    const line = rc.line(x1, y1, x2, y2, options);
                    gRef.current.appendChild(line);
                }
            }

            // Draw arrow heads
            const arrowLength = Math.max(18, stroke.width * 7);
            const arrowAngle = Math.PI / 6;
            const arrowOptions = { ...options, fill: stroke.color, fillStyle: 'solid' as const };

            // End arrow
            if (endArrow !== 'none' && waypoints.length >= 2) {
                const n = waypoints.length;
                const endPoint = { x: x + waypoints[n - 1].x, y: y + waypoints[n - 1].y };
                const prevPoint = { x: x + waypoints[n - 2].x, y: y + waypoints[n - 2].y };

                renderArrowHead(rc, gRef.current, endPoint, prevPoint, endArrow, stroke.color, arrowLength, arrowAngle, arrowOptions);
            }

            // Start arrow
            if (startArrow !== 'none' && waypoints.length >= 2) {
                const startPoint = { x: x + waypoints[0].x, y: y + waypoints[0].y };
                const nextPoint = { x: x + waypoints[1].x, y: y + waypoints[1].y };

                renderArrowHead(rc, gRef.current, startPoint, nextPoint, startArrow, stroke.color, arrowLength, arrowAngle, arrowOptions);
            }

            // Selection highlight
            if (isSelected) {
                const selectionOptions: Options = {
                    ...options,
                    stroke: '#3b82f6',
                    strokeWidth: stroke.width + 2,
                    roughness: 0,
                };

                if (waypoints.length === 2) {
                    const x1 = x + waypoints[0].x;
                    const y1 = y + waypoints[0].y;
                    const x2 = x + waypoints[1].x;
                    const y2 = y + waypoints[1].y;

                    const selectionLine = rc.line(x1, y1, x2, y2, selectionOptions);
                    gRef.current.appendChild(selectionLine);
                } else {
                    for (let i = 0; i < waypoints.length - 1; i++) {
                        const x1 = x + waypoints[i].x;
                        const y1 = y + waypoints[i].y;
                        const x2 = x + waypoints[i + 1].x;
                        const y2 = y + waypoints[i + 1].y;

                        const selectionLine = rc.line(x1, y1, x2, y2, selectionOptions);
                        gRef.current.appendChild(selectionLine);
                    }
                }
            }
        } catch (error) {
            console.error('[ConnectorRenderer] Error rendering connector:', error);
        }
    }, [x, y, waypoints, stroke, startArrow, endArrow, isSelected, seed]);

    if (waypoints.length < 2) {
        return null;
    }

    return (
        <g
            ref={gRef}
            className="element-connector"
            data-element-id={id}
            opacity={opacity}
        />
    );
});

/**
 * Renders an arrow head at the specified point
 * 
 * @param rc - Rough.js instance
 * @param container - SVG container to append to
 * @param to - End point of arrow
 * @param from - Start point (for direction)
 * @param arrowType - Type of arrow head
 * @param color - Arrow color
 * @param arrowLength - Length of arrow
 * @param arrowAngle - Angle of arrow sides
 * @param options - Rough.js options
 */
function renderArrowHead(
    rc: ReturnType<typeof rough.svg>,
    container: SVGGElement,
    to: Point,
    from: Point,
    arrowType: ArrowHead,
    color: string,
    arrowLength: number,
    arrowAngle: number,
    options: Options
): void {
    try {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        switch (arrowType) {
            case 'arrow':
            case 'triangle': {
                const points = calculateArrowPoints(to, from, arrowLength, arrowAngle);
                const arrowHead = rc.polygon(
                    points.map(p => [p.x, p.y]) as [number, number][],
                    options
                );
                container.appendChild(arrowHead);
                break;
            }

            case 'circle': {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', String(to.x));
                circle.setAttribute('cy', String(to.y));
                circle.setAttribute('r', String(Math.max(4, arrowLength / 4)));
                circle.setAttribute('fill', color);
                circle.setAttribute('stroke', color);
                circle.setAttribute('stroke-width', '1');
                container.appendChild(circle);
                break;
            }

            case 'diamond': {
                const d = Math.max(6, arrowLength / 3);
                const points = [
                    [to.x, to.y - d],
                    [to.x + d, to.y],
                    [to.x, to.y + d],
                    [to.x - d, to.y],
                ] as [number, number][];
                const diamond = rc.polygon(points, options);
                container.appendChild(diamond);
                break;
            }

            case 'bar': {
                const barLength = Math.max(8, arrowLength / 2);
                const perpAngle = angle + Math.PI / 2;
                const x1 = to.x - (barLength / 2) * Math.cos(perpAngle);
                const y1 = to.y - (barLength / 2) * Math.sin(perpAngle);
                const x2 = to.x + (barLength / 2) * Math.cos(perpAngle);
                const y2 = to.y + (barLength / 2) * Math.sin(perpAngle);

                const bar = rc.line(x1, y1, x2, y2, { ...options, strokeWidth: options.strokeWidth ? options.strokeWidth * 2 : 2 });
                container.appendChild(bar);
                break;
            }

            case 'none':
            default:
                // No arrow head
                break;
        }
    } catch (error) {
        console.error('[renderArrowHead] Error rendering arrow head:', error);
    }
}
