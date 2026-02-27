/**
 * Auto-import hook
 * 
 * Automatically imports diagram data from clipboard when URL parameter is present
 */

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store/canvas-store';
import { convertExcalidrawToCanvas } from '../utils/excalidraw-converter';

export function useAutoImport() {
    const importFromJSON = useCanvasStore((s) => s.importFromJSON);
    const hasImported = useRef(false);

    useEffect(() => {
        // Only run once
        if (hasImported.current) return;

        const params = new URLSearchParams(window.location.search);
        const shouldImport = params.get('import') === 'clipboard';

        if (!shouldImport) return;

        // Try to read from clipboard
        const importFromClipboard = async () => {
            try {
                const text = await navigator.clipboard.readText();

                if (!text) {
                    console.warn('Clipboard is empty');
                    return;
                }

                // Try to parse as JSON
                const data = JSON.parse(text);

                // Check if it's Excalidraw format
                if (data.type === 'excalidraw') {
                    console.log('Excalidraw data detected, converting...');

                    // Convert Excalidraw to our format
                    const elements = convertExcalidrawToCanvas(data);
                    const elementOrder = Object.keys(elements);

                    // Create JSON in our format
                    const canvasData = JSON.stringify({
                        elements,
                        elementOrder,
                    });

                    importFromJSON(canvasData);
                    hasImported.current = true;

                    console.log('✅ Excalidraw diagram imported successfully');

                    // Remove URL parameter after import
                    window.history.replaceState({}, '', window.location.pathname);
                    return;
                }

                // Import as our native format
                importFromJSON(text);
                hasImported.current = true;

                console.log('✅ Canvas data imported successfully');

                // Remove URL parameter after import
                window.history.replaceState({}, '', window.location.pathname);
            } catch (error) {
                console.error('Failed to import from clipboard:', error);
            }
        };

        importFromClipboard();
    }, [importFromJSON]);
}
