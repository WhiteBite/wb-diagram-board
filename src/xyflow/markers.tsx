import { memo, useEffect } from 'react';

/**
 * SVG marker definitions for edges.
 * Injects markers into ReactFlow's SVG defs element.
 */
export const EdgeMarkers = memo(() => {
    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 20;

        const tryInject = () => {
            // Find ReactFlow's SVG element
            const rfSvg = document.querySelector('.react-flow__edges > svg');

            if (!rfSvg) {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryInject, 100);
                } else {
                    // Fallback: inject into body
                    injectIntoBody();
                }
                return;
            }

            // Check if already injected
            if (rfSvg.querySelector('[data-custom-marker]')) return;

            // Find or create defs element
            let defs = rfSvg.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                rfSvg.prepend(defs);
            }

            // Add markers
            const markersHtml = getMarkersHtml();
            const temp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            temp.innerHTML = markersHtml;

            // Move markers from temp to defs
            while (temp.firstChild) {
                defs.appendChild(temp.firstChild);
            }
        };

        tryInject();

        return () => {
            // Cleanup on unmount
            const rfSvg = document.querySelector('.react-flow__edges > svg');
            const markers = rfSvg?.querySelectorAll('[data-custom-marker]');
            markers?.forEach(m => m.remove());

            // Also cleanup body fallback
            const bodySvg = document.getElementById('xyflow-custom-markers');
            bodySvg?.remove();
        };
    }, []);

    return null;
});

function injectIntoBody() {
    if (document.getElementById('xyflow-custom-markers')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'xyflow-custom-markers';
    svg.setAttribute('style', 'position: absolute; width: 0; height: 0; overflow: hidden;');
    svg.innerHTML = `<defs>${getMarkersHtml()}</defs>`;
    document.body.appendChild(svg);
}

function getMarkersHtml(): string {
    return `
        <!-- Arrow marker (end) -->
        <marker data-custom-marker="true" id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>

        <!-- Arrow marker (start) -->
        <marker data-custom-marker="true" id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 10 0 L 0 5 L 10 10 z" fill="currentColor" />
        </marker>

        <!-- Open arrow marker (end) - lines only, no fill -->
        <marker data-custom-marker="true" id="open-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>

        <!-- Open arrow marker (start) -->
        <marker data-custom-marker="true" id="open-arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 10 0 L 0 5 L 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>

        <!-- Triangle marker (end) - outline only -->
        <marker data-custom-marker="true" id="triangle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>

        <!-- Triangle marker (start) -->
        <marker data-custom-marker="true" id="triangle-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 10 0 L 0 5 L 10 10 z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>

        <!-- Diamond marker (end) -->
        <marker data-custom-marker="true" id="diamond" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 6 L 6 0 L 12 6 L 6 12 z" fill="currentColor" />
        </marker>

        <!-- Diamond marker (start) -->
        <marker data-custom-marker="true" id="diamond-start" viewBox="0 0 12 12" refX="6" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
            <path d="M 0 6 L 6 0 L 12 6 L 6 12 z" fill="currentColor" />
        </marker>

        <!-- Circle marker (end) -->
        <marker data-custom-marker="true" id="circle" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <circle cx="5" cy="5" r="4" fill="currentColor" />
        </marker>

        <!-- Circle marker (start) -->
        <marker data-custom-marker="true" id="circle-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <circle cx="5" cy="5" r="4" fill="currentColor" />
        </marker>

        <!-- Square marker (end) -->
        <marker data-custom-marker="true" id="square" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <rect x="1" y="1" width="8" height="8" fill="currentColor" />
        </marker>

        <!-- Square marker (start) -->
        <marker data-custom-marker="true" id="square-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <rect x="1" y="1" width="8" height="8" fill="currentColor" />
        </marker>
    `;
}

EdgeMarkers.displayName = 'EdgeMarkers';
