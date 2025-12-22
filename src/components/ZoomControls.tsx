/**
 * WB Canvas - Zoom Controls
 * 
 * Zoom in/out and fit controls
 */

import { memo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { useCanvasStore, selectTransform } from '../store/canvas-store';

export const ZoomControls = memo(function ZoomControls() {
    const transform = useCanvasStore(selectTransform);
    const zoomIn = useCanvasStore((s) => s.zoomIn);
    const zoomOut = useCanvasStore((s) => s.zoomOut);
    const zoomToFit = useCanvasStore((s) => s.zoomToFit);
    const resetZoom = useCanvasStore((s) => s.resetZoom);

    const zoomPercent = Math.round(transform.scale * 100);

    return (
        <div className="zoom-controls">
            <button
                className="toolbar-button"
                onClick={zoomOut}
                title="Zoom Out (Ctrl+-)"
            >
                <ZoomOut size={18} />
            </button>

            <span className="zoom-value">{zoomPercent}%</span>

            <button
                className="toolbar-button"
                onClick={zoomIn}
                title="Zoom In (Ctrl++)"
            >
                <ZoomIn size={18} />
            </button>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-600 mx-1" />

            <button
                className="toolbar-button"
                onClick={zoomToFit}
                title="Zoom to Fit (Ctrl+1)"
            >
                <Maximize2 size={18} />
            </button>

            <button
                className="toolbar-button"
                onClick={resetZoom}
                title="Reset Zoom (Ctrl+0)"
            >
                <RotateCcw size={18} />
            </button>
        </div>
    );
});
