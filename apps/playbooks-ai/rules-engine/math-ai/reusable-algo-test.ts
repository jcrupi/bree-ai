
import { MathEngine } from './engine';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Demonstrating reusable Algos with dynamic variable injection
 */

const TEMPLATE_PATH = join(import.meta.dir, '../../agentx/apps/math-ai/math-ai-lib/bmi.template.algos.agentx.md');
const bmiTemplate = readFileSync(TEMPLATE_PATH, 'utf8');

const engine = new MathEngine();

console.log("\x1b[1mREUSABLE ALGO TEST\x1b[0m");

// Scenario 1: Heavy Patient
console.log("\nScenario 1: W=120kg, H=1.75m");
const res1 = engine.runTemplate(bmiTemplate, { W: 120, H: 1.75 });
console.log(`  \x1b[32m[RESULT]\x1b[0m BMI: ${res1.allResults.BMI.toFixed(2)}`);

// Clear context for next run
const engine2 = new MathEngine();

// Scenario 2: Light Patient
console.log("\nScenario 2: W=65kg, H=1.82m");
const res2 = engine2.runTemplate(bmiTemplate, { W: 65, H: 1.82 });
console.log(`  \x1b[32m[RESULT]\x1b[0m BMI: ${res2.allResults.BMI.toFixed(2)}`);
