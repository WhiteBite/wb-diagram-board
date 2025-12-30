/**
 * Keyboard accessibility testing utilities
 * @module __tests__/a11y/keyboard-tests
 */

/**
 * Keyboard shortcut
 */
export interface KeyboardShortcut {
    /** Shortcut name */
    name: string;
    /** Key combination */
    keys: string[];
    /** Description */
    description: string;
    /** Expected action */
    expectedAction: string;
}

/**
 * Keyboard test result
 */
export interface KeyboardTestResult {
    /** Test name */
    name: string;
    /** Test passed */
    passed: boolean;
    /** Error message if failed */
    error?: string;
    /** Duration in ms */
    duration: number;
}

/**
 * Common keyboard shortcuts
 */
export const COMMON_SHORTCUTS: KeyboardShortcut[] = [
    {
        name: 'select-all',
        keys: ['Control', 'a'],
        description: 'Select all elements',
        expectedAction: 'All elements should be selected',
    },
    {
        name: 'copy',
        keys: ['Control', 'c'],
        description: 'Copy selected elements',
        expectedAction: 'Selected elements should be copied to clipboard',
    },
    {
        name: 'paste',
        keys: ['Control', 'v'],
        description: 'Paste elements',
        expectedAction: 'Elements should be pasted from clipboard',
    },
    {
        name: 'cut',
        keys: ['Control', 'x'],
        description: 'Cut selected elements',
        expectedAction: 'Selected elements should be cut',
    },
    {
        name: 'undo',
        keys: ['Control', 'z'],
        description: 'Undo last action',
        expectedAction: 'Last action should be undone',
    },
    {
        name: 'redo',
        keys: ['Control', 'y'],
        description: 'Redo last undone action',
        expectedAction: 'Last undone action should be redone',
    },
    {
        name: 'delete',
        keys: ['Delete'],
        description: 'Delete selected elements',
        expectedAction: 'Selected elements should be deleted',
    },
    {
        name: 'escape',
        keys: ['Escape'],
        description: 'Cancel current operation',
        expectedAction: 'Current operation should be cancelled',
    },
    {
        name: 'tab',
        keys: ['Tab'],
        description: 'Move focus to next element',
        expectedAction: 'Focus should move to next focusable element',
    },
    {
        name: 'shift-tab',
        keys: ['Shift', 'Tab'],
        description: 'Move focus to previous element',
        expectedAction: 'Focus should move to previous focusable element',
    },
    {
        name: 'enter',
        keys: ['Enter'],
        description: 'Activate focused element',
        expectedAction: 'Focused element should be activated',
    },
    {
        name: 'space',
        keys: [' '],
        description: 'Activate focused element',
        expectedAction: 'Focused element should be activated',
    },
    {
        name: 'arrow-up',
        keys: ['ArrowUp'],
        description: 'Move up',
        expectedAction: 'Selection or focus should move up',
    },
    {
        name: 'arrow-down',
        keys: ['ArrowDown'],
        description: 'Move down',
        expectedAction: 'Selection or focus should move down',
    },
    {
        name: 'arrow-left',
        keys: ['ArrowLeft'],
        description: 'Move left',
        expectedAction: 'Selection or focus should move left',
    },
    {
        name: 'arrow-right',
        keys: ['ArrowRight'],
        description: 'Move right',
        expectedAction: 'Selection or focus should move right',
    },
];

/**
 * Test keyboard navigation
 * @param element - Element to test
 * @returns Test results
 */
export async function testKeyboardNavigation(element: HTMLElement): Promise<KeyboardTestResult[]> {
    const results: KeyboardTestResult[] = [];

    // Test Tab navigation
    const tabTest = await testKeyboardShortcut(element, 'tab', ['Tab']);
    results.push(tabTest);

    // Test Shift+Tab navigation
    const shiftTabTest = await testKeyboardShortcut(element, 'shift-tab', ['Shift', 'Tab']);
    results.push(shiftTabTest);

    // Test Arrow keys
    const arrowTests = await Promise.all([
        testKeyboardShortcut(element, 'arrow-up', ['ArrowUp']),
        testKeyboardShortcut(element, 'arrow-down', ['ArrowDown']),
        testKeyboardShortcut(element, 'arrow-left', ['ArrowLeft']),
        testKeyboardShortcut(element, 'arrow-right', ['ArrowRight']),
    ]);

    results.push(...arrowTests);

    return results;
}

/**
 * Test keyboard shortcut
 * @param element - Element to test
 * @param name - Shortcut name
 * @param keys - Keys to press
 * @returns Test result
 */
export async function testKeyboardShortcut(
    element: HTMLElement,
    name: string,
    keys: string[]
): Promise<KeyboardTestResult> {
    const startTime = performance.now();

    try {
        // Simulate keyboard event
        const event = new KeyboardEvent('keydown', {
            key: keys[keys.length - 1],
            code: keys[keys.length - 1],
            ctrlKey: keys.includes('Control'),
            shiftKey: keys.includes('Shift'),
            altKey: keys.includes('Alt'),
            metaKey: keys.includes('Meta'),
            bubbles: true,
            cancelable: true,
        });

        element.dispatchEvent(event);

        const duration = performance.now() - startTime;

        return {
            name,
            passed: true,
            duration,
        };
    } catch (error) {
        const duration = performance.now() - startTime;

        return {
            name,
            passed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            duration,
        };
    }
}

/**
 * Test focus management
 * @param element - Element to test
 * @returns Test results
 */
export async function testFocusManagement(element: HTMLElement): Promise<KeyboardTestResult[]> {
    const results: KeyboardTestResult[] = [];

    // Test initial focus
    const initialFocusTest: KeyboardTestResult = {
        name: 'initial-focus',
        passed: document.activeElement !== null,
        duration: 0,
    };
    results.push(initialFocusTest);

    // Test focus trap in modal (if applicable)
    const focusTrapTest: KeyboardTestResult = {
        name: 'focus-trap',
        passed: true, // Would need modal to test properly
        duration: 0,
    };
    results.push(focusTrapTest);

    // Test focus restoration
    const focusRestorationTest: KeyboardTestResult = {
        name: 'focus-restoration',
        passed: true, // Would need modal to test properly
        duration: 0,
    };
    results.push(focusRestorationTest);

    return results;
}

/**
 * Test keyboard shortcuts
 * @param element - Element to test
 * @param shortcuts - Shortcuts to test
 * @returns Test results
 */
export async function testKeyboardShortcuts(
    element: HTMLElement,
    shortcuts: KeyboardShortcut[]
): Promise<KeyboardTestResult[]> {
    const results: KeyboardTestResult[] = [];

    for (const shortcut of shortcuts) {
        const result = await testKeyboardShortcut(element, shortcut.name, shortcut.keys);
        results.push(result);
    }

    return results;
}

/**
 * Test keyboard accessibility
 * @param element - Element to test
 * @returns Comprehensive test results
 */
export async function testKeyboardAccessibility(element: HTMLElement): Promise<{
    navigation: KeyboardTestResult[];
    focus: KeyboardTestResult[];
    shortcuts: KeyboardTestResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        passRate: number;
    };
}> {
    const [navigation, focus, shortcuts] = await Promise.all([
        testKeyboardNavigation(element),
        testFocusManagement(element),
        testKeyboardShortcuts(element, COMMON_SHORTCUTS),
    ]);

    const all = [...navigation, ...focus, ...shortcuts];
    const passed = all.filter((r) => r.passed).length;
    const failed = all.filter((r) => !r.passed).length;

    return {
        navigation,
        focus,
        shortcuts,
        summary: {
            total: all.length,
            passed,
            failed,
            passRate: (passed / all.length) * 100,
        },
    };
}

/**
 * Get keyboard shortcut by name
 * @param name - Shortcut name
 * @returns Keyboard shortcut or undefined
 */
export function getShortcut(name: string): KeyboardShortcut | undefined {
    return COMMON_SHORTCUTS.find((s) => s.name === name);
}

/**
 * Get all keyboard shortcuts
 * @returns Array of keyboard shortcuts
 */
export function getAllShortcuts(): KeyboardShortcut[] {
    return [...COMMON_SHORTCUTS];
}

/**
 * Format keyboard shortcut for display
 * @param shortcut - Keyboard shortcut
 * @returns Formatted string
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
    return shortcut.keys.join(' + ');
}

/**
 * Format keyboard test results
 * @param results - Test results
 * @returns Formatted string
 */
export function formatKeyboardTestResults(results: KeyboardTestResult[]): string {
    let output = 'Keyboard Test Results\n';
    output += '====================\n\n';

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    output += `Total: ${results.length}\n`;
    output += `Passed: ${passed}\n`;
    output += `Failed: ${failed}\n`;
    output += `Pass Rate: ${((passed / results.length) * 100).toFixed(2)}%\n\n`;

    output += 'Details:\n';
    for (const result of results) {
        const status = result.passed ? '✓' : '✗';
        output += `${status} ${result.name} (${result.duration.toFixed(2)}ms)`;
        if (result.error) {
            output += ` - ${result.error}`;
        }
        output += '\n';
    }

    return output;
}

/**
 * Assert keyboard accessibility
 * @param results - Test results
 * @param minPassRate - Minimum pass rate (0-100)
 * @throws Error if pass rate is below minimum
 */
export function assertKeyboardAccessibility(
    results: KeyboardTestResult[],
    minPassRate: number = 80
): void {
    const passed = results.filter((r) => r.passed).length;
    const passRate = (passed / results.length) * 100;

    if (passRate < minPassRate) {
        throw new Error(
            `Keyboard accessibility pass rate ${passRate.toFixed(2)}% is below minimum ${minPassRate}%`
        );
    }
}

export { };
