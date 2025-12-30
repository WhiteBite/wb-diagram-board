/**
 * EllipseNode - Ellipse/Circle shape node for XY Flow
 */

import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';

const MIN_WIDTH = 60;
const MIN_HEIGHT = 60;

export const EllipseNode = memo(({ data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = '',
        style,
        textStyle,
    } = data ?? {};

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    // Use explicit style if provided, otherwise use CSS variables
    const fill = style?.fill ?? 'var(--element-fill, #ffffff)';
    const stroke = style?.stroke ?? 'var(--element-stroke, #1e293b)';
    const strokeWidth = style?.strokeWidth ?? 2;
    const textColor = textStyle?.color ?? 'var(--theme-text, #1e1e1e)';

    return (
        <>
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                isVisible={selected}
                lineStyle={{ borderColor: 'var(--theme-primary, #3b82f6)' }}
                handleStyle={{ backgroundColor: 'var(--theme-primary, #3b82f6)', borderColor: 'var(--theme-primary, #3b82f6)' }}
            />
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: fill,
                    border: `${strokeWidth}px solid ${stroke}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selected ? '0 0 0 2px var(--theme-primary, #3b82f6)' : 'none',
                    transition: 'box-shadow 0.15s ease',
                }}
            >
                {/* Connection Handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />

                <span
                    style={{
                        fontSize: labelStyle.fontSize,
                        fontFamily: labelStyle.fontFamily,
                        fontWeight: labelStyle.fontWeight,
                        color: textColor,
                        textAlign: 'center',
                        padding: '12%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        wordBreak: 'break-word',
                        lineHeight: 1.2,
                        userSelect: 'none',
                        boxSizing: 'border-box',
                    }}
                >
                    {label}
                </span>
            </div>
        </>
    );
});

EllipseNode.displayName = 'EllipseNode';
