/**
 * Toast Component
 *
 * Displays toast notifications with support for success, error, info, and warning types
 */

import { memo, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast as ToastType, ToastType as ToastVariant } from '../../hooks/useToast';
import styles from './Toast.module.css';

interface ToastItemProps {
    readonly toast: ToastType;
    readonly onClose: (id: string) => void;
}

const ICONS: Record<ToastVariant, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
};

/**
 * Individual toast notification item
 */
const ToastItem = memo(function ToastItem({ toast, onClose }: ToastItemProps) {
    const Icon = ICONS[toast.type];

    const handleClose = useCallback(() => {
        onClose(toast.id);
    }, [onClose, toast.id]);

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]}`}
            role="alert"
            aria-live="polite"
        >
            <Icon className={styles.icon} aria-hidden="true" />
            <span className={styles.message}>{toast.message}</span>
            <button
                type="button"
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    );
});

interface ToastContainerProps {
    readonly toasts: readonly ToastType[];
    readonly onClose: (id: string) => void;
}

/**
 * Container component for displaying multiple toast notifications
 *
 * @example
 * ```tsx
 * const { toasts, showToast, removeToast } = useToast();
 *
 * return (
 *   <>
 *     <button onClick={() => showToast('success', 'Saved!')}>Save</button>
 *     <ToastContainer toasts={toasts} onClose={removeToast} />
 *   </>
 * );
 * ```
 */
export const ToastContainer = memo(function ToastContainer({
    toasts,
    onClose,
}: ToastContainerProps) {
    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className={styles.container} aria-label="Notifications">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
});

export type { ToastType, ToastVariant };
