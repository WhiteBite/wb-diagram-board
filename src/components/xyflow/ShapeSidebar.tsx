/**
 * ShapeSidebar - Always visible sidebar with shapes and arrows
 * 
 * Features:
 * - Drag shapes to canvas
 * - Click to add at center
 * - Collapsible categories
 * - Arrow type selection for new connections
 */

import { memo, useCallback, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { DiagramNodeType } from '../../xyflow/types';
import { DEFAULT_NODE_SIZE } from '../../xyflow/types';
import { useXYFlowStore } from '../../xyflow/store';
import styles from './ShapeSidebar.module.css';

// =============================================================================
// Types
// =============================================================================

interface ShapeItem {
    type: DiagramNodeType;
    label: string;
    shortcut?: string;
}

export interface ArrowType {
    id: string;
    label: string;
    sourceType: 'none' | 'arrow' | 'diamond' | 'circle';
    targetType: 'none' | 'arrow' | 'diamond' | 'circle';
    lineType: 'solid' | 'dashed' | 'dotted';
}

interface Category {
    id: string;
    label: string;
    shapes: ShapeItem[];
}

export interface ShapeSidebarProps {
    isDark?: boolean;
    selectedArrowType?: string;
    onArrowTypeChange?: (arrow: ArrowType) => void;
}

// =============================================================================
// Data
// =============================================================================

const CATEGORIES: Category[] = [
    {
        id: 'basic',
        label: 'Basic',
        shapes: [
            { type: 'rectangle', label: 'Rectangle', shortcut: 'R' },
            { type: 'rounded-rectangle', label: 'Rounded' },
            { type: 'ellipse', label: 'Ellipse', shortcut: 'E' },
            { type: 'circle', label: 'Circle' },
            { type: 'diamond', label: 'Diamond', shortcut: 'D' },
            { type: 'hexagon', label: 'Hexagon' },
        ],
    },
    {
        id: 'flowchart',
        label: 'Flowchart',
        shapes: [
            { type: 'parallelogram', label: 'Input/Output' },
            { type: 'trapezoid', label: 'Manual Op' },
            { type: 'cylinder', label: 'Database' },
            { type: 'document', label: 'Document' },
            { type: 'cloud', label: 'Cloud' },
        ],
    },
    {
        id: 'uml',
        label: 'UML',
        shapes: [
            { type: 'actor', label: 'Actor' },
            { type: 'note', label: 'Note' },
        ],
    },
    {
        id: 'containers',
        label: 'Containers',
        shapes: [
            { type: 'swimlane', label: 'Swimlane' },
            { type: 'group', label: 'Group' },
        ],
    },
    {
        id: 'text',
        label: 'Text',
        shapes: [
            { type: 'text', label: 'Text', shortcut: 'T' },
            { type: 'sticky', label: 'Sticky Note', shortcut: 'N' },
        ],
    },
];

export const ARROW_TYPES: ArrowType[] = [
    { id: 'arrow', label: 'Arrow →', sourceType: 'none', targetType: 'arrow', lineType: 'solid' },
    { id: 'line', label: 'Line —', sourceType: 'none', targetType: 'none', lineType: 'solid' },
    { id: 'bidirectional', label: 'Both ↔', sourceType: 'arrow', targetType: 'arrow', lineType: 'solid' },
    { id: 'dashed', label: 'Dashed - -', sourceType: 'none', targetType: 'arrow', lineType: 'dashed' },
    { id: 'dotted', label: 'Dotted ···', sourceType: 'none', targetType: 'arrow', lineType: 'dotted' },
    { id: 'diamond', label: 'Diamond ◇→', sourceType: 'diamond', targetType: 'arrow', lineType: 'solid' },
    { id: 'circle', label: 'Circle ○→', sourceType: 'circle', targetType: 'arrow', lineType: 'solid' },
];

// =============================================================================
// Shape Preview SVGs
// =============================================================================

const ShapeIcon = memo(({ type, isDark }: { type: DiagramNodeType; isDark?: boolean }) => {
    const stroke = isDark ? '#94a3b8' : '#475569';
    const fill = isDark ? '#1e293b' : '#f8fafc';

    const icons: Record<string, JSX.Element> = {
        'rectangle': <rect x="2" y="4" width="20" height="16" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'rounded-rectangle': <rect x="2" y="4" width="20" height="16" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'ellipse': <ellipse cx="12" cy="12" rx="10" ry="7" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'circle': <circle cx="12" cy="12" r="8" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'diamond': <polygon points="12,2 22,12 12,22 2,12" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'hexagon': <polygon points="6,4 18,4 22,12 18,20 6,20 2,12" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'parallelogram': <polygon points="6,4 22,4 18,20 2,20" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'trapezoid': <polygon points="5,4 19,4 22,20 2,20" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'cylinder': (
            <>
                <ellipse cx="12" cy="6" rx="8" ry="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
                <path d="M4,6 L4,18 A8,3 0 0,0 20,18 L20,6" fill={fill} stroke={stroke} strokeWidth="1.5" />
            </>
        ),
        'document': <path d="M4,3 L20,3 L20,17 Q16,21 12,17 Q8,13 4,17 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'cloud': <path d="M6,16 A4,4 0 1,1 6,10 A5,5 0 1,1 18,10 A4,4 0 1,1 18,16 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'actor': (
            <>
                <circle cx="12" cy="5" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
                <line x1="12" y1="8" x2="12" y2="15" stroke={stroke} strokeWidth="1.5" />
                <line x1="6" y1="11" x2="18" y2="11" stroke={stroke} strokeWidth="1.5" />
                <line x1="12" y1="15" x2="7" y2="22" stroke={stroke} strokeWidth="1.5" />
                <line x1="12" y1="15" x2="17" y2="22" stroke={stroke} strokeWidth="1.5" />
            </>
        ),
        'note': <path d="M4,3 L16,3 L20,7 L20,21 L4,21 Z M16,3 L16,7 L20,7" fill={fill} stroke={stroke} strokeWidth="1.5" />,
        'text': <text x="12" y="16" textAnchor="middle" fill={stroke} fontSize="14" fontWeight="bold">T</text>,
        'sticky': (
            <>
                <rect x="3" y="3" width="18" height="18" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
                <path d="M15,3 L21,3 L21,9 Z" fill="#eab308" />
            </>
        ),
        'swimlane': (
            <>
                <rect x="2" y="3" width="20" height="18" fill={fill} stroke={stroke} strokeWidth="1.5" />
                <rect x="2" y="3" width="20" height="5" fill={stroke} />
            </>
        ),
        'group': (
            <>
                <rect x="2" y="3" width="20" height="18" rx="2" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3" />
                <rect x="2" y="3" width="20" height="5" rx="2" fill="#3b82f6" />
            </>
        ),
    };

    return (
        <svg viewBox="0 0 24 24" className={styles.shapeIcon}>
            {icons[type] || icons['rectangle']}
        </svg>
    );
});

ShapeIcon.displayName = 'ShapeIcon';

// =============================================================================
// Shape Button
// =============================================================================

const ShapeButton = memo(({ shape, isDark }: { shape: ShapeItem; isDark?: boolean }) => {
    const { screenToFlowPosition } = useReactFlow();
    const addNode = useXYFlowStore((s) => s.addNode);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
        e.dataTransfer.setData('application/xyflow-node-type', shape.type);
        e.dataTransfer.effectAllowed = 'move';
    }, [shape.type]);

    const handleClick = useCallback(() => {
        // Calculate center of the current viewport
        const center = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        // Use default size if available
        const defaultSize = (DEFAULT_NODE_SIZE as any)[shape.type] || { width: 180, height: 100 };

        addNode({
            id: `${shape.type}-${nanoid(8)}`,
            type: shape.type,
            position: { 
                x: center.x - defaultSize.width / 2, 
                y: center.y - defaultSize.height / 2 
            },
            data: { 
                label: shape.label,
                width: defaultSize.width,
                height: defaultSize.height,
            },
            style: {
                width: defaultSize.width,
                height: defaultSize.height,
            }
        });
    }, [shape.type, shape.label, addNode, screenToFlowPosition]);

    return (
        <button
            className={styles.shapeButton}
            draggable
            onDragStart={handleDragStart}
            onClick={handleClick}
            title={`${shape.label}${shape.shortcut ? ` (${shape.shortcut})` : ''} - Click to add or Drag`}
        >
            <ShapeIcon type={shape.type} isDark={isDark} />
            <span className={styles.shapeLabel}>{shape.label}</span>
        </button>
    );
});

ShapeButton.displayName = 'ShapeButton';

// =============================================================================
// Arrow Preview
// =============================================================================

const ArrowPreview = memo(({ arrow, isDark }: { arrow: ArrowType; isDark?: boolean }) => {
    const stroke = isDark ? '#94a3b8' : '#475569';

    const dashArray = arrow.lineType === 'dashed' ? '4,2' : arrow.lineType === 'dotted' ? '1,2' : 'none';

    return (
        <svg viewBox="0 0 40 16" className={styles.arrowIcon}>
            <line x1="4" y1="8" x2="32" y2="8" stroke={stroke} strokeWidth="2" strokeDasharray={dashArray} />
            {arrow.sourceType === 'arrow' && <polygon points="4,8 10,4 10,12" fill={stroke} />}
            {arrow.sourceType === 'diamond' && <polygon points="2,8 8,4 14,8 8,12" fill={stroke} />}
            {arrow.sourceType === 'circle' && <circle cx="6" cy="8" r="4" fill={stroke} />}
            {arrow.targetType === 'arrow' && <polygon points="36,8 30,4 30,12" fill={stroke} />}
            {arrow.targetType === 'diamond' && <polygon points="26,8 32,4 38,8 32,12" fill={stroke} />}
            {arrow.targetType === 'circle' && <circle cx="34" cy="8" r="4" fill={stroke} />}
        </svg>
    );
});

ArrowPreview.displayName = 'ArrowPreview';

// =============================================================================
// Main Component
// =============================================================================

export const ShapeSidebar = memo(function ShapeSidebar({
    isDark = false,
    selectedArrowType = 'arrow',
    onArrowTypeChange,
}: ShapeSidebarProps) {
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

    const toggleCategory = useCallback((categoryId: string) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    }, []);

    return (
        <div className={`${styles.sidebar} ${isDark ? styles.dark : ''}`}>
            <div className={styles.header}>
                <span className={styles.title}>Shapes</span>
            </div>

            <div className={styles.content}>
                {/* Shape Categories */}
                {CATEGORIES.map(category => (
                    <div key={category.id} className={styles.category}>
                        <button
                            className={styles.categoryHeader}
                            onClick={() => toggleCategory(category.id)}
                        >
                            <span>{category.label}</span>
                            <svg
                                className={`${styles.chevron} ${collapsedCategories.has(category.id) ? styles.collapsed : ''}`}
                                viewBox="0 0 24 24"
                            >
                                <polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </button>
                        {!collapsedCategories.has(category.id) && (
                            <div className={styles.shapeGrid}>
                                {category.shapes.map(shape => (
                                    <ShapeButton key={shape.type} shape={shape} isDark={isDark} />
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Arrow Types */}
                <div className={styles.category}>
                    <div className={styles.categoryHeader}>
                        <span>Arrow Type</span>
                    </div>
                    <div className={styles.arrowList}>
                        {ARROW_TYPES.map(arrow => (
                            <button
                                key={arrow.id}
                                className={`${styles.arrowButton} ${selectedArrowType === arrow.id ? styles.selected : ''}`}
                                onClick={() => onArrowTypeChange?.(arrow)}
                                title={arrow.label}
                            >
                                <ArrowPreview arrow={arrow} isDark={isDark} />
                                <span className={styles.arrowLabel}>{arrow.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ShapeSidebar;
