import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['__tests__/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/*.spec.ts',
                '**/*.spec.tsx',
                '__tests__/**',
            ],
            lines: 100,
            functions: 100,
            branches: 100,
            statements: 100,
        },
        include: ['**/*.test.ts', '**/*.test.tsx', '__tests__/unit/**/*.spec.ts', '__tests__/unit/**/*.spec.tsx'],
        exclude: [
            'node_modules',
            'dist',
            '.idea',
            '.git',
            '.cache',
            '__tests__/e2e/**',
            '**/third-party-ignore/**',
            'src/core/performance/performance.test.ts',
        ],
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
