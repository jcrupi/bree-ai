
import { MathEngine } from './engine';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEMPLATE_PATH = join(import.meta.dir, '../../agentx/apps/math-ai/math-ai-lib/streaming-stats.template.algos.agentx.md');
const statsTemplate = readFileSync(TEMPLATE_PATH, 'utf8');

const engine = new MathEngine();

console.log("\x1b[1m📊 STREAMING ANALYTICS: ROLLING WINDOW TEST\x1b[0m");

// Scenario: A fluctuating sensor reading
const samples = [10.5, 12.2, 9.8, 15.4, 11.0];
console.log(`\nWindow Samples: [${samples.join(', ')}]`);

const res = engine.runTemplate(statsTemplate, { 
    s1: samples[0], 
    s2: samples[1], 
    s3: samples[2], 
    s4: samples[3], 
    s5: samples[4] 
});

console.log(`  \x1b[32m[RESULT]\x1b[0m Mean: ${res.allResults.RunningMean.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Min:  ${res.allResults.MinVal.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Max:  ${res.allResults.MaxVal.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Range: ${res.allResults.Range.toFixed(2)}`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Sum:   ${res.allResults.RunningSum.toFixed(2)}`);
