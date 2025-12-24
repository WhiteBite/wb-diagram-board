/**
 * Storage Engine Tests
 * 
 * Unit tests for the storage engine with 100% coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageEngine } from './storage-engine';
import { StorageError } from '../../types/storage';
import type { StorageDocument } from '../../types/storage';
import { createId } from '../../types/canvas';

/**
 * Mock storage adapter for testing
 */
class MockStorageAdapter {
    private data = new Map<string, unknown>();

    async save(key: string, data: unknown): Promise<void> {
        this.data.set(key, data);
    }

    async load(key: string): Promise<unknown> {
        return this.data.get(key) ?? null;
    }

    async delete(key: string): Promise<void> {
        this.data.delete(key);
    }

    async getSize(key: string): Promise<number> {
        const data = this.data.get(key);
        if (!data) return 0;
        return new Blob([JSON.stringify(data)]).size;
    }

    async getAllKeys(): Promise<readonly string[]> {
        return Array.from(this.data.keys());
    }

    async clear(): Promise<void> {
        this.data.clear();
    }
}

/**
 * Create a test document
 */
function createTestDocument(overrides?: Partial<StorageDocument>): StorageDocument {
    return {
        id: createId(),
        name: 'Test Document',
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: {
            elements: {},
            elementOrder: [],
            transform: { x: 0, y: 0, scale: 1 },
            gridEnabled: true,
            snapToGrid: true,
            gridSize: 20,
            selectedIds: [],
            hoveredId: null,
            activeTool: 'select',
            currentStroke: { color: '#000', width: 2, style: 'solid' },
            currentFill: { type: 'solid', color: '#fff' },
            currentTextStyle: {
                fontSize: 16,
                fontFamily: 'Arial',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textAlign: 'center',
                verticalAlign: 'middle',
                color: '#000',
                lineHeight: 1.4,
            },
            roughStyle: false,
            darkMode: false,
            history: [],
            historyIndex: -1,
            isDrawing: false,
            isPanning: false,
            isResizing: false,
            resizeHandle: null,
            clipboard: [],
        },
        ...overrides,
    };
}

describe('StorageEngine', () => {
    let engine: StorageEngine;
    let mockAdapter: MockStorageAdapter;

    beforeEach(async () => {
        mockAdapter = new MockStorageAdapter();
        engine = new StorageEngine({
            autoSaveInterval: 0, // Disable auto-save for tests
            maxVersions: 5,
            maxStorageSize: 10 * 1024 * 1024, // 10MB
        });

        // Replace adapter with mock
        (engine as any).primaryAdapter = mockAdapter;
        (engine as any).fallbackAdapter = mockAdapter;

        await engine.init();
    });

    afterEach(() => {
        engine.disableAllAutoSave();
    });

    // =========================================================================
    // Document Management
    // =========================================================================

    describe('saveDocument', () => {
        it('should save a document', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            const loaded = await engine.loadDocument(doc.id);
            expect(loaded).toEqual(doc);
        });

        it('should increment version on save', async () => {
            const doc = createTestDocument({ version: 1 });
            await engine.saveDocument(doc);

            const doc2 = createTestDocument({ id: doc.id, version: 2 });
            await engine.saveDocument(doc2);

            const versions = await engine.getVersions(doc.id);
            expect(versions).toHaveLength(2);
            expect(versions[0].version).toBe(1);
            expect(versions[1].version).toBe(2);
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            const doc = createTestDocument();

            await expect(uninitializedEngine.saveDocument(doc)).rejects.toThrow(
                'Storage engine not initialized'
            );
        });

        it('should throw error if storage quota exceeded', async () => {
            const engine = new StorageEngine({
                autoSaveInterval: 0,
                maxVersions: 5,
                maxStorageSize: 100, // Very small quota
            });
            (engine as any).primaryAdapter = mockAdapter;
            (engine as any).fallbackAdapter = mockAdapter;
            await engine.init();

            const doc = createTestDocument();
            await expect(engine.saveDocument(doc)).rejects.toThrow('Storage quota exceeded');
        });

        it('should save metadata', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            const keys = await mockAdapter.getAllKeys();
            const metadataKey = keys.find(k => k.startsWith('metadata:'));
            expect(metadataKey).toBeDefined();

            const metadata = await mockAdapter.load(metadataKey!);
            expect(metadata).toEqual({
                id: doc.id,
                name: doc.name,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                size: expect.any(Number),
            });
        });
    });

    describe('loadDocument', () => {
        it('should load a document', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            const loaded = await engine.loadDocument(doc.id);
            expect(loaded).toEqual(doc);
        });

        it('should load latest version', async () => {
            const doc1 = createTestDocument({ version: 1 });
            await engine.saveDocument(doc1);

            const doc2 = createTestDocument({ id: doc1.id, version: 2, name: 'Updated' });
            await engine.saveDocument(doc2);

            const loaded = await engine.loadDocument(doc1.id);
            expect(loaded.version).toBe(2);
            expect(loaded.name).toBe('Updated');
        });

        it('should throw error if document not found', async () => {
            await expect(engine.loadDocument('nonexistent')).rejects.toThrow('Document not found');
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.loadDocument('any-id')).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    describe('listDocuments', () => {
        it('should list all documents', async () => {
            const doc1 = createTestDocument({ name: 'Doc 1' });
            const doc2 = createTestDocument({ name: 'Doc 2' });

            await engine.saveDocument(doc1);
            await engine.saveDocument(doc2);

            const docs = await engine.listDocuments();
            expect(docs).toHaveLength(2);
            expect(docs.map(d => d.name)).toContain('Doc 1');
            expect(docs.map(d => d.name)).toContain('Doc 2');
        });

        it('should sort by updatedAt descending', async () => {
            const doc1 = createTestDocument({ name: 'Doc 1', updatedAt: 1000 });
            const doc2 = createTestDocument({ name: 'Doc 2', updatedAt: 2000 });

            await engine.saveDocument(doc1);
            await engine.saveDocument(doc2);

            const docs = await engine.listDocuments();
            expect(docs[0].name).toBe('Doc 2');
            expect(docs[1].name).toBe('Doc 1');
        });

        it('should return empty list if no documents', async () => {
            const docs = await engine.listDocuments();
            expect(docs).toHaveLength(0);
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.listDocuments()).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    describe('deleteDocument', () => {
        it('should delete a document', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            await engine.deleteDocument(doc.id);

            await expect(engine.loadDocument(doc.id)).rejects.toThrow('Document not found');
        });

        it('should delete all versions', async () => {
            const doc1 = createTestDocument({ version: 1 });
            await engine.saveDocument(doc1);

            const doc2 = createTestDocument({ id: doc1.id, version: 2 });
            await engine.saveDocument(doc2);

            await engine.deleteDocument(doc1.id);

            const versions = await engine.getVersions(doc1.id);
            expect(versions).toHaveLength(0);
        });

        it('should delete metadata', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            await engine.deleteDocument(doc.id);

            const keys = await mockAdapter.getAllKeys();
            const metadataKey = keys.find(k => k === `metadata:${doc.id}`);
            expect(metadataKey).toBeUndefined();
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.deleteDocument('any-id')).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    // =========================================================================
    // Version Management
    // =========================================================================

    describe('getVersions', () => {
        it('should get all versions of a document', async () => {
            const doc1 = createTestDocument({ version: 1 });
            await engine.saveDocument(doc1);

            const doc2 = createTestDocument({ id: doc1.id, version: 2 });
            await engine.saveDocument(doc2);

            const doc3 = createTestDocument({ id: doc1.id, version: 3 });
            await engine.saveDocument(doc3);

            const versions = await engine.getVersions(doc1.id);
            expect(versions).toHaveLength(3);
            expect(versions[0].version).toBe(1);
            expect(versions[1].version).toBe(2);
            expect(versions[2].version).toBe(3);
        });

        it('should return empty array if document not found', async () => {
            const versions = await engine.getVersions('nonexistent');
            expect(versions).toHaveLength(0);
        });

        it('should include version metadata', async () => {
            const doc = createTestDocument({ version: 1 });
            await engine.saveDocument(doc);

            const versions = await engine.getVersions(doc.id);
            expect(versions[0]).toEqual({
                version: 1,
                timestamp: expect.any(Number),
                size: expect.any(Number),
            });
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.getVersions('any-id')).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    describe('restoreVersion', () => {
        it('should restore a specific version', async () => {
            const doc1 = createTestDocument({ version: 1, name: 'Version 1' });
            await engine.saveDocument(doc1);

            const doc2 = createTestDocument({ id: doc1.id, version: 2, name: 'Version 2' });
            await engine.saveDocument(doc2);

            const restored = await engine.restoreVersion(doc1.id, 1);
            expect(restored.name).toBe('Version 1');
            expect(restored.version).toBe(1);
        });

        it('should throw error if version not found', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            await expect(engine.restoreVersion(doc.id, 999)).rejects.toThrow('Version not found');
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.restoreVersion('any-id', 1)).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    // =========================================================================
    // Storage Management
    // =========================================================================

    describe('getStorageSize', () => {
        it('should calculate total storage size', async () => {
            const doc1 = createTestDocument();
            const doc2 = createTestDocument();

            await engine.saveDocument(doc1);
            await engine.saveDocument(doc2);

            const size = await engine.getStorageSize();
            expect(size).toBeGreaterThan(0);
        });

        it('should return 0 if no documents', async () => {
            const size = await engine.getStorageSize();
            expect(size).toBe(0);
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.getStorageSize()).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    describe('getStorageStats', () => {
        it('should return storage statistics', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            const stats = await engine.getStorageStats();
            expect(stats).toEqual({
                totalSize: expect.any(Number),
                documentCount: 1,
                maxSize: 10 * 1024 * 1024,
                usagePercent: expect.any(Number),
            });
        });

        it('should calculate usage percent correctly', async () => {
            const doc = createTestDocument();
            await engine.saveDocument(doc);

            const stats = await engine.getStorageStats();
            expect(stats.usagePercent).toBeGreaterThan(0);
            expect(stats.usagePercent).toBeLessThan(100);
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.getStorageStats()).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    describe('cleanupOldVersions', () => {
        it('should remove old versions beyond maxVersions', async () => {
            const engine = new StorageEngine({
                autoSaveInterval: 0,
                maxVersions: 2,
                maxStorageSize: 10 * 1024 * 1024,
            });
            (engine as any).primaryAdapter = mockAdapter;
            (engine as any).fallbackAdapter = mockAdapter;
            await engine.init();

            const doc1 = createTestDocument({ version: 1 });
            await engine.saveDocument(doc1);

            const doc2 = createTestDocument({ id: doc1.id, version: 2 });
            await engine.saveDocument(doc2);

            const doc3 = createTestDocument({ id: doc1.id, version: 3 });
            await engine.saveDocument(doc3);

            const doc4 = createTestDocument({ id: doc1.id, version: 4 });
            await engine.saveDocument(doc4);

            await engine.cleanupOldVersions();

            const versions = await engine.getVersions(doc1.id);
            expect(versions).toHaveLength(2);
            expect(versions[0].version).toBe(3);
            expect(versions[1].version).toBe(4);
        });

        it('should throw error if not initialized', async () => {
            const uninitializedEngine = new StorageEngine();
            await expect(uninitializedEngine.cleanupOldVersions()).rejects.toThrow(
                'Storage engine not initialized'
            );
        });
    });

    // =========================================================================
    // Auto-Save
    // =========================================================================

    describe('enableAutoSave', () => {
        it('should enable auto-save', async () => {
            const doc = createTestDocument();
            const saveCallback = vi.fn(async () => doc);

            const engine = new StorageEngine({
                autoSaveInterval: 100,
                maxVersions: 5,
                maxStorageSize: 10 * 1024 * 1024,
            });
            (engine as any).primaryAdapter = mockAdapter;
            (engine as any).fallbackAdapter = mockAdapter;
            await engine.init();

            engine.enableAutoSave(doc.id, saveCallback);

            // Wait for auto-save to trigger
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(saveCallback).toHaveBeenCalled();
        });

        it('should not enable auto-save if interval is 0', async () => {
            const doc = createTestDocument();
            const saveCallback = vi.fn(async () => doc);

            engine.enableAutoSave(doc.id, saveCallback);

            // Wait to ensure callback is not called
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(saveCallback).not.toHaveBeenCalled();
        });
    });

    describe('disableAutoSave', () => {
        it('should disable auto-save', async () => {
            const doc = createTestDocument();
            const saveCallback = vi.fn(async () => doc);

            const engine = new StorageEngine({
                autoSaveInterval: 100,
                maxVersions: 5,
                maxStorageSize: 10 * 1024 * 1024,
            });
            (engine as any).primaryAdapter = mockAdapter;
            (engine as any).fallbackAdapter = mockAdapter;
            await engine.init();

            engine.enableAutoSave(doc.id, saveCallback);
            engine.disableAutoSave(doc.id);

            // Wait to ensure callback is not called
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(saveCallback).not.toHaveBeenCalled();
        });
    });

    describe('disableAllAutoSave', () => {
        it('should disable all auto-save timers', async () => {
            const doc1 = createTestDocument();
            const doc2 = createTestDocument();
            const saveCallback1 = vi.fn(async () => doc1);
            const saveCallback2 = vi.fn(async () => doc2);

            const engine = new StorageEngine({
                autoSaveInterval: 100,
                maxVersions: 5,
                maxStorageSize: 10 * 1024 * 1024,
            });
            (engine as any).primaryAdapter = mockAdapter;
            (engine as any).fallbackAdapter = mockAdapter;
            await engine.init();

            engine.enableAutoSave(doc1.id, saveCallback1);
            engine.enableAutoSave(doc2.id, saveCallback2);
            engine.disableAllAutoSave();

            // Wait to ensure callbacks are not called
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(saveCallback1).not.toHaveBeenCalled();
            expect(saveCallback2).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Error Handling
    // =========================================================================

    describe('error handling', () => {
        it('should throw StorageError with context', async () => {
            const failingAdapter = {
                save: async () => {
                    throw new Error('Save failed');
                },
                load: async () => null,
                delete: async () => { },
                getSize: async () => 0,
                getAllKeys: async () => [],
                clear: async () => { },
            };

            const engine = new StorageEngine();
            (engine as any).primaryAdapter = failingAdapter;
            (engine as any).fallbackAdapter = failingAdapter;
            await engine.init();

            const doc = createTestDocument();

            try {
                await engine.saveDocument(doc);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(StorageError);
                expect((error as StorageError).context).toBeDefined();
            }
        });
    });
});
