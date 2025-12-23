# WB Diagram Board

[English](#english) | [Русский](#русский)

---

## English

Interactive canvas for creating and editing diagrams with hand-drawn (sketchy) style. Think Excalidraw, but with export to multiple formats.

### 🌐 Live Demo

**[https://whitebite.github.io/wb-diagram-board/](https://whitebite.github.io/wb-diagram-board/)**

### 🔗 Related Projects

- **[NPM Package](https://www.npmjs.com/package/@whitebite/diagram-converter)** — Core conversion library
- **[Web Converter](https://whitebite.github.io/wb-diagram-converter-web/)** — Online format converter

### Features

- 🎨 **Hand-drawn Style** — Beautiful sketchy rendering with roughjs
- 🖱️ **Freeform Canvas** — Infinite canvas with pan & zoom
- 📦 **Multiple Shapes** — Rectangles, ellipses, diamonds, arrows, text
- ✏️ **Easy Editing** — Select, move, resize, delete
- ⌨️ **Keyboard Shortcuts** — Fast workflow with hotkeys
- 🔄 **Multi-format Export** — Export to Mermaid, Draw.io, Excalidraw, PlantUML, SVG, PNG
- 💾 **Local Storage** — Auto-save your work

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `V` | Select tool |
| `R` | Rectangle |
| `E` | Ellipse |
| `D` | Diamond |
| `A` | Arrow |
| `T` | Text |
| `Delete` | Delete selected |
| `Ctrl+A` | Select all |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Stack

- React 18
- TypeScript
- Zustand (state management)
- Tailwind CSS
- Vite
- roughjs (hand-drawn rendering)
- [@whitebite/diagram-converter](https://www.npmjs.com/package/@whitebite/diagram-converter)

### License

MIT © WhiteBite

---

## Русский

Интерактивный холст для создания и редактирования диаграмм в стиле "от руки". Как Excalidraw, но с экспортом в разные форматы.

### 🌐 Демо

**[https://whitebite.github.io/wb-diagram-board/](https://whitebite.github.io/wb-diagram-board/)**

### 🔗 Связанные проекты

- **[NPM пакет](https://www.npmjs.com/package/@whitebite/diagram-converter)** — Библиотека конвертации
- **[Веб-конвертер](https://whitebite.github.io/wb-diagram-converter-web/)** — Онлайн-конвертер форматов

### Возможности

- 🎨 **Стиль "от руки"** — Красивый скетчевый рендеринг с roughjs
- 🖱️ **Свободный холст** — Бесконечный холст с панорамированием и зумом
- 📦 **Разные фигуры** — Прямоугольники, эллипсы, ромбы, стрелки, текст
- ✏️ **Простое редактирование** — Выделение, перемещение, изменение размера, удаление
- ⌨️ **Горячие клавиши** — Быстрая работа с хоткеями
- 🔄 **Экспорт в разные форматы** — Mermaid, Draw.io, Excalidraw, PlantUML, SVG, PNG
- 💾 **Локальное хранилище** — Автосохранение работы

### Горячие клавиши

| Клавиша | Действие |
|---------|----------|
| `V` | Инструмент выделения |
| `R` | Прямоугольник |
| `E` | Эллипс |
| `D` | Ромб |
| `A` | Стрелка |
| `T` | Текст |
| `Delete` | Удалить выделенное |
| `Ctrl+A` | Выделить всё |
| `Ctrl+C` | Копировать |
| `Ctrl+V` | Вставить |
| `Ctrl+Z` | Отменить |
| `Ctrl+Shift+Z` | Повторить |

### Разработка

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build

# Превью продакшен-сборки
npm run preview
```

### Технологии

- React 18
- TypeScript
- Zustand (управление состоянием)
- Tailwind CSS
- Vite
- roughjs (рендеринг "от руки")
- [@whitebite/diagram-converter](https://www.npmjs.com/package/@whitebite/diagram-converter)

### Лицензия

MIT © WhiteBite
