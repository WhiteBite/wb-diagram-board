/**
 * StickyNode - Sticky note node for XY Flow
 * 
 * Features:
 * - Multiple colors: yellow, green, blue, pink, purple, orange
 * - Auto-scaling font size based on content
 * - Markdown rendering: **bold**, *italic*, ~~strikethrough~~
 * - Folded corner effect
 */

import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import type { DiagramNode, StickyColor } from '../types';
import { DEFAULT_TEXT_STYLE } from '../types';
import { STICKY_COLORS } from '../constants';

// =============================================================================
// Constants
// =============================================================================

const MIN_WIDTH = 100;
const MIN_HEIGHT = 80;

/** Font size limits in rem */
const FONT_SIZE = {
    MIN: 0.625,  // 10px
    MAX: 1.5,    // 24px
    DEFAULT: 0.875, // 14px
} as const;

/** Border colors for each sticky color */
const BORDER_COLORS: Record<StickyColor, string> = {
    yellow: '#e6d85c',
    green: '#81c784',
    blue: '#64b5f6',
    pink: '#f48fb1',
    purple: '#ba68c8',
    orange: '#ffb74d',
};

// =============================================================================
// Markdown Parsing
// =============================================================================

/**
 * Parse inline markdown and return React elements
 */
function parseMarkdown(text: string): React.ReactNode {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, lineIndex) => (
        <span key={lineIndex}>
            {lineIndex > 0 && <br />}
            {parseInlineMarkdown(line)}
        </span>
    ));
}

/**
 * Parse inline markdown (bold, italic, strikethrough)
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let keyIndex = 0;

    // Combined regex to find all markdown patterns
    const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~)/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }

        const fullMatch = match[0];
        keyIndex++;

        // Determine which pattern matched
        if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
            const content = fullMatch.slice(2, -2);
            result.push(<strong key={keyIndex}>{content}</strong>);
        } else if (fullMatch.startsWith('~~') && fullMatch.endsWith('~~')) {
            const content = fullMatch.slice(2, -2);
            result.push(<del key={keyIndex}>{content}</del>);
        } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
            const content = fullMatch.slice(1, -1);
            result.push(<em key={keyIndex}>{content}</em>);
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : [text];
}

// =============================================================================
// Auto-scaling Hook
// =============================================================================

interface UseAutoScaleFontOptions {
    text: string;
    containerRef: React.RefObject<HTMLDivElement>;
    minFontSize?: number;
    maxFontSize?: number;
    defaultFontSize?: number;
}

/**
 * Hook to auto-scale font size based on container size and text content
 */
function useAutoScaleFont({
    text,
    containerRef,
    minFontSize = FONT_SIZE.MIN,
    maxFontSize = FONT_SIZE.MAX,
    defaultFontSize = FONT_SIZE.DEFAULT,
}: UseAutoScaleFontOptions): number {
    const [fontSize, setFontSize] = useState(defaultFontSize);

    const calculateFontSize = useCallback(() => {
        const container = containerRef.current;
        if (!container || !text) {
            setFontSize(defaultFontSize);
            return;
        }

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Create a temporary element to measure text
        const measureEl = document.createElement('div');
        measureEl.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.3;
            font-family: Inter, sans-serif;
            padding: 0;
            width: ${containerWidth}px;
        `;
        document.body.appendChild(measureEl);

        // Binary search for optimal font size
        let low = minFontSize;
        let high = maxFontSize;
        let optimalSize = defaultFontSize;

        while (high - low > 0.0625) { // 1px precision
            const mid = (low + high) / 2;
            measureEl.style.fontSize = `${mid}rem`;
            measureEl.textContent = text;

            if (measureEl.scrollHeight <= containerHeight && measureEl.scrollWidth <= containerWidth) {
                optimalSize = mid;
                low = mid;
            } else {
                high = mid;
            }
        }

        document.body.removeChild(measureEl);
        setFontSize(optimalSize);
    }, [text, containerRef, minFontSize, maxFontSize, defaultFontSize]);

    // Recalculate on text or container size change
    useEffect(() => {
        calculateFontSize();

        // Also recalculate on resize
        const resizeObserver = new ResizeObserver(() => {
            calculateFontSize();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [calculateFontSize, containerRef]);

    return fontSize;
}

// =============================================================================
// Component
// =============================================================================

export const StickyNode = memo(({ data, selected }: NodeProps<DiagramNode>) => {
    const {
        label = '',
        textStyle,
        stickyColor = 'yellow',
    } = data ?? {};

    const contentRef = useRef<HTMLDivElement>(null);
    const labelStyle = { ...DEFAULT_TEXT_STYLE, ...textStyle };
    const colorKey = (stickyColor as StickyColor) || 'yellow';
    const backgroundColor = STICKY_COLORS[colorKey] ?? STICKY_COLORS.yellow;
    const borderColor = BORDER_COLORS[colorKey] ?? BORDER_COLORS.yellow;

    // Auto-scale font size
    const autoFontSize = useAutoScaleFont({
        text: label,
        containerRef: contentRef,
        minFontSize: FONT_SIZE.MIN,
        maxFontSize: FONT_SIZE.MAX,
        defaultFontSize: (labelStyle.fontSize ?? 14) / 16, // Convert px to rem
    });

    // Parse markdown content
    const renderedContent = useMemo(() => parseMarkdown(label), [label]);

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
                    backgroundColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 2,
                    boxShadow: selected
                        ? '0 0 0 2px #3b82f6, 2px 4px 8px rgba(0, 0, 0, 0.15)'
                        : '2px 4px 8px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0.75rem',
                    transition: 'box-shadow 0.15s ease',
                    position: 'relative',
                }}
            >
                {/* Folded corner effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 20,
                        height: 20,
                        background: `linear-gradient(135deg, transparent 50%, ${borderColor} 50%)`,
                        borderBottomLeftRadius: 4,
                    }}
                />

                {/* Content container for measuring */}
                <div
                    ref={contentRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            fontSize: `${autoFontSize}rem`,
                            fontFamily: labelStyle.fontFamily,
                            fontWeight: labelStyle.fontWeight,
                            color: '#333333',
                            textAlign: 'center',
                            width: '100%',
                            wordBreak: 'break-word',
                            lineHeight: 1.3,
                            userSelect: 'none',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {renderedContent}
                    </div>
                </div>

                {/* Connection Handles - 4 bidirectional handles */}
                <Handle type="source" position={Position.Top} id="top" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Right} id="right" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Bottom} id="bottom" isConnectableStart isConnectableEnd />
                <Handle type="source" position={Position.Left} id="left" isConnectableStart isConnectableEnd />
            </div>
        </>
    );
});

StickyNode.displayName = 'StickyNode';
