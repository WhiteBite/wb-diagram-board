# Keyboard Shortcuts System

Production-ready keyboard shortcuts and hotkeys system for WB Canvas.

## Features

- ✅ Keyboard shortcut registration and management
- ✅ Conflict detection and resolution
- ✅ Platform-specific shortcuts (Mac, Windows, Linux)
- ✅ Key recording for custom shortcuts
- ✅ Export/import configuration
- ✅ Zustand store integration
- ✅ 100% TypeScript with strict typing
- ✅ Comprehensive unit and E2E tests

## Architecture

### Core Components

1. **ShortcutManager** (`shortcut-manager.ts`)
   - Manages keyboard shortcut registration
   - Handles keyboard events
   - Detects conflicts
   - Exports/imports configuration

2. **KeyRecorder** (`key-recorder.ts`)
   - Records keyboard input for custom shortcuts
   - Validates recorded keys
   - Provides recording state

3. **Default Shortcuts** (`default-shortcuts.ts`)
   - Pre-configured shortcuts for common actions
   - Organized by category (edit, view, tool, element, file)
   - Platform-aware

4. **Shortcuts Store** (`../store/shortcuts-store.ts`)
   - Zustand store for state management
   - Syncs with ShortcutManager
   - Provides selectors for components

5. **Shortcuts Panel** (`../components/panels/ShortcutsPanel.tsx`)
   - UI for viewing and managing shortcuts
   - Search and filter capabilities
   - Conflict detection display
   - Export/import functionality

## Usage

### Basic Setup

```typescript
import { shortcutManager } from './core/shortcuts';
import { getDefaultShortcuts } from './core/shortcuts/default-shortcuts';

// Register default shortcuts
const defaults = getDefaultShortcuts();
for (const binding of defaults) {
    shortcutManager.register(binding);
}
```

### Creating Custom Shortcuts

```typescript
import { KeyBinding } from './types/shortcuts';

const customBinding: KeyBinding = {
    id: 'my-action',
    name: 'My Action',
    description: 'Does something cool',
    keys: ['s'],
    modifiers: ['ctrl', 'shift'],
    action: () => {
        console.log('Action triggered!');
    },
    category: 'edit',
    enabled: true,
};

shortcutManager.register(customBinding);
```

### Using the Store

```typescript
import { useShortcutsStore } from './store/shortcuts-store';

function MyComponent() {
    const bindings = useShortcutsStore((s) => s.bindings);
    const conflicts = useShortcutsStore((s) => s.conflicts);
    
    return (
        <div>
            <p>Total shortcuts: {bindings.length}</p>
            <p>Conflicts: {conflicts.length}</p>
        </div>
    );
}
```

### Recording Custom Shortcuts

```typescript
import { keyRecorder } from './core/shortcuts';

// Start recording
keyRecorder.startRecording((keys, modifiers) => {
    console.log('Recorded:', keys, modifiers);
});

// Stop recording
const result = keyRecorder.stopRecording();
console.log('Keys:', result?.keys);
console.log('Modifiers:', result?.modifiers);
```

## Default Shortcuts

### Edit
- **Undo**: Ctrl+Z
- **Redo**: Ctrl+Shift+Z
- **Copy**: Ctrl+C
- **Cut**: Ctrl+X
- **Paste**: Ctrl+V
- **Delete**: Delete
- **Select All**: Ctrl+A
- **Duplicate**: Ctrl+D

### View
- **Zoom In**: Ctrl++
- **Zoom Out**: Ctrl+-
- **Reset Zoom**: Ctrl+0
- **Zoom to Fit**: Ctrl+1
- **Toggle Grid**: Ctrl+G

### Tools
- **Select**: V
- **Hand**: H
- **Rectangle**: R
- **Ellipse**: O
- **Diamond**: D
- **Triangle**: T
- **Line**: L
- **Arrow**: A
- **Freedraw**: P
- **Text**: X
- **Sticky**: S
- **Frame**: F
- **Connector**: C
- **Eraser**: E

### Elements
- **Bring to Front**: Ctrl+]
- **Send to Back**: Ctrl+[
- **Toggle Lock**: Ctrl+Shift+L

### Navigation
- **Clear Selection**: Escape

## Conflict Detection

The system automatically detects conflicting shortcuts:

```typescript
const conflicts = shortcutManager.findConflicts();
console.log('Conflicts:', conflicts);
// Output: [{ binding1: {...}, binding2: {...} }]
```

## Platform Support

Shortcuts can be platform-specific:

```typescript
const macBinding: KeyBinding = {
    // ...
    platform: 'mac',
};

const windowsBinding: KeyBinding = {
    // ...
    platform: 'windows',
};
```

## Export/Import

```typescript
// Export configuration
const config = shortcutManager.exportConfig();
const json = JSON.stringify(config);

// Import configuration
const imported = JSON.parse(json);
shortcutManager.importConfig(imported);
```

## Testing

### Unit Tests

```bash
pnpm test -- src/core/shortcuts/shortcuts.test.ts
```

Tests cover:
- Registration and unregistration
- Conflict detection
- Key string formatting
- Configuration export/import
- Platform-specific bindings
- Multiple keys handling

### E2E Tests

```bash
pnpm test:e2e -- __tests__/e2e/shortcuts.spec.ts
```

Tests cover:
- Undo/Redo functionality
- Copy/Paste operations
- Zoom shortcuts
- Tool activation
- Element manipulation
- Conflict detection
- Configuration management

## Architecture Decisions

### Why Zustand?
- Lightweight state management
- Immer integration for immutable updates
- Excellent TypeScript support
- Minimal boilerplate

### Why Separate Manager and Store?
- **Manager**: Core logic, no React dependencies
- **Store**: React state management
- Allows using shortcuts outside React

### Why Readonly Types?
- Prevents accidental mutations
- Better type safety
- Clearer intent in API

## Performance Considerations

- Shortcuts are registered once at app startup
- Event listeners use passive mode where possible
- Conflict detection is O(n²) but runs infrequently
- Key matching uses Set for O(1) lookups

## Future Enhancements

- [ ] Keyboard shortcut recorder UI component
- [ ] Shortcut profiles (different sets for different modes)
- [ ] Macro support (sequences of shortcuts)
- [ ] Shortcut search with fuzzy matching
- [ ] Keyboard layout detection
- [ ] Accessibility improvements

## Troubleshooting

### Shortcuts not working
1. Check if shortcuts are registered: `shortcutManager.getBindings()`
2. Verify enabled state: `binding.enabled === true`
3. Check for conflicts: `shortcutManager.findConflicts()`
4. Verify event listeners are attached

### Conflicts detected
1. View conflicts: `shortcutManager.findConflicts()`
2. Disable one binding: `binding.enabled = false`
3. Change key combination
4. Use platform-specific bindings

## License

Part of WB Canvas project
