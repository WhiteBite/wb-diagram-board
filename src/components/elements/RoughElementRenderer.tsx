/**
 * WB Canvas - Rough Element Renderer
 * 
 * Renders canvas elements with hand-drawn style using rough.js
 */

import { memo, useRef, useEffect, useMemo } from 'react';
import rough from 'roughjs';
import type { Options } from 'roughjs/bin/core';
import {
    CanvasElement,
    ShapeElement,
    LineElement,
    ArrowElement,
    TextElement,
    StickyElement,
    FreedrawElement,
    StrokeStyle,
    FillStyle,
    STICKY_COLORS
} from '../../types/canvas';

interface RoughElementRendererProps {
    element: CanvasElement;
    isSelected: boolean;
}

// Get rough.js options from element styles
function getRoughOptions(stroke: StrokeStyle, fill: FillStyle, seed: number): Options {
    const options: Options = {
        seed,
        roughness: 1.5,
        bowing: 1.2,
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fill: fill.type !== 'none' ? fill.color : undefined,
        fillStyle: fill.type === 'hachure' ? 'hachure' : fill.type === 'solid' ? 'solid' : undefined,
        hachureAngle: -41,
        hachureGap: Math.max(4, stroke.width * 2),
        fillWeight: stroke.width * 0.4,
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

export const RoughElementRenderer = memo(function RoughElementRenderer({
    element,
    isSelected
}: RoughElementRendererProps) {
    switch (element.type) {
        case 'rectangle':
        case 'ellipse':
        case 'diamond':
        case 'triangle':
            return <RoughShapeRenderer element={element} isSelected={isSelected} />;
        case 'line':
            return <RoughLineRenderer element={element as LineElement} isSelected={isSelected} />;
        case 'arrow':
            return <RoughArrowRenderer element={element as ArrowElement} isSelected={isSelected} />;
        case 'freedraw':
            return <RoughFreedrawRenderer element={element as FreedrawElement} isSelected={isSelected} />;
        case 'text':
            return <TextRenderer element={element as TextElement} isSelected={isSelected} />;
        case 'sticky':
            return <RoughStickyRenderer element={element as StickyElement} isSelected={isSelected} />;
        default:
            return null;
    }
});

// =============================================================================
// Rough Shape Renderer
// =============================================================================

interface RoughShapeRendererProps {
    element: ShapeElement;
    isSelected: boolean;
}

const RoughShapeRenderer = memo(function RoughShapeRenderer({ element }: RoughShapeRendererProps) {
    const { x, y, width, height, stroke, fill, opacity, id } = element;
    const gRef = useRef<SVGGElement>(null);

    // Stable seed based on element id
    const seed = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }, [id]);

    useEffect(() => {
        if (!gRef.current || width < 1 || height < 1) return;

        // Clear previous content
        gRef.current.innerHTML = '';

        const svg = gRef.current.ownerSVGElement;
        if (!svg) return;

        const rc = rough.svg(svg);
        const options = getRoughOptions(stroke, fill, seed);

        let node: SVGGElement;

        switch (element.type) {
            case 'rectangle':
                node = rc.rectangle(x, y, width, height, options);
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

        gRef.current.appendChild(node);
    }, [element.type, x, y, width, height, stroke, fill, seed]);

    return (
        <g
            ref={gRef}
            className="element-shape"
            opacity={opacity}
            style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))' }}
        />
    );
});

// =============================================================================
// Rough Line Renderer
// =============================================================================

interface RoughLineRendererProps {
    element: LineElement;
    isSelected: boolean;
}

const RoughLineRenderer = memo(function RoughLineRenderer({ element }: RoughLineRendererProps) {
    const { x, y, points, stroke, opacity, id } = element;
    const gRef = useRef<SVGGElement>(null);

    const seed = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }, [id]);

    useEffect(() => {
        if (!gRef.current || points.length < 2) return;

        gRef.current.innerHTML = '';

        const svg = gRef.current.ownerSVGElement;
        if (!svg) return;

        const rc = rough.svg(svg);
        const options = getRoughOptions(stroke, { type: 'none', color: '' }, seed);

        const x1 = x + points[0].x;
        const y1 = y + points[0].y;
        const x2 = x + points[1].x;
        const y2 = y + points[1].y;

        const line = rc.line(x1, y1, x2, y2, options);
        gRef.current.appendChild(line);
    }, [x, y, points, stroke, seed]);

    if (points.length < 2) return null;

    return <g ref={gRef} className="element-line" opacity={opacity} />;
});

// =============================================================================
// Rough Arrow Renderer
// =============================================================================

interface RoughArrowRendererProps {
    element: ArrowElement;
    isSelected: boolean;
}

const RoughArrowRenderer = memo(function RoughArrowRenderer({ element }: RoughArrowRendererProps) {
    const { x, y, points, stroke, startArrow, endArrow, opacity, id } = element;
    const gRef = useRef<SVGGElement>(null);

    const seed = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }, [id]);

    useEffect(() => {
        if (!gRef.current || points.length < 2) return;

        gRef.current.innerHTML = '';

        const svg = gRef.current.ownerSVGElement;
        if (!svg) return;

        const rc = rough.svg(svg);
        const options = getRoughOptions(stroke, { type: 'none', color: '' }, seed);

        const x1 = x + points[0].x;
        const y1 = y + points[0].y;
        const x2 = x + points[1].x;
        const y2 = y + points[1].y;

        // Draw line
        const line = rc.line(x1, y1, x2, y2, options);
        gRef.current.appendChild(line);

        // Arrow heads
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = Math.max(18, stroke.width * 7);
        const arrowAngle = Math.PI / 6;

        const arrowOptions = { ...options, fill: stroke.color, fillStyle: 'solid' as const };

        if (endArrow === 'arrow') {
            const ax1 = x2 - arrowLength * Math.cos(angle - arrowAngle);
            const ay1 = y2 - arrowLength * Math.sin(angle - arrowAngle);
            const ax2 = x2 - arrowLength * Math.cos(angle + arrowAngle);
            const ay2 = y2 - arrowLength * Math.sin(angle + arrowAngle);

            const arrowHead = rc.polygon([
                [x2, y2],
                [ax1, ay1],
                [ax2, ay2],
            ], arrowOptions);
            gRef.current.appendChild(arrowHead);
        }

        if (startArrow === 'arrow') {
            const reverseAngle = angle + Math.PI;
            const ax1 = x1 - arrowLength * Math.cos(reverseAngle - arrowAngle);
            const ay1 = y1 - arrowLength * Math.sin(reverseAngle - arrowAngle);
            const ax2 = x1 - arrowLength * Math.cos(reverseAngle + arrowAngle);
            const ay2 = y1 - arrowLength * Math.sin(reverseAngle + arrowAngle);

            const arrowHead = rc.polygon([
                [x1, y1],
                [ax1, ay1],
                [ax2, ay2],
            ], arrowOptions);
            gRef.current.appendChild(arrowHead);
        }
    }, [x, y, points, stroke, startArrow, endArrow, seed]);

    if (points.length < 2) return null;

    return <g ref={gRef} className="element-arrow" opacity={opacity} />;
});

// =============================================================================
// Rough Freedraw Renderer
// =============================================================================

interface RoughFreedrawRendererProps {
    element: FreedrawElement;
    isSelected: boolean;
}

const RoughFreedrawRenderer = memo(function RoughFreedrawRenderer({ element }: RoughFreedrawRendererProps) {
    const { x, y, points, stroke, opacity } = element;

    if (points.length < 2) {
        if (points.length === 1) {
            return (
                <circle
                    cx={x + points[0].x}
                    cy={y + points[0].y}
                    r={stroke.width / 2}
                    fill={stroke.color}
                    opacity={opacity}
                />
            );
        }
        return null;
    }

    // Smooth the path using quadratic bezier curves
    const pathData = useMemo(() => {
        if (points.length < 2) return '';

        let d = `M ${x + points[0].x} ${y + points[0].y}`;

        for (let i = 1; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];

            const midX = (x + p1.x + x + p2.x) / 2;
            const midY = (y + p1.y + y + p2.y) / 2;

            d += ` Q ${x + p1.x} ${y + p1.y} ${midX} ${midY}`;
        }

        // Last point
        const last = points[points.length - 1];
        d += ` L ${x + last.x} ${y + last.y}`;

        return d;
    }, [x, y, points]);

    const strokeDasharray = stroke.style === 'dashed' ? '8 4' : stroke.style === 'dotted' ? '2 2' : undefined;

    return (
        <g className="element-freedraw" opacity={opacity}>
            <path
                d={pathData}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    );
});

// =============================================================================
// Text Renderer (no rough style needed)
// =============================================================================

interface TextRendererProps {
    element: TextElement;
    isSelected: boolean;
}

const TextRenderer = memo(function TextRenderer({ element }: TextRendererProps) {
    const { x, y, width, height, text, textStyle, opacity } = element;

    const lines = text.split('\n');
    const lineHeight = textStyle.fontSize * textStyle.lineHeight;

    const getTextAnchor = () => {
        switch (textStyle.textAlign) {
            case 'left': return 'start';
            case 'right': return 'end';
            default: return 'middle';
        }
    };

    const getTextX = () => {
        switch (textStyle.textAlign) {
            case 'left': return x + 4;
            case 'right': return x + width - 4;
            default: return x + width / 2;
        }
    };

    const getStartY = () => {
        const totalHeight = lines.length * lineHeight;
        switch (textStyle.verticalAlign) {
            case 'top': return y + textStyle.fontSize;
            case 'bottom': return y + height - totalHeight + textStyle.fontSize;
            default: return y + (height - totalHeight) / 2 + textStyle.fontSize;
        }
    };

    return (
        <g className="element-text" opacity={opacity}>
            {lines.map((line, i) => (
                <text
                    key={i}
                    x={getTextX()}
                    y={getStartY() + i * lineHeight}
                    textAnchor={getTextAnchor()}
                    fill={textStyle.color}
                    fontSize={textStyle.fontSize}
                    fontFamily={textStyle.fontFamily}
                    fontWeight={textStyle.fontWeight}
                    fontStyle={textStyle.fontStyle}
                    style={{ userSelect: 'none' }}
                >
                    {line}
                </text>
            ))}
        </g>
    );
});

// =============================================================================
// Rough Sticky Note Renderer
// =============================================================================

interface RoughStickyRendererProps {
    element: StickyElement;
    isSelected: boolean;
}

const RoughStickyRenderer = memo(function RoughStickyRenderer({ element }: RoughStickyRendererProps) {
    const { x, y, width, height, text, textStyle, color, opacity, id } = element;
    const gRef = useRef<SVGGElement>(null);

    const bgColor = STICKY_COLORS[color];

    const seed = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = ((hash << 5) - hash) + id.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }, [id]);

    useEffect(() => {
        if (!gRef.current) return;

        // Clear previous shapes (keep text foreignObject)
        const children = Array.from(gRef.current.children);
        children.forEach(child => {
            if (child.tagName !== 'foreignObject') {
                child.remove();
            }
        });

        const svg = gRef.current.ownerSVGElement;
        if (!svg) return;

        const rc = rough.svg(svg);

        // Shadow rectangle
        const shadow = rc.rectangle(x + 4, y + 4, width, height, {
            seed,
            fill: 'rgba(0,0,0,0.1)',
            fillStyle: 'solid',
            stroke: 'none',
            roughness: 0.8,
        });
        gRef.current.insertBefore(shadow, gRef.current.firstChild);

        // Main sticky note
        const sticky = rc.rectangle(x, y, width, height, {
            seed,
            fill: bgColor,
            fillStyle: 'solid',
            stroke: 'rgba(0,0,0,0.15)',
            strokeWidth: 1,
            roughness: 0.8,
            bowing: 0.5,
        });
        gRef.current.insertBefore(sticky, gRef.current.children[1] || null);

    }, [x, y, width, height, bgColor, seed]);

    return (
        <g
            ref={gRef}
            className="element-sticky"
            opacity={opacity}
            style={{ filter: 'drop-shadow(3px 5px 8px rgba(0,0,0,0.2))' }}
        >
            <foreignObject x={x + 16} y={y + 16} width={width - 32} height={height - 32}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize: textStyle.fontSize,
                        fontFamily: "'Caveat', 'Comic Sans MS', cursive",
                        color: '#333',
                        lineHeight: textStyle.lineHeight,
                        overflow: 'hidden',
                        wordWrap: 'break-word',
                    }}
                >
                    {text || 'Click to edit...'}
                </div>
            </foreignObject>
        </g>
    );
});
