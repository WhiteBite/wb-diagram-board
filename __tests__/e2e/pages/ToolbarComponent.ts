/**
 * ToolbarComponent - Page Object for toolbar interactions
 * 
 * Provides API for tool selection and toolbar actions
 */

import { Page, Locator } from '@playwright/test';

export type ToolType =
    | 'select'
    | 'rectangle'
    | 'ellipse'
    | 'diamond'
    | 'triangle'
    | 'line'
    | 'arrow'
    | 'connector'
    | 'text'
    | 'sticky'
    | 'frame'
    | 'pen'
    | 'freedraw'
    | 'eraser'
    | 'hand';

// Tool name aliases for compatibility
const TOOL_ALIASES: Record<string, string> = {
    'pen': 'freedraw',
};

export class ToolbarComponent {
    readonly page: Page;
    readonly container: Locator;
    readonly undoButton: Locator;
    readonly redoButton: Locator;
    readonly deleteButton: Locator;
    readonly zoomInButton: Locator;
    readonly zoomOutButton: Locator;
    readonly fitButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.container = page.locator('[data-testid="toolbar"]').or(page.locator('[role="toolbar"]'));
        this.undoButton = page.locator('[data-action="undo"]').or(page.locator('[data-testid="undo"]'));
        this.redoButton = page.locator('[data-action="redo"]').or(page.locator('[data-testid="redo"]'));
        this.deleteButton = page.locator('[data-action="delete"]').or(page.locator('[data-testid="delete"]'));
        this.zoomInButton = page.locator('[data-action="zoom-in"]').or(page.locator('[data-testid="zoom-in"]'));
        this.zoomOutButton = page.locator('[data-action="zoom-out"]').or(page.locator('[data-testid="zoom-out"]'));
        this.fitButton = page.locator('[data-action="fit"]').or(page.locator('[data-testid="fit"]'));
    }

    /**
     * Get tool button locator
     */
    private getToolButton(tool: ToolType): Locator {
        const actualTool = TOOL_ALIASES[tool] || tool;
        return this.page.locator(`[data-tool="${actualTool}"]`)
            .or(this.page.locator(`[data-testid="tool-${actualTool}"]`))
            .or(this.page.locator(`button[title*="${actualTool}" i]`));
    }

    /**
     * Select a tool
     */
    async selectTool(tool: ToolType): Promise<void> {
        const button = this.getToolButton(tool);
        await button.click();
        await this.page.waitForTimeout(50);
    }

    /**
     * Get currently active tool
     */
    async getActiveTool(): Promise<ToolType> {
        const tool = await this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return 'select';
            const state = store.getState ? store.getState() : store;
            return state.activeTool || state.currentTool || 'select';
        });

        // Map back to alias if needed
        if (tool === 'freedraw') return 'pen';
        return tool as ToolType;
    }

    /**
     * Check if a tool is active
     */
    async isToolActive(tool: ToolType): Promise<boolean> {
        const activeTool = await this.getActiveTool();
        const actualTool = TOOL_ALIASES[tool] || tool;
        const activeActual = TOOL_ALIASES[activeTool] || activeTool;
        return activeActual === actualTool;
    }

    /**
     * Perform undo action
     */
    async undo(): Promise<void> {
        try {
            await this.undoButton.click({ timeout: 2000 });
        } catch {
            // Fallback to keyboard shortcut
            await this.page.keyboard.press('Control+z');
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Perform redo action
     */
    async redo(): Promise<void> {
        try {
            await this.redoButton.click({ timeout: 2000 });
        } catch {
            // Fallback to keyboard shortcut
            await this.page.keyboard.press('Control+y');
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Check if undo is available
     */
    async canUndo(): Promise<boolean> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return false;
            const state = store.getState ? store.getState() : store;
            return state.historyIndex > 0 || state.canUndo?.() || false;
        });
    }

    /**
     * Check if redo is available
     */
    async canRedo(): Promise<boolean> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return false;
            const state = store.getState ? store.getState() : store;
            return state.historyIndex < (state.history?.length || 0) - 1 || state.canRedo?.() || false;
        });
    }

    /**
     * Delete selected elements
     */
    async deleteSelected(): Promise<void> {
        try {
            await this.deleteButton.click({ timeout: 2000 });
        } catch {
            // Fallback to keyboard
            await this.page.keyboard.press('Delete');
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Zoom in
     */
    async zoomIn(): Promise<void> {
        try {
            await this.zoomInButton.click({ timeout: 2000 });
        } catch {
            // Fallback to keyboard
            await this.page.keyboard.press('Control+=');
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Zoom out
     */
    async zoomOut(): Promise<void> {
        try {
            await this.zoomOutButton.click({ timeout: 2000 });
        } catch {
            // Fallback to keyboard
            await this.page.keyboard.press('Control+-');
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Fit to screen
     */
    async fitToScreen(): Promise<void> {
        try {
            await this.fitButton.click({ timeout: 2000 });
        } catch {
            // Fallback to keyboard
            await this.page.keyboard.press('Control+1');
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Select all elements
     */
    async selectAll(): Promise<void> {
        await this.page.keyboard.press('Control+a');
        await this.page.waitForTimeout(50);
    }

    /**
     * Copy selected elements
     */
    async copy(): Promise<void> {
        await this.page.keyboard.press('Control+c');
        await this.page.waitForTimeout(50);
    }

    /**
     * Paste elements
     */
    async paste(): Promise<void> {
        await this.page.keyboard.press('Control+v');
        await this.page.waitForTimeout(100);
    }

    /**
     * Cut selected elements
     */
    async cut(): Promise<void> {
        await this.page.keyboard.press('Control+x');
        await this.page.waitForTimeout(50);
    }

    /**
     * Duplicate selected elements
     */
    async duplicate(): Promise<void> {
        await this.page.keyboard.press('Control+d');
        await this.page.waitForTimeout(100);
    }

    /**
     * Group selected elements
     */
    async group(): Promise<void> {
        await this.page.keyboard.press('Control+g');
        await this.page.waitForTimeout(50);
    }

    /**
     * Ungroup selected elements
     */
    async ungroup(): Promise<void> {
        await this.page.keyboard.press('Control+Shift+g');
        await this.page.waitForTimeout(50);
    }

    /**
     * Bring to front
     */
    async bringToFront(): Promise<void> {
        await this.page.keyboard.press('Control+]');
        await this.page.waitForTimeout(50);
    }

    /**
     * Send to back
     */
    async sendToBack(): Promise<void> {
        await this.page.keyboard.press('Control+[');
        await this.page.waitForTimeout(50);
    }

    /**
     * Align selected elements
     */
    async align(direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): Promise<void> {
        const alignButton = this.page.locator(`[data-action="align-${direction}"]`);
        try {
            await alignButton.click({ timeout: 2000 });
        } catch {
            // Alignment might not be available via button
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Distribute selected elements
     */
    async distribute(direction: 'horizontal' | 'vertical'): Promise<void> {
        const distributeButton = this.page.locator(`[data-action="distribute-${direction}"]`);
        try {
            await distributeButton.click({ timeout: 2000 });
        } catch {
            // Distribution might not be available via button
        }
        await this.page.waitForTimeout(50);
    }
}
