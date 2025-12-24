/**
 * LocalStorage Adapter
 * 
 * Implements StorageAdapter interface for browser localStorage
 */

import type { StorageAdapter } from '../../types/storage';
import { StorageError } from '../../types/storage';

/**
 * Adapter for storing data in browser localStorage
 * 
 * Limitations:
 * - ~5-10MB storage limit per domain
 * - Synchronous operations
 * - No compression support
 * 
 * @example
 * ```typescript
 * const adapter = new LocalStorageAdapter();
 * await adapter.save('doc-1', { name: 'My Document' });
 * const data = await adapter.load('doc-1');
 * ```
 */
export class LocalStorageAdapter implements StorageAdapter {
    private readonly prefix = 'wb-diagram:';

    /**
     * Get the full storage key with prefix
     */
    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    /**
     * Save data to localStorage
     * 
     * @param key - Storage key
     * @param data - Data to store (will be serialized to JSON)
     * @throws StorageError if save fails (e.g., quota exceeded)
     */
    async save(key: string, data: unknown): Promise<void> {
        try {
            const fullKey = this.getKey(key);
            const json = JSON.stringify(data);
            localStorage.setItem(fullKey, json);
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'QuotaExceededError') {
                    throw new StorageError(
                        'localStorage quota exceeded',
                        { key, error: error.message }
                    );
                }
                throw new StorageError(
                    `Failed to save to localStorage: ${error.message}`,
                    { key, error: error.message }
                );
            }
            throw new StorageError('Failed to save to localStorage', { key });
        }
    }

    /**
     * Load data from localStorage
     * 
     * @param key - Storage key
     * @returns Stored data or null if not found
     * @throws StorageError if load fails
     */
    async load(key: string): Promise<unknown> {
        try {
            const fullKey = this.getKey(key);
            const json = localStorage.getItem(fullKey);

            if (json === null) {
                return null;
            }

            return JSON.parse(json);
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new StorageError(
                    'Failed to parse stored data',
                    { key, error: error.message }
                );
            }
            if (error instanceof Error) {
                throw new StorageError(
                    `Failed to load from localStorage: ${error.message}`,
                    { key, error: error.message }
                );
            }
            throw new StorageError('Failed to load from localStorage', { key });
        }
    }

    /**
     * Delete data from localStorage
     * 
     * @param key - Storage key
     * @throws StorageError if delete fails
     */
    async delete(key: string): Promise<void> {
        try {
            const fullKey = this.getKey(key);
            localStorage.removeItem(fullKey);
        } catch (error) {
            if (error instanceof Error) {
                throw new StorageError(
                    `Failed to delete from localStorage: ${error.message}`,
                    { key, error: error.message }
                );
            }
            throw new StorageError('Failed to delete from localStorage', { key });
        }
    }

    /**
     * Get the size of stored data in bytes
     * 
     * @param key - Storage key
     * @returns Size in bytes
     */
    async getSize(key: string): Promise<number> {
        try {
            const fullKey = this.getKey(key);
            const json = localStorage.getItem(fullKey);

            if (json === null) {
                return 0;
            }

            // Size in bytes (UTF-16 encoding)
            return new Blob([json]).size;
        } catch (error) {
            if (error instanceof Error) {
                throw new StorageError(
                    `Failed to get size: ${error.message}`,
                    { key, error: error.message }
                );
            }
            throw new StorageError('Failed to get size', { key });
        }
    }

    /**
     * Get all storage keys (with our prefix)
     * 
     * @returns Array of all keys in storage
     */
    async getAllKeys(): Promise<readonly string[]> {
        try {
            const keys: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    // Remove prefix from returned keys
                    keys.push(key.substring(this.prefix.length));
                }
            }

            return keys;
        } catch (error) {
            if (error instanceof Error) {
                throw new StorageError(
                    `Failed to get all keys: ${error.message}`,
                    { error: error.message }
                );
            }
            throw new StorageError('Failed to get all keys');
        }
    }

    /**
     * Clear all data from localStorage (only our prefix)
     * 
     * @throws StorageError if clear fails
     */
    async clear(): Promise<void> {
        try {
            const keys: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }

            keys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            if (error instanceof Error) {
                throw new StorageError(
                    `Failed to clear localStorage: ${error.message}`,
                    { error: error.message }
                );
            }
            throw new StorageError('Failed to clear localStorage');
        }
    }
}
