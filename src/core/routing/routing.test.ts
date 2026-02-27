/**
 * Auto-Routing System - Unit Tests
 * 
 * Comprehensive test suite for all routing implementations.
 * Target: 100% code coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Point, Bounds } from '../../types/canvas';
import { StraightRouter } from './straight-router';
import { ElbowRouter } from './elbow-router';
import { CurvedRouter } from './curved-router';
import { RouterRegistry, routerRegistry } from './registry';
import type { Router } from './types';
import { RoutingError } from './types';

// =============================================================================
// StraightRouter Tests
// =============================================================================

describe('StraightRouter', () => {
    let router: StraightRouter;

    beforeEach(() => {
        router = new StraightRouter();
    });

    describe('type property', () => {
        it('should have type "straight"', () => {
            expect(router.type).toBe('straight');
        });
    });

    describe('route()', () => {
        it('should return exactly two points', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(2);
        });

        it('should return from point as first waypoint', () => {
            const from: Point = { x: 10, y: 20 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints[0]).toEqual(from);
        });

        it('should return to point as second waypoint', () => {
            const from: Point = { x: 10, y: 20 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints[1]).toEqual(to);
        });

        it('should handle horizontal line', () => {
            const from: Point = { x: 0, y: 50 };
            const to: Point = { x: 100, y: 50 };

            const waypoints = router.route(from, to);

            expect(waypoints).toEqual([from, to]);
        });

        it('should handle vertical line', () => {
            const from: Point = { x: 50, y: 0 };
            const to: Point = { x: 50, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toEqual([from, to]);
        });

        it('should handle diagonal line', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toEqual([from, to]);
        });

        it('should handle negative coordinates', () => {
            const from: Point = { x: -50, y: -50 };
            const to: Point = { x: 50, y: 50 };

            const waypoints = router.route(from, to);

            expect(waypoints).toEqual([from, to]);
        });

        it('should handle same start and end point', () => {
            const point: Point = { x: 50, y: 50 };

            const waypoints = router.route(point, point);

            expect(waypoints).toEqual([point, point]);
        });

        it('should ignore obstacles parameter', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toEqual([from, to]);
        });

        it('should throw error for invalid from point (NaN)', () => {
            const from: Point = { x: NaN, y: 0 };
            const to: Point = { x: 100, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid starting point for straight routing'
            );
        });

        it('should throw error for invalid to point (Infinity)', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: Infinity, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid ending point for straight routing'
            );
        });

        it('should throw error for invalid from point (missing x)', () => {
            const from = { y: 0 } as any;
            const to: Point = { x: 100, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid starting point for straight routing'
            );
        });

        it('should throw error for invalid to point (missing y)', () => {
            const from: Point = { x: 0, y: 0 };
            const to = { x: 100 } as any;

            expect(() => router.route(from, to)).toThrow(
                'Invalid ending point for straight routing'
            );
        });
    });
});

// =============================================================================
// ElbowRouter Tests
// =============================================================================

describe('ElbowRouter', () => {
    let router: ElbowRouter;

    beforeEach(() => {
        router = new ElbowRouter();
    });

    describe('type property', () => {
        it('should have type "elbow"', () => {
            expect(router.type).toBe('elbow');
        });
    });

    describe('route()', () => {
        it('should return exactly four points', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
        });

        it('should create L-shaped path', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            // First point is from
            expect(waypoints[0]).toEqual(from);
            // Second point is at midpoint X, from Y
            expect(waypoints[1]).toEqual({ x: 50, y: 0 });
            // Third point is at midpoint X, to Y
            expect(waypoints[2]).toEqual({ x: 50, y: 100 });
            // Fourth point is to
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle horizontal distance > vertical distance', () => {
            const from: Point = { x: 0, y: 50 };
            const to: Point = { x: 200, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle vertical distance > horizontal distance', () => {
            const from: Point = { x: 50, y: 0 };
            const to: Point = { x: 100, y: 200 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle negative coordinates', () => {
            const from: Point = { x: -100, y: -100 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle same start and end point', () => {
            const point: Point = { x: 50, y: 50 };

            const waypoints = router.route(point, point);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(point);
            expect(waypoints[3]).toEqual(point);
        });

        it('should avoid obstacles when possible', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };
            const obstacles: Bounds[] = [
                { x: 40, y: -10, width: 20, height: 20 },
            ];

            const waypoints = router.route(from, to, obstacles);

            // Should still return 4 points
            expect(waypoints).toHaveLength(4);
        });

        it('should try alternative routing when primary path intersects obstacle', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };
            // Obstacle at midpoint of primary path
            const obstacles: Bounds[] = [
                { x: 40, y: -10, width: 20, height: 20 },
            ];

            const waypoints = router.route(from, to, obstacles);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should return original path if both alternatives intersect', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };
            // Large obstacle covering both paths
            const obstacles: Bounds[] = [
                { x: -50, y: -50, width: 200, height: 200 },
            ];

            const waypoints = router.route(from, to, obstacles);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle empty obstacles array', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to, []);

            expect(waypoints).toHaveLength(4);
        });

        it('should throw error for invalid from point', () => {
            const from: Point = { x: NaN, y: 0 };
            const to: Point = { x: 100, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid starting point for elbow routing'
            );
        });

        it('should throw error for invalid to point', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: Infinity, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid ending point for elbow routing'
            );
        });
    });
});

// =============================================================================
// CurvedRouter Tests
// =============================================================================

describe('CurvedRouter', () => {
    let router: CurvedRouter;

    beforeEach(() => {
        router = new CurvedRouter();
    });

    describe('type property', () => {
        it('should have type "curved"', () => {
            expect(router.type).toBe('curved');
        });
    });

    describe('route()', () => {
        it('should return exactly four points', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
        });

        it('should return from point as first waypoint', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints[0]).toEqual(from);
        });

        it('should return to point as last waypoint', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints[3]).toEqual(to);
        });

        it('should calculate control points correctly', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            // CP1 should be at 30% of horizontal distance, at from Y
            expect(waypoints[1]).toEqual({ x: 30, y: 0 });
            // CP2 should be at 70% of horizontal distance, at to Y
            expect(waypoints[2]).toEqual({ x: 70, y: 100 });
        });

        it('should handle horizontal line', () => {
            const from: Point = { x: 0, y: 50 };
            const to: Point = { x: 100, y: 50 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
            // CP1 at 30% horizontal, from Y
            expect(waypoints[1]).toEqual({ x: 30, y: 50 });
            // CP2 at 70% horizontal, to Y
            expect(waypoints[2]).toEqual({ x: 70, y: 50 });
        });

        it('should handle vertical line', () => {
            const from: Point = { x: 50, y: 0 };
            const to: Point = { x: 50, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle negative coordinates', () => {
            const from: Point = { x: -100, y: -100 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle same start and end point', () => {
            const point: Point = { x: 50, y: 50 };

            const waypoints = router.route(point, point);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(point);
            expect(waypoints[3]).toEqual(point);
            // Control points should be at same location
            expect(waypoints[1]).toEqual(point);
            expect(waypoints[2]).toEqual(point);
        });

        it('should ignore obstacles parameter', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };
            const obstacles: Bounds[] = [
                { x: 40, y: 40, width: 20, height: 20 },
            ];

            const waypoints = router.route(from, to, obstacles);

            expect(waypoints).toHaveLength(4);
        });

        it('should throw error for invalid from point', () => {
            const from: Point = { x: NaN, y: 0 };
            const to: Point = { x: 100, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid starting point for curved routing'
            );
        });

        it('should throw error for invalid to point', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: Infinity, y: 100 };

            expect(() => router.route(from, to)).toThrow(
                'Invalid ending point for curved routing'
            );
        });

        it('should handle large distances', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 10000, y: 10000 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });

        it('should handle very small distances', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 0.1, y: 0.1 };

            const waypoints = router.route(from, to);

            expect(waypoints).toHaveLength(4);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[3]).toEqual(to);
        });
    });
});

// =============================================================================
// RouterRegistry Tests
// =============================================================================

describe('RouterRegistry', () => {
    let registry: RouterRegistry;

    beforeEach(() => {
        registry = new RouterRegistry();
    });

    describe('constructor', () => {
        it('should register default routers', () => {
            expect(registry.size()).toBe(3);
        });

        it('should register straight router', () => {
            expect(registry.has('straight')).toBe(true);
        });

        it('should register elbow router', () => {
            expect(registry.has('elbow')).toBe(true);
        });

        it('should register curved router', () => {
            expect(registry.has('curved')).toBe(true);
        });
    });

    describe('get()', () => {
        it('should return straight router', () => {
            const router = registry.get('straight');
            expect(router.type).toBe('straight');
        });

        it('should return elbow router', () => {
            const router = registry.get('elbow');
            expect(router.type).toBe('elbow');
        });

        it('should return curved router', () => {
            const router = registry.get('curved');
            expect(router.type).toBe('curved');
        });

        it('should throw RoutingError for unknown type', () => {
            expect(() => registry.get('unknown' as any)).toThrow(RoutingError);
        });

        it('should include available types in error context', () => {
            try {
                registry.get('unknown' as any);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(RoutingError);
                expect((error as RoutingError).context?.availableTypes).toEqual([
                    'straight',
                    'elbow',
                    'curved',
                ]);
            }
        });
    });

    describe('register()', () => {
        it('should register a new router', () => {
            const newRegistry = new RouterRegistry();
            // Create a custom router with a different type
            const customRouter: Router = {
                type: 'custom' as any,
                route: () => [{ x: 0, y: 0 }],
            };

            // Should not throw
            expect(() => {
                newRegistry.register(customRouter);
            }).not.toThrow();

            // Verify it was registered
            expect(newRegistry.has('custom' as any)).toBe(true);
        });

        it('should throw error when registering duplicate type', () => {
            const customRouter = new StraightRouter();

            expect(() => registry.register(customRouter)).toThrow(RoutingError);
        });

        it('should include type in error context for duplicate', () => {
            const customRouter = new StraightRouter();

            try {
                registry.register(customRouter);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(RoutingError);
                expect((error as RoutingError).context?.type).toBe('straight');
            }
        });
    });

    describe('route()', () => {
        it('should route using straight router', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = registry.route(from, to, { type: 'straight' });

            expect(waypoints).toHaveLength(2);
        });

        it('should route using elbow router', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = registry.route(from, to, { type: 'elbow' });

            expect(waypoints).toHaveLength(4);
        });

        it('should route using curved router', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            const waypoints = registry.route(from, to, { type: 'curved' });

            expect(waypoints).toHaveLength(4);
        });

        it('should pass obstacles to router', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };
            const obstacles: Bounds[] = [
                { x: 40, y: 40, width: 20, height: 20 },
            ];

            const waypoints = registry.route(from, to, {
                type: 'elbow',
                obstacles,
            });

            expect(waypoints).toHaveLength(4);
        });

        it('should throw error for unknown routing type', () => {
            const from: Point = { x: 0, y: 0 };
            const to: Point = { x: 100, y: 100 };

            expect(() =>
                registry.route(from, to, { type: 'unknown' as any })
            ).toThrow(RoutingError);
        });
    });

    describe('getAllTypes()', () => {
        it('should return all registered types', () => {
            const types = registry.getAllTypes();

            expect(types).toContain('straight');
            expect(types).toContain('elbow');
            expect(types).toContain('curved');
        });

        it('should return array with correct length', () => {
            const types = registry.getAllTypes();

            expect(types).toHaveLength(3);
        });
    });

    describe('has()', () => {
        it('should return true for registered type', () => {
            expect(registry.has('straight')).toBe(true);
        });

        it('should return false for unregistered type', () => {
            expect(registry.has('unknown' as any)).toBe(false);
        });
    });

    describe('size()', () => {
        it('should return number of registered routers', () => {
            expect(registry.size()).toBe(3);
        });

        it('should update size after registration', () => {
            const newRegistry = new RouterRegistry();
            expect(newRegistry.size()).toBe(3);
        });
    });
});

// =============================================================================
// Global routerRegistry Tests
// =============================================================================

describe('Global routerRegistry singleton', () => {
    it('should be a RouterRegistry instance', () => {
        expect(routerRegistry).toBeInstanceOf(RouterRegistry);
    });

    it('should have all default routers registered', () => {
        expect(routerRegistry.has('straight')).toBe(true);
        expect(routerRegistry.has('elbow')).toBe(true);
        expect(routerRegistry.has('curved')).toBe(true);
    });

    it('should be usable for routing', () => {
        const from: Point = { x: 0, y: 0 };
        const to: Point = { x: 100, y: 100 };

        const waypoints = routerRegistry.route(from, to, { type: 'elbow' });

        expect(waypoints).toHaveLength(4);
    });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration: Multiple routers', () => {
    it('should produce different routes for same points', () => {
        const from: Point = { x: 0, y: 0 };
        const to: Point = { x: 100, y: 100 };

        const straightWaypoints = routerRegistry.route(from, to, {
            type: 'straight',
        });
        const elbowWaypoints = routerRegistry.route(from, to, {
            type: 'elbow',
        });
        const curvedWaypoints = routerRegistry.route(from, to, {
            type: 'curved',
        });

        expect(straightWaypoints).toHaveLength(2);
        expect(elbowWaypoints).toHaveLength(4);
        expect(curvedWaypoints).toHaveLength(4);

        // All should start and end at same points
        expect(straightWaypoints[0]).toEqual(from);
        expect(elbowWaypoints[0]).toEqual(from);
        expect(curvedWaypoints[0]).toEqual(from);

        expect(straightWaypoints[1]).toEqual(to);
        expect(elbowWaypoints[3]).toEqual(to);
        expect(curvedWaypoints[3]).toEqual(to);
    });

    it('should handle routing with all types', () => {
        const from: Point = { x: 50, y: 50 };
        const to: Point = { x: 200, y: 300 };

        const types: Array<'straight' | 'elbow' | 'curved'> = [
            'straight',
            'elbow',
            'curved',
        ];

        types.forEach((type) => {
            const waypoints = routerRegistry.route(from, to, { type });

            expect(waypoints).toBeDefined();
            expect(waypoints.length).toBeGreaterThan(0);
            expect(waypoints[0]).toEqual(from);
            expect(waypoints[waypoints.length - 1]).toEqual(to);
        });
    });
});
