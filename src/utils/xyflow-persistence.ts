/**
 * XY Flow Persistence Utilities
 *
 * Functions for saving, loading, exporting and importing XY Flow diagrams.
 * Supports multiple diagrams in localStorage and file export/import.
 */

import type { DiagramNode, DiagramEdge } from '../xyflow/types';

// =============================================================================
// Constants
// =============================================================================

/** LocalStorage key for XY Flow diagrams */
export const STORAGE_KEY = 'xyflow-diagrams';

/** Current schema version for migrations */
export const CURRENT_VERSION = 1;

/** File extension for exported diagrams */
export const FILE_EXTENSION = '.wbd';

/** Debounce interval for autosave (ms) */
export const AUTOSAVE_DEBOUNCE_MS = 300;

/** Maximum storage size estimate (5MB) */
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

// =============================================================================
// Types
// =============================================================================

/**
 * Viewport state for diagram
 */
export interface Viewport {
    readonly x: number;
    readonly y: number;
    readonly zoom: number;
}

/**
 * Complete saved diagram with all data
 */
export interface SavedDiagram {
    readonly id: string;
    readonly name: string;
    readonly nodes: DiagramNode[];
    readonly edges: DiagramEdge[];
    readonly viewport?: Viewport;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: number;
}

/**
 * Lightweight metadata for diagram listing
 */
export interface DiagramMetadata {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly nodeCount: number;
    readonly edgeCount: number;
}

/**
 * Storage structure for all diagrams
 */
interface DiagramStorage {
    diagrams: Record<string, SavedDiagram>;
    version: number;
}

/**
 * Exported file format
 */
interface ExportedDiagram {
    readonly type: 'wb-diagram-board-xyflow';
    readonly version: number;
    readonly diagram: SavedDiagram;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate unique ID for diagram
 */
export function generateId(): string {
    return `diagram-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Safely parse JSON with error handling
 */
function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        console.error('[xyflow-persistence] Failed to parse JSON');
        return fallback;
    }
}

// =============================================================================
// Storage Operations
// =============================================================================

/**
 * Get all diagrams from storage
 */
function getStorage(): DiagramStorage {
    const defaultStorage: DiagramStorage = { diagrams: {}, version: CURRENT_VERSION };

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return defaultStorage;

        const storage = safeJsonParse<DiagramStorage>(data, defaultStorage);

        // Migrate if needed
        if (storage.version !== CURRENT_VERSION) {
            return migrateStorage(storage);
        }

        return storage;
    } catch (error) {
        console.error('[xyflow-persistence] Failed to get storage:', error);
        return defaultStorage;
    }
}

/**
 * Save storage to localStorage
 */
function setStorage(storage: DiagramStorage): boolean {
    try {
        const json = JSON.stringify(storage);

        // Check storage quota
        if (json.length > MAX_STORAGE_SIZE) {
            console.error('[xyflow-persistence] Storage quota exceeded');
            return false;
        }

        localStorage.setItem(STORAGE_KEY, json);
        return true;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error('[xyflow-persistence] Storage quota exceeded');
        } else {
            console.error('[xyflow-persistence] Failed to save storage:', error);
        }
        return false;
    }
}

/**
 * Migrate storage to current version
 */
function migrateStorage(storage: DiagramStorage): DiagramStorage {
    // Currently only version 1, no migrations needed
    // Future migrations would go here
    console.log('[xyflow-persistence] Migrating storage from version', storage.version);

    return {
        ...storage,
        version: CURRENT_VERSION,
    };
}

// =============================================================================
// Diagram CRUD Operations
// =============================================================================

/**
 * Save a diagram to localStorage
 *
 * @param diagram - Diagram to save
 * @returns true if successful
 */
export function saveDiagram(diagram: SavedDiagram): boolean {
    const storage = getStorage();

    const updatedDiagram: SavedDiagram = {
        ...diagram,
        updatedAt: getTimestamp(),
        version: CURRENT_VERSION,
    };

    storage.diagrams[diagram.id] = updatedDiagram;

    const success = setStorage(storage);
    if (success) {
        console.log('[xyflow-persistence] Saved diagram:', diagram.id);
    }

    return success;
}

/**
 * Load a diagram from localStorage
 *
 * @param id - Diagram ID
 * @returns Diagram or null if not found
 */
export function loadDiagram(id: string): SavedDiagram | null {
    const storage = getStorage();
    const diagram = storage.diagrams[id];

    if (!diagram) {
        console.warn('[xyflow-persistence] Diagram not found:', id);
        return null;
    }

    // Migrate individual diagram if needed
    return migrateDiagram(diagram);
}

/**
 * Delete a diagram from localStorage
 *
 * @param id - Diagram ID to delete
 * @returns true if successful
 */
export function deleteDiagram(id: string): boolean {
    const storage = getStorage();

    if (!storage.diagrams[id]) {
        console.warn('[xyflow-persistence] Diagram not found for deletion:', id);
        return false;
    }

    delete storage.diagrams[id];

    const success = setStorage(storage);
    if (success) {
        console.log('[xyflow-persistence] Deleted diagram:', id);
    }

    return success;
}

/**
 * List all diagrams with metadata
 *
 * @returns Array of diagram metadata sorted by updatedAt (newest first)
 */
export function listDiagrams(): DiagramMetadata[] {
    const storage = getStorage();

    return Object.values(storage.diagrams)
        .map((diagram) => ({
            id: diagram.id,
            name: diagram.name,
            createdAt: diagram.createdAt,
            updatedAt: diagram.updatedAt,
            nodeCount: diagram.nodes.length,
            edgeCount: diagram.edges.length,
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Get total number of saved diagrams
 *
 * @returns Number of diagrams
 */
export function getDiagramCount(): number {
    const storage = getStorage();
    return Object.keys(storage.diagrams).length;
}

// =============================================================================
// Create New Diagram
// =============================================================================

/**
 * Create a new empty diagram
 *
 * @param name - Diagram name
 * @returns New saved diagram
 */
export function createDiagram(name: string = 'Untitled Diagram'): SavedDiagram {
    const now = getTimestamp();

    return {
        id: generateId(),
        name,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: now,
        updatedAt: now,
        version: CURRENT_VERSION,
    };
}

/**
 * Create diagram from existing nodes and edges
 *
 * @param name - Diagram name
 * @param nodes - Diagram nodes
 * @param edges - Diagram edges
 * @param viewport - Optional viewport state
 * @returns New saved diagram
 */
export function createDiagramFromData(
    name: string,
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    viewport?: Viewport
): SavedDiagram {
    const now = getTimestamp();

    return {
        id: generateId(),
        name,
        nodes,
        edges,
        viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
        createdAt: now,
        updatedAt: now,
        version: CURRENT_VERSION,
    };
}

// =============================================================================
// File Export/Import
// =============================================================================

/**
 * Export diagram to a downloadable .wbd file
 *
 * @param diagram - Diagram to export
 */
export function exportToFile(diagram: SavedDiagram): void {
    const exportData: ExportedDiagram = {
        type: 'wb-diagram-board-xyflow',
        version: CURRENT_VERSION,
        diagram,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Sanitize filename
    const safeName = diagram.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeName}${FILE_EXTENSION}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[xyflow-persistence] Exported diagram:', link.download);
}

/**
 * Import diagram from a .wbd file
 *
 * @param file - File to import
 * @returns Promise resolving to imported diagram
 * @throws Error if file format is invalid
 */
export async function importFromFile(file: File): Promise<SavedDiagram> {
    const text = await file.text();
    const data = safeJsonParse<unknown>(text, null);

    if (!data || typeof data !== 'object') {
        throw new Error('Invalid file format: not valid JSON');
    }

    const exportedData = data as Partial<ExportedDiagram>;

    // Validate file format
    if (exportedData.type !== 'wb-diagram-board-xyflow') {
        // Try to import as raw diagram
        if (isValidDiagram(data)) {
            return migrateDiagram(data as SavedDiagram);
        }
        throw new Error('Invalid file format: not a WhiteBite Diagram file');
    }

    if (!exportedData.diagram) {
        throw new Error('Invalid file format: missing diagram data');
    }

    // Migrate and return
    const diagram = migrateDiagram(exportedData.diagram);

    // Generate new ID to avoid conflicts
    const now = getTimestamp();
    return {
        ...diagram,
        id: generateId(),
        updatedAt: now,
    };
}

/**
 * Open file picker and import selected file
 *
 * @returns Promise resolving to imported diagram or null if cancelled
 */
export function openFilePicker(): Promise<SavedDiagram | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.wbd,.json';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                resolve(null);
                return;
            }

            try {
                const diagram = await importFromFile(file);
                resolve(diagram);
            } catch (error) {
                console.error('[xyflow-persistence] Import failed:', error);
                resolve(null);
            }
        };

        input.click();
    });
}

// =============================================================================
// Validation & Migration
// =============================================================================

/**
 * Check if object is a valid diagram
 */
function isValidDiagram(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;

    const diagram = data as Partial<SavedDiagram>;
    return (
        typeof diagram.id === 'string' &&
        typeof diagram.name === 'string' &&
        Array.isArray(diagram.nodes) &&
        Array.isArray(diagram.edges)
    );
}

/**
 * Migrate diagram to current version
 *
 * @param diagram - Diagram to migrate (possibly from older version)
 * @returns Migrated diagram
 */
export function migrateDiagram(diagram: unknown): SavedDiagram {
    if (!isValidDiagram(diagram)) {
        throw new Error('Invalid diagram format');
    }

    const d = diagram as SavedDiagram;

    // Version 1 is current, no migrations needed yet
    // Future migrations would go here based on d.version

    return {
        id: d.id,
        name: d.name,
        nodes: d.nodes ?? [],
        edges: d.edges ?? [],
        viewport: d.viewport ?? { x: 0, y: 0, zoom: 1 },
        createdAt: d.createdAt ?? getTimestamp(),
        updatedAt: d.updatedAt ?? getTimestamp(),
        version: CURRENT_VERSION,
    };
}

// =============================================================================
// Auto-save
// =============================================================================

/**
 * Setup autosave for diagram changes
 *
 * @param getState - Function to get current state (nodes, edges)
 * @param diagramId - ID of diagram to save
 * @param diagramName - Name of diagram
 * @param intervalMs - Debounce interval in ms (default: 300)
 * @returns Cleanup function to stop autosave
 */
export function setupAutosave(
    getState: () => { nodes: DiagramNode[]; edges: DiagramEdge[]; viewport?: Viewport },
    diagramId: string,
    diagramName: string,
    intervalMs: number = AUTOSAVE_DEBOUNCE_MS
): () => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastSavedJson = '';

    const save = () => {
        const state = getState();
        const currentJson = JSON.stringify({ nodes: state.nodes, edges: state.edges });

        // Skip if nothing changed
        if (currentJson === lastSavedJson) {
            return;
        }

        const existing = loadDiagram(diagramId);
        const diagram: SavedDiagram = {
            id: diagramId,
            name: diagramName,
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
            createdAt: existing?.createdAt ?? getTimestamp(),
            updatedAt: getTimestamp(),
            version: CURRENT_VERSION,
        };

        const success = saveDiagram(diagram);
        if (success) {
            lastSavedJson = currentJson;
        }
    };

    const debouncedSave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(save, intervalMs);
    };

    // Initial save
    save();

    // Setup interval check (every second)
    const intervalId = setInterval(debouncedSave, 1000);

    // Return cleanup function
    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        clearInterval(intervalId);
        // Final save on cleanup
        save();
    };
}

// =============================================================================
// Storage Info
// =============================================================================

/**
 * Get storage usage information
 *
 * @returns Object with used and available bytes
 */
export function getStorageInfo(): { used: number; available: number } {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const used = data ? data.length * 2 : 0; // UTF-16 encoding

        return {
            used,
            available: MAX_STORAGE_SIZE,
        };
    } catch {
        return { used: 0, available: MAX_STORAGE_SIZE };
    }
}

/**
 * Clear all XY Flow diagrams from storage
 */
export function clearAllDiagrams(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('[xyflow-persistence] Cleared all diagrams');
    } catch (error) {
        console.error('[xyflow-persistence] Failed to clear storage:', error);
    }
}
