/**
 * WB Canvas - Context Menu
 * 
 * Right-click context menu for elements
 */

import { memo, useEffect, useRef } from 'react';
import {
    Copy,
    Scissors,
    Clipboard,
    Trash2,
    CopyPlus,
    ArrowUpToLine,
    ArrowDownToLine,
    Lock,
    Unlock,
    Group,
    Ungroup,
} from 'lucide-react';
import { useCanvasStore, selectSelectedElements } from '../store/canvas-store';
import { Point } from '../types/canvas';

interface ContextMenuProps {
    position: Point | null;
    onClose: () => void;
}

export const ContextMenu = memo(function ContextMenu({ position, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedElements = useCanvasStore(selectSelectedElements);
    const copy = useCanvasStore((s) => s.copy);
    const cut = useCanvasStore((s) => s.cut);
    const paste = useCanvasStore((s) => s.paste);
    const deleteElements = useCanvasStore((s) => s.deleteElements);
    const duplicateElements = useCanvasStore((s) => s.duplicateElements);
    const bringToFront = useCanvasStore((s) => s.bringToFront);
    const sendToBack = useCanvasStore((s) => s.sendToBack);
    const updateElement = useCanvasStore((s) => s.updateElement);
    const group = useCanvasStore((s) => s.group);
    const ungroup = useCanvasStore((s) => s.ungroup);
    const clipboard = useCanvasStore((s) => s.clipboard);
    const selectedIds = useCanvasStore((s) => s.selectedIds);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!position) return null;

    const hasSelection = selectedElements.length > 0;
    const hasClipboard = clipboard.length > 0;
    const isLocked = selectedElements.some((el) => el.locked);
    const hasGroup = selectedElements.some((el) => el.groupId);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const menuItems = [
        {
            icon: <Copy size={16} />,
            label: 'Copy',
            shortcut: 'Ctrl+C',
            action: copy,
            disabled: !hasSelection,
        },
        {
            icon: <Scissors size={16} />,
            label: 'Cut',
            shortcut: 'Ctrl+X',
            action: cut,
            disabled: !hasSelection,
        },
        {
            icon: <Clipboard size={16} />,
            label: 'Paste',
            shortcut: 'Ctrl+V',
            action: () => paste({ x: position.x, y: position.y }),
            disabled: !hasClipboard,
        },
        {
            icon: <CopyPlus size={16} />,
            label: 'Duplicate',
            shortcut: 'Ctrl+D',
            action: () => duplicateElements(selectedIds),
            disabled: !hasSelection,
        },
        { divider: true },
        {
            icon: <ArrowUpToLine size={16} />,
            label: 'Bring to Front',
            shortcut: 'Ctrl+]',
            action: () => bringToFront(selectedIds),
            disabled: !hasSelection,
        },
        {
            icon: <ArrowDownToLine size={16} />,
            label: 'Send to Back',
            shortcut: 'Ctrl+[',
            action: () => sendToBack(selectedIds),
            disabled: !hasSelection,
        },
        { divider: true },
        {
            icon: isLocked ? <Unlock size={16} /> : <Lock size={16} />,
            label: isLocked ? 'Unlock' : 'Lock',
            action: () => {
                selectedElements.forEach((el) => {
                    updateElement(el.id, { locked: !isLocked });
                });
            },
            disabled: !hasSelection,
        },
        {
            icon: <Group size={16} />,
            label: 'Group',
            shortcut: 'Ctrl+G',
            action: () => group(selectedIds),
            disabled: selectedElements.length < 2,
        },
        {
            icon: <Ungroup size={16} />,
            label: 'Ungroup',
            shortcut: 'Ctrl+Shift+G',
            action: () => {
                const groupIds = new Set(selectedElements.map((el) => el.groupId).filter(Boolean));
                groupIds.forEach((gid) => gid && ungroup(gid));
            },
            disabled: !hasGroup,
        },
        { divider: true },
        {
            icon: <Trash2 size={16} />,
            label: 'Delete',
            shortcut: 'Del',
            action: () => deleteElements(selectedIds),
            disabled: !hasSelection,
            danger: true,
        },
    ];

    return (
        <div
            ref={menuRef}
            className="context-menu animate-fade-in"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            {menuItems.map((item, index) => {
                if ('divider' in item) {
                    return <div key={index} className="context-menu-divider" />;
                }

                return (
                    <button
                        key={index}
                        className={`context-menu-item ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${item.danger ? 'text-red-600' : ''}`}
                        onClick={() => !item.disabled && handleAction(item.action)}
                        disabled={item.disabled}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
                    </button>
                );
            })}
        </div>
    );
});
