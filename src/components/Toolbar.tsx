/**
 * WB Canvas - Toolbar Component
 * 
 * Main tool selection toolbar
 */

import { memo } from 'react';
import {
    MousePointer2,
    Hand,
    Square,
    Circle,
    Diamond,
    Triangle,
    Minus,
    ArrowRight,
    Pencil,
    Type,
    StickyNote,
    Frame,
    Spline,
    Eraser,
    Undo2,
    Redo2,
} from 'lucide-react';
import { useCanvasStore, selectActiveTool, selectCanUndo, selectCanRedo } from '../store/canvas-store';
import { Tool } from '../types/canvas';

interface ToolbarProps {
    position?: 'left' | 'top';
}

export const Toolbar = memo(function Toolbar({ position = 'left' }: ToolbarProps) {
    const activeTool = useCanvasStore(selectActiveTool);
    const canUndo = useCanvasStore(selectCanUndo);
    const canRedo = useCanvasStore(selectCanRedo);
    const setTool = useCanvasStore((s) => s.setTool);
    const undo = useCanvasStore((s) => s.undo);
    const redo = useCanvasStore((s) => s.redo);

    const tools: { tool: Tool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
        { tool: 'select', icon: <MousePointer2 size={20} />, label: 'Select', shortcut: 'V' },
        { tool: 'hand', icon: <Hand size={20} />, label: 'Hand', shortcut: 'H' },
        { tool: 'rectangle', icon: <Square size={20} />, label: 'Rectangle', shortcut: 'R' },
        { tool: 'ellipse', icon: <Circle size={20} />, label: 'Ellipse', shortcut: 'O' },
        { tool: 'diamond', icon: <Diamond size={20} />, label: 'Diamond', shortcut: 'D' },
        { tool: 'triangle', icon: <Triangle size={20} />, label: 'Triangle' },
        { tool: 'line', icon: <Minus size={20} />, label: 'Line', shortcut: 'L' },
        { tool: 'arrow', icon: <ArrowRight size={20} />, label: 'Arrow', shortcut: 'A' },
        { tool: 'freedraw', icon: <Pencil size={20} />, label: 'Pencil', shortcut: 'P' },
        { tool: 'text', icon: <Type size={20} />, label: 'Text', shortcut: 'T' },
        { tool: 'sticky', icon: <StickyNote size={20} />, label: 'Sticky Note', shortcut: 'S' },
        { tool: 'frame', icon: <Frame size={20} />, label: 'Frame', shortcut: 'F' },
        { tool: 'connector', icon: <Spline size={20} />, label: 'Connector', shortcut: 'C' },
        { tool: 'eraser', icon: <Eraser size={20} />, label: 'Eraser', shortcut: 'E' },
    ];

    const isVertical = position === 'left';

    return (
        <div className={`toolbar ${isVertical ? 'toolbar-left' : 'toolbar-top'}`}>
            {/* Undo/Redo */}
            <button
                className="toolbar-button"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
            >
                <Undo2 size={20} />
            </button>
            <button
                className="toolbar-button"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
            >
                <Redo2 size={20} />
            </button>

            <div className={`toolbar-divider ${isVertical ? 'horizontal' : ''}`} />

            {/* Tools */}
            {tools.map(({ tool, icon, label, shortcut }) => (
                <button
                    key={tool}
                    className={`toolbar-button ${activeTool === tool ? 'active' : ''}`}
                    onClick={() => setTool(tool)}
                    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
                >
                    {icon}
                </button>
            ))}
        </div>
    );
});
