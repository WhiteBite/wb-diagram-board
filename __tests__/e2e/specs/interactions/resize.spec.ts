import { test, expect, setupTest } from '../../core/base-test';

test.describe('Resize Interactions', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should resize from southeast handle', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(400, 300)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial bounds
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialWidth = initialElement!.width;
        const initialHeight = initialElement!.height;

        // Find and drag southeast handle
        const seHandle = page.locator('[data-testid="resize-handle"][data-position="se"]');
        await expect(seHandle).toBeVisible();

        const handleBox = await seHandle.boundingBox();
        if (handleBox) {
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
            await page.mouse.up();
        }

        // Check new size
        const resizedElement = await canvas.getElement(elementId);
        expect(resizedElement).toBeTruthy();
        expect(resizedElement!.width).toBeGreaterThan(initialWidth);
        expect(resizedElement!.height).toBeGreaterThan(initialHeight);
    });

    test('should resize from east handle', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(400, 300)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial bounds
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialWidth = initialElement!.width;
        const initialHeight = initialElement!.height;

        // Find and drag east handle
        const eHandle = page.locator('[data-testid="resize-handle"][data-position="e"]');
        await expect(eHandle).toBeVisible();

        const handleBox = await eHandle.boundingBox();
        if (handleBox) {
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(handleBox.x + 50, handleBox.y + handleBox.height / 2);
            await page.mouse.up();
        }

        // Check new size
        const resizedElement = await canvas.getElement(elementId);
        expect(resizedElement).toBeTruthy();
        expect(resizedElement!.width).toBeGreaterThan(initialWidth);
        expect(resizedElement!.height).toBe(initialHeight); // Height unchanged
    });

    test('should have minimum size', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(400, 300)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Try to resize to very small size
        const seHandle = page.locator('[data-testid="resize-handle"][data-position="se"]');
        await expect(seHandle).toBeVisible();

        const handleBox = await seHandle.boundingBox();
        if (handleBox) {
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            // Try to drag to make it tiny
            await page.mouse.move(handleBox.x - 190, handleBox.y - 90);
            await page.mouse.up();
        }

        // Check that minimum size is enforced
        const resizedElement = await canvas.getElement(elementId);
        expect(resizedElement).toBeTruthy();
        expect(resizedElement!.width).toBeGreaterThanOrEqual(20); // Minimum width
        expect(resizedElement!.height).toBeGreaterThanOrEqual(20); // Minimum height
    });

    test('should work with undo/redo', async ({ page, canvas, toolbar, keyboard }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(400, 300)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial size
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialWidth = initialElement!.width;
        const initialHeight = initialElement!.height;

        // Resize
        const seHandle = page.locator('[data-testid="resize-handle"][data-position="se"]');
        const handleBox = await seHandle.boundingBox();
        if (handleBox) {
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
            await page.mouse.up();
        }

        // Get resized size
        const resizedElement = await canvas.getElement(elementId);
        expect(resizedElement).toBeTruthy();
        const resizedWidth = resizedElement!.width;
        const resizedHeight = resizedElement!.height;

        expect(resizedWidth).toBeGreaterThan(initialWidth);
        expect(resizedHeight).toBeGreaterThan(initialHeight);

        // Undo
        await keyboard.undo();

        // Should be back to initial size
        const undoneElement = await canvas.getElement(elementId);
        expect(undoneElement).toBeTruthy();
        expect(undoneElement!.width).toBe(initialWidth);
        expect(undoneElement!.height).toBe(initialHeight);

        // Redo
        await keyboard.redo();

        // Should be back to resized size
        const redoneElement = await canvas.getElement(elementId);
        expect(redoneElement).toBeTruthy();
        expect(redoneElement!.width).toBe(resizedWidth);
        expect(redoneElement!.height).toBe(resizedHeight);
    });

    test('should update bounds in store', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(400, 300)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Resize
        const seHandle = page.locator('[data-testid="resize-handle"][data-position="se"]');
        const handleBox = await seHandle.boundingBox();
        if (handleBox) {
            await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
            await page.mouse.up();
        }

        // Check that store is updated
        const storeElement = await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            return store?.getState().elements[id];
        }, elementId);

        expect(storeElement).toBeTruthy();
        expect(storeElement.width).toBeGreaterThan(200);
        expect(storeElement.height).toBeGreaterThan(100);
    });

    test('should NOT resize locked elements', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(400, 300)
            .execute();

        // Lock the element using proper store method
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setElementLocked(id, true);
        }, elementId);

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial size
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialWidth = initialElement!.width;
        const initialHeight = initialElement!.height;

        // Try to resize from southeast handle
        const seHandle = page.locator('[data-testid="resize-handle"][data-position="se"]');

        // Handle might not be visible for locked elements, so check first
        const handleCount = await seHandle.count();
        if (handleCount > 0) {
            const handleBox = await seHandle.boundingBox();
            if (handleBox) {
                await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
                await page.mouse.down();
                await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
                await page.mouse.up();
            }
        }

        // Size should not change
        const afterElement = await canvas.getElement(elementId);
        expect(afterElement).toBeTruthy();
        expect(afterElement!.width).toBe(initialWidth);
        expect(afterElement!.height).toBe(initialHeight);
    });
});
