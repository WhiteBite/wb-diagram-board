import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runTest() {
    try {
        const { stdout, stderr } = await execAsync('npx playwright test rectangle.spec.ts --reporter=list');
        console.log(stdout);
        if (stderr) console.error(stderr);
    } catch (error) {
        console.error('Error:', error.message);
        console.log(error.stdout);
        console.error(error.stderr);
    }
}

runTest();
