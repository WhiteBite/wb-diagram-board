/**
 * PanelsComponent - Page Object for side panels
 * 
 * Provides API for interacting with style panel, layers panel, etc.
 */

import { Page, Locator } from '@playwright/test';

export interface StyleOptions {
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
    fontFamily?: string;
}

export class PanelsComponent {
    readonly page: Page;

    // Style panel
    readonly stylePanel: Locator;
    readonly strokeColorPicker: Locator;
    readonly fillColorPicker: Locator;
    readonly strokeWidthSlider: Locator;
    readonly opacitySlider: Locator;

    // Layers panel
    readonly layersPanel: Locator;
    readonly layersList: Locator;

    // Properties panel
    readonly propertiesPanel: Locator;

    // Export panel
    readonly exportPanel: Locator;
    readonly exportPngButton: Locator;
    readonly exportSvgButton: Locator;
    readonly exportJsonButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Style panel locators
        this.stylePanel = page.locator('[data-testid="style-panel"]')
            .or(page.locator('.style-panel'))
            .or(page.locator('[class*="stylePanel"]'));
        this.strokeColorPicker = page.locator('[data-testid="stroke-color"]')
            .or(page.locator('[data-style="stroke-color"]'));
        this.fillColorPicker = page.locator('[data-testid="fill-color"]')
            .or(page.locator('[data-style="fill-color"]'));
        this.strokeWidthSlider = page.locator('[data-testid="stroke-width"]')
            .or(page.locator('[data-style="stroke-width"]'));
        this.opacitySlider = page.locator('[data-testid="opacity"]')
            .or(page.locator('[data-style="opacity"]'));

        // Layers panel locators
        this.layersPanel = page.locator('[data-testid="layers-panel"]')
            .or(page.locator('.layers-panel'));
        this.layersList = page.locator('[data-testid="layers-list"]')
            .or(page.locator('.layers-list'));

        // Properties panel
        this.propertiesPanel = page.locator('[data-testid="properties-panel"]')
            .or(page.locator('.properties-panel'));

        // Export panel
        this.exportPanel = page.locator('[data-testid="export-panel"]')
            .or(page.locator('.export-panel'));
        this.exportPngButton = page.locator('[data-action="export-png"]')
            .or(page.locator('[data-testid="export-png"]'));
        this.exportSvgButton = page.locator('[data-action="export-svg"]')
            .or(page.locator('[data-testid="export-svg"]'));
        this.exportJsonButton = page.locator('[data-action="export-json"]')
            .or(page.locator('[data-testid="export-json"]'));
    }

    // =========================================================================
    // Style Panel Methods
    // =========================================================================

    /**
     * Open style panel
     */
    async openStylePanel(): Promise<void> {
        const toggleButton = this.page.locator('[data-action="toggle-style-panel"]');
        try {
            await toggleButton.click({ timeout: 2000 });
        } catch {
            // Panel might already be open or not have a toggle
        }
        await this.page.waitForTimeout(100);
    }

    /**
     * Set stroke color
     */
    async setStrokeColor(color: string): Promise<void> {
        try {
            await this.strokeColorPicker.click({ timeout: 2000 });
            const colorInput = this.page.locator('input[type="color"]').or(this.page.locator('[data-testid="color-input"]'));
            await colorInput.fill(color);
            await this.page.keyboard.press('Escape');
        } catch {
            // Color picker might not be available
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Set fill color
     */
    async setFillColor(color: string): Promise<void> {
        try {
            await this.fillColorPicker.click({ timeout: 2000 });
            const colorInput = this.page.locator('input[type="color"]').or(this.page.locator('[data-testid="color-input"]'));
            await colorInput.fill(color);
            await this.page.keyboard.press('Escape');
        } catch {
            // Color picker might not be available
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Set stroke width
     */
    async setStrokeWidth(width: number): Promise<void> {
        try {
            await this.strokeWidthSlider.fill(String(width));
        } catch {
            // Slider might not be available
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Set opacity
     */
    async setOpacity(opacity: number): Promise<void> {
        try {
            await this.opacitySlider.fill(String(opacity));
        } catch {
            // Slider might not be available
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Apply multiple style options
     */
    async applyStyles(options: StyleOptions): Promise<void> {
        if (options.strokeColor) await this.setStrokeColor(options.strokeColor);
        if (options.fillColor) await this.setFillColor(options.fillColor);
        if (options.strokeWidth) await this.setStrokeWidth(options.strokeWidth);
        if (options.opacity) await this.setOpacity(options.opacity);
    }

    /**
     * Get current style values
     */
    async getCurrentStyles(): Promise<StyleOptions> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return {};
            const state = store.getState ? store.getState() : store;
            return {
                strokeColor: state.currentStrokeColor,
                fillColor: state.currentFillColor,
                strokeWidth: state.currentStrokeWidth,
                opacity: state.currentOpacity,
            };
        });
    }

    // =========================================================================
    // Layers Panel Methods
    // =========================================================================

    /**
     * Open layers panel
     */
    async openLayersPanel(): Promise<void> {
        const toggleButton = this.page.locator('[data-action="toggle-layers-panel"]');
        try {
            await toggleButton.click({ timeout: 2000 });
        } catch {
            // Panel might already be open or not have a toggle
        }
        await this.page.waitForTimeout(100);
    }

    /**
     * Get layer count
     */
    async getLayerCount(): Promise<number> {
        return this.page.evaluate(() => {
            const store = (window as any).__LAYERS_STORE__;
            if (!store) return 0;
            return store.getState().layers?.length || 0;
        });
    }

    /**
     * Select layer by index
     */
    async selectLayer(index: number): Promise<void> {
        const layerItem = this.layersList.locator(`[data-layer-index="${index}"]`);
        try {
            await layerItem.click({ timeout: 2000 });
        } catch {
            // Layer might not exist
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Toggle layer visibility
     */
    async toggleLayerVisibility(index: number): Promise<void> {
        const visibilityButton = this.layersList.locator(`[data-layer-index="${index}"] [data-action="toggle-visibility"]`);
        try {
            await visibilityButton.click({ timeout: 2000 });
        } catch {
            // Button might not exist
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Toggle layer lock
     */
    async toggleLayerLock(index: number): Promise<void> {
        const lockButton = this.layersList.locator(`[data-layer-index="${index}"] [data-action="toggle-lock"]`);
        try {
            await lockButton.click({ timeout: 2000 });
        } catch {
            // Button might not exist
        }
        await this.page.waitForTimeout(50);
    }

    /**
     * Create new layer
     */
    async createLayer(name?: string): Promise<void> {
        const createButton = this.page.locator('[data-action="create-layer"]');
        try {
            await createButton.click({ timeout: 2000 });
            if (name) {
                const nameInput = this.page.locator('[data-testid="layer-name-input"]');
                await nameInput.fill(name);
                await this.page.keyboard.press('Enter');
            }
        } catch {
            // Button might not exist
        }
        await this.page.waitForTimeout(100);
    }

    /**
     * Delete layer
     */
    async deleteLayer(index: number): Promise<void> {
        const deleteButton = this.layersList.locator(`[data-layer-index="${index}"] [data-action="delete-layer"]`);
        try {
            await deleteButton.click({ timeout: 2000 });
        } catch {
            // Button might not exist
        }
        await this.page.waitForTimeout(50);
    }

    // =========================================================================
    // Export Panel Methods
    // =========================================================================

    /**
     * Open export panel
     */
    async openExportPanel(): Promise<void> {
        const toggleButton = this.page.locator('[data-action="toggle-export-panel"]')
            .or(this.page.locator('[data-testid="export-button"]'));
        try {
            await toggleButton.click({ timeout: 2000 });
        } catch {
            // Panel might already be open or not have a toggle
        }
        await this.page.waitForTimeout(100);
    }

    /**
     * Export as PNG
     */
    async exportPng(): Promise<void> {
        await this.openExportPanel();

        // Set up download listener
        const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        try {
            await this.exportPngButton.click({ timeout: 2000 });
        } catch {
            // Try keyboard shortcut
            await this.page.keyboard.press('Control+Shift+e');
        }

        await downloadPromise;
        await this.page.waitForTimeout(100);
    }

    /**
     * Export as SVG
     */
    async exportSvg(): Promise<void> {
        await this.openExportPanel();

        const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        try {
            await this.exportSvgButton.click({ timeout: 2000 });
        } catch {
            // Button might not exist
        }

        await downloadPromise;
        await this.page.waitForTimeout(100);
    }

    /**
     * Export as JSON
     */
    async exportJson(): Promise<void> {
        await this.openExportPanel();

        const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 }).catch(() => null);

        try {
            await this.exportJsonButton.click({ timeout: 2000 });
        } catch {
            // Button might not exist
        }

        await downloadPromise;
        await this.page.waitForTimeout(100);
    }

    /**
     * Get export as blob
     */
    async getExportBlob(format: 'png' | 'svg' | 'json'): Promise<Blob | null> {
        return this.page.evaluate(async (fmt) => {
            const store = (window as any).__STORAGE_STORE__;
            if (!store) return null;
            return await store.getState().exportDocument(fmt);
        }, format);
    }

    // =========================================================================
    // Properties Panel Methods
    // =========================================================================

    /**
     * Open properties panel
     */
    async openPropertiesPanel(): Promise<void> {
        const toggleButton = this.page.locator('[data-action="toggle-properties-panel"]');
        try {
            await toggleButton.click({ timeout: 2000 });
        } catch {
            // Panel might already be open or not have a toggle
        }
        await this.page.waitForTimeout(100);
    }

    /**
     * Get element properties
     */
    async getElementProperties(elementId: string): Promise<Record<string, unknown>> {
        return this.page.evaluate((id) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return {};
            const state = store.getState ? store.getState() : store;
            return state.elements?.[id] || {};
        }, elementId);
    }

    /**
     * Set element property
     */
    async setElementProperty(elementId: string, property: string, value: unknown): Promise<void> {
        await this.page.evaluate(({ id, prop, val }) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (store) {
                const state = store.getState ? store.getState() : store;
                if (state.updateElement) {
                    state.updateElement(id, { [prop]: val });
                }
            }
        }, { id: elementId, prop: property, val: value });
        await this.page.waitForTimeout(50);
    }
}
