/**
 * WB Canvas - Shortcuts Panel
 * 
 * UI panel for managing keyboard shortcuts
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { KeyBinding, ShortcutCategory } from '../../types/shortcuts';
import { useShortcutsStore, selectBindings, selectConflicts } from '../../store/shortcuts-store';
import { shortcutManager } from '../../core/shortcuts/shortcut-manager';

/**
 * Props for ShortcutsPanel
 */
interface ShortcutsPanelProps {
    /** Whether panel is open */
    readonly isOpen: boolean;

    /** Callback when panel should close */
    readonly onClose: () => void;
}

/**
 * ShortcutsPanel - UI for managing keyboard shortcuts
 * 
 * Features:
 * - View all shortcuts organized by category
 * - Search and filter shortcuts
 * - Edit shortcuts
 * - Detect conflicts
 * - Reset to defaults
 * - Export/import configuration
 */
export const ShortcutsPanel = memo(function ShortcutsPanel({
    isOpen,
    onClose,
}: ShortcutsPanelProps) {
    const bindings = useShortcutsStore(selectBindings);
    const conflicts = useShortcutsStore(selectConflicts);
    const registerBinding = useShortcutsStore((s) => s.registerBinding);
    const resetToDefaults = useShortcutsStore((s) => s.resetToDefaults);
    const exportConfig = useShortcutsStore((s) => s.exportConfig);
    const importConfig = useShortcutsStore((s) => s.importConfig);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter bindings
    const filteredBindings = useMemo(() => {
        let filtered = bindings;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter((b) => b.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.name.toLowerCase().includes(query) ||
                    b.description.toLowerCase().includes(query) ||
                    b.id.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [bindings, selectedCategory, searchQuery]);

    // Get categories
    const categories = useMemo(() => {
        const cats = new Set<ShortcutCategory>();
        bindings.forEach((b) => cats.add(b.category));
        return Array.from(cats).sort();
    }, [bindings]);

    // Handle export
    const handleExport = useCallback(() => {
        const json = exportConfig();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shortcuts-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }, [exportConfig]);

    // Handle import
    const handleImport = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = event.target?.result as string;
                    importConfig(json);
                } catch (error) {
                    console.error('Failed to import shortcuts:', error);
                    alert('Failed to import shortcuts configuration');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, [importConfig]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search shortcuts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />

                    {/* Category filter */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${selectedCategory === 'all'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${selectedCategory === cat
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Conflicts warning */}
                    {conflicts.length > 0 && (
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                ⚠️ {conflicts.length} shortcut conflict{conflicts.length !== 1 ? 's' : ''} detected
                            </p>
                        </div>
                    )}
                </div>

                {/* Shortcuts list */}
                <div className="flex-1 overflow-y-auto p-4">
                    {filteredBindings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No shortcuts found
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredBindings.map((binding) => (
                                <ShortcutItem
                                    key={binding.id}
                                    binding={binding}
                                    isEditing={editingId === binding.id}
                                    onEdit={() => setEditingId(binding.id)}
                                    onSave={(updated) => {
                                        registerBinding(updated);
                                        setEditingId(null);
                                    }}
                                    onCancel={() => setEditingId(null)}
                                    hasConflict={conflicts.some(
                                        (c) =>
                                            c.binding1.id === binding.id ||
                                            c.binding2.id === binding.id
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <button
                            onClick={handleExport}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                        >
                            Export
                        </button>
                        <button
                            onClick={handleImport}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                        >
                            Import
                        </button>
                        <button
                            onClick={resetToDefaults}
                            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                        >
                            Reset to Defaults
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
});

/**
 * Props for ShortcutItem
 */
interface ShortcutItemProps {
    readonly binding: KeyBinding;
    readonly isEditing: boolean;
    readonly onEdit: () => void;
    readonly onSave: (binding: KeyBinding) => void;
    readonly onCancel: () => void;
    readonly hasConflict: boolean;
}

/**
 * ShortcutItem - Individual shortcut row
 */
const ShortcutItem = memo(function ShortcutItem({
    binding,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    hasConflict,
}: ShortcutItemProps) {
    const [tempBinding, setTempBinding] = useState(binding);
    const keyString = shortcutManager.getKeyString(binding);

    const handleSave = useCallback(() => {
        onSave(tempBinding);
    }, [tempBinding, onSave]);

    if (isEditing) {
        return (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="space-y-2">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name
                        </label>
                        <input
                            type="text"
                            value={tempBinding.name}
                            onChange={(e) =>
                                setTempBinding({ ...tempBinding, name: e.target.value })
                            }
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                        </label>
                        <input
                            type="text"
                            value={tempBinding.description}
                            onChange={(e) =>
                                setTempBinding({ ...tempBinding, description: e.target.value })
                            }
                            className="w-full mt-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-medium transition-colors"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`p-3 border rounded-md transition-colors ${hasConflict
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                            {binding.name}
                        </h3>
                        {hasConflict && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                                Conflict
                            </span>
                        )}
                        {!binding.enabled && (
                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                                Disabled
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {binding.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono rounded">
                            {keyString}
                        </code>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {binding.category}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                    Edit
                </button>
            </div>
        </div>
    );
});
