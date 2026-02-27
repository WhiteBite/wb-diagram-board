/**
 * WB Canvas - Main Application
 * 
 * Collaborative whiteboard application
 */

import { useState, useCallback, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { StylePanel } from './components/StylePanel';
import { ZoomControls } from './components/ZoomControls';
import { ContextMenu } from './components/ContextMenu';
import { Header } from './components/Header';
import { useKeyboard } from './hooks/useKeyboard';
import { useAutoImport } from './hooks/useAutoImport';
import { useCanvasStore, selectSelectedIds } from './store/canvas-store';
import { useShortcutsStore } from './store/shortcuts-store';
import { shortcutManager } from './core/shortcuts/shortcut-manager';
import { getDefaultShortcuts } from './core/shortcuts/default-shortcuts';
import { Point } from './types/canvas';

// Expose stores for e2e tests (only in development)
if (typeof window !== 'undefined') {
    (window as any).__CANVAS_STORE__ = useCanvasStore;
    (window as any).__SHORTCUTS_STORE__ = useShortcutsStore;
}

export default function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const stored = localStorage.getItem('wb-canvas-dark-mode');
        return stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const [contextMenuPos, setContextMenuPos] = useState<Point | null>(null);
    const selectedIds = useCanvasStore(selectSelectedIds);
    const setStoreDarkMode = useCanvasStore((s) => s.setDarkMode);

    // Initialize shortcuts system
    useEffect(() => {
        // Register default shortcuts
        const defaults = getDefaultShortcuts();
        for (const binding of defaults) {
            try {
                shortcutManager.register(binding);
            } catch (error) {
                console.error(`Failed to register shortcut ${binding.id}:`, error);
            }
        }

        // Initialize store with defaults
        useShortcutsStore.setState({ bindings: defaults });
    }, []);

    // Keyboard shortcuts
    useKeyboard();

    // Auto-import from clipboard if URL parameter present
    useAutoImport();

    // Sync darkMode with store
    useEffect(() => {
        setStoreDarkMode(darkMode);
    }, [darkMode, setStoreDarkMode]);

    // Dark mode toggle
    const toggleDarkMode = useCallback(() => {
        setDarkMode((prev) => {
            const next = !prev;
            localStorage.setItem('wb-canvas-dark-mode', String(next));
            return next;
        });
    }, []);

    // Apply dark mode class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Context menu handler
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
    }, []);

    // Close context menu
    const closeContextMenu = useCallback(() => {
        setContextMenuPos(null);
    }, []);

    return (
        <div className="h-screen w-screen overflow-hidden bg-canvas-bg" onContextMenu={handleContextMenu}>
            {/* Main Canvas Area - rendered first so canvas SVG is first in DOM for tests */}
            <main className="pt-14 h-full">
                <Canvas darkMode={darkMode} />
            </main>

            {/* Header - rendered after canvas but positioned on top via z-index */}
            <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />

            {/* Toolbar */}
            <Toolbar position="left" />

            {/* Style Panel (when elements selected) */}
            {selectedIds.length > 0 && <StylePanel />}

            {/* Zoom Controls */}
            <ZoomControls />

            {/* Context Menu */}
            <ContextMenu position={contextMenuPos} onClose={closeContextMenu} />
        </div>
    );
}
