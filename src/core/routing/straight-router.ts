/**
 * Straight Router - Direct line routing
 * 
 * Implements the simplest routing strategy: a direct line between two points.
 */

import type { Point } from '../../types/canvas';
import type { Router, RoutingType } from './types';

/**
 * Router that creates a straight line between two points
 * 
 * This is the simplest routing strategy, useful for:
 * - Quick connections
 * - Minimal visual clutter
 * - Connections that don't need to avoid obstacles
 */
export class StraightRouter implements Router {
    /** Router type identifier */
    readonly type: RoutingType = 'straight';

    /**
     * Calculate a straight line route between two points
     * 
     * @param from - Starting point
     * @param to - Ending point
     * @returns Array with exactly two points: [from, to]
     * 
     * @example
     * const router = new StraightRouter();
     * const waypoints = router.route({ x: 0, y: 0 }, { x: 100, y: 100 });
     * // Returns: [{ x: 0, y: 0 }, { x: 100, y: 100 }]
     */
    route(
        from: Point,
        to: Point
    ): readonly Point[] {
        // Validate input points
        if (!this.isValidPoint(from)) {
            throw new Error('Invalid starting point for straight routing');
        }
        if (!this.isValidPoint(to)) {
            throw new Error('Invalid ending point for straight routing');
        }

        // Return direct line between points
        return [from, to] as const;
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
