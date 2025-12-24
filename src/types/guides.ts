/**
 * WB Guides - Type Definitions
 * 
 * Types for alignment guides and snapping system
 */

import { Point } from './canvas';

// =============================================================================
// Guide Types
// =============================================================================

/**
 * Represents a single alignment guide (vertical or horizontal line)
 */
export interface Guide {
    readonly type: 'vertical' | 'horizontal';
    readonly position: number;
    readonly elementIds: readonly string[];
    readonly isActive: boolean;
}

/**
 * Represents a snap point for element alignment
 */
export interface SnapPoint {
    readonly x?: number;
    readonly y?: number;
    readonly type: 'grid' | 'edge' | 'center' | 'distance';
    readonly distance: number;
}

/**
 * Configuration for guides and snapping behavior
 */
export interface GuidesConfig {
    readonly showGuides: boolean;
    readonly snapToGrid: boolean;
    readonly snapToElements: boolean;
    readonly snapThreshold: number; // pixels
    readonly gridSize: number;
}

/**
 * Result of snap calculation
 */
export interface SnapResult {
    readonly x: number;
    readonly y: number;
    readonly snappedX: boolean;
    readonly snappedY: boolean;
    readonly guides: readonly Guide[];
}

/**
 * Alignment type for checking element alignment
 */
export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

// =============================================================================
// Error Types
// =============================================================================

/**
 * Custom error for guide-related operations
 */
export class GuideError extends Error {
    /**
     * Create a new GuideError
     * @param message - Error message
     * @param context - Additional context information
     */
    constructor(
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'GuideError';
        Object.setPrototypeOf(this, GuideError.prototype);
    }
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Default guides configuration
 */
export const DEFAULT_GUIDES_CONFIG: GuidesConfig = {
    showGuides: true,
    snapToGrid: true,
    snapToElements: true,
    snapThreshold: 10,
    gridSize: 20,
};
