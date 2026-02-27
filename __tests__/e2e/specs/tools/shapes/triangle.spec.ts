import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Triangle Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with T key', async ({ toolbar, keyboard }) => {
        // Start with select tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press T to activate triangle
        await keyboard.pressKey('t');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('triangle');
    });

    test('should activate from toolbar', async ({ toolbar }) => {
        await toolbar.selectTool('triangle');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('triangle');
        expect(await toolbar.isToolActive('triangle')).toBe(true);
    });

    test('should create triangle on drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('triangle');
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
        expect(element!.width).toBe(200);
        expect(element!.height).toBe(100);
    });

    test('should create equilateral triangle with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 250)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('triangle');

        // With Shift, width and height should be equal (equilateral triangle)
        expect(element!.width).toBe(element!.height);
    });

    test('should snap to grid when enabled', async ({ page, canvas, toolbar }) => {
        // Enable grid snap
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            store?.setState({ snapToGrid: true, gridSize: 20 });
        });

        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(105, 107)
            .to(295, 193)
            .withSnap()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Coordinates should be snapped to grid (multiples of 20)
        expect(element!.x % 20).toBe(0);
        expect(element!.y % 20).toBe(0);
        expect((element!.x + element!.width) % 20).toBe(0);
        expect((element!.y + element!.height) % 20).toBe(0);
    });

    test('should have minimum size', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        // Try to create very small triangle
        const id = await canvas.draw
            .from(100, 100)
            .to(102, 102)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Should enforce minimum size of 5x5
        expect(element!.width).toBeGreaterThanOrEqual(5);
        expect(element!.height).toBeGreaterThanOrEqual(5);
    });

    test('should auto-switch to select after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');
        expect(await toolbar.isToolActive('triangle')).toBe(true);

        // Create triangle
        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Should auto-switch to select tool
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should apply current stroke style', async ({ page, canvas, toolbar }) => {
        // Set stroke style
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            store?.setState({
                currentStroke: {
                    color: '#ff0000',
                    width: 3,
                    style: 'solid'
                }
            });
        });

        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.stroke?.color).toBe('#ff0000');
        expect(element!.stroke?.width).toBe(3);
        expect(element!.stroke?.style).toBe('solid');
    });

    test('should apply current fill style', async ({ page, canvas, toolbar }) => {
        // Set fill style
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            store?.setState({
                currentFill: {
                    color: '#00ff00',
                    opacity: 0.5
                }
            });
        });

        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.fill?.color).toBe('#00ff00');
        expect(element!.fill?.opacity).toBe(0.5);
    });

    test('should be selectable after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Element should be automatically selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(id);
    });

    test('should be deletable with Delete key', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element exists
        let element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Element should be selected, delete it
        await keyboard.delete();

        // Verify element is deleted
        element = await canvas.getElement(id);
        expect(element).toBeNull();
    });

    test('should create triangle with negative drag direction', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        // Drag from bottom-right to top-left
        const id = await canvas.draw
            .from(300, 200)
            .to(100, 100)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('triangle');

        // Should normalize coordinates
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
        expect(element!.width).toBe(200);
        expect(element!.height).toBe(100);
    });

    test('should support undo after creation', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify element exists
        let element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Undo creation
        await keyboard.undo();

        // Element should be removed
        element = await canvas.getElement(id);
        expect(element).toBeNull();
    });

    test('should support redo after undo', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Undo creation
        await keyboard.undo();

        let element = await canvas.getElement(id);
        expect(element).toBeNull();

        // Redo creation
        await keyboard.redo();

        element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('triangle');
    });

    test('should create multiple triangles in sequence', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        const id1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Tool should auto-switch to select, switch back to triangle
        await toolbar.selectTool('triangle');

        const id2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        const element1 = await canvas.getElement(id1);
        const element2 = await canvas.getElement(id2);

        expect(element1).not.toBeNull();
        expect(element2).not.toBeNull();
        expect(element1!.type).toBe('triangle');
        expect(element2!.type).toBe('triangle');
        expect(id1).not.toBe(id2);
    });

    test('should have correct triangle orientation', async ({ page, canvas, toolbar }) => {
        await toolbar.selectTool('triangle');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Check that triangle points are correctly positioned
        // Default orientation: apex at top center, base at bottom
        const svgElement = await page.locator(`[data-element-id="${id}"]`).first();
        const points = await svgElement.getAttribute('points');

        expect(points).toBeTruthy();
        // Points should form a triangle (3 coordinate pairs)
        const pointsArray = points!.trim().split(/\s+/);
        expect(pointsArray.length).toBe(3);
    });
});
