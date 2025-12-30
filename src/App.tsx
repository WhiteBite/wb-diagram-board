/**
 * WB Diagram Board - Main Application
 *
 * Collaborative diagram board application using XY Flow
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { ReactFlowProvider, useReactFlow, useViewport } from '@xyflow/react';
import { XYFlowBoard } from './XYFlowBoard';
import { ShapeSidebar, ARROW_TYPES, type ArrowType } from './components/xyflow/ShapeSidebar';
import { Toolbar } from './components/xyflow/Toolbar';
import { useXYFlowStore } from './xyflow/store';
import { AutosaveIndicator, useAutosaveStatus } from './components/xyflow/AutosaveIndicator';
import { useTheme } from './hooks/useTheme';
import { useXYFlowPersistence } from './hooks/useXYFlowPersistence';
import './styles/globals.css';

// =============================================================================
// Lazy-loaded Panel Components (Code Splitting)
// =============================================================================

const ExportPanel = lazy(() => import('./components/xyflow/ExportPanel'));
const ImportPanel = lazy(() => import('./components/xyflow/ImportPanel'));
const SaveLoadPanel = lazy(() => import('./components/xyflow/SaveLoadPanel'));
const KeyboardShortcutsHelp = lazy(() =>
    import('./components/xyflow/KeyboardShortcutsHelp').then(module => ({
        default: module.KeyboardShortcutsHelp
    }))
);
const AutoLayoutPanel = lazy(() =>
    import('./components/xyflow/AutoLayoutPanel').then(module => ({
        default: module.AutoLayoutPanel
    }))
);
const XYFlowLayersPanel = lazy(() => import('./components/panels/XYFlowLayersPanel'));
const XYFlowHistoryPanel = lazy(() => import('./components/panels/XYFlowHistoryPanel'));
const ThemePanel = lazy(() => import('./components/panels/ThemePanel'));

// =============================================================================
// Loading Fallback Component
// =============================================================================

// =============================================================================
// Helper Components
// =============================================================================

const ToolbarButton = ({
    active,
    disabled,
    onClick,
    title,
    icon
}: {
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
    title: string;
    icon: React.ReactNode
}) => (
    <button
        className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${active
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 shadow-inner'
            : disabled
                ? 'opacity-30 cursor-not-allowed text-gray-400 dark:text-gray-600'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        onClick={disabled ? undefined : onClick}
        title={title}
        disabled={disabled}
    >
        {icon}
    </button>
);

const ZoomControls = () => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { zoom } = useViewport();

    return (
        <div className="flex items-center gap-1">
            <ToolbarButton
                onClick={() => zoomOut()}
                title="Zoom Out"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>}
            />
            <button
                className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-colors min-w-[3rem]"
                onClick={() => fitView({ padding: 0.2 })}
                title="Fit View"
            >
                {Math.round(zoom * 100)}%
            </button>
            <ToolbarButton
                onClick={() => zoomIn()}
                title="Zoom In"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
            />
        </div>
    );
};

const PanelLoadingFallback = () => (
    <div className="flex items-center justify-center p-4 text-gray-500 dark:text-gray-400">
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Loading...
    </div>
);

// =============================================================================
// Main App Component
// =============================================================================

export default function App() {
    // State for panels
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showExportPanel, setShowExportPanel] = useState(false);
    const [showImportPanel, setShowImportPanel] = useState(false);
    const [showSaveLoadPanel, setShowSaveLoadPanel] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const [showAutoLayoutPanel, setShowAutoLayoutPanel] = useState(false);
    // History actions from store
    const { clearAll } = useXYFlowStore(state => ({
        clearAll: state.clearAll
    }));

    useEffect(() => {
        const handleClearBoard = () => clearAll();
        window.addEventListener('wb-clear-board', handleClearBoard);
        return () => window.removeEventListener('wb-clear-board', handleClearBoard);
    }, [clearAll]);

    // Arrow type for new connections
    const [selectedArrowType, setSelectedArrowType] = useState<ArrowType>(ARROW_TYPES[0]);

    // Theme
    const { currentTheme } = useTheme();
    const darkMode = currentTheme.isDark;

    // Persistence with autosave
    const { isDirty, lastSaved, isAutoSaveEnabled } = useXYFlowPersistence({
        autoSave: true,
    });

    // Autosave status
    const autosaveStatus = useAutosaveStatus({
        isDirty,
        lastSaved,
        isSaving: false, // Could be enhanced with actual saving state
    });

    // Dark mode class
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Global keyboard shortcut for "?" to show shortcuts help
    const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return;
        }

        if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            setShowShortcutsHelp(true);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    return (
        <ReactFlowProvider>
            <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 relative flex">
                {/* Main Content - Full Screen */}
                <main className="flex-1 relative h-full w-full">
                    <XYFlowBoard
                        defaultArrowType={selectedArrowType}
                    />

                    {/* Left Sidebar - Shapes (Floating Overlay) */}
                    <div className="absolute left-4 top-4 bottom-4 z-20 pointer-events-none">
                        <div className="pointer-events-auto h-full flex flex-col">
                            <ShapeSidebar
                                isDark={darkMode}
                                selectedArrowType={selectedArrowType.id}
                                onArrowTypeChange={setSelectedArrowType}
                            />
                        </div>
                    </div>

                    {/* Layers Panel (Floating Overlay) */}
                    {showLayersPanel && (
                        <div className="absolute left-64 top-4 bottom-4 z-20 pointer-events-none">
                            <aside className="pointer-events-auto w-64 h-full shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden flex flex-col">
                                <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                                    <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">Layers</h3>
                                    <button
                                        onClick={() => setShowLayersPanel(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <Suspense fallback={<PanelLoadingFallback />}>
                                        <XYFlowLayersPanel isDark={darkMode} />
                                    </Suspense>
                                </div>
                            </aside>
                        </div>
                    )}

                    {/* Autosave Indicator */}
                    {isAutoSaveEnabled && (
                        <div className="absolute bottom-4 left-4 z-30">
                            <AutosaveIndicator
                                status={autosaveStatus}
                                lastSaved={lastSaved}
                                position="bottom-left"
                            />
                        </div>
                    )}

                    {/* Main Diagram Toolbar (Diagram tools) */}
                    <Toolbar
                        isDarkMode={darkMode}
                        onImport={() => setShowImportPanel(true)}
                        onExport={() => setShowExportPanel(true)}
                    />

                    {/* Top right panel toggles - Floating Toolbar */}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-30">
                        {/* Primary Actions Group */}
                        <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 items-center gap-1">
                            <ToolbarButton
                                active={showHistoryPanel}
                                onClick={() => {
                                    setShowHistoryPanel(!showHistoryPanel);
                                    setShowThemePanel(false);
                                }}
                                title="History (H)"
                                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                            />

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                            {/* View/Edit Group */}
                            <div className="flex items-center gap-1 px-1">
                                <ToolbarButton
                                    active={showLayersPanel}
                                    onClick={() => setShowLayersPanel(!showLayersPanel)}
                                    title="Layers (L)"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>}
                                />
                                <ToolbarButton
                                    active={showAutoLayoutPanel}
                                    onClick={() => setShowAutoLayoutPanel(!showAutoLayoutPanel)}
                                    title="Auto Layout"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
                                />
                                <ToolbarButton
                                    active={showThemePanel}
                                    onClick={() => {
                                        setShowThemePanel(!showThemePanel);
                                        setShowHistoryPanel(false);
                                    }}
                                    title="Theme Settings"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
                                />
                            </div>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                            {/* Save/Export Group */}
                            <div className="flex items-center gap-1 px-1">
                                <ToolbarButton
                                    onClick={() => setShowSaveLoadPanel(true)}
                                    title="Save/Load Diagram"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>}
                                />
                                <ToolbarButton
                                    onClick={() => setShowImportPanel(true)}
                                    title="Import JSON/Image"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>}
                                />
                                <ToolbarButton
                                    onClick={() => setShowExportPanel(true)}
                                    title="Export Image/PDF"
                                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                                />
                            </div>

                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

                            <ToolbarButton
                                onClick={() => setShowShortcutsHelp(true)}
                                title="Keyboard Shortcuts (?)"
                                icon={<span className="font-bold text-base">?</span>}
                            />
                        </div>
                    </div>

                    {/* Bottom Center Toolbar - Zoom & Actions */}
                    <div className="absolute bottom-6 left-6 z-30">
                        <div className="flex bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 items-center gap-2">
                            <ZoomControls />
                        </div>
                    </div>

                    {/* Right Panels (Floating Overlay) */}
                    {(showThemePanel || showHistoryPanel) && (
                        <div className="absolute right-4 top-20 bottom-20 z-20 pointer-events-none">
                            <aside className="pointer-events-auto w-80 h-full shadow-2xl rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-2">
                                        {showHistoryPanel ? (
                                            <svg className="text-indigo-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                        ) : (
                                            <svg className="text-indigo-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                                        )}
                                        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                                            {showHistoryPanel ? 'History' : 'Theme Settings'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowHistoryPanel(false);
                                            setShowThemePanel(false);
                                        }}
                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <Suspense fallback={<PanelLoadingFallback />}>
                                        {showHistoryPanel && (
                                            <XYFlowHistoryPanel
                                                isDark={darkMode}
                                                isVisible={showHistoryPanel}
                                                onVisibilityChange={setShowHistoryPanel}
                                            />
                                        )}
                                        {showThemePanel && (
                                            <ThemePanel
                                                isOpen={showThemePanel}
                                                onClose={() => setShowThemePanel(false)}
                                            />
                                        )}
                                    </Suspense>
                                </div>
                            </aside>
                        </div>
                    )}
                </main>

                {/* Remove redundant sidebars */}

                {/* Export Panel Dropdown */}
                {showExportPanel && (
                    <div className="fixed inset-0 z-50" onClick={() => setShowExportPanel(false)}>
                        <div
                            className="absolute left-20 top-1/2 -translate-y-1/2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Suspense fallback={<PanelLoadingFallback />}>
                                <ExportPanel
                                    isOpen={showExportPanel}
                                    onClose={() => setShowExportPanel(false)}
                                    isDarkMode={darkMode}
                                />
                            </Suspense>
                        </div>
                    </div>
                )}

                {/* Import Panel Dropdown */}
                {showImportPanel && (
                    <div className="fixed inset-0 z-50" onClick={() => setShowImportPanel(false)}>
                        <div
                            className="absolute left-20 top-1/2 -translate-y-1/2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Suspense fallback={<PanelLoadingFallback />}>
                                <ImportPanel
                                    isOpen={showImportPanel}
                                    onClose={() => setShowImportPanel(false)}
                                    isDarkMode={darkMode}
                                />
                            </Suspense>
                        </div>
                    </div>
                )}

                {/* Save/Load Panel Modal */}
                {showSaveLoadPanel && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <Suspense fallback={<PanelLoadingFallback />}>
                            <SaveLoadPanel
                                isOpen={showSaveLoadPanel}
                                onClose={() => setShowSaveLoadPanel(false)}
                            />
                        </Suspense>
                    </div>
                )}

                {/* Keyboard Shortcuts Help Modal */}
                {showShortcutsHelp && (
                    <Suspense fallback={null}>
                        <KeyboardShortcutsHelp
                            isOpen={showShortcutsHelp}
                            onClose={() => setShowShortcutsHelp(false)}
                            isDarkMode={darkMode}
                        />
                    </Suspense>
                )}

                {/* Auto Layout Panel */}
                {showAutoLayoutPanel && (
                    <div className="fixed inset-0 z-50" onClick={() => setShowAutoLayoutPanel(false)}>
                        <div
                            className="absolute right-4 top-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Suspense fallback={<PanelLoadingFallback />}>
                                <AutoLayoutPanel
                                    isDark={darkMode}
                                    onClose={() => setShowAutoLayoutPanel(false)}
                                />
                            </Suspense>
                        </div>
                    </div>
                )}
            </div>
        </ReactFlowProvider>
    );
}
