/**
 * Diagram Helpers - Utility functions for creating test diagrams
 * 
 * Provides helper functions for quickly creating test scenarios
 * Production-quality helpers with retry logic and error handling
 */

import { DiagramPage } from '../pages/DiagramPage';
import { ToolType } from '../pages/ToolbarComponent';
import { Point } from '../pages/CanvasComponent';
import { TIMING, RETRY_CONFIG } from './fixtures';

export interface ShapeConfig {
    type: ToolType;
    from: Point;
    to: Point;
    shift?: boolean;
}

export interface DiagramConfig {
    name?: string;
    shapes: ShapeConfig[];
    connectors?: Array<{
        fromShape: number;
        toShape: number;
    }>;
}

// =============================================================================
// Retry Wrapper
// =============================================================================

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: { maxRetries?: number; retryDelay?: number; operationName?: string } = {}
): Promise<T> {
    const { maxRetries = RETRY_CONFIG.maxRetries, retryDelay = RETRY_CONFIG.retryDelay, operationName = 'Operation' } = options;

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }

    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Create a simple rectangle
 */
export async function createRectangle(
    diagram: DiagramPage,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<string> {
    await diagram.toolbar.selectTool('rectangle');
    return diagram.canvas.draw(
        { x, y },
        { x: x + width, y: y + height }
    );
}

/**
 * Create a simple ellipse
 */
export async function createEllipse(
    diagram: DiagramPage,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<string> {
    await diagram.toolbar.selectTool('ellipse');
    return diagram.canvas.draw(
        { x, y },
        { x: x + width, y: y + height }
    );
}

/**
 * Create a diamond shape
 */
export async function createDiamond(
    diagram: DiagramPage,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<string> {
    await diagram.toolbar.selectTool('diamond');
    return diagram.canvas.draw(
        { x, y },
        { x: x + width, y: y + height }
    );
}

/**
 * Create a line
 */
export async function createLine(
    diagram: DiagramPage,
    from: Point,
    to: Point
): Promise<string> {
    await diagram.toolbar.selectTool('line');
    return diagram.canvas.draw(from, to);
}

/**
 * Create an arrow
 */
export async function createArrow(
    diagram: DiagramPage,
    from: Point,
    to: Point
): Promise<string> {
    await diagram.toolbar.selectTool('arrow');
    return diagram.canvas.draw(from, to);
}

/**
 * Create a text element
 */
export async function createText(
    diagram: DiagramPage,
    x: number,
    y: number,
    text?: string
): Promise<string> {
    await diagram.toolbar.selectTool('text');
    const id = await diagram.canvas.draw(
        { x, y },
        { x: x + 100, y: y + 30 }
    );

    if (text) {
        await diagram.canvas.typeText(text);
        await diagram.canvas.confirmText();
    }

    return id;
}

/**
 * Create multiple shapes at once
 */
export async function createShapes(
    diagram: DiagramPage,
    shapes: ShapeConfig[]
): Promise<string[]> {
    const ids: string[] = [];

    for (const shape of shapes) {
        await diagram.toolbar.selectTool(shape.type);
        const id = await diagram.canvas.draw(shape.from, shape.to, { shift: shape.shift });
        ids.push(id);
    }

    return ids;
}

/**
 * Create a complete diagram from config
 */
export async function createDiagram(
    diagram: DiagramPage,
    config: DiagramConfig
): Promise<{ shapeIds: string[]; connectorIds: string[] }> {
    if (config.name) {
        await diagram.createNewDiagram(config.name);
    }

    const shapeIds = await createShapes(diagram, config.shapes);
    const connectorIds: string[] = [];

    // Connectors would be created here if supported
    // For now, just return empty array

    return { shapeIds, connectorIds };
}

/**
 * Create a flowchart-like diagram
 */
export async function createFlowchart(
    diagram: DiagramPage,
    nodeCount: number = 3
): Promise<string[]> {
    const ids: string[] = [];
    const startX = 100;
    const startY = 100;
    const spacing = 150;

    for (let i = 0; i < nodeCount; i++) {
        const x = startX + i * spacing;
        const y = startY;

        // Alternate between rectangles and diamonds
        if (i % 2 === 0) {
            const id = await createRectangle(diagram, x, y, 100, 60);
            ids.push(id);
        } else {
            const id = await createDiamond(diagram, x, y, 80, 80);
            ids.push(id);
        }
    }

    return ids;
}

/**
 * Create a grid of shapes
 */
export async function createShapeGrid(
    diagram: DiagramPage,
    rows: number,
    cols: number,
    shapeType: ToolType = 'rectangle'
): Promise<string[]> {
    const ids: string[] = [];
    const startX = 100;
    const startY = 100;
    const width = 80;
    const height = 60;
    const spacingX = 120;
    const spacingY = 100;

    await diagram.toolbar.selectTool(shapeType);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = startX + col * spacingX;
            const y = startY + row * spacingY;
            const id = await diagram.canvas.draw(
                { x, y },
                { x: x + width, y: y + height }
            );
            ids.push(id);
        }
    }

    return ids;
}

/**
 * Create a large diagram for performance testing
 */
export async function createLargeDiagram(
    diagram: DiagramPage,
    elementCount: number
): Promise<string[]> {
    const ids: string[] = [];
    const cols = Math.ceil(Math.sqrt(elementCount));
    const spacing = 100;

    await diagram.toolbar.selectTool('rectangle');

    for (let i = 0; i < elementCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 50 + col * spacing;
        const y = 50 + row * spacing;

        const id = await diagram.canvas.draw(
            { x, y },
            { x: x + 60, y: y + 40 }
        );
        ids.push(id);

        // Small delay every 10 elements to prevent overwhelming
        if (i % 10 === 9) {
            await diagram.page.waitForTimeout(50);
        }
    }

    return ids;
}

/**
 * Wait for element to be created
 */
export async function waitForElement(
    diagram: DiagramPage,
    elementId: string,
    timeout: number = 5000
): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = await diagram.getElement(elementId);
        if (element) return true;
        await diagram.page.waitForTimeout(100);
    }

    return false;
}

/**
 * Wait for element count to reach expected value
 */
export async function waitForElementCount(
    diagram: DiagramPage,
    expectedCount: number,
    timeout: number = 5000
): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const count = await diagram.getElementCount();
        if (count === expectedCount) return true;
        await diagram.page.waitForTimeout(100);
    }

    return false;
}

/**
 * Clear and reset diagram
 */
export async function resetDiagram(diagram: DiagramPage): Promise<void> {
    await diagram.clearCanvas();
    await diagram.toolbar.selectTool('select');
    await diagram.page.waitForTimeout(100);
}

// =============================================================================
// Advanced Shape Creation
// =============================================================================

/**
 * Create a connector between two elements
 */
export async function createConnector(
    diagram: DiagramPage,
    fromElementId: string,
    toElementId: string,
    type: 'line' | 'arrow' = 'arrow'
): Promise<string> {
    const fromElement = await diagram.getElement(fromElementId);
    const toElement = await diagram.getElement(toElementId);

    if (!fromElement || !toElement) {
        throw new Error('Source or target element not found');
    }

    // Calculate connection points (center-right to center-left)
    const fromPoint: Point = {
        x: fromElement.x + fromElement.width,
        y: fromElement.y + fromElement.height / 2,
    };
    const toPoint: Point = {
        x: toElement.x,
        y: toElement.y + toElement.height / 2,
    };

    await diagram.toolbar.selectTool(type);
    return diagram.canvas.draw(fromPoint, toPoint);
}

/**
 * Create a complete flowchart with connections
 */
export async function createConnectedFlowchart(
    diagram: DiagramPage,
    nodeCount: number = 4
): Promise<{ nodeIds: string[]; connectorIds: string[] }> {
    const nodeIds = await createFlowchart(diagram, nodeCount);
    const connectorIds: string[] = [];

    // Create connections between consecutive nodes
    for (let i = 0; i < nodeIds.length - 1; i++) {
        try {
            const connectorId = await createConnector(diagram, nodeIds[i], nodeIds[i + 1]);
            connectorIds.push(connectorId);
        } catch {
            // Connection might fail if elements are too close
        }
    }

    return { nodeIds, connectorIds };
}

/**
 * Create a sticky note
 */
export async function createStickyNote(
    diagram: DiagramPage,
    x: number,
    y: number,
    text?: string
): Promise<string> {
    await diagram.toolbar.selectTool('sticky');
    const id = await diagram.canvas.draw(
        { x, y },
        { x: x + 200, y: y + 200 }
    );

    if (text) {
        await diagram.canvas.typeText(text);
        await diagram.canvas.confirmText();
    }

    return id;
}

/**
 * Create a frame around elements
 */
export async function createFrame(
    diagram: DiagramPage,
    x: number,
    y: number,
    width: number,
    height: number,
    name?: string
): Promise<string> {
    await diagram.toolbar.selectTool('frame');
    const id = await diagram.canvas.draw(
        { x, y },
        { x: x + width, y: y + height }
    );

    if (name) {
        await diagram.canvas.typeText(name);
        await diagram.canvas.confirmText();
    }

    return id;
}

// =============================================================================
// Batch Operations
// =============================================================================

/**
 * Create multiple elements in parallel (where possible)
 */
export async function createElementsBatch(
    diagram: DiagramPage,
    configs: Array<{ type: ToolType; x: number; y: number; width: number; height: number }>
): Promise<string[]> {
    const ids: string[] = [];

    for (const config of configs) {
        await diagram.toolbar.selectTool(config.type);
        const id = await diagram.canvas.draw(
            { x: config.x, y: config.y },
            { x: config.x + config.width, y: config.y + config.height }
        );
        ids.push(id);
    }

    return ids;
}

/**
 * Select multiple elements by IDs
 */
export async function selectMultipleElements(
    diagram: DiagramPage,
    elementIds: string[]
): Promise<void> {
    if (elementIds.length === 0) return;

    await diagram.canvas.deselectAll();
    await diagram.canvas.selectElements(elementIds);
}

/**
 * Delete multiple elements
 */
export async function deleteElements(
    diagram: DiagramPage,
    elementIds: string[]
): Promise<void> {
    await selectMultipleElements(diagram, elementIds);
    await diagram.toolbar.deleteSelected();
}

// =============================================================================
// Verification Helpers
// =============================================================================

/**
 * Verify element was created successfully
 */
export async function verifyElementCreated(
    diagram: DiagramPage,
    elementId: string,
    expectedType?: ToolType
): Promise<boolean> {
    const element = await diagram.getElement(elementId);

    if (!element) return false;
    if (expectedType && element.type !== expectedType) return false;

    return true;
}

/**
 * Get element center point
 */
export async function getElementCenter(
    diagram: DiagramPage,
    elementId: string
): Promise<Point | null> {
    const element = await diagram.getElement(elementId);
    if (!element) return null;

    return {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
    };
}

/**
 * Get bounding box of multiple elements
 */
export async function getElementsBoundingBox(
    diagram: DiagramPage,
    elementIds: string[]
): Promise<{ x: number; y: number; width: number; height: number } | null> {
    const elements = await Promise.all(
        elementIds.map(id => diagram.getElement(id))
    );

    const validElements = elements.filter(e => e !== null);
    if (validElements.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const el of validElements) {
        if (!el) continue;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

// =============================================================================
// Performance Measurement
// =============================================================================

/**
 * Measure operation duration
 */
export async function measureOperation<T>(
    operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    return { result, duration };
}

/**
 * Create elements and measure performance
 */
export async function createElementsWithTiming(
    diagram: DiagramPage,
    count: number,
    type: ToolType = 'rectangle'
): Promise<{ ids: string[]; totalDuration: number; avgDuration: number }> {
    const ids: string[] = [];
    const startTime = Date.now();

    await diagram.toolbar.selectTool(type);

    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 100;

    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 50 + col * spacing;
        const y = 50 + row * spacing;

        const id = await diagram.canvas.draw(
            { x, y },
            { x: x + 60, y: y + 40 }
        );
        ids.push(id);
    }

    const totalDuration = Date.now() - startTime;

    return {
        ids,
        totalDuration,
        avgDuration: totalDuration / count,
    };
}

// =============================================================================
// State Snapshot
// =============================================================================

/**
 * Take a snapshot of diagram state for comparison
 */
export async function takeDiagramSnapshot(diagram: DiagramPage): Promise<{
    elementCount: number;
    selectedCount: number;
    elementIds: string[];
    transform: { x: number; y: number; scale: number };
}> {
    const state = await diagram.getState();

    return {
        elementCount: state.elements.length,
        selectedCount: state.selectedIds.length,
        elementIds: state.elements.map(e => e.id),
        transform: state.transform,
    };
}

/**
 * Compare two diagram snapshots
 */
export function compareDiagramSnapshots(
    before: Awaited<ReturnType<typeof takeDiagramSnapshot>>,
    after: Awaited<ReturnType<typeof takeDiagramSnapshot>>
): {
    elementsAdded: number;
    elementsRemoved: number;
    selectionChanged: boolean;
    transformChanged: boolean;
} {
    const beforeIds = new Set(before.elementIds);
    const afterIds = new Set(after.elementIds);

    const added = [...afterIds].filter(id => !beforeIds.has(id)).length;
    const removed = [...beforeIds].filter(id => !afterIds.has(id)).length;

    return {
        elementsAdded: added,
        elementsRemoved: removed,
        selectionChanged: before.selectedCount !== after.selectedCount,
        transformChanged:
            before.transform.x !== after.transform.x ||
            before.transform.y !== after.transform.y ||
            before.transform.scale !== after.transform.scale,
    };
}
