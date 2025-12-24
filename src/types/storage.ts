/**
 * Storage System Types
 * 
 * Type definitions for the persistence and storage system
 */

import type { CanvasState } from './canvas';

// =============================================================================
// Storage Document
// =============================================================================

/**
 * A complete document stored in the storage system
 * 
 * @property id - Unique identifier for the document
 * @property name - Human-readable name of the document
 * @property version - Version number for the document (incremented on each save)
 * @property createdAt - Timestamp when the document was created (milliseconds)
 * @property updatedAt - Timestamp when the document was last updated (milliseconds)
 * @property data - The complete canvas state
 * @property thumbnail - Optional base64-encoded thumbnail image
 */
export interface StorageDocument {
    readonly id: string;
    readonly name: string;
    readonly version: number;
    readonly createdAt: number;
    readonly updatedAt: number;
    readonly data: CanvasState;
    readonly thumbnail?: string;
}

// =============================================================================
// Storage Metadata
// =============================================================================

/**
 * Lightweight metadata about a stored document
 * 
 * Used for listing documents without loading the full data
 * 
 * @property id - Unique identifier for the document
 * @property name - Human-readable name of the document
 * @property createdAt - Timestamp when the document was created (milliseconds)
 * @property updatedAt - Timestamp when the document was last updated (milliseconds)
 * @property size - Size of the document in bytes
 */
export interface StorageMetadata {
    readonly id: string;
    readonly name: string;
    readonly createdAt: number;
    readonly updatedAt: number;
    readonly size: number;
}

// =============================================================================
// Storage Configuration
// =============================================================================

/**
 * Configuration options for the storage engine
 * 
 * @property autoSaveInterval - Interval in milliseconds for auto-saving (0 to disable)
 * @property maxVersions - Maximum number of versions to keep per document
 * @property maxStorageSize - Maximum total storage size in bytes
 * @property compressionEnabled - Whether to compress data before storing
 */
export interface StorageConfig {
    readonly autoSaveInterval: number;
    readonly maxVersions: number;
    readonly maxStorageSize: number;
    readonly compressionEnabled: boolean;
}

// =============================================================================
// Storage Adapter Interface
// =============================================================================

/**
 * Interface for storage adapters (localStorage, IndexedDB, etc.)
 * 
 * Adapters implement this interface to provide different storage backends
 */
export interface StorageAdapter {
    /**
     * Save data to storage
     * 
     * @param key - Storage key
     * @param data - Data to store (will be serialized to JSON)
     * @throws StorageError if save fails
     */
    save(key: string, data: unknown): Promise<void>;

    /**
     * Load data from storage
     * 
     * @param key - Storage key
     * @returns Stored data or null if not found
     * @throws StorageError if load fails
     */
    load(key: string): Promise<unknown>;

    /**
     * Delete data from storage
     * 
     * @param key - Storage key
     * @throws StorageError if delete fails
     */
    delete(key: string): Promise<void>;

    /**
     * Get the size of stored data
     * 
     * @param key - Storage key
     * @returns Size in bytes
     */
    getSize(key: string): Promise<number>;

    /**
     * Get all storage keys
     * 
     * @returns Array of all keys in storage
     */
    getAllKeys(): Promise<readonly string[]>;

    /**
     * Clear all data from storage
     * 
     * @throws StorageError if clear fails
     */
    clear(): Promise<void>;
}

// =============================================================================
// Export/Import Formats
// =============================================================================

/**
 * Supported export formats
 */
export type ExportFormat = 'json' | 'png' | 'svg';

/**
 * Result of an export operation
 */
export interface ExportResult {
    readonly format: ExportFormat;
    readonly data: Blob;
    readonly mimeType: string;
}

// =============================================================================
// Storage Error
// =============================================================================

/**
 * Custom error class for storage operations
 * 
 * @example
 * ```typescript
 * try {
 *   await storage.saveDocument(doc);
 * } catch (error) {
 *   if (error instanceof StorageError) {
 *     console.error('Storage failed:', error.message, error.context);
 *   }
 * }
 * ```
 */
export class StorageError extends Error {
    /**
     * Create a new StorageError
     * 
     * @param message - Error message
     * @param context - Additional context information
     */
    constructor(
        message: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'StorageError';
        Object.setPrototypeOf(this, StorageError.prototype);
    }
}

// =============================================================================
// Version History
// =============================================================================

/**
 * A version entry in the document history
 */
export interface VersionEntry {
    readonly version: number;
    readonly timestamp: number;
    readonly size: number;
}

// =============================================================================
// Storage Statistics
// =============================================================================

/**
 * Statistics about storage usage
 */
export interface StorageStats {
    readonly totalSize: number;
    readonly documentCount: number;
    readonly maxSize: number;
    readonly usagePercent: number;
}
