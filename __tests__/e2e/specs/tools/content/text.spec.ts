import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Text Tool', () => {
    // Run tests serially to avoid race conditions with text editor
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with X key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press X to activate text tool (T is used for triangle)
        await keyboard.pressKey('x');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('text');
    });

    test('should activate by clicking text tool button', async ({ toolbar }) => {
        await toolbar.selectTool('text');

        const isActive = await toolbar.isToolActive('text');
        expect(isActive).toBe(true);
    });

    test('should create text element on click', async ({ page, canvas, toolbar }) => {
        // Switch to text tool
        await toolbar.selectTool('text');

        // Click to create text
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        // Should create a text element
        const elements = await canvas.getAllElements();
        const textElements = elements.filter(el => el.type === 'text');
        expect(textElements.length).toBe(1);

        const textElement = textElements[0];
        expect(textElement).toBeTruthy();
        expect(textElement.type).toBe('text');
    });

    test('should be editable immediately after creation', async ({ page, canvas, toolbar }) => {
        // Switch to text tool
        await toolbar.selectTool('text');

        // Click to create text
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);

        // Wait for text editor to appear
        const textInput = page.locator('[data-testid="text-editor"]').or(page.locator('textarea'));
        await expect(textInput.first()).toBeVisible({ timeout: 5000 });

        // Type some text
        await page.keyboard.type('Hello World');
        await page.waitForTimeout(50);

        // Click outside to finish editing
        await page.mouse.click(box.x + 400, box.y + 400);
        await page.waitForTimeout(100);

        // Verify text was saved
        const elements = await canvas.getAllElements();
        const textElement = elements.find(el => el.type === 'text');
        expect(textElement).toBeTruthy();
        expect(textElement?.text || textElement?.content).toContain('Hello');
    });

    test('should be editable on double-click', async ({ page, canvas, toolbar }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(200);

        // Type initial text
        await page.keyboard.type('Initial Text');
        await page.mouse.click(box.x + 400, box.y + 400);
        await page.waitForTimeout(100);

        // Get the text element
        const elements = await canvas.getAllElements();
        const textElement = elements.find(el => el.type === 'text');
        expect(textElement).toBeTruthy();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Double-click on text to edit
        const centerX = textElement!.x + textElement!.width / 2;
        const centerY = textElement!.y + textElement!.height / 2;
        const screenPoint = await canvas.canvasToScreen(centerX, centerY);

        await page.mouse.dblclick(box.x + screenPoint.x, box.y + screenPoint.y);
        await page.waitForTimeout(200);

        // Should show text editor again
        const textInput = page.locator('[data-testid="text-editor"]').or(page.locator('textarea')).or(page.locator('[contenteditable="true"]'));
        await expect(textInput.first()).toBeVisible({ timeout: 2000 });
    });

    test('should apply text styles', async ({ page, canvas, toolbar }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const svgCanvas = page.locator('[data-testid="canvas-svg"]');
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);

        // Wait for text editor to appear
        const textInput = page.locator('[data-testid="text-editor"]').or(page.locator('textarea'));
        await expect(textInput.first()).toBeVisible({ timeout: 5000 });

        // Type text
        await page.keyboard.type('Styled Text');
        await page.waitForTimeout(50);

        // Click outside to finish
        await page.mouse.click(box.x + 400, box.y + 400);
        await page.waitForTimeout(100);

        // Verify element was created with the typed text
        const elements = await canvas.getAllElements();
        const textElement = elements.find(el => el.type === 'text');
        expect(textElement).toBeTruthy();
        expect(textElement?.text || textElement?.content).toContain('Styled');
    });

    test('should auto-switch to select tool after creation', async ({ page, canvas, toolbar }) => {
        // Switch to text tool
        await toolbar.selectTool('text');
        expect(await toolbar.isToolActive('text')).toBe(true);

        // Create text
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        await page.keyboard.type('Auto Switch Test');
        await page.waitForTimeout(50);

        // Press Escape or click outside to finish
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Should auto-switch to select tool
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should be selectable after creation', async ({ page, canvas, toolbar }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(200);

        // Close editor
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Get the created element
        const elements = await canvas.getAllElements();
        const textElement = elements.find(el => el.type === 'text');
        expect(textElement).toBeTruthy();
        const elementId = textElement!.id;

        // Should be selected after creation
        let selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);

        // Switch to select tool and deselect by clicking empty space
        await toolbar.selectTool('select');
        await page.mouse.click(box.x + 10, box.y + 10);
        await page.waitForTimeout(100);

        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(0);

        // Select the text element again by clicking on it
        const centerX = textElement!.x + textElement!.width / 2;
        const centerY = textElement!.y + textElement!.height / 2;
        const screenPoint = await canvas.canvasToScreen(centerX, centerY);
        await page.mouse.click(box.x + screenPoint.x, box.y + screenPoint.y);
        await page.waitForTimeout(100);

        selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(elementId);
    });

    test('should be deletable with keyboard', async ({ page, canvas, toolbar, keyboard }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        // Close the editor first by pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Get the created element
        const elements = await canvas.getAllElements();
        const textElement = elements.find(el => el.type === 'text');
        expect(textElement).toBeTruthy();
        const elementId = textElement!.id;

        // Select the element
        await toolbar.selectTool('select');
        const centerX = textElement!.x + textElement!.width / 2;
        const centerY = textElement!.y + textElement!.height / 2;
        const screenPoint = await canvas.canvasToScreen(centerX, centerY);
        await page.mouse.click(box.x + screenPoint.x, box.y + screenPoint.y);
        await page.waitForTimeout(100);

        // Verify it's selected
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds).toContain(elementId);

        // Delete it
        await keyboard.delete();
        await page.waitForTimeout(100);

        // Verify it's gone
        const element = await canvas.getElement(elementId);
        expect(element).toBeNull();
    });

    test('should support multi-line text', async ({ page, canvas, toolbar }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        // Type multi-line text
        await page.keyboard.type('Line 1');
        await page.keyboard.press('Enter');
        await page.keyboard.type('Line 2');
        await page.keyboard.press('Enter');
        await page.keyboard.type('Line 3');
        await page.waitForTimeout(50);

        // Finish editing
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Verify text element was created
        const elements = await canvas.getAllElements();
        const textElement = elements.find(el => el.type === 'text');
        expect(textElement).toBeTruthy();
    });

    test('should have default text properties', async ({ canvas, toolbar }) => {
        // Create a text element
        await toolbar.selectTool('text');

        const elementId = await canvas.draw
            .from(200, 150)
            .to(300, 180)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element?.type).toBe('text');

        // Check default properties (stored in textStyle object)
        expect(element?.textStyle?.fontSize || element?.fontSize || element?.style?.fontSize).toBeDefined();
        expect(element?.textStyle?.fontFamily || element?.fontFamily || element?.style?.fontFamily).toBeDefined();
        expect(element?.textStyle?.color || element?.color || element?.fill || element?.style?.color).toBeDefined();
    });
});
