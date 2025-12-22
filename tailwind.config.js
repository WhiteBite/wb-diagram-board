/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                canvas: {
                    bg: 'var(--canvas-bg)',
                    grid: 'var(--canvas-grid)',
                    selection: 'var(--canvas-selection)',
                },
                toolbar: {
                    bg: 'var(--toolbar-bg)',
                    hover: 'var(--toolbar-hover)',
                    active: 'var(--toolbar-active)',
                },
            },
            cursor: {
                grab: 'grab',
                grabbing: 'grabbing',
                crosshair: 'crosshair',
            },
        },
    },
    plugins: [],
};
