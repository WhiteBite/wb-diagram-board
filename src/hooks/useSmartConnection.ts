/**
 * useSmartConnection - Hook for smart connection between selected nodes
 *
 * Features:
 * - Sequential connection: A → B → C (chain)
 * - Connect to last: All selected nodes connect to the last one
 */

import { useCallback, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { useXYFlowStore } from '../xyflow/store';
import type { DiagramEdge } from '../xyflow/types';

interface SmartConnectionResult {
    /** Connect nodes sequentially: A → B → C */
    connectSequential: () => void;
    /** Connect all nodes to the last selected one */
    connectToLast: () => void;
    /** Whether connection is possible (2+ nodes selected) */
    canConnect: boolean;
    /** Number of selected nodes */
    selectedCount: number;
}

export function useSmartConnection(): SmartConnectionResult {
    const nodes = useXYFlowStore((s) => s.nodes);
    const edges = useXYFlowStore((s) => s.edges);
    const setEdges = useXYFlowStore((s) => s.setEdges);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    // Get selected nodes sorted by position (left-to-right, top-to-bottom)
    const selectedNodes = useMemo(() => {
        return nodes
            .filter((n) => n.selected)
            .sort((a, b) => {
                // Sort by Y first (top to bottom), then by X (left to right)
                const yDiff = a.position.y - b.position.y;
                if (Math.abs(yDiff) > 50) return yDiff;
                return a.position.x - b.position.x;
            });
    }, [nodes]);

    const canConnect = selectedNodes.length >= 2;
    const selectedCount = selectedNodes.length;

    // Check if edge already exists
    const edgeExists = useCallback(
        (sourceId: string, targetId: string): boolean => {
            return edges.some(
                (e) => e.source === sourceId && e.target === targetId
            );
        },
        [edges]
    );

    // Create a new edge
    const createEdge = useCallback(
        (sourceId: string, targetId: string): DiagramEdge => ({
            id: `edge-${nanoid(8)}`,
            source: sourceId,
            target: targetId,
            type: 'connector',
        }),
        []
    );

    // Connect nodes sequentially: A → B → C
    const connectSequential = useCallback(() => {
        if (selectedNodes.length < 2) return;

        pushHistory('Connect sequential');

        const newEdges: DiagramEdge[] = [];

        for (let i = 0; i < selectedNodes.length - 1; i++) {
            const sourceId = selectedNodes[i].id;
            const targetId = selectedNodes[i + 1].id;

            if (!edgeExists(sourceId, targetId)) {
                newEdges.push(createEdge(sourceId, targetId));
            }
        }

        if (newEdges.length > 0) {
            setEdges([...edges, ...newEdges]);
        }
    }, [selectedNodes, edges, setEdges, pushHistory, edgeExists, createEdge]);

    // Connect all nodes to the last selected one
    const connectToLast = useCallback(() => {
        if (selectedNodes.length < 2) return;

        pushHistory('Connect to last');

        const targetId = selectedNodes[selectedNodes.length - 1].id;
        const newEdges: DiagramEdge[] = [];

        for (let i = 0; i < selectedNodes.length - 1; i++) {
            const sourceId = selectedNodes[i].id;

            if (!edgeExists(sourceId, targetId)) {
                newEdges.push(createEdge(sourceId, targetId));
            }
        }

        if (newEdges.length > 0) {
            setEdges([...edges, ...newEdges]);
        }
    }, [selectedNodes, edges, setEdges, pushHistory, edgeExists, createEdge]);

    return {
        connectSequential,
        connectToLast,
        canConnect,
        selectedCount,
    };
}
