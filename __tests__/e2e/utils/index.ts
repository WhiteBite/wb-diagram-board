/**
 * Test Utilities Index
 * 
 * Exports all test utilities for E2E testing
 */

// Diagram helpers
export {
    createRectangle,
    createEllipse,
    createDiamond,
    createLine,
    createArrow,
    createText,
    createShapes,
    createDiagram,
    createFlowchart,
    createShapeGrid,
    createLargeDiagram,
    waitForElement,
    waitForElementCount,
    resetDiagram,
} from './diagram-helpers';
export type { ShapeConfig, DiagramConfig } from './diagram-helpers';

// Assertions
export {
    expectElementType,
    expectElementPosition,
    expectElementSize,
    expectElementSelected,
    expectElementNotSelected,
    expectElementsSelected,
    expectNoSelection,
    expectTransform,
    expectElementProperty,
    expectElementCountInRange,
    expectElementsAlignedHorizontally,
    expectElementsAlignedVertically,
    expectElementsDistributedHorizontally,
    expectUnsavedChanges,
    expectToolActive,
    expectCanUndo,
    expectCanRedo,
    expectPerformanceWithin,
} from './assertions';

// Fixtures
export {
    POSITIONS,
    SIZES,
    COLORS,
    STROKE_WIDTHS,
    TIMING,
    PERFORMANCE_THRESHOLDS,
    SHAPE_FIXTURES,
    FLOWCHART_FIXTURES,
    DOCUMENT_FIXTURES,
    createPositionGrid,
    createRandomPositions,
    createShapeRow,
    generateDocumentName,
    createTestElement,
} from './fixtures';
export type { ShapeFixture, FlowchartNode, DocumentFixture } from './fixtures';

// Performance helpers
export {
    measureTime,
    measureWithStatistics,
    calculateStatistics,
    collectWebVitals,
    setupPerformanceObservers,
    getCollectedMetrics,
    startFrameRateMeasurement,
    stopFrameRateMeasurement,
    measureFrameRate,
    measureRenderTime,
    waitForIdle,
    validatePerformanceBudget,
    formatPerformanceReport,
    createJsonReport,
    PERFORMANCE_BUDGETS,
} from './performance-helpers';
export type {
    PerformanceMetrics,
    FrameRateMetrics,
    RenderMetrics,
    PerformanceBudget,
    PerformanceResult,
    TimingResult,
    StatisticalResult,
} from './performance-helpers';

// Diagram generators
export {
    generateGrid,
    generateBulkElements,
    generateFlowchart,
    generateNetwork,
    generateMixedDiagram,
    generateSpreadDiagram,
    generateOverlappingDiagram,
    generateConnectedDiagram,
    clearGeneratedElements,
    getElementCount,
} from './diagram-generators';
export type {
    GeneratorOptions,
    GeneratedDiagram,
    GridOptions,
    FlowchartOptions,
    NetworkOptions,
} from './diagram-generators';

// Memory tracker
export {
    takeMemorySnapshot,
    calculateMemoryDelta,
    MemoryTracker,
    detectMemoryLeak,
    getMemoryUsageMB,
    isMemoryWithinBudget,
    formatMemorySize,
    createMemoryReport,
} from './memory-tracker';
export type {
    MemorySnapshot,
    MemoryDelta,
    MemoryLeakResult,
    MemoryTrackerOptions,
} from './memory-tracker';
