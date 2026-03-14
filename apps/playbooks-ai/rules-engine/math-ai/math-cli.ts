
import { MathEngine } from './engine';

/**
 * Math AI CLI — Deterministic Expression Solver
 * Usage: bun run math-cli.ts "1 + 2 * (30 + 19) / 3"
 */

const expression = process.argv.slice(2).join(' ');

if (!expression) {
  console.log("\x1b[1;33mUsage:\x1b[0m bun run math-cli.ts \"<expression>\"");
  console.log("Example: bun run math-cli.ts \"1 + 2 * (30 + 19) / 3 + 1000\"");
  process.exit(0);
}

const engine = new MathEngine();

try {
  console.log(`\x1b[1;36m[INPUT]\x1b[0m ${expression}`);
  
  // Parse infix to AgentX JSON
  const model = engine.parseExpression(expression);
  
  // Execute
  const result = engine.run(model);

  console.log(`\x1b[1;32m[RESULT]\x1b[0m \x1b[1m${result.lastResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}\x1b[0m`);
} catch (error) {
  console.error(`\x1b[1;31m[ERROR]\x1b[0m ${(error as Error).message}`);
  process.exit(1);
}
