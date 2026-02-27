import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Freedraw Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with P key', async ({ toolbar, keyboard }) => {
        // Ensure we start with a different tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press P to activate freedraw
        await keyboard.pressKey('p');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('pen');
    });

    test('should draw path on drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element was created
        const element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('freedraw');
        expect(element!.id).toBe(elementId);
    });

    test('should create path with multiple points', async ({ page, canvas, toolbar }) => {
        await toolbar.selectTool('pen');

        // Draw a more complex path with multiple points
        const canvasSvg = page.locator('svg').first();
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        // Start drawing
        await page.mouse.move(box!.x + 100, box!.y + 100);
        await page.mouse.down();

        // Move through multiple points
        await page.mouse.move(box!.x + 150, box!.y + 120);
        await page.waitForTimeout(20);
        await page.mouse.move(box!.x + 200, box!.y + 110);
        await page.waitForTimeout(20);
        await page.mouse.move(box!.x + 250, box!.y + 130);
        await page.waitForTimeout(20);
        await page.mouse.move(box!.x + 300, box!.y + 150);

        await page.mouse.up();
        await page.waitForTimeout(100);

        // Verify path was created
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);

        const element = await canvas.getElement(selectedIds[0]);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('freedraw');

        // Path should have points data
        expect(element!.points).toBeDefined();
        expect(Array.isArray(element!.points)).toBe(true);
        expect(element!.points.length).toBeGreaterThan(2);
    });

    test('should apply stroke style', async ({ canvas, toolbar, page }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Check that stroke properties exist
        expect(element!.strokeColor).toBeDefined();
        expect(element!.strokeWidth).toBeDefined();

        // Verify the path is rendered with stroke
        const pathElement = page.locator(`[data-element-id="${elementId}"]`);
        await expect(pathElement).toBeVisible();

        const stroke = await pathElement.getAttribute('stroke');
        expect(stroke).not.toBeNull();
        expect(stroke).not.toBe('none');
    });

    test('should simulate pressure variation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Check if pressure data exists (if implemented)
        if (element!.pressurePoints) {
            expect(Array.isArray(element!.pressurePoints)).toBe(true);
            expect(element!.pressurePoints.length).toBeGreaterThan(0);
        }

        // Path should have smooth rendering
        expect(element!.smoothing).toBeDefined();
    });

    test('should auto-switch to select after drawing', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Wait for auto-switch
        await new Promise(resolve => setTimeout(resolve, 150));

        // Tool should switch back to select
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');

        // Element should still be selected
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);
    });

    test('should be deletable', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element exists
        let element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Element should be selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);

        // Delete the element
        await keyboard.delete();

        // Verify element is deleted
        element = await canvas.getElement(elementId);
        expect(element).toBeNull();

        // Selection should be empty
        const newSelectedIds = await canvas.getSelectedIds();
        expect(newSelectedIds.length).toBe(0);
    });

    test('should create separate paths for each stroke', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('pen');

        // Draw first path
        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Reselect pen tool (auto-switches to select after drawing)
        await toolbar.selectTool('pen');

        // Draw second path
        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        // Verify both elements exist and are different
        expect(element1).not.toBe(element2);

        const path1 = await canvas.getElement(element1);
        const path2 = await canvas.getElement(element2);

        expect(path1).not.toBeNull();
        expect(path2).not.toBeNull();
        expect(path1!.type).toBe('freedraw');
        expect(path2!.type).toBe('freedraw');
    });

    test('should have proper bounds', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Check bounds
        expect(element!.x).toBeDefined();
        expect(element!.y).toBeDefined();
        expect(element!.width).toBeDefined();
        expect(element!.height).toBeDefined();

        // Bounds should encompass the drawn path
        expect(element!.width).toBeGreaterThan(0);
        expect(element!.height).toBeGreaterThan(0);
    });

    test('should work with undo/redo', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('pen');

        // Draw a path
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element exists
        let element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Undo
        await keyboard.undo();

        // Element should be removed
        element = await canvas.getElement(elementId);
        expect(element).toBeNull();

        // Redo
        await keyboard.redo();

        // Element should be back
        element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('freedraw');
    });
});
