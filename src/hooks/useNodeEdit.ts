/**
 * useNodeEdit - Hook for node text editing
 *
 * Provides state and handlers for inline node text editing
 */

import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useXYFlowStore } from '../xyflow/store';

// =============================================================================
// Types
// =============================================================================

export interface EditingNode {
    nodeId: string;
    initialValue: string;
    position: { x: number; y: number };
    multiline: boolean;
    nodeType: string;
    data: any;
}

export interface UseNodeEditReturn {
    /** Currently editing node info, or null if not editing */
    editingNode: EditingNode | null;
    /** Start editing a node */
    startEditing: (nodeId: string) => void;
    /** Save the edited value */
    saveEdit: (nodeId: string, value: string) => void;
    /** Cancel editing */
    cancelEdit: () => void;
}

// =============================================================================
// Constants
// =============================================================================

/** Node types that should use multiline textarea */
const MULTILINE_NODE_TYPES = new Set(['sticky', 'text']);

// =============================================================================
// Hook
// =============================================================================

export function useNodeEdit(): UseNodeEditReturn {
    const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
    const { getNode } = useReactFlow();
    const updateNodeData = useXYFlowStore((s) => s.updateNodeData);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    const startEditing = useCallback(
        (nodeId: string) => {
            const node = getNode(nodeId);
            if (!node) return;

            // Get node position in screen coordinates
            // We need to find the DOM element for accurate positioning
            const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
            let position = { x: 0, y: 0 };

            if (nodeElement) {
                const rect = nodeElement.getBoundingClientRect();
                position = {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                };
            }

            const isMultiline = MULTILINE_NODE_TYPES.has(node.type ?? '');

            setEditingNode({
                nodeId,
                initialValue: (node.data as { label?: string })?.label ?? '',
                position: { x: position.x, y: position.y },
                multiline: isMultiline,
                nodeType: node.type ?? 'rectangle',
                data: node.data,
                // Pass dimensions for better positioning
                dimensions: { width: position.width, height: position.height }
            } as any);
        },
        [getNode]
    );

    const saveEdit = useCallback(
        (nodeId: string, value: string) => {
            const trimmedValue = value.trim();

            // Only save if value changed
            const node = getNode(nodeId);
            const currentLabel = (node?.data as { label?: string })?.label ?? '';

            if (trimmedValue !== currentLabel) {
                pushHistory(`Edit node: ${nodeId}`);
                updateNodeData(nodeId, { label: trimmedValue });
            }

            setEditingNode(null);
        },
        [getNode, updateNodeData, pushHistory]
    );

    const cancelEdit = useCallback(() => {
        setEditingNode(null);
    }, []);

    return {
        editingNode,
        startEditing,
        saveEdit,
        cancelEdit,
    };
}
