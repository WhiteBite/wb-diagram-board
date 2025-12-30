/**
 * useEdgeEdit - Hook for edge label editing
 *
 * Provides state and handlers for inline edge label editing
 */

import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useXYFlowStore } from '../xyflow/store';

// =============================================================================
// Types
// =============================================================================

export interface EditingEdge {
    edgeId: string;
    initialValue: string;
    position: { x: number; y: number };
}

export interface UseEdgeEditReturn {
    /** Currently editing edge info, or null if not editing */
    editingEdge: EditingEdge | null;
    /** Start editing an edge */
    startEditing: (edgeId: string, position?: { x: number; y: number }) => void;
    /** Save the edited value */
    saveEdit: (edgeId: string, value: string) => void;
    /** Cancel editing */
    cancelEdit: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useEdgeEdit(): UseEdgeEditReturn {
    const [editingEdge, setEditingEdge] = useState<EditingEdge | null>(null);
    const { getEdge } = useReactFlow();
    const updateEdgeLabel = useXYFlowStore((s) => s.updateEdgeLabel);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    const startEditing = useCallback(
        (edgeId: string, position?: { x: number; y: number }) => {
            const edge = getEdge(edgeId);
            if (!edge) return;

            // Use provided position or try to find edge label element
            let editorPosition = position ?? { x: 0, y: 0 };

            if (!position) {
                // Try to find the edge label element for positioning
                const edgeLabelElement = document.querySelector(
                    `[data-edge-id="${edgeId}"] .edge-label, .react-flow__edge[data-id="${edgeId}"]`
                );
                if (edgeLabelElement) {
                    const rect = edgeLabelElement.getBoundingClientRect();
                    editorPosition = {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                    };
                }
            }

            setEditingEdge({
                edgeId,
                initialValue: (edge.data as { label?: string })?.label ?? '',
                position: editorPosition,
            });
        },
        [getEdge]
    );

    const saveEdit = useCallback(
        (edgeId: string, value: string) => {
            const trimmedValue = value.trim();

            // Only save if value changed
            const edge = getEdge(edgeId);
            const currentLabel = (edge?.data as { label?: string })?.label ?? '';

            if (trimmedValue !== currentLabel) {
                pushHistory(`Edit edge label: ${edgeId}`);
                updateEdgeLabel(edgeId, trimmedValue);
            }

            setEditingEdge(null);
        },
        [getEdge, updateEdgeLabel, pushHistory]
    );

    const cancelEdit = useCallback(() => {
        setEditingEdge(null);
    }, []);

    return {
        editingEdge,
        startEditing,
        saveEdit,
        cancelEdit,
    };
}
