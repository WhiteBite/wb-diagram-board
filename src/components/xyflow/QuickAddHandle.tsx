/**
 * QuickAddHandle - A custom handle that includes a Miro-style "+" button
 * Used for quickly creating new connected nodes or dragging regular connections.
 */

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './QuickAddHandle.module.css';

interface QuickAddHandleProps {
    position: Position;
    onAdd: (position: Position) => void;
}

export const QuickAddHandle = memo(function QuickAddHandle({ position, onAdd }: QuickAddHandleProps) {
    // Determine the position class
    const positionClass = styles[position.toLowerCase()];

    const handleClick = (e: React.MouseEvent) => {
        // Only trigger onAdd if clicking the button part
        const target = e.target as HTMLElement;
        if (target.closest(`.${styles.button}`)) {
            e.stopPropagation();
            onAdd(position);
        }
    };

    return (
        <div className={`${styles.container} ${positionClass}`}>
            <Handle
                type="source"
                position={position}
                id={position}
                className={styles.handle}
                onMouseDown={handleClick}
            >
                <div className={styles.button}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </div>
            </Handle>
        </div>
    );
});
