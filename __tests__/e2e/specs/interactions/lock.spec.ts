import { test, expect, setupTest } from '../../core/base-test';

test.describe('Lock/Unlock Interactions', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should lock element with Ctrl+Shift+L', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Switch to select tool (element should be selected)
        await toolbar.selectTool('select');

        // Verify element is not locked initially
        let element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element!.locked).toBeFalsy();

        // Press Ctrl+Shift+L to lock
        await page.keyboard.press('Control+Shift+l');
        await page.waitForTimeout(100);

        // Verify element is now locked
        element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element!.locked).toBe(true);
    });

    test('should unlock element with Ctrl+Shift+L', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Lock the element
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setElementLocked(id, true);
        }, elementId);

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select the element (need to use store since locked elements can't be selected normally)
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setSelection([id]);
        }, elementId);

        // Verify element is locked
        let element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element!.locked).toBe(true);

        // Press Ctrl+Shift+L to unlock
        await page.keyboard.press('Control+Shift+l');
        await page.waitForTimeout(100);

        // Verify element is now unlocked
        element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element!.locked).toBeFalsy();
    });

    test('should toggle lock for multiple selected elements', async ({ page, canvas, toolbar }) => {
        // Create multiple rectangles
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        expect(element1).toBeTruthy();

        // Create second rectangle
        await toolbar.selectTool('rectangle');
        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        expect(element2).toBeTruthy();

        // Verify both elements exist
        let el1 = await canvas.getElement(element1);
        let el2 = await canvas.getElement(element2);
        expect(el1).toBeTruthy();
        expect(el2).toBeTruthy();

        // Switch to select tool
        await toolbar.selectTool('select');

        // Select both elements using store directly (more reliable than selection box)
        await page.evaluate((ids) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setSelection(ids);
        }, [element1, element2]);

        await page.waitForTimeout(100);

        // Verify both are selected
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(2);

        // Verify both are unlocked
        el1 = await canvas.getElement(element1);
        el2 = await canvas.getElement(element2);
        expect(el1!.locked).toBeFalsy();
        expect(el2!.locked).toBeFalsy();

        // Lock both with Ctrl+Shift+L
        await page.keyboard.press('Control+Shift+l');
        await page.waitForTimeout(100);

        // Verify both are locked
        el1 = await canvas.getElement(element1);
        el2 = await canvas.getElement(element2);
        expect(el1!.locked).toBe(true);
        expect(el2!.locked).toBe(true);

        // Select both again (locked elements can still be selected via store)
        await page.evaluate((ids) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setSelection(ids);
        }, [element1, element2]);

        // Unlock both with Ctrl+Shift+L
        await page.keyboard.press('Control+Shift+l');
        await page.waitForTimeout(100);

        // Verify both are unlocked
        el1 = await canvas.getElement(element1);
        el2 = await canvas.getElement(element2);
        expect(el1!.locked).toBeFalsy();
        expect(el2!.locked).toBeFalsy();
    });

    test('should use setElementLocked method from store', async ({ page, canvas, toolbar }) => {
        // Create a rectangle
        await toolbar.selectTool('rectangle');
        const elementId = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Lock using store method
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setElementLocked(id, true);
        }, elementId);

        // Verify element is locked
        let element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element!.locked).toBe(true);

        // Unlock using store method
        await page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().setElementLocked(id, false);
        }, elementId);

        // Verify element is unlocked
        element = await canvas.getElement(elementId);
        expect(element).toBeTruthy();
        expect(element!.locked).toBeFalsy();
    });

    test('should use toggleLocked method from store', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');

        const element1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        expect(element1).toBeTruthy();

        // Create second rectangle
        await toolbar.selectTool('rectangle');
        const element2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        expect(element2).toBeTruthy();

        // Verify both elements exist
        let el1 = await canvas.getElement(element1);
        let el2 = await canvas.getElement(element2);
        expect(el1).toBeTruthy();
        expect(el2).toBeTruthy();

        // Toggle lock using store method
        await page.evaluate((ids) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().toggleLocked(ids);
        }, [element1, element2]);

        // Verify both are locked
        el1 = await canvas.getElement(element1);
        el2 = await canvas.getElement(element2);
        expect(el1!.locked).toBe(true);
        expect(el2!.locked).toBe(true);

        // Toggle again to unlock
        await page.evaluate((ids) => {
            const store = (window as any).__CANVAS_STORE__;
            store?.getState().toggleLocked(ids);
        }, [element1, element2]);

        // Verify both are unlocked
        el1 = await canvas.getElement(element1);
        el2 = await canvas.getElement(element2);
        expect(el1!.locked).toBeFalsy();
        expect(el2!.locked).toBeFalsy();
    });
});
