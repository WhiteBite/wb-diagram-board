/**
 * WB Canvas - Keyboard Shortcuts Hook
 * 
 * Handles all keyboard shortcuts
 */

import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '../store/canvas-store';
import { Tool } from '../types/canvas';

export function useKeyboard() {
    const setTool = useCanvasStore((s) => s.setTool);
    const undo = useCanvasStore((s) => s.undo);
    const redo = useCanvasStore((s) => s.redo);
    const copy = useCanvasStore((s) => s.copy);
    const cut = useCanvasStore((s) => s.cut);
    const paste = useCanvasStore((s) => s.paste);
    const deleteElements = useCanvasStore((s) => s.deleteElements);
    const selectAll = useCanvasStore((s) => s.selectAll);
    const clearSelection = useCanvasStore((s) => s.clearSelection);
    const duplicateElements = useCanvasStore((s) => s.duplicateElements);
    const zoomIn = useCanvasStore((s) => s.zoomIn);
    const zoomOut = useCanvasStore((s) => s.zoomOut);
    const zoomToFit = useCanvasStore((s) => s.zoomToFit);
    const resetZoom = useCanvasStore((s) => s.resetZoom);
    const toggleGrid = useCanvasStore((s) => s.toggleGrid);
    const bringToFront = useCanvasStore((s) => s.bringToFront);
    const sendToBack = useCanvasStore((s) => s.sendToBack);
    const selectedIds = useCanvasStore((s) => s.selectedIds);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ignore if typing in input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.key.toLowerCase();

        // Tool shortcuts (single keys)
        if (!ctrl && !shift) {
            const toolMap: Record<string, Tool> = {
                'v': 'select',
                'h': 'hand',
                'r': 'rectangle',
                'o': 'ellipse',
                'd': 'diamond',
                'l': 'line',
                'a': 'arrow',
                'p': 'freedraw',
                't': 'text',
                's': 'sticky',
                'f': 'frame',
                'c': 'connector',
                'e': 'eraser',
            };

            if (toolMap[key]) {
                e.preventDefault();
                setTool(toolMap[key]);
                return;
            }
        }

        // Ctrl shortcuts
        if (ctrl) {
            switch (key) {
                case 'z':
                    e.preventDefault();
                    if (shift) {
                        redo();
                    } else {
                        undo();
                    }
                    break;

                case 'y':
                    e.preventDefault();
                    redo();
                    break;

                case 'c':
                    e.preventDefault();
                    copy();
                    break;

                case 'x':
                    e.preventDefault();
                    cut();
                    break;

                case 'v':
                    e.preventDefault();
                    paste();
                    break;

                case 'a':
                    e.preventDefault();
                    selectAll();
                    break;

                case 'd':
                    e.preventDefault();
                    if (selectedIds.length > 0) {
                        duplicateElements(selectedIds);
                    }
                    break;

                case '=':
                case '+':
                    e.preventDefault();
                    zoomIn();
                    break;

                case '-':
                    e.preventDefault();
                    zoomOut();
                    break;

                case '0':
                    e.preventDefault();
                    resetZoom();
                    break;

                case '1':
                    e.preventDefault();
                    zoomToFit();
                    break;

                case 'g':
                    e.preventDefault();
                    toggleGrid();
                    break;

                case ']':
                    e.preventDefault();
                    if (selectedIds.length > 0) {
                        bringToFront(selectedIds);
                    }
                    break;

                case '[':
                    e.preventDefault();
                    if (selectedIds.length > 0) {
                        sendToBack(selectedIds);
                    }
                    break;
            }
            return;
        }

        // Other shortcuts
        switch (key) {
            case 'delete':
            case 'backspace':
                e.preventDefault();
                if (selectedIds.length > 0) {
                    deleteElements(selectedIds);
                }
                break;

            case 'escape':
                e.preventDefault();
                clearSelection();
                setTool('select');
                break;

            case ' ':
                // Space for temporary hand tool (handled in Canvas)
                break;
        }
    }, [
        setTool, undo, redo, copy, cut, paste, deleteElements, selectAll,
        clearSelection, duplicateElements, zoomIn, zoomOut, zoomToFit,
        resetZoom, toggleGrid, bringToFront, sendToBack, selectedIds
    ]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
