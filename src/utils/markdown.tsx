import React from 'react';

/**
 * Parse markdown text and return React elements
 * Supported: **bold**, *italic*, ~~strikethrough~~
 */
export function parseMarkdown(text: string): React.ReactNode {
    if (!text) return null;

    // Split by lines to handle multiline
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
            {lineIndex > 0 && <br />}
            {parseInlineMarkdown(line)}
        </React.Fragment>
    ));
}

/**
 * Parse inline markdown (bold, italic, strikethrough)
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let keyIndex = 0;

    // Combined regex to find all markdown patterns
    const combinedRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~)/g;
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }

        const fullMatch = match[0];
        keyIndex++;

        // Determine which pattern matched
        if (fullMatch.startsWith('**') && fullMatch.endsWith('**')) {
            const content = fullMatch.slice(2, -2);
            result.push(<strong key={keyIndex}>{content}</strong>);
        } else if (fullMatch.startsWith('~~') && fullMatch.endsWith('~~')) {
            const content = fullMatch.slice(2, -2);
            result.push(<del key={keyIndex}>{content}</del>);
        } else if (fullMatch.startsWith('*') && fullMatch.endsWith('*')) {
            const content = fullMatch.slice(1, -1);
            result.push(<em key={keyIndex}>{content}</em>);
        }

        lastIndex = match.index + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : [text];
}
