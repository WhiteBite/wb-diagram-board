/**
 * Storage Store
 * 
 * Zustand store for managing document persistence state
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StorageDocument, StorageMetadata, ExportFormat } from '../types/storage';
import { storageEngine } from '../core/storage/storage-engine';
import { exportImportService } from '../core/storage/export-import';
import { useCanvasStore } from './canvas-store';
import { createId } from '../types/canvas';

// =============================================================================
// Store State Interface
// =============================================================================

/**
 * Storage state
 */
interface StorageState {
    readonly currentDocument: StorageDocument | null;
    readonly documents: readonly StorageMetadata[];
    readonly isAutoSaving: boolean;
    readonly lastSaveTime: number | null;
    readonly isDirty: boolean;
    readonly isLoading: boolean;
    readonly error: string | null;
}

/**
 * Storage actions
 */
interface StorageActions {
    /**
     * Create a new document
     */
    createDocument: (name: string) => Promise<void>;

    /**
     * Save the current document
     */
    saveDocument: () => Promise<void>;

    /**
     * Load a document by ID
     */
    loadDocument: (id: string) => Promise<void>;

    /**
     * Delete a document by ID
     */
    deleteDocument: (id: string) => Promise<void>;

    /**
     * Refresh the list of documents
     */
    listDocuments: () => Promise<void>;

    /**
     * Export current document to a specific format
     */
    exportDocument: (format: ExportFormat) => Promise<Blob>;

    /**
     * Import a document from a file
     */
    importDocument: (file: File) => Promise<void>;

    /**
     * Mark document as dirty (has unsaved changes)
     */
    markDirty: () => void;

    /**
     * Mark document as clean (all changes saved)
     */
    markClean: () => void;

    /**
     * Enable auto-save
     */
    enableAutoSave: () => void;

    /**
     * Disable auto-save
     */
    disableAutoSave: () => void;

    /**
     * Clear error message
     */
    clearError: () => void;

    /**
     * Get all versions of current document
     */
    getVersions: () => Promise<readonly any[]>;

    /**
     * Restore a specific version
     */
    restoreVersion: (version: number) => Promise<void>;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: StorageState = {
    currentDocument: null,
    documents: [],
    isAutoSaving: false,
    lastSaveTime: null,
    isDirty: false,
    isLoading: false,
    error: null,
};

// =============================================================================
// Store
// =============================================================================

export const useStorageStore = create<StorageState & StorageActions>()(
    immer((set, get) => ({
        ...initialState,

        // =====================================================================
        // Document Management
        // =====================================================================

        createDocument: async (name: string) => {
            set((draft) => {
                draft.isLoading = true;
                draft.error = null;
            });

            try {
                const canvasState = useCanvasStore.getState();
                const doc: StorageDocument = {
                    id: createId(),
                    name,
                    version: 1,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    data: {
                        elements: canvasState.elements,
                        elementOrder: canvasState.elementOrder,
                        transform: canvasState.transform,
                        gridEnabled: canvasState.gridEnabled,
                        snapToGrid: canvasState.snapToGrid,
                        gridSize: canvasState.gridSize,
                        selectedIds: [],
                        hoveredId: null,
                        activeTool: 'select',
                        currentStroke: canvasState.currentStroke,
                        currentFill: canvasState.currentFill,
                        currentTextStyle: canvasState.currentTextStyle,
                        roughStyle: canvasState.roughStyle,
                        darkMode: canvasState.darkMode,
                        history: [],
                        historyIndex: -1,
                        isDrawing: false,
                        isPanning: false,
                        isResizing: false,
                        resizeHandle: null,
                        clipboard: [],
                    },
                };

                await storageEngine.saveDocument(doc);

                set((draft) => {
                    draft.currentDocument = doc;
                    draft.isDirty = false;
                    draft.lastSaveTime = Date.now();
                    draft.isLoading = false;
                });

                // Refresh documents list
                await get().listDocuments();
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to create document';
                    draft.isLoading = false;
                });
            }
        },

        saveDocument: async () => {
            const state = get();
            if (!state.currentDocument) {
                set((draft) => {
                    draft.error = 'No document to save';
                });
                return;
            }

            set((draft) => {
                draft.isLoading = true;
                draft.error = null;
            });

            try {
                const canvasState = useCanvasStore.getState();
                const updatedDoc: StorageDocument = {
                    ...state.currentDocument,
                    version: state.currentDocument.version + 1,
                    updatedAt: Date.now(),
                    data: {
                        elements: canvasState.elements,
                        elementOrder: canvasState.elementOrder,
                        transform: canvasState.transform,
                        gridEnabled: canvasState.gridEnabled,
                        snapToGrid: canvasState.snapToGrid,
                        gridSize: canvasState.gridSize,
                        selectedIds: canvasState.selectedIds,
                        hoveredId: canvasState.hoveredId,
                        activeTool: canvasState.activeTool,
                        currentStroke: canvasState.currentStroke,
                        currentFill: canvasState.currentFill,
                        currentTextStyle: canvasState.currentTextStyle,
                        roughStyle: canvasState.roughStyle,
                        darkMode: canvasState.darkMode,
                        history: canvasState.history,
                        historyIndex: canvasState.historyIndex,
                        isDrawing: canvasState.isDrawing,
                        isPanning: canvasState.isPanning,
                        isResizing: canvasState.isResizing,
                        resizeHandle: canvasState.resizeHandle,
                        clipboard: canvasState.clipboard,
                    },
                };

                await storageEngine.saveDocument(updatedDoc);

                set((draft) => {
                    draft.currentDocument = updatedDoc;
                    draft.isDirty = false;
                    draft.lastSaveTime = Date.now();
                    draft.isLoading = false;
                });
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to save document';
                    draft.isLoading = false;
                });
            }
        },

        loadDocument: async (id: string) => {
            set((draft) => {
                draft.isLoading = true;
                draft.error = null;
            });

            try {
                const doc = await storageEngine.loadDocument(id);

                set((draft) => {
                    draft.currentDocument = doc;
                    draft.isDirty = false;
                    draft.isLoading = false;
                });

                // Load canvas state
                useCanvasStore.setState(doc.data);
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to load document';
                    draft.isLoading = false;
                });
            }
        },

        deleteDocument: async (id: string) => {
            set((draft) => {
                draft.isLoading = true;
                draft.error = null;
            });

            try {
                await storageEngine.deleteDocument(id);

                // If deleting current document, clear it
                if (get().currentDocument?.id === id) {
                    set((draft) => {
                        draft.currentDocument = null;
                        draft.isDirty = false;
                    });
                }

                // Refresh documents list
                await get().listDocuments();

                set((draft) => {
                    draft.isLoading = false;
                });
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to delete document';
                    draft.isLoading = false;
                });
            }
        },

        listDocuments: async () => {
            try {
                const documents = await storageEngine.listDocuments();
                set((draft) => {
                    draft.documents = Array.from(documents);
                });
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to list documents';
                });
            }
        },

        // =====================================================================
        // Export/Import
        // =====================================================================

        exportDocument: async (format: ExportFormat) => {
            const state = get();
            if (!state.currentDocument) {
                throw new Error('No document to export');
            }

            try {
                if (format === 'json') {
                    const json = exportImportService.exportToJSON(state.currentDocument);
                    return new Blob([json], { type: 'application/json' });
                }

                if (format === 'svg') {
                    const svg = await exportImportService.exportToSVG(state.currentDocument);
                    return new Blob([svg], { type: 'image/svg+xml' });
                }

                if (format === 'png') {
                    // Get canvas element from DOM
                    const canvas = document.querySelector('canvas');
                    if (!canvas) {
                        throw new Error('Canvas not found');
                    }
                    return await exportImportService.exportToPNG(state.currentDocument, canvas);
                }

                throw new Error(`Unsupported format: ${format}`);
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to export document';
                });
                throw error;
            }
        },

        importDocument: async (file: File) => {
            set((draft) => {
                draft.isLoading = true;
                draft.error = null;
            });

            try {
                const doc = await exportImportService.importFromFile(file);

                // Save imported document
                await storageEngine.saveDocument(doc);

                set((draft) => {
                    draft.currentDocument = doc;
                    draft.isDirty = false;
                    draft.isLoading = false;
                });

                // Load canvas state
                useCanvasStore.setState(doc.data);

                // Refresh documents list
                await get().listDocuments();
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to import document';
                    draft.isLoading = false;
                });
            }
        },

        // =====================================================================
        // State Management
        // =====================================================================

        markDirty: () => {
            set((draft) => {
                draft.isDirty = true;
            });
        },

        markClean: () => {
            set((draft) => {
                draft.isDirty = false;
            });
        },

        enableAutoSave: () => {
            const state = get();
            if (!state.currentDocument) return;

            set((draft) => {
                draft.isAutoSaving = true;
            });

            storageEngine.enableAutoSave(state.currentDocument.id, async () => {
                const canvasState = useCanvasStore.getState();
                const currentDoc = get().currentDocument;

                if (!currentDoc) {
                    throw new Error('No current document');
                }

                return {
                    ...currentDoc,
                    version: currentDoc.version + 1,
                    updatedAt: Date.now(),
                    data: {
                        elements: canvasState.elements,
                        elementOrder: canvasState.elementOrder,
                        transform: canvasState.transform,
                        gridEnabled: canvasState.gridEnabled,
                        snapToGrid: canvasState.snapToGrid,
                        gridSize: canvasState.gridSize,
                        selectedIds: canvasState.selectedIds,
                        hoveredId: canvasState.hoveredId,
                        activeTool: canvasState.activeTool,
                        currentStroke: canvasState.currentStroke,
                        currentFill: canvasState.currentFill,
                        currentTextStyle: canvasState.currentTextStyle,
                        roughStyle: canvasState.roughStyle,
                        darkMode: canvasState.darkMode,
                        history: canvasState.history,
                        historyIndex: canvasState.historyIndex,
                        isDrawing: canvasState.isDrawing,
                        isPanning: canvasState.isPanning,
                        isResizing: canvasState.isResizing,
                        resizeHandle: canvasState.resizeHandle,
                        clipboard: canvasState.clipboard,
                    },
                };
            });
        },

        disableAutoSave: () => {
            const state = get();
            if (state.currentDocument) {
                storageEngine.disableAutoSave(state.currentDocument.id);
            }

            set((draft) => {
                draft.isAutoSaving = false;
            });
        },

        clearError: () => {
            set((draft) => {
                draft.error = null;
            });
        },

        // =====================================================================
        // Version Management
        // =====================================================================

        getVersions: async () => {
            const state = get();
            if (!state.currentDocument) {
                return [];
            }

            try {
                return await storageEngine.getVersions(state.currentDocument.id);
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to get versions';
                });
                return [];
            }
        },

        restoreVersion: async (version: number) => {
            const state = get();
            if (!state.currentDocument) {
                throw new Error('No current document');
            }

            set((draft) => {
                draft.isLoading = true;
                draft.error = null;
            });

            try {
                const doc = await storageEngine.restoreVersion(state.currentDocument.id, version);

                set((draft) => {
                    draft.currentDocument = doc;
                    draft.isDirty = false;
                    draft.isLoading = false;
                });

                // Load canvas state
                useCanvasStore.setState(doc.data);
            } catch (error) {
                set((draft) => {
                    draft.error = error instanceof Error ? error.message : 'Failed to restore version';
                    draft.isLoading = false;
                });
            }
        },
    }))
);

/**
 * Selectors
 */
export const selectCurrentDocument = (state: StorageState) => state.currentDocument;
export const selectDocuments = (state: StorageState) => state.documents;
export const selectIsAutoSaving = (state: StorageState) => state.isAutoSaving;
export const selectLastSaveTime = (state: StorageState) => state.lastSaveTime;
export const selectIsDirty = (state: StorageState) => state.isDirty;
export const selectIsLoading = (state: StorageState) => state.isLoading;
export const selectError = (state: StorageState) => state.error;
