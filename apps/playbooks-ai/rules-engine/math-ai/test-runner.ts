
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { MathEngine } from './engine';

/**
 * CLI Runner for Math Engine Testing
 * Scans AgentX learning cases, extracts the JSON model, and executes it.
 */

const APPS_PATH = join(import.meta.dir, '../../agentx/apps/math-ai/learning');

function runMathTests() {
  if (!existsSync(APPS_PATH)) {
    console.error("Learning directory not found:", APPS_PATH);
    return;
  }

  const files = readdirSync(APPS_PATH).filter(f => f.endsWith('.agentx.md'));

  for (const file of files) {
    console.log(`\n\x1b[1m------------------------------------------------------------\x1b[0m`);
    console.log(`\x1b[1mTESTING CASE:\x1b[0m ${file}`);
    
    const content = readFileSync(join(APPS_PATH, file), 'utf8');
    
    // Extract JSON block using regex
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      console.log(`  \x1b[33m[SKIP]\x1b[0m No JSON logic model found.`);
      continue;
    }

    try {
      const model = JSON.parse(jsonMatch[1]);
      const engine = new MathEngine();
      const report = engine.run(model);

      console.log(`  \x1b[32m[SUCCESS]\x1b[0m Problem: ${model.math_ai_engine.problem || 'unnamed'}`);
      
      if (report.finalResultId) {
        const finalVal = report.allResults[report.finalResultId];
        console.log(`  \x1b[1mFinal Result (${report.finalResultId}):\x1b[0m \x1b[36m${finalVal.toFixed(4)}\x1b[0m`);
      } else {
        console.log(`  \x1b[1mComputation Path Result:\x1b[0m \x1b[36m${report.lastResult.toFixed(4)}\x1b[0m`);
      }

      // Display intermediate steps progress
      console.log(`  \x1b[2mSteps executed: ${Object.keys(report.allResults).length - Object.keys(model.math_ai_engine.variables || {}).length}\x1b[0m`);

    } catch (err) {
      console.error(`  \x1b[31m[ERROR]\x1b[0m ${(err as Error).message}`);
    }
  }
}

runMathTests();
