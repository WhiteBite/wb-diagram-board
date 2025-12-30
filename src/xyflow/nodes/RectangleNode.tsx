/**
 * RectangleNode - Rectangle shape node for XY Flow
 */

import { memo, useCallback } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';
import { QuickAddHandle } from '../../components/xyflow/QuickAddHandle';
import { parseMarkdown } from '../../utils/markdown';

const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

export const RectangleNode = memo(({ id, data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = '',
        style,
        textStyle,
    } = data ?? {};

    const onQuickAdd = useCallback((position: Position) => {
        window.dispatchEvent(new CustomEvent('quickAdd', {
            detail: { nodeId: id, position }
        }));
    }, [id]);

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    // Use explicit style if provided, otherwise use CSS variables
    const fill = data?.style?.fill ?? 'var(--element-fill, #ffffff)';
    const stroke = data?.style?.stroke ?? 'var(--element-stroke, #1e293b)';
    const strokeWidth = data?.style?.strokeWidth ?? 2;
    const cornerRadius = data?.style?.cornerRadius ?? 4;
    const textColor = data?.textStyle?.color ?? 'var(--theme-text, #1e1e1e)';

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
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: selected ? '0 0 0 2px var(--theme-primary, #3b82f6)' : 'none',
                    transition: 'box-shadow 0.15s ease',
                }}
            >
                {/* Connection Handles with QuickAdd */}
                <QuickAddHandle position={Position.Top} onAdd={onQuickAdd} />
                <QuickAddHandle position={Position.Right} onAdd={onQuickAdd} />
                <QuickAddHandle position={Position.Bottom} onAdd={onQuickAdd} />
                <QuickAddHandle position={Position.Left} onAdd={onQuickAdd} />

                <span
                    style={{
                        fontSize: labelStyle.fontSize,
                        fontFamily: labelStyle.fontFamily,
                        fontWeight: labelStyle.fontWeight,
                        color: textColor,
                        textAlign: labelStyle.textAlign,
                        padding: '0.75rem',
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
                    {parseMarkdown(label)}
                </span>
            </div>
        </>
    );
});

RectangleNode.displayName = 'RectangleNode';
