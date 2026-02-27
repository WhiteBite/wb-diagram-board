import { test, expect, setupTest } from '../../core/base-test';

test.describe('Hand Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with H key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press H to activate hand tool
        await keyboard.pressKey('h');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('hand');
    });

    test('should activate by clicking hand tool button', async ({ toolbar }) => {
        await toolbar.selectTool('hand');

        const isActive = await toolbar.isToolActive('hand');
        expect(isActive).toBe(true);
    });

    test('should pan canvas on drag', async ({ page, canvas, toolbar }) => {
        // Switch to hand tool
        await toolbar.selectTool('hand');

        // Get initial transform
        const initialTransform = await canvas.getTransform();

        // Drag to pan
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 300);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Check transform changed
        const newTransform = await canvas.getTransform();
        expect(newTransform.x).not.toBe(initialTransform.x);
        expect(newTransform.y).not.toBe(initialTransform.y);

        // Pan should move in the direction of drag
        expect(newTransform.x).toBeGreaterThan(initialTransform.x);
        expect(newTransform.y).toBeGreaterThan(initialTransform.y);
    });

    test('should change cursor to grab/grabbing', async ({ page, toolbar }) => {
        // Switch to hand tool
        await toolbar.selectTool('hand');

        // Check cursor style on canvas
        const svgCanvas = page.locator('svg').first();

        // Should have grab cursor when not dragging
        const cursorStyle = await svgCanvas.evaluate((el) => {
            return window.getComputedStyle(el).cursor;
        });

        expect(cursorStyle).toMatch(/grab/);
    });

    test('should pan with Space+drag (temporary hand tool)', async ({ page, canvas, toolbar, keyboard }) => {
        // Start with select tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Get initial transform
        const initialTransform = await canvas.getTransform();

        // Hold Space and drag
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.keyboard.down('Space');
        await page.waitForTimeout(50);

        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 300);
        await page.mouse.up();

        await page.keyboard.up('Space');
        await page.waitForTimeout(100);

        // Check transform changed (panned)
        const newTransform = await canvas.getTransform();
        expect(newTransform.x).toBeGreaterThan(initialTransform.x);
        expect(newTransform.y).toBeGreaterThan(initialTransform.y);

        // Should still be on select tool
        expect(await toolbar.isToolActive('select')).toBe(true);
    });

    test('should not select elements while panning', async ({ canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(300, 250)
            .execute();

        // Switch to hand tool
        await toolbar.selectTool('hand');

        // Clear selection first
        await toolbar.selectTool('select');
        await canvas.select
            .box(10, 10, 20, 20)
            .execute();

        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);

        // Switch back to hand tool
        await toolbar.selectTool('hand');

        // Try to "select" by clicking where element is
        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();

        await canvas.select
            .element(elementId)
            .execute();

        // Should NOT be selected
        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);
    });

    test('should return to previous tool after Space release', async ({ toolbar, keyboard }) => {
        // Start with rectangle tool
        await toolbar.selectTool('rectangle');
        expect(await toolbar.isToolActive('rectangle')).toBe(true);

        // Hold Space (temporary hand tool)
        await keyboard.holdKey('Space', async () => {
            // During Space hold, we're in temporary hand mode
            // (Note: actual tool state might not change, but behavior does)
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // After releasing Space, should return to rectangle tool
        expect(await toolbar.isToolActive('rectangle')).toBe(true);
    });

    test('should pan in multiple directions', async ({ page, canvas, toolbar }) => {
        // Switch to hand tool
        await toolbar.selectTool('hand');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        // Get initial transform
        const initialTransform = await canvas.getTransform();

        // Pan right and down
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 300);
        await page.mouse.up();
        await page.waitForTimeout(100);

        const transform1 = await canvas.getTransform();
        expect(transform1.x).toBeGreaterThan(initialTransform.x);
        expect(transform1.y).toBeGreaterThan(initialTransform.y);

        // Pan left and up
        await page.mouse.move(box.x + 300, box.y + 300);
        await page.mouse.down();
        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.up();
        await page.waitForTimeout(100);

        const transform2 = await canvas.getTransform();
        expect(transform2.x).toBeLessThan(transform1.x);
        expect(transform2.y).toBeLessThan(transform1.y);
    });

    test('should maintain zoom level while panning', async ({ page, canvas, toolbar }) => {
        // Switch to hand tool
        await toolbar.selectTool('hand');

        // Get initial transform
        const initialTransform = await canvas.getTransform();
        const initialScale = initialTransform.scale;

        // Pan the canvas
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.move(box.x + 200, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 300);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Check scale hasn't changed
        const newTransform = await canvas.getTransform();
        expect(newTransform.scale).toBe(initialScale);
    });
});
