/**
 * ContextMenu - Context menu for nodes, edges, and pane
 *
 * Features:
 * - Different actions for nodes, edges, and empty pane
 * - Keyboard shortcuts display
 * - Dark mode support
 * - Click outside to close
 * - Escape key to close
 */

import { useCallback, useEffect, useRef, memo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { useXYFlowStore } from '../../xyflow/store';
import type { DiagramNode, DiagramNodeType, RouteType } from '../../xyflow/types';
import styles from './ContextMenu.module.css';

// =============================================================================
// Types
// =============================================================================

export type ContextMenuType = 'node' | 'edge' | 'pane';

export interface ContextMenuProps {
    /** X position of the menu */
    x: number;
    /** Y position of the menu */
    y: number;
    /** Type of context menu */
    type: ContextMenuType;
    /** Target element ID (node or edge) */
    targetId?: string;
    /** Callback to close the menu */
    onClose: () => void;
    /** Dark mode */
    dark?: boolean;
}

interface MenuItem {
    id: string;
    label: string;
    shortcut?: string;
    icon?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
    onClick: () => void;
}

interface MenuSeparator {
    type: 'separator';
}

type MenuItemOrSeparator = MenuItem | MenuSeparator;

// =============================================================================
// Icons
// =============================================================================

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

const ArrowDownIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
);

const LockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const UnlockIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
);

const RectangleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
);

const EllipseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="12" rx="10" ry="8" />
    </svg>
);

const DiamondIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L22 12L12 22L2 12L12 2Z" />
    </svg>
);

const TextIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
);

const StickyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
        <path d="M15 3v6h6" />
    </svg>
);

const LineIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const CurveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12c0-4 4-8 9-8s9 4 9 8" />
    </svg>
);

const StepIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12h6v6h6v-6h6" />
    </svg>
);

// =============================================================================
// Component
// =============================================================================

export const ContextMenu = memo(function ContextMenu({
    x,
    y,
    type,
    targetId,
    onClose,
    dark = false,
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
        left: x,
        top: y,
        opacity: 0,
    });

    // Store actions
    const nodes = useXYFlowStore((s) => s.nodes);
    const edges = useXYFlowStore((s) => s.edges);
    const addNode = useXYFlowStore((s) => s.addNode);
    const removeNode = useXYFlowStore((s) => s.removeNode);
    const removeEdge = useXYFlowStore((s) => s.removeEdge);
    const updateEdge = useXYFlowStore((s) => s.updateEdge);
    const bringToFront = useXYFlowStore((s) => s.bringToFront);
    const sendToBack = useXYFlowStore((s) => s.sendToBack);
    const toggleNodeLocked = useXYFlowStore((s) => s.toggleNodeLocked);
    const isNodeLocked = useXYFlowStore((s) => s.isNodeLocked);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    // Get target node/edge
    const targetNode = type === 'node' && targetId ? nodes.find((n) => n.id === targetId) : null;
    const targetEdge = type === 'edge' && targetId ? edges.find((e) => e.id === targetId) : null;
    const isLocked = targetId ? isNodeLocked(targetId) : false;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let adjustedX = x;
            let adjustedY = y;

            if (x + rect.width > viewportWidth) {
                adjustedX = viewportWidth - rect.width - 8;
            }
            if (adjustedX < 8) adjustedX = 8;

            if (y + rect.height > viewportHeight) {
                adjustedY = viewportHeight - rect.height - 8;
            }
            if (adjustedY < 8) adjustedY = 8;

            setMenuStyle({
                left: adjustedX,
                top: adjustedY,
                opacity: 1,
            });
        }
    }, [x, y]);

    // Action handlers
    const handleEdit = useCallback(() => {
        // TODO: Open node editor modal
        console.log('Edit node:', targetId);
        onClose();
    }, [targetId, onClose]);

    const handleDuplicate = useCallback(() => {
        if (!targetNode) return;

        const newNode: DiagramNode = {
            ...targetNode,
            id: `node-${nanoid(8)}`,
            position: {
                x: targetNode.position.x + 20,
                y: targetNode.position.y + 20,
            },
            selected: false,
            data: { ...targetNode.data },
        };

        pushHistory(`Duplicate node: ${targetNode.data?.label ?? targetNode.id}`);
        addNode(newNode);
        onClose();
    }, [targetNode, addNode, pushHistory, onClose]);

    const handleDelete = useCallback(() => {
        if (type === 'node' && targetId) {
            removeNode(targetId);
        } else if (type === 'edge' && targetId) {
            removeEdge(targetId);
        }
        onClose();
    }, [type, targetId, removeNode, removeEdge, onClose]);

    const handleBringToFront = useCallback(() => {
        if (targetId) {
            bringToFront(targetId);
        }
        onClose();
    }, [targetId, bringToFront, onClose]);

    const handleSendToBack = useCallback(() => {
        if (targetId) {
            sendToBack(targetId);
        }
        onClose();
    }, [targetId, sendToBack, onClose]);

    const handleToggleLock = useCallback(() => {
        if (targetId) {
            toggleNodeLocked(targetId);
        }
        onClose();
    }, [targetId, toggleNodeLocked, onClose]);

    const handleChangeEdgeType = useCallback(
        (routeType: RouteType) => {
            if (targetId && targetEdge) {
                updateEdge(targetId, {
                    data: {
                        ...targetEdge.data,
                        routeType,
                    },
                });
            }
            onClose();
        },
        [targetId, targetEdge, updateEdge, onClose]
    );

    const handleAddShape = useCallback(
        (shapeType: DiagramNodeType) => {
            const position = screenToFlowPosition({ x, y });

            const newNode: DiagramNode = {
                id: `node-${nanoid(8)}`,
                type: shapeType,
                position,
                data: {
                    label: `New ${shapeType}`,
                },
            };

            pushHistory(`Add ${shapeType}`);
            addNode(newNode);
            onClose();
        },
        [x, y, screenToFlowPosition, addNode, pushHistory, onClose]
    );

    const handlePaste = useCallback(() => {
        // TODO: Implement clipboard paste
        console.log('Paste at:', x, y);
        onClose();
    }, [x, y, onClose]);

    // Build menu items based on type
    const getMenuItems = (): MenuItemOrSeparator[] => {
        if (type === 'node') {
            return [
                {
                    id: 'edit',
                    label: 'Edit',
                    shortcut: 'Enter',
                    icon: <EditIcon />,
                    onClick: handleEdit,
                },
                {
                    id: 'duplicate',
                    label: 'Duplicate',
                    shortcut: 'Ctrl+D',
                    icon: <CopyIcon />,
                    onClick: handleDuplicate,
                    disabled: isLocked,
                },
                { type: 'separator' },
                {
                    id: 'bringToFront',
                    label: 'Bring to Front',
                    icon: <ArrowUpIcon />,
                    onClick: handleBringToFront,
                },
                {
                    id: 'sendToBack',
                    label: 'Send to Back',
                    icon: <ArrowDownIcon />,
                    onClick: handleSendToBack,
                },
                { type: 'separator' },
                {
                    id: 'lock',
                    label: isLocked ? 'Unlock' : 'Lock',
                    icon: isLocked ? <UnlockIcon /> : <LockIcon />,
                    onClick: handleToggleLock,
                },
                {
                    id: 'delete',
                    label: 'Delete',
                    shortcut: 'Del',
                    icon: <TrashIcon />,
                    danger: true,
                    onClick: handleDelete,
                    disabled: isLocked,
                },
            ];
        }

        if (type === 'edge') {
            const currentRouteType = targetEdge?.data?.routeType ?? 'smoothstep';

            return [
                {
                    id: 'straight',
                    label: 'Straight Line',
                    icon: <LineIcon />,
                    onClick: () => handleChangeEdgeType('straight'),
                    disabled: currentRouteType === 'straight',
                },
                {
                    id: 'smoothstep',
                    label: 'Smooth Step',
                    icon: <StepIcon />,
                    onClick: () => handleChangeEdgeType('smoothstep'),
                    disabled: currentRouteType === 'smoothstep',
                },
                {
                    id: 'bezier',
                    label: 'Bezier Curve',
                    icon: <CurveIcon />,
                    onClick: () => handleChangeEdgeType('bezier'),
                    disabled: currentRouteType === 'bezier',
                },
                { type: 'separator' },
                {
                    id: 'delete',
                    label: 'Delete',
                    shortcut: 'Del',
                    icon: <TrashIcon />,
                    danger: true,
                    onClick: handleDelete,
                },
            ];
        }

        // Pane menu
        return [
            {
                id: 'paste',
                label: 'Paste',
                shortcut: 'Ctrl+V',
                icon: <CopyIcon />,
                onClick: handlePaste,
                disabled: true, // TODO: Enable when clipboard has content
            },
            { type: 'separator' },
            {
                id: 'addRectangle',
                label: 'Add Rectangle',
                icon: <RectangleIcon />,
                onClick: () => handleAddShape('rectangle'),
            },
            {
                id: 'addEllipse',
                label: 'Add Ellipse',
                icon: <EllipseIcon />,
                onClick: () => handleAddShape('ellipse'),
            },
            {
                id: 'addDiamond',
                label: 'Add Diamond',
                icon: <DiamondIcon />,
                onClick: () => handleAddShape('diamond'),
            },
            {
                id: 'addText',
                label: 'Add Text',
                icon: <TextIcon />,
                onClick: () => handleAddShape('text'),
            },
            {
                id: 'addSticky',
                label: 'Add Sticky Note',
                icon: <StickyIcon />,
                onClick: () => handleAddShape('sticky'),
            },
        ];
    };

    const menuItems = getMenuItems();

    return (
        <div
            ref={menuRef}
            className={`${styles.menu} ${dark ? styles.dark : ''}`}
            style={menuStyle}
            role="menu"
            aria-label="Context menu"
        >
            {menuItems.map((item, index) => {
                if ('type' in item && item.type === 'separator') {
                    return <div key={`sep-${index}`} className={styles.separator} role="separator" />;
                }

                const menuItem = item as MenuItem;

                return (
                    <button
                        key={menuItem.id}
                        className={`${styles.menuItem} ${menuItem.danger ? styles.danger : ''} ${menuItem.disabled ? styles.disabled : ''
                            }`}
                        onClick={menuItem.onClick}
                        disabled={menuItem.disabled}
                        role="menuitem"
                    >
                        {menuItem.icon && <span className={styles.icon}>{menuItem.icon}</span>}
                        <span className={styles.label}>{menuItem.label}</span>
                        {menuItem.shortcut && (
                            <span className={styles.shortcut}>{menuItem.shortcut}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
});

export default ContextMenu;
