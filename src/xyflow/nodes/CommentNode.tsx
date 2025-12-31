/**
 * CommentNode - Comment/annotation node for XY Flow
 * 
 * Features:
 * - Comment icon (MessageSquare)
 * - Editable text
 * - Optional author
 * - Resolved/unresolved status with color change
 */

import { memo, useCallback } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { MessageSquare, Check } from 'lucide-react';
import type { DiagramNode } from '../types';
import { useXYFlowStore } from '../store';

// =============================================================================
// Constants
// =============================================================================

const MIN_WIDTH = 180;
const MIN_HEIGHT = 100;

const COLORS = {
    unresolved: {
        background: '#fef9c3', // yellow-100
        border: '#facc15',     // yellow-400
    },
    resolved: {
        background: '#dcfce7', // green-100
        border: '#4ade80',     // green-400
    },
} as const;

// =============================================================================
// Component
// =============================================================================

export const CommentNode = memo(({ id, data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = '',
        commentAuthor,
        commentResolved = false,
    } = data ?? {};

    const updateNodeData = useXYFlowStore((state) => state.updateNodeData);

    const colors = commentResolved ? COLORS.resolved : COLORS.unresolved;

    const handleToggleResolved = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        updateNodeData(id, { commentResolved: !commentResolved });
    }, [id, commentResolved, updateNodeData]);

    return (
        <>
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                isVisible={selected}
                lineStyle={{ borderColor: '#3b82f6' }}
                handleStyle={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
            />
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: colors.background,
                    border: `2px solid ${colors.border}`,
                    borderRadius: 8,
                    boxShadow: selected
                        ? '0 0 0 2px #3b82f6, 2px 4px 8px rgba(0, 0, 0, 0.15)'
                        : '2px 4px 8px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.5rem',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.15s ease',
                    position: 'relative',
                }}
            >
                {/* Header with icon and resolve button */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem',
                        gap: '0.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MessageSquare size={14} color="#666" />
                        {commentAuthor && (
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    color: '#666',
                                    fontWeight: 500,
                                }}
                            >
                                {commentAuthor as string}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleToggleResolved}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            border: `1px solid ${commentResolved ? '#22c55e' : '#d1d5db'}`,
                            backgroundColor: commentResolved ? '#22c55e' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        title={commentResolved ? 'Mark as unresolved' : 'Mark as resolved'}
                    >
                        {commentResolved && <Check size={12} color="#fff" />}
                    </button>
                </div>

                {/* Comment text */}
                <div
                    style={{
                        flex: 1,
                        fontSize: '0.8125rem',
                        color: '#333',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {label}
                </div>

                {/* Connection Handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />
            </div>
        </>
    );
});

CommentNode.displayName = 'CommentNode';
