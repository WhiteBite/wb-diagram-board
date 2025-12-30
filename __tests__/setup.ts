/**
 * Global test setup and configuration
 * @module __tests__/setup
 */

import { expect, afterEach, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

/**
 * Global test configuration
 */
export const TEST_CONFIG = {
    /** Timeout for async operations (ms) */
    ASYNC_TIMEOUT: 5000,
    /** Timeout for animations (ms) */
    ANIMATION_TIMEOUT: 500,
    /** Timeout for network requests (ms) */
    NETWORK_TIMEOUT: 3000,
    /** Default debounce delay (ms) */
    DEBOUNCE_DELAY: 300,
    /** Performance threshold for operations (ms) */
    PERF_THRESHOLD: 100,
} as const;

/**
 * Mock window.matchMedia for responsive design tests
 */
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

/**
 * Mock IntersectionObserver
 */
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
} as any;

/**
 * Mock ResizeObserver
 */
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
} as any;

/**
 * Mock requestAnimationFrame
 */
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 16) as any;
};

/**
 * Mock cancelAnimationFrame
 */
global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
};

/**
 * Setup before each test
 */
beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset DOM
    document.body.innerHTML = '';

    // Reset localStorage
    localStorage.clear();

    // Reset sessionStorage
    sessionStorage.clear();
});

/**
 * Cleanup after each test
 */
afterEach(() => {
    // Cleanup any remaining timers
    vi.clearAllTimers();

    // Cleanup DOM
    document.body.innerHTML = '';
});

/**
 * Custom matchers for testing
 */
declare global {
    namespace Vi {
        interface Matchers<R> {
            /**
             * Check if element has specific CSS class
             */
            toHaveClass(className: string): R;

            /**
             * Check if element has specific CSS property
             */
            toHaveStyle(property: string, value: string): R;

            /**
             * Check if element is visible
             */
            toBeVisible(): R;

            /**
             * Check if element is disabled
             */
            toBeDisabled(): R;

            /**
             * Check if element is enabled
             */
            toBeEnabled(): R;

            /**
             * Check if element has specific attribute
             */
            toHaveAttribute(attr: string, value?: string): R;

            /**
             * Check if element has specific ARIA attribute
             */
            toHaveAriaLabel(label: string): R;

            /**
             * Check if element has specific ARIA role
             */
            toHaveAriaRole(role: string): R;
        }
    }
}

/**
 * Add custom matchers
 */
expect.extend({
    toHaveClass(element: HTMLElement, className: string) {
        const pass = element.classList.contains(className);
        return {
            pass,
            message: () =>
                `Expected element to ${pass ? 'not ' : ''}have class "${className}"`,
        };
    },

    toHaveStyle(element: HTMLElement, property: string, value: string) {
        const computedStyle = window.getComputedStyle(element);
        const actualValue = computedStyle.getPropertyValue(property);
        const pass = actualValue === value;
        return {
            pass,
            message: () =>
                `Expected element to ${pass ? 'not ' : ''}have style "${property}: ${value}", but got "${property}: ${actualValue}"`,
        };
    },

    toBeVisible(element: HTMLElement) {
        const isVisible =
            element.offsetParent !== null &&
            window.getComputedStyle(element).display !== 'none' &&
            window.getComputedStyle(element).visibility !== 'hidden';
        return {
            pass: isVisible,
            message: () => `Expected element to ${isVisible ? 'not ' : ''}be visible`,
        };
    },

    toBeDisabled(element: HTMLElement) {
        const isDisabled =
            element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
                ? element.disabled
                : element.getAttribute('aria-disabled') === 'true';
        return {
            pass: isDisabled,
            message: () => `Expected element to ${isDisabled ? 'not ' : ''}be disabled`,
        };
    },

    toBeEnabled(element: HTMLElement) {
        const isEnabled =
            element instanceof HTMLButtonElement ||
                element instanceof HTMLInputElement ||
                element instanceof HTMLSelectElement ||
                element instanceof HTMLTextAreaElement
                ? !element.disabled
                : element.getAttribute('aria-disabled') !== 'true';
        return {
            pass: isEnabled,
            message: () => `Expected element to ${isEnabled ? 'not ' : ''}be enabled`,
        };
    },

    toHaveAttribute(element: HTMLElement, attr: string, value?: string) {
        const hasAttr = element.hasAttribute(attr);
        if (!hasAttr) {
            return {
                pass: false,
                message: () => `Expected element to have attribute "${attr}"`,
            };
        }

        if (value === undefined) {
            return {
                pass: true,
                message: () => `Expected element to not have attribute "${attr}"`,
            };
        }

        const actualValue = element.getAttribute(attr);
        const pass = actualValue === value;
        return {
            pass,
            message: () =>
                `Expected element to ${pass ? 'not ' : ''}have attribute "${attr}" with value "${value}", but got "${actualValue}"`,
        };
    },

    toHaveAriaLabel(element: HTMLElement, label: string) {
        const ariaLabel = element.getAttribute('aria-label');
        const pass = ariaLabel === label;
        return {
            pass,
            message: () =>
                `Expected element to ${pass ? 'not ' : ''}have aria-label "${label}", but got "${ariaLabel}"`,
        };
    },

    toHaveAriaRole(element: HTMLElement, role: string) {
        const ariaRole = element.getAttribute('role');
        const pass = ariaRole === role;
        return {
            pass,
            message: () =>
                `Expected element to ${pass ? 'not ' : ''}have role "${role}", but got "${ariaRole}"`,
        };
    },
});

export { };
