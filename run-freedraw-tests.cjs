#!/usr/bin/env node
const { spawn } = require('child_process');

const playwright = spawn('npx', ['playwright', 'test', 'freedraw', '--reporter=list'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

playwright.on('close', (code) => {
    process.exit(code);
});
