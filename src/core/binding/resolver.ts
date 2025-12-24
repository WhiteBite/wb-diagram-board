/**
 * WB Binding System - Binding Resolvers
 * 
 * Implementations for resolving binding points on different element types
 */

import type {
    CanvasElement,
    ShapeElement,
    TextElement,
    StickyElement,
    Point,
} from '../../types/canvas';
import { BindingError, type BindingResolver } from './types';

type Position = 'top' | 'right' | 'bottom' | 'left' | 'center';

// =============================================================================
// Shape Binding Resolver
// =============================================================================

/**
 * Resolver for shape elements (rectangle, ellipse, diamond, triangle)
 * 
 * Provides binding points on the edges and center of shapes
 */
export class ShapeBindingResolver implements BindingResolver {
    private readonly positions: readonly Position[] = ['top', 'right', 'bottom', 'left', 'center'];

    /**
     * Get the world coordinates of a binding point on a shape
     * 
     * @param element - The shape element
     * @param position - The position on the shape
     * @returns The world coordinates of the binding point
     * @throws BindingError if position is invalid
     */
    getBindingPoint(element: CanvasElement, position: string): Point {
        if (!this.isValidPosition(position)) {
            throw new BindingError(`Invalid position for shape: ${position}`, {
                elementId: element.id,
                position,
                validPositions: this.positions,
            });
        }

        const shape = element as ShapeElement;
        const centerX = shape.x + shape.width / 2;
        const centerY = shape.y + shape.height / 2;

        switch (position) {
            case 'top':
                return { x: centerX, y: shape.y };
            case 'right':
                return { x: shape.x + shape.width, y: centerY };
            case 'bottom':
                return { x: centerX, y: shape.y + shape.height };
            case 'left':
                return { x: shape.x, y: centerY };
            case 'center':
                return { x: centerX, y: centerY };
            default:
                throw new BindingError(`Unhandled position: ${position}`, {
                    elementId: element.id,
                    position,
                });
        }
    }

    /**
     * Get all available binding positions for shapes
     * 
     * @param _element - The shape element (unused)
     * @returns Array of available positions
     */
    getAvailablePositions(_element: CanvasElement): readonly string[] {
        return this.positions;
    }

    /**
     * Check if a position is valid for shapes
     * 
     * @param position - The position to validate
     * @returns true if position is valid
     */
    isValidPosition(position: string): boolean {
        return this.positions.includes(position as Position);
    }
}

// =============================================================================
// Text Binding Resolver
// =============================================================================

/**
 * Resolver for text elements
 * 
 * Provides binding points on the edges and center of text bounds
 */
export class TextBindingResolver implements BindingResolver {
    private readonly positions: readonly Position[] = ['top', 'right', 'bottom', 'left', 'center'];

    /**
     * Get the world coordinates of a binding point on text
     * 
     * @param element - The text element
     * @param position - The position on the text
     * @returns The world coordinates of the binding point
     * @throws BindingError if position is invalid
     */
    getBindingPoint(element: CanvasElement, position: string): Point {
        if (!this.isValidPosition(position)) {
            throw new BindingError(`Invalid position for text: ${position}`, {
                elementId: element.id,
                position,
                validPositions: this.positions,
            });
        }

        const text = element as TextElement;
        const centerX = text.x + text.width / 2;
        const centerY = text.y + text.height / 2;

        switch (position) {
            case 'top':
                return { x: centerX, y: text.y };
            case 'right':
                return { x: text.x + text.width, y: centerY };
            case 'bottom':
                return { x: centerX, y: text.y + text.height };
            case 'left':
                return { x: text.x, y: centerY };
            case 'center':
                return { x: centerX, y: centerY };
            default:
                throw new BindingError(`Unhandled position: ${position}`, {
                    elementId: element.id,
                    position,
                });
        }
    }

    /**
     * Get all available binding positions for text
     * 
     * @param _element - The text element (unused)
     * @returns Array of available positions
     */
    getAvailablePositions(_element: CanvasElement): readonly string[] {
        return this.positions;
    }

    /**
     * Check if a position is valid for text
     * 
     * @param position - The position to validate
     * @returns true if position is valid
     */
    isValidPosition(position: string): boolean {
        return this.positions.includes(position as Position);
    }
}

// =============================================================================
// Sticky Note Binding Resolver
// =============================================================================

/**
 * Resolver for sticky note elements
 * 
 * Provides binding points on the edges and center of sticky notes
 */
export class StickyBindingResolver implements BindingResolver {
    private readonly positions: readonly Position[] = ['top', 'right', 'bottom', 'left', 'center'];

    /**
     * Get the world coordinates of a binding point on a sticky note
     * 
     * @param element - The sticky note element
     * @param position - The position on the sticky note
     * @returns The world coordinates of the binding point
     * @throws BindingError if position is invalid
     */
    getBindingPoint(element: CanvasElement, position: string): Point {
        if (!this.isValidPosition(position)) {
            throw new BindingError(`Invalid position for sticky: ${position}`, {
                elementId: element.id,
                position,
                validPositions: this.positions,
            });
        }

        const sticky = element as StickyElement;
        const centerX = sticky.x + sticky.width / 2;
        const centerY = sticky.y + sticky.height / 2;

        switch (position) {
            case 'top':
                return { x: centerX, y: sticky.y };
            case 'right':
                return { x: sticky.x + sticky.width, y: centerY };
            case 'bottom':
                return { x: centerX, y: sticky.y + sticky.height };
            case 'left':
                return { x: sticky.x, y: centerY };
            case 'center':
                return { x: centerX, y: centerY };
            default:
                throw new BindingError(`Unhandled position: ${position}`, {
                    elementId: element.id,
                    position,
                });
        }
    }

    /**
     * Get all available binding positions for sticky notes
     * 
     * @param _element - The sticky note element (unused)
     * @returns Array of available positions
     */
    getAvailablePositions(_element: CanvasElement): readonly string[] {
        return this.positions;
    }

    /**
     * Check if a position is valid for sticky notes
     * 
     * @param position - The position to validate
     * @returns true if position is valid
     */
    isValidPosition(position: string): boolean {
        return this.positions.includes(position as Position);
    }
}

// =============================================================================
// Default Resolver (Fallback)
// =============================================================================

/**
 * Default resolver for elements without specific binding logic
 * 
 * Treats all elements as rectangles with standard binding points
 */
export class DefaultBindingResolver implements BindingResolver {
    private readonly positions: readonly Position[] = ['top', 'right', 'bottom', 'left', 'center'];

    /**
     * Get the world coordinates of a binding point using default logic
     * 
     * @param element - The canvas element
     * @param position - The position on the element
     * @returns The world coordinates of the binding point
     * @throws BindingError if position is invalid
     */
    getBindingPoint(element: CanvasElement, position: string): Point {
        if (!this.isValidPosition(position)) {
            throw new BindingError(`Invalid position: ${position}`, {
                elementId: element.id,
                position,
                validPositions: this.positions,
            });
        }

        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;

        switch (position) {
            case 'top':
                return { x: centerX, y: element.y };
            case 'right':
                return { x: element.x + element.width, y: centerY };
            case 'bottom':
                return { x: centerX, y: element.y + element.height };
            case 'left':
                return { x: element.x, y: centerY };
            case 'center':
                return { x: centerX, y: centerY };
            default:
                throw new BindingError(`Unhandled position: ${position}`, {
                    elementId: element.id,
                    position,
                });
        }
    }

    /**
     * Get all available binding positions
     * 
     * @param _element - The canvas element (unused)
     * @returns Array of available positions
     */
    getAvailablePositions(_element: CanvasElement): readonly string[] {
        return this.positions;
    }

    /**
     * Check if a position is valid
     * 
     * @param position - The position to validate
     * @returns true if position is valid
     */
    isValidPosition(position: string): boolean {
        return this.positions.includes(position as Position);
    }
}
