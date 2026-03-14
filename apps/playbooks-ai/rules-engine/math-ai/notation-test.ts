
import { MathEngine } from './engine';

const engine = new MathEngine();

console.log("\x1b[1m🧮 ALGEBRAIC NOTATION: PARSER TEST\x1b[0m");

const notation = "1 + 2 * (30 + 19) / 3 + 1000";
console.log(`\nInput String: "${notation}"`);

// Use the new parser to turn string into AgentX logic
const model = engine.parseExpression(notation);

// Execute the generated model
const res = engine.run(model);

console.log(`\n  \x1b[32m[PARSED LOGIC]\x1b[0m ${JSON.stringify(model.math_ai_engine.operations[0])}`);
console.log(`\n  \x1b[32m[FINAL RESULT]\x1b[0m \x1b[1;36m${res.lastResult.toFixed(2)}\x1b[0m`);
