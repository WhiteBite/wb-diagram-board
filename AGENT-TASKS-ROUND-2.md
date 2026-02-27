# Задачи для агентов - Раунд 2

## 🚨 КРИТИЧЕСКИЕ ПРАВИЛА

### ❌ ЗАПРЕЩЕНО:
1. **НЕ запускать интерактивные команды** (--headed, --debug, --ui)
2. **НЕ изменять тесты** - только исправлять код приложения
3. **НЕ подгонять тесты под код** - код должен соответствовать тестам
4. **НЕ создавать .md файлы** с отчетами (только обновлять TEST-STATUS.md)
5. **НЕ использовать команды требующие ввода пользователя**

### ✅ РАЗРЕШЕНО:
1. Запускать тесты в headless режиме: `npx playwright test <file>`
2. Исправлять код приложения в src/
3. Добавлять методы в store
4. Улучшать архитектуру
5. Логировать в консоль для отладки

---

## Agent 1: Resize Interaction Fix (КРИТИЧНО) 🔴

### Задача
Исправить resize interaction - самая критичная проблема.

### Проблема
Resize handles видны, но не работают. Причина: конфликт между SelectionOverlay и Canvas event handlers.

### Что делать
1. **Прочитай код**:
   - `src/components/SelectionOverlay.tsx` (handle mousedown)
   - `src/components/Canvas.tsx` (resize logic в handleMouseMove)
   - `src/store/canvas-store.ts` (setResizing method)

2. **Выбери один из подходов**:
   
   **Подход A (рекомендуется)**: Убрать resize из Canvas, оставить в SelectionOverlay
   - Удалить resize logic из Canvas.handleMouseMove
   - Реализовать полный resize в SelectionOverlay с window handlers
   - Использовать store методы для обновления элементов
   
   **Подход B**: Убрать resize из SelectionOverlay, оставить в Canvas
   - Убрать handleMouseDown из SelectionOverlay handles
   - Сделать handles просто визуальными (pointer-events-none)
   - Canvas должен определять что клик на handle через closest()

3. **Реализуй выбранный подход**:
   - Убери дублирование логики
   - Убедись что state updates синхронны
   - Добавь history entry при завершении resize

4. **Запусти тесты** (headless!):
   ```bash
   npx playwright test interactions/resize.spec.ts
   ```

5. **Исправь баги** пока все 8 тестов не пройдут

### Критерий успеха
✅ Все 8 тестов в resize.spec.ts проходят
✅ Resize работает плавно
✅ Minimum size 20px соблюдается
✅ Snap to grid работает
✅ Undo/redo работает

### Файлы для изменения
- `src/components/SelectionOverlay.tsx`
- `src/components/Canvas.tsx`
- `src/store/canvas-store.ts` (если нужны новые методы)

---

## Agent 2: Text/Sticky Editor Save Fix 🟡

### Задача
Исправить сохранение текста в TextEditor.

### Проблема
Editor открывается, но текст не сохраняется. onBlur handler не срабатывает или не обновляет элемент.

### Что делать
1. **Прочитай код**:
   - `src/components/TextEditor.tsx` (onBlur, handleSave)
   - `src/components/Canvas.tsx` (text/sticky creation, editingTextId)
   - `src/store/canvas-store.ts` (updateElement method)

2. **Отладь проблему**:
   - Добавь console.log в handleSave: `console.log('[TextEditor] Saving text:', text)`
   - Добавь console.log в onBlur: `console.log('[TextEditor] onBlur fired')`
   - Проверь что updateElement вызывается с правильными параметрами

3. **Возможные причины**:
   - onBlur не срабатывает (textarea теряет фокус неправильно)
   - updateElement не обновляет правильное поле (text vs textStyle.text)
   - Editor закрывается до того как onBlur сработает

4. **Исправь код**:
   - Используй onBlur + handleSave правильно
   - Убедись что text сохраняется в правильное поле элемента
   - Проверь что editor не закрывается преждевременно

5. **Запусти тесты** (headless!):
   ```bash
   npx playwright test tools/content/text.spec.ts
   npx playwright test tools/content/sticky.spec.ts
   ```

6. **Исправь double-click editing**:
   - Проверь handleDoubleClick в Canvas.tsx
   - Убедись что findElementAtPoint находит элемент
   - Добавь логирование для отладки

### Критерий успеха
✅ Все 11 тестов в text.spec.ts проходят
✅ Все 12 тестов в sticky.spec.ts проходят
✅ Текст сохраняется при вводе
✅ Double-click открывает editor
✅ Multi-line text работает

### Файлы для изменения
- `src/components/TextEditor.tsx`
- `src/components/Canvas.tsx`

---

## Agent 3: Eraser Tool Fix 🟢

### Задача
Исправить eraser tool - логика есть, но не удаляет элементы.

### Проблема
Eraser tool активируется, но не удаляет элементы при hover/drag.

### Что делать
1. **Прочитай код**:
   - `src/components/Canvas.tsx` (eraser logic в handleMouseDown и handleMouseMove)
   - `src/components/Toolbar.tsx` (проверь есть ли кнопка eraser)
   - `src/hooks/useKeyboard.ts` (проверь shortcut 'e')

2. **Проверь что есть**:
   - Кнопка eraser в Toolbar
   - Keyboard shortcut 'e' работает
   - deleteElements импортирован в Canvas

3. **Отладь проблему**:
   - Добавь console.log в eraser logic:
     ```typescript
     console.log('[Canvas] Eraser active, hoveredElement:', hoveredElement);
     console.log('[Canvas] Deleting element:', hoveredElement.id);
     ```
   - Проверь что findElementAtPoint находит элементы
   - Проверь что deleteElements вызывается

4. **Возможные причины**:
   - findElementAtPoint не работает правильно
   - deleteElements не вызывается
   - Eraser tool не активируется (нет кнопки в toolbar)

5. **Исправь код**:
   - Убедись что eraser logic срабатывает
   - Проверь что элементы удаляются
   - Добавь visual feedback (cursor)

6. **Запусти тесты** (headless!):
   ```bash
   npx playwright test tools/drawing/eraser.spec.ts
   ```

### Критерий успеха
✅ Все 11 тестов в eraser.spec.ts проходят
✅ Eraser удаляет элементы при hover
✅ Eraser работает при drag
✅ Locked elements НЕ удаляются

### Файлы для изменения
- `src/components/Canvas.tsx`
- `src/components/Toolbar.tsx` (если нет кнопки)

---

## Agent 4: Frame Drag/Resize Fix 🟡

### Задача
Исправить frame drag и resize - логика есть, но тесты падают.

### Проблема
Frame children logic реализована, но 3 теста падают:
- Frame не resize
- Frame не drag
- Z-index test создает только 2 элемента вместо 3

### Что делать
1. **Прочитай код**:
   - `src/components/Canvas.tsx` (frame drag logic)
   - `src/store/canvas-store.ts` (updateFrameChildren)
   - `__tests__/e2e/specs/tools/content/frame.spec.ts` (падающие тесты)

2. **Проблема #1: Frame не resize**:
   - Это связано с Agent 1 (resize interaction)
   - Подожди пока Agent 1 исправит resize
   - Или исправь сам если Agent 1 не справится

3. **Проблема #2: Frame не drag**:
   - Отладь почему frame.x не меняется
   - Добавь console.log в drag logic:
     ```typescript
     console.log('[Canvas] Dragging frame:', frameId, 'dx:', dx, 'dy:', dy);
     ```
   - Проверь что updateElementSilent вызывается для frame

4. **Проблема #3: Z-index test**:
   - Проверь почему второй rectangle не создается
   - Возможно auto-switch to select мешает
   - Проверь что tool остается активным для multiple creation

5. **Запусти тесты** (headless!):
   ```bash
   npx playwright test tools/content/frame.spec.ts
   ```

### Критерий успеха
✅ Все 11 тестов в frame.spec.ts проходят
✅ Frame drag работает с детьми
✅ Frame resize обновляет детей
✅ Z-index ordering работает

### Файлы для изменения
- `src/components/Canvas.tsx`
- `src/store/canvas-store.ts`

---

## Agent 5: Undo/Redo + Drag Issues Fix 🟡

### Задача
Исправить undo/redo для drag и другие drag issues.

### Проблема
- Undo/redo не работает для drag operations
- Drag multiple elements с snap to grid падает
- Drag с negative coordinates падает

### Что делать
1. **Прочитай код**:
   - `src/components/Canvas.tsx` (drag logic в handleMouseUp)
   - `src/store/canvas-store.ts` (history, updateElement)
   - `__tests__/e2e/specs/interactions/drag.spec.ts`

2. **Проблема #1: Undo/redo для drag**:
   - Проверь что updateElement вызывается в handleMouseUp
   - Убедись что history entry создается
   - Добавь console.log:
     ```typescript
     console.log('[Canvas] Recording drag to history:', id, startPos, finalPos);
     ```

3. **Проблема #2: Drag multiple с snap**:
   - Проверь snap logic для multiple elements
   - Убедись что все элементы снапятся правильно
   - Возможно нужно снапить каждый элемент отдельно

4. **Проблема #3: Negative coordinates**:
   - Проверь что snap работает с отрицательными координатами
   - Math.round может давать неправильные результаты
   - Проверь формулу: `Math.round(x / gridSize) * gridSize`

5. **Запусти тесты** (headless!):
   ```bash
   npx playwright test interactions/drag.spec.ts
   npx playwright test smoke.spec.ts
   ```

### Критерий успеха
✅ Все 10 тестов в drag.spec.ts проходят
✅ Undo/redo работает для drag
✅ Drag multiple elements работает
✅ Negative coordinates работают
✅ Smoke tests проходят (9/9)

### Файлы для изменения
- `src/components/Canvas.tsx`
- `src/store/canvas-store.ts`

---

## Agent 6: Selection + Hand Tool Tests 🟢

### Задача
Запустить и исправить оставшиеся тесты для selection и hand tool.

### Что делать
1. **Запусти тесты** (headless!):
   ```bash
   npx playwright test interactions/selection.spec.ts
   npx playwright test tools/hand.spec.ts
   npx playwright test tools/select.spec.ts
   ```

2. **Для каждого падающего теста**:
   - Прочитай тест и пойми что он проверяет
   - Найди код который должен реализовывать эту функциональность
   - Исправь код (НЕ тест!)
   - Запусти тест снова

3. **Selection issues**:
   - Selection bounds для multiple elements
   - Select by type (если нужно реализовать)

4. **Hand tool issues**:
   - Проверь что hand tool активируется
   - Проверь что panning работает
   - Проверь Space key для temporary hand

### Критерий успеха
✅ Все тесты в selection.spec.ts проходят
✅ Все тесты в hand.spec.ts проходят
✅ Все тесты в select.spec.ts проходят

### Файлы для изменения
- `src/components/Canvas.tsx`
- `src/store/canvas-store.ts`
- `src/hooks/useKeyboard.ts`

---

## 📊 Ожидаемые результаты

После выполнения всех задач:
- **Agent 1**: +6 тестов (resize: 8/8)
- **Agent 2**: +8 тестов (text+sticky: 23/23)
- **Agent 3**: +6 тестов (eraser: 11/11)
- **Agent 4**: +3 теста (frame: 11/11)
- **Agent 5**: +4 теста (drag+smoke: 19/19)
- **Agent 6**: +10 тестов (selection+hand+select: ~30/30)

**Итого**: +37 тестов → ~167/213 (78%+)

---

## 🎯 Правила выполнения

### Для каждого агента:
1. ✅ Читай код перед изменениями
2. ✅ Добавляй console.log для отладки
3. ✅ Запускай тесты в headless режиме
4. ✅ Исправляй код, НЕ тесты
5. ✅ Проверяй что не сломал другие тесты
6. ✅ Обнови TEST-STATUS.md кратко

### Команды для тестов:
```bash
# ✅ ПРАВИЛЬНО - headless режим
npx playwright test <file>
npx playwright test <file> --reporter=list

# ❌ НЕПРАВИЛЬНО - интерактивные режимы
npx playwright test <file> --headed
npx playwright test <file> --debug
npx playwright test <file> --ui
```

### Логирование:
```typescript
// ✅ ПРАВИЛЬНО - для отладки
console.log('[Component] Event:', data);
console.log('[Store] State update:', before, after);

// ❌ НЕПРАВИЛЬНО - слишком много
console.log('test'); // бесполезно
```

---

## 🚀 Начинайте работу!

Каждый агент работает независимо в своих файлах. Конфликты минимальны.
