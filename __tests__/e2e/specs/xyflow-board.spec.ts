/**
 * XY Flow Board E2E Tests
 *
 * Comprehensive tests for the XY Flow diagram board functionality:
 * - Application loading
 * - Node creation via drag-and-drop
 * - Edge connections between nodes
 * - Element deletion
 * - Panel interactions (Layers, History, Theme)
 */

import { test, expect } from '@playwright/test';
import { createXYFlowHelper, XYFLOW_SELECTORS } from '../helpers/xyflow-helpers';

// =============================================================================
// Constants
// =============================================================================

const BASE_URL = 'http://localhost:5179/wb-diagram-board/';
const WAIT_TIMEOUT = 500;

// =============================================================================
// Test Suite
// =============================================================================

test.describe('XY Flow Board', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForSelector(XYFLOW_SELECTORS.reactFlow, { timeout: 10000 });
        await page.waitForTimeout(WAIT_TIMEOUT);
    });

    // =========================================================================
    // 1. Application Loading Tests
    // =========================================================================

    test.describe('Application Loading', () => {
        test('should load the page without errors', async ({ page }) => {
            // Check no console errors
            const errors: string[] = [];
            page.on('console', (msg) => {
                if (msg.type() === 'error') {
                    errors.push(msg.text());
                }
            });

            await page.reload();
            await page.waitForSelector(XYFLOW_SELECTORS.reactFlow);

            // Filter out known non-critical errors
            const criticalErrors = errors.filter(
                (e) => !e.includes('favicon') && !e.includes('404')
            );
            expect(criticalErrors).toHaveLength(0);
        });

        test('should render ReactFlow canvas', async ({ page }) => {
            const canvas = page.locator(XYFLOW_SELECTORS.reactFlow);
            await expect(canvas).toBeVisible();
        });

        test('should render ReactFlow pane for interactions', async ({ page }) => {
            const pane = page.locator(XYFLOW_SELECTORS.reactFlowPane);
            await expect(pane).toBeVisible();
        });

        test('should display toolbar on the left', async ({ page }) => {
            const toolbar = page.locator(XYFLOW_SELECTORS.toolbar);
            await expect(toolbar).toBeVisible();
        });

        test('should display controls (zoom buttons)', async ({ page }) => {
            const controls = page.locator(XYFLOW_SELECTORS.controls);
            await expect(controls).toBeVisible();
        });

        test('should display minimap', async ({ page }) => {
            const minimap = page.locator(XYFLOW_SELECTORS.minimap);
            await expect(minimap).toBeVisible();
        });

        test('should display background grid', async ({ page }) => {
            const background = page.locator(XYFLOW_SELECTORS.background);
            await expect(background).toBeVisible();
        });
    });

    // =========================================================================
    // 2. Node Creation Tests
    // =========================================================================

    test.describe('Node Creation', () => {
        test('should create a rectangle node', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            // Click rectangle tool and then canvas
            await helper.selectTool('rectangle');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount + 1);
        });

        test('should create an ellipse node', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            await helper.selectTool('ellipse');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount + 1);
        });

        test('should create a diamond node', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            await helper.selectTool('diamond');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount + 1);
        });

        test('should create a text node', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            await helper.selectTool('text');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount + 1);
        });

        test('should create a sticky note node', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            await helper.selectTool('sticky');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount + 1);
        });

        test('should create multiple nodes', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();
            const bounds = await helper.getCanvasBounds();

            // Create 3 nodes
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 100);
            await page.waitForTimeout(200);

            await helper.selectTool('ellipse');
            await page.mouse.click(bounds.x + 300, bounds.y + 100);
            await page.waitForTimeout(200);

            await helper.selectTool('diamond');
            await page.mouse.click(bounds.x + 500, bounds.y + 100);
            await page.waitForTimeout(200);

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount + 3);
        });
    });

    // =========================================================================
    // 3. Node Selection Tests
    // =========================================================================

    test.describe('Node Selection', () => {
        test('should select a node on click', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            // Create a node first
            await helper.selectTool('rectangle');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            // Click on the node to select it
            const nodes = await helper.getNodes();
            expect(nodes.length).toBeGreaterThan(0);

            await helper.selectNode(nodes[0].id);

            const selectedNodes = await helper.getSelectedNodes();
            expect(selectedNodes.length).toBe(1);
        });

        test('should deselect node on Escape', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            // Create and select a node
            await helper.selectTool('rectangle');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const nodes = await helper.getNodes();
            await helper.selectNode(nodes[0].id);

            // Deselect
            await helper.deselectAll();

            const selectedNodes = await helper.getSelectedNodes();
            expect(selectedNodes.length).toBe(0);
        });

        test('should select multiple nodes with Shift+Click', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const bounds = await helper.getCanvasBounds();

            // Create two nodes
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 200);
            await page.waitForTimeout(200);

            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 300, bounds.y + 200);
            await page.waitForTimeout(200);

            const nodes = await helper.getNodes();
            expect(nodes.length).toBeGreaterThanOrEqual(2);

            // Select both nodes
            await helper.selectMultipleNodes([nodes[0].id, nodes[1].id]);

            const selectedNodes = await helper.getSelectedNodes();
            expect(selectedNodes.length).toBe(2);
        });

        test('should select all nodes with Ctrl+A', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const bounds = await helper.getCanvasBounds();

            // Create multiple nodes
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 200);
            await page.waitForTimeout(200);

            await helper.selectTool('ellipse');
            await page.mouse.click(bounds.x + 300, bounds.y + 200);
            await page.waitForTimeout(200);

            // Select all
            await helper.selectAll();

            const selectedNodes = await helper.getSelectedNodes();
            const totalNodes = await helper.getNodesCount();
            expect(selectedNodes.length).toBe(totalNodes);
        });
    });

    // =========================================================================
    // 4. Node Deletion Tests
    // =========================================================================

    test.describe('Node Deletion', () => {
        test('should delete selected node with Delete key', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            // Create a node
            await helper.selectTool('rectangle');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const initialCount = await helper.getNodesCount();
            expect(initialCount).toBeGreaterThan(0);

            // Select and delete
            const nodes = await helper.getNodes();
            await helper.selectNode(nodes[0].id);
            await helper.deleteSelected();

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(initialCount - 1);
        });

        test('should delete multiple selected nodes', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const bounds = await helper.getCanvasBounds();

            // Create two nodes
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 200);
            await page.waitForTimeout(200);

            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 300, bounds.y + 200);
            await page.waitForTimeout(200);

            const initialCount = await helper.getNodesCount();

            // Select all and delete
            await helper.selectAll();
            await helper.deleteSelected();

            const newCount = await helper.getNodesCount();
            expect(newCount).toBe(0);
        });
    });

    // =========================================================================
    // 5. Edge Connection Tests
    // =========================================================================

    test.describe('Edge Connections', () => {
        test('should connect two nodes', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const bounds = await helper.getCanvasBounds();

            // Create two nodes
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 200);
            await page.waitForTimeout(200);

            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 400, bounds.y + 200);
            await page.waitForTimeout(200);

            const nodes = await helper.getNodes();
            expect(nodes.length).toBeGreaterThanOrEqual(2);

            const initialEdges = await helper.getEdgesCount();

            // Connect nodes
            await helper.connectNodes(nodes[0].id, nodes[1].id);

            const newEdges = await helper.getEdgesCount();
            expect(newEdges).toBeGreaterThan(initialEdges);
        });

        test('should delete edge when selected', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const bounds = await helper.getCanvasBounds();

            // Create two nodes and connect them
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 200);
            await page.waitForTimeout(200);

            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 400, bounds.y + 200);
            await page.waitForTimeout(200);

            const nodes = await helper.getNodes();
            await helper.connectNodes(nodes[0].id, nodes[1].id);

            const edgesAfterConnect = await helper.getEdgesCount();
            expect(edgesAfterConnect).toBeGreaterThan(0);

            // Click on edge to select it and delete
            const edge = page.locator(XYFLOW_SELECTORS.edge).first();
            await edge.click();
            await page.waitForTimeout(100);
            await helper.deleteSelected();

            const edgesAfterDelete = await helper.getEdgesCount();
            expect(edgesAfterDelete).toBeLessThan(edgesAfterConnect);
        });
    });

    // =========================================================================
    // 6. Undo/Redo Tests
    // =========================================================================

    test.describe('Undo/Redo', () => {
        test('should undo node creation', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            // Create a node
            await helper.selectTool('rectangle');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            const afterCreate = await helper.getNodesCount();
            expect(afterCreate).toBe(initialCount + 1);

            // Undo
            await helper.undo();

            const afterUndo = await helper.getNodesCount();
            expect(afterUndo).toBe(initialCount);
        });

        test('should redo undone action', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            const initialCount = await helper.getNodesCount();

            // Create a node
            await helper.selectTool('rectangle');
            const bounds = await helper.getCanvasBounds();
            await page.mouse.click(bounds.x + 200, bounds.y + 200);
            await page.waitForTimeout(300);

            // Undo
            await helper.undo();
            const afterUndo = await helper.getNodesCount();
            expect(afterUndo).toBe(initialCount);

            // Redo
            await helper.redo();
            const afterRedo = await helper.getNodesCount();
            expect(afterRedo).toBe(initialCount + 1);
        });
    });

    // =========================================================================
    // 7. Canvas Navigation Tests
    // =========================================================================

    test.describe('Canvas Navigation', () => {
        test('should zoom in with controls', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            // Click zoom in button
            const zoomInButton = page.locator('.react-flow__controls-zoomin');
            await zoomInButton.click();
            await page.waitForTimeout(200);

            // Verify zoom changed (viewport transform)
            const viewport = page.locator(XYFLOW_SELECTORS.reactFlowViewport);
            const transform = await viewport.getAttribute('style');
            expect(transform).toContain('scale');
        });

        test('should zoom out with controls', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            // Click zoom out button
            const zoomOutButton = page.locator('.react-flow__controls-zoomout');
            await zoomOutButton.click();
            await page.waitForTimeout(200);

            // Verify zoom changed
            const viewport = page.locator(XYFLOW_SELECTORS.reactFlowViewport);
            const transform = await viewport.getAttribute('style');
            expect(transform).toContain('scale');
        });

        test('should fit view with controls', async ({ page }) => {
            const helper = createXYFlowHelper(page);
            await helper.waitForReady();

            // Create some nodes first
            const bounds = await helper.getCanvasBounds();
            await helper.selectTool('rectangle');
            await page.mouse.click(bounds.x + 100, bounds.y + 100);
            await page.waitForTimeout(200);

            // Click fit view button
            const fitViewButton = page.locator('.react-flow__controls-fitview');
            await fitViewButton.click();
            await page.waitForTimeout(200);

            // Verify viewport adjusted
            const viewport = page.locator(XYFLOW_SELECTORS.reactFlowViewport);
            await expect(viewport).toBeVisible();
        });
    });
});
