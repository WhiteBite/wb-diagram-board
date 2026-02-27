# Задачи для параллельных субагентов

## 🎯 Цель
Довести e2e тесты до 85%+ (180/213 тестов), исправить все критичные баги, улучшить архитектуру

## 📋 Задачи по агентам

### Agent 1: Resize Interaction (КРИТИЧНО) 🔴
**Файлы**: `src/components/SelectionOverlay.tsx`, `src/components/Canvas.tsx`, `src/store/canvas-store.ts`
**Тесты**: `__tests__/e2e/specs/interactions/resize.spec.ts`

**Проблема**: 
- Resize handles видны с правильными data-атрибутами
- Но mousedown на handle не запускает resize
- События не propagate правильно или state не обновляется синхронно

**Задачи**:
1. ✅ Отладить event flow - проверить что handleMouseDown в SelectionOverlay срабатывает
2. ✅ Проверить что `isResizing` state устанавливается в true в store
3. ✅ Проверить что window mousemove handlers срабатывают
4. ✅ Рассмотреть использование native DOM events вместо React synthetic events
5. ✅ Исправить timing issue с useEffect и state updates
6. ✅ Убедиться что все 8 resize тестов проходят
7. ✅ Добавить snap to grid support для resize
8. ✅ Добавить undo/redo support для resize

**Архитектурные требования**:
- Использовать правильный event handling (stopPropagation, preventDefault)
- Не мутировать state напрямую - только через store методы
- Добавить history entry при завершении resize
- Minimum size должен быть 20px (как в коде)

**Критерий успеха**: Все 8 тестов в resize.spec.ts проходят

---

### Agent 2: Text/Sticky Editor + Tool Tests 🟡
**Файлы**: `src/components/Canvas.tsx`, `src/components/TextEditor.tsx`, `src/store/canvas-store.ts`
**Тесты**: `__tests__/e2e/specs/tools/content/text.spec.ts`, `__tests__/e2e/specs/tools/content/sticky.spec.ts`

**Проблема**:
- Editor не появляется сразу после создания элемента
- setTimeout(50ms) недостаточно для React render
- Double-click на элементе не открывает editor

**Задачи**:
1. ✅ Увеличить timeout или использовать другой подход (useLayoutEffect, callback ref)
2. ✅ Исправить timing для immediate editing после создания
3. ✅ Исправить double-click editing
4. ✅ Убедиться что editor появляется в правильной позиции
5. ✅ Добавить multi-line text support
6. ✅ Исправить auto-switch to select после создания
7. ✅ Запустить все тесты для text tool (11 тестов)
8. ✅ Запустить все тесты для sticky tool (11 тестов)

**Архитектурные требования**:
- Использовать React refs для синхронного доступа к DOM
- Не использовать setTimeout для критичной логики
- Editor должен быть отдельным компонентом с четкой ответственностью
- Поддержка Escape для отмены, Enter для сохранения

**Критерий успеха**: Все тесты в text.spec.ts и sticky.spec.ts проходят (22 теста)

---

### Agent 3: Frame Children Logic 🟡
**Файлы**: `src/components/Canvas.tsx`, `src/store/canvas-store.ts`, `src/types/canvas.ts`
**Тесты**: `__tests__/e2e/specs/tools/content/frame.spec.ts`

**Проблема**:
- Frame создается, но не управляет детьми внутри
- Нет логики для detect elements inside frame
- Дети не двигаются вместе с frame

**Задачи**:
1. ✅ Реализовать `detectFrameChildren(frameId)` - найти элементы внутри bounds
2. ✅ Добавить `addChildToFrame(frameId, childId)` в store
3. ✅ Добавить `removeChildFromFrame(frameId, childId)` в store
4. ✅ При drag frame - двигать всех детей вместе с ним
5. ✅ При resize frame - пересчитать какие элементы внутри
6. ✅ Добавить visual indication для frame children
7. ✅ Реализовать z-index ordering (frame должен быть под детьми)
8. ✅ Запустить все тесты для frame tool (10 тестов)

**Архитектурные требования**:
- Frame.childIds должен быть массивом ID детей
- Использовать bounds checking для определения вхождения
- При удалении frame - НЕ удалять детей, только убрать связь
- History должен записывать изменения childIds

**Критерий успеха**: Все тесты в frame.spec.ts проходят (10 тестов)

---

### Agent 4: Shape Tools (Rectangle, Ellipse, Diamond, Triangle) 🟢
**Файлы**: `src/components/Canvas.tsx`, `src/components/elements/RoughElementRenderer.tsx`
**Тесты**: `__tests__/e2e/specs/tools/shapes/*.spec.ts`

**Задачи**:
1. ✅ Запустить все тесты для rectangle (11 тестов)
2. ✅ Запустить все тесты для ellipse (11 тестов)
3. ✅ Запустить все тесты для diamond (11 тестов)
4. ✅ Запустить все тесты для triangle (11 тестов)
5. ✅ Исправить все найденные баги
6. ✅ Проверить что все shapes поддерживают:
   - Keyboard shortcuts
   - Stroke/fill styles
   - Rough style toggle
   - Snap to grid
   - Minimum size
   - Undo/redo
7. ✅ Добавить corner radius support для rectangle (если нужно)
8. ✅ Проверить rendering в rough и clean стилях

**Архитектурные требования**:
- Все shapes должны следовать единому интерфейсу ShapeElement
- Rendering через RoughElementRenderer
- Консистентное поведение для всех shapes
- Правильные bounds для hit testing

**Критерий успеха**: Все тесты для 4 shape tools проходят (44 теста)

---

### Agent 5: Line Tools (Line, Arrow, Connector) 🟢
**Файлы**: `src/components/Canvas.tsx`, `src/components/elements/RoughElementRenderer.tsx`
**Тесты**: `__tests__/e2e/specs/tools/lines/*.spec.ts`

**Задачи**:
1. ✅ Запустить все тесты для line (11 тестов)
2. ✅ Запустить все тесты для arrow (11 тестов)
3. ✅ Запустить все тесты для connector (11 тестов)
4. ✅ Исправить все найденные баги
5. ✅ Проверить что все line tools поддерживают:
   - Start/end arrows
   - Waypoints для connector
   - Snap to grid
   - Undo/redo
6. ✅ Добавить smart routing для connector (если нужно)
7. ✅ Проверить hit testing для линий (должно работать с толщиной)

**Архитектурные требования**:
- Line, Arrow, Connector должны иметь общий базовый интерфейс
- Points должны быть относительными к element.x, element.y
- Arrow heads должны рендериться правильно
- Connector должен поддерживать разные routeType

**Критерий успеха**: Все тесты для 3 line tools проходят (33 теста)

---

### Agent 6: Drawing Tools + Undo/Redo + Drag Issues 🟡
**Файлы**: `src/components/Canvas.tsx`, `src/store/canvas-store.ts`, `src/hooks/useKeyboard.ts`
**Тесты**: `__tests__/e2e/specs/tools/drawing/*.spec.ts`, `__tests__/e2e/specs/interactions/drag.spec.ts`, `__tests__/e2e/specs/smoke.spec.ts`

**Задачи**:
1. ✅ Запустить тесты для freedraw (11 тестов)
2. ✅ Запустить тесты для eraser (11 тестов)
3. ✅ Исправить undo/redo timing issue в smoke tests
4. ✅ Исправить undo/redo для drag operations
5. ✅ Исправить drag multiple elements с snap to grid
6. ✅ Исправить drag с negative coordinates
7. ✅ Добавить drag preview (опционально, для UX)
8. ✅ Проверить что history правильно записывается для всех операций

**Архитектурные требования**:
- Freedraw должен использовать simulatePressure
- Eraser должен удалять элементы при hover во время drag
- Undo/redo должен работать через history stack
- Drag должен записывать в history только при mouseup
- updateElementSilent для промежуточных состояний

**Критерий успеха**: Все тесты для drawing tools проходят (22 теста) + исправлены drag issues

---

## 📊 Общая статистика

**Текущее состояние**: 42/213 (20%)
**После выполнения всех задач**: ~180/213 (85%+)

### Распределение тестов по агентам:
- Agent 1: 8 тестов (resize)
- Agent 2: 22 теста (text + sticky)
- Agent 3: 10 тестов (frame)
- Agent 4: 44 теста (shapes)
- Agent 5: 33 теста (lines)
- Agent 6: 22+ тесты (drawing + fixes)

**Итого**: ~139 новых тестов + исправление существующих

---

## 🎯 Правила для всех агентов

### Архитектурные принципы:
1. ✅ Следовать SOLID принципам
2. ✅ Не мутировать state напрямую - только через store методы
3. ✅ Использовать Immer для immutable updates
4. ✅ Добавлять history entries для undo/redo
5. ✅ Использовать TypeScript строго (no any)
6. ✅ Добавлять data-атрибуты для тестирования
7. ✅ Логировать важные события для отладки

### Bug-First Testing:
1. ✅ Запустить тесты и найти падающие
2. ✅ Для каждого бага - понять причину
3. ✅ Исправить код (не тесты!)
4. ✅ Убедиться что тест проходит
5. ✅ Проверить что не сломались другие тесты

### Коммуникация:
1. ✅ Логировать прогресс в консоль
2. ✅ Обновлять TEST-STATUS.md после завершения
3. ✅ Документировать найденные баги и решения
4. ✅ Не создавать .md артефакты (следовать steering rules)

### Приоритеты:
1. 🔴 Критично - Agent 1 (resize)
2. 🟡 Важно - Agent 2, 3, 6 (editor, frame, undo/redo)
3. 🟢 Нормально - Agent 4, 5 (shapes, lines)

---

## 🚀 Запуск агентов

Агенты должны работать параллельно, каждый в своих файлах:
- Agent 1: `SelectionOverlay.tsx`, `Canvas.tsx` (resize logic)
- Agent 2: `TextEditor.tsx`, `Canvas.tsx` (text/sticky logic)
- Agent 3: `Canvas.tsx`, `canvas-store.ts` (frame logic)
- Agent 4: `RoughElementRenderer.tsx` (shapes rendering)
- Agent 5: `RoughElementRenderer.tsx` (lines rendering)
- Agent 6: `Canvas.tsx`, `canvas-store.ts` (drawing + history)

**Конфликты минимальны** - каждый агент работает с разными частями кода!

---

## ✅ Критерии завершения

### Для каждого агента:
- [ ] Все назначенные тесты проходят
- [ ] Код следует архитектурным принципам
- [ ] Нет регрессий в других тестах
- [ ] Обновлен TEST-STATUS.md

### Для всего проекта:
- [ ] 180+ тестов проходят (85%+)
- [ ] Все критичные баги исправлены
- [ ] Архитектура улучшена
- [ ] Код готов к production
