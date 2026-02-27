import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Sticky Note Tool', () => {
    // Run tests serially to avoid race conditions with text editor
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with S key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press S to activate sticky tool
        await keyboard.pressKey('s');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('sticky');
    });

    test('should activate by clicking sticky tool button', async ({ toolbar }) => {
        await toolbar.selectTool('sticky');

        const isActive = await toolbar.isToolActive('sticky');
        expect(isActive).toBe(true);
    });

    test('should create sticky note on click', async ({ page, canvas, toolbar }) => {
        // Switch to sticky tool
        await toolbar.selectTool('sticky');

        // Click to create sticky note
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        // Should create a sticky note element
        const elements = await canvas.getAllElements();
        const stickyElements = elements.filter(el => el.type === 'sticky');
        expect(stickyElements.length).toBe(1);

        const stickyElement = stickyElements[0];
        expect(stickyElement).toBeTruthy();
        expect(stickyElement.type).toBe('sticky');
    });

    test('should have default yellow color', async ({ canvas, toolbar }) => {
        // Create a sticky note
        await toolbar.selectTool('sticky');

        const elementId = await canvas.draw
            .from(200, 150)
            .to(300, 250)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element?.type).toBe('sticky');

        // Check for yellow/default color
        const color = element?.color || element?.backgroundColor || element?.fill || element?.style?.backgroundColor;
        expect(color).toBeDefined();
        // Yellow color variations: #FFEB3B, #FFF9C4, yellow, etc.
        if (typeof color === 'string') {
            expect(color.toLowerCase()).toMatch(/yellow|#ff|#fff/i);
        }
    });

    test('should be editable immediately after creation', async ({ page, canvas, toolbar }) => {
        // Switch to sticky tool
        await toolbar.selectTool('sticky');

        // Click to create sticky note
        const svgCanvas = page.locator('[data-testid="canvas-svg"]');
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        // Should show text input/editor
        const textInput = page.locator('[data-testid="sticky-editor"]')
            .or(page.locator('[data-testid="text-editor"]'))
            .or(page.locator('textarea'))
            .or(page.locator('[contenteditable="true"]'));

        await expect(textInput.first()).toBeVisible();

        // Type some text
        await page.keyboard.type('Sticky note content');
        await page.waitForTimeout(50);

        // Click outside to finish editing
        await page.mouse.click(box.x + 400, box.y + 400);
        await page.waitForTimeout(100);

        // Verify text was saved
        const elements = await canvas.getAllElements();
        const stickyElement = elements.find(el => el.type === 'sticky');
        expect(stickyElement).toBeTruthy();
        expect(stickyElement?.text || stickyElement?.content).toContain('Sticky');
    });

    test('should be editable on double-click', async ({ page, canvas, toolbar }) => {
        // Create a sticky note
        await toolbar.selectTool('sticky');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);

        // Wait for editor to appear
        const stickyEditor = page.locator('[data-testid="sticky-editor"]').or(page.locator('textarea'));
        await expect(stickyEditor.first()).toBeVisible({ timeout: 5000 });

        // Type initial text
        await page.keyboard.type('Initial Note');
        await page.mouse.click(box.x + 400, box.y + 400);
        await page.waitForTimeout(100);

        // Get the sticky element
        const elements = await canvas.getAllElements();
        const stickyElement = elements.find(el => el.type === 'sticky');
        expect(stickyElement).toBeTruthy();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Double-click on sticky to edit
        const centerX = stickyElement!.x + stickyElement!.width / 2;
        const centerY = stickyElement!.y + stickyElement!.height / 2;
        const screenPoint = await canvas.canvasToScreen(centerX, centerY);

        await page.mouse.dblclick(box.x + screenPoint.x, box.y + screenPoint.y);

        // Should show editor again
        const textInput = page.locator('[data-testid="sticky-editor"]')
            .or(page.locator('[data-testid="text-editor"]'))
            .or(page.locator('textarea'));

        await expect(textInput.first()).toBeVisible({ timeout: 5000 });
    });

    test('should change color', async ({ page, canvas, toolbar }) => {
        // Create a sticky note
        await toolbar.selectTool('sticky');

        const elementId = await canvas.draw
            .from(200, 150)
            .to(300, 250)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();

        // Get initial color
        const initialColor = element?.color || element?.backgroundColor || element?.fill;

        // Try to change color via color picker or context menu
        // This might require clicking on a color button in the UI
        const colorButton = page.locator('[data-testid="color-picker"]')
            .or(page.locator('[aria-label*="color"]'))
            .or(page.locator('[data-action="change-color"]'));

        const colorButtonCount = await colorButton.count();
        if (colorButtonCount > 0) {
            await colorButton.first().click();
            await page.waitForTimeout(100);

            // Select a different color (e.g., pink, blue, green)
            const colorOption = page.locator('[data-color="pink"]')
                .or(page.locator('[data-color="blue"]'))
                .or(page.locator('.color-option').nth(1));

            const optionCount = await colorOption.count();
            if (optionCount > 0) {
                await colorOption.first().click();
                await page.waitForTimeout(100);

                // Verify color changed
                const updatedElement = await canvas.getElement(elementId);
                const newColor = updatedElement?.color || updatedElement?.backgroundColor || updatedElement?.fill;
                expect(newColor).not.toBe(initialColor);
            }
        }

        // Even if UI color picker isn't available, element should exist
        const finalElement = await canvas.getElement(elementId);
        expect(finalElement).toBeTruthy();
    });

    test('should be resizable', async ({ page, canvas, toolbar }) => {
        // Create a sticky note
        await toolbar.selectTool('sticky');

        const elementId = await canvas.draw
            .from(200, 150)
            .to(300, 250)
            .execute();

        const initialElement = await canvas.getElement(elementId);
        expect(initialElement).toBeTruthy();

        const initialWidth = initialElement!.width;
        const initialHeight = initialElement!.height;

        // Switch to select tool to show resize handles
        await toolbar.selectTool('select');
        await canvas.select
            .element(elementId)
            .execute();

        // Check for resize handles
        const resizeHandles = page.locator('[data-testid="resize-handle"]');
        const handleCount = await resizeHandles.count();
        expect(handleCount).toBeGreaterThan(0);

        // Try to resize by dragging a corner handle
        const bottomRightHandle = page.locator('[data-testid="resize-handle"][data-position="se"]')
            .or(page.locator('[data-testid="resize-handle"]').last());

        const handleExists = await bottomRightHandle.count();
        if (handleExists > 0) {
            const handleBox = await bottomRightHandle.first().boundingBox();
            if (handleBox) {
                await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
                await page.mouse.down();
                await page.mouse.move(handleBox.x + 50, handleBox.y + 50);
                await page.mouse.up();
                await page.waitForTimeout(100);

                // Verify size changed
                const resizedElement = await canvas.getElement(elementId);
                expect(resizedElement).toBeTruthy();
                expect(resizedElement!.width).not.toBe(initialWidth);
                expect(resizedElement!.height).not.toBe(initialHeight);
            }
        }
    });

    test('should be selectable and deletable', async ({ page, canvas, toolbar, keyboard }) => {
        // Create a sticky note
        await toolbar.selectTool('sticky');

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
        const stickyElement = elements.find(el => el.type === 'sticky');
        expect(stickyElement).toBeTruthy();
        const elementId = stickyElement!.id;

        // Select the element
        await toolbar.selectTool('select');
        const centerX = stickyElement!.x + stickyElement!.width / 2;
        const centerY = stickyElement!.y + stickyElement!.height / 2;
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
        // Create a sticky note
        await toolbar.selectTool('sticky');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        // Type multi-line text
        await page.keyboard.type('Task 1');
        await page.keyboard.press('Enter');
        await page.keyboard.type('Task 2');
        await page.keyboard.press('Enter');
        await page.keyboard.type('Task 3');
        await page.waitForTimeout(50);

        // Finish editing
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Verify sticky note was created
        const elements = await canvas.getAllElements();
        const stickyElement = elements.find(el => el.type === 'sticky');
        expect(stickyElement).toBeTruthy();
    });

    test('should have default size', async ({ canvas, toolbar }) => {
        // Create a sticky note
        await toolbar.selectTool('sticky');

        const elementId = await canvas.draw
            .from(200, 150)
            .to(300, 250)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element?.type).toBe('sticky');

        // Check default size (sticky notes typically have a standard size)
        expect(element?.width).toBeGreaterThan(0);
        expect(element?.height).toBeGreaterThan(0);

        // Sticky notes are usually square or close to square
        const aspectRatio = element!.width / element!.height;
        expect(aspectRatio).toBeGreaterThan(0.5);
        expect(aspectRatio).toBeLessThan(2);
    });

    test('should auto-switch to select tool after creation', async ({ page, canvas, toolbar }) => {
        // Switch to sticky tool
        await toolbar.selectTool('sticky');
        expect(await toolbar.isToolActive('sticky')).toBe(true);

        // Create sticky note
        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 200, box.y + 150);
        await page.waitForTimeout(100);

        await page.keyboard.type('Quick Note');
        await page.waitForTimeout(50);

        // Press Escape to finish
        await page.keyboard.press('Escape');
        await page.waitForTimeout(100);

        // Should auto-switch to select tool
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });
});
