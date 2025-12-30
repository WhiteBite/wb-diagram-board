/**
 * XY Flow Persistence Hook
 *
 * React hook for managing diagram persistence with auto-save support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useXYFlowStore } from '../xyflow/store';
import {
    saveDiagram,
    loadDiagram,
    deleteDiagram,
    listDiagrams,
    createDiagram,
    createDiagramFromData,
    exportToFile,
    openFilePicker,
    generateId,
    AUTOSAVE_DEBOUNCE_MS,
    type SavedDiagram,
    type DiagramMetadata,
    type Viewport,
} from '../utils/xyflow-persistence';

// =============================================================================
// Types
// =============================================================================

export interface UseXYFlowPersistenceOptions {
    /** Initial diagram ID to load */
    initialDiagramId?: string;
    /** Enable auto-save (default: true) */
    autoSave?: boolean;
    /** Auto-save debounce interval in ms (default: 300) */
    autoSaveInterval?: number;
}

export interface UseXYFlowPersistenceReturn {
    /** Save current diagram */
    save: () => boolean;
    /** Load diagram by ID */
    load: (id: string) => boolean;
    /** Save current diagram with new name (creates new diagram) */
    saveAs: (name: string) => string | null;
    /** List all saved diagrams */
    list: () => DiagramMetadata[];
    /** Delete diagram by ID */
    remove: (id: string) => boolean;
    /** Export current diagram to file */
    exportFile: () => void;
    /** Import diagram from file */
    importFile: () => Promise<boolean>;
    /** Create new empty diagram */
    createNew: (name?: string) => string;
    /** Current diagram ID */
    currentId: string | null;
    /** Current diagram name */
    currentName: string;
    /** Set current diagram name */
    setCurrentName: (name: string) => void;
    /** Whether there are unsaved changes */
    isDirty: boolean;
    /** Last saved timestamp */
    lastSaved: Date | null;
    /** Whether auto-save is enabled */
    isAutoSaveEnabled: boolean;
    /** Toggle auto-save */
    setAutoSaveEnabled: (enabled: boolean) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useXYFlowPersistence(
    options: UseXYFlowPersistenceOptions = {}
): UseXYFlowPersistenceReturn {
    const {
        initialDiagramId,
        autoSave = true,
        autoSaveInterval = AUTOSAVE_DEBOUNCE_MS,
    } = options;

    // Store access
    const nodes = useXYFlowStore((state) => state.nodes);
    const edges = useXYFlowStore((state) => state.edges);
    const setNodes = useXYFlowStore((state) => state.setNodes);
    const setEdges = useXYFlowStore((state) => state.setEdges);
    const clearAll = useXYFlowStore((state) => state.clearAll);

    // Local state
    const [currentId, setCurrentId] = useState<string | null>(initialDiagramId ?? null);
    const [currentName, setCurrentName] = useState<string>('Untitled Diagram');
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isAutoSaveEnabled, setAutoSaveEnabled] = useState(autoSave);

    // Refs for tracking changes
    const lastSavedStateRef = useRef<string>('');
    const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });

    // ==========================================================================
    // Core Operations
    // ==========================================================================

    /**
     * Save current diagram
     */
    const save = useCallback((): boolean => {
        if (!currentId) {
            // Create new diagram if none exists
            const newDiagram = createDiagramFromData(currentName, nodes, edges, viewportRef.current);
            const success = saveDiagram(newDiagram);

            if (success) {
                setCurrentId(newDiagram.id);
                setLastSaved(new Date());
                setIsDirty(false);
                lastSavedStateRef.current = JSON.stringify({ nodes, edges });
            }

            return success;
        }

        const existing = loadDiagram(currentId);
        const diagram: SavedDiagram = {
            id: currentId,
            name: currentName,
            nodes,
            edges,
            viewport: viewportRef.current,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
        };

        const success = saveDiagram(diagram);

        if (success) {
            setLastSaved(new Date());
            setIsDirty(false);
            lastSavedStateRef.current = JSON.stringify({ nodes, edges });
        }

        return success;
    }, [currentId, currentName, nodes, edges]);

    /**
     * Load diagram by ID
     */
    const load = useCallback(
        (id: string): boolean => {
            const diagram = loadDiagram(id);

            if (!diagram) {
                console.error('[useXYFlowPersistence] Failed to load diagram:', id);
                return false;
            }

            setNodes(diagram.nodes);
            setEdges(diagram.edges);
            setCurrentId(diagram.id);
            setCurrentName(diagram.name);
            setLastSaved(new Date(diagram.updatedAt));
            setIsDirty(false);
            lastSavedStateRef.current = JSON.stringify({
                nodes: diagram.nodes,
                edges: diagram.edges,
            });

            if (diagram.viewport) {
                viewportRef.current = diagram.viewport;
            }

            return true;
        },
        [setNodes, setEdges]
    );

    /**
     * Save as new diagram
     */
    const saveAs = useCallback(
        (name: string): string | null => {
            const newDiagram = createDiagramFromData(name, nodes, edges, viewportRef.current);
            const success = saveDiagram(newDiagram);

            if (success) {
                setCurrentId(newDiagram.id);
                setCurrentName(name);
                setLastSaved(new Date());
                setIsDirty(false);
                lastSavedStateRef.current = JSON.stringify({ nodes, edges });
                return newDiagram.id;
            }

            return null;
        },
        [nodes, edges]
    );

    /**
     * List all diagrams
     */
    const list = useCallback((): DiagramMetadata[] => {
        return listDiagrams();
    }, []);

    /**
     * Delete diagram
     */
    const remove = useCallback(
        (id: string): boolean => {
            const success = deleteDiagram(id);

            // If deleted current diagram, clear state
            if (success && id === currentId) {
                clearAll();
                setCurrentId(null);
                setCurrentName('Untitled Diagram');
                setLastSaved(null);
                setIsDirty(false);
                lastSavedStateRef.current = '';
            }

            return success;
        },
        [currentId, clearAll]
    );

    /**
     * Export to file
     */
    const exportFile = useCallback((): void => {
        const diagram: SavedDiagram = {
            id: currentId ?? generateId(),
            name: currentName,
            nodes,
            edges,
            viewport: viewportRef.current,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
        };

        exportToFile(diagram);
    }, [currentId, currentName, nodes, edges]);

    /**
     * Import from file
     */
    const importFile = useCallback(async (): Promise<boolean> => {
        const diagram = await openFilePicker();

        if (!diagram) {
            return false;
        }

        // Save imported diagram
        const success = saveDiagram(diagram);

        if (success) {
            setNodes(diagram.nodes);
            setEdges(diagram.edges);
            setCurrentId(diagram.id);
            setCurrentName(diagram.name);
            setLastSaved(new Date());
            setIsDirty(false);
            lastSavedStateRef.current = JSON.stringify({
                nodes: diagram.nodes,
                edges: diagram.edges,
            });

            if (diagram.viewport) {
                viewportRef.current = diagram.viewport;
            }
        }

        return success;
    }, [setNodes, setEdges]);

    /**
     * Create new empty diagram
     */
    const createNew = useCallback(
        (name: string = 'Untitled Diagram'): string => {
            const diagram = createDiagram(name);
            saveDiagram(diagram);

            clearAll();
            setCurrentId(diagram.id);
            setCurrentName(name);
            setLastSaved(new Date());
            setIsDirty(false);
            lastSavedStateRef.current = JSON.stringify({ nodes: [], edges: [] });
            viewportRef.current = { x: 0, y: 0, zoom: 1 };

            return diagram.id;
        },
        [clearAll]
    );

    // ==========================================================================
    // Auto-save Effect
    // ==========================================================================

    useEffect(() => {
        if (!isAutoSaveEnabled || !currentId) {
            return;
        }

        const currentState = JSON.stringify({ nodes, edges });

        // Check if state changed
        if (currentState !== lastSavedStateRef.current) {
            setIsDirty(true);

            // Clear existing timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Schedule auto-save
            autoSaveTimeoutRef.current = setTimeout(() => {
                save();
            }, autoSaveInterval);
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [nodes, edges, currentId, isAutoSaveEnabled, autoSaveInterval, save]);

    // ==========================================================================
    // Initial Load Effect
    // ==========================================================================

    useEffect(() => {
        if (initialDiagramId) {
            load(initialDiagramId);
        }
    }, [initialDiagramId, load]);

    // ==========================================================================
    // Return
    // ==========================================================================

    return {
        save,
        load,
        saveAs,
        list,
        remove,
        exportFile,
        importFile,
        createNew,
        currentId,
        currentName,
        setCurrentName,
        isDirty,
        lastSaved,
        isAutoSaveEnabled,
        setAutoSaveEnabled,
    };
}

export default useXYFlowPersistence;
