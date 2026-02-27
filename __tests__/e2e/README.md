# E2E Test Infrastructure

Базовая инфраструктура для end-to-end тестирования wb-diagram-board с использованием Playwright.

## Структура

```
__tests__/e2e/
├── core/                    # Базовые типы и тест-хелперы
│   ├── types.ts            # TypeScript типы для тестов
│   └── base-test.ts        # Расширенный test с fixtures
├── helpers/                 # Вспомогательные функции
│   ├── canvas-helpers.ts   # Работа с canvas
│   ├── toolbar-helpers.ts  # Работа с toolbar
│   └── keyboard-helpers.ts # Клавиатурные взаимодействия
├── fixtures/                # Тестовые данные
│   └── test-data.ts        # Моки и константы
└── specs/                   # Тестовые спецификации
    ├── smoke.spec.ts       # Smoke тесты
    ├── tools/              # Тесты инструментов
    │   ├── shapes/         # Тесты фигур
    │   ├── lines/          # Тесты линий
    │   ├── content/        # Тесты контента
    │   └── drawing/        # Тесты рисования
    └── interactions/        # Тесты взаимодействий
```

## Запуск тестов

```bash
# Запустить все тесты
npm run test:e2e

# Запустить с UI
npm run test:e2e:ui

# Запустить в debug режиме
npm run test:e2e:debug

# Запустить с видимым браузером
npm run test:e2e:headed

# Показать список тестов
npm run test:e2e:list
```

## Использование

### Базовый тест

```typescript
import { test, expect, setupTest } from '../core/base-test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page, canvas }) => {
    await setupTest(page, canvas);
  });

  test('should do something', async ({ canvas, toolbar, keyboard }) => {
    // Ваш тест
  });
});
```

### Canvas Helpers

```typescript
// Рисование элемента
const elementId = await canvas.draw
  .from(100, 100)
  .to(300, 200)
  .withShift()  // Опционально: с зажатым Shift
  .execute();

// Выбор элемента
await canvas.select
  .element(elementId)
  .execute();

// Перетаскивание
await canvas.drag
  .from(100, 100)
  .to(200, 200)
  .withShift()  // Опционально: с зажатым Shift
  .execute();

// Получение элемента
const element = await canvas.getElement(elementId);

// Получение всех элементов
const elements = await canvas.getAllElements();

// Получение выбранных ID
const selectedIds = await canvas.getSelectedIds();
```

### Toolbar Helpers

```typescript
// Выбор инструмента
await toolbar.selectTool('rectangle');

// Проверка активного инструмента
const activeTool = await toolbar.getActiveTool();
const isActive = await toolbar.isToolActive('rectangle');

// Undo/Redo
await toolbar.undo();
await toolbar.redo();
const canUndo = await toolbar.canUndo();
const canRedo = await toolbar.canRedo();
```

### Keyboard Helpers

```typescript
// Нажатие клавиши
await keyboard.pressKey('Delete');

// Нажатие нескольких клавиш
await keyboard.pressKeys(['Control', 'c']);

// Удержание клавиши
await keyboard.holdKey('Shift', async () => {
  // Действия с зажатым Shift
});

// Шорткаты
await keyboard.delete();
await keyboard.selectAll();
await keyboard.copy();
await keyboard.paste();
await keyboard.undo();
await keyboard.redo();
```

## Custom Matchers

```typescript
// Проверка наличия элемента
await expect(page).toHaveElement(elementId);

// Проверка количества выбранных элементов
await expect(page).toHaveSelectedElements(2);

// Проверка трансформации canvas
await expect(page).toHaveTransform({ x: 0, y: 0, scale: 1 });
```

## Тестовые данные

```typescript
import { 
  TEST_POSITIONS, 
  TEST_SIZES, 
  TEST_COLORS,
  createMockRectangle,
  createMockEllipse,
} from '../fixtures/test-data';

// Использование констант
const rect = createMockRectangle({
  x: TEST_POSITIONS.CENTER.x,
  y: TEST_POSITIONS.CENTER.y,
  ...TEST_SIZES.MEDIUM,
  strokeColor: TEST_COLORS.RED,
});
```

## Конфигурация

Настройки в `playwright.config.ts`:
- **testDir**: `./__tests__/e2e/specs`
- **baseURL**: `http://localhost:5173`
- **workers**: 8 (для параллелизации)
- **webServer**: автоматический запуск dev server
- **reporters**: html, json, junit

## Следующие шаги

Другие агенты будут создавать тесты в соответствующих папках:
- Agent 2: Тесты инструментов фигур (shapes)
- Agent 3: Тесты инструментов линий (lines)
- Agent 4: Тесты инструментов контента (content)
- Agent 5: Тесты инструментов рисования (drawing)
- Agent 6: Тесты взаимодействий (interactions)
