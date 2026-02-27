/**
 * Elbow Router - L-shaped routing with obstacle avoidance
 * 
 * Implements L-shaped routing (orthogonal) with basic obstacle avoidance.
 * Creates paths that follow horizontal and vertical segments.
 */

import type { Point, Bounds } from '../../types/canvas';
import type { Router, RoutingType } from './types';

/**
 * Router that creates L-shaped (orthogonal) routes between points
 * 
 * This routing strategy:
 * - Creates paths with horizontal and vertical segments only
 * - Provides better readability than straight lines
 * - Supports basic obstacle avoidance
 * - Useful for flowcharts and diagrams
 */
export class ElbowRouter implements Router {
    /** Router type identifier */
    readonly type: RoutingType = 'elbow';

    /** Default padding from obstacles */
    private readonly defaultPadding = 10;

    /**
     * Calculate an L-shaped route between two points
     * 
     * The route is created by:
     * 1. Going horizontally from start to midpoint
     * 2. Going vertically to the end point
     * 
     * @param from - Starting point
     * @param to - Ending point
     * @param obstacles - Optional obstacles to avoid
     * @returns Array of waypoints defining the L-shaped path
     * 
     * @example
     * const router = new ElbowRouter();
     * const waypoints = router.route({ x: 0, y: 0 }, { x: 100, y: 100 });
     * // Returns: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 100 }]
     */
    route(
        from: Point,
        to: Point,
        obstacles?: readonly Bounds[]
    ): readonly Point[] {
        // Validate input points
        if (!this.isValidPoint(from)) {
            throw new Error('Invalid starting point for elbow routing');
        }
        if (!this.isValidPoint(to)) {
            throw new Error('Invalid ending point for elbow routing');
        }

        // Calculate midpoint for L-shaped path
        const midX = (from.x + to.x) / 2;

        // Create waypoints for L-shaped path
        const waypoints: Point[] = [
            from,
            { x: midX, y: from.y },
            { x: midX, y: to.y },
            to,
        ];

        // Check if path intersects obstacles and adjust if needed
        if (obstacles && obstacles.length > 0) {
            return this.avoidObstacles(waypoints, obstacles);
        }

        return waypoints;
    }

    /**
     * Adjust waypoints to avoid obstacles
     * 
     * Current implementation uses a simple strategy:
     * - If the path intersects an obstacle, try alternative routing
     * - Alternative: go vertical first, then horizontal
     * 
     * @param waypoints - Original waypoints
     * @param obstacles - Obstacles to avoid
     * @returns Adjusted waypoints that avoid obstacles
     */
    private avoidObstacles(
        waypoints: Point[],
        obstacles: readonly Bounds[]
    ): readonly Point[] {
        const padding = this.defaultPadding;

        // Check if current path intersects any obstacle
        const intersectsObstacle = this.pathIntersectsObstacles(waypoints, obstacles, padding);

        if (!intersectsObstacle) {
            return waypoints;
        }

        // Try alternative routing: vertical first, then horizontal
        const from = waypoints[0];
        const to = waypoints[waypoints.length - 1];
        const midY = (from.y + to.y) / 2;

        const alternativeWaypoints: Point[] = [
            from,
            { x: from.x, y: midY },
            { x: to.x, y: midY },
            to,
        ];

        // Check if alternative path is better
        const alternativeIntersects = this.pathIntersectsObstacles(
            alternativeWaypoints,
            obstacles,
            padding
        );

        if (!alternativeIntersects) {
            return alternativeWaypoints;
        }

        // If both paths intersect, return original (MVP behavior)
        return waypoints;
    }

    /**
     * Check if a path intersects with any obstacles
     * 
     * @param waypoints - Path waypoints
     * @param obstacles - Obstacles to check
     * @param padding - Padding around obstacles
     * @returns true if path intersects any obstacle
     */
    private pathIntersectsObstacles(
        waypoints: Point[],
        obstacles: readonly Bounds[],
        padding: number
    ): boolean {
        for (let i = 0; i < waypoints.length - 1; i++) {
            const from = waypoints[i];
            const to = waypoints[i + 1];

            for (const obstacle of obstacles) {
                if (this.lineIntersectsBounds(from, to, obstacle, padding)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a line segment intersects with a bounds rectangle
     * 
     * @param from - Line start point
     * @param to - Line end point
     * @param bounds - Rectangle bounds
     * @param padding - Padding around bounds
     * @returns true if line intersects the padded bounds
     */
    private lineIntersectsBounds(
        from: Point,
        to: Point,
        bounds: Bounds,
        padding: number
    ): boolean {
        // Expand bounds by padding
        const expandedBounds = {
            x: bounds.x - padding,
            y: bounds.y - padding,
            width: bounds.width + padding * 2,
            height: bounds.height + padding * 2,
        };

        // Check if line segment intersects expanded bounds
        // For horizontal line
        if (from.y === to.y) {
            const y = from.y;
            const minX = Math.min(from.x, to.x);
            const maxX = Math.max(from.x, to.x);

            return (
                y >= expandedBounds.y &&
                y <= expandedBounds.y + expandedBounds.height &&
                maxX >= expandedBounds.x &&
                minX <= expandedBounds.x + expandedBounds.width
            );
        }

        // For vertical line
        if (from.x === to.x) {
            const x = from.x;
            const minY = Math.min(from.y, to.y);
            const maxY = Math.max(from.y, to.y);

            return (
                x >= expandedBounds.x &&
                x <= expandedBounds.x + expandedBounds.width &&
                maxY >= expandedBounds.y &&
                minY <= expandedBounds.y + expandedBounds.height
            );
        }

        return false;
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
