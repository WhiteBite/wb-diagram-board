/**
 * Persistence & Storage E2E Tests
 * 
 * End-to-end tests for document persistence and storage functionality
 */

import { test, expect, setupTest } from '../core/base-test';

test.describe('Persistence & Storage', () => {
    test.beforeEach(async ({ page, canvas }) => {
        await setupTest(page, canvas);
    });

    // =========================================================================
    // Document Creation
    // =========================================================================

    test.describe('Document Creation', () => {
        test('should create a new document', async ({ page }) => {
            // Create a new document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('My First Document');
            });

            // Wait for document to be created
            await page.waitForTimeout(500);

            // Verify document was created
            const currentDoc = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument;
            });

            expect(currentDoc).toBeTruthy();
            expect(currentDoc?.name).toBe('My First Document');
        });

        test('should set document metadata correctly', async ({ page }) => {
            const now = Date.now();

            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Test Document');
            });

            await page.waitForTimeout(500);

            const currentDoc = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument;
            });

            expect(currentDoc?.id).toBeTruthy();
            expect(currentDoc?.version).toBe(1);
            expect(currentDoc?.createdAt).toBeGreaterThanOrEqual(now);
            expect(currentDoc?.updatedAt).toBeGreaterThanOrEqual(now);
        });
    });

    // =========================================================================
    // Document Saving
    // =========================================================================

    test.describe('Document Saving', () => {
        test('should save a document', async ({ page, canvas, toolbar }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Save Test');
            });

            await page.waitForTimeout(500);

            // Draw a rectangle
            await toolbar.selectTool('rectangle');
            await canvas.draw.from(100, 100).to(300, 200).execute();

            // Save document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(500);

            // Verify document was saved
            const currentDoc = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument;
            });

            expect(currentDoc?.version).toBe(2);
        });

        test('should mark document as clean after save', async ({ page }) => {
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Clean Test');
            });

            await page.waitForTimeout(500);

            const isDirty = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().isDirty;
            });

            expect(isDirty).toBe(false);
        });

        test('should mark document as dirty after changes', async ({ page, canvas, toolbar }) => {
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Dirty Test');
            });

            await page.waitForTimeout(500);

            // Draw a rectangle to mark as dirty
            await toolbar.selectTool('rectangle');
            await canvas.draw.from(100, 100).to(300, 200).execute();

            // Mark as dirty
            await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                store?.getState().markDirty();
            });

            const isDirty = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().isDirty;
            });

            expect(isDirty).toBe(true);
        });
    });

    // =========================================================================
    // Document Loading
    // =========================================================================

    test.describe('Document Loading', () => {
        test('should load a document', async ({ page, canvas, toolbar }) => {
            // Create and save a document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Load Test');
            });

            await page.waitForTimeout(500);

            // Draw a rectangle
            await toolbar.selectTool('rectangle');
            const elementId = await canvas.draw.from(100, 100).to(300, 200).execute();

            // Save
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(500);

            // Get document ID
            const docId = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument?.id;
            });

            // Clear canvas
            await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                store?.getState().clear();
            });

            // Load document
            await page.evaluate((id: string) => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().loadDocument(id);
            }, docId);

            await page.waitForTimeout(500);

            // Verify element was restored
            const element = await canvas.getElement(elementId);
            expect(element).toBeTruthy();
            expect(element?.type).toBe('rectangle');
        });

        test('should restore canvas state on load', async ({ page, canvas, toolbar }) => {
            // Create document with specific settings
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('State Test');
            });

            await page.waitForTimeout(500);

            // Change settings
            await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                store?.getState().setDarkMode(true);
                store?.getState().toggleGrid();
            });

            // Save
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(500);

            // Get document ID
            const docId = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument?.id;
            });

            // Reset settings
            await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                store?.getState().setDarkMode(false);
                store?.getState().toggleGrid();
            });

            // Load document
            await page.evaluate((id: string) => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().loadDocument(id);
            }, docId);

            await page.waitForTimeout(500);

            // Verify settings were restored
            const state = await page.evaluate(() => {
                const store = (window as any).__CANVAS_STORE__;
                return {
                    darkMode: store?.getState().darkMode,
                    gridEnabled: store?.getState().gridEnabled,
                };
            });

            expect(state.darkMode).toBe(true);
            expect(state.gridEnabled).toBe(false);
        });
    });

    // =========================================================================
    // Document Listing
    // =========================================================================

    test.describe('Document Listing', () => {
        test('should list all documents', async ({ page }) => {
            // Create multiple documents
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                store?.getState().createDocument('Doc 1');
            });

            await page.waitForTimeout(300);

            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                store?.getState().createDocument('Doc 2');
            });

            await page.waitForTimeout(300);

            // List documents
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().listDocuments();
            });

            await page.waitForTimeout(300);

            const documents = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().documents;
            });

            expect(documents.length).toBeGreaterThanOrEqual(2);
        });

        test('should sort documents by updatedAt descending', async ({ page }) => {
            // Create documents
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                store?.getState().createDocument('Old Doc');
            });

            await page.waitForTimeout(300);

            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                store?.getState().createDocument('New Doc');
            });

            await page.waitForTimeout(300);

            // List documents
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().listDocuments();
            });

            await page.waitForTimeout(300);

            const documents = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().documents;
            });

            // Most recent should be first
            expect(documents[0].name).toBe('New Doc');
        });
    });

    // =========================================================================
    // Document Deletion
    // =========================================================================

    test.describe('Document Deletion', () => {
        test('should delete a document', async ({ page }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Delete Test');
            });

            await page.waitForTimeout(500);

            // Get document ID
            const docId = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument?.id;
            });

            // Delete document
            await page.evaluate((id: string) => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().deleteDocument(id);
            }, docId);

            await page.waitForTimeout(500);

            // Verify document was deleted
            const currentDoc = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument;
            });

            expect(currentDoc).toBeNull();
        });
    });

    // =========================================================================
    // Export/Import
    // =========================================================================

    test.describe('Export/Import', () => {
        test('should export document to JSON', async ({ page, canvas, toolbar }) => {
            // Create and save document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Export Test');
            });

            await page.waitForTimeout(500);

            // Draw a rectangle
            await toolbar.selectTool('rectangle');
            await canvas.draw.from(100, 100).to(300, 200).execute();

            // Save
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(500);

            // Export to JSON
            const json = await page.evaluate(async () => {
                const store = (window as any).__STORAGE_STORE__;
                const blob = await store?.getState().exportDocument('json');
                return await blob?.text();
            });

            expect(json).toBeTruthy();
            const parsed = JSON.parse(json);
            expect(parsed.id).toBeTruthy();
            expect(parsed.name).toBe('Export Test');
            expect(parsed.data).toBeTruthy();
        });

        test('should import document from JSON', async ({ page, canvas }) => {
            // Create and export a document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Import Test');
            });

            await page.waitForTimeout(500);

            const json = await page.evaluate(async () => {
                const store = (window as any).__STORAGE_STORE__;
                const blob = await store?.getState().exportDocument('json');
                return await blob?.text();
            });

            // Clear current document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                const state = store?.getState();
                if (state) {
                    state.currentDocument = null;
                }
            });

            // Import from JSON
            await page.evaluate((jsonStr: string) => {
                const store = (window as any).__STORAGE_STORE__;
                const file = new File([jsonStr], 'test.json', { type: 'application/json' });
                return store?.getState().importDocument(file);
            }, json);

            await page.waitForTimeout(500);

            // Verify document was imported
            const currentDoc = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument;
            });

            expect(currentDoc?.name).toBe('Import Test');
        });

        test('should export document to SVG', async ({ page, canvas, toolbar }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('SVG Export Test');
            });

            await page.waitForTimeout(500);

            // Draw a rectangle
            await toolbar.selectTool('rectangle');
            await canvas.draw.from(100, 100).to(300, 200).execute();

            // Save
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(500);

            // Export to SVG
            const svg = await page.evaluate(async () => {
                const store = (window as any).__STORAGE_STORE__;
                const blob = await store?.getState().exportDocument('svg');
                return await blob?.text();
            });

            expect(svg).toBeTruthy();
            expect(svg).toContain('<svg');
            expect(svg).toContain('</svg>');
        });
    });

    // =========================================================================
    // Versioning
    // =========================================================================

    test.describe('Versioning', () => {
        test('should create versions on save', async ({ page, canvas, toolbar }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Version Test');
            });

            await page.waitForTimeout(500);

            // Save multiple times
            for (let i = 0; i < 3; i++) {
                await toolbar.selectTool('rectangle');
                const x1 = 100 + i * 50;
                const y1 = 100;
                const x2 = 300 + i * 50;
                const y2 = 200;
                await canvas.draw.from(x1, y1).to(x2, y2).execute();

                await page.evaluate(() => {
                    const store = (window as any).__STORAGE_STORE__;
                    return store?.getState().saveDocument();
                });

                await page.waitForTimeout(300);
            }

            // Get versions
            const versions = await page.evaluate(async () => {
                const store = (window as any).__STORAGE_STORE__;
                return await store?.getState().getVersions();
            });

            expect(versions.length).toBeGreaterThanOrEqual(3);
        });

        test('should restore a specific version', async ({ page, canvas, toolbar }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Restore Test');
            });

            await page.waitForTimeout(500);

            // Save version 1
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(300);

            // Add element and save version 2
            await toolbar.selectTool('rectangle');
            await canvas.draw.from(100, 100).to(300, 200).execute();

            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().saveDocument();
            });

            await page.waitForTimeout(300);

            // Restore version 1
            await page.evaluate(async () => {
                const store = (window as any).__STORAGE_STORE__;
                return await store?.getState().restoreVersion(1);
            });

            await page.waitForTimeout(300);

            // Verify we're back to version 1
            const currentDoc = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().currentDocument;
            });

            expect(currentDoc?.version).toBe(1);
        });
    });

    // =========================================================================
    // Auto-Save
    // =========================================================================

    test.describe('Auto-Save', () => {
        test('should enable auto-save', async ({ page }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Auto-Save Test');
            });

            await page.waitForTimeout(500);

            // Enable auto-save
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                store?.getState().enableAutoSave();
            });

            const isAutoSaving = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().isAutoSaving;
            });

            expect(isAutoSaving).toBe(true);
        });

        test('should disable auto-save', async ({ page }) => {
            // Create document
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().createDocument('Disable Auto-Save Test');
            });

            await page.waitForTimeout(500);

            // Enable then disable auto-save
            await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                store?.getState().enableAutoSave();
                store?.getState().disableAutoSave();
            });

            const isAutoSaving = await page.evaluate(() => {
                const store = (window as any).__STORAGE_STORE__;
                return store?.getState().isAutoSaving;
            });

            expect(isAutoSaving).toBe(false);
        });
    });
});
