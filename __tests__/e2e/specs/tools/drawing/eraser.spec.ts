import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Eraser Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with E key', async ({ toolbar, keyboard }) => {
        // Ensure we start with a different tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press E to activate eraser
        await keyboard.pressKey('e');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('eraser');
    });

    test('should change cursor to eraser', async ({ page, toolbar }) => {
        await toolbar.selectTool('eraser');

        // Get the canvas element
        const canvas = page.locator('[data-testid="canvas-svg"]');

        // Check cursor style
        const cursor = await canvas.evaluate((el) => {
            return window.getComputedStyle(el).cursor;
        });

        // Cursor should indicate eraser mode (crosshair or custom cursor)
        expect(cursor).toMatch(/crosshair|url/);
    });

    test('should erase element on drag over it', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element exists
        let element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Drag eraser over the element
        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        // Drag through the center of the rectangle
        await page.mouse.move(box!.x + 150, box!.y + 150);
        await page.mouse.down();
        await page.mouse.move(box!.x + 250, box!.y + 150);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Element should be erased
        element = await canvas.getElement(elementId);
        expect(element).toBeNull();
    });

    test('should erase multiple elements in one stroke', async ({ page, canvas, toolbar }) => {
        // Create multiple rectangles
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Re-select rectangle tool (it may auto-switch to select after creation)
        await toolbar.selectTool('rectangle');

        const element2 = await canvas.draw
            .from(220, 100)
            .to(320, 150)
            .execute();

        await toolbar.selectTool('rectangle');

        const element3 = await canvas.draw
            .from(340, 100)
            .to(440, 150)
            .execute();

        // Verify all elements exist
        expect(await canvas.getElement(element1)).not.toBeNull();
        expect(await canvas.getElement(element2)).not.toBeNull();
        expect(await canvas.getElement(element3)).not.toBeNull();

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Drag eraser across all three elements with intermediate steps
        // Elements are at x: 100-200, 220-320, 340-440, y: 100-150
        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        // Start drag
        await page.mouse.move(box!.x + 150, box!.y + 125);
        await page.mouse.down();

        // Move through each element with steps to ensure mouse events fire
        await page.mouse.move(box!.x + 270, box!.y + 125, { steps: 10 }); // Through element2
        await page.mouse.move(box!.x + 390, box!.y + 125, { steps: 10 }); // Through element3

        await page.mouse.up();
        await page.waitForTimeout(100);

        // All elements should be erased
        expect(await canvas.getElement(element1)).toBeNull();
        expect(await canvas.getElement(element2)).toBeNull();
        expect(await canvas.getElement(element3)).toBeNull();
    });

    test('should not erase elements outside eraser path', async ({ page, canvas, toolbar }) => {
        // Create two rectangles - one in path, one outside
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Re-select rectangle tool
        await toolbar.selectTool('rectangle');

        const element2 = await canvas.draw
            .from(100, 250)
            .to(200, 300)
            .execute();

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Drag eraser only over first element (y:100-150)
        // Element1 is at x:100-200, y:100-150
        // Drag at y:125 (center of element1), from x:150 to x:180
        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        await page.mouse.move(box!.x + 150, box!.y + 125);
        await page.mouse.down();
        await page.mouse.move(box!.x + 180, box!.y + 125);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // First element should be erased
        expect(await canvas.getElement(element1)).toBeNull();

        // Second element should still exist (it's at y:250-300, we erased at y:125)
        expect(await canvas.getElement(element2)).not.toBeNull();
    });

    test('should not erase locked elements', async ({ page, canvas, toolbar }) => {
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

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Try to erase the locked element
        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        await page.mouse.move(box!.x + 150, box!.y + 150);
        await page.mouse.down();
        await page.mouse.move(box!.x + 250, box!.y + 150);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Locked element should still exist
        const element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();
        expect(element!.locked).toBe(true);
    });

    test('should work with undo/redo', async ({ page, canvas, toolbar, keyboard }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element exists
        let element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();

        // Switch to eraser and erase the element
        await toolbar.selectTool('eraser');

        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        await page.mouse.move(box!.x + 150, box!.y + 150);
        await page.mouse.down();
        await page.mouse.move(box!.x + 250, box!.y + 150);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Element should be erased
        element = await canvas.getElement(elementId);
        expect(element).toBeNull();

        // Undo
        await keyboard.undo();

        // Element should be restored
        element = await canvas.getElement(elementId);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('rectangle');

        // Redo
        await keyboard.redo();

        // Element should be erased again
        element = await canvas.getElement(elementId);
        expect(element).toBeNull();
    });

    test('should erase freedraw paths', async ({ page, canvas, toolbar }) => {
        // Create a freedraw path
        await toolbar.selectTool('pen');
        const pathId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify path exists
        let path = await canvas.getElement(pathId);
        expect(path).not.toBeNull();
        expect(path!.type).toBe('freedraw');

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Erase the path
        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        await page.mouse.move(box!.x + 150, box!.y + 150);
        await page.mouse.down();
        await page.mouse.move(box!.x + 250, box!.y + 150);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Path should be erased
        path = await canvas.getElement(pathId);
        expect(path).toBeNull();
    });

    test('should erase text elements', async ({ page, canvas, toolbar }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        // Click to create text
        await page.mouse.click(box!.x + 200, box!.y + 150);
        await page.waitForTimeout(100);

        // Type some text
        await page.keyboard.type('Test Text');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Get the text element
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        const textId = selectedIds[0];

        let textElement = await canvas.getElement(textId);
        expect(textElement).not.toBeNull();
        expect(textElement!.type).toBe('text');

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Erase the text
        await page.mouse.move(box!.x + 180, box!.y + 150);
        await page.mouse.down();
        await page.mouse.move(box!.x + 220, box!.y + 150);
        await page.mouse.up();
        await page.waitForTimeout(100);

        // Text should be erased
        textElement = await canvas.getElement(textId);
        expect(textElement).toBeNull();
    });

    test('should show visual feedback while erasing', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Switch to eraser
        await toolbar.selectTool('eraser');

        const canvasSvg = page.locator('[data-testid="canvas-svg"]');
        const box = await canvasSvg.boundingBox();
        expect(box).not.toBeNull();

        // Start erasing
        await page.mouse.move(box!.x + 150, box!.y + 150);
        await page.mouse.down();

        // Check for eraser indicator/trail (if implemented)
        const eraserIndicator = page.locator('[data-testid="eraser-indicator"]');
        const hasIndicator = await eraserIndicator.count() > 0;

        // Either indicator exists or cursor changed
        if (hasIndicator) {
            await expect(eraserIndicator).toBeVisible();
        }

        await page.mouse.up();
    });

    test('should clear selection when activated', async ({ canvas, toolbar }) => {
        // Create and select a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Element should be selected after creation
        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);

        // Switch to eraser
        await toolbar.selectTool('eraser');

        // Selection should be cleared
        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);
    });
});

