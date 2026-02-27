/**
 * Auto-Routing System - Type Definitions
 * 
 * Core types and interfaces for the routing system that handles
 * connector path calculation between elements.
 */

import type { Point, Bounds } from '../../types/canvas';

/**
 * Supported routing types for connectors
 */
export type RoutingType = 'straight' | 'elbow' | 'curved';

/**
 * Router interface that all routing implementations must follow
 */
export interface Router {
    /** The type of routing this router implements */
    readonly type: RoutingType;

    /**
     * Calculate the route (waypoints) between two points
     * 
     * @param from - Starting point
     * @param to - Ending point
     * @param obstacles - Optional array of obstacles to avoid
     * @returns Array of waypoints defining the route path
     */
    route(from: Point, to: Point, obstacles?: readonly Bounds[]): readonly Point[];
}

/**
 * Options for routing calculation
 */
export interface RoutingOptions {
    /** Type of routing to use */
    readonly type: RoutingType;

    /** Optional obstacles to avoid during routing */
    readonly obstacles?: readonly Bounds[];

    /** Padding distance from obstacles (in pixels) */
    readonly padding?: number;
}

/**
 * Custom error class for routing-related errors
 */
export class RoutingError extends Error {
    /**
     * Create a new RoutingError
     * 
     * @param message - Error message
     * @param context - Optional context information for debugging
     */
    constructor(
        message: string,
        public readonly context?: Readonly<Record<string, unknown>>
    ) {
        super(message);
        this.name = 'RoutingError';
        Object.setPrototypeOf(this, RoutingError.prototype);
    }
}
