/**
 * RadialMenu - Circular context menu appearing around cursor
 *
 * Features:
 * - Appears on right-click on canvas or node
 * - Context-aware actions (different for pane vs node)
 * - Quick actions: add shapes, delete, copy, duplicate
 * - Animated appearance with staggered items
 * - Keyboard navigation support
 * - Dark mode support
 */

import { memo, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { useXYFlowStore } from '../../xyflow/store';
import type { DiagramNode, DiagramNodeType } from '../../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../../xyflow/types';
import styles from './RadialMenu.module.css';

// =============================================================================
// Types
// =============================================================================

export type RadialMenuContext = 'pane' | 'node';

export interface RadialMenuProps {
    /** X position of the menu center */
    x: number;
    /** Y position of the menu center */
    y: number;
    /** Callback to close the menu */
    onClose: () => void;
    /** Context type - pane (empty canvas) or node */
    context?: RadialMenuContext;
    /** Target node ID when context is 'node' */
    targetNodeId?: string;
    /** Dark mode */
    isDark?: boolean;
    /** Whether there are selected elements */
    hasSelection?: boolean;
    /** Whether clipboard has content */
    hasClipboard?: boolean;
}

interface RadialMenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: () => void;
    disabled?: boolean;
    danger?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const MENU_RADIUS = 85; // Distance from center to items

// =============================================================================
// Icons
// =============================================================================

const AddIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const CopyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const PasteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
);

const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const DuplicateIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
);

const SelectAllIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

// Shape icons for pane context
const RectangleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
);

const EllipseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="10" ry="7" />
    </svg>
);

const DiamondIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
    </svg>
);

const TextIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
);

const StickyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
        <path d="M15 3v6h6" />
    </svg>
);

// Node context icons
const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const CopyStyleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

const BringFrontIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
);

// =============================================================================
// Component
// =============================================================================

export const RadialMenu = memo(function RadialMenu({
    x,
    y,
    onClose,
    context = 'pane',
    targetNodeId,
    isDark = false,
    hasSelection = false,
    hasClipboard = false,
}: RadialMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const { screenToFlowPosition } = useReactFlow();

    // Store state and actions
    const nodes = useXYFlowStore((s) => s.nodes);
    const addNode = useXYFlowStore((s) => s.addNode);
    const removeNode = useXYFlowStore((s) => s.removeNode);
    const copySelected = useXYFlowStore((s) => s.copySelected);
    const pasteClipboard = useXYFlowStore((s) => s.pasteClipboard);
    const deleteSelected = useXYFlowStore((s) => s.deleteSelected);
    const duplicateSelected = useXYFlowStore((s) => s.duplicateSelected);
    const selectAll = useXYFlowStore((s) => s.selectAll);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);
    const bringToFront = useXYFlowStore((s) => s.bringToFront);
    const setNodes = useXYFlowStore((s) => s.setNodes);

    // Get target node if in node context
    const targetNode = useMemo(() => {
        if (context === 'node' && targetNodeId) {
            return nodes.find((n) => n.id === targetNodeId);
        }
        return null;
    }, [context, targetNodeId, nodes]);

    // Add new shape at menu position
    const handleAddShape = useCallback((shapeType: DiagramNodeType) => {
        const position = screenToFlowPosition({ x, y });
        const defaultSize = DEFAULT_NODE_SIZE[shapeType] || { width: 180, height: 100 };
        const label = shapeType.charAt(0).toUpperCase() + shapeType.slice(1).replace(/-/g, ' ');

        const newNode: DiagramNode = {
            id: `node-${nanoid(8)}`,
            type: shapeType,
            position: {
                x: position.x - defaultSize.width / 2,
                y: position.y - defaultSize.height / 2,
            },
            data: {
                label,
                width: defaultSize.width,
                height: defaultSize.height,
            },
            style: {
                width: defaultSize.width,
                height: defaultSize.height,
            },
        };
        pushHistory(`Add ${shapeType} from radial menu`);
        addNode(newNode);
        onClose();
    }, [x, y, screenToFlowPosition, addNode, pushHistory, onClose]);

    // Duplicate target node
    const handleDuplicate = useCallback(() => {
        if (targetNode) {
            // Select the target node first, then duplicate
            setNodes(nodes.map((n) => ({ ...n, selected: n.id === targetNodeId })));
            setTimeout(() => {
                duplicateSelected();
                onClose();
            }, 0);
        } else if (hasSelection) {
            duplicateSelected();
            onClose();
        }
    }, [targetNode, targetNodeId, nodes, setNodes, duplicateSelected, hasSelection, onClose]);

    // Delete target node or selection
    const handleDelete = useCallback(() => {
        if (targetNode && targetNodeId) {
            pushHistory(`Delete node: ${targetNode.data?.label ?? targetNodeId}`);
            removeNode(targetNodeId);
        } else if (hasSelection) {
            deleteSelected();
        }
        onClose();
    }, [targetNode, targetNodeId, removeNode, deleteSelected, hasSelection, pushHistory, onClose]);

    // Copy target node or selection
    const handleCopy = useCallback(() => {
        if (targetNode) {
            setNodes(nodes.map((n) => ({ ...n, selected: n.id === targetNodeId })));
            setTimeout(() => {
                copySelected();
                onClose();
            }, 0);
        } else if (hasSelection) {
            copySelected();
            onClose();
        }
    }, [targetNode, targetNodeId, nodes, setNodes, copySelected, hasSelection, onClose]);

    // Bring node to front
    const handleBringToFront = useCallback(() => {
        if (targetNodeId) {
            bringToFront(targetNodeId);
        }
        onClose();
    }, [targetNodeId, bringToFront, onClose]);

    // Edit node (trigger double-click behavior)
    const handleEdit = useCallback(() => {
        if (targetNode) {
            // Dispatch a custom event that XYFlowBoard can listen to
            const event = new CustomEvent('radialMenuEdit', { detail: { nodeId: targetNodeId } });
            window.dispatchEvent(event);
        }
        onClose();
    }, [targetNode, targetNodeId, onClose]);

    // Menu items for pane context (empty canvas)
    const paneMenuItems: RadialMenuItem[] = useMemo(() => [
        {
            id: 'rectangle',
            label: 'Rect',
            icon: <RectangleIcon />,
            action: () => handleAddShape('rectangle'),
        },
        {
            id: 'ellipse',
            label: 'Ellipse',
            icon: <EllipseIcon />,
            action: () => handleAddShape('ellipse'),
        },
        {
            id: 'diamond',
            label: 'Diamond',
            icon: <DiamondIcon />,
            action: () => handleAddShape('diamond'),
        },
        {
            id: 'text',
            label: 'Text',
            icon: <TextIcon />,
            action: () => handleAddShape('text'),
        },
        {
            id: 'sticky',
            label: 'Sticky',
            icon: <StickyIcon />,
            action: () => handleAddShape('sticky'),
        },
        {
            id: 'paste',
            label: 'Paste',
            icon: <PasteIcon />,
            action: () => {
                pasteClipboard();
                onClose();
            },
            disabled: !hasClipboard,
        },
    ], [handleAddShape, pasteClipboard, hasClipboard, onClose]);

    // Menu items for node context
    const nodeMenuItems: RadialMenuItem[] = useMemo(() => [
        {
            id: 'edit',
            label: 'Edit',
            icon: <EditIcon />,
            action: handleEdit,
        },
        {
            id: 'duplicate',
            label: 'Clone',
            icon: <DuplicateIcon />,
            action: handleDuplicate,
        },
        {
            id: 'copy',
            label: 'Copy',
            icon: <CopyIcon />,
            action: handleCopy,
        },
        {
            id: 'front',
            label: 'Front',
            icon: <BringFrontIcon />,
            action: handleBringToFront,
        },
        {
            id: 'selectAll',
            label: 'All',
            icon: <SelectAllIcon />,
            action: () => {
                selectAll();
                onClose();
            },
        },
        {
            id: 'delete',
            label: 'Delete',
            icon: <DeleteIcon />,
            action: handleDelete,
            danger: true,
        },
    ], [handleEdit, handleDuplicate, handleCopy, handleBringToFront, selectAll, handleDelete, onClose]);

    // Select menu items based on context
    const menuItems = context === 'node' ? nodeMenuItems : paneMenuItems;

    // Calculate item positions in a circle
    const getItemPosition = (index: number, total: number) => {
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
        return {
            x: Math.cos(angle) * MENU_RADIUS,
            y: Math.sin(angle) * MENU_RADIUS,
        };
    };

    // Animate in on mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    setFocusedIndex((prev) => (prev + 1) % menuItems.length);
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    if (focusedIndex >= 0 && !menuItems[focusedIndex].disabled) {
                        menuItems[focusedIndex].action();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [focusedIndex, menuItems, onClose]);

    // Focus management
    useEffect(() => {
        if (focusedIndex >= 0) {
            const button = menuRef.current?.querySelector(
                `[data-index="${focusedIndex}"]`
            ) as HTMLButtonElement;
            button?.focus();
        }
    }, [focusedIndex]);

    return (
        <>
            {/* Overlay to catch clicks outside */}
            <div
                className={styles.overlay}
                onClick={onClose}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onClose();
                }}
                role="presentation"
            />

            {/* Menu container */}
            <div
                ref={menuRef}
                className={`${styles.container} ${isDark ? styles.dark : ''}`}
                style={{ left: x, top: y }}
                role="menu"
                aria-label={context === 'node' ? 'Node actions menu' : 'Quick actions menu'}
            >
                {/* Center indicator */}
                <button
                    className={styles.centerButton}
                    onClick={onClose}
                    aria-label="Close menu"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Menu items */}
                {menuItems.map((item, index) => {
                    const pos = getItemPosition(index, menuItems.length);
                    const delay = index * 30; // Stagger animation

                    return (
                        <button
                            key={item.id}
                            data-index={index}
                            className={`
                                ${styles.menuItem}
                                ${isVisible ? styles.visible : ''}
                                ${item.disabled ? styles.disabled : ''}
                                ${item.danger ? styles.danger : ''}
                            `}
                            style={{
                                left: pos.x,
                                top: pos.y,
                                transitionDelay: `${delay}ms`,
                            }}
                            onClick={item.action}
                            disabled={item.disabled}
                            role="menuitem"
                            aria-label={item.label}
                            aria-disabled={item.disabled}
                            tabIndex={focusedIndex === index ? 0 : -1}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );
});

export default RadialMenu;
