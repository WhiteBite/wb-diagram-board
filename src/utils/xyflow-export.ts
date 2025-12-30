/**
 * XY Flow Export Utilities
 * 
 * Utility functions for exporting XY Flow diagrams to various formats:
 * - PNG (using html-to-image)
 * - SVG (using html-to-image)
 * - JSON (nodes + edges)
 * - Mermaid (via IR conversion)
 */

import { toPng, toSvg } from 'html-to-image';
import type { DiagramNode, DiagramEdge } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

export interface ExportOptions {
    /** Background color for the export */
    backgroundColor?: string;
    /** Padding around the content in pixels */
    padding?: number;
    /** Quality for PNG export (0-1) */
    quality?: number;
    /** Scale factor for higher resolution */
    scale?: number;
    /** Filter function to exclude elements */
    filter?: (node: HTMLElement) => boolean;
}

export interface ExportResult {
    success: boolean;
    error?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_EXPORT_OPTIONS: Required<ExportOptions> = {
    backgroundColor: '#ffffff',
    padding: 20,
    quality: 1,
    scale: 2,
    filter: () => true,
};

// =============================================================================
// Download Helpers
// =============================================================================

/**
 * Download a file with the given content
 */
export function downloadFile(
    content: string | Blob,
    filename: string,
    mimeType: string
): void {
    const blob = content instanceof Blob
        ? content
        : new Blob([content], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =============================================================================
// PNG Export
// =============================================================================

/**
 * Export the flow element to PNG
 * 
 * @param flowElement - The ReactFlow container element
 * @param filename - Output filename (default: 'diagram.png')
 * @param options - Export options
 */
export async function exportToPng(
    flowElement: HTMLElement,
    filename: string = 'diagram.png',
    options: ExportOptions = {}
): Promise<ExportResult> {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

    try {
        // Find the viewport element inside ReactFlow
        const viewport = flowElement.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) {
            throw new Error('Could not find ReactFlow viewport');
        }

        const dataUrl = await toPng(viewport, {
            backgroundColor: opts.backgroundColor,
            pixelRatio: opts.scale,
            quality: opts.quality,
            filter: (node) => {
                // Exclude controls, minimap, and attribution
                const className = node.className?.toString() ?? '';
                if (
                    className.includes('react-flow__controls') ||
                    className.includes('react-flow__minimap') ||
                    className.includes('react-flow__attribution') ||
                    className.includes('react-flow__background')
                ) {
                    return false;
                }
                return opts.filter(node as HTMLElement);
            },
        });

        downloadDataUrl(dataUrl, filename);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[exportToPng] Failed:', error);
        return { success: false, error: message };
    }
}

// =============================================================================
// SVG Export
// =============================================================================

/**
 * Export the flow element to SVG
 * 
 * @param flowElement - The ReactFlow container element
 * @param filename - Output filename (default: 'diagram.svg')
 * @param options - Export options
 */
export async function exportToSvg(
    flowElement: HTMLElement,
    filename: string = 'diagram.svg',
    options: ExportOptions = {}
): Promise<ExportResult> {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

    try {
        // Find the viewport element inside ReactFlow
        const viewport = flowElement.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) {
            throw new Error('Could not find ReactFlow viewport');
        }

        const dataUrl = await toSvg(viewport, {
            backgroundColor: opts.backgroundColor,
            filter: (node) => {
                // Exclude controls, minimap, and attribution
                const className = node.className?.toString() ?? '';
                if (
                    className.includes('react-flow__controls') ||
                    className.includes('react-flow__minimap') ||
                    className.includes('react-flow__attribution') ||
                    className.includes('react-flow__background')
                ) {
                    return false;
                }
                return opts.filter(node as HTMLElement);
            },
        });

        // Convert data URL to SVG string
        const svgString = decodeURIComponent(dataUrl.split(',')[1]);
        downloadFile(svgString, filename, 'image/svg+xml');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[exportToSvg] Failed:', error);
        return { success: false, error: message };
    }
}

// =============================================================================
// JSON Export
// =============================================================================

export interface DiagramJson {
    version: string;
    exportedAt: string;
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    metadata?: Record<string, unknown>;
}

/**
 * Export nodes and edges to JSON
 * 
 * @param nodes - XY Flow nodes
 * @param edges - XY Flow edges
 * @param filename - Output filename (default: 'diagram.json')
 * @param metadata - Optional metadata to include
 */
export function exportToJson(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    filename: string = 'diagram.json',
    metadata?: Record<string, unknown>
): ExportResult {
    try {
        const data: DiagramJson = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            nodes,
            edges,
            metadata,
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, filename, 'application/json');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[exportToJson] Failed:', error);
        return { success: false, error: message };
    }
}

// =============================================================================
// Mermaid Export
// =============================================================================

/**
 * Export to Mermaid format (requires xyflowToIR and generateMermaid)
 * 
 * @param mermaidCode - Generated Mermaid code
 * @param filename - Output filename (default: 'diagram.mmd')
 */
export function exportToMermaid(
    mermaidCode: string,
    filename: string = 'diagram.mmd'
): ExportResult {
    try {
        downloadFile(mermaidCode, filename, 'text/plain');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[exportToMermaid] Failed:', error);
        return { success: false, error: message };
    }
}

// =============================================================================
// PlantUML Export
// =============================================================================

/**
 * Export to PlantUML format
 * 
 * @param plantumlCode - Generated PlantUML code
 * @param filename - Output filename (default: 'diagram.puml')
 */
export function exportToPlantUML(
    plantumlCode: string,
    filename: string = 'diagram.puml'
): ExportResult {
    try {
        downloadFile(plantumlCode, filename, 'text/plain');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[exportToPlantUML] Failed:', error);
        return { success: false, error: message };
    }
}

// =============================================================================
// Draw.io Export
// =============================================================================

/**
 * Export to Draw.io format
 * 
 * @param drawioXml - Generated Draw.io XML
 * @param filename - Output filename (default: 'diagram.drawio')
 */
export function exportToDrawio(
    drawioXml: string,
    filename: string = 'diagram.drawio'
): ExportResult {
    try {
        downloadFile(drawioXml, filename, 'application/xml');
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[exportToDrawio] Failed:', error);
        return { success: false, error: message };
    }
}

// =============================================================================
// Get Filename with Timestamp
// =============================================================================

/**
 * Generate a filename with timestamp
 * 
 * @param baseName - Base name for the file
 * @param extension - File extension
 */
export function getTimestampedFilename(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${baseName}-${timestamp}.${extension}`;
}
