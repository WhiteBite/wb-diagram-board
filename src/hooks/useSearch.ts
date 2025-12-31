/**
 * useSearch Hook
 *
 * Provides search functionality for diagram nodes by label.
 * Features:
 * - Case-insensitive search
 * - Navigation through results (next/prev)
 * - Highlight support for found nodes
 */

import { useState, useCallback, useMemo } from 'react';
import { useXYFlowStore } from '../xyflow/store';

// =============================================================================
// Types
// =============================================================================

export interface UseSearchResult {
    /** Current search query */
    query: string;
    /** Set search query */
    setQuery: (query: string) => void;
    /** Array of found node IDs */
    results: string[];
    /** Current result index (0-based) */
    currentIndex: number;
    /** Current result node ID or null */
    currentNodeId: string | null;
    /** Execute search with given query */
    search: (query: string) => void;
    /** Navigate to next result */
    goToNext: () => void;
    /** Navigate to previous result */
    goToPrev: () => void;
    /** Clear search results */
    clear: () => void;
    /** Whether there are any results */
    hasResults: boolean;
    /** Total number of results */
    totalResults: number;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for searching nodes by label
 *
 * @example
 * ```tsx
 * const { query, setQuery, search, results, currentIndex, goToNext, goToPrev } = useSearch();
 *
 * // Search for nodes
 * search('user');
 *
 * // Navigate through results
 * goToNext();
 * goToPrev();
 * ```
 */
export function useSearch(): UseSearchResult {
    const nodes = useXYFlowStore((s) => s.nodes);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const search = useCallback(
        (q: string) => {
            setQuery(q);

            if (!q.trim()) {
                setResults([]);
                setCurrentIndex(0);
                return;
            }

            const lowerQuery = q.toLowerCase();
            const found = nodes
                .filter((node) => {
                    const label = node.data?.label;
                    if (typeof label !== 'string') return false;
                    return label.toLowerCase().includes(lowerQuery);
                })
                .map((node) => node.id);

            setResults(found);
            setCurrentIndex(0);
        },
        [nodes]
    );

    const goToNext = useCallback(() => {
        if (results.length === 0) return;
        setCurrentIndex((i) => (i + 1) % results.length);
    }, [results.length]);

    const goToPrev = useCallback(() => {
        if (results.length === 0) return;
        setCurrentIndex((i) => (i - 1 + results.length) % results.length);
    }, [results.length]);

    const clear = useCallback(() => {
        setQuery('');
        setResults([]);
        setCurrentIndex(0);
    }, []);

    const currentNodeId = useMemo(() => {
        if (results.length === 0) return null;
        return results[currentIndex] ?? null;
    }, [results, currentIndex]);

    const hasResults = results.length > 0;
    const totalResults = results.length;

    return {
        query,
        setQuery,
        results,
        currentIndex,
        currentNodeId,
        search,
        goToNext,
        goToPrev,
        clear,
        hasResults,
        totalResults,
    };
}

export default useSearch;
