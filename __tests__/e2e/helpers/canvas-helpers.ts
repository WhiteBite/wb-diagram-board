import { Page } from '@playwright/test';
import {
    CanvasTestHelper,
    DrawInteraction,
    SelectInteraction,
    DragInteraction,
    CanvasElement,
    Point
} from '../core/types';

export function createCanvasHelper(page: Page): CanvasTestHelper {
    const helper: Omit<CanvasTestHelper, 'draw' | 'select' | 'drag'> = {
        async waitForReady() {
            await page.waitForSelector('svg', { state: 'visible' });
            await page.waitForTimeout(100);

            // Expose store for testing
            await page.evaluate(() => {
                const store = (window as any).useCanvasStore;
                if (store) {
                    (window as any).__CANVAS_STORE__ = store;
                }
            });
        },

        async getElement(id: string): Promise<CanvasElement | null> {
            return page.evaluate((elementId) => {
                const store = (window as any).__CANVAS_STORE__;
                return store?.getState().elements[elementId] || null;
            }, id);
        },

        async getAllElements(): Promise<CanvasElement[]> {
            return page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const state = store?.getState();
                return state?.elementOrder.map((id: string) => state.elements[id]) || [];
            });
        },

        async getSelectedIds(): Promise<string[]> {
            return page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store?.getState().selectedIds || [];
            });
        },

        async getTransform() {
            return page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store?.getState().transform || { x: 0, y: 0, scale: 1 };
            });
        },

        async screenToCanvas(x: number, y: number): Promise<Point> {
            const transform = await this.getTransform();
            return {
                x: (x - transform.x) / transform.scale,
                y: (y - transform.y) / transform.scale,
            };
        },

        async canvasToScreen(x: number, y: number): Promise<Point> {
            const transform = await this.getTransform();
            return {
                x: x * transform.scale + transform.x,
                y: y * transform.scale + transform.y,
            };
        },
    };

    // Draw interaction builder
    const createDrawInteraction = (): DrawInteraction => {
        let _from: Point | null = null;
        let _to: Point | null = null;
        let _shift = false;
        let _snap = false;

        return {
            from(x: number, y: number) {
                _from = { x, y };
                return this;
            },

            to(x: number, y: number) {
                _to = { x, y };
                return this;
            },

            withShift() {
                _shift = true;
                return this;
            },

            withSnap() {
                _snap = true;
                return this;
            },

            async execute(): Promise<string> {
                if (!_from || !_to) {
                    throw new Error('Must specify from() and to() points');
                }

                const canvas = page.locator('.canvas-container').first();
                const box = await canvas.boundingBox();
                if (!box) throw new Error('Canvas not found');

                if (_shift) {
                    await page.keyboard.down('Shift');
                }

                await page.mouse.move(box.x + _from.x, box.y + _from.y);
                await page.mouse.down();
                await page.mouse.move(box.x + _to.x, box.y + _to.y);
                await page.mouse.up();

                if (_shift) {
                    await page.keyboard.up('Shift');
                }

                await page.waitForTimeout(100);

                // Get the newly created element ID
                const selectedIds = await helper.getSelectedIds();
                return selectedIds[0] || '';
            },
        };
    };

    // Select interaction builder
    const createSelectInteraction = (): SelectInteraction => {
        let _elementId: string | null = null;
        let _elementIds: string[] | null = null;
        let _box: { x1: number; y1: number; x2: number; y2: number } | null = null;
        let _shift = false;

        return {
            element(id: string) {
                _elementId = id;
                return this;
            },

            elements(ids: string[]) {
                _elementIds = ids;
                return this;
            },

            box(x1: number, y1: number, x2: number, y2: number) {
                _box = { x1, y1, x2, y2 };
                return this;
            },

            withShift() {
                _shift = true;
                return this;
            },

            async execute(): Promise<void> {
                if (_elementId) {
                    const element = await helper.getElement(_elementId);
                    if (!element) throw new Error(`Element ${_elementId} not found`);

                    // Get the canvas container (div), not the SVG
                    const canvas = page.locator('.canvas-container').first();
                    const box = await canvas.boundingBox();
                    if (!box) throw new Error('Canvas not found');

                    const centerX = element.x + element.width / 2;
                    const centerY = element.y + element.height / 2;
                    const screenPoint = await helper.canvasToScreen(centerX, centerY);

                    if (_shift) {
                        await page.keyboard.down('Shift');
                    }

                    // Click on the canvas container, not the SVG
                    await page.mouse.click(box.x + screenPoint.x, box.y + screenPoint.y);

                    if (_shift) {
                        await page.keyboard.up('Shift');
                    }
                } else if (_box) {
                    const canvas = page.locator('.canvas-container').first();
                    const box = await canvas.boundingBox();
                    if (!box) throw new Error('Canvas not found');

                    await page.mouse.move(box.x + _box.x1, box.y + _box.y1);
                    await page.mouse.down();
                    await page.mouse.move(box.x + _box.x2, box.y + _box.y2);
                    await page.mouse.up();
                }

                await page.waitForTimeout(50);
            },
        };
    };

    // Drag interaction builder
    const createDragInteraction = (): DragInteraction => {
        let _elementId: string | null = null;
        let _from: Point | null = null;
        let _to: Point | null = null;
        let _shift = false;
        let _snap = false;

        return {
            element(id: string) {
                _elementId = id;
                return this;
            },

            elements(ids: string[]) {
                // TODO: implement multi-drag
                return this;
            },

            from(x: number, y: number) {
                _from = { x, y };
                return this;
            },

            to(x: number, y: number) {
                _to = { x, y };
                return this;
            },

            withShift() {
                _shift = true;
                return this;
            },

            withSnap() {
                _snap = true;
                return this;
            },

            async execute(): Promise<void> {
                if (!_from || !_to) {
                    throw new Error('Must specify from() and to() points');
                }

                const canvas = page.locator('.canvas-container').first();
                const box = await canvas.boundingBox();
                if (!box) throw new Error('Canvas not found');

                if (_shift) {
                    await page.keyboard.down('Shift');
                }

                await page.mouse.move(box.x + _from.x, box.y + _from.y);
                await page.mouse.down();
                await page.waitForTimeout(50);
                await page.mouse.move(box.x + _to.x, box.y + _to.y);
                await page.mouse.up();

                if (_shift) {
                    await page.keyboard.up('Shift');
                }

                await page.waitForTimeout(50);
            },
        };
    };

    return {
        ...helper,
        get draw() { return createDrawInteraction(); },
        get select() { return createSelectInteraction(); },
        get drag() { return createDragInteraction(); },
    };
}
