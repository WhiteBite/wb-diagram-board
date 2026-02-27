# Команды для запуска агентов

## 🚀 Быстрый старт

```bash
# 1. Клонировать репозиторий
cd wb-diagram-board

# 2. Установить зависимости (Agent 1)
npm install -D @playwright/test playwright
npx playwright install chromium

# 3. Запустить dev server
npm run dev

# 4. В другом терминале - запустить тесты
npm run test:e2e
```

---

## 🤖 Agent 1: Setup & Infrastructure

### Задача
Создать базовую инфраструктуру для всех тестов

### Команды
```bash
cd wb-diagram-board

# Установка
npm install -D @playwright/test playwright @vitest/ui vitest
npx playwright install chromium firefox

# Создание структуры
mkdir -p __tests__/e2e/{core,fixtures,page-objects,builders,helpers,specs}
mkdir -p __tests__/e2e/specs/{tools,interactions,styles,operations,file-operations,keyboard,grid,visual,integration}

# Создание файлов
touch __tests__/e2e/core/{base-test.ts,types.ts,assertions.ts,matchers.ts}
touch __tests__/e2e/fixtures/{elements.ts,styles.ts,canvas-states.ts,interactions.ts}
touch __tests__/e2e/page-objects/{base-page.ts,toolbar-page.ts,header-page.ts,canvas-page.ts,style-panel-page.ts,context-menu-page.ts,zoom-controls-page.ts}
touch __tests__/e2e/builders/{element-builder.ts,interaction-builder.ts,canvas-builder.ts}
touch __tests__/e2e/helpers/{canvas-helpers.ts,element-helpers.ts,interaction-helpers.ts,visual-helpers.ts,keyboard-helpers.ts}
touch playwright.config.ts

# Добавить scripts в package.json
```

### Файлы для создания
1. `playwright.config.ts` - конфигурация
2. `__tests__/e2e/core/base-test.ts` - базовый тест
3. `__tests__/e2e/core/types.ts` - типы
4. `__tests__/e2e/helpers/canvas-helpers.ts` - хелперы canvas
5. `__tests__/e2e/helpers/toolbar-helpers.ts` - хелперы toolbar
6. `__tests__/e2e/helpers/header-helpers.ts` - хелперы header
7. `__tests__/e2e/fixtures/elements.ts` - фикстуры элементов

### Проверка
```bash
npm run test:e2e -- --list
# Должен показать список тестов без ошибок
```

### Критерий готовности
- ✅ Playwright установлен и настроен
- ✅ Базовые хелперы созданы
- ✅ Тестовый запуск проходит
- ✅ Можно создать простой тест

---

## 🤖 Agent 2: Toolbar Tests

### Зависимости
Ждет: Agent 1

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/tools/{shapes,lines,drawing,content}
touch __tests__/e2e/specs/tools/select.spec.ts
touch __tests__/e2e/specs/tools/hand.spec.ts
touch __tests__/e2e/specs/tools/shapes/{rectangle,ellipse,diamond,triangle}.spec.ts
touch __tests__/e2e/specs/tools/lines/{line,arrow,connector}.spec.ts
touch __tests__/e2e/specs/tools/drawing/{freedraw,eraser}.spec.ts
touch __tests__/e2e/specs/tools/content/{text,sticky,frame}.spec.ts

# Запуск
npm run test:e2e specs/tools/
```

### Тесты для создания

#### Select Tool (`select.spec.ts`)
```typescript
import { test, expect } from '../../core/base-test';

test.describe('Select Tool', () => {
  test.beforeEach(async ({ page, canvas, toolbar }) => {
    await page.goto('/');
    await canvas.waitForReady();
    await toolbar.selectTool('select');
  });

  test('should be active by default', async ({ toolbar }) => {
    expect(await toolbar.isToolActive('select')).toBe(true);
  });

  test('should activate with V key', async ({ page, toolbar }) => {
    await toolbar.selectTool('rectangle');
    await page.keyboard.press('v');
    expect(await toolbar.isToolActive('select')).toBe(true);
  });

  test('should select element on click', async ({ canvas, toolbar }) => {
    // Create rectangle
    await toolbar.selectTool('rectangle');
    const id = await canvas.draw.from(100, 100).to(200, 200).execute();
    
    // Select it
    await toolbar.selectTool('select');
    await canvas.select.element(id).execute();
    
    const selected = await canvas.getSelectedIds();
    expect(selected).toContain(id);
  });

  test('should select multiple with box', async ({ canvas, toolbar }) => {
    // Create 2 rectangles
    await toolbar.selectTool('rectangle');
    const id1 = await canvas.draw.from(100, 100).to(150, 150).execute();
    const id2 = await canvas.draw.from(200, 200).to(250, 250).execute();
    
    // Box select
    await toolbar.selectTool('select');
    await canvas.select.box(90, 90, 260, 260).execute();
    
    const selected = await canvas.getSelectedIds();
    expect(selected).toHaveLength(2);
    expect(selected).toContain(id1);
    expect(selected).toContain(id2);
  });

  test('should add to selection with Shift+click', async ({ canvas, toolbar }) => {
    // Create 2 rectangles
    await toolbar.selectTool('rectangle');
    const id1 = await canvas.draw.from(100, 100).to(150, 150).execute();
    const id2 = await canvas.draw.from(200, 200).to(250, 250).execute();
    
    // Select first
    await toolbar.selectTool('select');
    await canvas.select.element(id1).execute();
    
    // Add second with Shift
    await canvas.select.element(id2).withShift().execute();
    
    const selected = await canvas.getSelectedIds();
    expect(selected).toHaveLength(2);
  });

  test('should clear selection on empty click', async ({ page, canvas, toolbar }) => {
    // Create and select rectangle
    await toolbar.selectTool('rectangle');
    const id = await canvas.draw.from(100, 100).to(200, 200).execute();
    
    // Click empty space
    const canvasEl = page.locator('svg').first();
    const box = await canvasEl.boundingBox();
    await page.mouse.click(box!.x + 500, box!.y + 500);
    
    const selected = await canvas.getSelectedIds();
    expect(selected).toHaveLength(0);
  });
});
```

#### Rectangle Tool (`shapes/rectangle.spec.ts`)
```typescript
import { test, expect } from '../../../core/base-test';

test.describe('Rectangle Tool', () => {
  test.beforeEach(async ({ page, canvas, toolbar }) => {
    await page.goto('/');
    await canvas.waitForReady();
    await toolbar.selectTool('rectangle');
  });

  test('should activate with R key', async ({ page, toolbar }) => {
    await toolbar.selectTool('select');
    await page.keyboard.press('r');
    expect(await toolbar.isToolActive('rectangle')).toBe(true);
  });

  test('should create rectangle on drag', async ({ canvas, toolbar }) => {
    const id = await canvas.draw.from(100, 100).to(300, 200).execute();
    
    const element = await canvas.getElement(id);
    expect(element).not.toBeNull();
    expect(element!.type).toBe('rectangle');
    expect(element!.width).toBeCloseTo(200, 1);
    expect(element!.height).toBeCloseTo(100, 1);
  });

  test('should create square with Shift', async ({ canvas }) => {
    const id = await canvas.draw.from(100, 100).to(300, 200).withShift().execute();
    
    const element = await canvas.getElement(id);
    expect(element!.width).toBeCloseTo(element!.height, 1);
  });

  test('should snap to grid', async ({ canvas }) => {
    const id = await canvas.draw.from(105, 105).to(295, 195).withSnap().execute();
    
    const element = await canvas.getElement(id);
    expect(element!.x % 20).toBe(0);
    expect(element!.y % 20).toBe(0);
  });

  test('should have minimum size', async ({ canvas }) => {
    const id = await canvas.draw.from(100, 100).to(102, 102).execute();
    
    const element = await canvas.getElement(id);
    expect(element!.width).toBeGreaterThanOrEqual(5);
    expect(element!.height).toBeGreaterThanOrEqual(5);
  });

  test('should auto-switch to select after creation', async ({ toolbar, canvas }) => {
    await canvas.draw.from(100, 100).to(200, 200).execute();
    
    expect(await toolbar.isToolActive('select')).toBe(true);
  });

  test('should apply current stroke style', async ({ canvas, stylePanel }) => {
    await stylePanel.setStrokeColor('#ff0000');
    await stylePanel.setStrokeWidth(4);
    
    const id = await canvas.draw.from(100, 100).to(200, 200).execute();
    
    const element = await canvas.getElement(id);
    expect(element!.stroke.color).toBe('#ff0000');
    expect(element!.stroke.width).toBe(4);
  });

  test('should apply current fill style', async ({ canvas, stylePanel }) => {
    await stylePanel.setFillType('solid');
    await stylePanel.setFillColor('#00ff00');
    
    const id = await canvas.draw.from(100, 100).to(200, 200).execute();
    
    const element = await canvas.getElement(id);
    expect(element!.fill.type).toBe('solid');
    expect(element!.fill.color).toBe('#00ff00');
  });
});
```

### Итого тестов
- Select: 6 тестов
- Hand: 5 тестов
- Rectangle: 50 тестов (все комбинации)
- Ellipse: 50 тестов
- Diamond: 50 тестов
- Triangle: 50 тестов
- Line: 40 тестов
- Arrow: 40 тестов
- Connector: 40 тестов
- Freedraw: 10 тестов
- Eraser: 10 тестов
- Text: 20 тестов
- Sticky: 20 тестов
- Frame: 15 тестов

**Всего: ~406 тестов**

---

## 🤖 Agent 3: Interactions Tests

### Зависимости
Ждет: Agent 1, Agent 2 (частично)

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/interactions/{selection,manipulation,navigation,editing}
touch __tests__/e2e/specs/interactions/selection/{single-select,multi-select,box-select,shift-select}.spec.ts
touch __tests__/e2e/specs/interactions/manipulation/{drag,resize,rotate,transform}.spec.ts
touch __tests__/e2e/specs/interactions/navigation/{pan,zoom,fit}.spec.ts
touch __tests__/e2e/specs/interactions/editing/{text-edit,double-click,inline-edit}.spec.ts

# Запуск
npm run test:e2e specs/interactions/
```

### Итого тестов
- Selection: 15 тестов
- Manipulation: 50 тестов
- Navigation: 20 тестов
- Editing: 10 тестов

**Всего: ~95 тестов**

---

## 🤖 Agent 4: Styles Tests

### Зависимости
Ждет: Agent 1, Agent 2

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/styles/{stroke,fill,text,special}
touch __tests__/e2e/specs/styles/stroke/{color,width,style}.spec.ts
touch __tests__/e2e/specs/styles/fill/{type,color}.spec.ts
touch __tests__/e2e/specs/styles/text/{font,size,alignment}.spec.ts
touch __tests__/e2e/specs/styles/special/{sticky-colors,rough-style}.spec.ts

# Запуск
npm run test:e2e specs/styles/
```

### Итого тестов
- Stroke: 30 тестов
- Fill: 25 тестов
- Text: 20 тестов
- Special: 10 тестов

**Всего: ~85 тестов**

---

## 🤖 Agent 5: Operations Tests

### Зависимости
Ждет: Agent 1, Agent 2

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/operations/{clipboard,history,z-order,grouping,alignment,locking}
touch __tests__/e2e/specs/operations/clipboard/{copy,cut,paste,duplicate}.spec.ts
touch __tests__/e2e/specs/operations/history/{undo,redo,history-stack}.spec.ts
touch __tests__/e2e/specs/operations/z-order/{bring-to-front,send-to-back,bring-forward,send-backward}.spec.ts
touch __tests__/e2e/specs/operations/grouping/{group,ungroup,nested-groups}.spec.ts
touch __tests__/e2e/specs/operations/alignment/{align-left,align-center,align-right,align-top,align-middle,align-bottom,distribute-horizontal,distribute-vertical}.spec.ts
touch __tests__/e2e/specs/operations/locking/{lock,unlock}.spec.ts

# Запуск
npm run test:e2e specs/operations/
```

### Итого тестов
- Clipboard: 15 тестов
- History: 20 тестов
- Z-Order: 10 тестов
- Grouping: 15 тестов
- Alignment: 15 тестов
- Locking: 5 тестов

**Всего: ~80 тестов**

---

## 🤖 Agent 6: File & Keyboard Tests

### Зависимости
Ждет: Agent 1

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/{file-operations,keyboard}
touch __tests__/e2e/specs/file-operations/{new-canvas,import-json,export-json,export-png}.spec.ts
touch __tests__/e2e/specs/keyboard/{tool-shortcuts,operation-shortcuts,navigation-shortcuts,modifier-keys}.spec.ts

# Запуск
npm run test:e2e specs/file-operations/ specs/keyboard/
```

### Итого тестов
- File Operations: 10 тестов
- Keyboard: 31 тест

**Всего: ~41 тест**

---

## 🤖 Agent 7: Grid & Visual Tests

### Зависимости
Ждет: Agent 1

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/{grid,visual}
mkdir -p __tests__/e2e/specs/visual/{rendering,themes,responsive}
touch __tests__/e2e/specs/grid/{grid-toggle,snap-to-grid,grid-size}.spec.ts
touch __tests__/e2e/specs/visual/rendering/{shapes-rendering,lines-rendering,text-rendering,rough-style-rendering}.spec.ts
touch __tests__/e2e/specs/visual/themes/{dark-mode,light-mode}.spec.ts
touch __tests__/e2e/specs/visual/responsive/{zoom-levels,viewport-sizes}.spec.ts

# Запуск
npm run test:e2e specs/grid/ specs/visual/
```

### Итого тестов
- Grid: 10 тестов
- Visual: 28 тестов

**Всего: ~38 тестов**

---

## 🤖 Agent 8: Integration Tests

### Зависимости
Ждет: Все предыдущие агенты

### Команды
```bash
cd wb-diagram-board

# Создание структуры
mkdir -p __tests__/e2e/specs/integration/{workflows,scenarios}
touch __tests__/e2e/specs/integration/workflows/{create-diagram,edit-diagram,export-diagram}.spec.ts
touch __tests__/e2e/specs/integration/scenarios/{flowchart,wireframe,mindmap}.spec.ts

# Запуск
npm run test:e2e specs/integration/
```

### Итого тестов
- Workflows: 6 тестов
- Scenarios: 4 теста

**Всего: ~10 тестов**

---

## 📊 Итоговая статистика

| Агент | Тестов | Время | Зависимости |
|-------|--------|-------|-------------|
| Agent 1 | 1 | 3ч | - |
| Agent 2 | 406 | 4ч | Agent 1 |
| Agent 3 | 95 | 2ч | Agent 1, 2 |
| Agent 4 | 85 | 2ч | Agent 1, 2 |
| Agent 5 | 80 | 2ч | Agent 1, 2 |
| Agent 6 | 41 | 1ч | Agent 1 |
| Agent 7 | 38 | 1ч | Agent 1 |
| Agent 8 | 10 | 1ч | Все |
| **Итого** | **756** | **16ч** | - |

**Параллельное выполнение:** 5-6 часов

---

## 🚀 Запуск всех тестов

```bash
# Все тесты
npm run test:e2e

# Только P0 (критичные)
npm run test:e2e -- --grep "@p0"

# Только P1 (важные)
npm run test:e2e -- --grep "@p1"

# С UI
npm run test:e2e:ui

# Дебаг
npm run test:e2e:debug

# Отчет
npm run test:e2e:report
```
