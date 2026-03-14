
import { MathEngine } from './engine';

const engine = new MathEngine();
const expression = "1 + 2(30+19)/3^2 + 1000 + 1 + 2(30+19)/3^2 + 1000 - 1 + 2(30+19)/3^2 + 1000 / (1 + 2(30+19)/3^2 + 1000) * 21  - 1 + 2(30+19)/3^2 + 1000 + 10002";
const ITERATIONS = 100_000;

console.log(`\x1b[1m🚀 TS BENCHMARK: ${ITERATIONS.toLocaleString()} iterations\x1b[0m`);

// Pre-parse to measure pure execution speed
const model = engine.parseExpression(expression);

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
   // Use a fresh engine instance or clear results to ensure fair work
   const runner = new MathEngine({}, true);
   runner.run(model);
}
const end = performance.now();

const totalMs = end - start;
const avgMs = totalMs / ITERATIONS;

console.log(`\n  Total Time: \x1b[36m${totalMs.toFixed(2)}ms\x1b[0m`);
console.log(`  Avg/Run:    \x1b[36m${(avgMs * 1000).toFixed(4)}μs\x1b[0m`);
console.log(`  Ops/Sec:    \x1b[32m${Math.round(ITERATIONS / (totalMs / 1000)).toLocaleString()}\x1b[0m`);
