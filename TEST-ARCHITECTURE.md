# Архитектура E2E тестов - Полное покрытие

## Философия тестирования

### Принципы
1. **Каждое взаимодействие = отдельный тест**
2. **Page Object Pattern** для переиспользования
3. **Test Data Builders** для создания тестовых данных
4. **Visual Regression** для проверки отрисовки
5. **Матричное тестирование** для комбинаций

---

## Структура архитектуры

```
__tests__/e2e/
├── core/                           # Ядро тестовой инфраструктуры
│   ├── base-test.ts               # Базовый класс теста
│   ├── test-context.ts            # Контекст теста
│   ├── assertions.ts              # Кастомные проверки
│   └── matchers.ts                # Кастомные матчеры
│
├── fixtures/                       # Тестовые данные
│   ├── elements.ts                # Фикстуры элементов
│   ├── styles.ts                  # Фикстуры стилей
│   ├── canvas-states.ts           # Состояния canvas
│   └── interactions.ts            # Сценарии взаимодействий
│
├── page-objects/                   # Page Objects
│   ├── base-page.ts               # Базовый Page Object
│   ├── toolbar-page.ts            # Toolbar
│   ├── header-page.ts             # Header
│   ├── canvas-page.ts             # Canvas
│   ├── style-panel-page.ts        # Style Panel
│   ├── context-menu-page.ts       # Context Menu
│   ├── zoom-controls-page.ts      # Zoom Controls
│   └── text-editor-page.ts        # Text Editor
│
├── builders/                       # Test Data Builders
│   ├── element-builder.ts         # Строитель элементов
│   ├── interaction-builder.ts     # Строитель взаимодействий
│   └── canvas-builder.ts          # Строитель canvas
│
├── helpers/                        # Вспомогательные функции
│   ├── canvas-helpers.ts          # Работа с canvas
│   ├── element-helpers.ts         # Работа с элементами
│   ├── interaction-helpers.ts     # Взаимодействия
│   ├── visual-helpers.ts          # Визуальные проверки
│   └── keyboard-helpers.ts        # Клавиатура
│
├── specs/                          # Спецификации тестов
│   ├── tools/                     # Тесты инструментов
│   │   ├── select.spec.ts         # Select tool
│   │   ├── hand.spec.ts           # Hand tool
│   │   ├── shapes/                # Фигуры
│   │   │   ├── rectangle.spec.ts
│   │   │   ├── ellipse.spec.ts
│   │   │   ├── diamond.spec.ts
│   │   │   └── triangle.spec.ts
│   │   ├── lines/                 # Линии
│   │   │   ├── line.spec.ts
│   │   │   ├── arrow.spec.ts
│   │   │   └── connector.spec.ts
│   │   ├── drawing/               # Рисование
│   │   │   ├── freedraw.spec.ts
│   │   │   └── eraser.spec.ts
│   │   └── content/               # Контент
│   │       ├── text.spec.ts
│   │       ├── sticky.spec.ts
│   │       └── frame.spec.ts
│   │
│   ├── interactions/              # Взаимодействия
│   │   ├── selection/
│   │   │   ├── single-select.spec.ts
│   │   │   ├── multi-select.spec.ts
│   │   │   ├── box-select.spec.ts
│   │   │   └── shift-select.spec.ts
│   │   ├── manipulation/
│   │   │   ├── drag.spec.ts
│   │   │   ├── resize.spec.ts
│   │   │   ├── rotate.spec.ts
│   │   │   └── transform.spec.ts
│   │   ├── navigation/
│   │   │   ├── pan.spec.ts
│   │   │   ├── zoom.spec.ts
│   │   │   └── fit.spec.ts
│   │   └── editing/
│   │       ├── text-edit.spec.ts
│   │       ├── double-click.spec.ts
│   │       └── inline-edit.spec.ts
│   │
│   ├── styles/                    # Стили
│   │   ├── stroke/
│   │   │   ├── color.spec.ts
│   │   │   ├── width.spec.ts
│   │   │   └── style.spec.ts
│   │   ├── fill/
│   │   │   ├── type.spec.ts
│   │   │   └── color.spec.ts
│   │   ├── text/
│   │   │   ├── font.spec.ts
│   │   │   ├── size.spec.ts
│   │   │   └── alignment.spec.ts
│   │   └── special/
│   │       ├── sticky-colors.spec.ts
│   │       └── rough-style.spec.ts
│   │
│   ├── operations/                # Операции
│   │   ├── clipboard/
│   │   │   ├── copy.spec.ts
│   │   │   ├── cut.spec.ts
│   │   │   ├── paste.spec.ts
│   │   │   └── duplicate.spec.ts
│   │   ├── history/
│   │   │   ├── undo.spec.ts
│   │   │   ├── redo.spec.ts
│   │   │   └── history-stack.spec.ts
│   │   ├── z-order/
│   │   │   ├── bring-to-front.spec.ts
│   │   │   ├── send-to-back.spec.ts
│   │   │   ├── bring-forward.spec.ts
│   │   │   └── send-backward.spec.ts
│   │   ├── grouping/
│   │   │   ├── group.spec.ts
│   │   │   ├── ungroup.spec.ts
│   │   │   └── nested-groups.spec.ts
│   │   ├── alignment/
│   │   │   ├── align-left.spec.ts
│   │   │   ├── align-center.spec.ts
│   │   │   ├── align-right.spec.ts
│   │   │   ├── align-top.spec.ts
│   │   │   ├── align-middle.spec.ts
│   │   │   ├── align-bottom.spec.ts
│   │   │   ├── distribute-horizontal.spec.ts
│   │   │   └── distribute-vertical.spec.ts
│   │   └── locking/
│   │       ├── lock.spec.ts
│   │       └── unlock.spec.ts
│   │
│   ├── file-operations/           # Файловые операции
│   │   ├── new-canvas.spec.ts
│   │   ├── import-json.spec.ts
│   │   ├── export-json.spec.ts
│   │   └── export-png.spec.ts
│   │
│   ├── keyboard/                  # Клавиатура
│   │   ├── tool-shortcuts.spec.ts
│   │   ├── operation-shortcuts.spec.ts
│   │   ├── navigation-shortcuts.spec.ts
│   │   └── modifier-keys.spec.ts
│   │
│   ├── grid/                      # Сетка
│   │   ├── grid-toggle.spec.ts
│   │   ├── snap-to-grid.spec.ts
│   │   └── grid-size.spec.ts
│   │
│   ├── visual/                    # Визуальные тесты
│   │   ├── rendering/
│   │   │   ├── shapes-rendering.spec.ts
│   │   │   ├── lines-rendering.spec.ts
│   │   │   ├── text-rendering.spec.ts
│   │   │   └── rough-style-rendering.spec.ts
│   │   ├── themes/
│   │   │   ├── dark-mode.spec.ts
│   │   │   └── light-mode.spec.ts
│   │   └── responsive/
│   │       ├── zoom-levels.spec.ts
│   │       └── viewport-sizes.spec.ts
│   │
│   └── integration/               # Интеграционные тесты
│       ├── workflows/
│       │   ├── create-diagram.spec.ts
│       │   ├── edit-diagram.spec.ts
│       │   └── export-diagram.spec.ts
│       └── scenarios/
│           ├── flowchart.spec.ts
│           ├── wireframe.spec.ts
│           └── mindmap.spec.ts
```

---

## Матрица тестирования

### 1. Инструменты (Tools)

#### Фигуры (Shapes)
| Инструмент | Создание | Стили | Текст | Resize | Rotate | Lock | Group |
|-----------|---------|-------|-------|--------|--------|------|-------|
| Rectangle | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ellipse   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Diamond   | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Triangle  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Тесты для каждой фигуры:**
- Создание drag (start → end)
- Создание с Shift (пропорции)
- Минимальный размер (5x5)
- Максимальный размер
- Snap to grid
- Стили (stroke: 16 цветов × 6 толщин × 3 стиля = 288 комбинаций)
- Заливка (fill: 3 типа × 16 цветов = 48 комбинаций)
- Добавление текста (double-click)
- Редактирование текста
- Resize (8 ручек)
- Rotate
- Lock/Unlock
- Copy/Paste
- Duplicate
- Delete

**Итого на фигуру:** ~50 тестов  
**Всего:** 4 фигуры × 50 = **200 тестов**

---

#### Линии (Lines)
| Инструмент | Создание | Стили | Стрелки | Binding | Label |
|-----------|---------|-------|---------|---------|-------|
| Line      | ✓ | ✓ | ✓ | - | - |
| Arrow     | ✓ | ✓ | ✓ | ✓ | ✓ |
| Connector | ✓ | ✓ | ✓ | ✓ | ✓ |

**Тесты для каждой линии:**
- Создание (2 точки)
- Создание с Shift (45°, 90°)
- Стили stroke
- Стрелки (start: 6 типов, end: 6 типов = 36 комбинаций)
- Binding к элементам (для Arrow/Connector)
- Auto-routing (для Connector: straight, elbow, curved)
- Label (для Arrow/Connector)
- Waypoints (для Connector)
- Resize endpoints
- Delete

**Итого на линию:** ~40 тестов  
**Всего:** 3 линии × 40 = **120 тестов**

---

#### Рисование (Drawing)
| Инструмент | Создание | Стили | Pressure | Smooth |
|-----------|---------|-------|----------|--------|
| Freedraw  | ✓ | ✓ | ✓ | ✓ |
| Eraser    | ✓ | - | - | - |

**Тесты:**
- Freedraw: рисование, стили, pressure simulation, smooth
- Eraser: стирание элементов, частичное стирание

**Всего:** **20 тестов**

---

#### Контент (Content)
| Инструмент | Создание | Стили | Редактирование | Resize |
|-----------|---------|-------|----------------|--------|
| Text      | ✓ | ✓ | ✓ | ✓ |
| Sticky    | ✓ | ✓ | ✓ | ✓ |
| Frame     | ✓ | ✓ | - | ✓ |

**Тесты для каждого:**
- Text: создание, редактирование, стили (font, size, weight, align), resize
- Sticky: создание, цвета (6), редактирование, resize
- Frame: создание, child elements, clip, resize

**Всего:** **60 тестов**

---

### 2. Взаимодействия (Interactions)

#### Selection (Выделение)
- Single select (click)
- Multi select (box)
- Shift+click (add to selection)
- Ctrl+A (select all)
- Click empty (clear selection)
- Hover highlight
- Selection bounds
- Selection handles

**Всего:** **15 тестов**

---

#### Manipulation (Манипуляция)
- Drag single element
- Drag multiple elements
- Drag with Shift (constrain axis)
- Drag with snap to grid
- Resize (8 handles × 4 фигуры = 32)
- Resize with Shift (proportional)
- Resize with snap to grid
- Resize minimum size
- Rotate (not implemented yet)

**Всего:** **50 тестов**

---

#### Navigation (Навигация)
- Pan with Hand tool
- Pan with Space+drag
- Pan with middle mouse
- Zoom with wheel
- Zoom with Ctrl+wheel
- Zoom to cursor
- Zoom in button
- Zoom out button
- Zoom to fit
- Reset zoom
- Zoom limits (10%-1000%)

**Всего:** **20 тестов**

---

### 3. Стили (Styles)

#### Stroke
- Color (16 цветов)
- Width (6 вариантов)
- Style (3 варианта)
- Apply to single element
- Apply to multiple elements
- Default for new elements

**Всего:** **30 тестов**

---

#### Fill
- Type (3 варианта)
- Color (16 цветов)
- Apply to single element
- Apply to multiple elements
- Default for new elements

**Всего:** **25 тестов**

---

#### Text
- Font family
- Font size
- Font weight (normal, bold)
- Font style (normal, italic)
- Text align (left, center, right)
- Vertical align (top, middle, bottom)
- Color
- Line height

**Всего:** **20 тестов**

---

### 4. Операции (Operations)

#### Clipboard
- Copy (Ctrl+C)
- Cut (Ctrl+X)
- Paste (Ctrl+V)
- Paste with offset
- Duplicate (Ctrl+D)
- Copy multiple elements
- Paste multiple times

**Всего:** **15 тестов**

---

#### History
- Undo (Ctrl+Z)
- Redo (Ctrl+Y)
- Undo/Redo stack
- Undo after each operation
- History limit (100 entries)
- Clear history on import

**Всего:** **20 тестов**

---

#### Z-Order
- Bring to front (Ctrl+])
- Send to back (Ctrl+[)
- Bring forward
- Send backward
- Multiple elements

**Всего:** **10 тестов**

---

#### Grouping
- Group (Ctrl+G)
- Ungroup (Ctrl+Shift+G)
- Nested groups
- Move group
- Resize group
- Delete group

**Всего:** **15 тестов**

---

#### Alignment
- Align left
- Align center
- Align right
- Align top
- Align middle
- Align bottom
- Distribute horizontal
- Distribute vertical

**Всего:** **15 тестов**

---

### 5. Файловые операции (File Operations)

- New canvas (with confirmation)
- Import JSON (valid)
- Import JSON (invalid)
- Export JSON
- Export PNG (not implemented)
- Auto-save to localStorage
- Load from localStorage

**Всего:** **10 тестов**

---

### 6. Клавиатура (Keyboard)

#### Tool Shortcuts
- V (Select)
- H (Hand)
- R (Rectangle)
- O (Ellipse)
- D (Diamond)
- L (Line)
- A (Arrow)
- P (Pencil)
- T (Text)
- S (Sticky)
- F (Frame)
- C (Connector)
- E (Eraser)

**Всего:** **14 тестов**

---

#### Operation Shortcuts
- Ctrl+Z (Undo)
- Ctrl+Y (Redo)
- Ctrl+C (Copy)
- Ctrl+X (Cut)
- Ctrl+V (Paste)
- Ctrl+D (Duplicate)
- Ctrl+A (Select All)
- Delete (Delete)
- Ctrl+G (Group)
- Ctrl+Shift+G (Ungroup)
- Ctrl+] (Bring to Front)
- Ctrl+[ (Send to Back)

**Всего:** **12 тестов**

---

#### Navigation Shortcuts
- Ctrl++ (Zoom In)
- Ctrl+- (Zoom Out)
- Ctrl+0 (Reset Zoom)
- Ctrl+1 (Zoom to Fit)
- Space+Drag (Pan)

**Всего:** **5 тестов**

---

### 7. Сетка (Grid)

- Toggle grid visibility
- Toggle snap to grid
- Change grid size
- Snap while drawing
- Snap while dragging
- Snap while resizing

**Всего:** **10 тестов**

---

### 8. Визуальные тесты (Visual)

#### Rendering
- Shapes rendering (clean style)
- Shapes rendering (rough style)
- Lines rendering
- Text rendering
- Sticky rendering
- Frame rendering

**Всего:** **20 тестов**

---

#### Themes
- Dark mode toggle
- Light mode toggle
- Dark mode persistence
- Theme affects all elements

**Всего:** **8 тестов**

---

### 9. Интеграционные тесты (Integration)

#### Workflows
- Create flowchart (10 steps)
- Edit diagram (5 operations)
- Export diagram

**Всего:** **10 тестов**

---

## Итоговая статистика

| Категория | Тестов |
|-----------|--------|
| Инструменты - Фигуры | 200 |
| Инструменты - Линии | 120 |
| Инструменты - Рисование | 20 |
| Инструменты - Контент | 60 |
| Взаимодействия - Selection | 15 |
| Взаимодействия - Manipulation | 50 |
| Взаимодействия - Navigation | 20 |
| Стили - Stroke | 30 |
| Стили - Fill | 25 |
| Стили - Text | 20 |
| Операции - Clipboard | 15 |
| Операции - History | 20 |
| Операции - Z-Order | 10 |
| Операции - Grouping | 15 |
| Операции - Alignment | 15 |
| Файловые операции | 10 |
| Клавиатура - Tools | 14 |
| Клавиатура - Operations | 12 |
| Клавиатура - Navigation | 5 |
| Сетка | 10 |
| Визуальные - Rendering | 20 |
| Визуальные - Themes | 8 |
| Интеграционные | 10 |
| **ИТОГО** | **724 теста** |

---

## Приоритизация

### 🔴 P0 - Критичные (запуск каждый коммит)
- Создание базовых фигур (4 × 5 = 20 тестов)
- Selection (15 тестов)
- Drag (5 тестов)
- Undo/Redo (5 тестов)
- **Итого: 45 тестов**

### 🟡 P1 - Важные (запуск перед PR)
- Все инструменты (400 тестов)
- Все взаимодействия (85 тестов)
- Стили (75 тестов)
- **Итого: 560 тестов**

### 🟢 P2 - Дополнительные (запуск nightly)
- Визуальные тесты (28 тестов)
- Интеграционные (10 тестов)
- Edge cases (остальные)
- **Итого: 164 теста**

---

## Оптимизация выполнения

### Параллелизация
- Каждый spec файл = отдельный worker
- 8 workers = ~90 файлов / 8 = ~12 файлов на worker
- Время выполнения: ~30 минут (вместо 4 часов)

### Кэширование
- Снимки canvas состояний
- Предзагруженные фикстуры
- Переиспользование браузерных контекстов

### CI/CD стратегия
```yaml
# Быстрая проверка (5 мин)
on: push
  run: P0 tests (45 тестов)

# Полная проверка (30 мин)
on: pull_request
  run: P0 + P1 tests (605 тестов)

# Ночная проверка (1 час)
on: schedule (nightly)
  run: All tests (724 теста)
```
