/**
 * ExportPanel - Enhanced export panel for XY Flow diagrams with preview
 *
 * Features:
 * - Mini preview of diagram with export bounds
 * - Export scope: All / Selection / Visible
 * - Format selection: PNG, SVG, JSON
 * - Quality settings for PNG (1x, 2x, 3x)
 * - Padding control
 * - Transparent background option
 * - Copy to clipboard for PNG
 * - Estimated file size
 * - Progress indicator for large exports
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
    generateMermaid,
    generatePlantUML,
    generateDrawio,
} from '@whitebite/diagram-converter';
import { xyflowToIR } from '../../adapters';
import {
    exportToPng,
    exportToSvg,
    exportToPdf,
    exportToJson,
    exportToMermaid,
    exportToPlantUML,
    exportToDrawio,
    getTimestampedFilename,
} from '../../utils/xyflow-export';
import type { PdfPageSize, PdfOrientation } from '../../utils/xyflow-export';
import type { DiagramNode, DiagramEdge } from '../../xyflow/types';
import styles from './ExportPanel.module.css';

// =============================================================================
// Types
// =============================================================================

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'mermaid' | 'plantuml' | 'drawio';
export type ExportScope = 'all' | 'selection' | 'visible';
export type ExportScale = 1 | 2 | 3;

interface FormatOption {
    id: ExportFormat;
    label: string;
    icon: string;
}

interface ExportSettings {
    format: ExportFormat;
    scope: ExportScope;
    scale: ExportScale;
    padding: number;
    transparentBg: boolean;
    pdfPageSize: PdfPageSize;
    pdfOrientation: PdfOrientation;
}

export interface ExportPanelProps {
    isOpen: boolean;
    onClose: () => void;
    nodes?: DiagramNode[];
    edges?: DiagramEdge[];
    onExport?: (format: ExportFormat) => void;
    isDarkMode?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const FORMAT_OPTIONS: FormatOption[] = [
    { id: 'png', label: 'PNG', icon: '🖼️' },
    { id: 'svg', label: 'SVG', icon: '📐' },
    { id: 'pdf', label: 'PDF', icon: '📑' },
    { id: 'json', label: 'JSON', icon: '📄' },
];

const SCALE_OPTIONS: ExportScale[] = [1, 2, 3];

const DEFAULT_SETTINGS: ExportSettings = {
    format: 'png',
    scope: 'all',
    scale: 2,
    padding: 20,
    transparentBg: false,
    pdfPageSize: 'a4',
    pdfOrientation: 'landscape',
};

const PREVIEW_HEIGHT = 160;
const PREVIEW_PADDING = 16;

// =============================================================================
// Helper Functions
// =============================================================================

interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}

/**
 * Calculate bounding box for nodes
 */
function calculateBounds(nodes: DiagramNode[]): Bounds | null {
    if (nodes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
        const width = node.measured?.width ?? node.width ?? 150;
        const height = node.measured?.height ?? node.height ?? 60;

        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + width);
        maxY = Math.max(maxY, node.position.y + height);
    }

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Estimate file size based on dimensions and format
 */
function estimateFileSize(
    width: number,
    height: number,
    format: ExportFormat,
    scale: number
): string {
    if (format === 'json') {
        return '< 10 KB';
    }

    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    if (format === 'svg') {
        // SVG size is roughly proportional to complexity, estimate ~1KB per 100 nodes
        const estimatedKB = Math.max(5, Math.round((scaledWidth * scaledHeight) / 50000));
        return `~${estimatedKB} KB`;
    }

    // PNG: roughly 4 bytes per pixel (RGBA), with compression ~30%
    const pixels = scaledWidth * scaledHeight;
    const estimatedBytes = pixels * 4 * 0.3;

    if (estimatedBytes < 1024) {
        return `~${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
        return `~${Math.round(estimatedBytes / 1024)} KB`;
    } else {
        return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

// =============================================================================
// Preview Component
// =============================================================================

interface PreviewProps {
    nodes: DiagramNode[];
    bounds: Bounds | null;
}

function Preview({ nodes, bounds }: PreviewProps) {
    if (!bounds || nodes.length === 0) {
        return (
            <div className={styles.previewEmpty}>
                <span className={styles.previewEmptyIcon}>📊</span>
                <span>No shapes to preview</span>
            </div>
        );
    }

    // Calculate scale to fit preview
    const availableWidth = 320 - PREVIEW_PADDING * 2;
    const availableHeight = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;

    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1);

    const scaledWidth = bounds.width * scale;
    const scaledHeight = bounds.height * scale;
    const offsetX = (availableWidth - scaledWidth) / 2 + PREVIEW_PADDING;
    const offsetY = (availableHeight - scaledHeight) / 2 + PREVIEW_PADDING;

    return (
        <div className={styles.previewMinimap}>
            {/* Render nodes */}
            {nodes.map((node) => {
                const width = (node.measured?.width ?? node.width ?? 150) * scale;
                const height = (node.measured?.height ?? node.height ?? 60) * scale;
                const x = (node.position.x - bounds.minX) * scale + offsetX;
                const y = (node.position.y - bounds.minY) * scale + offsetY;
                const isSelected = node.selected;

                return (
                    <div
                        key={node.id}
                        className={`${styles.previewNode} ${isSelected ? styles.previewNodeSelected : ''}`}
                        style={{
                            left: x,
                            top: y,
                            width,
                            height,
                        }}
                    />
                );
            })}

            {/* Export bounds indicator */}
            <div
                className={styles.previewBounds}
                style={{
                    left: offsetX - 2,
                    top: offsetY - 2,
                    width: scaledWidth + 4,
                    height: scaledHeight + 4,
                }}
            />

            {/* Size info */}
            <div className={styles.previewInfo}>
                {Math.round(bounds.width)} × {Math.round(bounds.height)}
            </div>
        </div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function ExportPanel({
    isOpen,
    onClose,
    nodes: propNodes,
    edges: propEdges,
    onExport,
    isDarkMode = false,
}: ExportPanelProps) {
    const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
    const [isExporting, setIsExporting] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const reactFlowInstance = useReactFlow();

    // Get nodes and edges
    const allNodes = useMemo(() => {
        return propNodes ?? (reactFlowInstance.getNodes() as DiagramNode[]);
    }, [propNodes, reactFlowInstance]);

    const allEdges = useMemo(() => {
        return propEdges ?? (reactFlowInstance.getEdges() as DiagramEdge[]);
    }, [propEdges, reactFlowInstance]);

    // Filter nodes based on scope
    const exportNodes = useMemo(() => {
        switch (settings.scope) {
            case 'selection':
                return allNodes.filter((n) => n.selected);
            case 'visible':
                // For visible, we'd need viewport bounds - simplified to all for now
                return allNodes;
            default:
                return allNodes;
        }
    }, [allNodes, settings.scope]);

    // Filter edges that connect export nodes
    const exportEdges = useMemo(() => {
        const nodeIds = new Set(exportNodes.map((n) => n.id));
        return allEdges.filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );
    }, [allEdges, exportNodes]);

    // Calculate bounds
    const bounds = useMemo(() => calculateBounds(exportNodes), [exportNodes]);

    // Selection count
    const selectedCount = useMemo(
        () => allNodes.filter((n) => n.selected).length,
        [allNodes]
    );

    // Estimated size
    const estimatedSize = useMemo(() => {
        if (!bounds) return '0 KB';
        return estimateFileSize(
            bounds.width + settings.padding * 2,
            bounds.height + settings.padding * 2,
            settings.format,
            settings.scale
        );
    }, [bounds, settings.format, settings.scale, settings.padding]);

    // Update setting helper
    const updateSetting = useCallback(
        <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
            setSettings((prev) => ({ ...prev, [key]: value }));
        },
        []
    );

    // Handle export
    const handleExport = useCallback(async () => {
        if (isExporting || exportNodes.length === 0) return;

        setIsExporting(true);

        try {
            const timestamp = getTimestampedFilename('diagram', '');
            const bgColor = settings.transparentBg ? 'transparent' : '#ffffff';

            switch (settings.format) {
                case 'png': {
                    const flowElement = document.querySelector('.react-flow') as HTMLElement;
                    if (!flowElement) throw new Error('Could not find ReactFlow element');

                    const result = await exportToPng(flowElement, `diagram-${timestamp}png`, {
                        backgroundColor: bgColor,
                        scale: settings.scale,
                        padding: settings.padding,
                    });
                    if (!result.success) throw new Error(result.error);
                    break;
                }

                case 'svg': {
                    const flowElement = document.querySelector('.react-flow') as HTMLElement;
                    if (!flowElement) throw new Error('Could not find ReactFlow element');

                    const result = await exportToSvg(flowElement, `diagram-${timestamp}svg`, {
                        backgroundColor: bgColor,
                        padding: settings.padding,
                    });
                    if (!result.success) throw new Error(result.error);
                    break;
                }

                case 'pdf': {
                    const flowElement = document.querySelector('.react-flow') as HTMLElement;
                    if (!flowElement) throw new Error('Could not find ReactFlow element');

                    const result = await exportToPdf(flowElement, `diagram-${timestamp}pdf`, {
                        backgroundColor: bgColor,
                        scale: settings.scale,
                        padding: settings.padding,
                        pageSize: settings.pdfPageSize,
                        orientation: settings.pdfOrientation,
                    });
                    if (!result.success) throw new Error(result.error);
                    break;
                }

                case 'json': {
                    const result = exportToJson(exportNodes, exportEdges, `diagram-${timestamp}json`);
                    if (!result.success) throw new Error(result.error);
                    break;
                }

                case 'mermaid':
                case 'plantuml':
                case 'drawio': {
                    const { diagram, warnings } = xyflowToIR(exportNodes, exportEdges);
                    if (warnings.length > 0) {
                        console.warn('[ExportPanel] Conversion warnings:', warnings);
                    }

                    let result;
                    switch (settings.format) {
                        case 'mermaid': {
                            const code = generateMermaid(diagram);
                            result = exportToMermaid(code, `diagram-${timestamp}mmd`);
                            break;
                        }
                        case 'plantuml': {
                            const code = generatePlantUML(diagram);
                            result = exportToPlantUML(code, `diagram-${timestamp}puml`);
                            break;
                        }
                        case 'drawio': {
                            const xml = generateDrawio(diagram);
                            result = exportToDrawio(xml, `diagram-${timestamp}drawio`);
                            break;
                        }
                    }
                    if (!result?.success) throw new Error(result?.error ?? 'Export failed');
                    break;
                }
            }

            onExport?.(settings.format);
            onClose();
        } catch (error) {
            console.error('[ExportPanel] Export failed:', error);
            window.alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, exportNodes, exportEdges, settings, onExport, onClose]);

    // Handle copy to clipboard
    const handleCopyToClipboard = useCallback(async () => {
        if (settings.format !== 'png' || exportNodes.length === 0) return;

        setIsExporting(true);

        try {
            const flowElement = document.querySelector('.react-flow') as HTMLElement;
            if (!flowElement) throw new Error('Could not find ReactFlow element');

            const viewport = flowElement.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewport) throw new Error('Could not find ReactFlow viewport');

            const { toPng } = await import('html-to-image');
            const bgColor = settings.transparentBg ? 'transparent' : '#ffffff';

            const dataUrl = await toPng(viewport, {
                backgroundColor: bgColor,
                pixelRatio: settings.scale,
                filter: (node) => {
                    const className = node.className?.toString() ?? '';
                    return !(
                        className.includes('react-flow__controls') ||
                        className.includes('react-flow__minimap') ||
                        className.includes('react-flow__attribution') ||
                        className.includes('react-flow__background')
                    );
                },
            });

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }),
            ]);

            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('[ExportPanel] Copy failed:', error);
            window.alert(`Copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    }, [settings.format, settings.scale, settings.transparentBg, exportNodes.length]);

    // Keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                handleExport();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, handleExport]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
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

    if (!isOpen) return null;

    const panelClasses = [styles.panel, isDarkMode && styles.dark].filter(Boolean).join(' ');

    return (
        <div ref={panelRef} className={panelClasses} role="dialog" aria-label="Export diagram">
            {/* Progress overlay */}
            {isExporting && (
                <div className={styles.progressOverlay}>
                    <div className={styles.progressSpinner} />
                    <span className={styles.progressText}>Exporting...</span>
                </div>
            )}

            {/* Header */}
            <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Export Diagram</span>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            <div className={styles.panelBody}>
                {/* Preview */}
                <div className={styles.previewSection}>
                    <span className={styles.previewLabel}>Preview</span>
                    <div className={styles.previewContainer}>
                        <Preview
                            nodes={exportNodes}
                            bounds={bounds}
                        />
                    </div>
                </div>

                {/* Export Scope */}
                <div className={styles.scopeSection}>
                    <span className={styles.scopeLabel}>Export</span>
                    <div className={styles.scopeButtons}>
                        <button
                            className={`${styles.scopeButton} ${settings.scope === 'all' ? styles.scopeButtonActive : ''}`}
                            onClick={() => updateSetting('scope', 'all')}
                        >
                            All ({allNodes.length})
                        </button>
                        <button
                            className={`${styles.scopeButton} ${settings.scope === 'selection' ? styles.scopeButtonActive : ''}`}
                            onClick={() => updateSetting('scope', 'selection')}
                            disabled={selectedCount === 0}
                        >
                            Selection ({selectedCount})
                        </button>
                        <button
                            className={`${styles.scopeButton} ${settings.scope === 'visible' ? styles.scopeButtonActive : ''}`}
                            onClick={() => updateSetting('scope', 'visible')}
                        >
                            Visible
                        </button>
                    </div>
                </div>

                {/* Format Selection */}
                <div className={styles.formatSection}>
                    <span className={styles.formatLabel}>Format</span>
                    <div className={styles.formatGrid}>
                        {FORMAT_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                className={`${styles.formatButton} ${settings.format === opt.id ? styles.formatButtonActive : ''}`}
                                onClick={() => updateSetting('format', opt.id)}
                            >
                                <span className={styles.formatIcon}>{opt.icon}</span>
                                <span className={styles.formatName}>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings (only for PNG/SVG/PDF) */}
                {(settings.format === 'png' || settings.format === 'svg' || settings.format === 'pdf') && (
                    <div className={styles.settingsSection}>
                        <span className={styles.settingsLabel}>Settings</span>

                        {/* Scale (PNG/PDF only) */}
                        {(settings.format === 'png' || settings.format === 'pdf') && (
                            <div className={styles.settingRow}>
                                <span className={styles.settingName}>Quality</span>
                                <div className={styles.qualityButtons}>
                                    {SCALE_OPTIONS.map((scale) => (
                                        <button
                                            key={scale}
                                            className={`${styles.qualityButton} ${settings.scale === scale ? styles.qualityButtonActive : ''}`}
                                            onClick={() => updateSetting('scale', scale)}
                                        >
                                            {scale}x
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PDF Page Size */}
                        {settings.format === 'pdf' && (
                            <div className={styles.settingRow}>
                                <span className={styles.settingName}>Page Size</span>
                                <div className={styles.qualityButtons}>
                                    <button
                                        className={`${styles.qualityButton} ${settings.pdfPageSize === 'a4' ? styles.qualityButtonActive : ''}`}
                                        onClick={() => updateSetting('pdfPageSize', 'a4')}
                                    >
                                        A4
                                    </button>
                                    <button
                                        className={`${styles.qualityButton} ${settings.pdfPageSize === 'letter' ? styles.qualityButtonActive : ''}`}
                                        onClick={() => updateSetting('pdfPageSize', 'letter')}
                                    >
                                        Letter
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* PDF Orientation */}
                        {settings.format === 'pdf' && (
                            <div className={styles.settingRow}>
                                <span className={styles.settingName}>Orientation</span>
                                <div className={styles.qualityButtons}>
                                    <button
                                        className={`${styles.qualityButton} ${settings.pdfOrientation === 'landscape' ? styles.qualityButtonActive : ''}`}
                                        onClick={() => updateSetting('pdfOrientation', 'landscape')}
                                    >
                                        Landscape
                                    </button>
                                    <button
                                        className={`${styles.qualityButton} ${settings.pdfOrientation === 'portrait' ? styles.qualityButtonActive : ''}`}
                                        onClick={() => updateSetting('pdfOrientation', 'portrait')}
                                    >
                                        Portrait
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Padding */}
                        <div className={styles.settingRow}>
                            <span className={styles.settingName}>Padding</span>
                            <div className={styles.settingControl}>
                                <input
                                    type="number"
                                    className={styles.paddingInput}
                                    value={settings.padding}
                                    onChange={(e) => updateSetting('padding', Math.max(0, parseInt(e.target.value) || 0))}
                                    min={0}
                                    max={100}
                                />
                                <span className={styles.paddingUnit}>px</span>
                            </div>
                        </div>

                        {/* Transparent background (PNG/SVG only) */}
                        {(settings.format === 'png' || settings.format === 'svg') && (
                            <div className={styles.settingRow}>
                                <span className={styles.settingName}>Transparent background</span>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={settings.transparentBg}
                                    onChange={(e) => updateSetting('transparentBg', e.target.checked)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={styles.panelFooter}>
                <div className={styles.exportInfo}>
                    <span>{exportNodes.length} shapes, {exportEdges.length} connections</span>
                    <span className={styles.exportSize}>{estimatedSize}</span>
                </div>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.exportButton}
                        onClick={handleExport}
                        disabled={isExporting || exportNodes.length === 0}
                    >
                        📥 Export {settings.format.toUpperCase()}
                    </button>
                    {settings.format === 'png' && (
                        <button
                            className={`${styles.copyButton} ${copySuccess ? styles.copyButtonSuccess : ''}`}
                            onClick={handleCopyToClipboard}
                            disabled={isExporting || exportNodes.length === 0}
                            title="Copy to clipboard"
                        >
                            {copySuccess ? '✓' : '📋'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Export Button Component (for toolbar integration)
// =============================================================================

export interface ExportButtonProps {
    onExport?: (format: ExportFormat) => void;
    isDarkMode?: boolean;
}

export function ExportButton({ onExport, isDarkMode = false }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Keyboard shortcut (Ctrl+E)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
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
                title="Export (Ctrl+E)"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <span className={styles.buttonIcon} aria-hidden="true">📤</span>
                <span className={styles.buttonLabel}>Export</span>
                <span className={styles.buttonShortcut} aria-hidden="true">⌃E</span>
            </button>

            <ExportPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onExport={onExport}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}

export default ExportPanel;
