/**
 * Line constraint utilities for Shift key behavior
 */

import { Point } from '../types/canvas';

/**
 * Apply Shift key constraint to line drawing
 * Snaps to horizontal, vertical, or 45-degree angles
 */
export function applyLineConstraint(start: Point, end: Point): Point {
    let dx = end.x - start.x;
    let dy = end.y - start.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Determine which constraint to apply
    if (absDx > absDy * 2) {
        // Horizontal (dx > 2*dy) - lock to horizontal
        dy = 0;
    } else if (absDy > absDx * 2) {
        // Vertical (dy > 2*dx) - lock to vertical
        dx = 0;
    } else {
        // 45-degree diagonal - make dx and dy equal
        const minAbs = Math.min(absDx, absDy);
        dx = dx >= 0 ? minAbs : -minAbs;
        dy = dy >= 0 ? minAbs : -minAbs;
    }

    return {
        x: start.x + dx,
        y: start.y + dy,
    };
}
