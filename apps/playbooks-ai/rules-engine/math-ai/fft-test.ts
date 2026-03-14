
import { MathEngine } from './engine';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE_PATH = join(import.meta.dir, '../../agentx/apps/math-ai/math-ai-lib/fft-4point-magnitude.template.algos.agentx.md');
const fftTemplate = readFileSync(TEMPLATE_PATH, 'utf8');

const engine = new MathEngine();

console.log("\x1b[1m⚡ SIGNAL ANALYSIS: 4-POINT FFT TEST\x1b[0m");

// Scenario: A simple sine wave oscillating at fundamental frequency
// x0=1, x1=0, x2=-1, x3=0
console.log("\nInput Signal: [1, 0, -1, 0]");
const res = engine.runTemplate(fftTemplate, { x0: 1, x1: 0, x2: -1, x3: 0 });

console.log(`  \x1b[32m[RESULT]\x1b[0m Mag0 (DC): ${res.allResults.Mag0.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Mag1 (Fundamental): ${res.allResults.Mag1.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Mag2 (2nd Harmonic): ${res.allResults.Mag2.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Mag3 (Nyquist): ${res.allResults.Mag3.toFixed(2)}`);
