/**
 * SmartGuides Component
 *
 * Renders alignment guide lines on the canvas when dragging nodes.
 * Uses SVG overlay for crisp rendering.
 */

import { memo } from 'react';
import type { GuideLine } from '../../hooks/useSmartGuides';

// =============================================================================
// Types
// =============================================================================

export interface SmartGuidesProps {
    /** Guide lines to render */
    guides: GuideLine[];
    /** Guide line color */
    color?: string;
    /** Guide line width */
    strokeWidth?: number;
    /** Dark mode */
    isDark?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export const SmartGuides = memo(function SmartGuides({
    guides,
    color,
    strokeWidth = 1,
    isDark = false,
}: SmartGuidesProps) {
    if (guides.length === 0) {
        return null;
    }

    const guideColor = color ?? (isDark ? '#818cf8' : '#6366f1');

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 1000,
            }}
        >
            <defs>
                {/* Dashed pattern for guides */}
                <pattern
                    id="guide-dash"
                    patternUnits="userSpaceOnUse"
                    width="8"
                    height="1"
                >
                    <line
                        x1="0"
                        y1="0"
                        x2="4"
                        y2="0"
                        stroke={guideColor}
                        strokeWidth={strokeWidth}
                    />
                </pattern>
            </defs>

            {guides.map((guide) => (
                <line
                    key={guide.id}
                    x1={guide.orientation === 'vertical' ? guide.position : guide.start}
                    y1={guide.orientation === 'vertical' ? guide.start : guide.position}
                    x2={guide.orientation === 'vertical' ? guide.position : guide.end}
                    y2={guide.orientation === 'vertical' ? guide.end : guide.position}
                    stroke={guideColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray="4 4"
                    opacity={0.8}
                />
            ))}

            {/* Render small circles at intersection points */}
            {guides.map((guide) => (
                <g key={`${guide.id}-markers`}>
                    <circle
                        cx={guide.orientation === 'vertical' ? guide.position : guide.start}
                        cy={guide.orientation === 'vertical' ? guide.start : guide.position}
                        r={3}
                        fill={guideColor}
                        opacity={0.6}
                    />
                    <circle
                        cx={guide.orientation === 'vertical' ? guide.position : guide.end}
                        cy={guide.orientation === 'vertical' ? guide.end : guide.position}
                        r={3}
                        fill={guideColor}
                        opacity={0.6}
                    />
                </g>
            ))}
        </svg>
    );
});

export default SmartGuides;
