/**
 * Custom Assertions - Extended assertions for diagram testing
 * 
 * Provides custom expect matchers for common diagram assertions
 * Production-quality assertions with detailed error messages
 */

import { expect, Page } from '@playwright/test';
import { DiagramPage, DiagramElement } from '../pages/DiagramPage';

// =============================================================================
// Element Existence Assertions
// =============================================================================

/**
 * Assert element exists with specific type
 */
export async function expectElementType(
    diagram: DiagramPage,
    elementId: string,
    expectedType: string
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();
    expect(element?.type, `Element ${elementId} should be of type ${expectedType}`).toBe(expectedType);
}

/**
 * Assert element exists
 */
export async function expectElementExists(
    diagram: DiagramPage,
    elementId: string
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();
}

/**
 * Assert element does not exist
 */
export async function expectElementNotExists(
    diagram: DiagramPage,
    elementId: string
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should not exist`).toBeNull();
}

/**
 * Assert multiple elements exist
 */
export async function expectElementsExist(
    diagram: DiagramPage,
    elementIds: string[]
): Promise<void> {
    for (const id of elementIds) {
        const element = await diagram.getElement(id);
        expect(element, `Element ${id} should exist`).not.toBeNull();
    }
}

/**
 * Assert element position (with tolerance)
 */
export async function expectElementPosition(
    diagram: DiagramPage,
    elementId: string,
    expectedX: number,
    expectedY: number,
    tolerance: number = 5
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();

    expect(Math.abs(element!.x - expectedX)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(element!.y - expectedY)).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert element size (with tolerance)
 */
export async function expectElementSize(
    diagram: DiagramPage,
    elementId: string,
    expectedWidth: number,
    expectedHeight: number,
    tolerance: number = 5
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();

    expect(Math.abs(element!.width - expectedWidth)).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(element!.height - expectedHeight)).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert element is selected
 */
export async function expectElementSelected(
    diagram: DiagramPage,
    elementId: string
): Promise<void> {
    const selectedIds = await diagram.getSelectedIds();
    expect(selectedIds, `Element ${elementId} should be selected`).toContain(elementId);
}

/**
 * Assert element is not selected
 */
export async function expectElementNotSelected(
    diagram: DiagramPage,
    elementId: string
): Promise<void> {
    const selectedIds = await diagram.getSelectedIds();
    expect(selectedIds, `Element ${elementId} should not be selected`).not.toContain(elementId);
}

/**
 * Assert multiple elements are selected
 */
export async function expectElementsSelected(
    diagram: DiagramPage,
    elementIds: string[]
): Promise<void> {
    const selectedIds = await diagram.getSelectedIds();

    for (const id of elementIds) {
        expect(selectedIds, `Element ${id} should be selected`).toContain(id);
    }

    expect(selectedIds.length, 'Selection count should match').toBe(elementIds.length);
}

/**
 * Assert no elements are selected
 */
export async function expectNoSelection(diagram: DiagramPage): Promise<void> {
    const selectedIds = await diagram.getSelectedIds();
    expect(selectedIds.length, 'No elements should be selected').toBe(0);
}

/**
 * Assert canvas transform
 */
export async function expectTransform(
    diagram: DiagramPage,
    expected: { x?: number; y?: number; scale?: number },
    tolerance: number = 0.01
): Promise<void> {
    const state = await diagram.getState();
    const transform = state.transform;

    if (expected.x !== undefined) {
        expect(Math.abs(transform.x - expected.x)).toBeLessThanOrEqual(tolerance);
    }
    if (expected.y !== undefined) {
        expect(Math.abs(transform.y - expected.y)).toBeLessThanOrEqual(tolerance);
    }
    if (expected.scale !== undefined) {
        expect(Math.abs(transform.scale - expected.scale)).toBeLessThanOrEqual(tolerance);
    }
}

/**
 * Assert element has property
 */
export async function expectElementProperty(
    diagram: DiagramPage,
    elementId: string,
    property: string,
    expectedValue: unknown
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();

    const actualValue = (element as Record<string, unknown>)[property];
    expect(actualValue, `Element ${elementId}.${property} should be ${expectedValue}`).toBe(expectedValue);
}

/**
 * Assert element count in range
 */
export async function expectElementCountInRange(
    diagram: DiagramPage,
    min: number,
    max: number
): Promise<void> {
    const count = await diagram.getElementCount();
    expect(count).toBeGreaterThanOrEqual(min);
    expect(count).toBeLessThanOrEqual(max);
}

/**
 * Assert elements are aligned horizontally
 */
export async function expectElementsAlignedHorizontally(
    diagram: DiagramPage,
    elementIds: string[],
    tolerance: number = 5
): Promise<void> {
    if (elementIds.length < 2) return;

    const elements = await Promise.all(
        elementIds.map(id => diagram.getElement(id))
    );

    const firstY = elements[0]?.y;
    expect(firstY).toBeDefined();

    for (const element of elements) {
        expect(element).not.toBeNull();
        expect(Math.abs(element!.y - firstY!)).toBeLessThanOrEqual(tolerance);
    }
}

/**
 * Assert elements are aligned vertically
 */
export async function expectElementsAlignedVertically(
    diagram: DiagramPage,
    elementIds: string[],
    tolerance: number = 5
): Promise<void> {
    if (elementIds.length < 2) return;

    const elements = await Promise.all(
        elementIds.map(id => diagram.getElement(id))
    );

    const firstX = elements[0]?.x;
    expect(firstX).toBeDefined();

    for (const element of elements) {
        expect(element).not.toBeNull();
        expect(Math.abs(element!.x - firstX!)).toBeLessThanOrEqual(tolerance);
    }
}

/**
 * Assert elements are evenly distributed horizontally
 */
export async function expectElementsDistributedHorizontally(
    diagram: DiagramPage,
    elementIds: string[],
    tolerance: number = 10
): Promise<void> {
    if (elementIds.length < 3) return;

    const elements = await Promise.all(
        elementIds.map(id => diagram.getElement(id))
    );

    // Sort by x position
    const sorted = elements
        .filter((e): e is DiagramElement => e !== null)
        .sort((a, b) => a.x - b.x);

    // Calculate expected spacing
    const totalWidth = sorted[sorted.length - 1].x - sorted[0].x;
    const expectedSpacing = totalWidth / (sorted.length - 1);

    for (let i = 1; i < sorted.length; i++) {
        const actualSpacing = sorted[i].x - sorted[i - 1].x;
        expect(Math.abs(actualSpacing - expectedSpacing)).toBeLessThanOrEqual(tolerance);
    }
}

/**
 * Assert diagram has unsaved changes
 */
export async function expectUnsavedChanges(
    diagram: DiagramPage,
    expected: boolean
): Promise<void> {
    const hasChanges = await diagram.hasUnsavedChanges();
    expect(hasChanges).toBe(expected);
}

/**
 * Assert tool is active
 */
export async function expectToolActive(
    diagram: DiagramPage,
    tool: string
): Promise<void> {
    const activeTool = await diagram.toolbar.getActiveTool();
    expect(activeTool).toBe(tool);
}

/**
 * Assert undo is available
 */
export async function expectCanUndo(
    diagram: DiagramPage,
    expected: boolean
): Promise<void> {
    const canUndo = await diagram.toolbar.canUndo();
    expect(canUndo).toBe(expected);
}

/**
 * Assert redo is available
 */
export async function expectCanRedo(
    diagram: DiagramPage,
    expected: boolean
): Promise<void> {
    const canRedo = await diagram.toolbar.canRedo();
    expect(canRedo).toBe(expected);
}

/**
 * Assert performance metric is within threshold
 */
export async function expectPerformanceWithin(
    duration: number,
    maxMs: number,
    operation: string
): Promise<void> {
    expect(
        duration,
        `${operation} should complete within ${maxMs}ms, took ${duration}ms`
    ).toBeLessThanOrEqual(maxMs);
}

// =============================================================================
// Bounds and Geometry Assertions
// =============================================================================

/**
 * Assert element is within canvas bounds
 */
export async function expectElementWithinBounds(
    diagram: DiagramPage,
    elementId: string,
    bounds: { minX: number; minY: number; maxX: number; maxY: number }
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();

    expect(element!.x).toBeGreaterThanOrEqual(bounds.minX);
    expect(element!.y).toBeGreaterThanOrEqual(bounds.minY);
    expect(element!.x + element!.width).toBeLessThanOrEqual(bounds.maxX);
    expect(element!.y + element!.height).toBeLessThanOrEqual(bounds.maxY);
}

/**
 * Assert elements overlap
 */
export async function expectElementsOverlap(
    diagram: DiagramPage,
    elementId1: string,
    elementId2: string
): Promise<void> {
    const el1 = await diagram.getElement(elementId1);
    const el2 = await diagram.getElement(elementId2);

    expect(el1, `Element ${elementId1} should exist`).not.toBeNull();
    expect(el2, `Element ${elementId2} should exist`).not.toBeNull();

    const overlap = !(
        el1!.x + el1!.width < el2!.x ||
        el2!.x + el2!.width < el1!.x ||
        el1!.y + el1!.height < el2!.y ||
        el2!.y + el2!.height < el1!.y
    );

    expect(overlap, `Elements ${elementId1} and ${elementId2} should overlap`).toBe(true);
}

/**
 * Assert elements do not overlap
 */
export async function expectElementsNotOverlap(
    diagram: DiagramPage,
    elementId1: string,
    elementId2: string
): Promise<void> {
    const el1 = await diagram.getElement(elementId1);
    const el2 = await diagram.getElement(elementId2);

    expect(el1, `Element ${elementId1} should exist`).not.toBeNull();
    expect(el2, `Element ${elementId2} should exist`).not.toBeNull();

    const overlap = !(
        el1!.x + el1!.width < el2!.x ||
        el2!.x + el2!.width < el1!.x ||
        el1!.y + el1!.height < el2!.y ||
        el2!.y + el2!.height < el1!.y
    );

    expect(overlap, `Elements ${elementId1} and ${elementId2} should not overlap`).toBe(false);
}

// =============================================================================
// State Assertions
// =============================================================================

/**
 * Assert diagram is in clean state (no unsaved changes)
 */
export async function expectCleanState(diagram: DiagramPage): Promise<void> {
    const hasChanges = await diagram.hasUnsavedChanges();
    expect(hasChanges, 'Diagram should have no unsaved changes').toBe(false);
}

/**
 * Assert diagram has unsaved changes
 */
export async function expectDirtyState(diagram: DiagramPage): Promise<void> {
    const hasChanges = await diagram.hasUnsavedChanges();
    expect(hasChanges, 'Diagram should have unsaved changes').toBe(true);
}

/**
 * Assert history state
 */
export async function expectHistoryState(
    diagram: DiagramPage,
    expected: { canUndo: boolean; canRedo: boolean }
): Promise<void> {
    const canUndo = await diagram.toolbar.canUndo();
    const canRedo = await diagram.toolbar.canRedo();

    expect(canUndo, `Should ${expected.canUndo ? '' : 'not '}be able to undo`).toBe(expected.canUndo);
    expect(canRedo, `Should ${expected.canRedo ? '' : 'not '}be able to redo`).toBe(expected.canRedo);
}

// =============================================================================
// Visual Assertions
// =============================================================================

/**
 * Assert element has specific style
 */
export async function expectElementStyle(
    diagram: DiagramPage,
    elementId: string,
    expectedStyle: Partial<{
        strokeColor: string;
        fillColor: string;
        strokeWidth: number;
        opacity: number;
    }>
): Promise<void> {
    const element = await diagram.getElement(elementId);
    expect(element, `Element ${elementId} should exist`).not.toBeNull();

    const el = element as Record<string, unknown>;

    if (expectedStyle.strokeColor !== undefined) {
        expect(el.strokeColor, `Element ${elementId} stroke color`).toBe(expectedStyle.strokeColor);
    }
    if (expectedStyle.fillColor !== undefined) {
        expect(el.fillColor, `Element ${elementId} fill color`).toBe(expectedStyle.fillColor);
    }
    if (expectedStyle.strokeWidth !== undefined) {
        expect(el.strokeWidth, `Element ${elementId} stroke width`).toBe(expectedStyle.strokeWidth);
    }
    if (expectedStyle.opacity !== undefined) {
        expect(el.opacity, `Element ${elementId} opacity`).toBe(expectedStyle.opacity);
    }
}

// =============================================================================
// Timing Assertions
// =============================================================================

/**
 * Assert operation completes within timeout
 */
export async function expectOperationWithinTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string
): Promise<T> {
    const startTime = Date.now();

    const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
    ]);

    const duration = Date.now() - startTime;
    expect(duration, `${operationName} should complete within ${timeoutMs}ms`).toBeLessThanOrEqual(timeoutMs);

    return result;
}

/**
 * Assert element appears within timeout
 */
export async function expectElementAppearsWithin(
    diagram: DiagramPage,
    elementId: string,
    timeoutMs: number = 5000
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const element = await diagram.getElement(elementId);
        if (element) return;
        await diagram.page.waitForTimeout(100);
    }

    throw new Error(`Element ${elementId} did not appear within ${timeoutMs}ms`);
}

/**
 * Assert element disappears within timeout
 */
export async function expectElementDisappearsWithin(
    diagram: DiagramPage,
    elementId: string,
    timeoutMs: number = 5000
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const element = await diagram.getElement(elementId);
        if (!element) return;
        await diagram.page.waitForTimeout(100);
    }

    throw new Error(`Element ${elementId} did not disappear within ${timeoutMs}ms`);
}

// =============================================================================
// Snapshot Assertions
// =============================================================================

/**
 * Assert diagram state matches expected snapshot
 */
export async function expectDiagramStateMatches(
    diagram: DiagramPage,
    expected: {
        elementCount?: number;
        selectedCount?: number;
        transform?: { x?: number; y?: number; scale?: number };
    },
    tolerance: number = 5
): Promise<void> {
    const state = await diagram.getState();

    if (expected.elementCount !== undefined) {
        expect(state.elements.length, 'Element count').toBe(expected.elementCount);
    }

    if (expected.selectedCount !== undefined) {
        expect(state.selectedIds.length, 'Selected count').toBe(expected.selectedCount);
    }

    if (expected.transform) {
        if (expected.transform.x !== undefined) {
            expect(Math.abs(state.transform.x - expected.transform.x), 'Transform X').toBeLessThanOrEqual(tolerance);
        }
        if (expected.transform.y !== undefined) {
            expect(Math.abs(state.transform.y - expected.transform.y), 'Transform Y').toBeLessThanOrEqual(tolerance);
        }
        if (expected.transform.scale !== undefined) {
            expect(Math.abs(state.transform.scale - expected.transform.scale), 'Transform scale').toBeLessThanOrEqual(0.1);
        }
    }
}
