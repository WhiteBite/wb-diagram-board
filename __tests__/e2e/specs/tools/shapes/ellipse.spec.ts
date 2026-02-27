import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Ellipse Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with O key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press O to activate ellipse tool
        await keyboard.pressKey('o');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('ellipse');
    });

    test('should create ellipse on drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('ellipse');
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
        expect(element!.width).toBeCloseTo(200, 1);
        expect(element!.height).toBeCloseTo(100, 1);
    });

    test('should create proportional ellipse (circle) with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 250)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('ellipse');

        // With Shift, width and height should be equal (circle)
        // The smaller dimension determines the size
        const expectedSize = Math.min(200, 150); // min(300-100, 250-100)
        expect(element!.width).toBeCloseTo(expectedSize, 1);
        expect(element!.height).toBeCloseTo(expectedSize, 1);
    });

    test('should snap to grid when enabled', async ({ page, canvas, toolbar }) => {
        // Enable grid snapping
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            store?.setState({ snapToGrid: true, gridSize: 20 });
        });

        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(105, 107)
            .to(295, 203)
            .withSnap()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Coordinates should be snapped to grid (multiples of 20)
        expect(element!.x % 20).toBe(0);
        expect(element!.y % 20).toBe(0);
    });

    test('should have minimum size of 5x5', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        // Try to create a very small ellipse
        const id = await canvas.draw
            .from(100, 100)
            .to(102, 101)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Should enforce minimum size
        expect(element!.width).toBeGreaterThanOrEqual(5);
        expect(element!.height).toBeGreaterThanOrEqual(5);
    });

    test('should auto-switch to select tool after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');
        expect(await toolbar.isToolActive('ellipse')).toBe(true);

        // Create an ellipse
        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Tool should automatically switch to select
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should apply current stroke style', async ({ page, canvas, toolbar }) => {
        // Set stroke style
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            store?.setState({
                currentStroke: {
                    color: '#0000ff',
                    width: 2,
                    style: 'dashed',
                },
            });
        });

        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.stroke).toBeDefined();
        expect(element!.stroke.color).toBe('#0000ff');
        expect(element!.stroke.width).toBe(2);
        expect(element!.stroke.style).toBe('dashed');
    });

    test('should apply current fill style', async ({ page, canvas, toolbar }) => {
        // Set fill style
        await page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__;
            store?.setState({
                currentFill: {
                    color: '#ffff00',
                    opacity: 0.7,
                },
            });
        });

        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.fill).toBeDefined();
        expect(element!.fill.color).toBe('#ffff00');
        expect(element!.fill.opacity).toBe(0.7);
    });

    test('should be selectable after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Ellipse should be automatically selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(id);

        // Should be able to select it again after deselection
        await toolbar.selectTool('select');
        await canvas.select
            .box(500, 500, 510, 510)
            .execute();

        let newSelectedIds = await canvas.getSelectedIds();
        expect(newSelectedIds.length).toBe(0);

        // Select the ellipse
        await canvas.select
            .element(id)
            .execute();

        newSelectedIds = await canvas.getSelectedIds();
        expect(newSelectedIds.length).toBe(1);
        expect(newSelectedIds[0]).toBe(id);
    });

    test('should be deletable with Delete key', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Ellipse should be selected after creation
        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);

        // Element should exist
        let element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Delete the ellipse
        await keyboard.delete();

        // Element should be removed
        element = await canvas.getElement(id);
        expect(element).toBeNull();

        // Selection should be cleared
        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);
    });

    test('should support negative drag direction', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        // Drag from bottom-right to top-left
        const id = await canvas.draw
            .from(300, 200)
            .to(100, 100)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('ellipse');

        // Position should be normalized to top-left
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
        expect(element!.width).toBeCloseTo(200, 1);
        expect(element!.height).toBeCloseTo(100, 1);
    });

    test('should create multiple ellipses in sequence', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        const id1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Tool should switch to select, switch back to ellipse
        await toolbar.selectTool('ellipse');

        const id2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        await toolbar.selectTool('ellipse');

        const id3 = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // All ellipses should exist
        const element1 = await canvas.getElement(id1);
        const element2 = await canvas.getElement(id2);
        const element3 = await canvas.getElement(id3);

        expect(element1).not.toBeNull();
        expect(element2).not.toBeNull();
        expect(element3).not.toBeNull();

        // Check total element count
        const allElements = await canvas.getAllElements();
        expect(allElements.length).toBe(3);
    });

    test('should render with correct radii', async ({ page, canvas, toolbar }) => {
        await toolbar.selectTool('ellipse');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Check that ellipse has correct radii in DOM
        const ellipseElement = page.locator(`[data-element-id="${id}"]`);
        await expect(ellipseElement).toBeVisible();

        // Get computed radii
        const radii = await page.evaluate((elementId) => {
            const element = document.querySelector(`[data-element-id="${elementId}"]`);
            if (!element) return null;

            const rx = element.getAttribute('rx');
            const ry = element.getAttribute('ry');

            return { rx: parseFloat(rx || '0'), ry: parseFloat(ry || '0') };
        }, id);

        expect(radii).not.toBeNull();
        // rx should be half of width (200/2 = 100)
        expect(radii!.rx).toBeCloseTo(100, 1);
        // ry should be half of height (100/2 = 50)
        expect(radii!.ry).toBeCloseTo(50, 1);
    });
});
