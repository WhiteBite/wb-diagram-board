/**
 * FrameNode - Container node with editable title header (like Figma frames)
 *
 * Features:
 * - Resizable container with solid border
 * - Editable title header at the top
 * - Configurable border color
 * - Child nodes move with the frame
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';
import { useXYFlowStore } from '../store';

// =============================================================================
// Constants
// =============================================================================

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const HEADER_HEIGHT = 28;

// =============================================================================
// Component
// =============================================================================

export const FrameNode = memo(({ id, data, selected }: NodeProps<DiagramNode>) => {
    const { label = 'Frame', style, textStyle } = data ?? {};

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    const updateNode = useXYFlowStore((s) => s.updateNode);

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    // Frame styling
    const frameFill = style?.fill ?? 'rgba(148, 163, 184, 0.06)';
    const frameStroke = style?.stroke ?? 'var(--theme-secondary, #64748b)';

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setEditValue(label);
        setIsEditing(true);
    }, [label]);

    const handleSave = useCallback(() => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== label) {
            updateNode(id, { data: { ...data, label: trimmed } });
        }
        setIsEditing(false);
    }, [editValue, label, id, data, updateNode]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(label);
            setIsEditing(false);
        }
    }, [handleSave, label]);

    return (
        <>
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                isVisible={selected}
                lineStyle={{ borderColor: frameStroke }}
                handleStyle={{ backgroundColor: frameStroke, borderColor: frameStroke }}
            />
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: frameFill,
                    border: `${style?.strokeWidth ?? 2}px solid ${frameStroke}`,
                    borderRadius: style?.cornerRadius ?? 8,
                    display: 'flex',
                    flexDirection: 'column',
                    outline: selected ? `2px solid ${frameStroke}` : 'none',
                    outlineOffset: '2px',
                    overflow: 'hidden',
                }}
            >
                {/* Connection Handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />

                {/* Header with editable title */}
                <div
                    style={{
                        height: HEADER_HEIGHT,
                        backgroundColor: frameStroke,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 0.625rem',
                        flexShrink: 0,
                    }}
                    onDoubleClick={handleDoubleClick}
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: '100%',
                                fontSize: labelStyle.fontSize ?? 12,
                                fontFamily: labelStyle.fontFamily,
                                fontWeight: 600,
                                color: '#ffffff',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                border: 'none',
                                borderRadius: '0.25rem',
                                padding: '0.125rem 0.375rem',
                                outline: 'none',
                            }}
                        />
                    ) : (
                        <span
                            style={{
                                fontSize: labelStyle.fontSize ?? 12,
                                fontFamily: labelStyle.fontFamily,
                                fontWeight: 600,
                                color: '#ffffff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'text',
                            }}
                            title="Double-click to edit"
                        >
                            {label}
                        </span>
                    )}
                </div>

                {/* Content area for child nodes */}
                <div style={{ flex: 1, minHeight: 0 }} />
            </div>
        </>
    );
});

FrameNode.displayName = 'FrameNode';
