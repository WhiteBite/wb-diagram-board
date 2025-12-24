/**
 * Export/Import Service
 * 
 * Handles exporting and importing documents in various formats
 */

import type { StorageDocument, ExportFormat, ExportResult } from '../../types/storage';
import { StorageError } from '../../types/storage';

/**
 * Service for exporting and importing documents
 * 
 * Supported formats:
 * - JSON: Complete document with all metadata
 * - SVG: Vector diagram (requires canvas rendering)
 * - PNG: Raster image (requires canvas rendering)
 * 
 * @example
 * ```typescript
 * const service = new ExportImportService();
 * 
 * // Export to JSON
 * const json = service.exportToJSON(document);
 * 
 * // Import from JSON
 * const doc = service.importFromJSON(json);
 * 
 * // Export to PNG
 * const blob = await service.exportToPNG(document, canvas);
 * ```
 */
export class ExportImportService {
    /**
     * Export document to JSON format
     * 
     * @param doc - Document to export
     * @returns JSON string representation
     * @throws StorageError if export fails
     */
    exportToJSON(doc: StorageDocument): string {
        try {
            return JSON.stringify(doc, null, 2);
        } catch (error) {
            throw new StorageError(
                'Failed to export to JSON',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Export document to PNG format
     * 
     * Requires a canvas element with the rendered diagram
     * 
     * @param doc - Document to export
     * @param canvas - Canvas element with rendered diagram
     * @returns Blob containing PNG data
     * @throws StorageError if export fails
     */
    async exportToPNG(doc: StorageDocument, canvas: HTMLCanvasElement): Promise<Blob> {
        return new Promise((resolve, reject) => {
            try {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new StorageError('Failed to create PNG blob'));
                            return;
                        }
                        resolve(blob);
                    },
                    'image/png',
                    0.95
                );
            } catch (error) {
                reject(new StorageError(
                    'Failed to export to PNG',
                    { error: error instanceof Error ? error.message : 'Unknown error' }
                ));
            }
        });
    }

    /**
     * Export document to SVG format
     * 
     * Creates an SVG representation of the document
     * 
     * @param doc - Document to export
     * @returns SVG string
     * @throws StorageError if export fails
     */
    async exportToSVG(doc: StorageDocument): Promise<string> {
        try {
            const { elements, elementOrder } = doc.data;

            // Calculate bounds
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            elementOrder.forEach((id) => {
                const el = elements[id];
                if (el) {
                    minX = Math.min(minX, el.x);
                    minY = Math.min(minY, el.y);
                    maxX = Math.max(maxX, el.x + el.width);
                    maxY = Math.max(maxY, el.y + el.height);
                }
            });

            const width = maxX - minX + 40;
            const height = maxY - minY + 40;
            const padding = 20;

            // Create SVG
            let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX - padding} ${minY - padding} ${width} ${height}">
  <defs>
    <style>
      .wb-element { fill: white; stroke: #e5e7eb; stroke-width: 2; }
      .wb-text { font-family: Inter, system-ui, sans-serif; font-size: 16px; }
    </style>
  </defs>
`;

            // Add elements
            elementOrder.forEach((id) => {
                const el = elements[id];
                if (!el) return;

                switch (el.type) {
                    case 'rectangle':
                        svg += `  <rect class="wb-element" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="0" />\n`;
                        if ('text' in el && el.text) {
                            svg += `  <text class="wb-text" x="${el.x + el.width / 2}" y="${el.y + el.height / 2}" text-anchor="middle" dominant-baseline="middle">${this.escapeXml(el.text)}</text>\n`;
                        }
                        break;

                    case 'ellipse':
                        svg += `  <ellipse class="wb-element" cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" />\n`;
                        if ('text' in el && el.text) {
                            svg += `  <text class="wb-text" x="${el.x + el.width / 2}" y="${el.y + el.height / 2}" text-anchor="middle" dominant-baseline="middle">${this.escapeXml(el.text)}</text>\n`;
                        }
                        break;

                    case 'text':
                        if ('text' in el) {
                            svg += `  <text class="wb-text" x="${el.x}" y="${el.y}">${this.escapeXml(el.text)}</text>\n`;
                        }
                        break;

                    case 'line':
                    case 'arrow':
                        if ('points' in el && el.points.length >= 2) {
                            const points = el.points.map(p => `${p.x},${p.y}`).join(' ');
                            svg += `  <polyline class="wb-element" points="${points}" fill="none" />\n`;
                        }
                        break;
                }
            });

            svg += '</svg>';
            return svg;
        } catch (error) {
            throw new StorageError(
                'Failed to export to SVG',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Import document from JSON format
     * 
     * @param json - JSON string representation
     * @returns Imported document
     * @throws StorageError if import fails
     */
    importFromJSON(json: string): StorageDocument {
        try {
            const data = JSON.parse(json);

            // Validate required fields
            if (!data.id || !data.name || !data.data) {
                throw new Error('Invalid document format: missing required fields');
            }

            return data as StorageDocument;
        } catch (error) {
            throw new StorageError(
                'Failed to import from JSON',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Import document from file
     * 
     * Supports JSON files
     * 
     * @param file - File to import
     * @returns Imported document
     * @throws StorageError if import fails
     */
    async importFromFile(file: File): Promise<StorageDocument> {
        try {
            const text = await file.text();

            // Determine format from file extension
            if (file.name.endsWith('.json')) {
                return this.importFromJSON(text);
            }

            throw new StorageError(
                `Unsupported file format: ${file.type}`,
                { fileName: file.name }
            );
        } catch (error) {
            if (error instanceof StorageError) {
                throw error;
            }
            throw new StorageError(
                'Failed to import from file',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    /**
     * Get MIME type for export format
     * 
     * @param format - Export format
     * @returns MIME type string
     */
    getMimeType(format: ExportFormat): string {
        switch (format) {
            case 'json':
                return 'application/json';
            case 'png':
                return 'image/png';
            case 'svg':
                return 'image/svg+xml';
            default:
                return 'application/octet-stream';
        }
    }

    /**
     * Get file extension for export format
     * 
     * @param format - Export format
     * @returns File extension (with dot)
     */
    getFileExtension(format: ExportFormat): string {
        switch (format) {
            case 'json':
                return '.json';
            case 'png':
                return '.png';
            case 'svg':
                return '.svg';
            default:
                return '.bin';
        }
    }

    /**
     * Escape XML special characters
     * 
     * @param text - Text to escape
     * @returns Escaped text
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}

/**
 * Singleton instance of ExportImportService
 */
export const exportImportService = new ExportImportService();
