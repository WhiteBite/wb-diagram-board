/**
 * AutosaveIndicator Component
 *
 * Small indicator showing autosave status:
 * - "Saved" - all changes saved
 * - "Saving..." - save in progress
 * - "Unsaved changes" - pending changes
 */

import { memo, useEffect, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export type AutosaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

export interface AutosaveIndicatorProps {
    /** Current save status */
    status: AutosaveStatus;
    /** Last saved timestamp */
    lastSaved?: Date | null;
    /** Position on screen */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** Custom class name */
    className?: string;
}

// =============================================================================
// Styles (inline for simplicity)
// =============================================================================

const baseStyles: React.CSSProperties = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    borderRadius: '0.25rem',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(4px)',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    zIndex: 50,
    transition: 'opacity 0.2s, transform 0.2s',
    userSelect: 'none',
};

const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: '0.75rem', left: '0.75rem' },
    'top-right': { top: '0.75rem', right: '0.75rem' },
    'bottom-left': { bottom: '0.75rem', left: '0.75rem' },
    'bottom-right': { bottom: '0.75rem', right: '0.75rem' },
};

const dotStyles: React.CSSProperties = {
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    flexShrink: 0,
};

const statusColors: Record<AutosaveStatus, string> = {
    saved: '#22c55e',
    saving: '#3b82f6',
    dirty: '#f59e0b',
    error: '#ef4444',
};

const statusLabels: Record<AutosaveStatus, string> = {
    saved: 'Saved',
    saving: 'Saving...',
    dirty: 'Unsaved',
    error: 'Save failed',
};

// =============================================================================
// Helper Functions
// =============================================================================

function formatLastSaved(date: Date | null | undefined): string {
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 10) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// =============================================================================
// Component
// =============================================================================

export const AutosaveIndicator = memo(function AutosaveIndicator({
    status,
    lastSaved,
    position = 'bottom-left',
    className,
}: AutosaveIndicatorProps) {
    const [visible, setVisible] = useState(true);
    const [displayText, setDisplayText] = useState(statusLabels[status]);

    // Update display text based on status
    useEffect(() => {
        if (status === 'saved' && lastSaved) {
            setDisplayText(`Saved ${formatLastSaved(lastSaved)}`);
        } else {
            setDisplayText(statusLabels[status]);
        }
    }, [status, lastSaved]);

    // Auto-hide after save (show briefly then fade)
    useEffect(() => {
        if (status === 'saved') {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setVisible(true);
        }
    }, [status]);

    // Pulse animation for saving state
    const dotAnimationStyle: React.CSSProperties =
        status === 'saving'
            ? {
                animation: 'pulse 1s infinite',
            }
            : {};

    return (
        <>
            {/* Keyframes for pulse animation */}
            <style>
                {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
            </style>

            <div
                className={className}
                style={{
                    ...baseStyles,
                    ...positionStyles[position],
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(0.25rem)',
                    pointerEvents: visible ? 'auto' : 'none',
                }}
                role="status"
                aria-live="polite"
            >
                <span
                    style={{
                        ...dotStyles,
                        ...dotAnimationStyle,
                        backgroundColor: statusColors[status],
                    }}
                />
                <span style={{ color: '#475569' }}>{displayText}</span>
            </div>
        </>
    );
});

// =============================================================================
// Hook for easy integration
// =============================================================================

export interface UseAutosaveStatusOptions {
    isDirty: boolean;
    lastSaved: Date | null;
    isSaving?: boolean;
    hasError?: boolean;
}

export function useAutosaveStatus({
    isDirty,
    lastSaved,
    isSaving = false,
    hasError = false,
}: UseAutosaveStatusOptions): AutosaveStatus {
    if (hasError) return 'error';
    if (isSaving) return 'saving';
    if (isDirty) return 'dirty';
    if (lastSaved) return 'saved';
    return 'dirty';
}

export default AutosaveIndicator;
