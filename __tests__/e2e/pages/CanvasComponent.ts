/**
 * CanvasComponent - Page Object for canvas interactions
 * 
 * Provides API for drawing, selecting, and manipulating elements on canvas
 * Production-quality component with comprehensive interaction methods
 */

import { Page, Locator } from '@playwright/test';

export interface Point {
    x: number;
    y: number;
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DrawOptions {
    shift?: boolean;
    ctrl?: boolean;
    alt?: boolean;
    steps?: number;
}

export interface ClickOptions {
    shift?: boolean;
    ctrl?: boolean;
    double?: boolean;
    right?: boolean;
}

export interface DragOptions {
    shift?: boolean;
    ctrl?: boolean;
    steps?: number;
}

export class CanvasComponent {
    readonly page: Page;
    readonly container: Locator;
    readonly svg: Locator;

    private canvasBounds: BoundingBox | null = null;

    // Default timing constants
    private readonly shortWait = 50;
    private readonly mediumWait = 100;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('.canvas-container')
            .or(page.locator('.react-flow'))
            .or(page.locator('[data-testid="canvas"]'));
        this.svg = page.locator('svg').first();
    }

    /**
     * Wait for canvas to be ready
     */
    async waitForReady(): Promise<void> {
        await this.container.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.waitForTimeout(this.mediumWait);

        // Cache canvas bounds
        this.canvasBounds = await this.container.boundingBox();
    }

    /**
     * Invalidate cached bounds (call after resize)
     */
    invalidateBoundsCache(): void {
        this.canvasBounds = null;
    }

    /**
     * Get canvas bounding box
     */
    async getBounds(): Promise<BoundingBox> {
        if (!this.canvasBounds) {
            this.canvasBounds = await this.container.boundingBox();
        }
        return this.canvasBounds || { x: 0, y: 0, width: 800, height: 600 };
    }

    /**
     * Get canvas center point
     */
    async getCenter(): Promise<Point> {
        const bounds = await this.getBounds();
        return {
            x: bounds.width / 2,
            y: bounds.height / 2,
        };
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    async screenToCanvas(screenX: number, screenY: number): Promise<Point> {
        return this.page.evaluate(({ x, y }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return { x, y };
            const state = store.getState ? store.getState() : store;
            const transform = state.transform || { x: 0, y: 0, scale: 1 };
            return {
                x: (x - transform.x) / transform.scale,
                y: (y - transform.y) / transform.scale,
            };
        }, { x: screenX, y: screenY });
    }

    /**
     * Convert canvas coordinates to screen coordinates
     */
    async canvasToScreen(canvasX: number, canvasY: number): Promise<Point> {
        return this.page.evaluate(({ x, y }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return { x, y };
            const state = store.getState ? store.getState() : store;
            const transform = state.transform || { x: 0, y: 0, scale: 1 };
            return {
                x: x * transform.scale + transform.x,
                y: y * transform.scale + transform.y,
            };
        }, { x: canvasX, y: canvasY });
    }

    /**
     * Draw a shape from one point to another
     * Returns the ID of the created element
     */
    async draw(from: Point, to: Point, options: DrawOptions = {}): Promise<string> {
        const bounds = await this.getBounds();
        const { shift = false, ctrl = false, alt = false, steps = 5 } = options;

        // Press modifier keys
        if (shift) await this.page.keyboard.down('Shift');
        if (ctrl) await this.page.keyboard.down('Control');
        if (alt) await this.page.keyboard.down('Alt');

        await this.page.mouse.move(bounds.x + from.x, bounds.y + from.y);
        await this.page.mouse.down();
        await this.page.mouse.move(bounds.x + to.x, bounds.y + to.y, { steps });
        await this.page.mouse.up();

        // Release modifier keys
        if (alt) await this.page.keyboard.up('Alt');
        if (ctrl) await this.page.keyboard.up('Control');
        if (shift) await this.page.keyboard.up('Shift');

        await this.page.waitForTimeout(this.mediumWait);

        // Get the newly created element ID
        const selectedIds = await this.getSelectedIds();
        return selectedIds[0] || '';
    }

    /**
     * Draw multiple shapes in sequence
     */
    async drawMultiple(shapes: Array<{ from: Point; to: Point; options?: DrawOptions }>): Promise<string[]> {
        const ids: string[] = [];
        for (const shape of shapes) {
            const id = await this.draw(shape.from, shape.to, shape.options);
            ids.push(id);
        }
        return ids;
    }

    /**
     * Click at a specific point on the canvas
     */
    async click(point: Point, options: ClickOptions = {}): Promise<void> {
        const bounds = await this.getBounds();
        const { shift = false, ctrl = false, double = false, right = false } = options;

        // Press modifier keys
        if (shift) await this.page.keyboard.down('Shift');
        if (ctrl) await this.page.keyboard.down('Control');

        const button = right ? 'right' : 'left';

        if (double) {
            await this.page.mouse.dblclick(bounds.x + point.x, bounds.y + point.y, { button });
        } else {
            await this.page.mouse.click(bounds.x + point.x, bounds.y + point.y, { button });
        }

        // Release modifier keys
        if (ctrl) await this.page.keyboard.up('Control');
        if (shift) await this.page.keyboard.up('Shift');

        await this.page.waitForTimeout(this.shortWait);
    }

    /**
     * Right-click at a specific point (context menu)
     */
    async rightClick(point: Point): Promise<void> {
        await this.click(point, { right: true });
    }

    /**
     * Double-click at a specific point
     */
    async doubleClick(point: Point): Promise<void> {
        await this.click(point, { double: true });
    }

    /**
     * Drag from one point to another
     */
    async drag(from: Point, to: Point, options: DragOptions = {}): Promise<void> {
        const bounds = await this.getBounds();
        const { shift = false, ctrl = false, steps = 10 } = options;

        // Press modifier keys
        if (shift) await this.page.keyboard.down('Shift');
        if (ctrl) await this.page.keyboard.down('Control');

        await this.page.mouse.move(bounds.x + from.x, bounds.y + from.y);
        await this.page.mouse.down();
        await this.page.waitForTimeout(this.shortWait);
        await this.page.mouse.move(bounds.x + to.x, bounds.y + to.y, { steps });
        await this.page.mouse.up();

        // Release modifier keys
        if (ctrl) await this.page.keyboard.up('Control');
        if (shift) await this.page.keyboard.up('Shift');

        await this.page.waitForTimeout(this.shortWait);
    }

    /**
     * Select element by clicking on its center
     */
    async selectElement(elementId: string): Promise<void> {
        const element = await this.getElement(elementId);
        if (!element) throw new Error(`Element ${elementId} not found`);

        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const screenPoint = await this.canvasToScreen(centerX, centerY);
        const bounds = await this.getBounds();

        await this.page.mouse.click(bounds.x + screenPoint.x, bounds.y + screenPoint.y);
        await this.page.waitForTimeout(50);
    }

    /**
     * Select multiple elements with shift-click
     */
    async selectElements(elementIds: string[]): Promise<void> {
        for (let i = 0; i < elementIds.length; i++) {
            const element = await this.getElement(elementIds[i]);
            if (!element) continue;

            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            const screenPoint = await this.canvasToScreen(centerX, centerY);
            const bounds = await this.getBounds();

            if (i > 0) {
                await this.page.keyboard.down('Shift');
            }

            await this.page.mouse.click(bounds.x + screenPoint.x, bounds.y + screenPoint.y);

            if (i > 0) {
                await this.page.keyboard.up('Shift');
            }
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Select elements with box selection
     */
    async boxSelect(from: Point, to: Point): Promise<void> {
        await this.drag(from, to);
    }

    /**
     * Move selected elements
     */
    async moveSelected(deltaX: number, deltaY: number): Promise<void> {
        const selectedIds = await this.getSelectedIds();
        if (selectedIds.length === 0) return;

        const element = await this.getElement(selectedIds[0]);
        if (!element) return;

        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const screenPoint = await this.canvasToScreen(centerX, centerY);
        const bounds = await this.getBounds();

        await this.drag(
            { x: screenPoint.x, y: screenPoint.y },
            { x: screenPoint.x + deltaX, y: screenPoint.y + deltaY }
        );
    }

    /**
     * Resize selected element by dragging corner
     */
    async resizeSelected(corner: 'nw' | 'ne' | 'sw' | 'se', deltaX: number, deltaY: number): Promise<void> {
        const selectedIds = await this.getSelectedIds();
        if (selectedIds.length === 0) return;

        const element = await this.getElement(selectedIds[0]);
        if (!element) return;

        let cornerX: number, cornerY: number;
        switch (corner) {
            case 'nw':
                cornerX = element.x;
                cornerY = element.y;
                break;
            case 'ne':
                cornerX = element.x + element.width;
                cornerY = element.y;
                break;
            case 'sw':
                cornerX = element.x;
                cornerY = element.y + element.height;
                break;
            case 'se':
                cornerX = element.x + element.width;
                cornerY = element.y + element.height;
                break;
        }

        const screenPoint = await this.canvasToScreen(cornerX, cornerY);
        await this.drag(
            { x: screenPoint.x, y: screenPoint.y },
            { x: screenPoint.x + deltaX, y: screenPoint.y + deltaY }
        );
    }

    /**
     * Get element by ID
     */
    async getElement(id: string): Promise<{ id: string; type: string; x: number; y: number; width: number; height: number } | null> {
        return this.page.evaluate((elementId) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return null;
            const state = store.getState ? store.getState() : store;
            return state.elements?.[elementId] || null;
        }, id);
    }

    /**
     * Get all elements
     */
    async getAllElements(): Promise<Array<{ id: string; type: string; x: number; y: number; width: number; height: number }>> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return [];
            const state = store.getState ? store.getState() : store;
            return state.elementOrder?.map((id: string) => state.elements[id]) || [];
        });
    }

    /**
     * Get selected element IDs
     */
    async getSelectedIds(): Promise<string[]> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return [];
            const state = store.getState ? store.getState() : store;
            return state.selectedIds || [];
        });
    }

    /**
     * Get current transform (pan/zoom)
     */
    async getTransform(): Promise<{ x: number; y: number; scale: number }> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return { x: 0, y: 0, scale: 1 };
            const state = store.getState ? store.getState() : store;
            return state.transform || { x: 0, y: 0, scale: 1 };
        });
    }

    /**
     * Zoom to a specific level
     */
    async zoom(scale: number): Promise<void> {
        await this.page.evaluate((newScale) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (store) {
                const state = store.getState ? store.getState() : store;
                if (state.setTransform) {
                    const current = state.transform || { x: 0, y: 0, scale: 1 };
                    state.setTransform({ ...current, scale: newScale });
                }
            }
        }, scale);
        await this.page.waitForTimeout(50);
    }

    /**
     * Pan the canvas
     */
    async pan(deltaX: number, deltaY: number): Promise<void> {
        await this.page.evaluate(({ dx, dy }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (store) {
                const state = store.getState ? store.getState() : store;
                if (state.setTransform) {
                    const current = state.transform || { x: 0, y: 0, scale: 1 };
                    state.setTransform({ ...current, x: current.x + dx, y: current.y + dy });
                }
            }
        }, { dx: deltaX, dy: deltaY });
        await this.page.waitForTimeout(50);
    }

    /**
     * Scroll wheel zoom
     */
    async wheelZoom(delta: number, position?: Point): Promise<void> {
        const bounds = await this.getBounds();
        const pos = position || { x: bounds.width / 2, y: bounds.height / 2 };

        await this.page.mouse.move(bounds.x + pos.x, bounds.y + pos.y);
        await this.page.mouse.wheel(0, delta);
        await this.page.waitForTimeout(100);
    }

    /**
     * Deselect all elements
     */
    async deselectAll(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(50);
    }

    /**
     * Type text (for text elements)
     */
    async typeText(text: string): Promise<void> {
        await this.page.keyboard.type(text);
        await this.page.waitForTimeout(50);
    }

    /**
     * Press Enter to confirm text
     */
    async confirmText(): Promise<void> {
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(this.shortWait);
    }

    // =========================================================================
    // Advanced Interactions
    // =========================================================================

    /**
     * Hover over a point
     */
    async hover(point: Point): Promise<void> {
        const bounds = await this.getBounds();
        await this.page.mouse.move(bounds.x + point.x, bounds.y + point.y);
        await this.page.waitForTimeout(this.shortWait);
    }

    /**
     * Hover over an element
     */
    async hoverElement(elementId: string): Promise<void> {
        const element = await this.getElement(elementId);
        if (!element) throw new Error(`Element ${elementId} not found`);

        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const screenPoint = await this.canvasToScreen(centerX, centerY);

        await this.hover(screenPoint);
    }

    /**
     * Scroll wheel at position
     */
    async scroll(deltaX: number, deltaY: number, position?: Point): Promise<void> {
        const bounds = await this.getBounds();
        const pos = position || await this.getCenter();

        await this.page.mouse.move(bounds.x + pos.x, bounds.y + pos.y);
        await this.page.mouse.wheel(deltaX, deltaY);
        await this.page.waitForTimeout(this.mediumWait);
    }

    /**
     * Pinch zoom gesture (simulated with wheel + ctrl)
     */
    async pinchZoom(delta: number, position?: Point): Promise<void> {
        const bounds = await this.getBounds();
        const pos = position || await this.getCenter();

        await this.page.mouse.move(bounds.x + pos.x, bounds.y + pos.y);
        await this.page.keyboard.down('Control');
        await this.page.mouse.wheel(0, delta);
        await this.page.keyboard.up('Control');
        await this.page.waitForTimeout(this.mediumWait);
    }

    /**
     * Get element at point
     */
    async getElementAtPoint(point: Point): Promise<string | null> {
        return this.page.evaluate(({ x, y }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return null;
            const state = store.getState ? store.getState() : store;

            // Find element at point
            const elements = state.elementOrder?.map((id: string) => state.elements[id]) || [];
            for (let i = elements.length - 1; i >= 0; i--) {
                const el = elements[i];
                if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
                    return el.id;
                }
            }
            return null;
        }, point);
    }

    /**
     * Check if point is within canvas bounds
     */
    async isPointInBounds(point: Point): Promise<boolean> {
        const bounds = await this.getBounds();
        return point.x >= 0 && point.x <= bounds.width && point.y >= 0 && point.y <= bounds.height;
    }

    /**
     * Get visible area in canvas coordinates
     */
    async getVisibleArea(): Promise<BoundingBox> {
        const bounds = await this.getBounds();
        const transform = await this.getTransform();

        return {
            x: -transform.x / transform.scale,
            y: -transform.y / transform.scale,
            width: bounds.width / transform.scale,
            height: bounds.height / transform.scale,
        };
    }

    /**
     * Check if element is visible in current viewport
     */
    async isElementVisible(elementId: string): Promise<boolean> {
        const element = await this.getElement(elementId);
        if (!element) return false;

        const visibleArea = await this.getVisibleArea();

        return !(
            element.x + element.width < visibleArea.x ||
            element.x > visibleArea.x + visibleArea.width ||
            element.y + element.height < visibleArea.y ||
            element.y > visibleArea.y + visibleArea.height
        );
    }

    /**
     * Scroll element into view
     */
    async scrollElementIntoView(elementId: string): Promise<void> {
        const element = await this.getElement(elementId);
        if (!element) throw new Error(`Element ${elementId} not found`);

        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const bounds = await this.getBounds();
        const transform = await this.getTransform();

        // Calculate new transform to center element
        const newX = bounds.width / 2 - centerX * transform.scale;
        const newY = bounds.height / 2 - centerY * transform.scale;

        await this.page.evaluate(({ x, y }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (store) {
                const state = store.getState ? store.getState() : store;
                if (state.setTransform) {
                    const current = state.transform || { x: 0, y: 0, scale: 1 };
                    state.setTransform({ ...current, x, y });
                }
            }
        }, { x: newX, y: newY });

        await this.page.waitForTimeout(this.mediumWait);
    }

    /**
     * Fit all elements in view
     */
    async fitAllInView(): Promise<void> {
        await this.page.keyboard.press('Control+1');
        await this.page.waitForTimeout(this.mediumWait);
    }

    /**
     * Reset zoom to 100%
     */
    async resetZoom(): Promise<void> {
        await this.page.keyboard.press('Control+0');
        await this.page.waitForTimeout(this.mediumWait);
    }
}
