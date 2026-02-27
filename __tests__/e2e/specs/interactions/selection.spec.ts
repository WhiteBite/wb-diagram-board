import { test, expect, setupTest } from '../../core/base-test';

test.describe('Selection Interactions', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should select single element on click', async ({ canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Click on the element
        await canvas.select
            .element(elementId)
            .execute();

        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);
    });

    test('should select multiple elements with box selection', async ({ canvas, toolbar }) => {
        // Create multiple rectangles
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Re-select rectangle tool (auto-switches to select after drawing)
        await toolbar.selectTool('rectangle');

        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        // Re-select rectangle tool
        await toolbar.selectTool('rectangle');

        const element3 = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Draw selection box around first two elements
        // Note: x must be >= 90 to avoid toolbar (toolbar is at x=16-80)
        await canvas.select
            .box(90, 50, 380, 180)
            .execute();

        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(2);
        expect(selectedIds).toContain(element1);
        expect(selectedIds).toContain(element2);
        expect(selectedIds).not.toContain(element3);
    });

    test('should add to selection with Shift+click', async ({ canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Re-select rectangle tool (auto-switches to select after drawing)
        await toolbar.selectTool('rectangle');

        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select first element
        await canvas.select
            .element(element1)
            .execute();

        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(element1);

        // Shift+click to add second element
        await canvas.select
            .element(element2)
            .withShift()
            .execute();

        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(2);
        expect(selectedIds).toContain(element1);
        expect(selectedIds).toContain(element2);
    });

    test('should clear selection on empty area click', async ({ canvas, toolbar, page }) => {
        // Create and select a rectangle
        await toolbar.selectTool('rectangle');
        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Element should be selected after creation
        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);

        // Switch to select tool
        await toolbar.selectTool('select');

        // Click on empty area
        const svg = page.locator('svg').first();
        const box = await svg.boundingBox();
        if (box) {
            await page.mouse.click(box.x + 500, box.y + 500);
        }

        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);
    });

    test('should select all elements with Ctrl+A', async ({ canvas, toolbar, keyboard }) => {
        // Create multiple elements
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Re-select rectangle tool (auto-switches to select after drawing)
        await toolbar.selectTool('rectangle');

        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        await toolbar.selectTool('ellipse');

        const element3 = await canvas.draw
            .from(100, 200)
            .to(200, 300)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Clear selection first
        await canvas.select
            .box(500, 500, 510, 510)
            .execute();

        // Select all with Ctrl+A
        await keyboard.selectAll();

        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(3);
        expect(selectedIds).toContain(element1);
        expect(selectedIds).toContain(element2);
        expect(selectedIds).toContain(element3);
    });

    test('should show selection bounds for single element', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Switch to select tool and select element
        await toolbar.selectTool('select');

        // Check for selection bounds in DOM
        const selectionBounds = page.locator('[data-testid="selection-bounds"]');
        await expect(selectionBounds).toBeVisible();
    });

    test('should show selection bounds for multiple elements', async ({ page, canvas, toolbar }) => {
        // Create multiple rectangles
        await toolbar.selectTool('rectangle');

        await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select all elements
        // Note: x must be >= 90 to avoid toolbar (toolbar is at x=16-80)
        await canvas.select
            .box(90, 50, 380, 180)
            .execute();

        // Check for selection bounds
        const selectionBounds = page.locator('[data-testid="selection-bounds"]');
        await expect(selectionBounds).toBeVisible();
    });

    test('should show resize handles on selected element', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Check for resize handles
        const resizeHandles = page.locator('[data-testid="resize-handle"]');
        const handleCount = await resizeHandles.count();

        // Should have 8 resize handles (nw, n, ne, w, e, sw, s, se)
        expect(handleCount).toBe(8);
    });

    test('should NOT select locked elements', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Lock the element using proper store method
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setElementLocked(id, true);
        }, elementId);

        // Switch to select tool
        await toolbar.selectTool('select');

        // Try to select the locked element
        await canvas.select
            .element(elementId)
            .execute();

        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);
    });

    test('should deselect element with Shift+click on selected element', async ({ canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Re-select rectangle tool (auto-switches to select after drawing)
        await toolbar.selectTool('rectangle');

        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select both elements with box selection
        // Note: x must be >= 90 to avoid toolbar (toolbar is at x=16-80)
        await canvas.select
            .box(90, 50, 380, 180)
            .execute();

        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(2);

        // Shift+click on one element to deselect it
        await canvas.select
            .element(element1)
            .withShift()
            .execute();

        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(element2);
    });

    test('should preserve selection when switching tools', async ({ canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Switch to select tool and select element
        await toolbar.selectTool('select');
        await canvas.select
            .element(elementId)
            .execute();

        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);

        // Switch to another tool
        await toolbar.selectTool('hand');

        // Selection should be preserved
        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);
    });

    test('should select elements by type with box selection', async ({ canvas, toolbar }) => {
        // Create different types of elements
        await toolbar.selectTool('rectangle');
        const rect = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        await toolbar.selectTool('ellipse');
        const ellipse = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        await toolbar.selectTool('diamond');
        const diamond = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select all with box
        // Note: x must be >= 90 to avoid toolbar (toolbar is at x=16-80)
        await canvas.select
            .box(90, 50, 550, 180)
            .execute();

        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(3);
        expect(selectedIds).toContain(rect);
        expect(selectedIds).toContain(ellipse);
        expect(selectedIds).toContain(diamond);
    });
});
