/**
 * CommandPalette - Quick command search (Ctrl+K / Cmd+K)
 *
 * Features:
 * - Search commands by name
 * - Search nodes by label
 * - Keyboard navigation (arrows, enter, escape)
 * - Categories: Shapes, Actions, Export, View, Layers
 * - Hotkey display
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';
import { useXYFlowStore } from '../../xyflow/store';
import { DEFAULT_NODE_SIZE } from '../../xyflow/types';
import type { DiagramNode, DiagramNodeType } from '../../xyflow/types';
import styles from './CommandPalette.module.css';

// =============================================================================
// Types
// =============================================================================

export interface CommandPaletteProps {
    /** Whether the palette is open */
    isOpen: boolean;
    /** Callback when palette should close */
    onClose: () => void;
    /** Dark mode */
    isDark?: boolean;
}

interface Command {
    id: string;
    label: string;
    description?: string;
    category: CommandCategory;
    icon: React.ReactNode;
    shortcut?: string[];
    action: () => void;
    disabled?: boolean;
}

interface NodeResult {
    id: string;
    label: string;
    type: string;
    icon: React.ReactNode;
}

type CommandCategory = 'shapes' | 'actions' | 'export' | 'view' | 'layers' | 'nodes';

const CATEGORY_LABELS: Record<CommandCategory, string> = {
    shapes: 'Shapes',
    actions: 'Actions',
    export: 'Export',
    view: 'View',
    layers: 'Layers',
    nodes: 'Go to Node',
};

// =============================================================================
// Icons (inline SVG for simplicity)
// =============================================================================

const Icons = {
    search: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
        </svg>
    ),
    empty: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 15h8M9 9h.01M15 9h.01" />
        </svg>
    ),
    rectangle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
    ),
    ellipse: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="12" rx="10" ry="6" />
        </svg>
    ),
    diamond: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2 2 12l10 10 10-10z" />
        </svg>
    ),
    text: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
    ),
    sticky: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
            <path d="M15 3v6h6" />
        </svg>
    ),
    circle: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    hexagon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
    ),
    cylinder: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    cloud: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
    ),
    undo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
    ),
    redo: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
    ),
    trash: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
    ),
    selectAll: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    ),
    deselect: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="m15 9-6 6M9 9l6 6" />
        </svg>
    ),
    image: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    download: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
    ),
    code: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    zoomIn: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
        </svg>
    ),
    zoomOut: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35M8 11h6" />
        </svg>
    ),
    maximize: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
    ),
    grid: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    map: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" y1="3" x2="9" y2="18" />
            <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
    ),
    layers: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </svg>
    ),
    eye: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    eyeOff: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
    ),
    node: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M12 8v8M8 12h8" />
        </svg>
    ),
};

// =============================================================================
// Helper: Highlight matched text
// =============================================================================

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
}

// =============================================================================
// Component
// =============================================================================

export function CommandPalette({ isOpen, onClose, isDark = false }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // React Flow instance for viewport control
    const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();

    // Store actions
    const nodes = useXYFlowStore((s) => s.nodes);
    const addNode = useXYFlowStore((s) => s.addNode);
    const undo = useXYFlowStore((s) => s.undo);
    const redo = useXYFlowStore((s) => s.redo);
    const canUndo = useXYFlowStore((s) => s.canUndo);
    const canRedo = useXYFlowStore((s) => s.canRedo);
    const clearAll = useXYFlowStore((s) => s.clearAll);
    const selectAll = useXYFlowStore((s) => s.selectAll);
    const clearSelection = useXYFlowStore((s) => s.clearSelection);
    const hiddenNodeIds = useXYFlowStore((s) => s.hiddenNodeIds);
    const setNodeVisibility = useXYFlowStore((s) => s.setNodeVisibility);

    // Create node helper
    const createNode = useCallback((type: DiagramNodeType, label: string) => {
        const size = DEFAULT_NODE_SIZE[type] || { width: 180, height: 100 };
        const newNode: DiagramNode = {
            id: `node-${nanoid(8)}`,
            type,
            position: { x: 100, y: 100 },
            data: {
                label,
                width: size.width,
                height: size.height,
            },
            style: {
                width: size.width,
                height: size.height,
            },
        };
        addNode(newNode);
        onClose();
    }, [addNode, onClose]);

    // Navigate to node
    const navigateToNode = useCallback((nodeId: string) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
            const width = node.measured?.width ?? (node.style?.width as number) ?? 180;
            const height = node.measured?.height ?? (node.style?.height as number) ?? 100;
            setCenter(
                node.position.x + width / 2,
                node.position.y + height / 2,
                { zoom: 1.5, duration: 500 }
            );
        }
        onClose();
    }, [nodes, setCenter, onClose]);

    // Show all hidden nodes
    const showAllLayers = useCallback(() => {
        hiddenNodeIds.forEach((id) => setNodeVisibility(id, true));
        onClose();
    }, [hiddenNodeIds, setNodeVisibility, onClose]);

    // Define commands
    const commands = useMemo<Command[]>(() => [
        // Shapes
        {
            id: 'add-rectangle',
            label: 'Add Rectangle',
            description: 'Add a rectangle shape',
            category: 'shapes',
            icon: Icons.rectangle,
            action: () => createNode('rectangle', 'Rectangle'),
        },
        {
            id: 'add-rounded-rectangle',
            label: 'Add Rounded Rectangle',
            description: 'Add a rounded rectangle shape',
            category: 'shapes',
            icon: Icons.rectangle,
            action: () => createNode('rounded-rectangle', 'Rounded'),
        },
        {
            id: 'add-ellipse',
            label: 'Add Ellipse',
            description: 'Add an ellipse shape',
            category: 'shapes',
            icon: Icons.ellipse,
            action: () => createNode('ellipse', 'Ellipse'),
        },
        {
            id: 'add-circle',
            label: 'Add Circle',
            description: 'Add a circle shape',
            category: 'shapes',
            icon: Icons.circle,
            action: () => createNode('circle', 'Circle'),
        },
        {
            id: 'add-diamond',
            label: 'Add Diamond',
            description: 'Add a diamond shape',
            category: 'shapes',
            icon: Icons.diamond,
            action: () => createNode('diamond', 'Diamond'),
        },
        {
            id: 'add-hexagon',
            label: 'Add Hexagon',
            description: 'Add a hexagon shape',
            category: 'shapes',
            icon: Icons.hexagon,
            action: () => createNode('hexagon', 'Hexagon'),
        },
        {
            id: 'add-cylinder',
            label: 'Add Cylinder',
            description: 'Add a cylinder (database) shape',
            category: 'shapes',
            icon: Icons.cylinder,
            action: () => createNode('cylinder', 'Database'),
        },
        {
            id: 'add-cloud',
            label: 'Add Cloud',
            description: 'Add a cloud shape',
            category: 'shapes',
            icon: Icons.cloud,
            action: () => createNode('cloud', 'Cloud'),
        },
        {
            id: 'add-text',
            label: 'Add Text',
            description: 'Add a text label',
            category: 'shapes',
            icon: Icons.text,
            action: () => createNode('text', 'Text'),
        },
        {
            id: 'add-sticky',
            label: 'Add Sticky Note',
            description: 'Add a sticky note',
            category: 'shapes',
            icon: Icons.sticky,
            action: () => createNode('sticky', 'Note'),
        },
        // Actions
        {
            id: 'undo',
            label: 'Undo',
            description: 'Undo last action',
            category: 'actions',
            icon: Icons.undo,
            shortcut: ['⌘', 'Z'],
            action: () => { undo(); onClose(); },
            disabled: !canUndo(),
        },
        {
            id: 'redo',
            label: 'Redo',
            description: 'Redo last undone action',
            category: 'actions',
            icon: Icons.redo,
            shortcut: ['⌘', '⇧', 'Z'],
            action: () => { redo(); onClose(); },
            disabled: !canRedo(),
        },
        {
            id: 'clear-all',
            label: 'Clear All',
            description: 'Remove all nodes and edges',
            category: 'actions',
            icon: Icons.trash,
            action: () => { clearAll(); onClose(); },
        },
        {
            id: 'select-all',
            label: 'Select All',
            description: 'Select all nodes',
            category: 'actions',
            icon: Icons.selectAll,
            shortcut: ['⌘', 'A'],
            action: () => { selectAll(); onClose(); },
        },
        {
            id: 'deselect-all',
            label: 'Deselect All',
            description: 'Clear selection',
            category: 'actions',
            icon: Icons.deselect,
            shortcut: ['Esc'],
            action: () => { clearSelection(); onClose(); },
        },
        // Export
        {
            id: 'export-png',
            label: 'Export PNG',
            description: 'Export diagram as PNG image',
            category: 'export',
            icon: Icons.image,
            action: () => {
                // Dispatch custom event for export panel
                window.dispatchEvent(new CustomEvent('command-palette:export', { detail: 'png' }));
                onClose();
            },
        },
        {
            id: 'export-svg',
            label: 'Export SVG',
            description: 'Export diagram as SVG vector',
            category: 'export',
            icon: Icons.download,
            action: () => {
                window.dispatchEvent(new CustomEvent('command-palette:export', { detail: 'svg' }));
                onClose();
            },
        },
        {
            id: 'export-json',
            label: 'Export JSON',
            description: 'Export diagram as JSON data',
            category: 'export',
            icon: Icons.code,
            action: () => {
                window.dispatchEvent(new CustomEvent('command-palette:export', { detail: 'json' }));
                onClose();
            },
        },
        // View
        {
            id: 'zoom-in',
            label: 'Zoom In',
            description: 'Increase zoom level',
            category: 'view',
            icon: Icons.zoomIn,
            shortcut: ['⌘', '+'],
            action: () => { zoomIn(); onClose(); },
        },
        {
            id: 'zoom-out',
            label: 'Zoom Out',
            description: 'Decrease zoom level',
            category: 'view',
            icon: Icons.zoomOut,
            shortcut: ['⌘', '-'],
            action: () => { zoomOut(); onClose(); },
        },
        {
            id: 'fit-view',
            label: 'Fit View',
            description: 'Fit all nodes in viewport',
            category: 'view',
            icon: Icons.maximize,
            shortcut: ['⌘', '0'],
            action: () => { fitView({ padding: 0.2, duration: 500 }); onClose(); },
        },
        {
            id: 'toggle-grid',
            label: 'Toggle Grid',
            description: 'Show or hide background grid',
            category: 'view',
            icon: Icons.grid,
            action: () => {
                window.dispatchEvent(new CustomEvent('command-palette:toggle-grid'));
                onClose();
            },
        },
        {
            id: 'toggle-minimap',
            label: 'Toggle Minimap',
            description: 'Show or hide minimap',
            category: 'view',
            icon: Icons.map,
            action: () => {
                window.dispatchEvent(new CustomEvent('command-palette:toggle-minimap'));
                onClose();
            },
        },
        // Layers
        {
            id: 'show-all-layers',
            label: 'Show All Layers',
            description: 'Make all hidden nodes visible',
            category: 'layers',
            icon: Icons.eye,
            action: showAllLayers,
            disabled: hiddenNodeIds.size === 0,
        },
    ], [
        createNode, undo, redo, canUndo, canRedo, clearAll, selectAll, clearSelection,
        zoomIn, zoomOut, fitView, showAllLayers, hiddenNodeIds, onClose
    ]);

    // Search nodes by label
    const nodeResults = useMemo<NodeResult[]>(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        return nodes
            .filter((node) => {
                const label = node.data?.label?.toLowerCase() ?? '';
                return label.includes(lowerQuery);
            })
            .slice(0, 5) // Limit to 5 results
            .map((node) => ({
                id: node.id,
                label: node.data?.label ?? node.id,
                type: node.type ?? 'unknown',
                icon: Icons.node,
            }));
    }, [nodes, query]);

    // Filter commands by query
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands;

        const lowerQuery = query.toLowerCase();
        return commands.filter((cmd) =>
            cmd.label.toLowerCase().includes(lowerQuery) ||
            cmd.description?.toLowerCase().includes(lowerQuery)
        );
    }, [commands, query]);

    // Group commands by category
    const groupedCommands = useMemo(() => {
        const groups: Record<CommandCategory, Command[]> = {
            shapes: [],
            actions: [],
            export: [],
            view: [],
            layers: [],
            nodes: [],
        };

        filteredCommands.forEach((cmd) => {
            groups[cmd.category].push(cmd);
        });

        return groups;
    }, [filteredCommands]);

    // Flat list for keyboard navigation
    const flatItems = useMemo(() => {
        const items: Array<{ type: 'command'; data: Command } | { type: 'node'; data: NodeResult }> = [];

        // Add node results first if searching
        nodeResults.forEach((node) => {
            items.push({ type: 'node', data: node });
        });

        // Add commands by category
        const categoryOrder: CommandCategory[] = ['shapes', 'actions', 'export', 'view', 'layers'];
        categoryOrder.forEach((category) => {
            groupedCommands[category].forEach((cmd) => {
                items.push({ type: 'command', data: cmd });
            });
        });

        return items;
    }, [nodeResults, groupedCommands]);

    // Reset focus when query changes
    useEffect(() => {
        setFocusedIndex(0);
    }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setFocusedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Scroll focused item into view
    useEffect(() => {
        if (!listRef.current) return;
        const focusedEl = listRef.current.querySelector(`[data-index="${focusedIndex}"]`);
        focusedEl?.scrollIntoView({ block: 'nearest' });
    }, [focusedIndex]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((i) => Math.min(i + 1, flatItems.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((i) => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                const item = flatItems[focusedIndex];
                if (item) {
                    if (item.type === 'command' && !item.data.disabled) {
                        item.data.action();
                    } else if (item.type === 'node') {
                        navigateToNode(item.data.id);
                    }
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [flatItems, focusedIndex, navigateToNode, onClose]);

    // Handle overlay click
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    // Calculate item index for data-index attribute
    let itemIndex = 0;

    return (
        <div
            className={`${styles.overlay} ${isDark ? styles.dark : ''}`}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
        >
            <div className={styles.container}>
                {/* Search input */}
                <div className={styles.searchContainer}>
                    <span className={styles.searchIcon}>{Icons.search}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search commands or nodes..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label="Search commands"
                    />
                    <span className={styles.shortcutHint}>ESC to close</span>
                </div>

                {/* Results */}
                <div className={styles.results} ref={listRef} role="listbox">
                    {flatItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>{Icons.empty}</div>
                            <div>No commands found</div>
                        </div>
                    ) : (
                        <>
                            {/* Node results */}
                            {nodeResults.length > 0 && (
                                <div className={styles.category}>
                                    <div className={styles.categoryTitle}>{CATEGORY_LABELS.nodes}</div>
                                    {nodeResults.map((node) => {
                                        const currentIndex = itemIndex++;
                                        return (
                                            <button
                                                key={`node-${node.id}`}
                                                className={`${styles.commandItem} ${currentIndex === focusedIndex ? styles.focused : ''}`}
                                                onClick={() => navigateToNode(node.id)}
                                                data-index={currentIndex}
                                                role="option"
                                                aria-selected={currentIndex === focusedIndex}
                                            >
                                                <span className={styles.commandIcon}>{node.icon}</span>
                                                <div className={styles.commandContent}>
                                                    <div className={styles.commandLabel}>
                                                        {highlightMatch(node.label, query)}
                                                    </div>
                                                    <div className={styles.commandDescription}>
                                                        {node.type}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Commands by category */}
                            {(['shapes', 'actions', 'export', 'view', 'layers'] as CommandCategory[]).map((category) => {
                                const cmds = groupedCommands[category];
                                if (cmds.length === 0) return null;

                                return (
                                    <div key={category} className={styles.category}>
                                        <div className={styles.categoryTitle}>{CATEGORY_LABELS[category]}</div>
                                        {cmds.map((cmd) => {
                                            const currentIndex = itemIndex++;
                                            return (
                                                <button
                                                    key={cmd.id}
                                                    className={`${styles.commandItem} ${currentIndex === focusedIndex ? styles.focused : ''} ${cmd.disabled ? styles.disabled : ''}`}
                                                    onClick={() => !cmd.disabled && cmd.action()}
                                                    disabled={cmd.disabled}
                                                    data-index={currentIndex}
                                                    role="option"
                                                    aria-selected={currentIndex === focusedIndex}
                                                    aria-disabled={cmd.disabled}
                                                >
                                                    <span className={styles.commandIcon}>{cmd.icon}</span>
                                                    <div className={styles.commandContent}>
                                                        <div className={styles.commandLabel}>
                                                            {highlightMatch(cmd.label, query)}
                                                        </div>
                                                        {cmd.description && (
                                                            <div className={styles.commandDescription}>
                                                                {cmd.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {cmd.shortcut && (
                                                        <div className={styles.commandShortcut}>
                                                            {cmd.shortcut.map((key, i) => (
                                                                <kbd key={i}>{key}</kbd>
                                                            ))}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.footerHints}>
                        <span className={styles.footerHint}>
                            <kbd>↑</kbd><kbd>↓</kbd> Navigate
                        </span>
                        <span className={styles.footerHint}>
                            <kbd>↵</kbd> Select
                        </span>
                        <span className={styles.footerHint}>
                            <kbd>Esc</kbd> Close
                        </span>
                    </div>
                    <span>{flatItems.length} results</span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
