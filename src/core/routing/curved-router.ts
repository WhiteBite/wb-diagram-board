/**
 * Curved Router - Bezier curve routing
 * 
 * Implements smooth curved routing using Bezier curves.
 * Creates aesthetically pleasing paths between points.
 */

import type { Point, Bounds } from '../../types/canvas';
import type { Router, RoutingType } from './types';

/**
 * Router that creates smooth curved routes using Bezier curves
 * 
 * This routing strategy:
 * - Creates smooth, aesthetically pleasing paths
 * - Uses quadratic Bezier curves
 * - Provides good visual flow
 * - Useful for flowcharts and diagrams with many connections
 */
export class CurvedRouter implements Router {
    /** Router type identifier */
    readonly type: RoutingType = 'curved';

    /** Bezier curve control point distance factor (0-1) */
    private readonly controlPointFactor = 0.3;

    /**
     * Calculate a curved route between two points using Bezier curves
     * 
     * The route is created using two control points positioned at:
     * - CP1: 30% along the horizontal distance from start
     * - CP2: 70% along the horizontal distance from start
     * 
     * @param from - Starting point
     * @param to - Ending point
     * @param _obstacles - Ignored for curved routing (MVP)
     * @returns Array of waypoints: [from, cp1, cp2, to]
     * 
     * @example
     * const router = new CurvedRouter();
     * const waypoints = router.route({ x: 0, y: 0 }, { x: 100, y: 100 });
     * // Returns: [
     * //   { x: 0, y: 0 },
     * //   { x: 30, y: 0 },
     * //   { x: 70, y: 100 },
     * //   { x: 100, y: 100 }
     * // ]
     */
    route(
        from: Point,
        to: Point,
        _obstacles?: readonly Bounds[]
    ): readonly Point[] {
        // Validate input points
        if (!this.isValidPoint(from)) {
            throw new Error('Invalid starting point for curved routing');
        }
        if (!this.isValidPoint(to)) {
            throw new Error('Invalid ending point for curved routing');
        }

        // Calculate control points for Bezier curve
        const controlPoints = this.calculateControlPoints(from, to);

        // Return waypoints: start, control point 1, control point 2, end
        return [from, controlPoints.cp1, controlPoints.cp2, to];
    }

    /**
     * Calculate control points for a Bezier curve
     * 
     * Uses a simple strategy:
     * - CP1 is positioned at 30% of horizontal distance, at start Y
     * - CP2 is positioned at 70% of horizontal distance, at end Y
     * 
     * This creates a smooth S-curve that flows naturally from start to end.
     * 
     * @param from - Starting point
     * @param to - Ending point
     * @returns Object with cp1 and cp2 control points
     */
    private calculateControlPoints(
        from: Point,
        to: Point
    ): Readonly<{ cp1: Point; cp2: Point }> {
        const dx = to.x - from.x;

        // Control point 1: positioned at controlPointFactor along X, at start Y
        const cp1: Point = {
            x: from.x + dx * this.controlPointFactor,
            y: from.y,
        };

        // Control point 2: positioned at (1 - controlPointFactor) along X, at end Y
        const cp2: Point = {
            x: to.x - dx * this.controlPointFactor,
            y: to.y,
        };

        return { cp1, cp2 };
    }

    /**
     * Validate that a point has valid coordinates
     * 
     * @param point - Point to validate
     * @returns true if point is valid
     */
    private isValidPoint(point: Point): boolean {
        return (
            typeof point.x === 'number' &&
            typeof point.y === 'number' &&
            isFinite(point.x) &&
            isFinite(point.y)
        );
    }
}
