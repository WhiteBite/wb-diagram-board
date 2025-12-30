/**
 * ShapeMenu - Enhanced shape selection menu for XY Flow
 * 
 * Features:
 * - All shapes from IR (rectangle, ellipse, diamond, hexagon, cylinder, etc.)
 * - Categorized shapes (Basic, Flowchart, UML, Containers)
 * - Arrow/edge type selection
 * - Large previews for easy drag-to-create
 * - Click to add at center
 * - Dark mode support
 */

import { memo, useCallback, useState } from 'react';
import type { DiagramNodeType } from '../../xyflow/types';
import styles from './ShapeMenu.module.css';

// =============================================================================
// Types
// =============================================================================

interface ShapeDefinition {
    type: DiagramNodeType;
    label: string;
    shortcut?: string;
    category: 'basic' | 'flowchart' | 'uml' | 'containers' | 'notes';
}

interface ArrowDefinition {
    id: string;
    label: string;
    sourceType: 'none' | 'arrow' | 'diamond' | 'circle';
    targetType: 'none' | 'arrow' | 'diamond' | 'circle';
    lineType: 'solid' | 'dashed' | 'dotted';
}

export interface ShapeMenuProps {
    selectedShape?: DiagramNodeType;
    onShapeSelect?: (type: DiagramNodeType) => void;
    onArrowSelect?: (arrow: ArrowDefinition) => void;
    isOpen?: boolean;
    onClose?: () => void;
    isDarkMode?: boolean;
}

type TabType = 'shapes' | 'arrows';

// =============================================================================
// Shape Definitions - All shapes from IR
// =============================================================================

const SHAPES: ShapeDefinition[] = [
    // Basic shapes
    { type: 'rectangle', label: 'Rectangle', shortcut: 'R', category: 'basic' },
    { type: 'rounded-rectangle', label: 'Rounded', shortcut: 'U', category: 'basic' },
    { type: 'ellipse', label: 'Ellipse', shortcut: 'E', category: 'basic' },
    { type: 'circle', label: 'Circle', shortcut: 'O', category: 'basic' },
    { type: 'diamond', label: 'Diamond', shortcut: 'D', category: 'basic' },
    { type: 'hexagon', label: 'Hexagon', shortcut: 'H', category: 'basic' },
    { type: 'parallelogram', label: 'Parallelogram', category: 'basic' },
    { type: 'trapezoid', label: 'Trapezoid', category: 'basic' },

    // Flowchart shapes
    { type: 'cylinder', label: 'Database', category: 'flowchart' },
    { type: 'document', label: 'Document', category: 'flowchart' },
    { type: 'cloud', label: 'Cloud', category: 'flowchart' },

    // UML shapes
    { type: 'actor', label: 'Actor', category: 'uml' },
    { type: 'note', label: 'Note', category: 'uml' },

    // Containers
    { type: 'swimlane', label: 'Swimlane', shortcut: 'L', category: 'containers' },
    { type: 'group', label: 'Group', shortcut: 'G', category: 'containers' },

    // Notes
    { type: 'text', label: 'Text', shortcut: 'T', category: 'notes' },
    { type: 'sticky', label: 'Sticky', shortcut: 'N', category: 'notes' },
];

// =============================================================================
// Arrow Definitions - All arrow types from IR
// =============================================================================

const ARROWS: ArrowDefinition[] = [
    // Standard arrows
    { id: 'arrow', label: 'Arrow', sourceType: 'none', targetType: 'arrow', lineType: 'solid' },
    { id: 'line', label: 'Line', sourceType: 'none', targetType: 'none', lineType: 'solid' },
    { id: 'bidirectional', label: 'Bidirectional', sourceType: 'arrow', targetType: 'arrow', lineType: 'solid' },

    // Dashed
    { id: 'dashed-arrow', label: 'Dashed Arrow', sourceType: 'none', targetType: 'arrow', lineType: 'dashed' },
    { id: 'dashed-line', label: 'Dashed Line', sourceType: 'none', targetType: 'none', lineType: 'dashed' },
    { id: 'dashed-bi', label: 'Dashed Bi', sourceType: 'arrow', targetType: 'arrow', lineType: 'dashed' },

    // Dotted
    { id: 'dotted-arrow', label: 'Dotted Arrow', sourceType: 'none', targetType: 'arrow', lineType: 'dotted' },
    { id: 'dotted-line', label: 'Dotted Line', sourceType: 'none', targetType: 'none', lineType: 'dotted' },

    // Diamond (composition/aggregation)
    { id: 'diamond', label: 'Diamond', sourceType: 'diamond', targetType: 'none', lineType: 'solid' },
    { id: 'diamond-arrow', label: 'Diamond Arrow', sourceType: 'diamond', targetType: 'arrow', lineType: 'solid' },

    // Circle
    { id: 'circle', label: 'Circle', sourceType: 'circle', targetType: 'none', lineType: 'solid' },
    { id: 'circle-arrow', label: 'Circle Arrow', sourceType: 'circle', targetType: 'arrow', lineType: 'solid' },
];

const CATEGORIES = [
    { id: 'basic', label: 'Basic' },
    { id: 'flowchart', label: 'Flowchart' },
    { id: 'uml', label: 'UML' },
    { id: 'containers', label: 'Containers' },
    { id: 'notes', label: 'Notes' },
] as const;

// =============================================================================
// Shape Preview Components
// =============================================================================

const ShapePreview = memo(({ type, isDark }: { type: DiagramNodeType; isDark?: boolean }) => {
    const stroke = isDark ? '#94a3b8' : '#1e293b';
    const fill = isDark ? '#334155' : '#ffffff';

    switch (type) {
        case 'rectangle':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <rect x="2" y="2" width="44" height="28" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'rounded-rectangle':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <rect x="2" y="2" width="44" height="28" rx="8" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'ellipse':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <ellipse cx="24" cy="16" rx="22" ry="14" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'circle':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <circle cx="24" cy="16" r="14" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'diamond':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <polygon points="24,2 46,16 24,30 2,16" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'hexagon':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <polygon points="12,2 36,2 46,16 36,30 12,30 2,16" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'parallelogram':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <polygon points="10,2 46,2 38,30 2,30" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'trapezoid':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <polygon points="8,2 40,2 46,30 2,30" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'cylinder':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <ellipse cx="24" cy="6" rx="18" ry="4" fill={fill} stroke={stroke} strokeWidth="2" />
                    <path d="M6,6 L6,26 A18,4 0 0,0 42,26 L42,6" fill={fill} stroke={stroke} strokeWidth="2" />
                    <ellipse cx="24" cy="26" rx="18" ry="4" fill="none" stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'document':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <path d="M4,2 L44,2 L44,24 Q34,30 24,24 Q14,18 4,24 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'cloud':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <path d="M12,24 A8,8 0 1,1 12,10 A10,10 0 1,1 36,10 A8,8 0 1,1 36,24 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'actor':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <circle cx="24" cy="6" r="4" fill={fill} stroke={stroke} strokeWidth="2" />
                    <line x1="24" y1="10" x2="24" y2="20" stroke={stroke} strokeWidth="2" />
                    <line x1="16" y1="14" x2="32" y2="14" stroke={stroke} strokeWidth="2" />
                    <line x1="24" y1="20" x2="18" y2="30" stroke={stroke} strokeWidth="2" />
                    <line x1="24" y1="20" x2="30" y2="30" stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'note':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <path d="M4,2 L36,2 L44,10 L44,30 L4,30 Z" fill={fill} stroke={stroke} strokeWidth="2" />
                    <path d="M36,2 L36,10 L44,10" fill="none" stroke={stroke} strokeWidth="2" />
                </svg>
            );
        case 'text':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <text x="24" y="22" textAnchor="middle" fill={stroke} fontSize="16" fontWeight="bold">T</text>
                </svg>
            );
        case 'sticky':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <rect x="4" y="2" width="40" height="28" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
                    <path d="M34 2 L44 2 L44 12 Z" fill="#eab308" />
                </svg>
            );
        case 'swimlane':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <rect x="2" y="2" width="44" height="28" fill={fill} stroke={stroke} strokeWidth="2" />
                    <rect x="2" y="2" width="44" height="8" fill={stroke} />
                    <line x1="24" y1="10" x2="24" y2="30" stroke={stroke} strokeWidth="1" strokeDasharray="2" />
                </svg>
            );
        case 'group':
            return (
                <svg viewBox="0 0 48 32" className={styles.shapePreview}>
                    <rect x="2" y="2" width="44" height="28" rx="4" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4" />
                    <rect x="2" y="2" width="44" height="8" rx="4" fill="#3b82f6" />
                </svg>
            );
        default:
            return null;
    }
});

ShapePreview.displayName = 'ShapePreview';

// =============================================================================
// Arrow Preview Component
// =============================================================================

const ArrowPreview = memo(({ arrow, isDark }: { arrow: ArrowDefinition; isDark?: boolean }) => {
    const stroke = isDark ? '#94a3b8' : '#1e293b';

    const getStrokeDasharray = () => {
        switch (arrow.lineType) {
            case 'dashed': return '6,3';
            case 'dotted': return '2,2';
            default: return 'none';
        }
    };

    const renderSourceMarker = () => {
        switch (arrow.sourceType) {
            case 'arrow':
                return <polygon points="12,16 4,12 4,20" fill={stroke} />;
            case 'diamond':
                return <polygon points="4,16 10,12 16,16 10,20" fill={stroke} />;
            case 'circle':
                return <circle cx="8" cy="16" r="4" fill={stroke} />;
            default:
                return null;
        }
    };

    const renderTargetMarker = () => {
        switch (arrow.targetType) {
            case 'arrow':
                return <polygon points="44,16 52,12 52,20" fill={stroke} />;
            case 'diamond':
                return <polygon points="40,16 46,12 52,16 46,20" fill={stroke} />;
            case 'circle':
                return <circle cx="48" cy="16" r="4" fill={stroke} />;
            default:
                return null;
        }
    };

    const lineStart = arrow.sourceType === 'none' ? 4 : 16;
    const lineEnd = arrow.targetType === 'none' ? 52 : 40;

    return (
        <svg viewBox="0 0 56 32" className={styles.arrowPreview}>
            <line
                x1={lineStart}
                y1="16"
                x2={lineEnd}
                y2="16"
                stroke={stroke}
                strokeWidth="2"
                strokeDasharray={getStrokeDasharray()}
            />
            {renderSourceMarker()}
            {renderTargetMarker()}
        </svg>
    );
});

ArrowPreview.displayName = 'ArrowPreview';


// =============================================================================
// Shape Button Component
// =============================================================================

const ShapeButton = memo(({
    shape,
    isActive,
    isDark,
    onClick,
}: {
    shape: ShapeDefinition;
    isActive: boolean;
    isDark?: boolean;
    onClick: () => void;
}) => {
    const handleDragStart = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
        e.dataTransfer.setData('application/xyflow-node-type', shape.type);
        e.dataTransfer.effectAllowed = 'move';

        const target = e.currentTarget;
        target.classList.add(styles.dragging);

        // Create custom drag image
        const dragPreview = document.createElement('div');
        dragPreview.style.cssText = `
            position: fixed;
            top: -1000px;
            left: -1000px;
            padding: 8px 16px;
            background: #6366f1;
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            pointer-events: none;
        `;
        dragPreview.textContent = shape.label;
        document.body.appendChild(dragPreview);
        e.dataTransfer.setDragImage(dragPreview, 40, 20);

        requestAnimationFrame(() => {
            document.body.removeChild(dragPreview);
        });
    }, [shape.type, shape.label]);

    const handleDragEnd = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
        e.currentTarget.classList.remove(styles.dragging);
    }, []);

    return (
        <button
            className={`${styles.shapeButton} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            title={`${shape.label}${shape.shortcut ? ` (${shape.shortcut})` : ''} - Click or drag`}
        >
            <ShapePreview type={shape.type} isDark={isDark} />
            <span className={styles.shapeLabel}>{shape.label}</span>
        </button>
    );
});

ShapeButton.displayName = 'ShapeButton';

// =============================================================================
// Arrow Button Component
// =============================================================================

const ArrowButton = memo(({
    arrow,
    isActive,
    isDark,
    onClick,
}: {
    arrow: ArrowDefinition;
    isActive: boolean;
    isDark?: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            className={`${styles.arrowButton} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            title={arrow.label}
        >
            <ArrowPreview arrow={arrow} isDark={isDark} />
            <span className={styles.arrowLabel}>{arrow.label}</span>
        </button>
    );
});

ArrowButton.displayName = 'ArrowButton';

// =============================================================================
// Main Component
// =============================================================================

export const ShapeMenu = memo(function ShapeMenu({
    selectedShape,
    onShapeSelect,
    onArrowSelect,
    isOpen = true,
    onClose: _onClose,
    isDarkMode = false,
}: ShapeMenuProps) {
    const [activeTab, setActiveTab] = useState<TabType>('shapes');
    const [selectedArrow, setSelectedArrow] = useState<string>('arrow');

    const handleShapeSelect = useCallback((type: DiagramNodeType) => {
        onShapeSelect?.(type);
    }, [onShapeSelect]);

    const handleArrowSelect = useCallback((arrow: ArrowDefinition) => {
        setSelectedArrow(arrow.id);
        onArrowSelect?.(arrow);
    }, [onArrowSelect]);

    if (!isOpen) return null;

    const menuClasses = [
        styles.menu,
        isDarkMode && styles.dark,
    ].filter(Boolean).join(' ');

    return (
        <div className={menuClasses} role="menu" aria-label="Shape and arrow selection">
            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'shapes' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('shapes')}
                >
                    Shapes
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'arrows' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('arrows')}
                >
                    Arrows
                </button>
            </div>

            {/* Shapes Tab */}
            {activeTab === 'shapes' && (
                <div className={styles.shapesContent}>
                    {CATEGORIES.map((category) => {
                        const categoryShapes = SHAPES.filter(s => s.category === category.id);
                        if (categoryShapes.length === 0) return null;

                        return (
                            <div key={category.id} className={styles.category}>
                                <div className={styles.categoryHeader}>{category.label}</div>
                                <div className={styles.grid}>
                                    {categoryShapes.map((shape) => (
                                        <ShapeButton
                                            key={shape.type}
                                            shape={shape}
                                            isActive={selectedShape === shape.type}
                                            isDark={isDarkMode}
                                            onClick={() => handleShapeSelect(shape.type)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Arrows Tab */}
            {activeTab === 'arrows' && (
                <div className={styles.arrowsContent}>
                    <div className={styles.arrowsGrid}>
                        {ARROWS.map((arrow) => (
                            <ArrowButton
                                key={arrow.id}
                                arrow={arrow}
                                isActive={selectedArrow === arrow.id}
                                isDark={isDarkMode}
                                onClick={() => handleArrowSelect(arrow)}
                            />
                        ))}
                    </div>
                    <div className={styles.hint}>
                        Select arrow type, then connect nodes
                    </div>
                </div>
            )}
        </div>
    );
});

export default ShapeMenu;

// =============================================================================
// Exports
// =============================================================================

export { SHAPES, ARROWS };
export type { ShapeDefinition, ArrowDefinition };
