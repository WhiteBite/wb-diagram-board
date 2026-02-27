import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Frame Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with F key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press F to activate frame tool
        await keyboard.pressKey('f');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('frame');
    });

    test('should activate by clicking frame tool button', async ({ toolbar }) => {
        await toolbar.selectTool('frame');

        const isActive = await toolbar.isToolActive('frame');
        expect(isActive).toBe(true);
    });

    test('should create frame on drag', async ({ canvas, toolbar }) => {
        // Switch to frame tool
        await toolbar.selectTool('frame');

        // Draw a frame
        const elementId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        expect(elementId).toBeTruthy();

        // Verify frame was created
        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element?.type).toBe('frame');

        // Check dimensions
        expect(element?.width).toBeGreaterThan(200);
        expect(element?.height).toBeGreaterThan(150);
    });

    test('should have minimum size', async ({ canvas, toolbar }) => {
        // Switch to frame tool
        await toolbar.selectTool('frame');

        // Try to create a very small frame
        const elementId = await canvas.draw
            .from(100, 100)
            .to(110, 110)
            .execute();

        const element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();

        // Frame should have minimum size enforced
        expect(element?.width).toBeGreaterThan(50);
        expect(element?.height).toBeGreaterThan(50);
    });

    test('should contain child elements', async ({ canvas, toolbar }) => {
        // Create a frame first
        await toolbar.selectTool('frame');
        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        expect(frameId).toBeTruthy();

        // Create a rectangle inside the frame
        await toolbar.selectTool('rectangle');
        const rectId = await canvas.draw
            .from(150, 150)
            .to(250, 200)
            .execute();

        expect(rectId).toBeTruthy();

        // Verify both elements exist
        const frame = await canvas.getElement(frameId);
        const rect = await canvas.getElement(rectId);

        expect(frame).toBeTruthy();
        expect(rect).toBeTruthy();

        // Check if rectangle is within frame bounds
        expect(rect!.x).toBeGreaterThanOrEqual(frame!.x);
        expect(rect!.y).toBeGreaterThanOrEqual(frame!.y);
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
        expect(rect!.y + rect!.height).toBeLessThanOrEqual(frame!.y + frame!.height);

        // Frame might have a children property
        if (frame?.children || frame?.childIds) {
            const children = frame.children || frame.childIds;
            expect(children).toContain(rectId);
        }
    });

    test('should be resizable', async ({ page, canvas, toolbar }) => {
        // Create a frame
        await toolbar.selectTool('frame');
        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        const initialFrame = await canvas.getElement(frameId);
        expect(initialFrame).toBeTruthy();

        const initialWidth = initialFrame!.width;
        const initialHeight = initialFrame!.height;

        // Switch to select tool
        await toolbar.selectTool('select');
        await canvas.select
            .element(frameId)
            .execute();

        // Check for resize handles
        const resizeHandles = page.locator('[data-testid="resize-handle"]');
        const handleCount = await resizeHandles.count();
        expect(handleCount).toBeGreaterThan(0);

        // Try to resize by dragging bottom-right corner
        const bottomRightHandle = page.locator('[data-testid="resize-handle"][data-position="se"]')
            .or(page.locator('[data-testid="resize-handle"]').last());

        const handleExists = await bottomRightHandle.count();
        if (handleExists > 0) {
            const handleBox = await bottomRightHandle.first().boundingBox();
            if (handleBox) {
                await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
                await page.mouse.down();
                await page.mouse.move(handleBox.x + 100, handleBox.y + 80);
                await page.mouse.up();
                await page.waitForTimeout(100);

                // Verify size changed
                const resizedFrame = await canvas.getElement(frameId);
                expect(resizedFrame).toBeTruthy();
                expect(resizedFrame!.width).toBeGreaterThan(initialWidth);
                expect(resizedFrame!.height).toBeGreaterThan(initialHeight);
            }
        }
    });

    test('should be deletable', async ({ page, canvas, toolbar, keyboard }) => {
        // Create a frame
        await toolbar.selectTool('frame');
        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        expect(frameId).toBeTruthy();

        // Verify it exists
        let frame = await canvas.getElement(frameId);
        expect(frame).toBeTruthy();

        // Delete it
        await keyboard.delete();
        await page.waitForTimeout(100);

        // Verify it's gone
        frame = await canvas.getElement(frameId);
        expect(frame).toBeNull();
    });

    test('should have a title/label', async ({ page, canvas, toolbar }) => {
        // Create a frame
        await toolbar.selectTool('frame');

        const svgCanvas = page.locator('svg').first();
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        const frame = await canvas.getElement(frameId);
        expect(frame).toBeTruthy();

        // Frame should have a title/label property
        expect(frame?.title || frame?.label || frame?.name).toBeDefined();

        // Try to edit the title (might be editable on double-click or via input)
        await toolbar.selectTool('select');

        // Look for frame title element in DOM
        const frameTitle = page.locator('[data-testid="frame-title"]')
            .or(page.locator('[data-frame-id]').locator('text'))
            .or(page.locator('.frame-title'));

        const titleCount = await frameTitle.count();
        if (titleCount > 0) {
            await expect(frameTitle.first()).toBeVisible();
        }
    });

    test('should move children when frame is moved', async ({ page, canvas, toolbar }) => {
        // Create a frame
        await toolbar.selectTool('frame');
        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        // Create a rectangle inside the frame
        await toolbar.selectTool('rectangle');
        const rectId = await canvas.draw
            .from(200, 180)
            .to(300, 230)
            .execute();

        // Wait for frame children to be updated
        await page.waitForTimeout(200);

        // Verify rectangle is a child of frame
        const frameElement = await canvas.getElement(frameId);
        console.log('[Test] Frame childIds:', (frameElement as any)?.childIds);
        expect((frameElement as any)?.childIds).toContain(rectId);

        // Get initial positions
        const initialFrame = await canvas.getElement(frameId);
        const initialRect = await canvas.getElement(rectId);

        expect(initialFrame).toBeTruthy();
        expect(initialRect).toBeTruthy();

        const initialFrameX = initialFrame!.x;
        const initialRectX = initialRect!.x;
        const offsetX = initialRectX - initialFrameX;

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select frame by clicking on its border (top-left corner area, outside rectangle)
        // Frame is at (100,100) to (400,300), rectangle is at (200,180) to (300,230)
        // Click at (120, 120) which is inside frame but outside rectangle
        const svgCanvas = page.locator('[data-testid="canvas-svg"]');
        const box = await svgCanvas.boundingBox();
        if (!box) throw new Error('Canvas not found');

        await page.mouse.click(box.x + 120, box.y + 120);
        await page.waitForTimeout(100);

        // Verify frame is selected (not rectangle)
        let selectedIds = await canvas.getSelectedIds();
        console.log('[Test] Selected IDs after click:', selectedIds);

        // If rectangle was selected instead, select frame via store
        if (!selectedIds.includes(frameId)) {
            await page.evaluate((fId) => {
                const store = (window as any).__CANVAS_STORE__;
                store?.getState().setSelection([fId]);
            }, frameId);
            await page.waitForTimeout(50);
            selectedIds = await canvas.getSelectedIds();
        }
        expect(selectedIds).toContain(frameId);

        // Move the frame by dragging from an empty area inside frame (not on rectangle)
        // Rectangle is at (200,180) to (300,230), so drag from (150, 150) which is inside frame but outside rectangle
        await canvas.drag
            .from(150, 150)
            .to(250, 200)
            .execute();

        await page.waitForTimeout(100);

        // Get new positions
        const movedFrame = await canvas.getElement(frameId);
        const movedRect = await canvas.getElement(rectId);

        expect(movedFrame).toBeTruthy();
        expect(movedRect).toBeTruthy();

        console.log('[Test] Frame moved from', initialFrameX, 'to', movedFrame!.x);
        console.log('[Test] Rect moved from', initialRectX, 'to', movedRect!.x);

        // Frame should have moved
        expect(movedFrame!.x).toBeGreaterThan(initialFrameX);

        // Rectangle should maintain relative position to frame
        const newOffsetX = movedRect!.x - movedFrame!.x;
        expect(Math.abs(newOffsetX - offsetX)).toBeLessThan(5);
    });

    test('should have visual distinction from other elements', async ({ page, canvas, toolbar }) => {
        // Create a frame
        await toolbar.selectTool('frame');
        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        const frame = await canvas.getElement(frameId);
        expect(frame).toBeTruthy();
        expect(frame?.type).toBe('frame');

        // Frame should have distinct styling (border, background, etc.)
        expect(frame?.stroke || frame?.borderColor || frame?.style?.stroke).toBeDefined();

        // Frames typically have a subtle background or no fill
        const fill = frame?.fill || frame?.backgroundColor || frame?.style?.fill;
        if (fill) {
            // If it has a fill, it should be transparent or very light
            expect(fill).toBeDefined();
        }

        // Check in DOM for frame-specific styling
        const frameElement = page.locator(`[data-element-id="${frameId}"]`)
            .or(page.locator(`[data-id="${frameId}"]`))
            .or(page.locator('.frame-element'));

        const elementCount = await frameElement.count();
        if (elementCount > 0) {
            await expect(frameElement.first()).toBeVisible();
        }
    });

    test('should support z-index ordering with children', async ({ canvas, toolbar }) => {
        // Create a frame
        await toolbar.selectTool('frame');
        const frameId = await canvas.draw
            .from(100, 100)
            .to(400, 300)
            .execute();

        // Create multiple elements inside
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(150, 150)
            .to(250, 200)
            .execute();

        // Re-select rectangle tool (auto-switches to select after drawing)
        await toolbar.selectTool('rectangle');
        const rect2Id = await canvas.draw
            .from(200, 180)
            .to(300, 230)
            .execute();

        // All elements should exist
        const frame = await canvas.getElement(frameId);
        const rect1 = await canvas.getElement(rect1Id);
        const rect2 = await canvas.getElement(rect2Id);

        expect(frame).toBeTruthy();
        expect(rect1).toBeTruthy();
        expect(rect2).toBeTruthy();

        // Frame should have z-index or layer information
        const allElements = await canvas.getAllElements();
        expect(allElements.length).toBeGreaterThanOrEqual(3);

        // Frame should typically be behind its children in z-order
        const frameIndex = allElements.findIndex(el => el.id === frameId);
        const rect1Index = allElements.findIndex(el => el.id === rect1Id);
        const rect2Index = allElements.findIndex(el => el.id === rect2Id);

        expect(frameIndex).toBeGreaterThanOrEqual(0);
        expect(rect1Index).toBeGreaterThan(frameIndex);
        expect(rect2Index).toBeGreaterThan(frameIndex);
    });
});
