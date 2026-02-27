import { Page } from '@playwright/test';

// Canvas element types (simplified for testing)
export interface Point {
    x: number;
    y: number;
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type Tool =
    | 'select'
    | 'rectangle'
    | 'ellipse'
    | 'diamond'
    | 'triangle'
    | 'line'
    | 'arrow'
    | 'connector'
    | 'text'
    | 'sticky'
    | 'frame'
    | 'pen'
    | 'eraser'
    | 'hand';

export interface CanvasElement {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    [key: string]: any;
}

export interface TestContext {
    page: Page;
    canvas: CanvasTestHelper;
    toolbar: ToolbarTestHelper;
    keyboard: KeyboardTestHelper;
}

export interface CanvasTestHelper {
    waitForReady(): Promise<void>;
    getElement(id: string): Promise<CanvasElement | null>;
    getAllElements(): Promise<CanvasElement[]>;
    getSelectedIds(): Promise<string[]>;
    getTransform(): Promise<{ x: number; y: number; scale: number }>;
    screenToCanvas(x: number, y: number): Promise<Point>;
    canvasToScreen(x: number, y: number): Promise<Point>;
    draw: DrawInteraction;
    select: SelectInteraction;
    drag: DragInteraction;
}

export interface ToolbarTestHelper {
    selectTool(tool: Tool): Promise<void>;
    getActiveTool(): Promise<Tool>;
    isToolActive(tool: Tool): Promise<boolean>;
    undo(): Promise<void>;
    redo(): Promise<void>;
    canUndo(): Promise<boolean>;
    canRedo(): Promise<boolean>;
}

export interface KeyboardTestHelper {
    pressKey(key: string): Promise<void>;
    pressKeys(keys: string[]): Promise<void>;
    holdKey(key: string, action: () => Promise<void>): Promise<void>;
    delete(): Promise<void>;
    selectAll(): Promise<void>;
    copy(): Promise<void>;
    paste(): Promise<void>;
    cut(): Promise<void>;
    undo(): Promise<void>;
    redo(): Promise<void>;
}

// Interaction builders
export interface DrawInteraction {
    from(x: number, y: number): this;
    to(x: number, y: number): this;
    withShift(): this;
    withSnap(): this;
    execute(): Promise<string>; // Returns element ID
}

export interface SelectInteraction {
    element(id: string): this;
    elements(ids: string[]): this;
    box(x1: number, y1: number, x2: number, y2: number): this;
    withShift(): this;
    execute(): Promise<void>;
}

export interface DragInteraction {
    element(id: string): this;
    elements(ids: string[]): this;
    from(x: number, y: number): this;
    to(x: number, y: number): this;
    withShift(): this;
    withSnap(): this;
    execute(): Promise<void>;
}
