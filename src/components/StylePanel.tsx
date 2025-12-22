/**
 * WB Canvas - Style Panel
 * 
 * Panel for editing element styles (stroke, fill, text)
 */

import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCanvasStore, selectSelectedElements } from '../store/canvas-store';
import { StrokeStyle, FillStyle, StickyColor, STICKY_COLORS } from '../types/canvas';

const COLORS = [
    '#1e1e1e', '#374151', '#6b7280', '#9ca3af',
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
];

const STROKE_WIDTHS = [1, 2, 3, 4, 6, 8];

export const StylePanel = memo(function StylePanel() {
    const selectedElements = useCanvasStore(selectSelectedElements);
    const currentStroke = useCanvasStore((s) => s.currentStroke);
    const currentFill = useCanvasStore((s) => s.currentFill);
    const setStroke = useCanvasStore((s) => s.setStroke);
    const setFill = useCanvasStore((s) => s.setFill);
    const updateElement = useCanvasStore((s) => s.updateElement);

    const [expandedSections, setExpandedSections] = useState({
        stroke: true,
        fill: true,
        text: false,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    // Get current values from selection or defaults
    const stroke = selectedElements.length === 1 && 'stroke' in selectedElements[0]
        ? (selectedElements[0] as { stroke: StrokeStyle }).stroke
        : currentStroke;

    const fill = selectedElements.length === 1 && 'fill' in selectedElements[0]
        ? (selectedElements[0] as { fill: FillStyle }).fill
        : currentFill;

    // Update handlers
    const handleStrokeChange = (updates: Partial<StrokeStyle>) => {
        setStroke(updates);
        selectedElements.forEach((el) => {
            if ('stroke' in el) {
                updateElement(el.id, { stroke: { ...el.stroke, ...updates } } as Partial<typeof el>);
            }
        });
    };

    const handleFillChange = (updates: Partial<FillStyle>) => {
        setFill(updates);
        selectedElements.forEach((el) => {
            if ('fill' in el) {
                updateElement(el.id, { fill: { ...el.fill, ...updates } } as Partial<typeof el>);
            }
        });
    };

    return (
        <div className="panel panel-right">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                Style
            </h3>

            {/* Stroke Section */}
            <Section
                title="Stroke"
                expanded={expandedSections.stroke}
                onToggle={() => toggleSection('stroke')}
            >
                <div className="space-y-3">
                    {/* Stroke Color */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Color</label>
                        <div className="color-grid">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    className={`color-swatch ${stroke.color === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleStrokeChange({ color })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Stroke Width */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Width</label>
                        <div className="flex gap-1">
                            {STROKE_WIDTHS.map((width) => (
                                <button
                                    key={width}
                                    className={`flex-1 h-8 rounded border ${stroke.width === width
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleStrokeChange({ width })}
                                >
                                    <div
                                        className="mx-auto bg-current rounded-full"
                                        style={{ width: width * 2, height: width * 2 }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stroke Style */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Style</label>
                        <div className="flex gap-1">
                            {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                                <button
                                    key={style}
                                    className={`flex-1 h-8 rounded border flex items-center justify-center ${stroke.style === style
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleStrokeChange({ style })}
                                >
                                    <svg width="40" height="2" className="text-gray-600">
                                        <line
                                            x1="0"
                                            y1="1"
                                            x2="40"
                                            y2="1"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeDasharray={
                                                style === 'dashed' ? '6 3' : style === 'dotted' ? '2 2' : undefined
                                            }
                                        />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>

            {/* Fill Section */}
            <Section
                title="Fill"
                expanded={expandedSections.fill}
                onToggle={() => toggleSection('fill')}
            >
                <div className="space-y-3">
                    {/* Fill Type */}
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Type</label>
                        <div className="flex gap-1">
                            {(['solid', 'hachure', 'none'] as const).map((type) => (
                                <button
                                    key={type}
                                    className={`flex-1 h-8 rounded border text-xs capitalize ${fill.type === type
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                                            : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600'
                                        }`}
                                    onClick={() => handleFillChange({ type })}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fill Color */}
                    {fill.type !== 'none' && (
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Color</label>
                            <div className="color-grid">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className={`color-swatch ${fill.color === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => handleFillChange({ color })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Sticky Colors (when sticky note selected) */}
            {selectedElements.some((el) => el.type === 'sticky') && (
                <Section
                    title="Sticky Color"
                    expanded={true}
                    onToggle={() => { }}
                >
                    <div className="flex gap-2">
                        {(Object.keys(STICKY_COLORS) as StickyColor[]).map((color) => (
                            <button
                                key={color}
                                className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-gray-300"
                                style={{ backgroundColor: STICKY_COLORS[color] }}
                                onClick={() => {
                                    selectedElements.forEach((el) => {
                                        if (el.type === 'sticky') {
                                            updateElement(el.id, { color } as Partial<typeof el>);
                                        }
                                    });
                                }}
                            />
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
});

// =============================================================================
// Section Component
// =============================================================================

interface SectionProps {
    title: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
    return (
        <div className="mb-4">
            <button
                className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
                onClick={onToggle}
            >
                {title}
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expanded && <div className="pt-2">{children}</div>}
        </div>
    );
}
