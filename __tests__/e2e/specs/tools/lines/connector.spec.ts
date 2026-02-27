import { test, expect, setupTest } from '../../../core/base-test';

test.describe('Connector Tool', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should activate with C key', async ({ toolbar, keyboard }) => {
        // Ensure we start with select tool
        await toolbar.selectTool('select');
        expect(await toolbar.isToolActive('select')).toBe(true);

        // Press C to activate connector tool
        await keyboard.pressKey('c');

        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('connector');
    });

    test('should create connector on drag', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('connector');
        expect(element!.x).toBe(100);
        expect(element!.y).toBe(100);
    });

    test('should create straight horizontal connector with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 150)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('connector');

        // Connector should be constrained to horizontal (y coordinates should be same)
        const waypoints = element!.waypoints as Array<{ x: number; y: number }>;
        expect(waypoints[0].y).toBe(waypoints[1].y);
    });

    test('should create straight vertical connector with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(150, 300)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('connector');

        // Connector should be constrained to vertical (x coordinates should be same)
        const waypoints = element!.waypoints as Array<{ x: number; y: number }>;
        expect(waypoints[0].x).toBe(waypoints[1].x);
    });

    test('should create 45-degree connector with Shift', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(250, 250)
            .withShift()
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('connector');

        // Connector should be constrained to 45 degrees
        const waypoints = element!.waypoints as Array<{ x: number; y: number }>;
        const dx = Math.abs(waypoints[1].x - waypoints[0].x);
        const dy = Math.abs(waypoints[1].y - waypoints[0].y);
        expect(Math.abs(dx - dy)).toBeLessThan(5); // Allow small tolerance
    });

    test('should apply stroke style', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.stroke).toBeDefined();
        expect(element!.stroke.width).toBeGreaterThan(0);
    });

    test('should have both start and end arrow markers', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('connector');

        // Connector should have both start and end markers
        expect(element!.startArrow).toBe('arrow');
        expect(element!.endArrow).toBe('arrow');
    });

    test('should have bidirectional arrows', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        const element = await canvas.getElement(id);
        expect(element).not.toBeNull();
        expect(element!.type).toBe('connector');

        // Both markers should be defined (bidirectional)
        expect(element!.startArrow).toBe('arrow');
        expect(element!.endArrow).toBe('arrow');
    });

    test('should auto-switch to select after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');
        expect(await toolbar.isToolActive('connector')).toBe(true);

        await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Tool should auto-switch to select
        const activeTool = await toolbar.getActiveTool();
        expect(activeTool).toBe('select');
    });

    test('should be selectable after creation', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Connector should be automatically selected after creation
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds.length).toBe(1);
        expect(selectedIds[0]).toBe(id);
    });

    test('should be deletable with Delete key', async ({ canvas, toolbar, keyboard }) => {
        await toolbar.selectTool('connector');

        const id = await canvas.draw
            .from(100, 100)
            .to(300, 200)
            .execute();

        // Verify connector exists
        let element = await canvas.getElement(id);
        expect(element).not.toBeNull();

        // Connector should be selected, delete it
        await keyboard.delete();

        // Verify connector is deleted
        element = await canvas.getElement(id);
        expect(element).toBeNull();
    });

    test('should create multiple connectors in sequence', async ({ canvas, toolbar }) => {
        await toolbar.selectTool('connector');

        const id1 = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Need to reactivate connector tool after auto-switch
        await toolbar.selectTool('connector');

        const id2 = await canvas.draw
            .from(250, 100)
            .to(350, 150)
            .execute();

        const element1 = await canvas.getElement(id1);
        const element2 = await canvas.getElement(id2);

        expect(element1).not.toBeNull();
        expect(element2).not.toBeNull();
        expect(element1!.type).toBe('connector');
        expect(element2!.type).toBe('connector');
        expect(id1).not.toBe(id2);
    });

    test.skip('should connect shapes when endpoints overlap', async ({ canvas, toolbar }) => {
        // TODO: Implement shape connection logic
        // This test is skipped until connection detection is implemented

        // Create two rectangles
        await toolbar.selectTool('rectangle');

        const rect1Id = await canvas.draw
            .from(50, 50)
            .to(150, 100)
            .execute();

        await toolbar.selectTool('rectangle');

        const rect2Id = await canvas.draw
            .from(250, 150)
            .to(350, 200)
            .execute();

        // Create connector between them
        await toolbar.selectTool('connector');

        const connectorId = await canvas.draw
            .from(150, 75)  // Right edge of rect1
            .to(250, 175)   // Left edge of rect2
            .execute();

        const connector = await canvas.getElement(connectorId);
        expect(connector).not.toBeNull();
        expect(connector!.type).toBe('connector');

        // Connector should have connection information
        // (exact implementation depends on your connection logic)
        expect(connector!.startConnection || connector!.endConnection).toBeDefined();
    });
});
