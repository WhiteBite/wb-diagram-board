import { test, expect, setupTest } from '../../core/base-test';

test.describe('Drag Interactions', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should drag single element', async ({ canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial position
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialX = initialElement!.x;
        const initialY = initialElement!.y;

        // Drag the element
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .execute();

        // Check new position
        const movedElement = await canvas.getElement(elementId);
        expect(movedElement).toBeTruthy();
        expect(movedElement!.x).toBeGreaterThan(initialX);
        expect(movedElement!.y).toBeGreaterThan(initialY);
    });

    test('should drag multiple elements together', async ({ canvas, toolbar }) => {
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

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select both elements - use x >= 90 to avoid toolbar
        await canvas.select
            .box(90, 50, 400, 180)
            .execute();

        // Verify both elements are selected
        const selectedIds = await canvas.getSelectedIds();
        console.log('[Test] Selected IDs after box selection:', selectedIds);
        expect(selectedIds).toContain(element1);
        expect(selectedIds).toContain(element2);

        // Get initial positions
        const initial1 = await canvas.getElement(element1);
        const initial2 = await canvas.getElement(element2);
        expect(initial1).toBeTruthy();
        expect(initial2).toBeTruthy();

        const initialX1 = initial1!.x;
        const initialY1 = initial1!.y;
        const initialX2 = initial2!.x;
        const initialY2 = initial2!.y;

        // Calculate relative distance between elements
        const initialDeltaX = initialX2 - initialX1;
        const initialDeltaY = initialY2 - initialY1;

        // Drag the elements
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .execute();

        // Check new positions
        const moved1 = await canvas.getElement(element1);
        const moved2 = await canvas.getElement(element2);
        expect(moved1).toBeTruthy();
        expect(moved2).toBeTruthy();

        // Both elements should have moved
        expect(moved1!.x).toBeGreaterThan(initialX1);
        expect(moved1!.y).toBeGreaterThan(initialY1);
        expect(moved2!.x).toBeGreaterThan(initialX2);
        expect(moved2!.y).toBeGreaterThan(initialY2);

        // Relative distance should be preserved
        const newDeltaX = moved2!.x - moved1!.x;
        const newDeltaY = moved2!.y - moved1!.y;
        expect(Math.abs(newDeltaX - initialDeltaX)).toBeLessThan(1);
        expect(Math.abs(newDeltaY - initialDeltaY)).toBeLessThan(1);
    });

    test('should snap to grid when enabled', async ({ page, canvas, toolbar }) => {
        // Enable grid snapping
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            const state = store?.getState();
            if (state) {
                state.snapToGrid = true;
                state.gridSize = 20;
            }
        });

        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Drag to a non-grid position
        await canvas.drag
            .from(150, 125)
            .to(237, 243)
            .withSnap()
            .execute();

        // Check that position is snapped to grid
        const movedElement = await canvas.getElement(elementId);
        expect(movedElement).toBeTruthy();

        // Position should be a multiple of grid size (20)
        expect(movedElement!.x % 20).toBe(0);
        expect(movedElement!.y % 20).toBe(0);
    });

    test('should constrain to horizontal axis with Shift', async ({ canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial position
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialX = initialElement!.x;
        const initialY = initialElement!.y;

        // Drag with Shift (should constrain to axis)
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .withShift()
            .execute();

        // Check new position
        const movedElement = await canvas.getElement(elementId);
        expect(movedElement).toBeTruthy();

        // Should move more on one axis than the other
        const deltaX = Math.abs(movedElement!.x - initialX);
        const deltaY = Math.abs(movedElement!.y - initialY);

        // One axis should have minimal movement (constrained)
        expect(Math.min(deltaX, deltaY)).toBeLessThan(10);
        expect(Math.max(deltaX, deltaY)).toBeGreaterThan(50);
    });

    test('should NOT drag locked elements', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Lock the element using proper store method
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setElementLocked(id, true);
        }, elementId);

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial position
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialX = initialElement!.x;
        const initialY = initialElement!.y;

        // Try to drag the locked element
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .execute();

        // Position should not change
        const afterElement = await canvas.getElement(elementId);
        expect(afterElement).toBeTruthy();
        expect(afterElement!.x).toBe(initialX);
        expect(afterElement!.y).toBe(initialY);
    });

    test('should update position in store', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Drag the element
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .execute();

        // Check that store is updated
        const storeElement = await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            return store?.getState().elements[id];
        }, elementId);

        expect(storeElement).toBeTruthy();
        expect(storeElement.x).toBeGreaterThan(100);
        expect(storeElement.y).toBeGreaterThan(100);
    });

    test('should work with undo/redo', async ({ canvas, toolbar, keyboard }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial position
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialX = initialElement!.x;
        const initialY = initialElement!.y;

        // Drag the element
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .execute();

        // Get new position
        const movedElement = await canvas.getElement(elementId);
        expect(movedElement).toBeTruthy();
        const movedX = movedElement!.x;
        const movedY = movedElement!.y;

        expect(movedX).toBeGreaterThan(initialX);
        expect(movedY).toBeGreaterThan(initialY);

        // Undo
        await keyboard.undo();

        // Should be back to initial position
        const undoneElement = await canvas.getElement(elementId);
        expect(undoneElement).toBeTruthy();
        expect(undoneElement!.x).toBe(initialX);
        expect(undoneElement!.y).toBe(initialY);

        // Redo
        await keyboard.redo();

        // Should be back to moved position
        const redoneElement = await canvas.getElement(elementId);
        expect(redoneElement).toBeTruthy();
        expect(redoneElement!.x).toBe(movedX);
        expect(redoneElement!.y).toBe(movedY);
    });

    test('should drag element with negative coordinates', async ({ canvas, toolbar }) => {
        // Create a rectangle at position that allows dragging left
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(200, 200)
            .to(300, 250)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial position
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialX = initialElement!.x;
        const initialY = initialElement!.y;

        // Drag to the left and up (but stay within canvas area, avoiding toolbar)
        await canvas.drag
            .from(250, 225)
            .to(150, 125)
            .execute();

        // Check new position (should have moved left and up)
        const movedElement = await canvas.getElement(elementId);
        expect(movedElement).toBeTruthy();
        expect(movedElement!.x).toBeLessThan(initialX);
        expect(movedElement!.y).toBeLessThan(initialY);
    });

    test('should maintain element size during drag', async ({ canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Get initial size
        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();
        const initialWidth = initialElement!.width;
        const initialHeight = initialElement!.height;

        // Drag the element
        await canvas.drag
            .from(150, 125)
            .to(250, 225)
            .execute();

        // Check that size is unchanged
        const movedElement = await canvas.getElement(elementId);
        expect(movedElement).toBeTruthy();
        expect(movedElement!.width).toBe(initialWidth);
        expect(movedElement!.height).toBe(initialHeight);
    });

    test('should show drag preview during drag', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Start dragging
        const svg = page.locator('svg').first();
        const box = await svg.boundingBox();
        if (box) {
            await page.mouse.move(box.x + 150, box.y + 125);
            await page.mouse.down();
            await page.mouse.move(box.x + 200, box.y + 175);

            // Check for drag preview
            const dragPreview = page.locator('[data-testid="drag-preview"]');
            await expect(dragPreview).toBeVisible();

            await page.mouse.up();
        }
    });
});
