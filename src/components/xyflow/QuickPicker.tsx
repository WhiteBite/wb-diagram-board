/**
 * QuickPicker - A small popup menu for quickly selecting a shape
 * Used for Miro-style predictive connections
 */

import { memo, useEffect, useRef } from 'react';
import styles from './QuickPicker.module.css';
import { DiagramNode } from '../../xyflow/types';

interface QuickPickerProps {
    x: number;
    y: number;
    onSelect: (type: DiagramNode['type']) => void;
    onClose: () => void;
    isDark?: boolean;
}

const SHAPES: { type: DiagramNode['type']; label: string; icon: string }[] = [
    { type: 'rectangle', label: 'Rectangle', icon: '▢' },
    { type: 'rounded-rectangle', label: 'Rounded', icon: '▢' },
    { type: 'ellipse', label: 'Ellipse', icon: '◯' },
    { type: 'diamond', label: 'Diamond', icon: '◇' },
    { type: 'sticky', label: 'Sticky', icon: '🗒' },
    { type: 'text', label: 'Text', icon: 'T' },
];

export const QuickPicker = memo(function QuickPicker({
    x,
    y,
    onSelect,
    onClose,
    isDark = false,
}: QuickPickerProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className={`${styles.container} ${isDark ? styles.dark : ''}`}
            style={{ left: x, top: y }}
        >
            <div className={styles.grid}>
                {SHAPES.map((shape) => (
                    <button
                        key={shape.type}
                        className={styles.item}
                        onClick={() => onSelect(shape.type)}
                        title={shape.label}
                    >
                        <span className={styles.icon}>{shape.icon}</span>
                        <span className={styles.label}>{shape.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
});
