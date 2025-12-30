import { memo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    getBezierPath,
    getStraightPath,
    type EdgeProps,
    type Edge,
} from '@xyflow/react';
import type { DiagramEdgeData } from '../types';
import './edges.css';

type ConnectorEdgeType = Edge<DiagramEdgeData, 'connector'>;

export const ConnectorEdge = memo(({
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
    markerEnd,
    markerStart,
}: EdgeProps<ConnectorEdgeType>) => {
    // Выбор типа пути
    const routeType = data?.routeType ?? 'smoothstep';

    let edgePath: string;
    let labelX: number;
    let labelY: number;

    switch (routeType) {
        case 'straight': {
            const [path, lx, ly] = getStraightPath({
                sourceX, sourceY, targetX, targetY,
            });
            edgePath = path;
            labelX = lx;
            labelY = ly;
            break;
        }
        case 'bezier': {
            const [path, lx, ly] = getBezierPath({
                sourceX, sourceY, sourcePosition,
                targetX, targetY, targetPosition,
            });
            edgePath = path;
            labelX = lx;
            labelY = ly;
            break;
        }
        case 'step':
        case 'smoothstep':
        default: {
            const [path, lx, ly] = getSmoothStepPath({
                sourceX, sourceY, sourcePosition,
                targetX, targetY, targetPosition,
                borderRadius: routeType === 'step' ? 0 : 8,
            });
            edgePath = path;
            labelX = lx;
            labelY = ly;
            break;
        }
    }

    // Selection color overrides data color
    const strokeColor = selected
        ? '#3b82f6'
        : ((style?.stroke as string) ?? data?.style?.stroke ?? '#64748b');

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
                markerEnd={markerEnd}
                markerStart={markerStart}
            />
            {data?.animated && (
                <BaseEdge
                    id={`${id}-animated`}
                    path={edgePath}
                    style={{
                        stroke: strokeColor,
                        strokeWidth: strokeWidth + 2,
                        strokeDasharray: '5 5',
                        animation: 'dashdraw 0.5s linear infinite',
                    }}
                />
            )}
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        className={`edge-label nodrag nopan${selected ? ' edge-label--selected' : ''}`}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
});

ConnectorEdge.displayName = 'ConnectorEdge';
