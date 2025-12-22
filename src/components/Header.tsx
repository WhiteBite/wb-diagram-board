/**
 * WB Canvas - Header Component
 * 
 * Top header with logo, file actions, and settings
 */

import { memo, useState } from 'react';
import {
    Menu,
    Download,
    Upload,
    FileJson,
    Image,
    Sun,
    Moon,
    HelpCircle,
    Github,
    Pencil,
    Square,
} from 'lucide-react';
import { useCanvasStore } from '../store/canvas-store';

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

export const Header = memo(function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const exportToJSON = useCanvasStore((s) => s.exportToJSON);
    const importFromJSON = useCanvasStore((s) => s.importFromJSON);
    const clear = useCanvasStore((s) => s.clear);
    const roughStyle = useCanvasStore((s) => s.roughStyle);
    const toggleRoughStyle = useCanvasStore((s) => s.toggleRoughStyle);

    const handleExportJSON = () => {
        const json = exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'canvas.json';
        a.click();
        URL.revokeObjectURL(url);
        setMenuOpen(false);
    };

    const handleImportJSON = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const text = await file.text();
                importFromJSON(text);
            }
        };
        input.click();
        setMenuOpen(false);
    };

    const handleExportPNG = async () => {
        // TODO: Implement PNG export
        alert('PNG export coming soon!');
        setMenuOpen(false);
    };

    const handleNew = () => {
        if (confirm('Clear canvas? This cannot be undone.')) {
            clear();
        }
        setMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 z-50 flex items-center px-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">WB</span>
                </div>
                <div>
                    <h1 className="font-semibold text-gray-900 dark:text-white text-sm">
                        WB Canvas
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Collaborative Whiteboard
                    </p>
                </div>
            </div>

            {/* Menu */}
            <div className="relative ml-6">
                <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <Menu size={16} />
                    Menu
                </button>

                {menuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-slide-in">
                        <button
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleNew}
                        >
                            <FileJson size={16} />
                            New Canvas
                        </button>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                        <button
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleImportJSON}
                        >
                            <Upload size={16} />
                            Import JSON
                        </button>
                        <button
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleExportJSON}
                        >
                            <Download size={16} />
                            Export JSON
                        </button>
                        <button
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleExportPNG}
                        >
                            <Image size={16} />
                            Export PNG
                        </button>
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
                <button
                    className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${roughStyle ? 'text-indigo-500' : 'text-gray-600 dark:text-gray-300'}`}
                    onClick={toggleRoughStyle}
                    title={roughStyle ? 'Switch to clean style' : 'Switch to hand-drawn style'}
                >
                    {roughStyle ? <Pencil size={20} /> : <Square size={20} />}
                </button>

                <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    onClick={onToggleDarkMode}
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    title="Help"
                >
                    <HelpCircle size={20} />
                </button>

                <a
                    href="https://github.com/whitebite/wb-diagrams"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    title="GitHub"
                >
                    <Github size={20} />
                </a>
            </div>
        </header>
    );
});
