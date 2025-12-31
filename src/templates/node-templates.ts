/**
 * Node Templates
 *
 * Pre-defined diagram templates for quick start
 */

import type { DiagramNode, DiagramEdge } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

export type TemplateCategory = 'flowchart' | 'uml' | 'network' | 'mindmap';

export interface DiagramTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    nodes: Omit<DiagramNode, 'id'>[];
    edges: Omit<DiagramEdge, 'id'>[];
    thumbnail?: string;
}

// =============================================================================
// Category Metadata
// =============================================================================

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string }> = {
    flowchart: { label: 'Flowchart', icon: '📊' },
    uml: { label: 'UML', icon: '📐' },
    network: { label: 'Network', icon: '🌐' },
    mindmap: { label: 'Mind Map', icon: '🧠' },
};

// =============================================================================
// Templates
// =============================================================================

export const TEMPLATES: DiagramTemplate[] = [
    // =========================================================================
    // Flowchart Templates
    // =========================================================================
    {
        id: 'simple-flowchart',
        name: 'Simple Flowchart',
        description: 'Basic decision flow with start, decision, and end nodes',
        category: 'flowchart',
        nodes: [
            {
                type: 'rounded-rectangle',
                position: { x: 0, y: 0 },
                data: { label: 'Start', width: 120, height: 60 },
                style: { width: 120, height: 60 },
            },
            {
                type: 'diamond',
                position: { x: -20, y: 120 },
                data: { label: 'Decision?', width: 160, height: 160 },
                style: { width: 160, height: 160 },
            },
            {
                type: 'rectangle',
                position: { x: -180, y: 340 },
                data: { label: 'Yes Path', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'rectangle',
                position: { x: 100, y: 340 },
                data: { label: 'No Path', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'rounded-rectangle',
                position: { x: 0, y: 480 },
                data: { label: 'End', width: 120, height: 60 },
                style: { width: 120, height: 60 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-1', data: {} },
            { source: 'node-1', target: 'node-2', data: { label: 'Yes' } },
            { source: 'node-1', target: 'node-3', data: { label: 'No' } },
            { source: 'node-2', target: 'node-4', data: {} },
            { source: 'node-3', target: 'node-4', data: {} },
        ],
    },
    {
        id: 'process-flow',
        name: 'Process Flow',
        description: 'Linear process with input, processing, and output stages',
        category: 'flowchart',
        nodes: [
            {
                type: 'parallelogram',
                position: { x: 0, y: 0 },
                data: { label: 'Input Data', width: 180, height: 80 },
                style: { width: 180, height: 80 },
            },
            {
                type: 'rectangle',
                position: { x: 10, y: 130 },
                data: { label: 'Process Step 1', width: 160, height: 70 },
                style: { width: 160, height: 70 },
            },
            {
                type: 'rectangle',
                position: { x: 10, y: 250 },
                data: { label: 'Process Step 2', width: 160, height: 70 },
                style: { width: 160, height: 70 },
            },
            {
                type: 'cylinder',
                position: { x: 20, y: 370 },
                data: { label: 'Store Data', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
            {
                type: 'parallelogram',
                position: { x: 0, y: 520 },
                data: { label: 'Output Result', width: 180, height: 80 },
                style: { width: 180, height: 80 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-1', data: {} },
            { source: 'node-1', target: 'node-2', data: {} },
            { source: 'node-2', target: 'node-3', data: {} },
            { source: 'node-3', target: 'node-4', data: {} },
        ],
    },

    // =========================================================================
    // UML Templates
    // =========================================================================
    {
        id: 'use-case',
        name: 'Use Case Diagram',
        description: 'Actor interacting with system use cases',
        category: 'uml',
        nodes: [
            {
                type: 'actor',
                position: { x: 0, y: 100 },
                data: { label: 'User', width: 80, height: 120 },
                style: { width: 80, height: 120 },
            },
            {
                type: 'ellipse',
                position: { x: 180, y: 0 },
                data: { label: 'Login', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'ellipse',
                position: { x: 180, y: 120 },
                data: { label: 'View Dashboard', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'ellipse',
                position: { x: 180, y: 240 },
                data: { label: 'Edit Profile', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'note',
                position: { x: 380, y: 100 },
                data: { label: 'System boundary includes all use cases', width: 160, height: 100 },
                style: { width: 160, height: 100 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-1', data: {} },
            { source: 'node-0', target: 'node-2', data: {} },
            { source: 'node-0', target: 'node-3', data: {} },
        ],
    },
    {
        id: 'class-diagram',
        name: 'Class Diagram',
        description: 'Simple class hierarchy with inheritance',
        category: 'uml',
        nodes: [
            {
                type: 'rectangle',
                position: { x: 100, y: 0 },
                data: { label: '«abstract»\nShape', width: 160, height: 80 },
                style: { width: 160, height: 80 },
            },
            {
                type: 'rectangle',
                position: { x: 0, y: 160 },
                data: { label: 'Circle\n─────\n+ radius: number', width: 160, height: 90 },
                style: { width: 160, height: 90 },
            },
            {
                type: 'rectangle',
                position: { x: 200, y: 160 },
                data: { label: 'Rectangle\n─────\n+ width: number\n+ height: number', width: 160, height: 100 },
                style: { width: 160, height: 100 },
            },
        ],
        edges: [
            { source: 'node-1', target: 'node-0', data: { label: 'extends' } },
            { source: 'node-2', target: 'node-0', data: { label: 'extends' } },
        ],
    },

    // =========================================================================
    // Network Templates
    // =========================================================================
    {
        id: 'client-server',
        name: 'Client-Server',
        description: 'Basic client-server architecture',
        category: 'network',
        nodes: [
            {
                type: 'rectangle',
                position: { x: 0, y: 0 },
                data: { label: '🖥️ Client', width: 140, height: 80 },
                style: { width: 140, height: 80 },
            },
            {
                type: 'rectangle',
                position: { x: 0, y: 150 },
                data: { label: '🖥️ Client', width: 140, height: 80 },
                style: { width: 140, height: 80 },
            },
            {
                type: 'cloud',
                position: { x: 200, y: 50 },
                data: { label: 'Internet', width: 160, height: 100 },
                style: { width: 160, height: 100 },
            },
            {
                type: 'cylinder',
                position: { x: 420, y: 0 },
                data: { label: '🗄️ Server', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
            {
                type: 'cylinder',
                position: { x: 420, y: 150 },
                data: { label: '💾 Database', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-2', data: {} },
            { source: 'node-1', target: 'node-2', data: {} },
            { source: 'node-2', target: 'node-3', data: {} },
            { source: 'node-3', target: 'node-4', data: {} },
        ],
    },
    {
        id: 'microservices',
        name: 'Microservices',
        description: 'Microservices architecture with API gateway',
        category: 'network',
        nodes: [
            {
                type: 'rectangle',
                position: { x: 150, y: 0 },
                data: { label: '🌐 API Gateway', width: 160, height: 70 },
                style: { width: 160, height: 70 },
            },
            {
                type: 'rectangle',
                position: { x: 0, y: 140 },
                data: { label: '👤 User Service', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'rectangle',
                position: { x: 160, y: 140 },
                data: { label: '📦 Order Service', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'rectangle',
                position: { x: 320, y: 140 },
                data: { label: '💳 Payment Service', width: 140, height: 70 },
                style: { width: 140, height: 70 },
            },
            {
                type: 'hexagon',
                position: { x: 160, y: 280 },
                data: { label: '📨 Message Queue', width: 140, height: 80 },
                style: { width: 140, height: 80 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-1', data: {} },
            { source: 'node-0', target: 'node-2', data: {} },
            { source: 'node-0', target: 'node-3', data: {} },
            { source: 'node-1', target: 'node-4', data: {} },
            { source: 'node-2', target: 'node-4', data: {} },
            { source: 'node-3', target: 'node-4', data: {} },
        ],
    },

    // =========================================================================
    // Mind Map Templates
    // =========================================================================
    {
        id: 'brainstorm',
        name: 'Brainstorm',
        description: 'Central idea with branching thoughts',
        category: 'mindmap',
        nodes: [
            {
                type: 'ellipse',
                position: { x: 200, y: 150 },
                data: { label: '💡 Main Idea', width: 160, height: 80 },
                style: { width: 160, height: 80 },
            },
            {
                type: 'rounded-rectangle',
                position: { x: 0, y: 0 },
                data: { label: 'Topic 1', width: 120, height: 60 },
                style: { width: 120, height: 60 },
            },
            {
                type: 'rounded-rectangle',
                position: { x: 400, y: 0 },
                data: { label: 'Topic 2', width: 120, height: 60 },
                style: { width: 120, height: 60 },
            },
            {
                type: 'rounded-rectangle',
                position: { x: 0, y: 280 },
                data: { label: 'Topic 3', width: 120, height: 60 },
                style: { width: 120, height: 60 },
            },
            {
                type: 'rounded-rectangle',
                position: { x: 400, y: 280 },
                data: { label: 'Topic 4', width: 120, height: 60 },
                style: { width: 120, height: 60 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-1', data: {} },
            { source: 'node-0', target: 'node-2', data: {} },
            { source: 'node-0', target: 'node-3', data: {} },
            { source: 'node-0', target: 'node-4', data: {} },
        ],
    },
    {
        id: 'project-plan',
        name: 'Project Plan',
        description: 'Project structure with phases and tasks',
        category: 'mindmap',
        nodes: [
            {
                type: 'rectangle',
                position: { x: 180, y: 0 },
                data: { label: '🎯 Project Goal', width: 160, height: 70 },
                style: { width: 160, height: 70 },
            },
            {
                type: 'sticky',
                position: { x: 0, y: 120 },
                data: { label: '📋 Phase 1\nPlanning', stickyColor: 'yellow', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
            {
                type: 'sticky',
                position: { x: 180, y: 120 },
                data: { label: '🔨 Phase 2\nDevelopment', stickyColor: 'blue', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
            {
                type: 'sticky',
                position: { x: 360, y: 120 },
                data: { label: '✅ Phase 3\nTesting', stickyColor: 'green', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
            {
                type: 'sticky',
                position: { x: 180, y: 280 },
                data: { label: '🚀 Phase 4\nDeployment', stickyColor: 'purple', width: 140, height: 100 },
                style: { width: 140, height: 100 },
            },
        ],
        edges: [
            { source: 'node-0', target: 'node-1', data: {} },
            { source: 'node-0', target: 'node-2', data: {} },
            { source: 'node-0', target: 'node-3', data: {} },
            { source: 'node-1', target: 'node-2', data: { label: 'next' } },
            { source: 'node-2', target: 'node-3', data: { label: 'next' } },
            { source: 'node-3', target: 'node-4', data: { label: 'next' } },
        ],
    },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): DiagramTemplate[] {
    return TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DiagramTemplate | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
