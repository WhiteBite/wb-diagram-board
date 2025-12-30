/**
 * WB Diagram Board - Entry Point
 *
 * Powered by XY Flow (React Flow) - full-featured diagram board with:
 * - Custom nodes (rectangle, ellipse, diamond, text, sticky, swimlane)
 * - Edges with arrow markers
 * - Selection, resize, drag
 * - Undo/redo
 * - Keyboard shortcuts
 * - Export capabilities
 * - Automatic localStorage persistence
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
