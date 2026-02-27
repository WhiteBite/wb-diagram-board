/**
 * Router Registry - Central registry for all routing implementations
 * 
 * Manages router instances and provides a unified interface for routing.
 * Implements the Registry pattern for extensible routing support.
 */

import type { Point } from '../../types/canvas';
import type { Router, RoutingType, RoutingOptions } from './types';
import { RoutingError } from './types';
import { StraightRouter } from './straight-router';
import { ElbowRouter } from './elbow-router';
import { CurvedRouter } from './curved-router';

/**
 * Central registry for all router implementations
 * 
 * Provides:
 * - Router registration and retrieval
 * - Unified routing interface
 * - Type-safe router access
 * 
 * This is a singleton that should be used throughout the application.
 */
export class RouterRegistry {
    /** Map of routing types to router instances */
    private readonly routers = new Map<RoutingType, Router>();

    /**
     * Create a new RouterRegistry and register default routers
     */
    constructor() {
        this.registerDefaultRouters();
    }

    /**
     * Register all default routing implementations
     * 
     * Registers:
     * - StraightRouter: Direct line routing
     * - ElbowRouter: L-shaped routing with obstacle avoidance
     * - CurvedRouter: Bezier curve routing
     */
    private registerDefaultRouters(): void {
        this.register(new StraightRouter());
        this.register(new ElbowRouter());
        this.register(new CurvedRouter());
    }

    /**
     * Register a new router implementation
     * 
     * @param router - Router instance to register
     * @throws RoutingError if router type is already registered
     * 
     * @example
     * const customRouter = new CustomRouter();
     * registry.register(customRouter);
     */
    register(router: Router): void {
        if (this.routers.has(router.type)) {
            throw new RoutingError(
                `Router type '${router.type}' is already registered`,
                { type: router.type }
            );
        }

        this.routers.set(router.type, router);
    }

    /**
     * Get a router by type
     * 
     * @param type - Routing type to retrieve
     * @returns Router instance for the given type
     * @throws RoutingError if router type is not found
     * 
     * @example
     * const router = registry.get('elbow');
     * const waypoints = router.route(from, to);
     */
    get(type: RoutingType): Router {
        const router = this.routers.get(type);

        if (!router) {
            throw new RoutingError(
                `No router registered for type: '${type}'`,
                {
                    type,
                    availableTypes: this.getAllTypes(),
                }
            );
        }

        return router;
    }

    /**
     * Calculate a route using the specified routing type
     * 
     * Convenience method that combines router retrieval and routing calculation.
     * 
     * @param from - Starting point
     * @param to - Ending point
     * @param options - Routing options including type and obstacles
     * @returns Array of waypoints defining the route
     * @throws RoutingError if router type is not found
     * 
     * @example
     * const waypoints = registry.route(
     *   { x: 0, y: 0 },
     *   { x: 100, y: 100 },
     *   { type: 'elbow', obstacles: [] }
     * );
     */
    route(
        from: Point,
        to: Point,
        options: RoutingOptions
    ): readonly Point[] {
        const router = this.get(options.type);
        return router.route(from, to, options.obstacles);
    }

    /**
     * Get all available routing types
     * 
     * @returns Array of all registered routing types
     * 
     * @example
     * const types = registry.getAllTypes();
     * // Returns: ['straight', 'elbow', 'curved']
     */
    getAllTypes(): readonly RoutingType[] {
        return Array.from(this.routers.keys());
    }

    /**
     * Check if a routing type is registered
     * 
     * @param type - Routing type to check
     * @returns true if router is registered for this type
     * 
     * @example
     * if (registry.has('custom')) {
     *   // Use custom router
     * }
     */
    has(type: RoutingType): boolean {
        return this.routers.has(type);
    }

    /**
     * Get the number of registered routers
     * 
     * @returns Number of registered routers
     */
    size(): number {
        return this.routers.size;
    }
}

/**
 * Global singleton instance of RouterRegistry
 * 
 * Use this instance throughout the application for routing operations.
 * 
 * @example
 * import { routerRegistry } from './registry';
 * 
 * const waypoints = routerRegistry.route(from, to, { type: 'elbow' });
 */
export const routerRegistry = new RouterRegistry();
