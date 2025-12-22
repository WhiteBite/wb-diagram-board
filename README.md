# wb-diagram-board

Interactive canvas for creating and editing diagrams with hand-drawn (rough) style.

## Features

- Freeform canvas with pan & zoom
- Hand-drawn style rendering (roughjs)
- Multiple element types: rectangles, ellipses, diamonds, arrows, text
- Selection, move, resize operations
- Keyboard shortcuts
- Export to various formats via [@whitebite/diagram-converter](https://github.com/WhiteBite/wb-diagram-converter)

## Live Demo

[https://whitebite.github.io/wb-diagram-board/](https://whitebite.github.io/wb-diagram-board/)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- React 18
- TypeScript
- Zustand (state management)
- Tailwind CSS
- Vite
- roughjs (hand-drawn rendering)

## License

MIT
