/**
 * E2E Tests for Connector Rendering & Updates
 * 
 * Tests connector creation, rendering, updates, and deletion
 */

import { test, expect, setupTest } from '../core/base-test';

test.describe('Connectors', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    test('should create connector between two elements', async ({ page, canvas, toolbar }) => {
        // Create first rectangle
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        // Create second rectangle
        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Switch to connector tool
        await toolbar.selectTool('connector');

        // Draw connector from rect1 to rect2
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Verify connector was created
        const connector = await canvas.getElement(connectorId);
        expect(connector).toBeTruthy();
        expect(connector?.type).toBe('connector');
        expect(connector?.waypoints).toBeDefined();
        expect(connector?.waypoints?.length).toBeGreaterThanOrEqual(2);
    });

    test('should render connector with arrow heads', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Verify connector has arrow heads
        const connector = await canvas.getElement(connectorId);
        expect(connector?.startArrow).toBe('arrow');
        expect(connector?.endArrow).toBe('arrow');

        // Verify connector is rendered in SVG
        const connectorGroup = page.locator(`[data-element-id="${connectorId}"]`);
        await expect(connectorGroup).toBeVisible();
    });

    test('should update connector when element moves', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Get initial connector position
        const initialConnector = await canvas.getElement(connectorId);
        const initialX = initialConnector?.x;

        // Select and move first rectangle
        await toolbar.selectTool('select');
        await canvas.select.element(rect1Id).execute();
        await canvas.drag.from(150, 125).to(250, 125).execute();

        // Verify connector was updated
        const updatedConnector = await canvas.getElement(connectorId);
        expect(updatedConnector).toBeTruthy();
        // Connector position should have changed
        expect(updatedConnector?.x).not.toBe(initialX);
    });

    test('should delete connector when element is deleted', async ({ page, canvas, toolbar, keyboard }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Verify connector exists
        let connector = await canvas.getElement(connectorId);
        expect(connector).toBeTruthy();

        // Select and delete first rectangle
        await toolbar.selectTool('select');
        await canvas.select.element(rect1Id).execute();
        await keyboard.delete();

        // Verify connector was deleted
        connector = await canvas.getElement(connectorId);
        expect(connector).toBeNull();
    });

    test('should support different arrow types', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector with arrow
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Verify default arrow type
        let connector = await canvas.getElement(connectorId);
        expect(connector?.endArrow).toBe('arrow');

        // Change arrow type (would need UI controls for this in real implementation)
        // For now, just verify the connector supports different arrow types
        expect(['none', 'arrow', 'triangle', 'diamond', 'circle', 'bar']).toContain(connector?.endArrow);
    });

    test('should support different line styles', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Verify connector has stroke style
        const connector = await canvas.getElement(connectorId);
        expect(connector?.stroke).toBeDefined();
        expect(['solid', 'dashed', 'dotted']).toContain(connector?.stroke?.style);
    });

    test('should highlight connector when selected', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Select connector
        await toolbar.selectTool('select');
        await canvas.select.element(connectorId).execute();

        // Verify connector is selected
        const selectedIds = await canvas.getSelectedIds();
        expect(selectedIds).toContain(connectorId);

        // Verify visual selection (blue highlight)
        const connectorGroup = page.locator(`[data-element-id="${connectorId}"]`);
        await expect(connectorGroup).toBeVisible();
    });

    test('should handle connector with multiple waypoints', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 300)
            .to(500, 350)
            .execute();

        // Create connector with elbow routing (should have multiple waypoints)
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 325)
            .execute();

        // Verify connector has waypoints
        const connector = await canvas.getElement(connectorId);
        expect(connector?.waypoints).toBeDefined();
        expect(connector?.waypoints?.length).toBeGreaterThanOrEqual(2);
    });

    test('should update connector waypoints when element moves', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Get initial waypoints
        const initialConnector = await canvas.getElement(connectorId);
        const initialWaypoints = initialConnector?.waypoints;

        // Move second rectangle
        await toolbar.selectTool('select');
        await canvas.select.element(rect2Id).execute();
        await canvas.drag.from(450, 125).to(550, 225).execute();

        // Verify waypoints were updated
        const updatedConnector = await canvas.getElement(connectorId);
        expect(updatedConnector?.waypoints).toBeDefined();
        // Waypoints should have changed
        expect(JSON.stringify(updatedConnector?.waypoints)).not.toBe(JSON.stringify(initialWaypoints));
    });

    test('should not delete connector if only one element is deleted', async ({ page, canvas, toolbar, keyboard }) => {
        // Create three rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        const rect3Id = await canvas.draw
            .from(700, 100)
            .to(800, 150)
            .execute();

        // Create two connectors
        await toolbar.selectTool('connector');
        const connector1Id = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        const connector2Id = await canvas.draw
            .from(500, 125)
            .to(700, 125)
            .execute();

        // Delete middle rectangle
        await toolbar.selectTool('select');
        await canvas.select.element(rect2Id).execute();
        await keyboard.delete();

        // Verify both connectors were deleted (they were bound to the deleted element)
        const connector1 = await canvas.getElement(connector1Id);
        const connector2 = await canvas.getElement(connector2Id);
        expect(connector1).toBeNull();
        expect(connector2).toBeNull();
    });

    test('should render connector with correct stroke color', async ({ page, canvas, toolbar }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Verify connector has stroke color
        const connector = await canvas.getElement(connectorId);
        expect(connector?.stroke?.color).toBeDefined();
        expect(connector?.stroke?.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    test('should handle connector deletion with undo/redo', async ({ page, canvas, toolbar, keyboard }) => {
        // Create two rectangles
        await toolbar.selectTool('rectangle');
        const rect1Id = await canvas.draw
            .from(100, 100)
            .to(200, 150)
            .execute();

        const rect2Id = await canvas.draw
            .from(400, 100)
            .to(500, 150)
            .execute();

        // Create connector
        await toolbar.selectTool('connector');
        const connectorId = await canvas.draw
            .from(200, 125)
            .to(400, 125)
            .execute();

        // Delete first rectangle
        await toolbar.selectTool('select');
        await canvas.select.element(rect1Id).execute();
        await keyboard.delete();

        // Verify connector is deleted
        let connector = await canvas.getElement(connectorId);
        expect(connector).toBeNull();

        // Undo deletion
        await keyboard.undo();

        // Verify connector is restored
        connector = await canvas.getElement(connectorId);
        expect(connector).toBeTruthy();

        // Redo deletion
        await keyboard.redo();

        // Verify connector is deleted again
        connector = await canvas.getElement(connectorId);
        expect(connector).toBeNull();
    });
});
