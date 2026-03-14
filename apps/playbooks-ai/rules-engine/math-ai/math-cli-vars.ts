#!/usr/bin/env bun

import { MathEngine } from './engine';

/**
 * Math AI CLI — Deterministic Expression Solver with Variable Support
 *
 * Usage:
 *   Simple: bun run math-cli-vars.ts "1 + 2 * (30 + 19) / 3"
 *   With vars: bun run math-cli-vars.ts "a19 - 15 * (19 - b)" a19=101 b=2
 *   JSON vars: bun run math-cli-vars.ts "a - 15 * (19 - b)" --json '{"a":101,"b":2}'
 */

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("\x1b[1;33mUsage:\x1b[0m");
    console.log("  Simple:    bun run math-cli-vars.ts \"<expression>\"");
    console.log("  With vars: bun run math-cli-vars.ts \"<expression>\" var1=value1 var2=value2 ...");
    console.log("  JSON vars: bun run math-cli-vars.ts \"<expression>\" --json '{\"var\":value}'");
    console.log("\n\x1b[1;33mExamples:\x1b[0m");
    console.log("  bun run math-cli-vars.ts \"1 + 2 * (30 + 19) / 3\"");
    console.log("  bun run math-cli-vars.ts \"a - 15 * (19 - b)\" a=101 b=2");
    console.log("  bun run math-cli-vars.ts \"a19 - 15 * (19 - b)\" a19=101 b=2");
    console.log("  bun run math-cli-vars.ts \"a + b * sqrt(c)\" --json '{\"a\":100,\"b\":5,\"c\":16}'");
    process.exit(0);
  }

  const expression = args[0];
  const variables: Record<string, number> = {};

  // Check for JSON format
  if (args.length >= 3 && args[1] === '--json') {
    try {
      const jsonVars = JSON.parse(args[2]);
      Object.assign(variables, jsonVars);
    } catch (error) {
      console.error(`\x1b[1;31m[ERROR]\x1b[0m Invalid JSON: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    // Parse key=value pairs
    for (let i = 1; i < args.length; i++) {
      const match = args[i].match(/^([a-zA-Z_]\w*)=(-?\d+(?:\.\d+)?)$/);
      if (match) {
        const [, key, value] = match;
        variables[key] = parseFloat(value);
      } else {
        console.error(`\x1b[1;31m[ERROR]\x1b[0m Invalid variable format: "${args[i]}"`);
        console.error('Expected format: variable=value (e.g., a=101 or x_val=3.14)');
        process.exit(1);
      }
    }
  }

  return { expression, variables };
}

const { expression, variables } = parseArgs();

try {
  console.log(`\x1b[1;36m[FORMULA]\x1b[0m ${expression}`);

  if (Object.keys(variables).length > 0) {
    console.log(`\x1b[1;35m[VARIABLES]\x1b[0m ${JSON.stringify(variables)}`);
  }

  // Create engine with variables
  const engine = new MathEngine(variables);

  // Parse infix to AgentX JSON
  const model = engine.parseExpression(expression);

  // Execute
  const result = engine.run(model);

  console.log(`\x1b[1;32m[RESULT]\x1b[0m \x1b[1m${result.lastResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}\x1b[0m`);

  // Show intermediate values if there are any
  const intermediateKeys = Object.keys(result.allResults).filter(
    k => !['PI', 'E', 'final_result', 'temp'].includes(k) && !variables.hasOwnProperty(k)
  );

  if (intermediateKeys.length > 0) {
    console.log('\x1b[2m[INTERMEDIATE VALUES]\x1b[0m');
    intermediateKeys.forEach(k => {
      console.log(`  ${k}: ${result.allResults[k]}`);
    });
  }

} catch (error) {
  console.error(`\x1b[1;31m[ERROR]\x1b[0m ${(error as Error).message}`);
  process.exit(1);
}
