/**
 * WB Layers - Layer Item Component
 * 
 * Individual layer item in the layers panel with drag & drop support
 */

import React, { memo, useState, useRef, useEffect } from 'react';
import type { LayerItem as LayerItemType } from '../../types/layers';
import { useLayersStore, selectIsDragged, selectIsDragOver } from '../../store/layers-store';
import styles from './LayerItem.module.css';

// =============================================================================
// Component Props
// =============================================================================

/**
 * Props for the LayerItem component
 */
interface LayerItemProps {
    /** The layer data */
    readonly layer: LayerItemType;
    /** Whether this layer is selected */
    readonly isSelected: boolean;
    /** Whether this layer's children are expanded */
    readonly isExpanded: boolean;
    /** Whether this layer has children */
    readonly hasChildren: boolean;
    /** Callback when layer is selected */
    readonly onSelect: (id: string, multiSelect?: boolean) => void;
    /** Callback to toggle expansion */
    readonly onToggleExpand: (id: string) => void;
    /** Callback to toggle visibility */
    readonly onToggleVisible: (id: string) => void;
    /** Callback to toggle locked state */
    readonly onToggleLocked: (id: string) => void;
    /** Callback to rename layer */
    readonly onRename: (id: string, newName: string) => void;
    /** Callback when drag starts */
    readonly onDragStart: (id: string) => void;
    /** Callback when dragging over */
    readonly onDragOver: (id: string) => void;
    /** Callback when dropped */
    readonly onDrop: (id: string) => void;
    /** Nesting depth for indentation */
    readonly depth?: number;
}

// =============================================================================
// Layer Item Component
// =============================================================================

/**
 * Individual layer item component
 * 
 * Features:
 * - Click to select
 * - Double-click to rename (inline edit)
 * - Drag & drop to reorder
 * - Toggle visibility and locked state
 * - Expand/collapse for frames with children
 * 
 * @example
 * <LayerItem
 *   layer={layer}
 *   isSelected={true}
 *   isExpanded={false}
 *   hasChildren={true}
 *   onSelect={handleSelect}
 *   onToggleExpand={handleToggleExpand}
 *   onToggleVisible={handleToggleVisible}
 *   onToggleLocked={handleToggleLocked}
 *   onRename={handleRename}
 *   onDragStart={handleDragStart}
 *   onDragOver={handleDragOver}
 *   onDrop={handleDrop}
 *   depth={0}
 * />
 */
export const LayerItem = memo(function LayerItem({
    layer,
    isSelected,
    isExpanded,
    hasChildren,
    onSelect,
    onToggleExpand,
    onToggleVisible,
    onToggleLocked,
    onRename,
    onDragStart,
    onDragOver,
    onDrop,
    depth = 0,
}: LayerItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(layer.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const isDragged = useLayersStore((state) => selectIsDragged(state, layer.id));
    const isDragOver = useLayersStore((state) => selectIsDragOver(state, layer.id));

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // ==========================================================================
    // Event Handlers
    // ==========================================================================

    /**
     * Handle layer selection
     */
    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        const multiSelect = e.ctrlKey || e.metaKey;
        onSelect(layer.id, multiSelect);
    };

    /**
     * Handle double-click to start editing
     */
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    /**
     * Handle rename input change
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    };

    /**
     * Handle rename confirmation
     */
    const handleRenameConfirm = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== layer.name) {
            onRename(layer.id, trimmed);
        }
        setIsEditing(false);
        setEditValue(layer.name);
    };

    /**
     * Handle rename cancellation
     */
    const handleRenameCancel = () => {
        setIsEditing(false);
        setEditValue(layer.name);
    };

    /**
     * Handle input key events
     */
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            handleRenameConfirm();
        } else if (e.key === 'Escape') {
            handleRenameCancel();
        }
    };

    /**
     * Handle visibility toggle
     */
    const handleToggleVisible = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleVisible(layer.id);
    };

    /**
     * Handle locked toggle
     */
    const handleToggleLocked = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleLocked(layer.id);
    };

    /**
     * Handle expand toggle
     */
    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleExpand(layer.id);
    };

    /**
     * Handle drag start
     */
    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', layer.id);
        onDragStart(layer.id);
    };

    /**
     * Handle drag over
     */
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(layer.id);
    };

    /**
     * Handle drag leave
     */
    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
    };

    /**
     * Handle drop
     */
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(layer.id);
    };

    // ==========================================================================
    // Render
    // ==========================================================================

    const indentStyle = {
        paddingLeft: `${depth * 16}px`,
    };

    return (
        <div
            className={`${styles.layerItem} ${isSelected ? styles.selected : ''} ${isDragged ? styles.dragged : ''} ${isDragOver ? styles.dragOver : ''}`}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={styles.content} style={indentStyle}>
                {/* Expand/Collapse Button */}
                {hasChildren && (
                    <button
                        className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}
                        onClick={handleToggleExpand}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 4L6 7L9 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
                {!hasChildren && <div className={styles.expandPlaceholder} />}

                {/* Layer Name */}
                <div
                    className={styles.nameContainer}
                    onClick={handleSelect}
                    onDoubleClick={handleDoubleClick}
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.nameInput}
                            value={editValue}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            onBlur={handleRenameConfirm}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={styles.name}>{layer.name}</span>
                    )}
                </div>

                {/* Visibility Toggle */}
                <button
                    className={`${styles.iconButton} ${!layer.visible ? styles.hidden : ''}`}
                    onClick={handleToggleVisible}
                    title={layer.visible ? 'Hide' : 'Show'}
                    aria-label={layer.visible ? 'Hide' : 'Show'}
                >
                    {layer.visible ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                                fill="currentColor"
                            />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M8 3C4.5 3 1.5 5.5 1 8c.5 2.5 3.5 5 7 5s6.5-2.5 7-5c-.5-2.5-3.5-5-7-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                                fill="currentColor"
                                opacity="0.3"
                            />
                            <line x1="1" y1="15" x2="15" y2="1" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    )}
                </button>

                {/* Locked Toggle */}
                <button
                    className={`${styles.iconButton} ${layer.locked ? styles.locked : ''}`}
                    onClick={handleToggleLocked}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                    aria-label={layer.locked ? 'Unlock' : 'Lock'}
                >
                    {layer.locked ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M12 7h-1V5c0-2.21-1.79-4-4-4S3 2.79 3 5v2H2c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zm-4 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3-5H5V5c0-1.66 1.34-3 3-3s3 1.34 3 3v2z"
                                fill="currentColor"
                            />
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M12 7h-1V5c0-2.21-1.79-4-4-4S3 2.79 3 5v2H2c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1zm-4 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3-5H5V5c0-1.66 1.34-3 3-3s3 1.34 3 3v2z"
                                fill="currentColor"
                                opacity="0.3"
                            />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    );
});

LayerItem.displayName = 'LayerItem';
