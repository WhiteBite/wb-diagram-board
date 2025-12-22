/**
 * WB Canvas - Element Renderer
 * 
 * Renders canvas elements as SVG
 */

import { memo } from 'react';
import { CanvasElement, ShapeElement, LineElement, ArrowElement, TextElement, StickyElement, STICKY_COLORS } from '../../types/canvas';

interface ElementRendererProps {
    element: CanvasElement;
    isSelected: boolean;
}

export const ElementRenderer = memo(function ElementRenderer({ element, isSelected }: ElementRendererProps) {
    switch (element.type) {
        case 'rectangle':
        case 'ellipse':
        case 'diamond':
        case 'triangle':
            return <ShapeRenderer element={element} isSelected={isSelected} />;
        case 'line':
            return <LineRenderer element={element as LineElement} isSelected={isSelected} />;
        case 'arrow':
            return <ArrowRenderer element={element as ArrowElement} isSelected={isSelected} />;
        case 'text':
            return <TextRenderer element={element as TextElement} isSelected={isSelected} />;
        case 'sticky':
            return <StickyRenderer element={element as StickyElement} isSelected={isSelected} />;
        default:
            return null;
    }
});

// =============================================================================
// Shape Renderer
// =============================================================================

interface ShapeRendererProps {
    element: ShapeElement;
    isSelected: boolean;
}

const ShapeRenderer = memo(function ShapeRenderer({ element }: ShapeRendererProps) {
    const { x, y, width, height, stroke, fill, cornerRadius, rotation, opacity } = element;

    const strokeDasharray = stroke.style === 'dashed' ? '8 4' : stroke.style === 'dotted' ? '2 2' : undefined;

    const fillColor = fill.type === 'none' ? 'transparent' : fill.color;

    const commonProps = {
        fill: fillColor,
        stroke: stroke.color,
        strokeWidth: stroke.width,
        strokeDasharray,
        opacity,
        style: {
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
            transformOrigin: `${x + width / 2}px ${y + height / 2}px`,
        },
    };

    const renderShape = () => {
        switch (element.type) {
            case 'rectangle':
                return (
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={cornerRadius}
                        ry={cornerRadius}
                        {...commonProps}
                    />
                );

            case 'ellipse':
                return (
                    <ellipse
                        cx={x + width / 2}
                        cy={y + height / 2}
                        rx={width / 2}
                        ry={height / 2}
                        {...commonProps}
                    />
                );

            case 'diamond':
                const diamondPoints = [
                    `${x + width / 2},${y}`,
                    `${x + width},${y + height / 2}`,
                    `${x + width / 2},${y + height}`,
                    `${x},${y + height / 2}`,
                ].join(' ');
                return <polygon points={diamondPoints} {...commonProps} />;

            case 'triangle':
                const trianglePoints = [
                    `${x + width / 2},${y}`,
                    `${x + width},${y + height}`,
                    `${x},${y + height}`,
                ].join(' ');
                return <polygon points={trianglePoints} {...commonProps} />;

            default:
                return null;
        }
    };

    return (
        <g className="element-shape">
            {renderShape()}

            {/* Text inside shape */}
            {element.text && element.textStyle && (
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={element.textStyle.color}
                    fontSize={element.textStyle.fontSize}
                    fontFamily={element.textStyle.fontFamily}
                    fontWeight={element.textStyle.fontWeight}
                    fontStyle={element.textStyle.fontStyle}
                >
                    {element.text}
                </text>
            )}
        </g>
    );
});

// =============================================================================
// Line Renderer
// =============================================================================

interface LineRendererProps {
    element: LineElement;
    isSelected: boolean;
}

const LineRenderer = memo(function LineRenderer({ element }: LineRendererProps) {
    const { x, y, points, stroke, opacity } = element;

    if (points.length < 2) return null;

    const strokeDasharray = stroke.style === 'dashed' ? '8 4' : stroke.style === 'dotted' ? '2 2' : undefined;

    return (
        <g className="element-line" opacity={opacity}>
            <line
                x1={x + points[0].x}
                y1={y + points[0].y}
                x2={x + points[1].x}
                y2={y + points[1].y}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
            />
        </g>
    );
});

// =============================================================================
// Arrow Renderer
// =============================================================================

interface ArrowRendererProps {
    element: ArrowElement;
    isSelected: boolean;
}

const ArrowRenderer = memo(function ArrowRenderer({ element }: ArrowRendererProps) {
    const { x, y, points, stroke, startArrow, endArrow, opacity } = element;

    if (points.length < 2) return null;

    const strokeDasharray = stroke.style === 'dashed' ? '8 4' : stroke.style === 'dotted' ? '2 2' : undefined;

    const x1 = x + points[0].x;
    const y1 = y + points[0].y;
    const x2 = x + points[1].x;
    const y2 = y + points[1].y;

    // Calculate arrow head - size proportional to stroke width
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLength = Math.max(16, stroke.width * 6);
    const arrowAngle = Math.PI / 7; // ~25 degrees for sharper arrow

    const renderArrowHead = (px: number, py: number, pointingAngle: number) => {
        const ax1 = px - arrowLength * Math.cos(pointingAngle - arrowAngle);
        const ay1 = py - arrowLength * Math.sin(pointingAngle - arrowAngle);
        const ax2 = px - arrowLength * Math.cos(pointingAngle + arrowAngle);
        const ay2 = py - arrowLength * Math.sin(pointingAngle + arrowAngle);

        return (
            <polygon
                points={`${px},${py} ${ax1},${ay1} ${ax2},${ay2}`}
                fill={stroke.color}
                stroke={stroke.color}
                strokeWidth={1}
                strokeLinejoin="round"
            />
        );
    };

    return (
        <g className="element-arrow" opacity={opacity}>
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
            />
            {startArrow === 'arrow' && renderArrowHead(x1, y1, angle + Math.PI)}
            {endArrow === 'arrow' && renderArrowHead(x2, y2, angle)}
        </g>
    );
});

// =============================================================================
// Text Renderer
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
            case 'left': return x;
            case 'right': return x + width;
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
                >
                    {line}
                </text>
            ))}
        </g>
    );
});

// =============================================================================
// Sticky Note Renderer
// =============================================================================

interface StickyRendererProps {
    element: StickyElement;
    isSelected: boolean;
}

const StickyRenderer = memo(function StickyRenderer({ element }: StickyRendererProps) {
    const { x, y, width, height, text, textStyle, color, opacity } = element;

    const bgColor = STICKY_COLORS[color];
    const shadowOffset = 4;

    return (
        <g className="element-sticky" opacity={opacity}>
            {/* Shadow */}
            <rect
                x={x + shadowOffset}
                y={y + shadowOffset}
                width={width}
                height={height}
                fill="rgba(0,0,0,0.1)"
                rx={4}
            />

            {/* Background */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={bgColor}
                stroke="#00000020"
                strokeWidth={1}
                rx={4}
            />

            {/* Fold effect */}
            <path
                d={`M ${x + width - 20} ${y} L ${x + width} ${y + 20} L ${x + width - 20} ${y + 20} Z`}
                fill="#00000010"
            />

            {/* Text */}
            <foreignObject x={x + 12} y={y + 12} width={width - 24} height={height - 24}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize: textStyle.fontSize,
                        fontFamily: textStyle.fontFamily,
                        color: textStyle.color,
                        lineHeight: textStyle.lineHeight,
                        overflow: 'hidden',
                        wordWrap: 'break-word',
                    }}
                >
                    {text}
                </div>
            </foreignObject>
        </g>
    );
});
