/**
 * Toolbar - Main toolbar component for XY Flow
 * 
 * Features:
 * - Tool selection (Select, Shapes, Connect, Text, Sticky)
 * - Shape dropdown menu
 * - Import/Export buttons
 * - Undo/Redo buttons
 * - Keyboard shortcuts
 * - Dark mode support
 */

import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useXYFlowStore } from '../../xyflow/store';
import type { DiagramNodeType, DiagramNode } from '../../xyflow/types';
import { applyDagreLayout } from '../../utils/auto-layout';
import { DEFAULT_NODE_SIZE } from '../../xyflow/types';
import { ToolButton } from './ToolButton';
import { ShapeMenu } from './ShapeMenu';
import styles from './Toolbar.module.css';

// =============================================================================
// Types
// =============================================================================

type ToolType = 'select' | 'shapes' | 'connect' | 'text' | 'sticky';

interface ToolDefinition {
    id: ToolType;
    label: string;
    shortcut?: string;
    icon: React.ReactNode;
}

// =============================================================================
// Icons (SVG)
// =============================================================================

const SelectIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        <path d="M13 13l6 6" />
    </svg>
);

const ShapesIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <circle cx="17" cy="7" r="4" />
        <path d="M7 13l-4 8h8l-4-8z" />
        <path d="M17 13l4 8h-8l4-8z" />
    </svg>
);

const ConnectIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const TextIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V4h16v3" />
        <path d="M12 4v16" />
        <path d="M8 20h8" />
    </svg>
);

const StickyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" />
        <path d="M15 3v6h6" />
    </svg>
);

const UndoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
);

const RedoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 7v6h-6" />
        <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
);

const ImportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const ExportIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const TidyUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="15" y="3" width="6" height="6" rx="1" />
        <rect x="9" y="15" width="6" height="6" rx="1" />
        <path d="M6 9v3M18 9v3M12 12v3" />
    </svg>
);

// =============================================================================
// Tool Definitions
// =============================================================================

const TOOLS: ToolDefinition[] = [
    { id: 'select', label: 'Select', shortcut: 'V', icon: <SelectIcon /> },
    { id: 'shapes', label: 'Shapes', shortcut: 'S', icon: <ShapesIcon /> },
    { id: 'connect', label: 'Connect', shortcut: 'C', icon: <ConnectIcon /> },
    { id: 'text', label: 'Text', shortcut: 'T', icon: <TextIcon /> },
    { id: 'sticky', label: 'Sticky Note', shortcut: 'N', icon: <StickyIcon /> },
];

// Keyboard shortcut map
const SHORTCUT_MAP: Record<string, ToolType> = {
    v: 'select',
    s: 'shapes',
    c: 'connect',
    t: 'text',
    n: 'sticky',
};

// =============================================================================
// Component
// =============================================================================

export interface ToolbarProps {
    /** Dark mode */
    isDarkMode?: boolean;
    /** Handler for import action */
    onImport?: () => void;
    /** Handler for export action */
    onExport?: () => void;
}

export const Toolbar = memo(function Toolbar({
    isDarkMode = false,
    onImport,
    onExport,
}: ToolbarProps) {
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [selectedShape, setSelectedShape] = useState<DiagramNodeType>('rectangle');
    const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
    const shapeMenuRef = useRef<HTMLDivElement>(null);

    const { addNode, undo, redo, canUndo, canRedo, nodes, edges, setNodes, pushHistory } = useXYFlowStore();
    const reactFlowInstance = useReactFlow();

    const handleTidyUp = useCallback(() => {
        pushHistory('Tidy Up');
        const { nodes: layoutedNodes } = applyDagreLayout(nodes, edges, { direction: 'TB' });
        setNodes(layoutedNodes);
    }, [nodes, edges, setNodes, pushHistory]);

    // Close shape menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
                setIsShapeMenuOpen(false);
            }
        };

        if (isShapeMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isShapeMenuOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Ignore if modifier keys are pressed
            if (e.ctrlKey || e.metaKey || e.altKey) {
                // Handle Ctrl+Z / Ctrl+Y for undo/redo
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'z' && !e.shiftKey) {
                        e.preventDefault();
                        handleUndo();
                    } else if (e.key === 'z' && e.shiftKey) {
                        e.preventDefault();
                        handleRedo();
                    } else if (e.key === 'y') {
                        e.preventDefault();
                        handleRedo();
                    }
                }
                return;
            }

            const key = e.key.toLowerCase();
            const tool = SHORTCUT_MAP[key];

            if (tool) {
                e.preventDefault();
                handleToolSelect(tool);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleToolSelect = useCallback((tool: ToolType) => {
        setActiveTool(tool);

        if (tool === 'shapes') {
            setIsShapeMenuOpen((prev) => !prev);
        } else {
            setIsShapeMenuOpen(false);
        }

        // For text and sticky, create node immediately at center
        if (tool === 'text' || tool === 'sticky') {
            createNodeAtCenter(tool);
        }
    }, []);

    const handleShapeSelect = useCallback((type: DiagramNodeType) => {
        setSelectedShape(type);
        setIsShapeMenuOpen(false);
        setActiveTool('shapes');
    }, []);

    const createNodeAtCenter = useCallback((type: DiagramNodeType) => {
        const viewport = reactFlowInstance.getViewport();
        const { width, height } = DEFAULT_NODE_SIZE[type];

        // Calculate center position in flow coordinates
        const centerX = (-viewport.x + window.innerWidth / 2) / viewport.zoom - width / 2;
        const centerY = (-viewport.y + window.innerHeight / 2) / viewport.zoom - height / 2;

        const newNode: DiagramNode = {
            id: `${type}-${Date.now()}`,
            type,
            position: { x: centerX, y: centerY },
            data: {
                label: type === 'text' ? 'Text' : type === 'sticky' ? 'Note' : type,
                width,
                height,
            },
        };

        addNode(newNode);
    }, [reactFlowInstance, addNode]);

    const handleUndo = useCallback(() => {
        if (canUndo()) {
            undo();
        }
    }, [canUndo, undo]);

    const handleRedo = useCallback(() => {
        if (canRedo()) {
            redo();
        }
    }, [canRedo, redo]);

    const toolbarClasses = [
        styles.toolbar,
        isDarkMode && styles.dark,
    ].filter(Boolean).join(' ');

    return (
        <div className={toolbarClasses} role="toolbar" aria-label="Diagram tools">
            {/* Main Tools */}
            <div className={styles.toolGroup}>
                {TOOLS.map((tool) => (
                    <div key={tool.id} className={styles.toolWrapper}>
                        {tool.id === 'shapes' ? (
                            <div ref={shapeMenuRef} className={styles.shapeToolWrapper}>
                                <button
                                    className={[
                                        styles.shapeButton,
                                        activeTool === 'shapes' && styles.active,
                                        isDarkMode && styles.dark,
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => handleToolSelect('shapes')}
                                    aria-label={`${tool.label} (${tool.shortcut})`}
                                    aria-haspopup="menu"
                                    aria-expanded={isShapeMenuOpen}
                                    title={`${tool.label} (${tool.shortcut})`}
                                >
                                    <span className={styles.iconWrapper}>{tool.icon}</span>
                                    <span className={styles.chevron}>
                                        <ChevronDownIcon />
                                    </span>
                                </button>
                                {isShapeMenuOpen && (
                                    <div className={styles.shapeMenuDropdown}>
                                        <ShapeMenu
                                            selectedShape={selectedShape}
                                            onShapeSelect={handleShapeSelect}
                                            isOpen={isShapeMenuOpen}
                                            onClose={() => setIsShapeMenuOpen(false)}
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <ToolButton
                                tool={tool.id}
                                icon={tool.icon}
                                label={tool.label}
                                shortcut={tool.shortcut}
                                isActive={activeTool === tool.id}
                                onClick={() => handleToolSelect(tool.id)}
                                isDarkMode={isDarkMode}
                                dragNodeType={tool.id === 'text' ? 'text' : tool.id === 'sticky' ? 'sticky' : undefined}
                            />
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.separator} />

            {/* Undo/Redo */}
            <div className={styles.toolGroup}>
                <ToolButton
                    tool="undo"
                    icon={<UndoIcon />}
                    label="Undo"
                    shortcut="Ctrl+Z"
                    onClick={handleUndo}
                    isDarkMode={isDarkMode}
                    disabled={!canUndo()}
                />
                <ToolButton
                    tool="redo"
                    icon={<RedoIcon />}
                    label="Redo"
                    shortcut="Ctrl+Y"
                    onClick={handleRedo}
                    isDarkMode={isDarkMode}
                    disabled={!canRedo()}
                />
            </div>

            <div className={styles.separator} />

            {/* Tidy Up */}
            <div className={styles.toolGroup}>
                <ToolButton
                    tool="tidy-up"
                    icon={<TidyUpIcon />}
                    label="Tidy Up"
                    onClick={handleTidyUp}
                    isDarkMode={isDarkMode}
                />
            </div>

            <div className={styles.separator} />

            {/* Import/Export */}
            <div className={styles.toolGroup}>
                <ToolButton
                    tool="import"
                    icon={<ImportIcon />}
                    label="Import"
                    onClick={onImport}
                    isDarkMode={isDarkMode}
                />
                <ToolButton
                    tool="export"
                    icon={<ExportIcon />}
                    label="Export"
                    onClick={onExport}
                    isDarkMode={isDarkMode}
                />
            </div>
        </div>
    );
});

export default Toolbar;
