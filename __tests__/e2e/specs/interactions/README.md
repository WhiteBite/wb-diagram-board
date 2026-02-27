# Interaction Tests

Comprehensive e2e tests for canvas interactions: selection, drag, and resize.

## Test Files

### 1. selection.spec.ts (12 tests)

Tests for element selection interactions:

- ✅ Select single element on click
- ✅ Select multiple elements with box selection
- ✅ Add to selection with Shift+click
- ✅ Clear selection on empty area click
- ✅ Select all elements with Ctrl+A
- ✅ Show selection bounds for single element
- ✅ Show selection bounds for multiple elements
- ✅ Show resize handles on selected element
- ✅ NOT select locked elements
- ✅ Deselect element with Shift+click on selected element
- ✅ Preserve selection when switching tools
- ✅ Select elements by type with box selection

### 2. drag.spec.ts (10 tests)

Tests for element dragging interactions:

- ✅ Drag single element
- ✅ Drag multiple elements together
- ✅ Snap to grid when enabled
- ✅ Constrain to horizontal axis with Shift
- ✅ NOT drag locked elements
- ✅ Update position in store
- ✅ Work with undo/redo
- ✅ Drag element with negative coordinates
- ✅ Maintain element size during drag
- ✅ Show drag preview during drag

### 3. resize.spec.ts (15 tests)

Tests for element resizing interactions:

**All 8 resize handles:**
- ✅ Resize from northwest handle (nw)
- ✅ Resize from north handle (n)
- ✅ Resize from northeast handle (ne)
- ✅ Resize from west handle (w)
- ✅ Resize from east handle (e)
- ✅ Resize from southwest handle (sw)
- ✅ Resize from south handle (s)
- ✅ Resize from southeast handle (se)

**Additional features:**
- ✅ Maintain aspect ratio with Shift
- ✅ Snap to grid when enabled
- ✅ Have minimum size
- ✅ Work with undo/redo
- ✅ NOT resize locked elements
- ✅ Update bounds in store
- ✅ Show resize preview during resize

## Running Tests

```bash
# Run all interaction tests
pnpm test:e2e specs/interactions

# Run specific test file
pnpm test:e2e specs/interactions/selection.spec.ts
pnpm test:e2e specs/interactions/drag.spec.ts
pnpm test:e2e specs/interactions/resize.spec.ts

# Run in UI mode
pnpm test:e2e --ui specs/interactions

# Run in debug mode
pnpm test:e2e --debug specs/interactions
```

## Test Coverage

**Total: 37 tests**

### Selection Coverage
- Single/multiple selection
- Box selection
- Keyboard shortcuts (Ctrl+A)
- Shift+click add/remove
- Locked elements
- Selection bounds visualization
- Resize handles display

### Drag Coverage
- Single/multiple element drag
- Grid snapping
- Axis constraint (Shift)
- Locked elements
- Store updates
- Undo/redo
- Negative coordinates
- Size preservation
- Drag preview

### Resize Coverage
- All 8 resize handles (corners + edges)
- Aspect ratio preservation (Shift)
- Grid snapping
- Minimum size enforcement
- Locked elements
- Store updates
- Undo/redo
- Resize preview

## Test Patterns

### Using Canvas Helper

```typescript
// Draw element
const elementId = await canvas.draw
    .from(100, 100)
    .to(300, 200)
    .execute();

// Select element
await canvas.select
    .element(elementId)
    .execute();

// Drag element
await canvas.drag
    .from(150, 125)
    .to(250, 225)
    .execute();
```

### Using Keyboard Helper

```typescript
// Select all
await keyboard.selectAll();

// Undo/redo
await keyboard.undo();
await keyboard.redo();

// Delete
await keyboard.delete();
```

### Using Toolbar Helper

```typescript
// Switch tool
await toolbar.selectTool('rectangle');

// Check active tool
const activeTool = await toolbar.getActiveTool();
expect(activeTool).toBe('select');
```

## Edge Cases Covered

- ✅ Locked elements (cannot select, drag, or resize)
- ✅ Grid snapping
- ✅ Axis constraints (Shift)
- ✅ Aspect ratio preservation (Shift)
- ✅ Minimum size enforcement
- ✅ Negative coordinates
- ✅ Multiple element operations
- ✅ Undo/redo support
- ✅ Store synchronization
- ✅ Visual feedback (bounds, handles, previews)

## Notes

- All tests use the base test infrastructure from `core/base-test.ts`
- Tests follow the existing patterns from `tools/select.spec.ts`
- Each test is independent and sets up its own state
- Tests verify both visual elements (DOM) and store state
- Proper cleanup happens automatically via Playwright
