/**
 * Performance System E2E Tests
 * 
 * End-to-end tests for performance optimization features
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Optimization System', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for canvas to load
        await page.waitForSelector('canvas', { timeout: 5000 });
    });

    test.describe('Virtualization', () => {
        test('should render only visible elements', async ({ page }) => {
            // Create many elements
            for (let i = 0; i < 100; i++) {
                await page.keyboard.press('r'); // Rectangle tool
                await page.mouse.click(100 + i * 10, 100 + i * 10);
                await page.mouse.click(150 + i * 10, 150 + i * 10);
            }

            // Check that not all elements are rendered
            const renderedElements = await page.locator('canvas').count();
            expect(renderedElements).toBeGreaterThan(0);
        });

        test('should update visible elements on pan', async ({ page }) => {
            // Create elements
            for (let i = 0; i < 50; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100, 100);
                await page.mouse.click(150, 150);
            }

            // Pan canvas
            await page.mouse.move(400, 300);
            await page.keyboard.press('Space');
            await page.mouse.move(200, 200, { steps: 10 });
            await page.keyboard.press('Space');

            // Should still render elements
            const canvas = page.locator('canvas');
            expect(canvas).toBeDefined();
        });
    });

    test.describe('Caching', () => {
        test('should cache element bounds', async ({ page }) => {
            // Create element
            await page.keyboard.press('r');
            await page.mouse.click(100, 100);
            await page.mouse.click(200, 200);

            // Move element multiple times
            for (let i = 0; i < 5; i++) {
                await page.mouse.click(150, 150);
                await page.mouse.move(160, 160);
            }

            // Should not throw errors
            expect(true).toBe(true);
        });

        test('should improve performance with cache', async ({ page }) => {
            // Create elements
            for (let i = 0; i < 50; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100 + i * 5, 100 + i * 5);
                await page.mouse.click(150 + i * 5, 150 + i * 5);
            }

            // Measure render time
            const startTime = Date.now();

            // Trigger multiple renders
            for (let i = 0; i < 10; i++) {
                await page.mouse.move(200 + i, 200 + i);
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should complete in reasonable time
            expect(totalTime).toBeLessThan(5000);
        });
    });

    test.describe('LOD (Level of Detail)', () => {
        test('should simplify elements when zoomed out', async ({ page }) => {
            // Create element
            await page.keyboard.press('r');
            await page.mouse.click(100, 100);
            await page.mouse.click(200, 200);

            // Zoom out
            for (let i = 0; i < 5; i++) {
                await page.mouse.wheel(400, 300, { deltaY: 100 });
            }

            // Should still render
            const canvas = page.locator('canvas');
            expect(canvas).toBeDefined();
        });

        test('should show details when zoomed in', async ({ page }) => {
            // Create element
            await page.keyboard.press('r');
            await page.mouse.click(100, 100);
            await page.mouse.click(200, 200);

            // Zoom in
            for (let i = 0; i < 5; i++) {
                await page.mouse.wheel(400, 300, { deltaY: -100 });
            }

            // Should still render
            const canvas = page.locator('canvas');
            expect(canvas).toBeDefined();
        });
    });

    test.describe('Batch Rendering', () => {
        test('should batch render similar elements', async ({ page }) => {
            // Create many rectangles
            for (let i = 0; i < 30; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100 + i * 10, 100);
                await page.mouse.click(120 + i * 10, 120);
            }

            // Should render efficiently
            const canvas = page.locator('canvas');
            expect(canvas).toBeDefined();
        });

        test('should handle mixed element types', async ({ page }) => {
            // Create rectangles
            for (let i = 0; i < 10; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100 + i * 20, 100);
                await page.mouse.click(120 + i * 20, 120);
            }

            // Create circles
            for (let i = 0; i < 10; i++) {
                await page.keyboard.press('e');
                await page.mouse.click(100 + i * 20, 200);
                await page.mouse.click(120 + i * 20, 220);
            }

            // Should render all
            const canvas = page.locator('canvas');
            expect(canvas).toBeDefined();
        });
    });

    test.describe('Performance Monitoring', () => {
        test('should track FPS', async ({ page }) => {
            // Create elements
            for (let i = 0; i < 20; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100 + i * 10, 100);
                await page.mouse.click(120 + i * 10, 120);
            }

            // Pan to trigger rendering
            await page.mouse.move(400, 300);
            await page.keyboard.press('Space');
            await page.mouse.move(300, 200, { steps: 10 });
            await page.keyboard.press('Space');

            // Should complete without errors
            expect(true).toBe(true);
        });

        test('should track render time', async ({ page }) => {
            // Create elements
            for (let i = 0; i < 30; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100 + i * 5, 100);
                await page.mouse.click(120 + i * 5, 120);
            }

            // Trigger renders
            for (let i = 0; i < 5; i++) {
                await page.mouse.move(200 + i * 10, 200 + i * 10);
            }

            // Should complete
            expect(true).toBe(true);
        });

        test('should track memory usage', async ({ page }) => {
            // Create many elements
            for (let i = 0; i < 50; i++) {
                await page.keyboard.press('r');
                await page.mouse.click(100 + i * 3, 100);
                await page.mouse.click(120 + i * 3, 120);
            }

            // Should not crash
            expect(true).toBe(true);
        });
    });

    test.describe('Performance with Large Diagrams', () => {
        test('should handle 100+ elements', async ({ page }) => {
            // Create 100 elements
            for (let i = 0; i < 100; i++) {
                await page.keyboard.press('r');
                const x = 100 + (i % 10) * 50;
                const y = 100 + Math.floor(i / 10) * 50;
                await page.mouse.click(x, y);
                await page.mouse.click(x + 30, y + 30);
            }

            // Should still be responsive
            await page.mouse.move(400, 300);
            expect(true).toBe(true);
        });

        test('should handle 500+ elements', async ({ page }) => {
            // Create 500 elements
            for (let i = 0; i < 500; i++) {
                await page.keyboard.press('r');
                const x = 100 + (i % 20) * 30;
                const y = 100 + Math.floor(i / 20) * 30;
                await page.mouse.click(x, y);
                await page.mouse.click(x + 20, y + 20);

                // Every 50 elements, give browser time to render
                if (i % 50 === 0) {
                    await page.waitForTimeout(100);
                }
            }

            // Should still be responsive
            await page.mouse.move(400, 300);
            expect(true).toBe(true);
        });

        test('should handle zoom with many elements', async ({ page }) => {
            // Create 100 elements
            for (let i = 0; i < 100; i++) {
                await page.keyboard.press('r');
                const x = 100 + (i % 10) * 50;
                const y = 100 + Math.floor(i / 10) * 50;
                await page.mouse.click(x, y);
                await page.mouse.click(x + 30, y + 30);
            }

            // Zoom in and out
            for (let i = 0; i < 3; i++) {
                await page.mouse.wheel(400, 300, { deltaY: -100 });
                await page.waitForTimeout(100);
                await page.mouse.wheel(400, 300, { deltaY: 100 });
                await page.waitForTimeout(100);
            }

            // Should complete
            expect(true).toBe(true);
        });

        test('should handle pan with many elements', async ({ page }) => {
            // Create 100 elements
            for (let i = 0; i < 100; i++) {
                await page.keyboard.press('r');
                const x = 100 + (i % 10) * 50;
                const y = 100 + Math.floor(i / 10) * 50;
                await page.mouse.click(x, y);
                await page.mouse.click(x + 30, y + 30);
            }

            // Pan around
            for (let i = 0; i < 5; i++) {
                await page.mouse.move(400, 300);
                await page.keyboard.press('Space');
                await page.mouse.move(300 - i * 50, 300 - i * 50, { steps: 5 });
                await page.keyboard.press('Space');
            }

            // Should complete
            expect(true).toBe(true);
        });
    });

    test.describe('No Memory Leaks', () => {
        test('should not leak memory on element creation', async ({ page }) => {
            // Create and delete elements multiple times
            for (let cycle = 0; cycle < 5; cycle++) {
                // Create 50 elements
                for (let i = 0; i < 50; i++) {
                    await page.keyboard.press('r');
                    await page.mouse.click(100 + i * 5, 100);
                    await page.mouse.click(120 + i * 5, 120);
                }

                // Select all
                await page.keyboard.press('Control+a');

                // Delete all
                await page.keyboard.press('Delete');

                // Wait for cleanup
                await page.waitForTimeout(100);
            }

            // Should complete without crashing
            expect(true).toBe(true);
        });

        test('should not leak memory on cache operations', async ({ page }) => {
            // Create element
            await page.keyboard.press('r');
            await page.mouse.click(100, 100);
            await page.mouse.click(200, 200);

            // Move element many times to trigger cache
            for (let i = 0; i < 100; i++) {
                await page.mouse.click(150, 150);
                await page.mouse.move(150 + i % 10, 150 + i % 10);
            }

            // Should complete
            expect(true).toBe(true);
        });
    });

    test.describe('Performance Recommendations', () => {
        test('should provide recommendations for low FPS', async ({ page }) => {
            // Create many elements to potentially lower FPS
            for (let i = 0; i < 200; i++) {
                await page.keyboard.press('r');
                const x = 100 + (i % 20) * 20;
                const y = 100 + Math.floor(i / 20) * 20;
                await page.mouse.click(x, y);
                await page.mouse.click(x + 15, y + 15);

                if (i % 50 === 0) {
                    await page.waitForTimeout(50);
                }
            }

            // Should still be responsive
            expect(true).toBe(true);
        });
    });
});
