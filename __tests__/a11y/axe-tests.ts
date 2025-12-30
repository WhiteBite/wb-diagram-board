/**
 * Accessibility testing utilities using Axe
 * @module __tests__/a11y/axe-tests
 */

/**
 * Accessibility violation
 */
export interface AccessibilityViolation {
    /** Violation ID */
    id: string;
    /** Violation impact level */
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    /** Violation message */
    message: string;
    /** Affected elements */
    elements: string[];
    /** Remediation advice */
    remediation: string;
}

/**
 * Accessibility report
 */
export interface AccessibilityReport {
    /** Total violations */
    violations: AccessibilityViolation[];
    /** Total passes */
    passes: number;
    /** Total incomplete checks */
    incomplete: number;
    /** WCAG compliance level */
    wcagLevel: 'A' | 'AA' | 'AAA';
    /** Compliance percentage */
    compliancePercentage: number;
}

/**
 * Check accessibility of an element
 * @param element - Element to check
 * @returns Accessibility report
 */
export async function checkAccessibility(element: HTMLElement): Promise<AccessibilityReport> {
    // Mock implementation - in real tests would use axe-core
    const violations: AccessibilityViolation[] = [];

    // Check for ARIA labels
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
        if (element.tagName === 'BUTTON' || element.tagName === 'A') {
            violations.push({
                id: 'missing-aria-label',
                impact: 'serious',
                message: 'Element missing accessible name',
                elements: [element.tagName],
                remediation: 'Add aria-label or aria-labelledby attribute',
            });
        }
    }

    // Check for color contrast
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    if (color === backgroundColor) {
        violations.push({
            id: 'color-contrast',
            impact: 'critical',
            message: 'Insufficient color contrast',
            elements: [element.tagName],
            remediation: 'Ensure text color contrasts with background',
        });
    }

    // Check for keyboard accessibility
    if (element.onclick && !element.hasAttribute('tabindex')) {
        violations.push({
            id: 'keyboard-access',
            impact: 'serious',
            message: 'Element not keyboard accessible',
            elements: [element.tagName],
            remediation: 'Add tabindex or use semantic HTML elements',
        });
    }

    const passes = 10 - violations.length;
    const compliancePercentage = (passes / 10) * 100;

    return {
        violations,
        passes,
        incomplete: 0,
        wcagLevel: compliancePercentage >= 90 ? 'AA' : 'A',
        compliancePercentage,
    };
}

/**
 * Check keyboard navigation
 * @param element - Element to check
 * @returns Keyboard navigation report
 */
export async function checkKeyboardNavigation(element: HTMLElement): Promise<{
    isKeyboardAccessible: boolean;
    focusableElements: HTMLElement[];
    tabOrder: number[];
    issues: string[];
}> {
    const focusableElements: HTMLElement[] = [];
    const tabOrder: number[] = [];
    const issues: string[] = [];

    // Find all focusable elements
    const focusableSelectors = [
        'button',
        'a[href]',
        'input',
        'select',
        'textarea',
        '[tabindex]',
    ];

    for (const selector of focusableSelectors) {
        const elements = element.querySelectorAll<HTMLElement>(selector);
        focusableElements.push(...Array.from(elements));
    }

    // Check tab order
    for (const el of focusableElements) {
        const tabindex = el.getAttribute('tabindex');
        if (tabindex) {
            const order = parseInt(tabindex, 10);
            if (order > 0) {
                tabOrder.push(order);
            }
        }
    }

    // Check for issues
    if (focusableElements.length === 0) {
        issues.push('No focusable elements found');
    }

    if (tabOrder.length > 0 && tabOrder.some((order) => order > 0)) {
        issues.push('Positive tabindex values found (should use 0 or -1)');
    }

    return {
        isKeyboardAccessible: issues.length === 0,
        focusableElements,
        tabOrder,
        issues,
    };
}

/**
 * Check color contrast ratio
 * @param foreground - Foreground color (hex or rgb)
 * @param background - Background color (hex or rgb)
 * @returns Contrast ratio and compliance
 */
export function checkColorContrast(
    foreground: string,
    background: string
): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
    message: string;
} {
    const fgLuminance = getLuminance(foreground);
    const bgLuminance = getLuminance(background);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    const ratio = (lighter + 0.05) / (darker + 0.05);

    return {
        ratio: parseFloat(ratio.toFixed(2)),
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7,
        message:
            ratio >= 7
                ? 'Passes WCAG AAA'
                : ratio >= 4.5
                    ? 'Passes WCAG AA'
                    : 'Does not meet WCAG standards',
    };
}

/**
 * Get relative luminance of a color
 * @param color - Color in hex or rgb format
 * @returns Relative luminance
 */
function getLuminance(color: string): number {
    const rgb = parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse color string to RGB
 * @param color - Color string
 * @returns RGB array or null
 */
function parseColor(color: string): [number, number, number] | null {
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (hex.length === 6) {
            return [
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16),
            ];
        }
    }

    // Handle rgb colors
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return [parseInt(rgbMatch[1], 10), parseInt(rgbMatch[2], 10), parseInt(rgbMatch[3], 10)];
    }

    return null;
}

/**
 * Check ARIA attributes
 * @param element - Element to check
 * @returns ARIA attribute report
 */
export function checkAriaAttributes(element: HTMLElement): {
    hasAriaLabel: boolean;
    hasAriaRole: boolean;
    hasAriaDescribedBy: boolean;
    hasAriaLabelledBy: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaRole = element.hasAttribute('role');
    const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');

    // Check for proper ARIA usage
    if (element.tagName === 'BUTTON' && !hasAriaLabel && !hasAriaLabelledBy) {
        const textContent = element.textContent?.trim();
        if (!textContent) {
            issues.push('Button missing accessible name');
        }
    }

    if (hasAriaRole) {
        const role = element.getAttribute('role');
        const validRoles = [
            'button',
            'link',
            'navigation',
            'main',
            'region',
            'alert',
            'dialog',
            'menu',
            'menuitem',
            'tab',
            'tablist',
            'tabpanel',
        ];

        if (role && !validRoles.includes(role)) {
            issues.push(`Invalid ARIA role: ${role}`);
        }
    }

    return {
        hasAriaLabel,
        hasAriaRole,
        hasAriaDescribedBy,
        hasAriaLabelledBy,
        issues,
    };
}

/**
 * Check semantic HTML
 * @param element - Element to check
 * @returns Semantic HTML report
 */
export function checkSemanticHTML(element: HTMLElement): {
    usesSemanticElements: boolean;
    semanticElements: string[];
    issues: string[];
} {
    const semanticElements: string[] = [];
    const issues: string[] = [];

    const semanticSelectors = [
        'header',
        'nav',
        'main',
        'article',
        'section',
        'aside',
        'footer',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'form',
        'label',
        'button',
        'a',
    ];

    for (const selector of semanticSelectors) {
        if (element.querySelector(selector)) {
            semanticElements.push(selector);
        }
    }

    // Check for divs used as buttons
    const divButtons = element.querySelectorAll('div[onclick]');
    if (divButtons.length > 0) {
        issues.push(`Found ${divButtons.length} divs used as buttons (use <button> instead)`);
    }

    // Check for divs used as links
    const divLinks = element.querySelectorAll('div[role="link"]');
    if (divLinks.length > 0) {
        issues.push(`Found ${divLinks.length} divs used as links (use <a> instead)`);
    }

    return {
        usesSemanticElements: semanticElements.length > 0,
        semanticElements,
        issues,
    };
}

/**
 * Check focus management
 * @param element - Element to check
 * @returns Focus management report
 */
export function checkFocusManagement(element: HTMLElement): {
    hasFocusIndicator: boolean;
    focusableElements: number;
    focusOrder: number[];
    issues: string[];
} {
    const issues: string[] = [];
    const focusableElements = element.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]'
    );

    const focusOrder: number[] = [];

    for (const el of focusableElements) {
        const tabindex = el.getAttribute('tabindex');
        if (tabindex) {
            const order = parseInt(tabindex, 10);
            focusOrder.push(order);
        }
    }

    // Check for focus indicator
    const style = window.getComputedStyle(element);
    const hasFocusIndicator = style.outline !== 'none' || style.boxShadow !== 'none';

    if (!hasFocusIndicator) {
        issues.push('No visible focus indicator');
    }

    if (focusOrder.some((order) => order > 0)) {
        issues.push('Positive tabindex values found');
    }

    return {
        hasFocusIndicator,
        focusableElements: focusableElements.length,
        focusOrder,
        issues,
    };
}

/**
 * Generate accessibility report
 * @param element - Element to check
 * @returns Comprehensive accessibility report
 */
export async function generateAccessibilityReport(
    element: HTMLElement
): Promise<{
    accessibility: AccessibilityReport;
    keyboard: Awaited<ReturnType<typeof checkKeyboardNavigation>>;
    aria: ReturnType<typeof checkAriaAttributes>;
    semantic: ReturnType<typeof checkSemanticHTML>;
    focus: ReturnType<typeof checkFocusManagement>;
}> {
    const [accessibility, keyboard, aria, semantic, focus] = await Promise.all([
        checkAccessibility(element),
        checkKeyboardNavigation(element),
        Promise.resolve(checkAriaAttributes(element)),
        Promise.resolve(checkSemanticHTML(element)),
        Promise.resolve(checkFocusManagement(element)),
    ]);

    return {
        accessibility,
        keyboard,
        aria,
        semantic,
        focus,
    };
}

export { };
