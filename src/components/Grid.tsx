/**
 * Grid Component - Background grid for canvas
 */

import { memo } from 'react';
import { Transform } from '../types/canvas';

interface GridProps {
    transform: Transform;
    gridSize: number;
    darkMode?: boolean;
}

export const Grid = memo(function Grid({ transform, gridSize, darkMode = false }: GridProps) {
    const { x, y, scale } = transform;
    const scaledGridSize = gridSize * scale;

    // Don't render grid if too small or too large
    if (scaledGridSize < 8 || scaledGridSize > 200) {
        return null;
    }

    // Calculate offset for seamless scrolling
    const offsetX = x % scaledGridSize;
    const offsetY = y % scaledGridSize;

    // Grid color based on theme
    const dotColor = darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <pattern
                    id="grid-pattern"
                    width={scaledGridSize}
                    height={scaledGridSize}
                    patternUnits="userSpaceOnUse"
                    x={offsetX}
                    y={offsetY}
                >
                    <circle
                        cx={scaledGridSize / 2}
                        cy={scaledGridSize / 2}
                        r={1}
                        fill={dotColor}
                    />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
    );
});
