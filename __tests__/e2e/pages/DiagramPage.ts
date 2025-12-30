/**
 * DiagramPage - Main Page Object for diagram board
 * 
 * Provides high-level API for interacting with the diagram board
 * Production-quality Page Object with comprehensive methods
 */

import { Page, Locator, expect } from '@playwright/test';
import { ToolbarComponent } from './ToolbarComponent';
import { CanvasComponent } from './CanvasComponent';
import { PanelsComponent } from './PanelsComponent';

export interface DiagramElement {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    strokeColor?: string;
    fillColor?: string;
    strokeWidth?: number;
    opacity?: number;
    locked?: boolean;
    visible?: boolean;
    [key: string]: unknown;
}

export interface DiagramState {
    elements: DiagramElement[];
    selectedIds: string[];
    transform: { x: number; y: number; scale: number };
}

export interface DocumentInfo {
    id: string;
    name: string;
    version: number;
    createdAt?: string;
    updatedAt?: string;
}

export class DiagramPage {
    readonly page: Page;
    readonly toolbar: ToolbarComponent;
    readonly canvas: CanvasComponent;
    readonly panels: PanelsComponent;

    // Main locators
    readonly container: Locator;
    readonly loadingIndicator: Locator;
    readonly errorMessage: Locator;
    readonly autosaveIndicator: Locator;

    // Timeouts
    private readonly defaultTimeout = 30000;
    private readonly shortTimeout = 5000;

    constructor(page: Page) {
        this.page = page;
        this.toolbar = new ToolbarComponent(page);
        this.canvas = new CanvasComponent(page);
        this.panels = new PanelsComponent(page);

        this.container = page.locator('[data-testid="diagram-board"]').or(page.locator('.react-flow'));
        this.loadingIndicator = page.locator('[data-testid="loading"]');
        this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error-message'));
        this.autosaveIndicator = page.locator('[data-testid="autosave-indicator"]').or(page.locator('.autosave-indicator'));
    }

    /**
     * Navigate to the diagram board
     */
    async goto(path: string = '/'): Promise<void> {
        await this.page.goto(path);
        await this.waitForReady();
    }

    /**
     * Wait for the diagram board to be ready
     */
    async waitForReady(): Promise<void> {
        // Wait for main container
        await this.container.waitFor({ state: 'visible', timeout: this.defaultTimeout });

        // Wait for loading to complete
        await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
            // Loading indicator might not exist
        });

        // Wait for canvas to be interactive
        await this.canvas.waitForReady();

        // Small delay for stability
        await this.page.waitForTimeout(200);
    }

    /**
     * Wait for autosave to complete
     */
    async waitForAutosave(): Promise<void> {
        try {
            // Wait for autosave indicator to appear and disappear
            await this.autosaveIndicator.waitFor({ state: 'visible', timeout: 2000 });
            await this.autosaveIndicator.waitFor({ state: 'hidden', timeout: 5000 });
        } catch {
            // Autosave indicator might not be visible
        }
    }

    /**
     * Check if page has errors
     */
    async hasErrors(): Promise<boolean> {
        return this.errorMessage.isVisible().catch(() => false);
    }

    /**
     * Get error message if present
     */
    async getErrorMessage(): Promise<string | null> {
        try {
            if (await this.errorMessage.isVisible()) {
                return this.errorMessage.textContent();
            }
        } catch {
            // No error message
        }
        return null;
    }

    /**
     * Get current diagram state
     */
    async getState(): Promise<DiagramState> {
        return this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) {
                return { elements: [], selectedIds: [], transform: { x: 0, y: 0, scale: 1 } };
            }
            const state = store.getState ? store.getState() : store;
            return {
                elements: state.elementOrder?.map((id: string) => state.elements[id]) || [],
                selectedIds: state.selectedIds || [],
                transform: state.transform || { x: 0, y: 0, scale: 1 },
            };
        });
    }

    /**
     * Get element by ID
     */
    async getElement(id: string): Promise<DiagramElement | null> {
        return this.page.evaluate((elementId) => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (!store) return null;
            const state = store.getState ? store.getState() : store;
            return state.elements?.[elementId] || null;
        }, id);
    }

    /**
     * Get all elements
     */
    async getAllElements(): Promise<DiagramElement[]> {
        const state = await this.getState();
        return state.elements;
    }

    /**
     * Get selected element IDs
     */
    async getSelectedIds(): Promise<string[]> {
        const state = await this.getState();
        return state.selectedIds;
    }

    /**
     * Get element count
     */
    async getElementCount(): Promise<number> {
        const elements = await this.getAllElements();
        return elements.length;
    }

    /**
     * Clear the canvas
     */
    async clearCanvas(): Promise<void> {
        await this.page.evaluate(() => {
            const store = (window as any).__CANVAS_STORE__ || (window as any).useCanvasStore;
            if (store) {
                const state = store.getState ? store.getState() : store;
                if (state.clear) state.clear();
            }
        });
        await this.page.waitForTimeout(100);
    }

    /**
     * Create a new diagram
     */
    async createNewDiagram(name?: string): Promise<void> {
        await this.page.evaluate((docName) => {
            const store = (window as any).__STORAGE_STORE__;
            if (store) {
                store.getState().createDocument(docName || 'Untitled');
            }
        }, name);
        await this.page.waitForTimeout(300);
    }

    /**
     * Save current diagram
     */
    async saveDiagram(): Promise<void> {
        await this.page.evaluate(() => {
            const store = (window as any).__STORAGE_STORE__;
            if (store) {
                store.getState().saveDocument();
            }
        });
        await this.page.waitForTimeout(300);
    }

    /**
     * Load diagram by ID
     */
    async loadDiagram(id: string): Promise<void> {
        await this.page.evaluate((docId) => {
            const store = (window as any).__STORAGE_STORE__;
            if (store) {
                store.getState().loadDocument(docId);
            }
        }, id);
        await this.page.waitForTimeout(500);
    }

    /**
     * Get current document info
     */
    async getCurrentDocument(): Promise<DocumentInfo | null> {
        return this.page.evaluate(() => {
            const store = (window as any).__STORAGE_STORE__;
            if (!store) return null;
            const doc = store.getState().currentDocument;
            if (!doc) return null;
            return {
                id: doc.id,
                name: doc.name,
                version: doc.version,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            };
        });
    }

    /**
     * Get all saved documents
     */
    async getSavedDocuments(): Promise<DocumentInfo[]> {
        return this.page.evaluate(() => {
            const store = (window as any).__STORAGE_STORE__;
            if (!store) return [];
            return store.getState().documents || [];
        });
    }

    /**
     * Delete a document by ID
     */
    async deleteDocument(id: string): Promise<void> {
        await this.page.evaluate((docId) => {
            const store = (window as any).__STORAGE_STORE__;
            if (store) {
                store.getState().deleteDocument(docId);
            }
        }, id);
        await this.page.waitForTimeout(300);
    }

    /**
     * Reload the page and wait for ready
     */
    async reload(): Promise<void> {
        await this.page.reload();
        await this.waitForReady();
    }

    /**
     * Take a screenshot of the diagram
     */
    async takeScreenshot(name: string): Promise<Buffer> {
        return this.page.screenshot({ path: `screenshots/${name}.png` });
    }

    /**
     * Take a screenshot of the canvas only
     */
    async takeCanvasScreenshot(name: string): Promise<Buffer> {
        return this.canvas.container.screenshot({ path: `screenshots/${name}.png` });
    }

    /**
     * Check if diagram has unsaved changes
     */
    async hasUnsavedChanges(): Promise<boolean> {
        return this.page.evaluate(() => {
            const store = (window as any).__STORAGE_STORE__;
            return store?.getState().isDirty || false;
        });
    }

    // =========================================================================
    // Element Verification Methods
    // =========================================================================

    /**
     * Verify element exists
     */
    async expectElementExists(id: string): Promise<void> {
        const element = await this.getElement(id);
        expect(element, `Element ${id} should exist`).not.toBeNull();
    }

    /**
     * Verify element does not exist
     */
    async expectElementNotExists(id: string): Promise<void> {
        const element = await this.getElement(id);
        expect(element, `Element ${id} should not exist`).toBeNull();
    }

    /**
     * Verify element count
     */
    async expectElementCount(count: number): Promise<void> {
        const actualCount = await this.getElementCount();
        expect(actualCount, `Expected ${count} elements, got ${actualCount}`).toBe(count);
    }

    /**
     * Verify selected count
     */
    async expectSelectedCount(count: number): Promise<void> {
        const selectedIds = await this.getSelectedIds();
        expect(selectedIds.length, `Expected ${count} selected, got ${selectedIds.length}`).toBe(count);
    }

    /**
     * Verify element is selected
     */
    async expectElementSelected(id: string): Promise<void> {
        const selectedIds = await this.getSelectedIds();
        expect(selectedIds, `Element ${id} should be selected`).toContain(id);
    }

    /**
     * Verify element is not selected
     */
    async expectElementNotSelected(id: string): Promise<void> {
        const selectedIds = await this.getSelectedIds();
        expect(selectedIds, `Element ${id} should not be selected`).not.toContain(id);
    }

    // =========================================================================
    // Keyboard Shortcuts
    // =========================================================================

    /**
     * Execute keyboard shortcut
     */
    async pressShortcut(shortcut: string): Promise<void> {
        await this.page.keyboard.press(shortcut);
        await this.page.waitForTimeout(50);
    }

    /**
     * Undo via keyboard
     */
    async undo(): Promise<void> {
        await this.pressShortcut('Control+z');
    }

    /**
     * Redo via keyboard
     */
    async redo(): Promise<void> {
        await this.pressShortcut('Control+y');
    }

    /**
     * Select all via keyboard
     */
    async selectAll(): Promise<void> {
        await this.pressShortcut('Control+a');
    }

    /**
     * Delete selected via keyboard
     */
    async deleteSelected(): Promise<void> {
        await this.pressShortcut('Delete');
    }

    /**
     * Copy selected via keyboard
     */
    async copy(): Promise<void> {
        await this.pressShortcut('Control+c');
    }

    /**
     * Paste via keyboard
     */
    async paste(): Promise<void> {
        await this.pressShortcut('Control+v');
        await this.page.waitForTimeout(100);
    }

    /**
     * Cut selected via keyboard
     */
    async cut(): Promise<void> {
        await this.pressShortcut('Control+x');
    }

    /**
     * Duplicate selected via keyboard
     */
    async duplicate(): Promise<void> {
        await this.pressShortcut('Control+d');
        await this.page.waitForTimeout(100);
    }

    // =========================================================================
    // Import/Export
    // =========================================================================

    /**
     * Import diagram from JSON string
     */
    async importFromJson(jsonContent: string): Promise<void> {
        await this.page.evaluate((json: string) => {
            const store = (window as any).__STORAGE_STORE__;
            if (store) {
                const file = new File([json], 'import.json', { type: 'application/json' });
                store.getState().importDocument(file);
            }
        }, jsonContent);
        await this.page.waitForTimeout(500);
    }

    /**
     * Export diagram to JSON string
     */
    async exportToJson(): Promise<string | null> {
        return this.page.evaluate(async () => {
            const store = (window as any).__STORAGE_STORE__;
            if (!store) return null;
            const blob = await store.getState().exportDocument('json');
            if (!blob) return null;
            return await blob.text();
        });
    }

    /**
     * Export diagram to SVG string
     */
    async exportToSvg(): Promise<string | null> {
        return this.page.evaluate(async () => {
            const store = (window as any).__STORAGE_STORE__;
            if (!store) return null;
            const blob = await store.getState().exportDocument('svg');
            if (!blob) return null;
            return await blob.text();
        });
    }

    // =========================================================================
    // Performance Helpers
    // =========================================================================

    /**
     * Measure operation duration
     */
    async measureOperation<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
        const startTime = Date.now();
        const result = await operation();
        const duration = Date.now() - startTime;
        return { result, duration };
    }

    /**
     * Wait for idle state (no pending operations)
     */
    async waitForIdle(timeout: number = 5000): Promise<void> {
        await this.page.waitForLoadState('networkidle', { timeout });
        await this.page.waitForTimeout(100);
    }
}
