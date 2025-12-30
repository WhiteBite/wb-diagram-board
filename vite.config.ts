import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    base: process.env.BASE_URL || '/wb-diagram-board/',
    server: {
        port: 5179,
        strictPort: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Core React vendor chunk
                    'vendor-react': ['react', 'react-dom'],
                    // XY Flow chunk (large library)
                    'vendor-xyflow': ['@xyflow/react'],
                    // Diagram converter chunk
                    'vendor-diagram': ['@whitebite/diagram-converter'],
                    // Zustand state management
                    'vendor-zustand': ['zustand'],
                },
            },
        },
    },
});
