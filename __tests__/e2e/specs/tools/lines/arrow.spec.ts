import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Arrow Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with A key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press A to activate arrow tool
        await keyboard.pressKey('a');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('arrow');
    });

    test('should create arrow on drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('arrow');
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
    });

    test('should create straight horizontal arrow with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 150)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('arrow');

        // Arrow should be constrained to horizontal (y coordinates should be same)
        const points = element!.points as Array<{ x: number; y: number }>;
        expect(points[0].y).toBe(points[1].y);
    });

    test('should create straight vertical arrow with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(150, 300)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('arrow');

        // Arrow should be constrained to vertical (x coordinates should be same)
        const points = element!.points as Array<{ x: number; y: number }>;
        expect(points[0].x).toBe(points[1].x);
    });

    test('should create 45-degree arrow with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(250, 250)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('arrow');

        // Arrow should be constrained to 45 degrees
        const points = element!.points as Array<{ x: number; y: number }>;
        const dx = Math.abs(points[1].x - points[0].x);
        const dy = Math.abs(points[1].y - points[0].y);
        expect(Math.abs(dx - dy)).toBeLessThan(5); // Allow small tolerance
    });

    test('should apply stroke style', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.stroke).toBeDefined();
        expect(element!.stroke.width).toBeGreaterThan(0);
    });

    test('should have end arrow marker', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('arrow');

        // Arrow should have end marker but not start marker
        expect(element!.endArrow).toBeDefined();
        expect(element!.endArrow).toBe('arrow');
        expect(element!.startArrow).toBe('none');
    });

    test('should NOT have start arrow marker', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('arrow');

        // Arrow should only have end marker
        expect(element!.startArrow).toBe('none');
    });

    test('should auto-switch to select after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');
        expect(await toolbar.isToolActive('arrow')).toBe(true);

        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Tool should auto-switch to select
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should be selectable after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Arrow should be automatically selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(id);
    });

    test('should be deletable with Delete key', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify arrow exists
        let element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Arrow should be selected, delete it
        await keyboard.delete();

        // Verify arrow is deleted
        element = await canvas.getElement(id);
        expect(element).toBeNull();
    });

    test('should create multiple arrows in sequence', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Need to reactivate arrow tool after auto-switch
        await toolbar.selectTool('arrow');

        const id2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        const element1 = await canvas.getElement(id1);
        const element2 = await canvas.getElement(id2);

        expect(element1).not.toBeNull();
        expect(element2).not.toBeNull();
        expect(element1!.type).toBe('arrow');
        expect(element2!.type).toBe('arrow');
        expect(id1).not.toBe(id2);
    });

    test('should point in the direction of drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('arrow');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        const points = element!.points as Array<{ x: number; y: number }>;

        // First point should be at start
        expect(points[0].x).toBeLessThan(points[1].x);
        expect(points[0].y).toBeLessThan(points[1].y);

        // Arrow marker should be at the end (second point)
        expect(element!.endArrow).toBe('arrow');
    });
});
