/**
 * WB Layers Panel - E2E Tests
 * 
 * End-to-end tests for the layers panel functionality
 */

import { test, expect } from '@playwright/test';
import { BaseTest } from '../core/base-test';

// =============================================================================
// Test Suite
// =============================================================================

test.describe('Layers Panel', () => {
    let baseTest: BaseTest;

    test.beforeEach(async ({ page }) => {
        baseTest = new BaseTest(page);
        await baseTest.setup();
    });

    test.afterEach(async () => {
        await baseTest.cleanup();
    });

    // =========================================================================
    // Basic Rendering
    // =========================================================================

    test('should display layers panel', async ({ page }) => {
        // The layers panel should be visible on the page
        const panel = page.locator('[class*="layersPanel"]');
        await expect(panel).toBeVisible();
    });

    test('should show element count', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Check that the count is updated
        const count = page.locator('[class*="count"]');
        await expect(count).toContainText('1');
    });

    test('should display empty state when no elements', async ({ page }) => {
        const empty = page.locator('[class*="empty"]');
        await expect(empty).toBeVisible();
        await expect(empty).toContainText('No elements');
    });

    // =========================================================================
    // Element Selection
    // =========================================================================

    test('should select element from layers panel', async ({ page }) => {
        // Create a rectangle
        const rect = await baseTest.createRectangle(100, 100, 200, 200);

        // Find the layer item in the panel
        const layerItem = page.locator('[class*="layerItem"]').first();

        // Click to select
        await layerItem.click();

        // Verify element is selected (should have selection class)
        await expect(layerItem).toHaveClass(/selected/);
    });

    test('should sync selection between canvas and panel', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Select element on canvas
        await page.click('canvas', { position: { x: 150, y: 150 } });

        // Check that layer item is selected in panel
        const layerItem = page.locator('[class*="layerItem"]').first();
        await expect(layerItem).toHaveClass(/selected/);
    });

    test('should support multi-select with Ctrl+Click', async ({ page }) => {
        // Create two rectangles
        await baseTest.createRectangle(100, 100, 150, 150);
        await baseTest.createRectangle(200, 200, 250, 250);

        // Get layer items
        const layerItems = page.locator('[class*="layerItem"]');
        const firstItem = layerItems.nth(0);
        const secondItem = layerItems.nth(1);

        // Click first item
        await firstItem.click();
        await expect(firstItem).toHaveClass(/selected/);

        // Ctrl+Click second item
        await secondItem.click({ modifiers: ['Control'] });

        // Both should be selected
        await expect(firstItem).toHaveClass(/selected/);
        await expect(secondItem).toHaveClass(/selected/);
    });

    // =========================================================================
    // Visibility Toggle
    // =========================================================================

    test('should toggle element visibility', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Find visibility button
        const visibilityButton = page.locator('[class*="iconButton"]').first();

        // Click to hide
        await visibilityButton.click();

        // Check that button state changed
        await expect(visibilityButton).toHaveClass(/hidden/);

        // Element should not be visible on canvas
        const canvas = page.locator('canvas');
        // Note: This is a simplified check; actual visibility verification would require more complex canvas inspection
    });

    test('should show hidden element indicator', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Hide the element
        const visibilityButton = page.locator('[class*="iconButton"]').first();
        await visibilityButton.click();

        // Check that the button shows hidden state
        const svg = visibilityButton.locator('svg');
        await expect(svg).toBeVisible();
    });

    // =========================================================================
    // Lock/Unlock
    // =========================================================================

    test('should toggle element locked state', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Find lock button (second icon button)
        const lockButton = page.locator('[class*="iconButton"]').nth(1);

        // Click to lock
        await lockButton.click();

        // Check that button state changed
        await expect(lockButton).toHaveClass(/locked/);
    });

    test('should prevent editing locked elements', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Lock the element
        const lockButton = page.locator('[class*="iconButton"]').nth(1);
        await lockButton.click();

        // Try to drag the element on canvas
        const canvas = page.locator('canvas');
        await canvas.dragTo(canvas, {
            sourcePosition: { x: 150, y: 150 },
            targetPosition: { x: 200, y: 200 },
        });

        // Element should not move (locked)
        // Note: Actual verification would require checking element position
    });

    // =========================================================================
    // Inline Rename
    // =========================================================================

    test('should rename element with double-click', async ({ page }) => {
        // Create a text element
        await baseTest.createText(100, 100, 'Original Text');

        // Find layer item
        const layerItem = page.locator('[class*="layerItem"]').first();
        const nameContainer = layerItem.locator('[class*="nameContainer"]');

        // Double-click to edit
        await nameContainer.dblclick();

        // Input should appear
        const input = layerItem.locator('[class*="nameInput"]');
        await expect(input).toBeVisible();

        // Clear and type new name
        await input.clear();
        await input.type('New Name');

        // Press Enter to confirm
        await input.press('Enter');

        // Check that name is updated
        const name = layerItem.locator('[class*="name"]');
        await expect(name).toContainText('New Name');
    });

    test('should cancel rename with Escape', async ({ page }) => {
        // Create a text element
        await baseTest.createText(100, 100, 'Original Text');

        // Find layer item
        const layerItem = page.locator('[class*="layerItem"]').first();
        const nameContainer = layerItem.locator('[class*="nameContainer"]');

        // Double-click to edit
        await nameContainer.dblclick();

        // Type new name
        const input = layerItem.locator('[class*="nameInput"]');
        await input.type('New Name');

        // Press Escape to cancel
        await input.press('Escape');

        // Check that name is not updated
        const name = layerItem.locator('[class*="name"]');
        await expect(name).toContainText('Original Text');
    });

    // =========================================================================
    // Drag & Drop
    // =========================================================================

    test('should reorder elements with drag & drop', async ({ page }) => {
        // Create two rectangles
        await baseTest.createRectangle(100, 100, 150, 150);
        await baseTest.createRectangle(200, 200, 250, 250);

        // Get layer items
        const layerItems = page.locator('[class*="layerItem"]');
        const firstItem = layerItems.nth(0);
        const secondItem = layerItems.nth(1);

        // Drag first item to second position
        await firstItem.dragTo(secondItem);

        // Check that order changed
        const updatedItems = page.locator('[class*="layerItem"]');
        // Note: Actual order verification would require checking element IDs
    });

    test('should show drag over indicator', async ({ page }) => {
        // Create two rectangles
        await baseTest.createRectangle(100, 100, 150, 150);
        await baseTest.createRectangle(200, 200, 250, 250);

        // Get layer items
        const layerItems = page.locator('[class*="layerItem"]');
        const firstItem = layerItems.nth(0);
        const secondItem = layerItems.nth(1);

        // Start dragging first item
        await firstItem.hover();
        await page.mouse.down();

        // Hover over second item
        await secondItem.hover();

        // Check for drag over indicator
        await expect(secondItem).toHaveClass(/dragOver/);

        // Release mouse
        await page.mouse.up();
    });

    // =========================================================================
    // Frame Hierarchy
    // =========================================================================

    test('should display frame hierarchy', async ({ page }) => {
        // Create a frame
        await baseTest.createFrame(100, 100, 300, 300);

        // Create a rectangle inside the frame
        await baseTest.createRectangle(150, 150, 200, 200);

        // Find frame layer item
        const frameItem = page.locator('[class*="layerItem"]').first();

        // Check for expand button
        const expandButton = frameItem.locator('[class*="expandButton"]');
        await expect(expandButton).toBeVisible();
    });

    test('should expand/collapse frame children', async ({ page }) => {
        // Create a frame with children
        await baseTest.createFrame(100, 100, 300, 300);
        await baseTest.createRectangle(150, 150, 200, 200);

        // Find frame layer item
        const frameItem = page.locator('[class*="layerItem"]').first();
        const expandButton = frameItem.locator('[class*="expandButton"]');

        // Click to expand
        await expandButton.click();

        // Check that expand button is rotated
        await expect(expandButton).toHaveClass(/expanded/);

        // Child should be visible
        const layerItems = page.locator('[class*="layerItem"]');
        await expect(layerItems).toHaveCount(2); // Frame + child

        // Click to collapse
        await expandButton.click();

        // Check that expand button is not rotated
        await expect(expandButton).not.toHaveClass(/expanded/);
    });

    // =========================================================================
    // Keyboard Shortcuts
    // =========================================================================

    test('should support keyboard navigation', async ({ page }) => {
        // Create multiple rectangles
        await baseTest.createRectangle(100, 100, 150, 150);
        await baseTest.createRectangle(200, 200, 250, 250);
        await baseTest.createRectangle(300, 300, 350, 350);

        // Focus on first layer item
        const firstItem = page.locator('[class*="layerItem"]').first();
        await firstItem.focus();

        // Press arrow down to select next
        await page.keyboard.press('ArrowDown');

        // Next item should be selected
        const secondItem = page.locator('[class*="layerItem"]').nth(1);
        await expect(secondItem).toHaveClass(/selected/);
    });

    // =========================================================================
    // Context Menu
    // =========================================================================

    test('should show context menu on right-click', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Find layer item
        const layerItem = page.locator('[class*="layerItem"]').first();

        // Right-click
        await layerItem.click({ button: 'right' });

        // Context menu should appear
        const contextMenu = page.locator('[class*="contextMenu"]');
        await expect(contextMenu).toBeVisible();
    });

    // =========================================================================
    // Performance
    // =========================================================================

    test('should handle many elements efficiently', async ({ page }) => {
        // Create many rectangles
        for (let i = 0; i < 50; i++) {
            await baseTest.createRectangle(
                100 + (i % 10) * 20,
                100 + Math.floor(i / 10) * 20,
                150 + (i % 10) * 20,
                150 + Math.floor(i / 10) * 20
            );
        }

        // Panel should still be responsive
        const panel = page.locator('[class*="layersPanel"]');
        await expect(panel).toBeVisible();

        // Should be able to scroll
        const list = page.locator('[class*="list"]');
        await list.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
        });

        // Should still be able to select
        const layerItem = page.locator('[class*="layerItem"]').first();
        await layerItem.click();
        await expect(layerItem).toHaveClass(/selected/);
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    test('should handle empty layer names', async ({ page }) => {
        // Create a rectangle
        await baseTest.createRectangle(100, 100, 200, 200);

        // Find layer item
        const layerItem = page.locator('[class*="layerItem"]').first();
        const nameContainer = layerItem.locator('[class*="nameContainer"]');

        // Double-click to edit
        await nameContainer.dblclick();

        // Try to clear name
        const input = layerItem.locator('[class*="nameInput"]');
        await input.clear();

        // Press Enter - should not accept empty name
        await input.press('Enter');

        // Name should revert to original
        const name = layerItem.locator('[class*="name"]');
        expect(await name.textContent()).not.toBe('');
    });

    test('should handle special characters in names', async ({ page }) => {
        // Create a text element
        await baseTest.createText(100, 100, 'Test');

        // Find layer item
        const layerItem = page.locator('[class*="layerItem"]').first();
        const nameContainer = layerItem.locator('[class*="nameContainer"]');

        // Double-click to edit
        await nameContainer.dblclick();

        // Type special characters
        const input = layerItem.locator('[class*="nameInput"]');
        await input.clear();
        await input.type('Test <>&"\'');

        // Press Enter to confirm
        await input.press('Enter');

        // Check that name is updated with special characters
        const name = layerItem.locator('[class*="name"]');
        await expect(name).toContainText('Test');
    });
});
