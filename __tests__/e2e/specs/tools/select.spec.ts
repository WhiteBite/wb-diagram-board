import { test, expect, setupTest } from '../../core/base-test';

test.describe('Select Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should be active by default', async ({ toolbar }) => {
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should activate with V key', async ({ toolbar, keyboard }) => {
        // Switch to another tool first
        await toolbar.selectTool('rectangle');
        expect(await toolbar.isToolActive('rectangle')).toBe(true);

        // Press V to activate select
        await keyboard.pressKey('v');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should select element on click', async ({ canvas, toolbar }) => {
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

    test('should clear selection on empty area click', async ({ canvas, toolbar }) => {
        // Create and select a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Element should be selected after creation
        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);

        // Switch to select tool
        await toolbar.selectTool('select');

        // Click on empty area
        await canvas.select
            .box(500, 500, 510, 510)
            .execute();

        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);
    });

    test('should show selection bounds', async ({ page, canvas, toolbar }) => {
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

        // Check for selection bounds in DOM
        const selectionBounds = page.locator('[data-testid="selection-bounds"]');
        await expect(selectionBounds).toBeVisible();
    });

    test('should show resize handles on selected element', async ({ page, canvas, toolbar }) => {
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

        // Check for resize handles
        const resizeHandles = page.locator('[data-testid="resize-handle"]');
        const handleCount = await resizeHandles.count();

        // Should have 8 resize handles (corners + edges)
        expect(handleCount).toBe(8);
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

    test('should allow dragging selected element', async ({ canvas, toolbar }) => {
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
});
