/**
 * ImageNode - Image node for XY Flow
 *
 * Features:
 * - Support for URL and base64 images
 * - Resizable with aspect ratio preservation option
 * - Minimum size constraints (50x50)
 * - Connection handles on all sides
 */

import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode } from '../types';

// =============================================================================
// Constants
// =============================================================================

const MIN_WIDTH = 50;
const MIN_HEIGHT = 50;

// =============================================================================
// Component
// =============================================================================

export const ImageNode = memo(({ data, selected }: NodeProps<DiagramNode>) => {
    const {
        src = '',
        alt = 'Image',
        width,
        height,
    } = (data ?? {}) as {
        src?: string;
        alt?: string;
        width?: number;
        height?: number;
    };

    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleImageLoad = useCallback(() => {
        setImageError(false);
    }, []);

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
                    backgroundColor: imageError ? '#f3f4f6' : 'transparent',
                    border: selected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: 4,
                    boxShadow: selected
                        ? '0 0 0 2px rgba(59, 130, 246, 0.3)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                }}
            >
                {imageError || !src ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            padding: '0.5rem',
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span style={{ marginTop: '0.25rem' }}>
                            {!src ? 'No image' : 'Failed to load'}
                        </span>
                    </div>
                ) : (
                    <img
                        src={src}
                        alt={alt}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        style={{
                            width: width ? `${width}px` : '100%',
                            height: height ? `${height}px` : '100%',
                            objectFit: 'contain',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            userSelect: 'none',
                            pointerEvents: 'none',
                        }}
                        draggable={false}
                    />
                )}

                {/* Connection Handles - 4 bidirectional handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />
            </div>
        </>
    );
});

ImageNode.displayName = 'ImageNode';
