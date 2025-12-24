/**
 * WB Guides - E2E Tests
 * 
 * End-to-end tests for alignment guides and snapping system
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// Test Setup
// =============================================================================

test.describe('Alignment Guides & Snapping System', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the canvas application
        await page.goto('http://localhost:5173');

        // Wait for canvas to be ready
        await page.waitForSelector('svg[data-testid="canvas"]', { timeout: 5000 });
    });

    // =========================================================================
    // Guide Display Tests
    // =========================================================================

    test.describe('Guide Display', () => {
        test('should display guides when moving element', async ({ page }) => {
            // Create first rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Create second rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 300);
            await page.mouse.down();
            await page.mouse.move(200, 400);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on first rectangle to select it
            await page.click('[data-testid="element-el1"]');

            // Start dragging
            await page.mouse.move(150, 150);
            await page.mouse.down();
            await page.mouse.move(100, 150);

            // Check if guides are visible
            const guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBeGreaterThan(0);

            await page.mouse.up();
        });

        test('should hide guides when not dragging', async ({ page }) => {
            // Create rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Check that no guides are visible initially
            const guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBe(0);
        });

        test('should show guides for multiple aligned elements', async ({ page }) => {
            // Create three rectangles aligned vertically
            for (let i = 0; i < 3; i++) {
                await page.click('[data-testid="tool-rectangle"]');
                await page.mouse.move(100, 100 + i * 150);
                await page.mouse.down();
                await page.mouse.move(200, 200 + i * 150);
                await page.mouse.up();
            }

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on first rectangle
            await page.click('[data-testid="element-el1"]');

            // Start dragging
            await page.mouse.move(150, 150);
            await page.mouse.down();
            await page.mouse.move(100, 150);

            // Check if guides are visible
            const guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBeGreaterThan(0);

            await page.mouse.up();
        });
    });

    // =========================================================================
    // Grid Snapping Tests
    // =========================================================================

    test.describe('Grid Snapping', () => {
        test('should snap element to grid', async ({ page }) => {
            // Create rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on rectangle to select it
            await page.click('[data-testid="element-el1"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el1"]');
            const initialBox = await initialElement.boundingBox();

            // Drag to non-grid position
            await page.mouse.move(initialBox!.x + 50, initialBox!.y + 50);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x + 55, initialBox!.y + 55);
            await page.mouse.up();

            // Check that element snapped to grid
            const finalElement = await page.locator('[data-testid="element-el1"]');
            const finalBox = await finalElement.boundingBox();

            // Position should be snapped to grid (20px by default)
            expect(finalBox!.x % 20).toBeLessThan(2);
            expect(finalBox!.y % 20).toBeLessThan(2);
        });

        test('should respect snap to grid toggle', async ({ page }) => {
            // Disable snap to grid
            await page.click('[data-testid="toggle-snap-grid"]');

            // Create rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on rectangle to select it
            await page.click('[data-testid="element-el1"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el1"]');
            const initialBox = await initialElement.boundingBox();

            // Drag to non-grid position
            await page.mouse.move(initialBox!.x + 50, initialBox!.y + 50);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x + 55, initialBox!.y + 55);
            await page.mouse.up();

            // Check that element did NOT snap to grid
            const finalElement = await page.locator('[data-testid="element-el1"]');
            const finalBox = await finalElement.boundingBox();

            // Position should be at 55, not snapped
            expect(Math.abs(finalBox!.x - (initialBox!.x + 55))).toBeLessThan(5);
        });
    });

    // =========================================================================
    // Element Snapping Tests
    // =========================================================================

    test.describe('Element Snapping', () => {
        test('should snap element to other element edges', async ({ page }) => {
            // Create first rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Create second rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(300, 100);
            await page.mouse.down();
            await page.mouse.move(400, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on second rectangle
            await page.click('[data-testid="element-el2"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el2"]');
            const initialBox = await initialElement.boundingBox();

            // Drag close to first rectangle
            await page.mouse.move(initialBox!.x, initialBox!.y);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x - 105, initialBox!.y);
            await page.mouse.up();

            // Check that element snapped to first rectangle's edge
            const finalElement = await page.locator('[data-testid="element-el2"]');
            const finalBox = await finalElement.boundingBox();

            // Should snap to left edge of first rectangle (200px)
            expect(Math.abs(finalBox!.x + 100 - 200)).toBeLessThan(5);
        });

        test('should snap element to other element centers', async ({ page }) => {
            // Create first rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Create second rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(300, 100);
            await page.mouse.down();
            await page.mouse.move(400, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on second rectangle
            await page.click('[data-testid="element-el2"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el2"]');
            const initialBox = await initialElement.boundingBox();

            // Drag to align centers
            await page.mouse.move(initialBox!.x, initialBox!.y);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x - 50, initialBox!.y);
            await page.mouse.up();

            // Check that element snapped to center
            const finalElement = await page.locator('[data-testid="element-el2"]');
            const finalBox = await finalElement.boundingBox();

            // Centers should be aligned
            const firstCenter = 150; // (100 + 200) / 2
            const secondCenter = finalBox!.x + 50; // (x + x + 100) / 2
            expect(Math.abs(firstCenter - secondCenter)).toBeLessThan(5);
        });

        test('should respect snap to elements toggle', async ({ page }) => {
            // Disable snap to elements
            await page.click('[data-testid="toggle-snap-elements"]');

            // Create first rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Create second rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(300, 100);
            await page.mouse.down();
            await page.mouse.move(400, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on second rectangle
            await page.click('[data-testid="element-el2"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el2"]');
            const initialBox = await initialElement.boundingBox();

            // Drag close to first rectangle
            await page.mouse.move(initialBox!.x, initialBox!.y);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x - 105, initialBox!.y);
            await page.mouse.up();

            // Check that element did NOT snap
            const finalElement = await page.locator('[data-testid="element-el2"]');
            const finalBox = await finalElement.boundingBox();

            // Should NOT snap to first rectangle's edge
            expect(Math.abs(finalBox!.x - (initialBox!.x - 105))).toBeLessThan(5);
        });
    });

    // =========================================================================
    // Configuration Tests
    // =========================================================================

    test.describe('Configuration', () => {
        test('should toggle guides visibility', async ({ page }) => {
            // Create rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on rectangle
            await page.click('[data-testid="element-el1"]');

            // Start dragging
            await page.mouse.move(150, 150);
            await page.mouse.down();
            await page.mouse.move(100, 150);

            // Check guides are visible
            let guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBeGreaterThan(0);

            // Toggle guides off
            await page.click('[data-testid="toggle-guides"]');

            // Guides should be hidden
            guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBe(0);

            await page.mouse.up();
        });

        test('should update snap threshold', async ({ page }) => {
            // Set snap threshold to 5px
            await page.click('[data-testid="snap-threshold-input"]');
            await page.fill('[data-testid="snap-threshold-input"]', '5');

            // Create first rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Create second rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(300, 100);
            await page.mouse.down();
            await page.mouse.move(400, 200);
            await page.mouse.up();

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on second rectangle
            await page.click('[data-testid="element-el2"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el2"]');
            const initialBox = await initialElement.boundingBox();

            // Drag 10px away (beyond threshold)
            await page.mouse.move(initialBox!.x, initialBox!.y);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x - 110, initialBox!.y);
            await page.mouse.up();

            // Check that element did NOT snap (beyond threshold)
            const finalElement = await page.locator('[data-testid="element-el2"]');
            const finalBox = await finalElement.boundingBox();

            expect(Math.abs(finalBox!.x - (initialBox!.x - 110))).toBeLessThan(5);
        });
    });

    // =========================================================================
    // Multiple Element Tests
    // =========================================================================

    test.describe('Multiple Elements', () => {
        test('should handle snapping with multiple elements', async ({ page }) => {
            // Create three rectangles
            for (let i = 0; i < 3; i++) {
                await page.click('[data-testid="tool-rectangle"]');
                await page.mouse.move(100 + i * 150, 100);
                await page.mouse.down();
                await page.mouse.move(200 + i * 150, 200);
                await page.mouse.up();
            }

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on first rectangle
            await page.click('[data-testid="element-el1"]');

            // Start dragging
            await page.mouse.move(150, 150);
            await page.mouse.down();
            await page.mouse.move(100, 150);

            // Check if guides are visible
            const guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBeGreaterThan(0);

            await page.mouse.up();
        });

        test('should snap multiple selected elements together', async ({ page }) => {
            // Create two rectangles
            for (let i = 0; i < 2; i++) {
                await page.click('[data-testid="tool-rectangle"]');
                await page.mouse.move(100 + i * 150, 100);
                await page.mouse.down();
                await page.mouse.move(200 + i * 150, 200);
                await page.mouse.up();
            }

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Select both rectangles
            await page.click('[data-testid="element-el1"]');
            await page.keyboard.press('Shift');
            await page.click('[data-testid="element-el2"]');

            // Get initial position
            const initialElement = await page.locator('[data-testid="element-el1"]');
            const initialBox = await initialElement.boundingBox();

            // Drag both elements
            await page.mouse.move(initialBox!.x + 50, initialBox!.y + 50);
            await page.mouse.down();
            await page.mouse.move(initialBox!.x + 55, initialBox!.y + 55);
            await page.mouse.up();

            // Check that both elements snapped to grid
            const finalElement1 = await page.locator('[data-testid="element-el1"]');
            const finalBox1 = await finalElement1.boundingBox();

            const finalElement2 = await page.locator('[data-testid="element-el2"]');
            const finalBox2 = await finalElement2.boundingBox();

            // Both should be snapped to grid
            expect(finalBox1!.x % 20).toBeLessThan(2);
            expect(finalBox2!.x % 20).toBeLessThan(2);
        });
    });

    // =========================================================================
    // Transform Tests
    // =========================================================================

    test.describe('Transform Handling', () => {
        test('should work with canvas zoom', async ({ page }) => {
            // Create rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Zoom in
            await page.keyboard.press('Control+Plus');

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on rectangle
            await page.click('[data-testid="element-el1"]');

            // Start dragging
            await page.mouse.move(150, 150);
            await page.mouse.down();
            await page.mouse.move(100, 150);

            // Check if guides are visible
            const guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBeGreaterThan(0);

            await page.mouse.up();
        });

        test('should work with canvas pan', async ({ page }) => {
            // Create rectangle
            await page.click('[data-testid="tool-rectangle"]');
            await page.mouse.move(100, 100);
            await page.mouse.down();
            await page.mouse.move(200, 200);
            await page.mouse.up();

            // Pan canvas
            await page.keyboard.press('Space');
            await page.mouse.move(400, 400);
            await page.mouse.down();
            await page.mouse.move(300, 300);
            await page.mouse.up();
            await page.keyboard.press('Space');

            // Switch to select tool
            await page.click('[data-testid="tool-select"]');

            // Click on rectangle
            await page.click('[data-testid="element-el1"]');

            // Start dragging
            await page.mouse.move(150, 150);
            await page.mouse.down();
            await page.mouse.move(100, 150);

            // Check if guides are visible
            const guides = await page.locator('line[stroke="#3b82f6"]');
            expect(await guides.count()).toBeGreaterThan(0);

            await page.mouse.up();
        });
    });
});
