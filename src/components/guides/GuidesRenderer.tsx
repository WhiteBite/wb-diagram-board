/**
 * WB Guides - Guides Renderer Component
 * 
 * Renders alignment guides and snap points on canvas
 */

import { memo, useMemo } from 'react';
import { Guide, SnapPoint } from '../../types/guides';
import { Transform } from '../../types/canvas';

// =============================================================================
// Component Props
// =============================================================================

interface GuidesRendererProps {
    readonly guides: readonly Guide[];
    readonly snapPoints: readonly SnapPoint[];
    readonly transform: Transform;
    readonly visible: boolean;
    readonly canvasWidth?: number;
    readonly canvasHeight?: number;
}

// =============================================================================
// Constants
// =============================================================================

const GUIDE_COLOR = '#3b82f6'; // Blue
const GUIDE_WIDTH = 1;
const GUIDE_DASH_ARRAY = '4,4';
const SNAP_POINT_RADIUS = 4;
const SNAP_POINT_COLOR = '#ef4444'; // Red
const SNAP_POINT_FILL = 'rgba(239, 68, 68, 0.1)';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert canvas coordinates to screen coordinates
 * @param canvasX - Canvas X coordinate
 * @param canvasY - Canvas Y coordinate
 * @param transform - Canvas transform
 * @returns Screen coordinates
 */
function canvasToScreen(canvasX: number, canvasY: number, transform: Transform) {
    return {
        x: canvasX * transform.scale + transform.x,
        y: canvasY * transform.scale + transform.y,
    };
}

// =============================================================================
// Component
// =============================================================================

/**
 * Renders alignment guides and snap points on the canvas
 * 
 * Features:
 * - Vertical and horizontal guides
 * - Snap point indicators
 * - Transform-aware rendering
 * - Memoized for performance
 */
export const GuidesRenderer = memo(function GuidesRenderer({
    guides,
    snapPoints,
    transform,
    visible,
    canvasWidth = window.innerWidth,
    canvasHeight = window.innerHeight,
}: GuidesRendererProps) {
    if (!visible || guides.length === 0) {
        return null;
    }

    // Memoize guide lines to avoid unnecessary recalculations
    const guideLines = useMemo(() => {
        return guides.map((guide, index) => {
            if (guide.type === 'vertical') {
                const screenX = guide.position * transform.scale + transform.x;

                // Only render if visible in viewport
                if (screenX < -100 || screenX > canvasWidth + 100) {
                    return null;
                }

                return (
                    <line
                        key={`guide-v-${index}`}
                        x1={screenX}
                        y1={-1000}
                        x2={screenX}
                        y2={canvasHeight + 1000}
                        stroke={GUIDE_COLOR}
                        strokeWidth={GUIDE_WIDTH}
                        strokeDasharray={GUIDE_DASH_ARRAY}
                        opacity={0.6}
                        pointerEvents="none"
                    />
                );
            } else {
                const screenY = guide.position * transform.scale + transform.y;

                // Only render if visible in viewport
                if (screenY < -100 || screenY > canvasHeight + 100) {
                    return null;
                }

                return (
                    <line
                        key={`guide-h-${index}`}
                        x1={-1000}
                        y1={screenY}
                        x2={canvasWidth + 1000}
                        y2={screenY}
                        stroke={GUIDE_COLOR}
                        strokeWidth={GUIDE_WIDTH}
                        strokeDasharray={GUIDE_DASH_ARRAY}
                        opacity={0.6}
                        pointerEvents="none"
                    />
                );
            }
        });
    }, [guides, transform, canvasWidth, canvasHeight]);

    // Memoize snap points to avoid unnecessary recalculations
    const snapPointElements = useMemo(() => {
        return snapPoints
            .filter((point) => {
                // Only render snap points that are close to the viewport
                if (point.x !== undefined) {
                    const screenX = point.x * transform.scale + transform.x;
                    if (screenX < -100 || screenX > canvasWidth + 100) {
                        return false;
                    }
                }
                if (point.y !== undefined) {
                    const screenY = point.y * transform.scale + transform.y;
                    if (screenY < -100 || screenY > canvasHeight + 100) {
                        return false;
                    }
                }
                return true;
            })
            .map((point, index) => {
                if (point.x !== undefined && point.y !== undefined) {
                    // Point snap (both X and Y)
                    const screenPos = canvasToScreen(point.x, point.y, transform);
                    return (
                        <circle
                            key={`snap-point-${index}`}
                            cx={screenPos.x}
                            cy={screenPos.y}
                            r={SNAP_POINT_RADIUS}
                            fill={SNAP_POINT_FILL}
                            stroke={SNAP_POINT_COLOR}
                            strokeWidth={1}
                            opacity={0.8}
                            pointerEvents="none"
                        />
                    );
                } else if (point.x !== undefined) {
                    // Vertical snap line
                    const screenX = point.x * transform.scale + transform.x;
                    return (
                        <line
                            key={`snap-line-v-${index}`}
                            x1={screenX}
                            y1={-500}
                            x2={screenX}
                            y2={canvasHeight + 500}
                            stroke={SNAP_POINT_COLOR}
                            strokeWidth={1}
                            opacity={0.4}
                            pointerEvents="none"
                        />
                    );
                } else if (point.y !== undefined) {
                    // Horizontal snap line
                    const screenY = point.y * transform.scale + transform.y;
                    return (
                        <line
                            key={`snap-line-h-${index}`}
                            x1={-500}
                            y1={screenY}
                            x2={canvasWidth + 500}
                            y2={screenY}
                            stroke={SNAP_POINT_COLOR}
                            strokeWidth={1}
                            opacity={0.4}
                            pointerEvents="none"
                        />
                    );
                }
                return null;
            });
    }, [snapPoints, transform, canvasWidth, canvasHeight]);

    return (
        <g className="guides-renderer" pointerEvents="none">
            {guideLines}
            {snapPointElements}
        </g>
    );
});

GuidesRenderer.displayName = 'GuidesRenderer';
