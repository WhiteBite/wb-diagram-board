/**
 * useToast Hook
 *
 * Custom hook for managing toast notifications
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    readonly id: string;
    readonly type: ToastType;
    readonly message: string;
}

interface UseToastReturn {
    readonly toasts: readonly Toast[];
    readonly showToast: (type: ToastType, message: string) => string;
    readonly removeToast: (id: string) => void;
    readonly clearAll: () => void;
}

const DEFAULT_DURATION_MS = 3000;

/**
 * Hook for managing toast notifications
 *
 * @returns Object with toasts array and management functions
 *
 * @example
 * ```tsx
 * const { toasts, showToast, removeToast } = useToast();
 *
 * // Show a success toast
 * showToast('success', 'File saved successfully');
 *
 * // Show an error toast
 * showToast('error', 'Failed to save file');
 * ```
 */
export function useToast(): UseToastReturn {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);

    const removeToast = useCallback((id: string) => {
        // Clear timer if exists
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }

        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string): string => {
            const id = nanoid();
            const toast: Toast = { id, type, message };

            setToasts((prev) => [...prev, toast]);

            // Auto-remove after duration
            const timer = setTimeout(() => {
                removeToast(id);
            }, DEFAULT_DURATION_MS);

            timersRef.current.set(id, timer);

            return id;
        },
        [removeToast]
    );

    const clearAll = useCallback(() => {
        // Clear all timers
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current.clear();

        setToasts([]);
    }, []);

    return {
        toasts,
        showToast,
        removeToast,
        clearAll,
    };
}
