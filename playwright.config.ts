import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './__tests__/e2e/specs',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : 8,
    reporter: [
        ['html'],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
    ],

    use: {
        baseURL: 'http://localhost:5179/wb-diagram-board',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // webServer: {
    //     command: 'npm run dev',
    //     url: 'http://localhost:5177/wb-diagram-board',
    //     reuseExistingServer: !process.env.CI,
    //     timeout: 120000,
    // },
});
