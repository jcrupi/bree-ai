use math_ai_rust::{MathEngine};
use std::time::Instant;

fn main() {
    let expression = "1 + 2(30+19)/3^2 + 1000 + 1 + 2(30+19)/3^2 + 1000 - 1 + 2(30+19)/3^2 + 1000 / (1 + 2(30+19)/3^2 + 1000) * 21  - 1 + 2(30+19)/3^2 + 1000 + 10002";
    let iterations = 100_000;

    println!("\x1b[1m🦀 RUST BENCHMARK: {} iterations\x1b[0m", iterations);

    let engine = MathEngine::new(true);
    let wrapper = engine.parse_expression(expression).unwrap();

    let mut runner = MathEngine::new(true);
    let start = Instant::now();
    for _ in 0..iterations {
        runner.clear_variables();
        let _ = runner.run(&wrapper);
    }
    let duration = start.elapsed();

    let total_ms = duration.as_secs_f64() * 1000.0;
    let avg_us = (total_ms * 1000.0) / iterations as f64;
    let ops_per_sec = iterations as f64 / duration.as_secs_f64();

    println!("\n  Total Time: \x1b[36m{:.2}ms\x1b[0m", total_ms);
    println!("\n  Avg/Run:    \x1b[36m{:.4}μs\x1b[0m", avg_us);
    println!("  Ops/Sec:    \x1b[32m{}\x1b[0m", (ops_per_sec as u64));
}
