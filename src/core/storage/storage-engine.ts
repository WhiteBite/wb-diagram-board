/**
 * Storage Engine
 * 
 * Main orchestrator for document persistence
 */

import type {
    StorageDocument,
    StorageMetadata,
    StorageConfig,
    StorageAdapter,
    StorageStats,
    VersionEntry,
} from '../../types/storage';
import { StorageError } from '../../types/storage';
import { IndexedDBAdapter } from './indexeddb-adapter';
import { LocalStorageAdapter } from './local-storage-adapter';

/**
 * Default storage configuration
 */
const DEFAULT_CONFIG: StorageConfig = {
    autoSaveInterval: 30000, // 30 seconds
    maxVersions: 10,
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    compressionEnabled: false,
};

/**
 * Main storage engine for managing document persistence
 * 
 * Features:
 * - Multiple storage backends (IndexedDB, localStorage)
 * - Automatic versioning
 * - Auto-save functionality
 * - Storage quota management
 * - Export/import support
 * 
 * @example
 * ```typescript
 * const engine = new StorageEngine();
 * await engine.init();
 * 
 * // Save a document
 * await engine.saveDocument(doc);
 * 
 * // Load a document
 * const loaded = await engine.loadDocument(doc.id);
 * 
 * // List all documents
 * const docs = await engine.listDocuments();
 * ```
 */
export class StorageEngine {
    private primaryAdapter: StorageAdapter;
    private fallbackAdapter: StorageAdapter;
    private config: StorageConfig;
    private initialized = false;
    private autoSaveTimers = new Map<string, ReturnType<typeof setInterval>>();

    constructor(config: Partial<StorageConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.primaryAdapter = new IndexedDBAdapter();
        this.fallbackAdapter = new LocalStorageAdapter();
    }

    /**
     * Initialize the storage engine
     * 
     * Must be called before using the engine
     * 
     * @throws StorageError if initialization fails
     */
    async init(): Promise<void> {
        try {
            // Try to initialize IndexedDB
            if (this.primaryAdapter instanceof IndexedDBAdapter) {
                await this.primaryAdapter.init();
            }
            this.initialized = true;
        } catch (error) {
            console.warn('Failed to initialize IndexedDB, falling back to localStorage', error);
            // Fall back to localStorage
            this.primaryAdapter = this.fallbackAdapter;
            this.initialized = true;
        }
    }

    /**
     * Ensure engine is initialized
     */
    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new StorageError('Storage engine not initialized. Call init() first.');
        }
    }

    /**
     * Save a document to storage
     * 
     * Creates a new version if the document already exists
     * 
     * @param doc - Document to save
     * @throws StorageError if save fails
     */
    async saveDocument(doc: StorageDocument): Promise<void> {
        this.ensureInitialized();

        try {
            // Get existing versions
            const versions = await this.getVersions(doc.id);

            // Check storage quota
            const currentSize = await this.getStorageSize();
            const docSize = new Blob([JSON.stringify(doc)]).size;

            if (currentSize + docSize > this.config.maxStorageSize) {
                // Try to clean up old versions
                await this.cleanupOldVersions();

                // Check again
                const newSize = await this.getStorageSize();
                if (newSize + docSize > this.config.maxStorageSize) {
                    throw new StorageError(
                        'Storage quota exceeded',
                        { currentSize: newSize, docSize, maxSize: this.config.maxStorageSize }
                    );
                }
            }

            // Save current version
            const key = this.getDocumentKey(doc.id, doc.version);
            await this.primaryAdapter.save(key, doc);

            // Save metadata
            const metadata: StorageMetadata = {
                id: doc.id,
                name: doc.name,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                size: docSize,
            };
            await this.primaryAdapter.save(this.getMetadataKey(doc.id), metadata);

            // Clean up old versions if needed
            if (versions.length >= this.config.maxVersions) {
                await this.cleanupOldVersions();
            }
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to save document',
                { docId: doc.id, error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Load a document from storage
     * 
     * Loads the latest version by default
     * 
     * @param id - Document ID
     * @returns Loaded document
     * @throws StorageError if document not found or load fails
     */
    async loadDocument(id: string): Promise<StorageDocument> {
        this.ensureInitialized();

        try {
            const versions = await this.getVersions(id);

            if (versions.length === 0) {
                throw new StorageError(
                    'Document not found',
                    { docId: id }
                );
            }

            // Load latest version
            const latestVersion = versions[versions.length - 1];
            const key = this.getDocumentKey(id, latestVersion.version);
            const data = await this.primaryAdapter.load(key);

            if (!data) {
                throw new StorageError(
                    'Failed to load document data',
                    { docId: id }
                );
            }

            return data as StorageDocument;
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to load document',
                { docId: id, error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * List all documents
     * 
     * @returns Array of document metadata
     * @throws StorageError if list fails
     */
    async listDocuments(): Promise<readonly StorageMetadata[]> {
        this.ensureInitialized();

        try {
            const keys = await this.primaryAdapter.getAllKeys();
            const metadata: StorageMetadata[] = [];

            for (const key of keys) {
                if (key.startsWith('metadata:')) {
                    const data = await this.primaryAdapter.load(key);
                    if (data) {
                        metadata.push(data as StorageMetadata);
                    }
                }
            }

            // Sort by updatedAt descending
            return metadata.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to list documents',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Delete a document and all its versions
     * 
     * @param id - Document ID
     * @throws StorageError if delete fails
     */
    async deleteDocument(id: string): Promise<void> {
        this.ensureInitialized();

        try {
            const versions = await this.getVersions(id);

            // Delete all versions
            for (const version of versions) {
                const key = this.getDocumentKey(id, version.version);
                await this.primaryAdapter.delete(key);
            }

            // Delete metadata
            await this.primaryAdapter.delete(this.getMetadataKey(id));
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to delete document',
                { docId: id, error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Get all versions of a document
     * 
     * @param id - Document ID
     * @returns Array of version entries sorted by version number
     * @throws StorageError if operation fails
     */
    async getVersions(id: string): Promise<readonly VersionEntry[]> {
        this.ensureInitialized();

        try {
            const keys = await this.primaryAdapter.getAllKeys();
            const versions: VersionEntry[] = [];
            const prefix = `doc:${id}:v`;

            for (const key of keys) {
                if (key.startsWith(prefix)) {
                    const versionStr = key.substring(prefix.length);
                    const version = parseInt(versionStr, 10);

                    if (!isNaN(version)) {
                        const data = await this.primaryAdapter.load(key);
                        if (data) {
                            const doc = data as StorageDocument;
                            versions.push({
                                version: doc.version,
                                timestamp: doc.updatedAt,
                                size: new Blob([JSON.stringify(doc)]).size,
                            });
                        }
                    }
                }
            }

            return versions.sort((a, b) => a.version - b.version);
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to get versions',
                { docId: id, error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Restore a specific version of a document
     * 
     * @param id - Document ID
     * @param version - Version number to restore
     * @returns Restored document
     * @throws StorageError if version not found or restore fails
     */
    async restoreVersion(id: string, version: number): Promise<StorageDocument> {
        this.ensureInitialized();

        try {
            const key = this.getDocumentKey(id, version);
            const data = await this.primaryAdapter.load(key);

            if (!data) {
                throw new StorageError(
                    'Version not found',
                    { docId: id, version }
                );
            }

            return data as StorageDocument;
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to restore version',
                { docId: id, version, error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Get total storage size in bytes
     * 
     * @returns Total size in bytes
     * @throws StorageError if operation fails
     */
    async getStorageSize(): Promise<number> {
        this.ensureInitialized();

        try {
            const keys = await this.primaryAdapter.getAllKeys();
            let totalSize = 0;

            for (const key of keys) {
                const size = await this.primaryAdapter.getSize(key);
                totalSize += size;
            }

            return totalSize;
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to get storage size',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Get storage statistics
     * 
     * @returns Storage statistics
     * @throws StorageError if operation fails
     */
    async getStorageStats(): Promise<StorageStats> {
        this.ensureInitialized();

        try {
            const totalSize = await this.getStorageSize();
            const documents = await this.listDocuments();

            return {
                totalSize,
                documentCount: documents.length,
                maxSize: this.config.maxStorageSize,
                usagePercent: (totalSize / this.config.maxStorageSize) * 100,
            };
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to get storage stats',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Clean up old versions to free up space
     * 
     * Keeps only the most recent maxVersions versions per document
     * 
     * @throws StorageError if cleanup fails
     */
    async cleanupOldVersions(): Promise<void> {
        this.ensureInitialized();

        try {
            const documents = await this.listDocuments();

            for (const doc of documents) {
                const versions = await this.getVersions(doc.id);

                // Keep only the most recent maxVersions versions
                if (versions.length > this.config.maxVersions) {
                    const toDelete = versions.slice(0, versions.length - this.config.maxVersions);

                    for (const version of toDelete) {
                        const key = this.getDocumentKey(doc.id, version.version);
                        await this.primaryAdapter.delete(key);
                    }
                }
            }
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to cleanup old versions',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Enable auto-save for a document
     * 
     * @param id - Document ID
     * @param saveCallback - Callback that returns the document to save
     */
    enableAutoSave(id: string, saveCallback: () => Promise<StorageDocument>): void {
        if (this.config.autoSaveInterval === 0) {
            return; // Auto-save disabled
        }

        // Clear existing timer if any
        this.disableAutoSave(id);

        // Set up new timer
        const timer = setInterval(async () => {
            try {
                const doc = await saveCallback();
                await this.saveDocument(doc);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, this.config.autoSaveInterval);

        this.autoSaveTimers.set(id, timer);
    }

    /**
     * Disable auto-save for a document
     * 
     * @param id - Document ID
     */
    disableAutoSave(id: string): void {
        const timer = this.autoSaveTimers.get(id);
        if (timer) {
            clearInterval(timer);
            this.autoSaveTimers.delete(id);
        }
    }

    /**
     * Disable all auto-save timers
     */
    disableAllAutoSave(): void {
        this.autoSaveTimers.forEach(timer => clearInterval(timer));
        this.autoSaveTimers.clear();
    }

    /**
     * Get document storage key
     */
    private getDocumentKey(id: string, version: number): string {
        return `doc:${id}:v${version}`;
    }

    /**
     * Get metadata storage key
     */
    private getMetadataKey(id: string): string {
        return `metadata:${id}`;
    }
}

/**
 * Singleton instance of StorageEngine
 */
export const storageEngine = new StorageEngine();
