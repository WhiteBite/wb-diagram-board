// Debug script to test resize interaction
const { chromium } = require('@playwright/test');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const page = await browser.newPage();

    // Listen to console messages
    page.on('console', msg => {
        console.log('BROWSER:', msg.text());
    });

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    // Create a rectangle
    await page.click('[data-testid="tool-rectangle"]');
    await page.mouse.move(200, 200);
    await page.mouse.down();
    await page.mouse.move(400, 300);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Switch to select tool
    await page.click('[data-testid="tool-select"]');
    await page.waitForTimeout(500);

    // Find the resize handle
    const seHandle = page.locator('[data-testid="resize-handle"][data-position="se"]');
    console.log('Handle visible:', await seHandle.isVisible());

    const handleBox = await seHandle.boundingBox();
    console.log('Handle box:', handleBox);

    if (handleBox) {
        console.log('Moving to handle...');
        await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
        await page.waitForTimeout(200);

        console.log('Mouse down...');
        await page.mouse.down();
        await page.waitForTimeout(200);

        console.log('Moving mouse...');
        await page.mouse.move(handleBox.x + 50, handleBox.y + 50, { steps: 10 });
        await page.waitForTimeout(200);

        console.log('Mouse up...');
        await page.mouse.up();
        await page.waitForTimeout(500);
    }

    // Check the element
    const element = await page.evaluate(() => {
        const store = window.__CANVAS_STORE__;
        const state = store.getState();
        const elements = Object.values(state.elements);
        return elements[0];
    });

    console.log('Final element:', element);

    await page.waitForTimeout(3000);
    await browser.close();
})();
