# Реализация тестовой инфраструктуры

## Пошаговый план реализации

### Фаза 1: Базовая инфраструктура (Agent 1)

#### 1.1 Установка зависимостей
```bash
cd wb-diagram-board
npm install -D @playwright/test @playwright/experimental-ct-react
npm install -D vitest @vitest/ui
npx playwright install chromium
```

#### 1.2 Конфигурация Playwright
**Файл:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 8,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

#### 1.3 Базовые типы
**Файл:** `__tests__/e2e/core/types.ts`

```typescript
import { Page } from '@playwright/test';
import { CanvasElement, Tool, Point, Bounds } from '../../../src/types/canvas';

export interface TestContext {
  page: Page;
  canvas: CanvasTestHelper;
  toolbar: ToolbarTestHelper;
  header: HeaderTestHelper;
  stylePanel: StylePanelTestHelper;
  contextMenu: ContextMenuTestHelper;
  zoomControls: ZoomControlsTestHelper;
}

export interface CanvasTestHelper {
  waitForReady(): Promise<void>;
  getElement(id: string): Promise<CanvasElement | null>;
  getAllElements(): Promise<CanvasElement[]>;
  getSelectedIds(): Promise<string[]>;
  getTransform(): Promise<{ x: number; y: number; scale: number }>;
  screenToCanvas(x: number, y: number): Promise<Point>;
  canvasToScreen(x: number, y: number): Promise<Point>;
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

export interface HeaderTestHelper {
  openMenu(): Promise<void>;
  closeMenu(): Promise<void>;
  newCanvas(): Promise<void>;
  exportJSON(): Promise<string>;
  importJSON(json: string): Promise<void>;
  toggleDarkMode(): Promise<void>;
  toggleRoughStyle(): Promise<void>;
  isDarkMode(): Promise<boolean>;
  isRoughStyle(): Promise<boolean>;
}

export interface StylePanelTestHelper {
  isVisible(): Promise<boolean>;
  setStrokeColor(color: string): Promise<void>;
  setStrokeWidth(width: number): Promise<void>;
  setStrokeStyle(style: 'solid' | 'dashed' | 'dotted'): Promise<void>;
  setFillType(type: 'solid' | 'hachure' | 'none'): Promise<void>;
  setFillColor(color: string): Promise<void>;
  setStickyColor(color: string): Promise<void>;
}

export interface ContextMenuTestHelper {
  open(x: number, y: number): Promise<void>;
  close(): Promise<void>;
  isVisible(): Promise<boolean>;
  copy(): Promise<void>;
  cut(): Promise<void>;
  paste(): Promise<void>;
  duplicate(): Promise<void>;
  delete(): Promise<void>;
  bringToFront(): Promise<void>;
  sendToBack(): Promise<void>;
  lock(): Promise<void>;
  unlock(): Promise<void>;
  group(): Promise<void>;
  ungroup(): Promise<void>;
}

export interface ZoomControlsTestHelper {
  zoomIn(): Promise<void>;
  zoomOut(): Promise<void>;
  zoomToFit(): Promise<void>;
  resetZoom(): Promise<void>;
  getZoomPercent(): Promise<number>;
}

// Element builders
export interface ElementBuilder<T extends CanvasElement> {
  at(x: number, y: number): this;
  withSize(width: number, height: number): this;
  withStroke(color: string, width: number, style: 'solid' | 'dashed' | 'dotted'): this;
  withFill(type: 'solid' | 'hachure' | 'none', color: string): this;
  withText(text: string): this;
  locked(): this;
  build(): T;
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

export interface ResizeInteraction {
  element(id: string): this;
  handle(handle: 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'): this;
  to(x: number, y: number): this;
  withShift(): this;
  withSnap(): this;
  execute(): Promise<void>;
}
```

#### 1.4 Базовый тест-хелпер
**Файл:** `__tests__/e2e/core/base-test.ts`

```typescript
import { test as base, expect } from '@playwright/test';
import { TestContext } from './types';
import { createCanvasHelper } from '../helpers/canvas-helpers';
import { createToolbarHelper } from '../helpers/toolbar-helpers';
import { createHeaderHelper } from '../helpers/header-helpers';
import { createStylePanelHelper } from '../helpers/style-panel-helpers';
import { createContextMenuHelper } from '../helpers/context-menu-helpers';
import { createZoomControlsHelper } from '../helpers/zoom-controls-helpers';

export const test = base.extend<TestContext>({
  canvas: async ({ page }, use) => {
    await use(createCanvasHelper(page));
  },
  
  toolbar: async ({ page }, use) => {
    await use(createToolbarHelper(page));
  },
  
  header: async ({ page }, use) => {
    await use(createHeaderHelper(page));
  },
  
  stylePanel: async ({ page }, use) => {
    await use(createStylePanelHelper(page));
  },
  
  contextMenu: async ({ page }, use) => {
    await use(createContextMenuHelper(page));
  },
  
  zoomControls: async ({ page }, use) => {
    await use(createZoomControlsHelper(page));
  },
});

export { expect };

// Custom matchers
expect.extend({
  async toHaveElement(page, elementId: string) {
    const element = await page.evaluate((id) => {
      const store = (window as any).__CANVAS_STORE__;
      return store?.getState().elements[id] || null;
    }, elementId);
    
    return {
      pass: element !== null,
      message: () => `Expected element ${elementId} to ${this.isNot ? 'not ' : ''}exist`,
    };
  },
  
  async toHaveSelectedElements(page, count: number) {
    const selectedCount = await page.evaluate(() => {
      const store = (window as any).__CANVAS_STORE__;
      return store?.getState().selectedIds.length || 0;
    });
    
    return {
      pass: selectedCount === count,
      message: () => `Expected ${count} selected elements, got ${selectedCount}`,
    };
  },
  
  async toHaveTransform(page, expected: { x?: number; y?: number; scale?: number }) {
    const transform = await page.evaluate(() => {
      const store = (window as any).__CANVAS_STORE__;
      return store?.getState().transform;
    });
    
    const matches = Object.entries(expected).every(([key, value]) => {
      return Math.abs(transform[key] - value) < 0.01;
    });
    
    return {
      pass: matches,
      message: () => `Expected transform ${JSON.stringify(expected)}, got ${JSON.stringify(transform)}`,
    };
  },
});
```

#### 1.5 Canvas Helpers
**Файл:** `__tests__/e2e/helpers/canvas-helpers.ts`

```typescript
import { Page } from '@playwright/test';
import { CanvasTestHelper, DrawInteraction, SelectInteraction, DragInteraction, ResizeInteraction } from '../core/types';
import { CanvasElement, Point } from '../../../src/types/canvas';

export function createCanvasHelper(page: Page): CanvasTestHelper & {
  draw: DrawInteraction;
  select: SelectInteraction;
  drag: DragInteraction;
  resize: ResizeInteraction;
} {
  const helper: CanvasTestHelper = {
    async waitForReady() {
      await page.waitForSelector('svg', { state: 'visible' });
      await page.waitForTimeout(100);
      
      // Expose store for testing
      await page.evaluate(() => {
        const store = (window as any).useCanvasStore;
        if (store) {
          (window as any).__CANVAS_STORE__ = store;
        }
      });
    },
    
    async getElement(id: string): Promise<CanvasElement | null> {
      return page.evaluate((elementId) => {
        const store = (window as any).__CANVAS_STORE__;
        return store?.getState().elements[elementId] || null;
      }, id);
    },
    
    async getAllElements(): Promise<CanvasElement[]> {
      return page.evaluate(() => {
        const store = (window as any).__CANVAS_STORE__;
        const state = store?.getState();
        return state?.elementOrder.map((id: string) => state.elements[id]) || [];
      });
    },
    
    async getSelectedIds(): Promise<string[]> {
      return page.evaluate(() => {
        const store = (window as any).__CANVAS_STORE__;
        return store?.getState().selectedIds || [];
      });
    },
    
    async getTransform() {
      return page.evaluate(() => {
        const store = (window as any).__CANVAS_STORE__;
        return store?.getState().transform || { x: 0, y: 0, scale: 1 };
      });
    },
    
    async screenToCanvas(x: number, y: number): Promise<Point> {
      const transform = await this.getTransform();
      return {
        x: (x - transform.x) / transform.scale,
        y: (y - transform.y) / transform.scale,
      };
    },
    
    async canvasToScreen(x: number, y: number): Promise<Point> {
      const transform = await this.getTransform();
      return {
        x: x * transform.scale + transform.x,
        y: y * transform.scale + transform.y,
      };
    },
  };
  
  // Draw interaction builder
  const draw: DrawInteraction = {
    _from: null as Point | null,
    _to: null as Point | null,
    _shift: false,
    _snap: false,
    
    from(x: number, y: number) {
      this._from = { x, y };
      return this;
    },
    
    to(x: number, y: number) {
      this._to = { x, y };
      return this;
    },
    
    withShift() {
      this._shift = true;
      return this;
    },
    
    withSnap() {
      this._snap = true;
      return this;
    },
    
    async execute(): Promise<string> {
      if (!this._from || !this._to) {
        throw new Error('Must specify from() and to() points');
      }
      
      const canvas = page.locator('svg').first();
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');
      
      if (this._shift) {
        await page.keyboard.down('Shift');
      }
      
      await page.mouse.move(box.x + this._from.x, box.y + this._from.y);
      await page.mouse.down();
      await page.mouse.move(box.x + this._to.x, box.y + this._to.y);
      await page.mouse.up();
      
      if (this._shift) {
        await page.keyboard.up('Shift');
      }
      
      await page.waitForTimeout(100);
      
      // Get the newly created element ID
      const selectedIds = await helper.getSelectedIds();
      return selectedIds[0] || '';
    },
  };
  
  // Select interaction builder
  const select: SelectInteraction = {
    _elementId: null as string | null,
    _elementIds: null as string[] | null,
    _box: null as { x1: number; y1: number; x2: number; y2: number } | null,
    _shift: false,
    
    element(id: string) {
      this._elementId = id;
      return this;
    },
    
    elements(ids: string[]) {
      this._elementIds = ids;
      return this;
    },
    
    box(x1: number, y1: number, x2: number, y2: number) {
      this._box = { x1, y1, x2, y2 };
      return this;
    },
    
    withShift() {
      this._shift = true;
      return this;
    },
    
    async execute(): Promise<void> {
      if (this._elementId) {
        const element = await helper.getElement(this._elementId);
        if (!element) throw new Error(`Element ${this._elementId} not found`);
        
        const canvas = page.locator('svg').first();
        const box = await canvas.boundingBox();
        if (!box) throw new Error('Canvas not found');
        
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const screenPoint = await helper.canvasToScreen(centerX, centerY);
        
        if (this._shift) {
          await page.keyboard.down('Shift');
        }
        
        await page.mouse.click(box.x + screenPoint.x, box.y + screenPoint.y);
        
        if (this._shift) {
          await page.keyboard.up('Shift');
        }
      } else if (this._box) {
        const canvas = page.locator('svg').first();
        const box = await canvas.boundingBox();
        if (!box) throw new Error('Canvas not found');
        
        await page.mouse.move(box.x + this._box.x1, box.y + this._box.y1);
        await page.mouse.down();
        await page.mouse.move(box.x + this._box.x2, box.y + this._box.y2);
        await page.mouse.up();
      }
      
      await page.waitForTimeout(50);
    },
  };
  
  // Drag interaction builder
  const drag: DragInteraction = {
    _elementId: null as string | null,
    _from: null as Point | null,
    _to: null as Point | null,
    _shift: false,
    _snap: false,
    
    element(id: string) {
      this._elementId = id;
      return this;
    },
    
    elements(ids: string[]) {
      // TODO: implement multi-drag
      return this;
    },
    
    from(x: number, y: number) {
      this._from = { x, y };
      return this;
    },
    
    to(x: number, y: number) {
      this._to = { x, y };
      return this;
    },
    
    withShift() {
      this._shift = true;
      return this;
    },
    
    withSnap() {
      this._snap = true;
      return this;
    },
    
    async execute(): Promise<void> {
      if (!this._from || !this._to) {
        throw new Error('Must specify from() and to() points');
      }
      
      const canvas = page.locator('svg').first();
      const box = await canvas.boundingBox();
      if (!box) throw new Error('Canvas not found');
      
      if (this._shift) {
        await page.keyboard.down('Shift');
      }
      
      await page.mouse.move(box.x + this._from.x, box.y + this._from.y);
      await page.mouse.down();
      await page.waitForTimeout(50);
      await page.mouse.move(box.x + this._to.x, box.y + this._to.y);
      await page.mouse.up();
      
      if (this._shift) {
        await page.keyboard.up('Shift');
      }
      
      await page.waitForTimeout(50);
    },
  };
  
  // Resize interaction builder
  const resize: ResizeInteraction = {
    _elementId: null as string | null,
    _handle: null as string | null,
    _to: null as Point | null,
    _shift: false,
    _snap: false,
    
    element(id: string) {
      this._elementId = id;
      return this;
    },
    
    handle(handle: string) {
      this._handle = handle;
      return this;
    },
    
    to(x: number, y: number) {
      this._to = { x, y };
      return this;
    },
    
    withShift() {
      this._shift = true;
      return this;
    },
    
    withSnap() {
      this._snap = true;
      return this;
    },
    
    async execute(): Promise<void> {
      // TODO: implement resize
      throw new Error('Not implemented');
    },
  };
  
  return { ...helper, draw, select, drag, resize };
}
```

Продолжить с остальными хелперами?
