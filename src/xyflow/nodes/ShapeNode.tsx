/**
 * ShapeNode - Universal shape node component
 * Renders various shapes: hexagon, parallelogram, trapezoid, cylinder, document, cloud, actor, note
 * 
 * All shapes use viewBox="0 0 100 100" for normalized coordinates and scale properly with container.
 * vectorEffect="non-scaling-stroke" ensures consistent stroke width during resize.
 */

import { memo, useCallback } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE, MIN_NODE_SIZE } from '../types';
import { QuickAddHandle } from '../../components/xyflow/QuickAddHandle';
import { parseMarkdown } from '../../utils/markdown';

// =============================================================================
// Shape SVG Props (simplified - no width/height needed)
// =============================================================================

interface ShapeSVGProps {
    fill: string;
    stroke: string;
    strokeWidth: number;
}

// Common SVG wrapper style
const svgStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
};

// =============================================================================
// Shape SVG Components (all use viewBox 0-100)
// =============================================================================

const HexagonShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Hexagon with 20% inset on sides
    const inset = 20;
    const points = `${inset},0 ${100 - inset},0 100,50 ${100 - inset},100 ${inset},100 0,50`;
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <polygon
                points={points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const ParallelogramShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Parallelogram with 20% skew
    const skew = 20;
    const points = `${skew},0 100,0 ${100 - skew},100 0,100`;
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <polygon
                points={points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const TrapezoidShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Trapezoid with 15% top inset
    const topInset = 15;
    const points = `${topInset},0 ${100 - topInset},0 100,100 0,100`;
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <polygon
                points={points}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const CylinderShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Cylinder with ellipse caps (12% height for ellipse)
    const ellipseRy = 12;
    const bodyTop = ellipseRy;
    const bodyBottom = 100 - ellipseRy;

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            {/* Bottom ellipse (the part that's behind) */}
            <ellipse
                cx={50}
                cy={bodyBottom}
                rx={50}
                ry={ellipseRy}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            {/* Body rectangle (to cover the top half of the bottom ellipse) */}
            <rect
                x={0}
                y={bodyTop}
                width={100}
                height={bodyBottom - bodyTop}
                fill={fill}
                stroke="none"
            />
            {/* Side lines */}
            <line
                x1={0}
                y1={bodyTop}
                x2={0}
                y2={bodyBottom}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            <line
                x1={100}
                y1={bodyTop}
                x2={100}
                y2={bodyBottom}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            {/* Top ellipse (front) */}
            <ellipse
                cx={50}
                cy={bodyTop}
                rx={50}
                ry={ellipseRy}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const DocumentShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Document with wavy bottom (15% wave height)
    const waveHeight = 15;
    const path = `M 0,0 
                  L 100,0 
                  L 100,${100 - waveHeight} 
                  Q 75,${100 - waveHeight * 2} 50,${100 - waveHeight}
                  Q 25,100 0,${100 - waveHeight}
                  Z`;
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <path
                d={path}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const CloudShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Cloud as a single path - uses xMidYMid meet to preserve aspect ratio
    const path = `
        M 25,55 
        C 10,55 5,42 18,32
        C 12,18 28,8 42,14
        C 48,4 68,4 78,14
        C 92,8 102,22 96,38
        C 106,48 100,62 85,66
        C 90,80 72,86 58,80
        C 48,90 28,86 22,74
        C 6,76 4,60 25,55
        Z
    `;
    return (
        <svg
            viewBox="0 0 110 100"
            preserveAspectRatio="xMidYMid meet"
            style={svgStyle}
        >
            <path
                d={path}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const ActorShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Stick figure actor (UML style) - preserves aspect ratio
    return (
        <svg
            viewBox="0 0 60 120"
            preserveAspectRatio="xMidYMid meet"
            style={svgStyle}
        >
            {/* Head */}
            <circle
                cx={30}
                cy={15}
                r={12}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            {/* Body */}
            <line
                x1={30}
                y1={27}
                x2={30}
                y2={65}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            {/* Arms */}
            <line
                x1={5}
                y1={40}
                x2={55}
                y2={40}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            {/* Left leg */}
            <line
                x1={30}
                y1={65}
                x2={15}
                y2={100}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            {/* Right leg */}
            <line
                x1={30}
                y1={65}
                x2={45}
                y2={100}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const NoteShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Note with folded corner (15% fold size)
    const fold = 15;
    const mainPath = `M 0,0 
                      L ${100 - fold},0 
                      L 100,${fold} 
                      L 100,100 
                      L 0,100 
                      Z`;
    const foldPath = `M ${100 - fold},0 L ${100 - fold},${fold} L 100,${fold}`;

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <path
                d={mainPath}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
            <path
                d={foldPath}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const CircleShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Circle that preserves aspect ratio (stays circular)
    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            style={svgStyle}
        >
            <circle
                cx={50}
                cy={50}
                r={46}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const RoundedRectShape = ({ fill, stroke, strokeWidth }: ShapeSVGProps) => {
    // Rounded rectangle with 15% corner radius
    const radius = 15;
    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={svgStyle}>
            <rect
                x={2}
                y={2}
                width={96}
                height={96}
                rx={radius}
                ry={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

// =============================================================================
// Shape Components Map
// =============================================================================

type ShapeType = 'hexagon' | 'parallelogram' | 'trapezoid' | 'cylinder' | 'document' | 'cloud' | 'actor' | 'note' | 'circle' | 'rounded-rectangle';

// Safe zones padding for each shape type to keep text inside visible area
const SHAPE_PADDING: Record<ShapeType, { horizontal: string; vertical: string; align?: 'center' | 'flex-end' }> = {
    'hexagon': { horizontal: '15%', vertical: '10%' },
    'parallelogram': { horizontal: '18%', vertical: '8%' },
    'trapezoid': { horizontal: '15%', vertical: '8%' },
    'cylinder': { horizontal: '10%', vertical: '15%' },
    'document': { horizontal: '8%', vertical: '12%' },
    'cloud': { horizontal: '20%', vertical: '20%' },
    'actor': { horizontal: '5%', vertical: '5%', align: 'flex-end' }, // text below figure
    'note': { horizontal: '12%', vertical: '12%' },
    'circle': { horizontal: '15%', vertical: '15%' },
    'rounded-rectangle': { horizontal: '8%', vertical: '8%' },
} as const;

const SHAPE_COMPONENTS: Record<ShapeType, React.FC<ShapeSVGProps>> = {
    'hexagon': HexagonShape,
    'parallelogram': ParallelogramShape,
    'trapezoid': TrapezoidShape,
    'cylinder': CylinderShape,
    'document': DocumentShape,
    'cloud': CloudShape,
    'actor': ActorShape,
    'note': NoteShape,
    'circle': CircleShape,
    'rounded-rectangle': RoundedRectShape,
};

// =============================================================================
// Main Component
// =============================================================================

interface ShapeNodeProps extends NodeProps<DiagramNode> {
    shapeType: ShapeType;
}

export const ShapeNodeBase = memo(({ id, data, selected, shapeType }: ShapeNodeProps) => {
    const { label = '', style, textStyle } = data ?? {};

    const onQuickAdd = useCallback((position: Position) => {
        window.dispatchEvent(new CustomEvent('quickAdd', {
            detail: { nodeId: id, position }
        }));
    }, [id]);

    // Use explicit style if provided, otherwise use CSS variables
    const fill = data?.style?.fill ?? 'var(--element-fill, #ffffff)';
    const stroke = data?.style?.stroke ?? 'var(--element-stroke, #1e293b)';
    const strokeWidth = data?.style?.strokeWidth ?? 2;
    const textColor = data?.textStyle?.color ?? 'var(--theme-text, #1e1e1e)';

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    const ShapeComponent = SHAPE_COMPONENTS[shapeType];

    // Get safe zone padding for this shape type
    const padding = SHAPE_PADDING[shapeType];

    // Get minimum size for this shape type
    const minSize = MIN_NODE_SIZE[shapeType] ?? { width: 40, height: 40 };

    return (
        <>
            <NodeResizer
                minWidth={minSize.width}
                minHeight={minSize.height}
                isVisible={selected}
                lineStyle={{ borderColor: 'var(--theme-primary, #3b82f6)' }}
                handleStyle={{ backgroundColor: 'var(--theme-primary, #3b82f6)', borderColor: 'var(--theme-primary, #3b82f6)' }}
            />
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // CSS-based selection highlight
                    boxShadow: selected ? '0 0 0 2px var(--theme-primary, #3b82f6)' : 'none',
                }}
            >
                <ShapeComponent
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                />

                {/* Connection Handles with QuickAdd */}
                <QuickAddHandle position={Position.Top} onAdd={onQuickAdd} />
                <QuickAddHandle position={Position.Right} onAdd={onQuickAdd} />
                <QuickAddHandle position={Position.Bottom} onAdd={onQuickAdd} />
                <QuickAddHandle position={Position.Left} onAdd={onQuickAdd} />

                {/* Label with safe zone padding */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        fontSize: labelStyle.fontSize,
                        fontFamily: labelStyle.fontFamily,
                        fontWeight: labelStyle.fontWeight,
                        color: textColor,
                        textAlign: 'center',
                        paddingLeft: padding.horizontal,
                        paddingRight: padding.horizontal,
                        paddingTop: padding.vertical,
                        paddingBottom: padding.vertical,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: padding.align || 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        boxSizing: 'border-box',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '100%',
                            maxHeight: padding.align === 'flex-end' ? '30%' : '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: padding.align === 'flex-end' ? 2 : 4,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            lineHeight: 1.2,
                            userSelect: 'none',
                            marginBottom: padding.align === 'flex-end' ? '4px' : '0',
                        }}
                    >
                        {parseMarkdown(label)}
                    </div>
                </div>
            </div>
        </>
    );
});

ShapeNodeBase.displayName = 'ShapeNodeBase';

// =============================================================================
// Exported Node Components
// =============================================================================

export const HexagonNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="hexagon" />
));
HexagonNode.displayName = 'HexagonNode';

export const ParallelogramNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="parallelogram" />
));
ParallelogramNode.displayName = 'ParallelogramNode';

export const TrapezoidNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="trapezoid" />
));
TrapezoidNode.displayName = 'TrapezoidNode';

export const CylinderNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="cylinder" />
));
CylinderNode.displayName = 'CylinderNode';

export const DocumentNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="document" />
));
DocumentNode.displayName = 'DocumentNode';

export const CloudNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="cloud" />
));
CloudNode.displayName = 'CloudNode';

export const ActorNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="actor" />
));
ActorNode.displayName = 'ActorNode';

export const NoteNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="note" />
));
NoteNode.displayName = 'NoteNode';

export const CircleNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="circle" />
));
CircleNode.displayName = 'CircleNode';

export const RoundedRectangleNode = memo((props: NodeProps<DiagramNode>) => (
    <ShapeNodeBase {...props} shapeType="rounded-rectangle" />
));
RoundedRectangleNode.displayName = 'RoundedRectangleNode';
