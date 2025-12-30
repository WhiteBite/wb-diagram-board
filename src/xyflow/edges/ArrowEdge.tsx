import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    getStraightPath,
    getBezierPath,
    type EdgeProps,
    type Edge,
} from '@xyflow/react';
import type { DiagramEdgeData } from '../types';

type ArrowEdgeType = Edge<DiagramEdgeData, 'arrow'>;

/**
 * Compute edge path based on routeType
 */
function computeEdgePath(
    routeType: string | undefined,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourcePosition: any,
    targetPosition: any
): [string, number, number] {
    let path: string;
    let labelX: number;
    let labelY: number;

    switch (routeType) {
        case 'straight': {
            [path, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
            break;
        }
        case 'bezier': {
            [path, labelX, labelY] = getBezierPath({
                sourceX, sourceY, sourcePosition,
                targetX, targetY, targetPosition,
            });
            break;
        }
        case 'step': {
            [path, labelX, labelY] = getSmoothStepPath({
                sourceX, sourceY, sourcePosition,
                targetX, targetY, targetPosition,
                borderRadius: 0,
            });
            break;
        }
        case 'smoothstep':
        default: {
            [path, labelX, labelY] = getSmoothStepPath({
                sourceX, sourceY, sourcePosition,
                targetX, targetY, targetPosition,
                borderRadius: 8,
            });
            break;
        }
    }

    return [path, labelX, labelY];
}

export const ArrowEdge = memo(({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    style,
    markerStart,
    markerEnd,
}: EdgeProps<ArrowEdgeType>) => {
    // Dynamic path based on routeType
    const [edgePath, labelX, labelY] = computeEdgePath(
        data?.routeType,
        sourceX, sourceY,
        targetX, targetY,
        sourcePosition, targetPosition
    );

    // Selection color overrides data color
    const strokeColor = selected 
        ? '#3b82f6' 
        : ((style?.stroke as string) ?? data?.style?.stroke ?? '#1e293b');
    
    const strokeWidth = (style?.strokeWidth as number) ?? data?.style?.strokeWidth ?? 2;
    const strokeDasharray = (style?.strokeDasharray as string) ?? data?.style?.strokeDasharray;

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    stroke: strokeColor,
                    strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
                    strokeDasharray,
                    color: strokeColor, // Set currentColor for markers
                }}
                markerStart={markerStart}
                markerEnd={markerEnd}
            />
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            background: '#fff',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            border: selected ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});

ArrowEdge.displayName = 'ArrowEdge';
