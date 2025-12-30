/**
 * SwimlaneNode - Swimlane container node for XY Flow
 * Used for organizing elements into lanes (horizontal or vertical)
 */

import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';

const MIN_WIDTH = 150;
const MIN_HEIGHT = 200;

export const SwimlaneNode = memo(({ data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = '',
        style,
        textStyle,
        swimlaneTitle,
        swimlaneOrientation = 'vertical',
    } = data ?? {};

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    // Use explicit style if provided, otherwise use CSS variables
    const fill = style?.fill ?? 'var(--theme-surface, #f8fafc)';
    const stroke = style?.stroke ?? 'var(--element-stroke, #1e293b)';
    const strokeWidth = style?.strokeWidth ?? 2;
    const cornerRadius = style?.cornerRadius ?? 4;

    const isHorizontal = swimlaneOrientation === 'horizontal';
    const title = swimlaneTitle ?? label;
    const headerSize = 40;

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
                    borderRadius: cornerRadius,
                    display: 'flex',
                    flexDirection: isHorizontal ? 'row' : 'column',
                    outline: selected ? '2px solid var(--theme-primary, #3b82f6)' : 'none',
                    outlineOffset: '2px',
                    overflow: 'hidden',
                }}
            >
                {/* Connection Handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />

                {/* Header */}
                <div
                    style={{
                        width: isHorizontal ? headerSize : '100%',
                        height: isHorizontal ? '100%' : headerSize,
                        backgroundColor: stroke,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span
                        style={{
                            fontSize: labelStyle.fontSize,
                            fontFamily: labelStyle.fontFamily,
                            fontWeight: 'bold',
                            color: 'var(--theme-text-inverse, #ffffff)',
                            textAlign: 'center',
                            writingMode: isHorizontal ? 'vertical-rl' : 'horizontal-tb',
                            textOrientation: isHorizontal ? 'mixed' : undefined,
                            transform: isHorizontal ? 'rotate(180deg)' : undefined,
                            padding: '0.5rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {title}
                    </span>
                </div>

                {/* Content area */}
                <div
                    style={{
                        flex: 1,
                        backgroundColor: 'var(--element-fill, rgba(255, 255, 255, 0.5))',
                        minWidth: 0,
                        minHeight: 0,
                    }}
                />
            </div>
        </>
    );
});

SwimlaneNode.displayName = 'SwimlaneNode';
