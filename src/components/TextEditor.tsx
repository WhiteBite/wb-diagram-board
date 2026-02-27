/**
 * TextEditor - Inline text editing for shapes
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../store/canvas-store';
import { Transform, ShapeElement, TextElement, StickyElement } from '../types/canvas';

interface TextEditorProps {
    elementId: string;
    transform: Transform;
    onClose: () => void;
}

export function TextEditor({ elementId, transform, onClose }: TextEditorProps) {
    const element = useCanvasStore((s) => s.elements[elementId]);
    const updateElement = useCanvasStore((s) => s.updateElement);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textRef = useRef<string>('');

    const [text, setText] = useState(() => {
        if (!element) return '';
        if (element.type === 'text') return (element as TextElement).text;
        if (element.type === 'sticky') return (element as StickyElement).text;
        if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(element.type)) {
            return (element as ShapeElement).text || '';
        }
        return '';
    });

    // Keep textRef in sync with text state
    useEffect(() => {
        textRef.current = text;
    }, [text]);

    // Focus and select text when editor appears
    useEffect(() => {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.select();
            }
        });
    }, []);

    // Save text when component unmounts
    useEffect(() => {
        return () => {
            if (!element) return;

            const finalText = textRef.current;
            if (element.type === 'text') {
                updateElement(elementId, { text: finalText } as Partial<TextElement>);
            } else if (element.type === 'sticky') {
                updateElement(elementId, { text: finalText } as Partial<StickyElement>);
            } else if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(element.type)) {
                updateElement(elementId, { text: finalText } as Partial<ShapeElement>);
            }
        };
    }, [element, elementId, updateElement]);

    const handleSave = useCallback(() => {
        if (!element) return;

        if (element.type === 'text') {
            updateElement(elementId, { text } as Partial<TextElement>);
        } else if (element.type === 'sticky') {
            updateElement(elementId, { text } as Partial<StickyElement>);
        } else if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(element.type)) {
            updateElement(elementId, { text } as Partial<ShapeElement>);
        }

        onClose();
    }, [element, elementId, text, updateElement, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            // Don't save on Escape, just close
            onClose();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            // If textarea is empty or text is selected, allow normal delete behavior
            const textarea = e.target as HTMLTextAreaElement;
            const hasSelection = textarea.selectionStart !== textarea.selectionEnd;
            const isEmpty = text.trim() === '';

            // If there's selected text or cursor is not at start, let it delete text normally
            if (hasSelection || textarea.selectionStart > 0 || !isEmpty) {
                return; // Allow default behavior
            }

            // If empty and at start, delete the element itself
            e.preventDefault();
            onClose();
            // Delete the element after closing editor
            setTimeout(() => {
                const deleteElements = useCanvasStore.getState().deleteElements;
                deleteElements([elementId]);
            }, 0);
        } else if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter to save
            e.preventDefault();
            handleSave();
        }
        // Regular Enter creates new line (default textarea behavior)
    }, [onClose, handleSave, text, elementId]);

    if (!element) return null;

    // Calculate screen position
    const screenX = element.x * transform.scale + transform.x;
    const screenY = element.y * transform.scale + transform.y;
    const screenWidth = element.width * transform.scale;
    const screenHeight = element.height * transform.scale;

    return (
        <div
            className="absolute z-50"
            style={{
                left: screenX,
                top: screenY,
                width: screenWidth,
                height: screenHeight,
            }}
        >
            <textarea
                ref={textareaRef}
                data-testid={element.type === 'sticky' ? 'sticky-editor' : 'text-editor'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="w-full h-full bg-transparent border-2 border-indigo-500 rounded resize-none outline-none text-center"
                style={{
                    fontSize: Math.max(12, 16 * transform.scale),
                    fontFamily: 'Inter, system-ui, sans-serif',
                    color: element.type === 'sticky' ? '#1e1e1e' : '#e5e7eb',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                placeholder="Type text..."
            />
        </div>
    );
}
