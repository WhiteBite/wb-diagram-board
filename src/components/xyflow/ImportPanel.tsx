/**
 * ImportPanel - Import panel for XY Flow diagrams
 * 
 * Provides import options for various diagram formats:
 * - JSON (nodes + edges)
 * - Mermaid (via IR conversion)
 * - PlantUML (via IR conversion)
 * - DOT/Graphviz (via IR conversion)
 * - From file (auto-detect format)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
    parseMermaid,
    parsePlantUML,
    parseDot,
} from '@whitebite/diagram-converter';
import type { Diagram } from '@whitebite/diagram-converter';
import { irToXYFlow } from '../../adapters';
import type { DiagramNode, DiagramEdge } from '../../xyflow/types';
import type { DiagramJson } from '../../utils/xyflow-export';
import styles from './ImportPanel.module.css';

// =============================================================================
// Types
// =============================================================================

export type ImportFormat = 'json' | 'mermaid' | 'plantuml' | 'dot' | 'file';
export type ImportMode = 'replace' | 'merge';

interface ImportOption {
    id: ImportFormat;
    label: string;
    icon: string;
    shortcut?: string;
    description: string;
}

export interface ImportPanelProps {
    /** Whether the panel is open */
    isOpen: boolean;
    /** Callback when panel should close */
    onClose: () => void;
    /** Callback after successful import */
    onImport?: (format: ImportFormat, nodesCount: number) => void;
    /** Dark mode */
    isDarkMode?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const IMPORT_OPTIONS: ImportOption[] = [
    { id: 'json', label: 'JSON Data', icon: '📄', shortcut: 'J', description: 'Import from JSON file' },
    { id: 'mermaid', label: 'Mermaid', icon: '📊', shortcut: 'M', description: 'Import Mermaid diagram code' },
    { id: 'plantuml', label: 'PlantUML', icon: '🌱', shortcut: 'P', description: 'Import PlantUML code' },
    { id: 'dot', label: 'DOT/Graphviz', icon: '🔗', shortcut: 'D', description: 'Import DOT/Graphviz code' },
    { id: 'file', label: 'From File', icon: '📁', shortcut: 'F', description: 'Import from file (auto-detect)' },
];

const PLACEHOLDER_EXAMPLES: Record<Exclude<ImportFormat, 'file' | 'json'>, string> = {
    mermaid: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    plantuml: `@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi there
Alice -> Bob: How are you?
@enduml`,
    dot: `digraph G {
    A -> B
    B -> C
    C -> D
    D -> A
}`,
};

const ACCEPTED_FILE_EXTENSIONS = '.json,.mmd,.mermaid,.puml,.plantuml,.dot,.gv';

// =============================================================================
// Import Modal Component
// =============================================================================

interface ImportModalProps {
    format: Exclude<ImportFormat, 'file'>;
    onClose: () => void;
    onImport: (code: string, mode: ImportMode) => void;
    isImporting: boolean;
    isDarkMode: boolean;
}

function ImportModal({ format, onClose, onImport, isImporting, isDarkMode }: ImportModalProps) {
    const [code, setCode] = useState('');
    const [importMode, setImportMode] = useState<ImportMode>('replace');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
            // Ctrl+Enter to import
            if (e.ctrlKey && e.key === 'Enter' && code.trim()) {
                onImport(code, importMode);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onImport, code, importMode]);

    const formatLabel = IMPORT_OPTIONS.find(o => o.id === format)?.label ?? format;
    const placeholder = format !== 'json' ? PLACEHOLDER_EXAMPLES[format] : '{\n  "nodes": [],\n  "edges": []\n}';

    const modalClasses = [
        styles.modal,
        isDarkMode && styles.dark,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={[styles.modalOverlay, isDarkMode && styles.dark].filter(Boolean).join(' ')}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
        >
            <div className={modalClasses} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 id="import-modal-title" className={styles.modalTitle}>
                        Import {formatLabel}
                    </h3>
                    <button
                        onClick={onClose}
                        className={styles.modalCloseButton}
                        title="Close (Escape)"
                        aria-label="Close dialog"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder={placeholder}
                        className={styles.textarea}
                        spellCheck={false}
                        aria-label={`${formatLabel} code input`}
                    />

                    <div className={styles.importOptions}>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                name="importMode"
                                value="replace"
                                checked={importMode === 'replace'}
                                onChange={() => setImportMode('replace')}
                            />
                            Replace existing
                        </label>
                        <label className={styles.radioLabel}>
                            <input
                                type="radio"
                                name="importMode"
                                value="merge"
                                checked={importMode === 'merge'}
                                onChange={() => setImportMode('merge')}
                            />
                            Merge with existing
                        </label>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <span className={styles.hint}>
                        Ctrl+Enter to import • Escape to cancel
                    </span>
                    <div className={styles.buttons}>
                        <button onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button
                            onClick={() => onImport(code, importMode)}
                            disabled={!code.trim() || isImporting}
                            className={styles.importButton}
                        >
                            {isImporting ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Main ImportPanel Component
// =============================================================================

export function ImportPanel({
    isOpen,
    onClose,
    onImport,
    isDarkMode = false,
}: ImportPanelProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [modalFormat, setModalFormat] = useState<Exclude<ImportFormat, 'file'> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const firstItemRef = useRef<HTMLButtonElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get ReactFlow instance
    const reactFlowInstance = useReactFlow();

    // Parse diagram code based on format
    const parseDiagram = useCallback((code: string, format: Exclude<ImportFormat, 'file'>): { nodes: DiagramNode[]; edges: DiagramEdge[] } | null => {
        if (format === 'json') {
            try {
                const data = JSON.parse(code) as DiagramJson;
                return {
                    nodes: data.nodes ?? [],
                    edges: data.edges ?? [],
                };
            } catch {
                throw new Error('Invalid JSON format');
            }
        }

        // Parse to IR first
        let diagram: Diagram;
        switch (format) {
            case 'mermaid':
                diagram = parseMermaid(code);
                break;
            case 'plantuml':
                diagram = parsePlantUML(code);
                break;
            case 'dot':
                diagram = parseDot(code);
                break;
            default:
                throw new Error(`Unknown format: ${format}`);
        }

        // Convert IR to XY Flow
        const { nodes, edges, warnings } = irToXYFlow(diagram);

        if (warnings.length > 0) {
            console.warn('[ImportPanel] Conversion warnings:', warnings);
        }

        return { nodes, edges };
    }, []);

    // Import diagram to editor
    const importDiagram = useCallback((
        nodes: DiagramNode[],
        edges: DiagramEdge[],
        mode: ImportMode,
        format: ImportFormat
    ) => {
        if (nodes.length === 0) {
            window.alert('No elements found in the diagram. Check your syntax.');
            return;
        }

        if (mode === 'replace') {
            // Replace all nodes and edges
            reactFlowInstance.setNodes(nodes);
            reactFlowInstance.setEdges(edges);
        } else {
            // Merge with existing
            const existingNodes = reactFlowInstance.getNodes();
            const existingEdges = reactFlowInstance.getEdges();

            // Offset new nodes to avoid overlap
            const offsetX = existingNodes.length > 0
                ? Math.max(...existingNodes.map(n => n.position.x)) + 200
                : 0;

            const offsetNodes = nodes.map(node => ({
                ...node,
                id: `imported-${node.id}`,
                position: {
                    x: node.position.x + offsetX,
                    y: node.position.y,
                },
            }));

            const offsetEdges = edges.map(edge => ({
                ...edge,
                id: `imported-${edge.id}`,
                source: `imported-${edge.source}`,
                target: `imported-${edge.target}`,
            }));

            reactFlowInstance.setNodes([...existingNodes, ...offsetNodes]);
            reactFlowInstance.setEdges([...existingEdges, ...offsetEdges]);
        }

        // Fit view to show all nodes
        setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 });
        }, 50);

        console.log(`[ImportPanel] Imported ${nodes.length} nodes from ${format}`);
        onImport?.(format, nodes.length);
    }, [reactFlowInstance, onImport]);

    // Handle text import from modal
    const handleTextImport = useCallback((code: string, mode: ImportMode) => {
        if (!modalFormat || !code.trim()) return;

        setIsImporting(true);

        try {
            const result = parseDiagram(code, modalFormat);
            if (result) {
                importDiagram(result.nodes, result.edges, mode, modalFormat);
            }
            setModalFormat(null);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            window.alert(`Failed to parse ${modalFormat} diagram:\n\n${message}`);
            console.error('[ImportPanel] Parse error:', error);
        } finally {
            setIsImporting(false);
        }
    }, [modalFormat, parseDiagram, importDiagram]);

    // Detect format from file content
    const detectFormat = useCallback((content: string, extension: string): Exclude<ImportFormat, 'file'> => {
        // Check by extension first
        if (extension === 'json') return 'json';
        if (extension === 'mmd' || extension === 'mermaid') return 'mermaid';
        if (extension === 'puml' || extension === 'plantuml') return 'plantuml';
        if (extension === 'dot' || extension === 'gv') return 'dot';

        // Auto-detect by content
        try {
            JSON.parse(content);
            return 'json';
        } catch {
            // Not JSON
        }

        if (content.includes('graph ') || content.includes('flowchart ') || content.includes('sequenceDiagram')) {
            return 'mermaid';
        }
        if (content.includes('@startuml') || content.includes('@startmindmap')) {
            return 'plantuml';
        }
        if (content.includes('digraph') || content.includes('graph {')) {
            return 'dot';
        }

        // Default to mermaid
        return 'mermaid';
    }, []);

    // Handle file import
    const handleFileImport = useCallback(async (file: File) => {
        setIsImporting(true);

        try {
            const content = await file.text();
            const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
            const format = detectFormat(content, extension);

            const result = parseDiagram(content, format);
            if (result) {
                importDiagram(result.nodes, result.edges, 'replace', format);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            window.alert(`Failed to import file:\n\n${message}`);
            console.error('[ImportPanel] File import error:', error);
        } finally {
            setIsImporting(false);
            onClose();
        }
    }, [detectFormat, parseDiagram, importDiagram, onClose]);

    // Handle file input change
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileImport(file);
        }
        // Reset input
        e.target.value = '';
    }, [handleFileImport]);

    // Handle option click
    const handleOptionClick = useCallback((format: ImportFormat) => {
        onClose();

        if (format === 'file') {
            fileInputRef.current?.click();
        } else {
            setModalFormat(format);
        }
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape to close
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }

            // Handle format shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                const option = IMPORT_OPTIONS.find(
                    opt => opt.shortcut?.toLowerCase() === e.key.toLowerCase()
                );
                if (option) {
                    e.preventDefault();
                    handleOptionClick(option.id);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleOptionClick, onClose]);

    // Focus first item when opened
    useEffect(() => {
        if (isOpen && firstItemRef.current) {
            firstItemRef.current.focus();
        }
    }, [isOpen]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const containerClasses = [
        styles.dropdown,
        isDarkMode && styles.dark,
    ].filter(Boolean).join(' ');

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                aria-hidden="true"
            />

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={containerClasses}
                    role="menu"
                    aria-label="Import options"
                >
                    <div className={styles.dropdownHeader}>Import From</div>

                    {IMPORT_OPTIONS.map((option, index) => (
                        <button
                            key={option.id}
                            ref={index === 0 ? firstItemRef : undefined}
                            onClick={() => handleOptionClick(option.id)}
                            className={styles.dropdownItem}
                            disabled={isImporting}
                            role="menuitem"
                            title={option.description}
                            aria-label={`${option.label}${option.shortcut ? ` (${option.shortcut})` : ''}`}
                        >
                            <span className={styles.optionIcon} aria-hidden="true">
                                {option.icon}
                            </span>
                            <span className={styles.optionLabel}>{option.label}</span>
                            {option.shortcut && (
                                <span className={styles.optionShortcut} aria-hidden="true">
                                    {option.shortcut}
                                </span>
                            )}
                        </button>
                    ))}

                    {isImporting && (
                        <div className={styles.importing} aria-live="polite">
                            <span className={styles.spinner} aria-hidden="true" />
                            <span>Importing...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Import Modal */}
            {modalFormat && (
                <ImportModal
                    format={modalFormat}
                    onClose={() => setModalFormat(null)}
                    onImport={handleTextImport}
                    isImporting={isImporting}
                    isDarkMode={isDarkMode}
                />
            )}
        </>
    );
}

// =============================================================================
// Import Button Component (for toolbar integration)
// =============================================================================

export interface ImportButtonProps {
    /** Callback after successful import */
    onImport?: (format: ImportFormat, nodesCount: number) => void;
    /** Dark mode */
    isDarkMode?: boolean;
}

export function ImportButton({ onImport, isDarkMode = false }: ImportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Keyboard shortcut (Ctrl+Shift+I)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const buttonClasses = [
        styles.button,
        isOpen && styles.buttonActive,
        isDarkMode && styles.dark,
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.container}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClasses}
                title="Import (Ctrl+Shift+I)"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <span className={styles.buttonIcon} aria-hidden="true">📥</span>
                <span className={styles.buttonLabel}>Import</span>
                <span className={styles.buttonShortcut} aria-hidden="true">⌃⇧I</span>
            </button>

            <ImportPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onImport={onImport}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}

export default ImportPanel;
