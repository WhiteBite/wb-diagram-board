import { test as base, expect } from '@playwright/test';
import { TestContext } from './types';
import { createCanvasHelper } from '../helpers/canvas-helpers';
import { createToolbarHelper } from '../helpers/toolbar-helpers';
import { createKeyboardHelper } from '../helpers/keyboard-helpers';

/**
 * Extended test with custom fixtures for canvas testing
 */
export const test = base.extend<TestContext>({
    canvas: async ({ page }, use) => {
        await use(createCanvasHelper(page));
    },

    toolbar: async ({ page }, use) => {
        await use(createToolbarHelper(page));
    },

    keyboard: async ({ page }, use) => {
        await use(createKeyboardHelper(page));
    },
});

export { expect };

/**
 * Custom matchers for canvas testing
 */
expect.extend({
    async toHaveElement(page: any, elementId: string) {
        const element = await page.evaluate((id: string) => {
            const store = (window as any).__CANVAS_STORE__;
            return store?.getState().elements[id] || null;
        }, elementId);

        return {
            pass: element !== null,
            message: () => `Expected element ${elementId} to ${this.isNot ? 'not ' : ''}exist`,
        };
    },

    async toHaveSelectedElements(page: any, count: number) {
        const selectedCount = await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            return store?.getState().selectedIds.length || 0;
        });

        return {
            pass: selectedCount === count,
            message: () => `Expected ${count} selected elements, got ${selectedCount}`,
        };
    },

    async toHaveTransform(page: any, expected: { x?: number; y?: number; scale?: number }) {
        const transform = await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            return store?.getState().transform;
        });

        const matches = Object.entries(expected).every(([key, value]) => {
            return Math.abs(transform[key] - value) < 0.01;
        });

        return {
            pass: matches,
            message: () => `Expected transform ${JSON.stringify(expected)}, got ${JSON.stringify(transform)}`,
        };
    },
});

/**
 * Setup function to run before each test
 */
export async function setupTest(page: any, canvas: any) {
    await page.goto('/');
    await canvas.waitForReady();

    // Disable snap to grid by default for predictable test behavior
    await page.evaluate(() => {
        const store = (window as any).__CANVAS_STORE__;
        if (store) {
            store.setState({ snapToGrid: false });
        }
    });
}
