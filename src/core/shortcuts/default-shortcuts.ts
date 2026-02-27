/**
 * WB Canvas - Default Shortcuts
 * 
 * Standard keyboard shortcuts for the application
 */

import { KeyBinding } from '../../types/shortcuts';
import { useCanvasStore } from '../../store/canvas-store';

/**
 * Create default shortcuts
 * 
 * This function creates the default shortcuts with actions bound to the store
 * 
 * @returns Array of default key bindings
 */
export function createDefaultShortcuts(): readonly KeyBinding[] {
    const store = useCanvasStore.getState();

    return [
        // =====================================================================
        // Edit Category
        // =====================================================================

        {
            id: 'undo',
            name: 'Undo',
            description: 'Undo the last action',
            keys: ['z'],
            modifiers: ['ctrl'],
            action: () => store.undo(),
            category: 'edit',
            enabled: true,
        },

        {
            id: 'redo',
            name: 'Redo',
            description: 'Redo the last undone action',
            keys: ['z'],
            modifiers: ['ctrl', 'shift'],
            action: () => store.redo(),
            category: 'edit',
            enabled: true,
        },

        {
            id: 'copy',
            name: 'Copy',
            description: 'Copy selected elements',
            keys: ['c'],
            modifiers: ['ctrl'],
            action: () => store.copy(),
            category: 'edit',
            enabled: true,
        },

        {
            id: 'cut',
            name: 'Cut',
            description: 'Cut selected elements',
            keys: ['x'],
            modifiers: ['ctrl'],
            action: () => store.cut(),
            category: 'edit',
            enabled: true,
        },

        {
            id: 'paste',
            name: 'Paste',
            description: 'Paste elements from clipboard',
            keys: ['v'],
            modifiers: ['ctrl'],
            action: () => store.paste(),
            category: 'edit',
            enabled: true,
        },

        {
            id: 'delete',
            name: 'Delete',
            description: 'Delete selected elements',
            keys: ['Delete'],
            modifiers: [],
            action: () => {
                if (store.selectedIds.length > 0) {
                    store.deleteElements(store.selectedIds);
                }
            },
            category: 'edit',
            enabled: true,
        },

        {
            id: 'selectAll',
            name: 'Select All',
            description: 'Select all elements',
            keys: ['a'],
            modifiers: ['ctrl'],
            action: () => store.selectAll(),
            category: 'edit',
            enabled: true,
        },

        {
            id: 'duplicate',
            name: 'Duplicate',
            description: 'Duplicate selected elements',
            keys: ['d'],
            modifiers: ['ctrl'],
            action: () => {
                if (store.selectedIds.length > 0) {
                    store.duplicateElements(store.selectedIds);
                }
            },
            category: 'edit',
            enabled: true,
        },

        // =====================================================================
        // View Category
        // =====================================================================

        {
            id: 'zoomIn',
            name: 'Zoom In',
            description: 'Zoom in',
            keys: ['+'],
            modifiers: ['ctrl'],
            action: () => store.zoomIn(),
            category: 'view',
            enabled: true,
        },

        {
            id: 'zoomOut',
            name: 'Zoom Out',
            description: 'Zoom out',
            keys: ['-'],
            modifiers: ['ctrl'],
            action: () => store.zoomOut(),
            category: 'view',
            enabled: true,
        },

        {
            id: 'zoomReset',
            name: 'Reset Zoom',
            description: 'Reset zoom to 100%',
            keys: ['0'],
            modifiers: ['ctrl'],
            action: () => store.resetZoom(),
            category: 'view',
            enabled: true,
        },

        {
            id: 'zoomFit',
            name: 'Zoom to Fit',
            description: 'Zoom to fit all elements',
            keys: ['1'],
            modifiers: ['ctrl'],
            action: () => store.zoomToFit(),
            category: 'view',
            enabled: true,
        },

        {
            id: 'toggleGrid',
            name: 'Toggle Grid',
            description: 'Show or hide grid',
            keys: ['g'],
            modifiers: ['ctrl'],
            action: () => store.toggleGrid(),
            category: 'view',
            enabled: true,
        },

        // =====================================================================
        // Tool Category
        // =====================================================================

        {
            id: 'toolSelect',
            name: 'Select Tool',
            description: 'Activate select tool',
            keys: ['v'],
            modifiers: [],
            action: () => store.setTool('select'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolHand',
            name: 'Hand Tool',
            description: 'Activate hand tool',
            keys: ['h'],
            modifiers: [],
            action: () => store.setTool('hand'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolRectangle',
            name: 'Rectangle Tool',
            description: 'Activate rectangle tool',
            keys: ['r'],
            modifiers: [],
            action: () => store.setTool('rectangle'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolEllipse',
            name: 'Ellipse Tool',
            description: 'Activate ellipse tool',
            keys: ['o'],
            modifiers: [],
            action: () => store.setTool('ellipse'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolDiamond',
            name: 'Diamond Tool',
            description: 'Activate diamond tool',
            keys: ['d'],
            modifiers: [],
            action: () => store.setTool('diamond'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolTriangle',
            name: 'Triangle Tool',
            description: 'Activate triangle tool',
            keys: ['t'],
            modifiers: [],
            action: () => store.setTool('triangle'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolLine',
            name: 'Line Tool',
            description: 'Activate line tool',
            keys: ['l'],
            modifiers: [],
            action: () => store.setTool('line'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolArrow',
            name: 'Arrow Tool',
            description: 'Activate arrow tool',
            keys: ['a'],
            modifiers: [],
            action: () => store.setTool('arrow'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolFreedraw',
            name: 'Freedraw Tool',
            description: 'Activate freedraw tool',
            keys: ['p'],
            modifiers: [],
            action: () => store.setTool('freedraw'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolText',
            name: 'Text Tool',
            description: 'Activate text tool',
            keys: ['x'],
            modifiers: [],
            action: () => store.setTool('text'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolSticky',
            name: 'Sticky Note Tool',
            description: 'Activate sticky note tool',
            keys: ['s'],
            modifiers: [],
            action: () => store.setTool('sticky'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolFrame',
            name: 'Frame Tool',
            description: 'Activate frame tool',
            keys: ['f'],
            modifiers: [],
            action: () => store.setTool('frame'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolConnector',
            name: 'Connector Tool',
            description: 'Activate connector tool',
            keys: ['c'],
            modifiers: [],
            action: () => store.setTool('connector'),
            category: 'tool',
            enabled: true,
        },

        {
            id: 'toolEraser',
            name: 'Eraser Tool',
            description: 'Activate eraser tool',
            keys: ['e'],
            modifiers: [],
            action: () => store.setTool('eraser'),
            category: 'tool',
            enabled: true,
        },

        // =====================================================================
        // Element Category
        // =====================================================================

        {
            id: 'bringToFront',
            name: 'Bring to Front',
            description: 'Bring selected elements to front',
            keys: [']'],
            modifiers: ['ctrl'],
            action: () => {
                if (store.selectedIds.length > 0) {
                    store.bringToFront(store.selectedIds);
                }
            },
            category: 'element',
            enabled: true,
        },

        {
            id: 'sendToBack',
            name: 'Send to Back',
            description: 'Send selected elements to back',
            keys: ['['],
            modifiers: ['ctrl'],
            action: () => {
                if (store.selectedIds.length > 0) {
                    store.sendToBack(store.selectedIds);
                }
            },
            category: 'element',
            enabled: true,
        },

        {
            id: 'toggleLocked',
            name: 'Toggle Lock',
            description: 'Lock or unlock selected elements',
            keys: ['l'],
            modifiers: ['ctrl', 'shift'],
            action: () => {
                if (store.selectedIds.length > 0) {
                    store.toggleLocked(store.selectedIds);
                }
            },
            category: 'element',
            enabled: true,
        },

        // =====================================================================
        // Navigation
        // =====================================================================

        {
            id: 'clearSelection',
            name: 'Clear Selection',
            description: 'Deselect all elements',
            keys: ['Escape'],
            modifiers: [],
            action: () => store.clearSelection(),
            category: 'view',
            enabled: true,
        },
    ] as const;
}

/**
 * Get default shortcuts (lazy-loaded)
 * 
 * @returns Array of default key bindings
 */
let cachedDefaults: readonly KeyBinding[] | null = null;

export function getDefaultShortcuts(): readonly KeyBinding[] {
    if (!cachedDefaults) {
        cachedDefaults = createDefaultShortcuts();
    }
    return cachedDefaults;
}
