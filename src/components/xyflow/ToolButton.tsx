/**
 * ToolButton - Reusable tool button for XY Flow toolbar
 * 
 * Features:
 * - Tooltip with tool name and keyboard shortcut
 * - Visual feedback for active state
 * - Drag-to-create support for nodes
 * - Keyboard navigation and accessibility
 */

import { memo, useState, useCallback, useRef, useEffect, type ReactNode, type DragEvent } from 'react';
import styles from './ToolButton.module.css';

// =============================================================================
// Types
// =============================================================================

export interface ToolButtonProps {
    /** Unique tool identifier */
    tool: string;
    /** Icon to display (React node) */
    icon: ReactNode;
    /** Human-readable label for tooltip */
    label: string;
    /** Keyboard shortcut (e.g., "R", "Ctrl+Z") */
    shortcut?: string;
    /** Whether this tool is currently active */
    isActive?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Size variant */
    size?: 'small' | 'medium' | 'large';
    /** Dark mode */
    isDarkMode?: boolean;
    /** Node type for drag-to-create (enables dragging) */
    dragNodeType?: string;
    /** Custom drag data */
    dragData?: Record<string, string>;
}

// =============================================================================
// Constants
// =============================================================================

const TOOLTIP_DELAY_MS = 500;
const DRAG_DATA_TYPE = 'application/xyflow-node-type';

// =============================================================================
// Component
// =============================================================================

export const ToolButton = memo(function ToolButton({
    tool,
    icon,
    label,
    shortcut,
    isActive = false,
    onClick,
    disabled = false,
    size = 'medium',
    isDarkMode = false,
    dragNodeType,
    dragData,
}: ToolButtonProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = useCallback(() => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => {
            setShowTooltip(true);
        }, TOOLTIP_DELAY_MS);
    }, [disabled]);

    const handleMouseLeave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setShowTooltip(false);
    }, []);

    const handleClick = useCallback(() => {
        if (disabled || !onClick) return;

        // Trigger press animation
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);

        onClick();
    }, [disabled, onClick]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
        }
    }, [handleClick]);

    // Drag handlers for drag-to-create
    const handleDragStart = useCallback((e: DragEvent<HTMLButtonElement>) => {
        if (!dragNodeType) return;

        setIsDragging(true);
        setShowTooltip(false);

        // Set the node type for XY Flow to pick up
        e.dataTransfer.setData(DRAG_DATA_TYPE, dragNodeType);
        e.dataTransfer.effectAllowed = 'move';

        // Set additional drag data if provided
        if (dragData) {
            Object.entries(dragData).forEach(([key, value]) => {
                e.dataTransfer.setData(key, value);
            });
        }

        // Create a drag image
        const dragImage = document.createElement('div');
        dragImage.className = styles.dragImage;
        dragImage.innerHTML = buttonRef.current?.innerHTML ?? '';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 20, 20);

        // Clean up drag image after a short delay
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    }, [dragNodeType, dragData]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Build class names
    const buttonClasses = [
        styles.toolButton,
        styles[size],
        isActive && styles.active,
        isPressed && styles.pressed,
        disabled && styles.disabled,
        isDragging && styles.dragging,
        isDarkMode && styles.dark,
        dragNodeType && styles.draggable,
    ].filter(Boolean).join(' ');

    const tooltipClasses = [
        styles.tooltip,
        showTooltip && !isDragging && styles.visible,
        isDarkMode && styles.dark,
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.wrapper}>
            <button
                ref={buttonRef}
                className={buttonClasses}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                disabled={disabled}
                draggable={!!dragNodeType}
                data-tool={tool}
                aria-label={`${label}${shortcut ? ` (${shortcut})` : ''}`}
                aria-pressed={isActive}
                title="" // Disable native tooltip
            >
                <span className={styles.iconWrapper}>
                    {icon}
                </span>
            </button>

            {/* Custom Tooltip */}
            <div className={tooltipClasses} role="tooltip" aria-hidden={!showTooltip}>
                <span className={styles.tooltipLabel}>{label}</span>
                {shortcut && (
                    <span className={styles.tooltipShortcut}>{shortcut}</span>
                )}
                {dragNodeType && (
                    <span className={styles.tooltipHint}>Drag to canvas</span>
                )}
            </div>
        </div>
    );
});

export default ToolButton;
