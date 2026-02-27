# План параллельного выполнения агентов

## 🎯 Стратегия параллелизации

### Принцип разделения
Каждый агент работает с **ОТДЕЛЬНЫМИ файлами** - никаких конфликтов!

---

## 🤖 Agent 1: Core Infrastructure (БЛОКИРУЮЩИЙ)

### Задача
Создать базовую инфраструктуру, которую будут использовать все остальные

### Файлы (только создание, без тестов)
```
__tests__/e2e/
├── core/
│   ├── base-test.ts          ✓ Agent 1
│   ├── types.ts              ✓ Agent 1
│   └── test-context.ts       ✓ Agent 1
├── helpers/
│   ├── canvas-helpers.ts     ✓ Agent 1
│   ├── toolbar-helpers.ts    ✓ Agent 1
│   ├── keyboard-helpers.ts   ✓ Agent 1
│   └── wait-helpers.ts       ✓ Agent 1
├── fixtures/
│   └── test-data.ts          ✓ Agent 1
playwright.config.ts          ✓ Agent 1
```

### Промпт для Agent 1
```
Создай базовую инфраструктуру e2e тестов для wb-diagram-board:

1. Установи зависимости:
   - npm install -D @playwright/test playwright

2. Создай playwright.config.ts с настройками

3. Создай базовые файлы:
   - __tests__/e2e/core/base-test.ts - базовый тест с fixtures
   - __tests__/e2e/core/types.ts - TypeScript типы
   - __tests__/e2e/helpers/canvas-helpers.ts - хелперы для canvas
   - __tests__/e2e/helpers/toolbar-helpers.ts - хелперы для toolbar
   - __tests__/e2e/helpers/keyboard-helpers.ts - хелперы клавиатуры
   - __tests__/e2e/fixtures/test-data.ts - тестовые данные

4. Создай один простой тест для проверки:
   - __tests__/e2e/smoke.spec.ts - проверка что всё работает

НЕ создавай другие тесты - только инфраструктуру!

Используй документацию из TEST-IMPLEMENTATION.md
```

---

## 🌊 Волна 2: Параллельные агенты (после Agent 1)

### 🤖 Agent 2: Select & Hand Tools

**Файлы:**
```
__tests__/e2e/specs/tools/
├── select.spec.ts            ✓ Agent 2
└── hand.spec.ts              ✓ Agent 2
```

**Промпт:**
```
Создай e2e тесты для Select и Hand инструментов в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/tools/select.spec.ts
- __tests__/e2e/specs/tools/hand.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты для Select:
- Активация по умолчанию
- Активация клавишей V
- Выделение одного элемента
- Выделение box selection
- Shift+click для добавления
- Очистка выделения

Тесты для Hand:
- Активация клавишей H
- Pan с помощью drag
- Space+drag для временного pan
- Курсор меняется на hand

Используй примеры из AGENTS-COMMANDS.md
```

---

### 🤖 Agent 3: Shape Tools (Rectangle, Ellipse)

**Файлы:**
```
__tests__/e2e/specs/tools/shapes/
├── rectangle.spec.ts         ✓ Agent 3
└── ellipse.spec.ts           ✓ Agent 3
```

**Промпт:**
```
Создай e2e тесты для Rectangle и Ellipse инструментов в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/tools/shapes/rectangle.spec.ts
- __tests__/e2e/specs/tools/shapes/ellipse.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты для каждой фигуры:
- Активация клавишей (R для rectangle, O для ellipse)
- Создание drag
- Создание с Shift (пропорции)
- Snap to grid
- Минимальный размер
- Авто-переключение на Select
- Применение текущих стилей

Используй примеры из AGENTS-COMMANDS.md
```

---

### 🤖 Agent 4: Shape Tools (Diamond, Triangle)

**Файлы:**
```
__tests__/e2e/specs/tools/shapes/
├── diamond.spec.ts           ✓ Agent 4
└── triangle.spec.ts          ✓ Agent 4
```

**Промпт:**
```
Создай e2e тесты для Diamond и Triangle инструментов в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/tools/shapes/diamond.spec.ts
- __tests__/e2e/specs/tools/shapes/triangle.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты для каждой фигуры:
- Активация клавишей (D для diamond)
- Создание drag
- Создание с Shift (пропорции)
- Snap to grid
- Минимальный размер
- Авто-переключение на Select
- Применение текущих стилей

Используй примеры из AGENTS-COMMANDS.md
```

---

### 🤖 Agent 5: Line Tools

**Файлы:**
```
__tests__/e2e/specs/tools/lines/
├── line.spec.ts              ✓ Agent 5
├── arrow.spec.ts             ✓ Agent 5
└── connector.spec.ts         ✓ Agent 5
```

**Промпт:**
```
Создай e2e тесты для Line, Arrow и Connector инструментов в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/tools/lines/line.spec.ts
- __tests__/e2e/specs/tools/lines/arrow.spec.ts
- __tests__/e2e/specs/tools/lines/connector.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты для каждого инструмента:
- Активация клавишей (L, A, C)
- Создание линии
- Создание с Shift (45°, 90°)
- Стили stroke
- Стрелки (для Arrow/Connector)
- Авто-переключение на Select

Используй примеры из AGENTS-COMMANDS.md
```

---

### 🤖 Agent 6: Content Tools

**Файлы:**
```
__tests__/e2e/specs/tools/content/
├── text.spec.ts              ✓ Agent 6
├── sticky.spec.ts            ✓ Agent 6
└── frame.spec.ts             ✓ Agent 6
```

**Промпт:**
```
Создай e2e тесты для Text, Sticky и Frame инструментов в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/tools/content/text.spec.ts
- __tests__/e2e/specs/tools/content/sticky.spec.ts
- __tests__/e2e/specs/tools/content/frame.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты:
- Text: создание, редактирование, стили
- Sticky: создание, цвета (6), редактирование
- Frame: создание, child elements, resize

Используй примеры из AGENTS-COMMANDS.md
```

---

### 🤖 Agent 7: Drawing Tools

**Файлы:**
```
__tests__/e2e/specs/tools/drawing/
├── freedraw.spec.ts          ✓ Agent 7
└── eraser.spec.ts            ✓ Agent 7
```

**Промпт:**
```
Создай e2e тесты для Freedraw и Eraser инструментов в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/tools/drawing/freedraw.spec.ts
- __tests__/e2e/specs/tools/drawing/eraser.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты:
- Freedraw: рисование, стили, pressure simulation
- Eraser: стирание элементов

Используй примеры из AGENTS-COMMANDS.md
```

---

### 🤖 Agent 8: Interactions

**Файлы:**
```
__tests__/e2e/specs/interactions/
├── selection.spec.ts         ✓ Agent 8
├── drag.spec.ts              ✓ Agent 8
└── resize.spec.ts            ✓ Agent 8
```

**Промпт:**
```
Создай e2e тесты для взаимодействий (selection, drag, resize) в wb-diagram-board.

Файлы для создания:
- __tests__/e2e/specs/interactions/selection.spec.ts
- __tests__/e2e/specs/interactions/drag.spec.ts
- __tests__/e2e/specs/interactions/resize.spec.ts

Используй базовую инфраструктуру из __tests__/e2e/core/

Тесты:
- Selection: single, multi, box, shift
- Drag: single, multi, snap to grid
- Resize: 8 handles, minimum size, snap

Используй примеры из TEST-ARCHITECTURE.md
```

---

## 📊 Матрица зависимостей

```
Agent 1 (Setup) ─┬─→ Agent 2 (Select/Hand)
                 ├─→ Agent 3 (Rectangle/Ellipse)
                 ├─→ Agent 4 (Diamond/Triangle)
                 ├─→ Agent 5 (Lines)
                 ├─→ Agent 6 (Content)
                 ├─→ Agent 7 (Drawing)
                 └─→ Agent 8 (Interactions)
```

**Агенты 2-8 полностью независимы и работают параллельно!**

---

## 🚀 Порядок запуска

### Шаг 1: Запустить Agent 1
```
Ждем завершения Agent 1 (~30 минут)
```

### Шаг 2: Запустить всех остальных параллельно
```
Запускаем одновременно:
- Agent 2 (Select/Hand)
- Agent 3 (Rectangle/Ellipse)
- Agent 4 (Diamond/Triangle)
- Agent 5 (Lines)
- Agent 6 (Content)
- Agent 7 (Drawing)
- Agent 8 (Interactions)

Все работают параллельно (~1 час)
```

---

## ✅ Проверка конфликтов

### Файлы Agent 1 (общие)
- `playwright.config.ts`
- `__tests__/e2e/core/*`
- `__tests__/e2e/helpers/*`
- `__tests__/e2e/fixtures/*`

### Файлы Agent 2-8 (уникальные)
Каждый агент работает в своей папке:
- Agent 2: `specs/tools/select.spec.ts`, `specs/tools/hand.spec.ts`
- Agent 3: `specs/tools/shapes/rectangle.spec.ts`, `specs/tools/shapes/ellipse.spec.ts`
- Agent 4: `specs/tools/shapes/diamond.spec.ts`, `specs/tools/shapes/triangle.spec.ts`
- Agent 5: `specs/tools/lines/*`
- Agent 6: `specs/tools/content/*`
- Agent 7: `specs/tools/drawing/*`
- Agent 8: `specs/interactions/*`

**НЕТ ПЕРЕСЕЧЕНИЙ = НЕТ КОНФЛИКТОВ!**

---

## 📈 Итоговая статистика

| Агент | Файлов | Тестов | Время | Блокирует |
|-------|--------|--------|-------|-----------|
| Agent 1 | 8 | 1 | 30 мин | Всех |
| Agent 2 | 2 | 12 | 1 час | - |
| Agent 3 | 2 | 16 | 1 час | - |
| Agent 4 | 2 | 16 | 1 час | - |
| Agent 5 | 3 | 24 | 1 час | - |
| Agent 6 | 3 | 18 | 1 час | - |
| Agent 7 | 2 | 10 | 1 час | - |
| Agent 8 | 3 | 20 | 1 час | - |

**Общее время: 1.5 часа (вместо 8 часов последовательно)**
