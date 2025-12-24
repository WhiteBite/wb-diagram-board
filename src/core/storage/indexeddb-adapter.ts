/**
 * IndexedDB Adapter
 * 
 * Implements StorageAdapter interface for browser IndexedDB
 */

import type { StorageAdapter } from '../../types/storage';
import { StorageError } from '../../types/storage';

const DB_NAME = 'wb-diagram-board';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

/**
 * Adapter for storing data in browser IndexedDB
 * 
 * Advantages:
 * - Much larger storage limit (typically 50MB+)
 * - Asynchronous operations
 * - Better performance for large data
 * 
 * @example
 * ```typescript
 * const adapter = new IndexedDBAdapter();
 * await adapter.init();
 * await adapter.save('doc-1', { name: 'My Document' });
 * const data = await adapter.load('doc-1');
 * ```
 */
export class IndexedDBAdapter implements StorageAdapter {
    private db: IDBDatabase | null = null;

    /**
     * Initialize the IndexedDB database
     * 
     * Must be called before using the adapter
     * 
     * @throws StorageError if initialization fails
     */
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new StorageError(
                    'Failed to open IndexedDB',
                    { error: request.error?.message }
                ));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    /**
     * Ensure database is initialized
     */
    private ensureInitialized(): void {
        if (!this.db) {
            throw new StorageError('IndexedDB not initialized. Call init() first.');
        }
    }

    /**
     * Save data to IndexedDB
     * 
     * @param key - Storage key
     * @param data - Data to store (will be serialized to JSON)
     * @throws StorageError if save fails
     */
    async save(key: string, data: unknown): Promise<void> {
        this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const json = JSON.stringify(data);
                const request = store.put(json, key);

                request.onerror = () => {
                    reject(new StorageError(
                        'Failed to save to IndexedDB',
                        { key, error: request.error?.message }
                    ));
                };

                request.onsuccess = () => {
                    resolve();
                };

                transaction.onerror = () => {
                    reject(new StorageError(
                        'Transaction failed',
                        { key, error: transaction.error?.message }
                    ));
                };
            } catch (error) {
                if (error instanceof Error) {
                    reject(new StorageError(
                        `Failed to save to IndexedDB: ${error.message}`,
                        { key, error: error.message }
                    ));
                } else {
                    reject(new StorageError('Failed to save to IndexedDB', { key }));
                }
            }
        });
    }

    /**
     * Load data from IndexedDB
     * 
     * @param key - Storage key
     * @returns Stored data or null if not found
     * @throws StorageError if load fails
     */
    async load(key: string): Promise<unknown> {
        this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onerror = () => {
                    reject(new StorageError(
                        'Failed to load from IndexedDB',
                        { key, error: request.error?.message }
                    ));
                };

                request.onsuccess = () => {
                    const json = request.result;

                    if (json === undefined) {
                        resolve(null);
                        return;
                    }

                    try {
                        resolve(JSON.parse(json));
                    } catch (error) {
                        reject(new StorageError(
                            'Failed to parse stored data',
                            { key, error: error instanceof Error ? error.message : 'Unknown error' }
                        ));
                    }
                };

                transaction.onerror = () => {
                    reject(new StorageError(
                        'Transaction failed',
                        { key, error: transaction.error?.message }
                    ));
                };
            } catch (error) {
                if (error instanceof Error) {
                    reject(new StorageError(
                        `Failed to load from IndexedDB: ${error.message}`,
                        { key, error: error.message }
                    ));
                } else {
                    reject(new StorageError('Failed to load from IndexedDB', { key }));
                }
            }
        });
    }

    /**
     * Delete data from IndexedDB
     * 
     * @param key - Storage key
     * @throws StorageError if delete fails
     */
    async delete(key: string): Promise<void> {
        this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(key);

                request.onerror = () => {
                    reject(new StorageError(
                        'Failed to delete from IndexedDB',
                        { key, error: request.error?.message }
                    ));
                };

                request.onsuccess = () => {
                    resolve();
                };

                transaction.onerror = () => {
                    reject(new StorageError(
                        'Transaction failed',
                        { key, error: transaction.error?.message }
                    ));
                };
            } catch (error) {
                if (error instanceof Error) {
                    reject(new StorageError(
                        `Failed to delete from IndexedDB: ${error.message}`,
                        { key, error: error.message }
                    ));
                } else {
                    reject(new StorageError('Failed to delete from IndexedDB', { key }));
                }
            }
        });
    }

    /**
     * Get the size of stored data in bytes
     * 
     * @param key - Storage key
     * @returns Size in bytes
     */
    async getSize(key: string): Promise<number> {
        this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onerror = () => {
                    reject(new StorageError(
                        'Failed to get size',
                        { key, error: request.error?.message }
                    ));
                };

                request.onsuccess = () => {
                    const json = request.result;

                    if (json === undefined) {
                        resolve(0);
                        return;
                    }

                    resolve(new Blob([json]).size);
                };

                transaction.onerror = () => {
                    reject(new StorageError(
                        'Transaction failed',
                        { key, error: transaction.error?.message }
                    ));
                };
            } catch (error) {
                if (error instanceof Error) {
                    reject(new StorageError(
                        `Failed to get size: ${error.message}`,
                        { key, error: error.message }
                    ));
                } else {
                    reject(new StorageError('Failed to get size', { key }));
                }
            }
        });
    }

    /**
     * Get all storage keys
     * 
     * @returns Array of all keys in storage
     */
    async getAllKeys(): Promise<readonly string[]> {
        this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAllKeys();

                request.onerror = () => {
                    reject(new StorageError(
                        'Failed to get all keys',
                        { error: request.error?.message }
                    ));
                };

                request.onsuccess = () => {
                    const keys = request.result as string[];
                    resolve(keys);
                };

                transaction.onerror = () => {
                    reject(new StorageError(
                        'Transaction failed',
                        { error: transaction.error?.message }
                    ));
                };
            } catch (error) {
                if (error instanceof Error) {
                    reject(new StorageError(
                        `Failed to get all keys: ${error.message}`,
                        { error: error.message }
                    ));
                } else {
                    reject(new StorageError('Failed to get all keys'));
                }
            }
        });
    }

    /**
     * Clear all data from IndexedDB
     * 
     * @throws StorageError if clear fails
     */
    async clear(): Promise<void> {
        this.ensureInitialized();

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onerror = () => {
                    reject(new StorageError(
                        'Failed to clear IndexedDB',
                        { error: request.error?.message }
                    ));
                };

                request.onsuccess = () => {
                    resolve();
                };

                transaction.onerror = () => {
                    reject(new StorageError(
                        'Transaction failed',
                        { error: transaction.error?.message }
                    ));
                };
            } catch (error) {
                if (error instanceof Error) {
                    reject(new StorageError(
                        `Failed to clear IndexedDB: ${error.message}`,
                        { error: error.message }
                    ));
                } else {
                    reject(new StorageError('Failed to clear IndexedDB'));
                }
            }
        });
    }
}
