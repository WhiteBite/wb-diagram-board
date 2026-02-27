# E2E Testing Plan for WB Diagram Board

## 📊 Общая статистика

- **Всего тестов:** 724
- **Файлов:** ~90
- **Агентов:** 8
- **Время выполнения (параллельно):** 4-5 часов
- **Время выполнения (последовательно):** 15-20 часов

## 🎯 Цель

Создать полное покрытие e2e тестами для КАЖДОГО:
- Инструмента (14 инструментов)
- Взаимодействия (selection, drag, resize, rotate, etc.)
- Стиля (stroke, fill, text)
- Операции (copy, paste, undo, redo, group, align, etc.)
- Клавиши (shortcuts для всех действий)

## 📚 Документация

- `TEST-ARCHITECTURE.md` - Полная архитектура (724 теста)
- `TEST-IMPLEMENTATION.md` - Детальная реализация
- `E2E-SETUP.md` - Setup guide
- `AGENTS-PLAN.md` - План для агентов

# E2E Testing Plan for WB Diagram Board

## Архитектура тестов

### Структура
```
__tests__/
├── e2e/
│   ├── setup/
│   │   ├── test-helpers.ts      # Общие хелперы
│   │   ├── page-objects.ts      # Page Object паттерн
│   │   └── fixtures.ts          # Тестовые данные
│   ├── toolbar/
│   │   ├── tools.spec.ts        # Тесты инструментов
│   │   ├── undo-redo.spec.ts    # Undo/Redo
│   │   └── tool-switching.spec.ts
│   ├── header/
│   │   ├── menu.spec.ts         # Меню действия
│   │   ├── export.spec.ts       # Экспорт
│   │   ├── import.spec.ts       # Импорт
│   │   └── settings.spec.ts     # Настройки
│   ├── canvas/
│   │   ├── drawing.spec.ts      # Рисование фигур
│   │   ├── selection.spec.ts    # Выделение
│   │   ├── dragging.spec.ts     # Перетаскивание
│   │   ├── resizing.spec.ts     # Изменение размера
│   │   └── zoom-pan.spec.ts     # Зум и панорамирование
│   ├── style-panel/
│   │   ├── stroke.spec.ts       # Стили обводки
│   │   ├── fill.spec.ts         # Заливка
│   │   └── sticky-colors.spec.ts
│   ├── context-menu/
│   │   ├── actions.spec.ts      # Действия меню
│   │   └── shortcuts.spec.ts    # Горячие клавиши
│   └── zoom-controls/
│       └── zoom.spec.ts         # Контролы зума
├── playwright.config.ts
└── vitest.config.e2e.ts
```

## Задачи для параллельной работы

### 🤖 Agent 1: Setup & Infrastructure
**Файлы:** `setup/`, `playwright.config.ts`, `vitest.config.e2e.ts`

- [ ] Установить Playwright
- [ ] Настроить конфигурацию тестов
- [ ] Создать базовые хелперы (waitForCanvas, getCanvasElement)
- [ ] Создать Page Object для основных компонентов
- [ ] Создать фикстуры (тестовые данные, моки)
- [ ] Настроить скриншоты и видео для отладки

**Зависимости:** Нет  
**Приоритет:** 🔴 Высокий (блокирует других)

---

### 🤖 Agent 2: Toolbar Tests
**Файлы:** `toolbar/*.spec.ts`

**Зависит от:** Agent 1 (setup)

- [ ] Тест выбора каждого инструмента (14 инструментов)
- [ ] Тест активного состояния кнопки
- [ ] Тест Undo/Redo (enabled/disabled состояния)
- [ ] Тест переключения между инструментами
- [ ] Тест горячих клавиш (V, H, R, O, D, L, A, P, T, S, F, C, E)
- [ ] Тест что после создания фигуры автоматически Select

**Интерактивные элементы:**
- 14 кнопок инструментов
- 2 кнопки Undo/Redo

---

### 🤖 Agent 3: Header & Menu Tests
**Файлы:** `header/*.spec.ts`

**Зависит от:** Agent 1 (setup)

- [ ] Тест открытия/закрытия меню
- [ ] Тест "New Canvas" (с подтверждением)
- [ ] Тест "Import JSON" (загрузка файла)
- [ ] Тест "Export JSON" (скачивание)
- [ ] Тест "Export PNG" (alert пока не реализовано)
- [ ] Тест переключения Dark/Light mode
- [ ] Тест переключения Rough/Clean style
- [ ] Тест кнопки Help
- [ ] Тест ссылки на GitHub

**Интерактивные элементы:**
- 1 кнопка Menu
- 4 пункта меню (New, Import, Export JSON, Export PNG)
- 4 кнопки в header (Rough/Clean, Dark/Light, Help, GitHub)

---

### 🤖 Agent 4: Canvas Drawing Tests
**Файлы:** `canvas/drawing.spec.ts`, `canvas/selection.spec.ts`

**Зависит от:** Agent 1, Agent 2 (toolbar)

- [ ] Тест рисования Rectangle (drag to create)
- [ ] Тест рисования Ellipse
- [ ] Тест рисования Diamond
- [ ] Тест рисования Triangle
- [ ] Тест рисования Line
- [ ] Тест рисования Arrow
- [ ] Тест Freedraw (pencil)
- [ ] Тест создания Text (click to create)
- [ ] Тест создания Sticky Note
- [ ] Тест выделения одного элемента
- [ ] Тест выделения нескольких (selection box)
- [ ] Тест Shift+click для добавления к выделению
- [ ] Тест снятия выделения (click на пустое место)

**Интерактивные элементы:**
- Canvas (drag, click, selection box)

---

### 🤖 Agent 5: Canvas Interaction Tests
**Файлы:** `canvas/dragging.spec.ts`, `canvas/resizing.spec.ts`, `canvas/zoom-pan.spec.ts`

**Зависит от:** Agent 1, Agent 4 (drawing)

- [ ] Тест перетаскивания одного элемента
- [ ] Тест перетаскивания нескольких элементов
- [ ] Тест snap to grid при перетаскивании
- [ ] Тест изменения размера (8 ручек: nw, n, ne, w, e, sw, s, se)
- [ ] Тест минимального размера при resize
- [ ] Тест snap to grid при resize
- [ ] Тест Hand tool (pan)
- [ ] Тест Space+drag для временного pan
- [ ] Тест Wheel для zoom
- [ ] Тест zoom к курсору мыши
- [ ] Тест double-click для редактирования текста

**Интерактивные элементы:**
- Canvas (drag, resize handles, wheel, space+drag)

---

### 🤖 Agent 6: Style Panel Tests
**Файлы:** `style-panel/*.spec.ts`

**Зависит от:** Agent 1, Agent 4 (drawing)

- [ ] Тест появления панели при выделении
- [ ] Тест скрытия панели при снятии выделения
- [ ] Тест выбора цвета обводки (16 цветов)
- [ ] Тест выбора толщины обводки (6 вариантов)
- [ ] Тест выбора стиля обводки (solid, dashed, dotted)
- [ ] Тест выбора типа заливки (solid, hachure, none)
- [ ] Тест выбора цвета заливки (16 цветов)
- [ ] Тест цветов Sticky Note (5 цветов)
- [ ] Тест сворачивания/разворачивания секций
- [ ] Тест применения стилей к выделенным элементам

**Интерактивные элементы:**
- 16 кнопок цвета обводки
- 6 кнопок толщины
- 3 кнопки стиля обводки
- 3 кнопки типа заливки
- 16 кнопок цвета заливки
- 5 кнопок цвета sticky
- 3 кнопки сворачивания секций

---

### 🤖 Agent 7: Context Menu Tests
**Файлы:** `context-menu/*.spec.ts`

**Зависит от:** Agent 1, Agent 4 (drawing)

- [ ] Тест открытия контекстного меню (right-click)
- [ ] Тест закрытия меню (click outside, Escape)
- [ ] Тест Copy (Ctrl+C)
- [ ] Тест Cut (Ctrl+X)
- [ ] Тест Paste (Ctrl+V)
- [ ] Тест Duplicate (Ctrl+D)
- [ ] Тест Bring to Front (Ctrl+])
- [ ] Тест Send to Back (Ctrl+[)
- [ ] Тест Lock/Unlock
- [ ] Тест Group (Ctrl+G)
- [ ] Тест Ungroup (Ctrl+Shift+G)
- [ ] Тест Delete (Del)
- [ ] Тест disabled состояний (нет выделения, нет clipboard)

**Интерактивные элементы:**
- 12 пунктов меню
- Context menu trigger (right-click)

---

### 🤖 Agent 8: Zoom Controls Tests
**Файлы:** `zoom-controls/*.spec.ts`

**Зависит от:** Agent 1

- [ ] Тест Zoom In (кнопка и Ctrl++)
- [ ] Тест Zoom Out (кнопка и Ctrl+-)
- [ ] Тест отображения процента зума
- [ ] Тест Zoom to Fit (Ctrl+1)
- [ ] Тест Reset Zoom (Ctrl+0)
- [ ] Тест минимального зума (10%)
- [ ] Тест максимального зума (1000%)

**Интерактивные элементы:**
- 4 кнопки (Zoom In, Zoom Out, Fit, Reset)
- 1 текстовое поле (процент зума)

---

## Общая статистика

### Интерактивные элементы (всего ~100+)
- **Toolbar:** 16 кнопок
- **Header:** 9 элементов
- **Canvas:** бесконечное количество взаимодействий
- **Style Panel:** 50+ кнопок
- **Context Menu:** 12 пунктов
- **Zoom Controls:** 5 элементов

### Приоритеты выполнения
1. 🔴 **Agent 1** (Setup) — блокирует всех
2. 🟡 **Agent 2, 3** (Toolbar, Header) — независимые
3. 🟡 **Agent 4** (Drawing) — нужен для Agent 5, 6, 7
4. 🟢 **Agent 5, 6, 7, 8** (Interactions) — могут работать параллельно после Agent 4

### Оценка времени
- Agent 1: 2-3 часа (setup)
- Agent 2-8: по 1-2 часа каждый
- **Итого:** ~12-15 часов работы, но параллельно = 4-5 часов

## Принципы тестирования

### Page Object Pattern
```typescript
class ToolbarPage {
  async selectTool(tool: string) { }
  async isToolActive(tool: string): Promise<boolean> { }
  async undo() { }
  async redo() { }
}
```

### Хелперы
```typescript
async function createRectangle(page, x, y, width, height) { }
async function selectElement(page, elementId) { }
async function waitForCanvas(page) { }
```

### Assertions
- Проверка видимости элементов
- Проверка активных состояний
- Проверка disabled состояний
- Проверка изменений в canvas (через snapshot)
- Проверка стилей элементов

### Скриншоты
- Делать скриншот при падении теста
- Сравнивать визуальные изменения (visual regression)
