/**
 * Common test utilities and helpers
 * @module __tests__/utils/test-helpers
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function with providers
 * @param ui - React component to render
 * @param options - Render options
 * @returns Render result
 */
export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    return render(ui, { ...options });
}

/**
 * Wait for a condition to be true
 * @param condition - Function that returns boolean
 * @param timeout - Maximum time to wait (ms)
 * @param interval - Check interval (ms)
 * @returns Promise that resolves when condition is true
 */
export async function waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 50
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (condition()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for element to appear in DOM
 * @param selector - CSS selector
 * @param timeout - Maximum time to wait (ms)
 * @returns Promise that resolves with element
 */
export async function waitForElement(
    selector: string,
    timeout: number = 5000
): Promise<HTMLElement> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = document.querySelector<HTMLElement>(selector);
        if (element) {
            return element;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Element "${selector}" not found after ${timeout}ms`);
}

/**
 * Wait for element to be removed from DOM
 * @param selector - CSS selector
 * @param timeout - Maximum time to wait (ms)
 * @returns Promise that resolves when element is removed
 */
export async function waitForElementRemoval(
    selector: string,
    timeout: number = 5000
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (!element) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Element "${selector}" still exists after ${timeout}ms`);
}

/**
 * Get all elements matching selector
 * @param selector - CSS selector
 * @returns Array of elements
 */
export function getAllElements(selector: string): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

/**
 * Get element by test ID
 * @param testId - Test ID attribute value
 * @returns Element or null
 */
export function getByTestId(testId: string): HTMLElement | null {
    return document.querySelector(`[data-testid="${testId}"]`);
}

/**
 * Get all elements by test ID
 * @param testId - Test ID attribute value
 * @returns Array of elements
 */
export function getAllByTestId(testId: string): HTMLElement[] {
    return getAllElements(`[data-testid="${testId}"]`);
}

/**
 * Simulate keyboard event
 * @param element - Target element
 * @param key - Key name
 * @param type - Event type (keydown, keyup, keypress)
 */
export function simulateKeyboardEvent(
    element: HTMLElement,
    key: string,
    type: 'keydown' | 'keyup' | 'keypress' = 'keydown'
): void {
    const event = new KeyboardEvent(type, {
        key,
        code: key,
        bubbles: true,
        cancelable: true,
    });
    element.dispatchEvent(event);
}

/**
 * Simulate mouse event
 * @param element - Target element
 * @param type - Event type
 * @param options - Event options
 */
export function simulateMouseEvent(
    element: HTMLElement,
    type: 'click' | 'mousedown' | 'mouseup' | 'mousemove' | 'mouseover' | 'mouseout',
    options: Partial<MouseEventInit> = {}
): void {
    const event = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        ...options,
    });
    element.dispatchEvent(event);
}

/**
 * Simulate drag and drop
 * @param source - Source element
 * @param target - Target element
 */
export async function simulateDragAndDrop(
    source: HTMLElement,
    target: HTMLElement
): Promise<void> {
    simulateMouseEvent(source, 'mousedown');
    await new Promise((resolve) => setTimeout(resolve, 50));
    simulateMouseEvent(target, 'mouseover');
    await new Promise((resolve) => setTimeout(resolve, 50));
    simulateMouseEvent(target, 'mouseup');
}

/**
 * Simulate input change
 * @param element - Input element
 * @param value - New value
 */
export function simulateInputChange(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
): void {
    element.value = value;
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
}

/**
 * Simulate input blur
 * @param element - Input element
 */
export function simulateInputBlur(
    element: HTMLInputElement | HTMLTextAreaElement
): void {
    const event = new FocusEvent('blur', { bubbles: true });
    element.dispatchEvent(event);
}

/**
 * Simulate input focus
 * @param element - Input element
 */
export function simulateInputFocus(
    element: HTMLInputElement | HTMLTextAreaElement
): void {
    const event = new FocusEvent('focus', { bubbles: true });
    element.dispatchEvent(event);
}

/**
 * Check if element is in viewport
 * @param element - Element to check
 * @returns True if element is visible in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Scroll element into view
 * @param element - Element to scroll to
 */
export function scrollIntoView(element: HTMLElement): void {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

/**
 * Get computed style property
 * @param element - Element
 * @param property - CSS property name
 * @returns Property value
 */
export function getComputedStyleProperty(
    element: HTMLElement,
    property: string
): string {
    return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Check if element has class
 * @param element - Element
 * @param className - Class name
 * @returns True if element has class
 */
export function hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
}

/**
 * Add class to element
 * @param element - Element
 * @param className - Class name
 */
export function addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
}

/**
 * Remove class from element
 * @param element - Element
 * @param className - Class name
 */
export function removeClass(element: HTMLElement, className: string): void {
    element.classList.remove(className);
}

/**
 * Toggle class on element
 * @param element - Element
 * @param className - Class name
 */
export function toggleClass(element: HTMLElement, className: string): void {
    element.classList.toggle(className);
}

/**
 * Get element attribute
 * @param element - Element
 * @param attribute - Attribute name
 * @returns Attribute value or null
 */
export function getAttribute(
    element: HTMLElement,
    attribute: string
): string | null {
    return element.getAttribute(attribute);
}

/**
 * Set element attribute
 * @param element - Element
 * @param attribute - Attribute name
 * @param value - Attribute value
 */
export function setAttribute(
    element: HTMLElement,
    attribute: string,
    value: string
): void {
    element.setAttribute(attribute, value);
}

/**
 * Remove element attribute
 * @param element - Element
 * @param attribute - Attribute name
 */
export function removeAttribute(element: HTMLElement, attribute: string): void {
    element.removeAttribute(attribute);
}

/**
 * Check if element has attribute
 * @param element - Element
 * @param attribute - Attribute name
 * @returns True if element has attribute
 */
export function hasAttribute(element: HTMLElement, attribute: string): boolean {
    return element.hasAttribute(attribute);
}

/**
 * Get element text content
 * @param element - Element
 * @returns Text content
 */
export function getTextContent(element: HTMLElement): string {
    return element.textContent || '';
}

/**
 * Set element text content
 * @param element - Element
 * @param text - Text content
 */
export function setTextContent(element: HTMLElement, text: string): void {
    element.textContent = text;
}

/**
 * Get element inner HTML
 * @param element - Element
 * @returns Inner HTML
 */
export function getInnerHTML(element: HTMLElement): string {
    return element.innerHTML;
}

/**
 * Set element inner HTML
 * @param element - Element
 * @param html - Inner HTML
 */
export function setInnerHTML(element: HTMLElement, html: string): void {
    element.innerHTML = html;
}

/**
 * Create mock file
 * @param name - File name
 * @param size - File size in bytes
 * @param type - MIME type
 * @returns File object
 */
export function createMockFile(
    name: string = 'test.txt',
    size: number = 1024,
    type: string = 'text/plain'
): File {
    const blob = new Blob(['a'.repeat(size)], { type });
    return new File([blob], name, { type });
}

/**
 * Create mock files
 * @param count - Number of files to create
 * @returns Array of File objects
 */
export function createMockFiles(count: number): File[] {
    return Array.from({ length: count }, (_, i) =>
        createMockFile(`test-${i}.txt`, 1024, 'text/plain')
    );
}

/**
 * Create mock data URL
 * @param content - Content
 * @param type - MIME type
 * @returns Data URL
 */
export function createMockDataUrl(
    content: string = 'test',
    type: string = 'text/plain'
): string {
    return `data:${type};base64,${btoa(content)}`;
}

/**
 * Create mock blob
 * @param content - Content
 * @param type - MIME type
 * @returns Blob object
 */
export function createMockBlob(
    content: string = 'test',
    type: string = 'text/plain'
): Blob {
    return new Blob([content], { type });
}

/**
 * Mock fetch response
 * @param data - Response data
 * @param status - HTTP status
 * @returns Response object
 */
export function createMockFetchResponse<T>(
    data: T,
    status: number = 200
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Create mock localStorage
 * @returns Mock localStorage object
 */
export function createMockLocalStorage(): Storage {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        key: (index: number) => Object.keys(store)[index] || null,
        length: Object.keys(store).length,
    };
}

/**
 * Create mock sessionStorage
 * @returns Mock sessionStorage object
 */
export function createMockSessionStorage(): Storage {
    return createMockLocalStorage();
}

/**
 * Flush all pending promises
 * @returns Promise that resolves when all pending promises are flushed
 */
export function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Flush all pending timers
 * @param ms - Time to advance (ms)
 */
export function flushTimers(ms: number = 0): void {
    const now = Date.now();
    while (Date.now() - now < ms) {
        // Advance time
    }
}

/**
 * Create mock ResizeObserver callback
 * @param entries - Resize entries
 * @returns ResizeObserverCallback
 */
export function createMockResizeObserverCallback(
    entries: ResizeObserverEntry[]
): ResizeObserverCallback {
    return (entries: ResizeObserverEntry[]) => {
        // Mock implementation
    };
}

/**
 * Create mock IntersectionObserver callback
 * @param entries - Intersection entries
 * @returns IntersectionObserverCallback
 */
export function createMockIntersectionObserverCallback(
    entries: IntersectionObserverEntry[]
): IntersectionObserverCallback {
    return (entries: IntersectionObserverEntry[]) => {
        // Mock implementation
    };
}

export { };
