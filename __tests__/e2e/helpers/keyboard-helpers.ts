import { Page } from '@playwright/test';
import { KeyboardTestHelper } from '../core/types';

export function createKeyboardHelper(page: Page): KeyboardTestHelper {
    return {
        async pressKey(key: string): Promise<void> {
            await page.keyboard.press(key);
            await page.waitForTimeout(50);
        },

        async pressKeys(keys: string[]): Promise<void> {
            for (const key of keys) {
                await page.keyboard.press(key);
            }
            await page.waitForTimeout(50);
        },

        async holdKey(key: string, action: () => Promise<void>): Promise<void> {
            await page.keyboard.down(key);
            try {
                await action();
            } finally {
                await page.keyboard.up(key);
            }
        },

        async delete(): Promise<void> {
            await page.keyboard.press('Delete');
            await page.waitForTimeout(50);
        },

        async selectAll(): Promise<void> {
            await page.keyboard.press('Control+a');
            await page.waitForTimeout(50);
        },

        async copy(): Promise<void> {
            await page.keyboard.press('Control+c');
            await page.waitForTimeout(50);
        },

        async paste(): Promise<void> {
            await page.keyboard.press('Control+v');
            await page.waitForTimeout(50);
        },

        async cut(): Promise<void> {
            await page.keyboard.press('Control+x');
            await page.waitForTimeout(50);
        },

        async undo(): Promise<void> {
            await page.keyboard.press('Control+z');
            await page.waitForTimeout(50);
        },

        async redo(): Promise<void> {
            await page.keyboard.press('Control+y');
            await page.waitForTimeout(50);
        },
    };
}
