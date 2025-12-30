/**
 * GroupNode - Container node for grouping other nodes
 *
 * Features:
 * - Resizable container
 * - Semi-transparent background with border
 * - Title header at the top
 * - Child nodes move with the group
 * - Collapse/expand functionality
 * - Badge showing child count when collapsed
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { Handle, Position, NodeResizer, useNodes, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';
import { useXYFlowStore } from '../store';

// =============================================================================
// Constants
// =============================================================================

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const HEADER_HEIGHT = 32;
const COLLAPSED_HEIGHT = 48;
const COLLAPSED_WIDTH = 180;

// =============================================================================
// Icons
// =============================================================================

const ChevronDownIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// =============================================================================
// Component
// =============================================================================

export const GroupNode = memo(({ id, data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = 'Group',
        style,
        textStyle,
        isCollapsed: initialCollapsed = false,
    } = data ?? {};

    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

    // Get store methods for syncing node dimensions
    const updateNode = useXYFlowStore((s) => s.updateNode);

    // Get all nodes to count children
    const allNodes = useNodes();

    // Count child nodes
    const childCount = useMemo(() => {
        return allNodes.filter((node) => node.parentId === id).length;
    }, [allNodes, id]);

    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };

    // Group-specific styling - uses theme primary color
    const groupFill = style?.fill ?? 'rgba(99, 102, 241, 0.08)';
    const groupStroke = style?.stroke ?? 'var(--theme-primary, #6366f1)';

    const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);

        // Sync node dimensions in store to prevent "matryoshka effect"
        if (newCollapsed) {
            // Save current dimensions before collapsing
            const currentWidth = style?.width ?? MIN_WIDTH;
            const currentHeight = style?.height ?? MIN_HEIGHT;

            updateNode(id, {
                data: {
                    ...data,
                    isCollapsed: true,
                    _expandedWidth: currentWidth,
                    _expandedHeight: currentHeight,
                },
                style: {
                    ...style,
                    width: COLLAPSED_WIDTH,
                    height: COLLAPSED_HEIGHT,
                },
            });
        } else {
            // Restore dimensions when expanding
            const expandedWidth = (data as Record<string, unknown>)?._expandedWidth as number | undefined;
            const expandedHeight = (data as Record<string, unknown>)?._expandedHeight as number | undefined;

            updateNode(id, {
                data: {
                    ...data,
                    isCollapsed: false,
                },
                style: {
                    ...style,
                    width: expandedWidth ?? MIN_WIDTH,
                    height: expandedHeight ?? MIN_HEIGHT,
                },
            });
        }
    }, [isCollapsed, id, data, style, updateNode]);

    // Collapsed view
    if (isCollapsed) {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    minWidth: COLLAPSED_WIDTH,
                    minHeight: COLLAPSED_HEIGHT,
                    backgroundColor: groupFill,
                    border: `${style?.strokeWidth ?? 2}px solid ${groupStroke}`,
                    borderRadius: style?.cornerRadius ?? 8,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 0.75rem',
                    gap: '0.5rem',
                    outline: selected ? `2px solid ${groupStroke}` : 'none',
                    outlineOffset: '2px',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                }}
                onClick={handleToggleCollapse}
            >
                {/* Connection Handles */}
                <Handle
                    type="source"
                    position={Position.Top}
                    id="top"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="right"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="bottom"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />
                <Handle
                    type="source"
                    position={Position.Left}
                    id="left"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />

                {/* Expand button */}
                <button
                    onClick={handleToggleCollapse}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1.5rem',
                        height: '1.5rem',
                        padding: 0,
                        border: 'none',
                        borderRadius: '0.25rem',
                        backgroundColor: groupStroke,
                        color: '#ffffff',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                    title="Expand group"
                >
                    <ChevronRightIcon />
                </button>

                {/* Label */}
                <span
                    style={{
                        fontSize: labelStyle.fontSize ?? 12,
                        fontFamily: labelStyle.fontFamily,
                        fontWeight: 600,
                        color: groupStroke,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                    }}
                >
                    {label}
                </span>

                {/* Child count badge */}
                {childCount > 0 && (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '1.5rem',
                            height: '1.5rem',
                            padding: '0 0.375rem',
                            borderRadius: '0.75rem',
                            backgroundColor: groupStroke,
                            color: '#ffffff',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                        title={`${childCount} item${childCount !== 1 ? 's' : ''}`}
                    >
                        {childCount}
                    </span>
                )}
            </div>
        );
    }

    // Expanded view
    return (
        <>
            <NodeResizer
                minWidth={MIN_WIDTH}
                minHeight={MIN_HEIGHT}
                isVisible={selected}
                lineStyle={{ borderColor: groupStroke }}
                handleStyle={{ backgroundColor: groupStroke, borderColor: groupStroke }}
            />
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: groupFill,
                    border: `${style?.strokeWidth ?? 2}px dashed ${groupStroke}`,
                    borderRadius: style?.cornerRadius ?? 8,
                    display: 'flex',
                    flexDirection: 'column',
                    outline: selected ? `2px solid ${groupStroke}` : 'none',
                    outlineOffset: '2px',
                    overflow: 'hidden',
                }}
            >
                {/* Connection Handles - 4 bidirectional handles (works with ConnectionMode.Loose) */}
                <Handle
                    type="source"
                    position={Position.Top}
                    id="top"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="right"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="bottom"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />
                <Handle
                    type="source"
                    position={Position.Left}
                    id="left"
                    isConnectableStart={true}
                    isConnectableEnd={true}
                />

                {/* Header with title and collapse button */}
                <div
                    style={{
                        height: HEADER_HEIGHT,
                        backgroundColor: groupStroke,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 0.5rem 0 0.75rem',
                        flexShrink: 0,
                        gap: '0.5rem',
                    }}
                >
                    {/* Collapse button */}
                    <button
                        onClick={handleToggleCollapse}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '1.25rem',
                            height: '1.25rem',
                            padding: 0,
                            border: 'none',
                            borderRadius: '0.25rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'background-color 0.15s ease',
                        }}
                        title="Collapse group"
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        <ChevronDownIcon />
                    </button>

                    {/* Label */}
                    <span
                        style={{
                            fontSize: labelStyle.fontSize ?? 12,
                            fontFamily: labelStyle.fontFamily,
                            fontWeight: 600,
                            color: '#ffffff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                        }}
                    >
                        {label}
                    </span>

                    {/* Child count badge */}
                    {childCount > 0 && (
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '1.25rem',
                                height: '1.25rem',
                                padding: '0 0.375rem',
                                borderRadius: '0.625rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                color: '#ffffff',
                                fontSize: '0.625rem',
                                fontWeight: 600,
                                flexShrink: 0,
                            }}
                            title={`${childCount} item${childCount !== 1 ? 's' : ''}`}
                        >
                            {childCount}
                        </span>
                    )}
                </div>

                {/* Content area for child nodes */}
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                    }}
                />
            </div>
        </>
    );
});

GroupNode.displayName = 'GroupNode';
