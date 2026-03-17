use math_ai_rust::{AgentXWrapper, MathEngine};
use std::env;
use std::fs;

fn main() -> Result<(), String> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        println!("\x1b[1;33mUsage:\x1b[0m math-ai-rust <path_to_agentx_or_json_or_expression>");
        println!("Example: math-ai-rust ../../agentx/apps/math-ai/math-ai-lib/bmi.template.algos.agentx.md");
        println!("Example: math-ai-rust \"1 + 2(30+19)/3^2\"");
        return Ok(());
    }

    let input = &args[1];
    let mut engine = MathEngine::new(false);

    let wrapper = if fs::metadata(input).is_ok() {
        // It's a file
        let content = fs::read_to_string(input).map_err(|e| format!("Could not read file: {}", e))?;
        
        let json_str = if content.contains("```json") {
            let blocks: Vec<&str> = content.split("```json").collect();
            let mut model_block = String::new();
            for block in &blocks[1..] {
                if let Some(end) = block.find("```") {
                    let inner = block[..end].trim();
                    if inner.contains("\"operations\"") {
                        model_block = inner.to_string();
                        break;
                    }
                }
            }
            if model_block.is_empty() {
                let start = content.find("```json").unwrap() + 7;
                let end = content[start..].find("```").expect("Closing ``` not found");
                content[start..start+end].trim().to_string()
            } else {
                model_block
            }
        } else {
            content.trim().to_string()
        };

        if json_str.contains("\"math_ai_engine\"") {
            serde_json::from_str::<AgentXWrapper>(&json_str).map_err(|e| format!("Wrapper parsing failed: {}", e))?
        } else {
            let m = serde_json::from_str::<engine::MathModel>(&json_str).map_err(|e| format!("Raw model parsing failed: {}", e))?;
            AgentXWrapper { math_ai_engine: m }
        }
    } else {
        // It's a raw expression
        engine.parse_expression(input).map_err(|e| format!("Expression parsing failed: {}", e))?
    };

    // Parse command line overrides (e.g. W=85 H=1.8)
    for arg in &args[2..] {
        if let Some((k, v)) = arg.split_once('=') {
            if let Ok(val) = v.parse::<f64>() {
                engine.get_results_mut().insert(k.to_string(), val);
            }
        }
    }

    println!("\x1b[1;35m[RUST ENGINE START]\x1b[0m Running logic...");

    match engine.run(&wrapper) {
        Ok(val) => {
            println!("\x1b[1;32m[RESULT RUST]\x1b[0m \x1b[1m{:.4}\x1b[0m", val);
            Ok(())
        }
        Err(e) => {
            Err(format!("Execution failed: {}", e))
        }
    }
}
