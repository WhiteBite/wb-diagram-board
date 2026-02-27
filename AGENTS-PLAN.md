# План распределения задач между агентами

## Граф зависимостей

```
Agent 1 (Setup)
    ├─→ Agent 2 (Toolbar)
    ├─→ Agent 3 (Header)
    ├─→ Agent 4 (Canvas Drawing)
    │       ├─→ Agent 5 (Canvas Interactions)
    │       ├─→ Agent 6 (Style Panel)
    │       └─→ Agent 7 (Context Menu)
    └─→ Agent 8 (Zoom Controls)
```

## Волны выполнения

### 🌊 Волна 1: Setup (блокирующая)
**Агент:** Agent 1  
**Время:** 2-3 часа  
**Статус:** 🔴 Критично

```bash
# Команды для Agent 1
cd wb-diagram-board
npm install -D @playwright/test playwright @vitest/ui vitest
npx playwright install chromium firefox
```

**Задачи:**
1. Установить зависимости
2. Создать `playwright.config.ts`
3. Создать `__tests__/e2e/setup/test-helpers.ts`
4. Создать `__tests__/e2e/setup/page-objects.ts`
5. Создать `__tests__/e2e/setup/fixtures.ts`
6. Добавить scripts в `package.json`
7. Создать базовый тест для проверки setup

**Критерий готовности:**
```bash
npm run test:e2e -- --list
# Должен показать список тестов без ошибок
```

---

### 🌊 Волна 2: Независимые компоненты (параллельно)
**Агенты:** Agent 2, Agent 3, Agent 8  
**Время:** 1-2 часа каждый  
**Статус:** 🟡 Можно начинать после Волны 1

#### Agent 2: Toolbar Tests
```bash
mkdir -p __tests__/e2e/toolbar
```

**Файлы:**
- `__tests__/e2e/toolbar/tools.spec.ts` (14 тестов)
- `__tests__/e2e/toolbar/undo-redo.spec.ts` (4 теста)
- `__tests__/e2e/toolbar/tool-switching.spec.ts` (3 теста)

**Тесты:**
```typescript
// tools.spec.ts
test('should select each tool', async ({ page }) => {
  // 14 инструментов
});

test('should show active state', async ({ page }) => {
  // Проверка класса .active
});

test('should use keyboard shortcuts', async ({ page }) => {
  // V, H, R, O, D, L, A, P, T, S, F, C, E
});

// undo-redo.spec.ts
test('undo/redo should be disabled initially', async ({ page }) => {});
test('undo should be enabled after action', async ({ page }) => {});
test('redo should be enabled after undo', async ({ page }) => {});
test('should undo/redo with Ctrl+Z/Y', async ({ page }) => {});

// tool-switching.spec.ts
test('should auto-switch to select after drawing', async ({ page }) => {});
test('should keep tool active during drawing', async ({ page }) => {});
```

---

#### Agent 3: Header Tests
```bash
mkdir -p __tests__/e2e/header
```

**Файлы:**
- `__tests__/e2e/header/menu.spec.ts` (5 тестов)
- `__tests__/e2e/header/export.spec.ts` (2 теста)
- `__tests__/e2e/header/import.spec.ts` (2 теста)
- `__tests__/e2e/header/settings.spec.ts` (4 теста)

**Тесты:**
```typescript
// menu.spec.ts
test('should open/close menu', async ({ page }) => {});
test('should show all menu items', async ({ page }) => {});
test('should close menu on outside click', async ({ page }) => {});
test('should handle New Canvas with confirmation', async ({ page }) => {});

// export.spec.ts
test('should export JSON', async ({ page }) => {
  const download = await headerPage.exportJSON();
  expect(download.suggestedFilename()).toBe('canvas.json');
});

test('should show alert for PNG export', async ({ page }) => {
  // PNG не реализован
});

// import.spec.ts
test('should import valid JSON', async ({ page }) => {});
test('should handle invalid JSON', async ({ page }) => {});

// settings.spec.ts
test('should toggle dark mode', async ({ page }) => {});
test('should persist dark mode', async ({ page }) => {});
test('should toggle rough style', async ({ page }) => {});
test('should open GitHub link', async ({ page }) => {});
```

---

#### Agent 8: Zoom Controls Tests
```bash
mkdir -p __tests__/e2e/zoom-controls
```

**Файлы:**
- `__tests__/e2e/zoom-controls/zoom.spec.ts` (10 тестов)

**Тесты:**
```typescript
test('should zoom in with button', async ({ page }) => {});
test('should zoom out with button', async ({ page }) => {});
test('should zoom in with Ctrl++', async ({ page }) => {});
test('should zoom out with Ctrl+-', async ({ page }) => {});
test('should display zoom percentage', async ({ page }) => {});
test('should zoom to fit with Ctrl+1', async ({ page }) => {});
test('should reset zoom with Ctrl+0', async ({ page }) => {});
test('should limit zoom to 10%-1000%', async ({ page }) => {});
test('should zoom with mouse wheel', async ({ page }) => {});
test('should zoom towards cursor', async ({ page }) => {});
```

---

### 🌊 Волна 3: Canvas Drawing (блокирующая для Волны 4)
**Агент:** Agent 4  
**Время:** 2-3 часа  
**Статус:** 🟡 Можно начинать после Волны 1

```bash
mkdir -p __tests__/e2e/canvas
```

**Файлы:**
- `__tests__/e2e/canvas/drawing.spec.ts` (9 тестов)
- `__tests__/e2e/canvas/selection.spec.ts` (4 теста)

**Тесты:**
```typescript
// drawing.spec.ts
test('should draw rectangle', async ({ page }) => {
  await toolbar.selectTool('rectangle');
  await canvas.drawRectangle(100, 100, 200, 150);
  // Проверить что элемент создан
});

test('should draw ellipse', async ({ page }) => {});
test('should draw diamond', async ({ page }) => {});
test('should draw triangle', async ({ page }) => {});
test('should draw line', async ({ page }) => {});
test('should draw arrow', async ({ page }) => {});
test('should draw freedraw', async ({ page }) => {});
test('should create text on click', async ({ page }) => {});
test('should create sticky note', async ({ page }) => {});

// selection.spec.ts
test('should select single element', async ({ page }) => {});
test('should select multiple with box', async ({ page }) => {});
test('should add to selection with Shift', async ({ page }) => {});
test('should clear selection on empty click', async ({ page }) => {});
```

---

### 🌊 Волна 4: Canvas Interactions (параллельно)
**Агенты:** Agent 5, Agent 6, Agent 7  
**Время:** 1-2 часа каждый  
**Статус:** 🟢 Можно начинать после Волны 3

#### Agent 5: Canvas Interaction Tests
**Файлы:**
- `__tests__/e2e/canvas/dragging.spec.ts` (4 теста)
- `__tests__/e2e/canvas/resizing.spec.ts` (4 теста)
- `__tests__/e2e/canvas/zoom-pan.spec.ts` (5 тестов)

**Тесты:**
```typescript
// dragging.spec.ts
test('should drag single element', async ({ page }) => {});
test('should drag multiple elements', async ({ page }) => {});
test('should snap to grid when dragging', async ({ page }) => {});
test('should record to history after drag', async ({ page }) => {});

// resizing.spec.ts
test('should resize with 8 handles', async ({ page }) => {
  // nw, n, ne, w, e, sw, s, se
});
test('should maintain minimum size', async ({ page }) => {});
test('should snap to grid when resizing', async ({ page }) => {});
test('should record to history after resize', async ({ page }) => {});

// zoom-pan.spec.ts
test('should pan with Hand tool', async ({ page }) => {});
test('should pan with Space+drag', async ({ page }) => {});
test('should zoom with wheel', async ({ page }) => {});
test('should zoom towards cursor', async ({ page }) => {});
test('should edit text on double-click', async ({ page }) => {});
```

---

#### Agent 6: Style Panel Tests
**Файлы:**
- `__tests__/e2e/style-panel/stroke.spec.ts` (6 тестов)
- `__tests__/e2e/style-panel/fill.spec.ts` (4 теста)
- `__tests__/e2e/style-panel/sticky-colors.spec.ts` (2 теста)

**Тесты:**
```typescript
// stroke.spec.ts
test('should show panel when element selected', async ({ page }) => {});
test('should hide panel when deselected', async ({ page }) => {});
test('should change stroke color (16 colors)', async ({ page }) => {});
test('should change stroke width (6 widths)', async ({ page }) => {});
test('should change stroke style (3 styles)', async ({ page }) => {});
test('should apply to selected elements', async ({ page }) => {});

// fill.spec.ts
test('should change fill type (3 types)', async ({ page }) => {});
test('should change fill color (16 colors)', async ({ page }) => {});
test('should hide color when type=none', async ({ page }) => {});
test('should toggle sections', async ({ page }) => {});

// sticky-colors.spec.ts
test('should show sticky colors for sticky notes', async ({ page }) => {});
test('should change sticky color (5 colors)', async ({ page }) => {});
```

---

#### Agent 7: Context Menu Tests
**Файлы:**
- `__tests__/e2e/context-menu/actions.spec.ts` (12 тестов)
- `__tests__/e2e/context-menu/shortcuts.spec.ts` (8 тестов)

**Тесты:**
```typescript
// actions.spec.ts
test('should open on right-click', async ({ page }) => {});
test('should close on outside click', async ({ page }) => {});
test('should close on Escape', async ({ page }) => {});
test('should copy element', async ({ page }) => {});
test('should cut element', async ({ page }) => {});
test('should paste element', async ({ page }) => {});
test('should duplicate element', async ({ page }) => {});
test('should bring to front', async ({ page }) => {});
test('should send to back', async ({ page }) => {});
test('should lock/unlock', async ({ page }) => {});
test('should group elements', async ({ page }) => {});
test('should ungroup elements', async ({ page }) => {});
test('should delete element', async ({ page }) => {});

// shortcuts.spec.ts
test('should copy with Ctrl+C', async ({ page }) => {});
test('should cut with Ctrl+X', async ({ page }) => {});
test('should paste with Ctrl+V', async ({ page }) => {});
test('should duplicate with Ctrl+D', async ({ page }) => {});
test('should bring to front with Ctrl+]', async ({ page }) => {});
test('should send to back with Ctrl+[', async ({ page }) => {});
test('should group with Ctrl+G', async ({ page }) => {});
test('should ungroup with Ctrl+Shift+G', async ({ page }) => {});
```

---

## Команды для запуска агентов

### Agent 1 (Setup)
```bash
cd wb-diagram-board
npm install -D @playwright/test playwright
npx playwright install chromium firefox

# Создать файлы
mkdir -p __tests__/e2e/setup
touch __tests__/e2e/setup/test-helpers.ts
touch __tests__/e2e/setup/page-objects.ts
touch __tests__/e2e/setup/fixtures.ts
touch playwright.config.ts

# Проверка
npm run test:e2e -- --list
```

### Agent 2 (Toolbar)
```bash
mkdir -p __tests__/e2e/toolbar
touch __tests__/e2e/toolbar/tools.spec.ts
touch __tests__/e2e/toolbar/undo-redo.spec.ts
touch __tests__/e2e/toolbar/tool-switching.spec.ts

# Запуск
npm run test:e2e toolbar/
```

### Agent 3 (Header)
```bash
mkdir -p __tests__/e2e/header
touch __tests__/e2e/header/menu.spec.ts
touch __tests__/e2e/header/export.spec.ts
touch __tests__/e2e/header/import.spec.ts
touch __tests__/e2e/header/settings.spec.ts

# Запуск
npm run test:e2e header/
```

### Agent 4 (Canvas Drawing)
```bash
mkdir -p __tests__/e2e/canvas
touch __tests__/e2e/canvas/drawing.spec.ts
touch __tests__/e2e/canvas/selection.spec.ts

# Запуск
npm run test:e2e canvas/drawing canvas/selection
```

### Agent 5 (Canvas Interactions)
```bash
touch __tests__/e2e/canvas/dragging.spec.ts
touch __tests__/e2e/canvas/resizing.spec.ts
touch __tests__/e2e/canvas/zoom-pan.spec.ts

# Запуск
npm run test:e2e canvas/dragging canvas/resizing canvas/zoom-pan
```

### Agent 6 (Style Panel)
```bash
mkdir -p __tests__/e2e/style-panel
touch __tests__/e2e/style-panel/stroke.spec.ts
touch __tests__/e2e/style-panel/fill.spec.ts
touch __tests__/e2e/style-panel/sticky-colors.spec.ts

# Запуск
npm run test:e2e style-panel/
```

### Agent 7 (Context Menu)
```bash
mkdir -p __tests__/e2e/context-menu
touch __tests__/e2e/context-menu/actions.spec.ts
touch __tests__/e2e/context-menu/shortcuts.spec.ts

# Запуск
npm run test:e2e context-menu/
```

### Agent 8 (Zoom Controls)
```bash
mkdir -p __tests__/e2e/zoom-controls
touch __tests__/e2e/zoom-controls/zoom.spec.ts

# Запуск
npm run test:e2e zoom-controls/
```

---

## Проверка прогресса

```bash
# Все тесты
npm run test:e2e

# С отчетом
npm run test:e2e:report

# Статистика
npm run test:e2e -- --reporter=json > test-results.json
```

---

## Итоговая статистика

| Агент | Файлов | Тестов | Время | Зависимости |
|-------|--------|--------|-------|-------------|
| Agent 1 | 4 | 1 | 2-3ч | - |
| Agent 2 | 3 | 21 | 1-2ч | Agent 1 |
| Agent 3 | 4 | 13 | 1-2ч | Agent 1 |
| Agent 4 | 2 | 13 | 2-3ч | Agent 1 |
| Agent 5 | 3 | 13 | 1-2ч | Agent 1, 4 |
| Agent 6 | 3 | 12 | 1-2ч | Agent 1, 4 |
| Agent 7 | 2 | 20 | 1-2ч | Agent 1, 4 |
| Agent 8 | 1 | 10 | 1ч | Agent 1 |
| **Итого** | **22** | **103** | **12-15ч** | - |

**Параллельное выполнение:** 4-5 часов (при 8 агентах)
