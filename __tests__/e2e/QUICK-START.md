# Quick Start - E2E Testing

## Установка

Зависимости уже установлены. Если нужно переустановить:

```bash
npm install -D @playwright/test playwright
npx playwright install chromium
```

## Запуск тестов

### Основные команды

```bash
# Запустить все тесты
npm run test:e2e

# Запустить конкретный файл
npm run test:e2e smoke.spec.ts

# Запустить с UI (рекомендуется для разработки)
npm run test:e2e:ui

# Запустить в debug режиме
npm run test:e2e:debug

# Запустить с видимым браузером
npm run test:e2e:headed

# Показать список всех тестов
npm run test:e2e:list
```

### Фильтрация тестов

```bash
# Запустить тесты по названию
npm run test:e2e -- --grep "rectangle"

# Исключить тесты
npm run test:e2e -- --grep-invert "slow"

# Запустить только failed тесты
npm run test:e2e -- --last-failed
```

## Структура теста

```typescript
import { test, expect, setupTest } from '../core/base-test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, canvas }) => {
    await setupTest(page, canvas);
  });

  test('should do something', async ({ canvas, toolbar, keyboard }) => {
    // 1. Arrange - подготовка
    await toolbar.selectTool('rectangle');
    
    // 2. Act - действие
    const elementId = await canvas.draw
      .from(100, 100)
      .to(300, 200)
      .execute();
    
    // 3. Assert - проверка
    const element = await canvas.getElement(elementId);
    expect(element).toBeTruthy();
    expect(element?.type).toBe('rectangle');
  });
});
```

## Fixtures

Тест автоматически получает:
- `page` - Playwright Page
- `canvas` - Canvas helper
- `toolbar` - Toolbar helper
- `keyboard` - Keyboard helper

## Debugging

### 1. UI Mode (лучший способ)
```bash
npm run test:e2e:ui
```
- Визуальный интерфейс
- Пошаговое выполнение
- Просмотр DOM
- Time travel debugging

### 2. Debug Mode
```bash
npm run test:e2e:debug
```
- Останавливается на каждом шаге
- Можно использовать DevTools

### 3. Headed Mode
```bash
npm run test:e2e:headed
```
- Видимый браузер
- Полезно для понимания что происходит

### 4. Trace Viewer
После падения теста:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## Проверка перед коммитом

```bash
# 1. Проверить что тесты обнаруживаются
npm run test:e2e:list

# 2. Запустить smoke тесты
npm run test:e2e smoke.spec.ts

# 3. Запустить все тесты
npm run test:e2e
```

## Troubleshooting

### Тесты не находятся
- Проверьте что файлы в `__tests__/e2e/specs/`
- Проверьте что файлы заканчиваются на `.spec.ts`

### Dev server не запускается
- Проверьте что порт 5173 свободен
- Запустите `npm run dev` вручную

### Браузер не установлен
```bash
npx playwright install chromium
```

### Тесты падают с timeout
- Увеличьте timeout в `playwright.config.ts`
- Проверьте что приложение загружается

## Следующие шаги

1. Изучите существующие smoke тесты
2. Посмотрите примеры в `TEST-IMPLEMENTATION.md`
3. Создавайте новые тесты в соответствующих папках
