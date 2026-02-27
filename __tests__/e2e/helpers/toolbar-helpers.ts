import { Page } from '@playwright/test';
import { ToolbarTestHelper, Tool } from '../core/types';

// Tool name aliases for backward compatibility
const TOOL_ALIASES: Record<string, string> = {
    'pen': 'freedraw', // 'pen' is an alias for 'freedraw'
};

export function createToolbarHelper(page: Page): ToolbarTestHelper {
    return {
        async selectTool(tool: Tool): Promise<void> {
            // Map alias to actual tool name
            const actualTool = TOOL_ALIASES[tool] || tool;
            const toolButton = page.locator(`[data-tool="${actualTool}"]`);
            await toolButton.click();
            await page.waitForTimeout(50);
        },

        async getActiveTool(): Promise<Tool> {
            const actualTool = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return store?.getState().activeTool || 'select';
            });

            // Map actual tool back to alias if needed (for tests expecting 'pen')
            if (actualTool === 'freedraw') {
                return 'pen' as Tool;
            }
            return actualTool;
        },

        async isToolActive(tool: Tool): Promise<boolean> {
            const activeTool = await this.getActiveTool();
            return activeTool === tool;
        },

        async undo(): Promise<void> {
            const undoButton = page.locator('[data-action="undo"]');
            await undoButton.click();
            await page.waitForTimeout(50);
        },

        async redo(): Promise<void> {
            const redoButton = page.locator('[data-action="redo"]');
            await redoButton.click();
            await page.waitForTimeout(50);
        },

        async canUndo(): Promise<boolean> {
            return page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const state = store?.getState();
                return state?.historyIndex > 0;
            });
        },

        async canRedo(): Promise<boolean> {
            return page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                const state = store?.getState();
                return state?.historyIndex < state?.history.length - 1;
            });
        },
    };
}
