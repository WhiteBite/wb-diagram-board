/**
 * TextNode - Text-only node for XY Flow
 * Used for labels, annotations, and free text
 */

import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';

const MIN_WIDTH = 50;
const MIN_HEIGHT = 24;

export const TextNode = memo(({ data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = '',
        textStyle,
    } = data ?? {};

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };
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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                        labelStyle.textAlign === 'left'
                            ? 'flex-start'
                            : labelStyle.textAlign === 'right'
                                ? 'flex-end'
                                : 'center',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    borderRadius: 4,
                    outline: selected ? '2px solid var(--theme-primary, #3b82f6)' : 'none',
                    outlineOffset: 2,
                    transition: 'outline 0.15s ease',
                }}
            >
                {/* Connection Handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd style={{ opacity: 0.5 }} />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd style={{ opacity: 0.5 }} />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd style={{ opacity: 0.5 }} />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd style={{ opacity: 0.5 }} />

                <span
                    style={{
                        fontSize: labelStyle.fontSize,
                        fontFamily: labelStyle.fontFamily,
                        fontWeight: labelStyle.fontWeight,
                        color: textColor,
                        textAlign: labelStyle.textAlign,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {label}
                </span>
            </div>
        </>
    );
});

TextNode.displayName = 'TextNode';
