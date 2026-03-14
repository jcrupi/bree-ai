
import { MathEngine } from './engine';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const VARIABLE_RATE_PATH = join(import.meta.dir, '../../agentx/apps/math-ai/math-ai-lib/temporal-variable-rate.template.algos.agentx.md');
const CONSTANT_RATE_PATH = join(import.meta.dir, '../../agentx/apps/math-ai/math-ai-lib/temporal-constant-rate.template.algos.agentx.md');

const variableTemplate = readFileSync(VARIABLE_RATE_PATH, 'utf8');
const constantTemplate = readFileSync(CONSTANT_RATE_PATH, 'utf8');

const engine = new MathEngine();

console.log("\x1b[1m⏱️ TEMPORAL ANALYTICS: TREND & PREDICTION TEST\x1b[0m\n");

// --- TEST 1: Variable Rate ---
console.log("\x1b[1m[TEST 1] Variable Rate Analytics (Non-uniform sampling)\x1b[0m");
// Scenario: A server's memory usage is climbing
const data1 = {
    v_last: 1024,
    v_now: 1536,
    t_last: 0,
    t_now: 10,
    horizon: 60
};
console.log(`Event Log:
  T=0:  1024 MB
  T=10: 1536 MB (+512 MB offset)
  Target: Predict @ T=70 (60s horizon)`);

const res1 = engine.runTemplate(variableTemplate, data1);
console.log(`  \x1b[32m[RESULT]\x1b[0m Velocity: ${res1.allResults.Velocity.toFixed(2)} MB/s`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Drift:    ${res1.allResults.DriftPct.toFixed(2)}%`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Projected (T+60): \x1b[1;36m${res1.allResults.V_Projected.toFixed(2)} MB\x1b[0m\n`);

// --- TEST 2: Constant Rate ---
console.log("\x1b[1m[TEST 2] Constant Frequency Analytics (Uniform sampling)\x1b[0m");
// Scenario: Sensor pushing data every 100ms (freq = 10Hz)
const data2 = {
    v_last: 180,
    v_now: 200,
    freq: 10,       // 10 samples per second
    horizon: 5      // 5 seconds into the future
};
console.log(`Event Log:
  Previous Value: 180
  Current Value:  200
  Frequency:      10 Hz (0.1s interval)
  Target:         Predict 5 seconds out`);

const res2 = engine.runTemplate(constantTemplate, data2);
console.log(`  \x1b[32m[RESULT]\x1b[0m Velocity: ${res2.allResults.Velocity.toFixed(2)} units/s`);
console.log(`  \x1b[32m[RESULT]\x1b[0m Projected (T+5s): \x1b[1;36m${res2.allResults.V_Projected.toFixed(2)} units\x1b[0m`);
