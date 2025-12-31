/**
 * TemplateLibrary - Panel for selecting and adding diagram templates
 *
 * Features:
 * - Category-based template organization
 * - Visual preview of templates
 * - Click to add template to canvas
 * - Dark mode support
 */

import { memo, useCallback, useState, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';
import {
    TEMPLATES,
    TEMPLATE_CATEGORIES,
    type TemplateCategory,
    type DiagramTemplate,
} from '../../templates/node-templates';
import { useXYFlowStore } from '../../xyflow/store';
import type { DiagramNode, DiagramEdge } from '../../xyflow/types';
import styles from './TemplateLibrary.module.css';

// =============================================================================
// Types
// =============================================================================

export interface TemplateLibraryProps {
    isDark?: boolean;
}

// =============================================================================
// Template Preview Component
// =============================================================================

interface TemplatePreviewProps {
    template: DiagramTemplate;
    isDark?: boolean;
}

const TemplatePreview = memo(function TemplatePreview({
    template,
    isDark,
}: TemplatePreviewProps) {
    // Calculate bounds for scaling
    const bounds = useMemo(() => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        template.nodes.forEach((node) => {
            const width = (node.style?.width as number) ?? 100;
            const height = (node.style?.height as number) ?? 60;

            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + width);
            maxY = Math.max(maxY, node.position.y + height);
        });

        return { minX, minY, maxX, maxY };
    }, [template.nodes]);

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const padding = 10;
    const viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${width + padding * 2} ${height + padding * 2}`;

    const nodeColor = isDark ? '#475569' : '#ffffff';
    const strokeColor = isDark ? '#94a3b8' : '#64748b';
    const edgeColor = isDark ? '#64748b' : '#94a3b8';

    return (
        <svg viewBox={viewBox} className={styles.previewSvg} preserveAspectRatio="xMidYMid meet">
            {/* Render edges first (behind nodes) */}
            {template.edges.map((edge, index) => {
                const sourceIndex = parseInt(edge.source.replace('node-', ''), 10);
                const targetIndex = parseInt(edge.target.replace('node-', ''), 10);
                const sourceNode = template.nodes[sourceIndex];
                const targetNode = template.nodes[targetIndex];

                if (!sourceNode || !targetNode) return null;

                const sourceWidth = (sourceNode.style?.width as number) ?? 100;
                const sourceHeight = (sourceNode.style?.height as number) ?? 60;
                const targetWidth = (targetNode.style?.width as number) ?? 100;
                const targetHeight = (targetNode.style?.height as number) ?? 60;

                const x1 = sourceNode.position.x + sourceWidth / 2;
                const y1 = sourceNode.position.y + sourceHeight / 2;
                const x2 = targetNode.position.x + targetWidth / 2;
                const y2 = targetNode.position.y + targetHeight / 2;

                return (
                    <line
                        key={`edge-${index}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        className={styles.previewEdge}
                        stroke={edgeColor}
                    />
                );
            })}

            {/* Render nodes */}
            {template.nodes.map((node, index) => {
                const nodeWidth = (node.style?.width as number) ?? 100;
                const nodeHeight = (node.style?.height as number) ?? 60;
                const x = node.position.x;
                const y = node.position.y;

                // Render different shapes based on type
                switch (node.type) {
                    case 'ellipse':
                    case 'circle':
                        return (
                            <ellipse
                                key={`node-${index}`}
                                cx={x + nodeWidth / 2}
                                cy={y + nodeHeight / 2}
                                rx={nodeWidth / 2}
                                ry={nodeHeight / 2}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    case 'diamond':
                        return (
                            <polygon
                                key={`node-${index}`}
                                points={`
                                    ${x + nodeWidth / 2},${y}
                                    ${x + nodeWidth},${y + nodeHeight / 2}
                                    ${x + nodeWidth / 2},${y + nodeHeight}
                                    ${x},${y + nodeHeight / 2}
                                `}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    case 'rounded-rectangle':
                        return (
                            <rect
                                key={`node-${index}`}
                                x={x}
                                y={y}
                                width={nodeWidth}
                                height={nodeHeight}
                                rx={8}
                                ry={8}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    case 'hexagon':
                        const hx = x;
                        const hy = y;
                        const hw = nodeWidth;
                        const hh = nodeHeight;
                        return (
                            <polygon
                                key={`node-${index}`}
                                points={`
                                    ${hx + hw * 0.25},${hy}
                                    ${hx + hw * 0.75},${hy}
                                    ${hx + hw},${hy + hh / 2}
                                    ${hx + hw * 0.75},${hy + hh}
                                    ${hx + hw * 0.25},${hy + hh}
                                    ${hx},${hy + hh / 2}
                                `}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    case 'cylinder':
                        return (
                            <g key={`node-${index}`}>
                                <ellipse
                                    cx={x + nodeWidth / 2}
                                    cy={y + 10}
                                    rx={nodeWidth / 2}
                                    ry={10}
                                    fill={nodeColor}
                                    stroke={strokeColor}
                                />
                                <rect
                                    x={x}
                                    y={y + 10}
                                    width={nodeWidth}
                                    height={nodeHeight - 20}
                                    fill={nodeColor}
                                    stroke={strokeColor}
                                />
                                <ellipse
                                    cx={x + nodeWidth / 2}
                                    cy={y + nodeHeight - 10}
                                    rx={nodeWidth / 2}
                                    ry={10}
                                    fill={nodeColor}
                                    stroke={strokeColor}
                                />
                            </g>
                        );
                    case 'cloud':
                        return (
                            <ellipse
                                key={`node-${index}`}
                                cx={x + nodeWidth / 2}
                                cy={y + nodeHeight / 2}
                                rx={nodeWidth / 2}
                                ry={nodeHeight / 2}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    case 'parallelogram':
                        const px = x;
                        const py = y;
                        const pw = nodeWidth;
                        const ph = nodeHeight;
                        const offset = pw * 0.15;
                        return (
                            <polygon
                                key={`node-${index}`}
                                points={`
                                    ${px + offset},${py}
                                    ${px + pw},${py}
                                    ${px + pw - offset},${py + ph}
                                    ${px},${py + ph}
                                `}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    case 'sticky':
                        return (
                            <rect
                                key={`node-${index}`}
                                x={x}
                                y={y}
                                width={nodeWidth}
                                height={nodeHeight}
                                fill="#fef08a"
                                stroke="#eab308"
                            />
                        );
                    case 'actor':
                        const ax = x + nodeWidth / 2;
                        const ay = y;
                        return (
                            <g key={`node-${index}`}>
                                <circle cx={ax} cy={ay + 15} r={12} fill={nodeColor} stroke={strokeColor} />
                                <line x1={ax} y1={ay + 27} x2={ax} y2={ay + 60} stroke={strokeColor} strokeWidth={2} />
                                <line x1={ax - 20} y1={ay + 40} x2={ax + 20} y2={ay + 40} stroke={strokeColor} strokeWidth={2} />
                                <line x1={ax} y1={ay + 60} x2={ax - 15} y2={ay + 90} stroke={strokeColor} strokeWidth={2} />
                                <line x1={ax} y1={ay + 60} x2={ax + 15} y2={ay + 90} stroke={strokeColor} strokeWidth={2} />
                            </g>
                        );
                    case 'note':
                        return (
                            <path
                                key={`node-${index}`}
                                d={`M${x},${y} L${x + nodeWidth - 15},${y} L${x + nodeWidth},${y + 15} L${x + nodeWidth},${y + nodeHeight} L${x},${y + nodeHeight} Z M${x + nodeWidth - 15},${y} L${x + nodeWidth - 15},${y + 15} L${x + nodeWidth},${y + 15}`}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                    default:
                        return (
                            <rect
                                key={`node-${index}`}
                                x={x}
                                y={y}
                                width={nodeWidth}
                                height={nodeHeight}
                                className={styles.previewNode}
                                fill={nodeColor}
                                stroke={strokeColor}
                            />
                        );
                }
            })}
        </svg>
    );
});

// =============================================================================
// Template Card Component
// =============================================================================

interface TemplateCardProps {
    template: DiagramTemplate;
    isDark?: boolean;
    onClick: () => void;
}

const TemplateCard = memo(function TemplateCard({
    template,
    isDark,
    onClick,
}: TemplateCardProps) {
    return (
        <button
            className={styles.templateCard}
            onClick={onClick}
            title={`Add ${template.name} template`}
        >
            <div className={styles.templatePreview}>
                <TemplatePreview template={template} isDark={isDark} />
            </div>
            <div className={styles.templateInfo}>
                <div className={styles.templateName}>{template.name}</div>
                <div className={styles.templateDescription}>{template.description}</div>
            </div>
        </button>
    );
});

// =============================================================================
// Main Component
// =============================================================================

export const TemplateLibrary = memo(function TemplateLibrary({
    isDark = false,
}: TemplateLibraryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>('flowchart');

    const { screenToFlowPosition } = useReactFlow();
    const setNodes = useXYFlowStore((s) => s.setNodes);
    const setEdges = useXYFlowStore((s) => s.setEdges);
    const nodes = useXYFlowStore((s) => s.nodes);
    const edges = useXYFlowStore((s) => s.edges);
    const pushHistory = useXYFlowStore((s) => s.pushHistory);

    // Filter templates by category
    const filteredTemplates = useMemo(
        () => TEMPLATES.filter((t) => t.category === activeCategory),
        [activeCategory]
    );

    // Add template to canvas
    const handleAddTemplate = useCallback(
        (template: DiagramTemplate) => {
            // Calculate center of viewport
            const center = screenToFlowPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
            });

            // Calculate template bounds to center it
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            template.nodes.forEach((node) => {
                const width = (node.style?.width as number) ?? 100;
                const height = (node.style?.height as number) ?? 60;
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                maxX = Math.max(maxX, node.position.x + width);
                maxY = Math.max(maxY, node.position.y + height);
            });

            const templateWidth = maxX - minX;
            const templateHeight = maxY - minY;

            // Offset to center template at viewport center
            const offsetX = center.x - templateWidth / 2 - minX;
            const offsetY = center.y - templateHeight / 2 - minY;

            // Generate unique IDs for nodes
            const nodeIdMap = new Map<string, string>();
            const newNodes: DiagramNode[] = template.nodes.map((node, index) => {
                const oldId = `node-${index}`;
                const newId = `${node.type}-${nanoid(8)}`;
                nodeIdMap.set(oldId, newId);

                return {
                    ...node,
                    id: newId,
                    position: {
                        x: node.position.x + offsetX,
                        y: node.position.y + offsetY,
                    },
                    selected: false,
                } as DiagramNode;
            });

            // Generate unique IDs for edges with updated source/target
            const newEdges: DiagramEdge[] = template.edges.map((edge) => ({
                ...edge,
                id: `edge-${nanoid(8)}`,
                source: nodeIdMap.get(edge.source) ?? edge.source,
                target: nodeIdMap.get(edge.target) ?? edge.target,
                type: 'arrow',
            })) as DiagramEdge[];

            // Save history and add to canvas
            pushHistory(`Add template: ${template.name}`);
            setNodes([...nodes, ...newNodes]);
            setEdges([...edges, ...newEdges]);

            // Close panel
            setIsOpen(false);
        },
        [screenToFlowPosition, nodes, edges, setNodes, setEdges, pushHistory]
    );

    const togglePanel = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <div className={`${styles.container} ${isDark ? styles.dark : ''}`}>
            {/* Trigger Button */}
            <button
                className={`${styles.triggerButton} ${isOpen ? styles.triggerButtonActive : ''}`}
                onClick={togglePanel}
                title="Template Library"
            >
                <span className={styles.buttonIcon}>📋</span>
                <span className={styles.buttonLabel}>Templates</span>
            </button>

            {/* Panel */}
            {isOpen && (
                <div className={styles.panel}>
                    {/* Header */}
                    <div className={styles.header}>
                        <span className={styles.title}>Template Library</span>
                        <button
                            className={styles.closeButton}
                            onClick={closePanel}
                            title="Close"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className={styles.categoryTabs}>
                        {(Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]).map((category) => (
                            <button
                                key={category}
                                className={`${styles.categoryTab} ${activeCategory === category ? styles.categoryTabActive : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                <span className={styles.categoryIcon}>
                                    {TEMPLATE_CATEGORIES[category].icon}
                                </span>
                                <span>{TEMPLATE_CATEGORIES[category].label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className={styles.content}>
                        {filteredTemplates.length > 0 ? (
                            <div className={styles.templateGrid}>
                                {filteredTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        isDark={isDark}
                                        onClick={() => handleAddTemplate(template)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📭</span>
                                <span className={styles.emptyText}>No templates in this category</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

export default TemplateLibrary;
