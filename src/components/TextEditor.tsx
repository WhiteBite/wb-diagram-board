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

    const [text, setText] = useState(() => {
        if (!element) return '';
        if (element.type === 'text') return (element as TextElement).text;
        if (element.type === 'sticky') return (element as StickyElement).text;
        if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(element.type)) {
            return (element as ShapeElement).text || '';
        }
        return '';
    });

    useEffect(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
    }, []);

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
            onClose();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    }, [onClose, handleSave]);

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
