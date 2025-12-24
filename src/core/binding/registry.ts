/**
 * WB Binding System - Binding Resolver Registry
 * 
 * Singleton registry for managing binding resolvers for different element types
 */

import type { CanvasElement, ElementType, Point } from '../../types/canvas';
import { BindingError, type BindingResolver } from './types';
import {
    ShapeBindingResolver,
    TextBindingResolver,
    StickyBindingResolver,
    DefaultBindingResolver,
} from './resolver';

// =============================================================================
// Binding Resolver Registry
// =============================================================================

/**
 * Registry for managing binding resolvers for different element types
 * 
 * This is a singleton that maintains a map of element types to their
 * corresponding binding resolvers. It provides methods to register new
 * resolvers and retrieve binding points for elements.
 * 
 * @example
 * const registry = new BindingResolverRegistry();
 * registry.register('rectangle', new ShapeBindingResolver());
 * const point = registry.getBindingPoint(element, 'top');
 */
export class BindingResolverRegistry {
    private readonly resolvers = new Map<ElementType, BindingResolver>();
    private readonly defaultResolver = new DefaultBindingResolver();

    /**
     * Register a binding resolver for an element type
     * 
     * @param type - The element type
     * @param resolver - The binding resolver implementation
     * @throws BindingError if resolver is already registered for this type
     * 
     * @example
     * registry.register('rectangle', new ShapeBindingResolver());
     */
    register(type: ElementType, resolver: BindingResolver): void {
        if (this.resolvers.has(type)) {
            throw new BindingError(`Resolver for element type '${type}' is already registered`, {
                type,
            });
        }

        if (!resolver) {
            throw new BindingError(`Cannot register null or undefined resolver for type '${type}'`, {
                type,
            });
        }

        this.resolvers.set(type, resolver);
    }

    /**
     * Get the resolver for an element type
     * 
     * Returns the registered resolver for the element type, or the default
     * resolver if no specific resolver is registered.
     * 
     * @param element - The canvas element
     * @returns The binding resolver for this element type
     * 
     * @example
     * const resolver = registry.resolve(element);
     * const point = resolver.getBindingPoint(element, 'top');
     */
    resolve(element: CanvasElement): BindingResolver {
        const resolver = this.resolvers.get(element.type);
        return resolver || this.defaultResolver;
    }

    /**
     * Get the world coordinates of a binding point on an element
     * 
     * @param element - The canvas element
     * @param position - The position on the element ('top', 'right', 'bottom', 'left', 'center')
     * @returns The world coordinates of the binding point
     * @throws BindingError if position is invalid
     * 
     * @example
     * const point = registry.getBindingPoint(element, 'top');
     * console.log(point); // { x: 100, y: 50 }
     */
    getBindingPoint(element: CanvasElement, position: string): Point {
        const resolver = this.resolve(element);
        return resolver.getBindingPoint(element, position);
    }

    /**
     * Get all available binding positions for an element
     * 
     * @param element - The canvas element
     * @returns Array of available position strings
     * 
     * @example
     * const positions = registry.getAvailablePositions(element);
     * console.log(positions); // ['top', 'right', 'bottom', 'left', 'center']
     */
    getAvailablePositions(element: CanvasElement): readonly string[] {
        const resolver = this.resolve(element);
        return resolver.getAvailablePositions(element);
    }

    /**
     * Check if a position is valid for an element
     * 
     * @param element - The canvas element
     * @param position - The position to validate
     * @returns true if position is valid for this element type
     * 
     * @example
     * if (registry.isValidPosition(element, 'top')) {
     *   const point = registry.getBindingPoint(element, 'top');
     * }
     */
    isValidPosition(element: CanvasElement, position: string): boolean {
        const resolver = this.resolve(element);
        return resolver.isValidPosition(position);
    }

    /**
     * Get all registered element types
     * 
     * @returns Array of registered element types
     */
    getRegisteredTypes(): ElementType[] {
        return Array.from(this.resolvers.keys());
    }

    /**
     * Check if a resolver is registered for an element type
     * 
     * @param type - The element type
     * @returns true if a resolver is registered
     */
    hasResolver(type: ElementType): boolean {
        return this.resolvers.has(type);
    }

    /**
     * Clear all registered resolvers
     * 
     * This is mainly useful for testing. After clearing, all elements
     * will use the default resolver.
     */
    clear(): void {
        this.resolvers.clear();
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Global binding resolver registry instance
 * 
 * This is the main entry point for the binding system. Use this instance
 * to get binding points for elements throughout the application.
 * 
 * @example
 * import { bindingRegistry } from './registry';
 * 
 * const point = bindingRegistry.getBindingPoint(element, 'top');
 */
export const bindingRegistry = new BindingResolverRegistry();

// Register all default resolvers
bindingRegistry.register('rectangle', new ShapeBindingResolver());
bindingRegistry.register('ellipse', new ShapeBindingResolver());
bindingRegistry.register('diamond', new ShapeBindingResolver());
bindingRegistry.register('triangle', new ShapeBindingResolver());
bindingRegistry.register('text', new TextBindingResolver());
bindingRegistry.register('sticky', new StickyBindingResolver());

// Elements that don't have specific binding logic will use the default resolver:
// - 'line'
// - 'arrow'
// - 'freedraw'
// - 'image'
// - 'frame'
// - 'connector'
