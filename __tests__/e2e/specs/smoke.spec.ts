import { test, expect, setupTest } from '../core/base-test';

test.describe('Smoke Tests', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should load the application', async ({ page }) => {
        await expect(page).toHaveTitle(/Diagram Board/i);
    });

    test('should render canvas', async ({ page }) => {
        const canvas = page.locator('svg').first();
        await expect(canvas).toBeVisible();
    });

    test('should have toolbar with tools', async ({ page }) => {
        const toolbar = page.locator('[data-testid="toolbar"]');
        await expect(toolbar).toBeVisible();
    });

    test('should have select tool active by default', async ({ toolbar }) => {
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should be able to switch tools', async ({ toolbar }) => {
        await toolbar.selectTool('rectangle');
        const isActive = await toolbar.isToolActive('rectangle');
        expect(isActive).toBe(true);
    });

    test('should create a rectangle', async ({ page, canvas, toolbar }) => {
        await toolbar.selectTool('rectangle');

        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        expect(elementId).toBeTruthy();

        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element?.type).toBe('rectangle');
    });

    test('should select an element', async ({ canvas, toolbar }) => {
        // Create a rectangle first
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Element is auto-selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);

        // Verify element exists
        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element?.type).toBe('rectangle');
    });

    test('should delete an element with keyboard', async ({ canvas, toolbar, keyboard }) => {
        // Create and select a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Delete it
        await keyboard.delete();

        // Verify it's gone
        const element = await canvas.getElement(elementId);
        expect(element).toBeNull();
    });

    test('should undo and redo', async ({ canvas, toolbar, keyboard }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        let element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();

        // Undo
        await keyboard.undo();
        element = await canvas.getElement(elementId);
        expect(element).toBeNull();

        // Redo
        await keyboard.redo();
        element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
    });
});
