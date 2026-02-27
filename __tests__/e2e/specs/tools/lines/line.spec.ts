import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Line Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with L key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press L to activate line tool
        await keyboard.pressKey('l');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('line');
    });

    test('should create line on drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('line');
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
    });

    test('should create straight horizontal line with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 150)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('line');

        // Line should be constrained to horizontal (y coordinates should be same)
        const points = element!.points as Array<{ x: number; y: number }>;
        expect(points[0].y).toBe(points[1].y);
    });

    test('should create straight vertical line with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(150, 300)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('line');

        // Line should be constrained to vertical (x coordinates should be same)
        const points = element!.points as Array<{ x: number; y: number }>;
        expect(points[0].x).toBe(points[1].x);
    });

    test('should create 45-degree line with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(250, 250)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('line');

        // Line should be constrained to 45 degrees
        const points = element!.points as Array<{ x: number; y: number }>;
        const dx = Math.abs(points[1].x - points[0].x);
        const dy = Math.abs(points[1].y - points[0].y);
        expect(Math.abs(dx - dy)).toBeLessThan(5); // Allow small tolerance
    });

    test('should apply stroke style', async ({ canvas, toolbar, page }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.stroke).toBeDefined();
        expect(element!.stroke.width).toBeGreaterThan(0);
    });

    test('should NOT have arrow markers', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('line');

        // Line should not have arrow markers
        expect(element!.markerStart).toBeUndefined();
        expect(element!.markerEnd).toBeUndefined();
    });

    test('should auto-switch to select after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');
        expect(await toolbar.isToolActive('line')).toBe(true);

        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Tool should auto-switch to select
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should be selectable after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Line should be automatically selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(id);
    });

    test('should be deletable with Delete key', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('line');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify line exists
        let element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Line should be selected, delete it
        await keyboard.delete();

        // Verify line is deleted
        element = await canvas.getElement(id);
        expect(element).toBeNull();
    });

    test('should create multiple lines in sequence', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('line');

        const id1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Need to reactivate line tool after auto-switch
        await toolbar.selectTool('line');

        const id2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        const element1 = await canvas.getElement(id1);
        const element2 = await canvas.getElement(id2);

        expect(element1).not.toBeNull();
        expect(element2).not.toBeNull();
        expect(element1!.type).toBe('line');
        expect(element2!.type).toBe('line');
        expect(id1).not.toBe(id2);
    });
});
