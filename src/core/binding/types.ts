/**
 * WB Binding System - Types and Interfaces
 * 
 * Defines types for connector binding points on canvas elements
 */

import type { CanvasElement, Point } from '../../types/canvas';

// =============================================================================
// Binding Point Types
// =============================================================================

/**
 * Represents a binding point on a canvas element where a connector can attach
 * 
 * @example
 * const binding: BindingPoint = {
 *   elementId: 'rect-123',
 *   position: 'top',
 *   offset: 0.5 // middle of top edge
 * };
 */
export interface BindingPoint {
    /** ID of the element this binding point belongs to */
    readonly elementId: string;

    /** Position on the element edge: top, right, bottom, left, or center */
    readonly position: 'top' | 'right' | 'bottom' | 'left' | 'center';

    /** Offset along the edge (0-1, where 0 is start and 1 is end) */
    readonly offset: number;
}

// =============================================================================
// Binding Resolver Interface
// =============================================================================

/**
 * Interface for resolving binding points on different element types
 * 
 * Each element type (shape, text, sticky) has its own resolver implementation
 */
export interface BindingResolver {
    /**
     * Get the world coordinates of a binding point on an element
     * 
     * @param element - The canvas element
     * @param position - The position on the element ('top', 'right', 'bottom', 'left', 'center')
     * @returns The world coordinates of the binding point
     * @throws BindingError if position is invalid
     */
    getBindingPoint(element: CanvasElement, position: string): Point;

    /**
     * Get all available binding positions for an element type
     * 
     * @param element - The canvas element
     * @returns Array of available position strings
     */
    getAvailablePositions(element: CanvasElement): readonly string[];

    /**
     * Check if a position is valid for this element type
     * 
     * @param position - The position to validate
     * @returns true if position is valid
     */
    isValidPosition(position: string): boolean;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Custom error for binding system operations
 * 
 * @example
 * throw new BindingError('Invalid binding position', { position: 'invalid', elementId: 'rect-1' });
 */
export class BindingError extends Error {
    /**
     * Create a new BindingError
     * 
     * @param message - Error message
     * @param context - Additional context information
     */
    constructor(
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'BindingError';
        Object.setPrototypeOf(this, BindingError.prototype);
    }
}

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Result of binding point validation
 */
export interface BindingValidationResult {
    readonly isValid: boolean;
    readonly error?: string;
}
