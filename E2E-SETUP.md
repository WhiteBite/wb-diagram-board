# E2E Testing Setup Guide

## Установка зависимостей

```bash
cd wb-diagram-board
npm install -D @playwright/test playwright
npm install -D @vitest/ui vitest
```

## Структура проекта

```
wb-diagram-board/
├── __tests__/
│   └── e2e/
│       ├── setup/
│       │   ├── test-helpers.ts
│       │   ├── page-objects.ts
│       │   └── fixtures.ts
│       ├── toolbar/
│       ├── header/
│       ├── canvas/
│       ├── style-panel/
│       ├── context-menu/
│       └── zoom-controls/
├── playwright.config.ts
└── package.json (добавить scripts)
```

## Конфигурация

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### package.json scripts
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

## Базовые хелперы

### test-helpers.ts
```typescript
import { Page, expect } from '@playwright/test';

export async function waitForCanvas(page: Page) {
  await page.waitForSelector('svg', { state: 'visible' });
  await page.waitForTimeout(100); // Дать время на инициализацию
}

export async function getCanvasElement(page: Page, elementId: string) {
  return page.locator(`[data-element-id="${elementId}"]`);
}

export async function createRectangle(
  page: Page,
  x: number,
  y: number,
  width: number,
  height: number
) {
  // Выбрать инструмент Rectangle
  await page.click('[title*="Rectangle"]');
  
  // Нарисовать
  const canvas = page.locator('svg').first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas not found');
  
  await page.mouse.move(box.x + x, box.y + y);
  await page.mouse.down();
  await page.mouse.move(box.x + x + width, box.y + y + height);
  await page.mouse.up();
  
  // Подождать создания
  await page.waitForTimeout(100);
}

export async function selectTool(page: Page, tool: string) {
  const toolMap: Record<string, string> = {
    select: 'Select',
    hand: 'Hand',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    diamond: 'Diamond',
    triangle: 'Triangle',
    line: 'Line',
    arrow: 'Arrow',
    freedraw: 'Pencil',
    text: 'Text',
    sticky: 'Sticky Note',
    frame: 'Frame',
    connector: 'Connector',
    eraser: 'Eraser',
  };
  
  await page.click(`[title*="${toolMap[tool]}"]`);
}

export async function pressShortcut(page: Page, shortcut: string) {
  const modifiers = shortcut.split('+');
  const key = modifiers.pop()!;
  
  for (const mod of modifiers) {
    await page.keyboard.down(mod);
  }
  
  await page.keyboard.press(key);
  
  for (const mod of modifiers.reverse()) {
    await page.keyboard.up(mod);
  }
}
```

### page-objects.ts
```typescript
import { Page } from '@playwright/test';

export class ToolbarPage {
  constructor(private page: Page) {}

  async selectTool(tool: string) {
    const toolMap: Record<string, string> = {
      select: 'Select',
      hand: 'Hand',
      rectangle: 'Rectangle',
      // ... остальные
    };
    await this.page.click(`[title*="${toolMap[tool]}"]`);
  }

  async isToolActive(tool: string): Promise<boolean> {
    const button = this.page.locator(`[title*="${tool}"]`);
    const classes = await button.getAttribute('class');
    return classes?.includes('active') ?? false;
  }

  async undo() {
    await this.page.click('[title*="Undo"]');
  }

  async redo() {
    await this.page.click('[title*="Redo"]');
  }

  async canUndo(): Promise<boolean> {
    const button = this.page.locator('[title*="Undo"]');
    return !(await button.isDisabled());
  }

  async canRedo(): Promise<boolean> {
    const button = this.page.locator('[title*="Redo"]');
    return !(await button.isDisabled());
  }
}

export class HeaderPage {
  constructor(private page: Page) {}

  async openMenu() {
    await this.page.click('button:has-text("Menu")');
  }

  async closeMenu() {
    await this.page.click('body');
  }

  async newCanvas() {
    await this.openMenu();
    await this.page.click('button:has-text("New Canvas")');
  }

  async exportJSON() {
    await this.openMenu();
    const downloadPromise = this.page.waitForEvent('download');
    await this.page.click('button:has-text("Export JSON")');
    return downloadPromise;
  }

  async importJSON(filePath: string) {
    await this.openMenu();
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.click('button:has-text("Import JSON")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  async toggleDarkMode() {
    await this.page.click('[title*="mode"]');
  }

  async toggleRoughStyle() {
    await this.page.click('[title*="style"]');
  }
}

export class CanvasPage {
  constructor(private page: Page) {}

  async getCanvas() {
    return this.page.locator('svg').first();
  }

  async drawRectangle(x: number, y: number, width: number, height: number) {
    const canvas = await this.getCanvas();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await this.page.mouse.move(box.x + x, box.y + y);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + x + width, box.y + y + height);
    await this.page.mouse.up();
  }

  async selectElement(x: number, y: number) {
    const canvas = await this.getCanvas();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await this.page.mouse.click(box.x + x, box.y + y);
  }

  async dragElement(fromX: number, fromY: number, toX: number, toY: number) {
    const canvas = await this.getCanvas();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await this.page.mouse.move(box.x + fromX, box.y + fromY);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + toX, box.y + toY);
    await this.page.mouse.up();
  }

  async zoom(delta: number) {
    const canvas = await this.getCanvas();
    await canvas.hover();
    await this.page.mouse.wheel(0, delta);
  }

  async pan(dx: number, dy: number) {
    await this.page.keyboard.down('Space');
    const canvas = await this.getCanvas();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await this.page.mouse.move(box.x + 100, box.y + 100);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 100 + dx, box.y + 100 + dy);
    await this.page.mouse.up();
    await this.page.keyboard.up('Space');
  }
}

export class StylePanelPage {
  constructor(private page: Page) {}

  async isVisible(): Promise<boolean> {
    return this.page.locator('.panel-right').isVisible();
  }

  async selectStrokeColor(color: string) {
    await this.page.click(`.color-swatch[style*="${color}"]`);
  }

  async selectStrokeWidth(width: number) {
    // Найти кнопку с нужной шириной
    const buttons = this.page.locator('.flex.gap-1 button');
    await buttons.nth(width - 1).click();
  }

  async selectStrokeStyle(style: 'solid' | 'dashed' | 'dotted') {
    await this.page.click(`button:has-text("${style}")`);
  }

  async selectFillType(type: 'solid' | 'hachure' | 'none') {
    await this.page.click(`button:has-text("${type}")`);
  }

  async toggleSection(section: string) {
    await this.page.click(`button:has-text("${section}")`);
  }
}

export class ZoomControlsPage {
  constructor(private page: Page) {}

  async zoomIn() {
    await this.page.click('[title*="Zoom In"]');
  }

  async zoomOut() {
    await this.page.click('[title*="Zoom Out"]');
  }

  async zoomToFit() {
    await this.page.click('[title*="Zoom to Fit"]');
  }

  async resetZoom() {
    await this.page.click('[title*="Reset Zoom"]');
  }

  async getZoomPercent(): Promise<number> {
    const text = await this.page.locator('.zoom-value').textContent();
    return parseInt(text?.replace('%', '') ?? '100');
  }
}
```

### fixtures.ts
```typescript
export const testCanvas = {
  elements: [
    {
      id: 'rect-1',
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    },
    {
      id: 'circle-1',
      type: 'ellipse',
      x: 400,
      y: 100,
      width: 150,
      height: 150,
    },
  ],
};

export const testColors = [
  '#1e1e1e', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
];

export const testTools = [
  'select', 'hand', 'rectangle', 'ellipse', 'diamond',
  'triangle', 'line', 'arrow', 'freedraw', 'text',
  'sticky', 'frame', 'connector', 'eraser',
];
```

## Пример теста

### toolbar/tools.spec.ts
```typescript
import { test, expect } from '@playwright/test';
import { ToolbarPage } from '../setup/page-objects';
import { waitForCanvas } from '../setup/test-helpers';
import { testTools } from '../setup/fixtures';

test.describe('Toolbar - Tool Selection', () => {
  let toolbar: ToolbarPage;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForCanvas(page);
    toolbar = new ToolbarPage(page);
  });

  for (const tool of testTools) {
    test(`should select ${tool} tool`, async () => {
      await toolbar.selectTool(tool);
      expect(await toolbar.isToolActive(tool)).toBe(true);
    });
  }

  test('should switch between tools', async () => {
    await toolbar.selectTool('rectangle');
    expect(await toolbar.isToolActive('rectangle')).toBe(true);

    await toolbar.selectTool('ellipse');
    expect(await toolbar.isToolActive('ellipse')).toBe(true);
    expect(await toolbar.isToolActive('rectangle')).toBe(false);
  });
});
```

## Запуск тестов

```bash
# Все тесты
npm run test:e2e

# С UI
npm run test:e2e:ui

# Дебаг режим
npm run test:e2e:debug

# Только один файл
npm run test:e2e toolbar/tools.spec.ts

# Только один тест
npm run test:e2e -g "should select rectangle tool"
```

## CI/CD

### GitHub Actions
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```
