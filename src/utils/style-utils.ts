/**
 * Style Utilities for Format Painter
 *
 * Functions for extracting and applying styles between nodes
 */

import type { DiagramNode, NodeStyle, TextStyle } from '../xyflow/types';

// =============================================================================
// Types
// =============================================================================

/**
 * Copied style data structure
 * Contains both visual style and text style properties
 */
export interface CopiedStyle {
    /** Visual style properties */
    style: NodeStyle;
    /** Text style properties */
    textStyle: TextStyle;
    /** Timestamp when style was copied */
    copiedAt: number;
}

/**
 * Properties that can be copied between nodes
 */
export const COPYABLE_STYLE_PROPS: (keyof NodeStyle)[] = [
    'fill',
    'stroke',
    'strokeWidth',
    'cornerRadius',
];

export const COPYABLE_TEXT_STYLE_PROPS: (keyof TextStyle)[] = [
    'fontSize',
    'fontFamily',
    'fontWeight',
    'color',
    'textAlign',
];

// =============================================================================
// Extract Style
// =============================================================================

/**
 * Extracts copyable style properties from a node
 *
 * @param node - Source node to extract style from
 * @returns CopiedStyle object with extracted properties
 *
 * @example
 * ```ts
 * const style = extractStyle(selectedNode);
 * // { style: { fill: '#fff', stroke: '#000' }, textStyle: { fontSize: 14 } }
 * ```
 */
export function extractStyle(node: DiagramNode): CopiedStyle {
    const nodeStyle = node.data?.style ?? {};
    const nodeTextStyle = node.data?.textStyle ?? {};

    // Extract only copyable style properties
    const style: NodeStyle = {};
    for (const prop of COPYABLE_STYLE_PROPS) {
        if (nodeStyle[prop] !== undefined) {
            style[prop] = nodeStyle[prop];
        }
    }

    // Extract only copyable text style properties
    const textStyle: TextStyle = {};
    for (const prop of COPYABLE_TEXT_STYLE_PROPS) {
        if (nodeTextStyle[prop] !== undefined) {
            textStyle[prop] = nodeTextStyle[prop];
        }
    }

    return {
        style,
        textStyle,
        copiedAt: Date.now(),
    };
}

// =============================================================================
// Apply Style
// =============================================================================

/**
 * Applies copied style to a node, returning a new node with merged styles
 *
 * @param node - Target node to apply style to
 * @param copiedStyle - Style to apply
 * @returns New node with applied styles (immutable)
 *
 * @example
 * ```ts
 * const updatedNode = applyStyle(targetNode, copiedStyle);
 * ```
 */
export function applyStyle(node: DiagramNode, copiedStyle: CopiedStyle): DiagramNode {
    return {
        ...node,
        data: {
            ...node.data,
            style: {
                ...node.data?.style,
                ...copiedStyle.style,
            },
            textStyle: {
                ...node.data?.textStyle,
                ...copiedStyle.textStyle,
            },
        },
    };
}

// =============================================================================
// Batch Apply Style
// =============================================================================

/**
 * Applies copied style to multiple nodes
 *
 * @param nodes - Array of target nodes
 * @param copiedStyle - Style to apply
 * @returns Array of nodes with applied styles
 */
export function applyStyleToNodes(
    nodes: DiagramNode[],
    copiedStyle: CopiedStyle
): DiagramNode[] {
    return nodes.map((node) => applyStyle(node, copiedStyle));
}

// =============================================================================
// Style Comparison
// =============================================================================

/**
 * Checks if two styles are equal
 *
 * @param styleA - First style to compare
 * @param styleB - Second style to compare
 * @returns true if styles are equal
 */
export function areStylesEqual(
    styleA: CopiedStyle | null,
    styleB: CopiedStyle | null
): boolean {
    if (styleA === null && styleB === null) return true;
    if (styleA === null || styleB === null) return false;

    const stylePropsEqual = COPYABLE_STYLE_PROPS.every(
        (prop) => styleA.style[prop] === styleB.style[prop]
    );

    const textStylePropsEqual = COPYABLE_TEXT_STYLE_PROPS.every(
        (prop) => styleA.textStyle[prop] === styleB.textStyle[prop]
    );

    return stylePropsEqual && textStylePropsEqual;
}

// =============================================================================
// Style Validation
// =============================================================================

/**
 * Checks if a copied style has any meaningful properties
 *
 * @param copiedStyle - Style to validate
 * @returns true if style has at least one property
 */
export function hasStyleProperties(copiedStyle: CopiedStyle | null): boolean {
    if (!copiedStyle) return false;

    const hasStyle = Object.keys(copiedStyle.style).length > 0;
    const hasTextStyle = Object.keys(copiedStyle.textStyle).length > 0;

    return hasStyle || hasTextStyle;
}

/**
 * Creates a human-readable description of copied style
 *
 * @param copiedStyle - Style to describe
 * @returns Description string
 */
export function describeStyle(copiedStyle: CopiedStyle | null): string {
    if (!copiedStyle) return 'No style copied';

    const parts: string[] = [];

    if (copiedStyle.style.fill) {
        parts.push(`fill: ${copiedStyle.style.fill}`);
    }
    if (copiedStyle.style.stroke) {
        parts.push(`stroke: ${copiedStyle.style.stroke}`);
    }
    if (copiedStyle.textStyle.fontSize) {
        parts.push(`font: ${copiedStyle.textStyle.fontSize}px`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Empty style';
}
