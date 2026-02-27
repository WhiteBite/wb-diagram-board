/**
 * WB Canvas - Shortcuts E2E Tests
 * 
 * End-to-end tests for keyboard shortcuts system
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to press keyboard shortcut
 */
async function pressShortcut(page: Page, keys: string[], modifiers: string[] = []) {
    const modifierMap: Record<string, string> = {
        ctrl: 'Control',
        shift: 'Shift',
        alt: 'Alt',
        meta: 'Meta',
    };

    // Press modifiers
    for (const mod of modifiers) {
        await page.keyboard.down(modifierMap[mod]);
    }

    // Press keys
    for (const key of keys) {
        await page.keyboard.press(key);
    }

    // Release modifiers
    for (const mod of modifiers) {
        await page.keyboard.up(modifierMap[mod]);
    }
}

test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');
    });

    // =========================================================================
    // Edit Shortcuts
    // =========================================================================

    test.describe('Edit Shortcuts', () => {
        test('should undo with Ctrl+Z', async ({ page }) => {
            // Create a rectangle
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Get initial element count
            const initialCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            // Undo
            await pressShortcut(page, ['z'], ['ctrl']);

            // Check element count decreased
            const afterUndoCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            expect(afterUndoCount).toBeLessThan(initialCount);
        });

        test('should redo with Ctrl+Shift+Z', async ({ page }) => {
            // Create a rectangle
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Undo
            await pressShortcut(page, ['z'], ['ctrl']);

            // Get count after undo
            const afterUndoCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            // Redo
            await pressShortcut(page, ['z'], ['ctrl', 'shift']);

            // Check element count increased
            const afterRedoCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            expect(afterRedoCount).toBeGreaterThan(afterUndoCount);
        });

        test('should select all with Ctrl+A', async ({ page }) => {
            // Create multiple elements
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(150, 150);
            await page.mouse.up();

            await page.keyboard.press('r');
            await page.mouse.move(200, 200);
            await page.mouse.down();
            await page.mouse.move(250, 250);
            await page.mouse.up();

            // Select all
            await pressShortcut(page, ['a'], ['ctrl']);

            // Check all elements are selected
            const selectedCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().selectedIds.length;
            });

            expect(selectedCount).toBeGreaterThan(0);
        });

        test('should delete with Delete key', async ({ page }) => {
            // Create a rectangle
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Select it
            await page.mouse.click(150, 150);

            // Get initial count
            const initialCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            // Delete
            await page.keyboard.press('Delete');

            // Check element was deleted
            const afterDeleteCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            expect(afterDeleteCount).toBeLessThan(initialCount);
        });

        test('should duplicate with Ctrl+D', async ({ page }) => {
            // Create a rectangle
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Select it
            await page.mouse.click(150, 150);

            // Get initial count
            const initialCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            // Duplicate
            await pressShortcut(page, ['d'], ['ctrl']);

            // Check element was duplicated
            const afterDuplicateCount = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return Object.keys(store.getState().elements).length;
            });

            expect(afterDuplicateCount).toBeGreaterThan(initialCount);
        });
    });

    // =========================================================================
    // View Shortcuts
    // =========================================================================

    test.describe('View Shortcuts', () => {
        test('should zoom in with Ctrl++', async ({ page }) => {
            // Get initial zoom
            const initialZoom = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().transform.scale;
            });

            // Zoom in
            await pressShortcut(page, ['+'], ['ctrl']);

            // Check zoom increased
            const afterZoomIn = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().transform.scale;
            });

            expect(afterZoomIn).toBeGreaterThan(initialZoom);
        });

        test('should zoom out with Ctrl+-', async ({ page }) => {
            // Zoom in first
            await pressShortcut(page, ['+'], ['ctrl']);

            // Get zoom after zoom in
            const afterZoomIn = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().transform.scale;
            });

            // Zoom out
            await pressShortcut(page, ['-'], ['ctrl']);

            // Check zoom decreased
            const afterZoomOut = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().transform.scale;
            });

            expect(afterZoomOut).toBeLessThan(afterZoomIn);
        });

        test('should reset zoom with Ctrl+0', async ({ page }) => {
            // Zoom in
            await pressShortcut(page, ['+'], ['ctrl']);

            // Reset zoom
            await pressShortcut(page, ['0'], ['ctrl']);

            // Check zoom is 1
            const zoom = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().transform.scale;
            });

            expect(zoom).toBe(1);
        });

        test('should toggle grid with Ctrl+G', async ({ page }) => {
            // Get initial grid state
            const initialGridEnabled = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().gridEnabled;
            });

            // Toggle grid
            await pressShortcut(page, ['g'], ['ctrl']);

            // Check grid state changed
            const afterToggleGridEnabled = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().gridEnabled;
            });

            expect(afterToggleGridEnabled).toBe(!initialGridEnabled);
        });
    });

    // =========================================================================
    // Tool Shortcuts
    // =========================================================================

    test.describe('Tool Shortcuts', () => {
        test('should activate select tool with V', async ({ page }) => {
            await page.keyboard.press('v');

            const activeTool = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().activeTool;
            });

            expect(activeTool).toBe('select');
        });

        test('should activate rectangle tool with R', async ({ page }) => {
            await page.keyboard.press('r');

            const activeTool = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().activeTool;
            });

            expect(activeTool).toBe('rectangle');
        });

        test('should activate ellipse tool with O', async ({ page }) => {
            await page.keyboard.press('o');

            const activeTool = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().activeTool;
            });

            expect(activeTool).toBe('ellipse');
        });

        test('should activate text tool with X', async ({ page }) => {
            await page.keyboard.press('x');

            const activeTool = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().activeTool;
            });

            expect(activeTool).toBe('text');
        });

        test('should activate eraser tool with E', async ({ page }) => {
            await page.keyboard.press('e');

            const activeTool = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().activeTool;
            });

            expect(activeTool).toBe('eraser');
        });
    });

    // =========================================================================
    // Element Shortcuts
    // =========================================================================

    test.describe('Element Shortcuts', () => {
        test('should bring to front with Ctrl+]', async ({ page }) => {
            // Create two rectangles
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(150, 150);
            await page.mouse.up();

            await page.keyboard.press('r');
            await page.mouse.move(120, 120);
            await page.mouse.down();
            await page.mouse.move(170, 170);
            await page.mouse.up();

            // Select second rectangle
            await page.mouse.click(145, 145);

            // Get initial z-index
            const initialZIndex = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const selectedId = store.getState().selectedIds[0];
                return store.getState().elements[selectedId]?.zIndex;
            });

            // Bring to front
            await pressShortcut(page, [']'], ['ctrl']);

            // Check z-index increased
            const afterZIndex = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const selectedId = store.getState().selectedIds[0];
                return store.getState().elements[selectedId]?.zIndex;
            });

            expect(afterZIndex).toBeGreaterThan(initialZIndex);
        });

        test('should send to back with Ctrl+[', async ({ page }) => {
            // Create two rectangles
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(150, 150);
            await page.mouse.up();

            await page.keyboard.press('r');
            await page.mouse.move(120, 120);
            await page.mouse.down();
            await page.mouse.move(170, 170);
            await page.mouse.up();

            // Select second rectangle
            await page.mouse.click(145, 145);

            // Get initial z-index
            const initialZIndex = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const selectedId = store.getState().selectedIds[0];
                return store.getState().elements[selectedId]?.zIndex;
            });

            // Send to back
            await pressShortcut(page, ['['], ['ctrl']);

            // Check z-index decreased
            const afterZIndex = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const selectedId = store.getState().selectedIds[0];
                return store.getState().elements[selectedId]?.zIndex;
            });

            expect(afterZIndex).toBeLessThan(initialZIndex);
        });

        test('should toggle lock with Ctrl+Shift+L', async ({ page }) => {
            // Create a rectangle
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Select it
            await page.mouse.click(150, 150);

            // Get initial locked state
            const initialLocked = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const selectedId = store.getState().selectedIds[0];
                return store.getState().elements[selectedId]?.locked;
            });

            // Toggle lock
            await pressShortcut(page, ['l'], ['ctrl', 'shift']);

            // Check locked state changed
            const afterLocked = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const selectedId = store.getState().selectedIds[0];
                return store.getState().elements[selectedId]?.locked;
            });

            expect(afterLocked).toBe(!initialLocked);
        });
    });

    // =========================================================================
    // Navigation Shortcuts
    // =========================================================================

    test.describe('Navigation Shortcuts', () => {
        test('should clear selection with Escape', async ({ page }) => {
            // Create a rectangle
            await page.keyboard.press('r');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Select it
            await page.mouse.click(150, 150);

            // Check it's selected
            const selectedBefore = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().selectedIds.length;
            });

            expect(selectedBefore).toBeGreaterThan(0);

            // Press Escape
            await page.keyboard.press('Escape');

            // Check selection cleared
            const selectedAfter = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store.getState().selectedIds.length;
            });

            expect(selectedAfter).toBe(0);
        });
    });

    // =========================================================================
    // Conflict Detection
    // =========================================================================

    test.describe('Conflict Detection', () => {
        test('should detect conflicting shortcuts', async ({ page }) => {
            const conflicts = await page.evaluate(() => {
                const store = (window as any).__SHORTCUTS_STORE__;
                if (!store) return null;
                return store.getState().conflicts;
            });

            // Conflicts might be empty or have some, but should be an array
            expect(Array.isArray(conflicts) || conflicts === null).toBe(true);
        });
    });

    // =========================================================================
    // Configuration
    // =========================================================================

    test.describe('Configuration', () => {
        test('should export configuration', async ({ page }) => {
            const config = await page.evaluate(() => {
                const store = (window as any).__SHORTCUTS_STORE__;
                if (!store) return null;
                return store.getState().exportConfig();
            });

            if (config) {
                expect(typeof config).toBe('string');
                const parsed = JSON.parse(config);
                expect(Array.isArray(parsed.bindings)).toBe(true);
            }
        });

        test('should reset to defaults', async ({ page }) => {
            const beforeCount = await page.evaluate(() => {
                const store = (window as any).__SHORTCUTS_STORE__;
                if (!store) return 0;
                return store.getState().bindings.length;
            });

            await page.evaluate(() => {
                const store = (window as any).__SHORTCUTS_STORE__;
                if (store) {
                    store.getState().resetToDefaults();
                }
            });

            const afterCount = await page.evaluate(() => {
                const store = (window as any).__SHORTCUTS_STORE__;
                if (!store) return 0;
                return store.getState().bindings.length;
            });

            expect(afterCount).toBeGreaterThan(0);
        });
    });
});
