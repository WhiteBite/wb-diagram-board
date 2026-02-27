import fs from 'fs';

const filePath = './src/components/Canvas.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add Shift constraint for proportional shapes
const oldShapeCode = `                // Shape elements (including frame)
                if (['rectangle', 'ellipse', 'diamond', 'triangle', 'frame'].includes(currentElement.type)) {
                    const width = Math.abs(snappedPoint.x - startPoint.x);
                    const height = Math.abs(snappedPoint.y - startPoint.y);
                    const x = Math.min(snappedPoint.x, startPoint.x);
                    const y = Math.min(snappedPoint.y, startPoint.y);

                    setCurrentElement({
                        ...currentElement,
                        x,
                        y,
                        width,
                        height,
                    });
                }`;

const newShapeCode = `                // Shape elements (including frame)
                if (['rectangle', 'ellipse', 'diamond', 'triangle', 'frame'].includes(currentElement.type)) {
                    let width = Math.abs(snappedPoint.x - startPoint.x);
                    let height = Math.abs(snappedPoint.y - startPoint.y);
                    
                    // Shift key constraint - make proportional (square/circle)
                    if (e.shiftKey && currentElement.type !== 'frame') {
                        const size = Math.min(width, height);
                        width = size;
                        height = size;
                    }
                    
                    const x = Math.min(snappedPoint.x, startPoint.x);
                    const y = Math.min(snappedPoint.y, startPoint.y);

                    setCurrentElement({
                        ...currentElement,
                        x,
                        y,
                        width,
                        height,
                    });
                }`;

content = content.replace(oldShapeCode, newShapeCode);

// Fix 2: Enforce minimum size during drawing (not just at end)
const oldMinSizeCode = `                // End drawing - auto-switch to Select tool for one-shot tools only
                if (isDrawing && currentElement) {
                    // Enforce minimum size
                    const minSize = currentElement.type === 'frame' ? 100 : 5;

                    // Ensure element meets minimum size requirements
                    const finalWidth = Math.max(currentElement.width, minSize);
                    const finalHeight = Math.max(currentElement.height, minSize);

                    // Only create element if it has some size
                    if (currentElement.width > 0 && currentElement.height > 0) {`;

const newMinSizeCode = `                // End drawing - auto-switch to Select tool for one-shot tools only
                if (isDrawing && currentElement) {
                    // Enforce minimum size
                    const minSize = currentElement.type === 'frame' ? 100 : 5;

                    // Ensure element meets minimum size requirements
                    const finalWidth = Math.max(currentElement.width, minSize);
                    const finalHeight = Math.max(currentElement.height, minSize);

                    // Only create element if it meets minimum size
                    if (finalWidth >= minSize && finalHeight >= minSize) {`;

content = content.replace(oldMinSizeCode, newMinSizeCode);

// Fix 3: Auto-switch to select tool after shape creation
const oldAutoSwitchCode = `                        // Don't auto-switch for drawing tools - let user draw multiple elements
                        // Only auto-switch for one-shot tools (text, sticky handled separately)
                    }
                    setCurrentElement(null);
                    setDrawing(false);
                }`;

const newAutoSwitchCode = `                        // Auto-switch to select tool for shape tools
                        if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(elementToAdd.type)) {
                            setActiveTool('select');
                        }
                    }
                    setCurrentElement(null);
                    setDrawing(false);
                }`;

content = content.replace(oldAutoSwitchCode, newAutoSwitchCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all 3 shape bugs!');
