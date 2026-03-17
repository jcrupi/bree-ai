use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum MathArg {
    Value(f64),
    Variable(String),
    Instruction(Box<MathInstruction>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MathInstruction {
    pub id: Option<String>,
    pub op: String,
    pub args: Vec<MathArg>,
    pub result: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MathModel {
    pub id: Option<String>,
    pub name: Option<String>,
    pub problem: Option<String>,
    pub variables: Option<HashMap<String, f64>>,
    pub operations: Vec<MathInstruction>,
    pub final_result: String,
    
    #[serde(flatten)]
    pub extra: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentXWrapper {
    pub math_ai_engine: MathModel,
}

pub struct MathEngine {
    results: HashMap<String, f64>,
    silent: bool,
}

impl MathEngine {
    pub fn new(silent: bool) -> Self {
        let mut results = HashMap::new();
        results.insert("PI".to_string(), std::f64::consts::PI);
        results.insert("E".to_string(), std::f64::consts::E);
        Self { results, silent }
    }

    pub fn run(&mut self, wrapper: &AgentXWrapper) -> Result<f64, String> {
        let model = &wrapper.math_ai_engine;
        
        // Initialize variables
        if let Some(vars) = &model.variables {
            for (k, v) in vars {
                self.results.insert(k.clone(), *v);
            }
        }

        let mut last_val = 0.0;
        for inst in &model.operations {
            last_val = self.execute_operation(inst)?;
        }

        Ok(last_val)
    }

    fn evaluate_arg(&mut self, arg: &MathArg) -> Result<f64, String> {
        match arg {
            MathArg::Value(v) => Ok(*v),
            MathArg::Variable(v) => {
                self.results.get(v).cloned().ok_or_else(|| format!("Variable '{}' not found", v))
            }
            MathArg::Instruction(inst) => self.execute_operation(inst),
        }
    }

    fn execute_operation(&mut self, inst: &MathInstruction) -> Result<f64, String> {
        let n_args = inst.args.len();
        let mut evaluated_args = Vec::with_capacity(n_args);
        for arg in &inst.args {
            evaluated_args.push(self.evaluate_arg(arg)?);
        }

        // Use direct string matching to avoid to_lowercase() which allocates
        let op = inst.op.as_str();
        
        if !self.silent {
            println!("    \x1b[90m[ALGO EXEC RUST]\x1b[0m Op: \"{}\" | ID: {:?} | Args: {:?}", op.to_uppercase(), inst.id, evaluated_args);
        }

        let val = match op {
            "add" | "sum" | "ADD" | "SUM" => evaluated_args.iter().sum(),
            "sub" | "subtract" | "SUB" | "SUBTRACT" => {
                if evaluated_args.is_empty() { 0.0 }
                else { evaluated_args[1..].iter().fold(evaluated_args[0], |a, b| a - b) }
            }
            "mul" | "multiply" | "MUL" | "MULTIPLY" => evaluated_args.iter().product(),
            "div" | "divide" | "DIV" | "DIVIDE" => {
                if evaluated_args.len() < 2 { return Err("Division requires 2 args".to_string()); }
                evaluated_args[0] / evaluated_args[1]
            }
            "pow" | "power" | "POW" | "POWER" => {
                if evaluated_args.len() < 2 { return Err("Power requires 2 args".to_string()); }
                evaluated_args[0].powf(evaluated_args[1])
            }
            "sqrt" | "SQRT" => {
                if evaluated_args.is_empty() { return Err("Sqrt requires 1 arg".to_string()); }
                evaluated_args[0].sqrt()
            }
            "exp" | "EXP" => {
                if evaluated_args.is_empty() { return Err("Exp requires 1 arg".to_string()); }
                evaluated_args[0].exp()
            }
            "ln" | "log" | "LN" | "LOG" => {
                if evaluated_args.is_empty() { return Err("Ln requires 1 arg".to_string()); }
                evaluated_args[0].ln()
            }
            "sin" | "SIN" => {
                if evaluated_args.is_empty() { return Err("Sin requires 1 arg".to_string()); }
                evaluated_args[0].sin()
            }
            "cos" | "COS" => {
                if evaluated_args.is_empty() { return Err("Cos requires 1 arg".to_string()); }
                evaluated_args[0].cos()
            }
            "min" | "MIN" => evaluated_args.iter().fold(f64::INFINITY, |a, &b| a.min(b)),
            "max" | "MAX" => evaluated_args.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)),
            "gamma" | "GAMMA" => {
                if evaluated_args.is_empty() { return Err("Gamma requires 1 arg".to_string()); }
                self.gamma_func(evaluated_args[0])
            }
            _ => return Err(format!("Unknown operator: {}", op)),
        };

        if let Some(res_key) = &inst.result {
            self.results.insert(res_key.clone(), val);
        }

        Ok(val)
    }

    pub fn gamma_func(&self, mut z: f64) -> f64 {
        let g = 7.0;
        let p = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
        ];
        if z < 0.5 {
            std::f64::consts::PI / ((std::f64::consts::PI * z).sin() * self.gamma_func(1.0 - z))
        } else {
            z -= 1.0;
            let mut x = p[0];
            for i in 1..9 {
                x += p[i] / (z + i as f64);
            }
            let t = z + g + 0.5;
            (2.0 * std::f64::consts::PI).sqrt() * t.powf(z + 0.5) * (-t).exp() * x
        }
    }
    
    pub fn parse_expression(&self, expr: &str) -> Result<AgentXWrapper, String> {
        let re = regex::Regex::new(r"(?x)
            \d+(\.\d+)? |
            [a-zA-Z_]\w* |
            [+\-*/^()]
        ").unwrap();
        
        let tokens: Vec<String> = re.find_iter(expr).map(|m| m.as_str().to_string()).collect();
        let mut pos = 0;

        fn parse_primary(tokens: &[String], pos: &mut usize) -> Result<MathArg, String> {
            if *pos >= tokens.len() { return Err("Unexpected end of expression".into()); }
            let token = &tokens[*pos];
            *pos += 1;

            if token == "(" {
                let node = parse_add(tokens, pos)?;
                if *pos >= tokens.len() || tokens[*pos] != ")" {
                    return Err("Expected ')'".into());
                }
                *pos += 1; // skip ')'
                return Ok(node);
            }

            if ["sqrt", "exp", "ln", "cos", "sin"].contains(&token.as_str()) {
                if *pos >= tokens.len() || tokens[*pos] != "(" {
                    return Err(format!("Expected '(' after function {}", token));
                }
                *pos += 1; // skip '('
                let inner = parse_add(tokens, pos)?;
                if *pos >= tokens.len() || tokens[*pos] != ")" {
                    return Err("Expected ')'".into());
                }
                *pos += 1; // skip ')'
                return Ok(MathArg::Instruction(Box::new(MathInstruction {
                    id: None,
                    op: token.clone(),
                    args: vec![inner],
                    result: Some("temp".into()),
                })));
            }

            if let Ok(val) = token.parse::<f64>() {
                return Ok(MathArg::Value(val));
            }

            Ok(MathArg::Variable(token.clone()))
        }

        fn parse_pow(tokens: &[String], pos: &mut usize) -> Result<MathArg, String> {
            let mut node = parse_primary(tokens, pos)?;
            while *pos < tokens.len() && tokens[*pos] == "^" {
                *pos += 1;
                let right = parse_pow(tokens, pos)?;
                node = MathArg::Instruction(Box::new(MathInstruction {
                    id: None,
                    op: "pow".into(),
                    args: vec![node, right],
                    result: Some("temp".into()),
                }));
            }
            Ok(node)
        }

        fn parse_mul(tokens: &[String], pos: &mut usize) -> Result<MathArg, String> {
            let mut node = parse_pow(tokens, pos)?;
            while *pos < tokens.len() {
                let next = &tokens[*pos];
                if next == "*" || next == "/" {
                    *pos += 1;
                    let op = if next == "*" { "mul" } else { "div" };
                    let right = parse_pow(tokens, pos)?;
                    node = MathArg::Instruction(Box::new(MathInstruction {
                        id: None,
                        op: op.into(),
                        args: vec![node, right],
                        result: Some("temp".into()),
                    }));
                } else if next == "(" || (!["+", "-", "*", "/", "^", ")"].contains(&next.as_str())) {
                    // Implicit multiplication
                    let right = parse_pow(tokens, pos)?;
                    node = MathArg::Instruction(Box::new(MathInstruction {
                        id: None,
                        op: "mul".into(),
                        args: vec![node, right],
                        result: Some("temp".into()),
                    }));
                } else {
                    break;
                }
            }
            Ok(node)
        }

        fn parse_add(tokens: &[String], pos: &mut usize) -> Result<MathArg, String> {
            let mut node = parse_mul(tokens, pos)?;
            while *pos < tokens.len() && (tokens[*pos] == "+" || tokens[*pos] == "-") {
                let op = if tokens[*pos] == "+" { "add" } else { "sub" };
                *pos += 1;
                let right = parse_mul(tokens, pos)?;
                node = MathArg::Instruction(Box::new(MathInstruction {
                    id: None,
                    op: op.into(),
                    args: vec![node, right],
                    result: Some("temp".into()),
                }));
            }
            Ok(node)
        }

        let arg = parse_add(&tokens, &mut pos)?;
        if pos < tokens.len() {
            return Err(format!("Unexpected token '{}' at position {}", tokens[pos], pos));
        }

        let instruction = match arg {
            MathArg::Instruction(i) => *i,
            _ => MathInstruction {
                id: None,
                op: "add".into(), // Fallback for single numbers/vars
                args: vec![arg, MathArg::Value(0.0)],
                result: Some("final_result".into()),
            }
        };

        Ok(AgentXWrapper {
            math_ai_engine: MathModel {
                id: None,
                name: Some("Parsed Expression".into()),
                problem: Some(expr.into()),
                variables: None,
                operations: vec![instruction],
                final_result: "final_result".into(),
                extra: HashMap::new(),
            }
        })
    }

    pub fn get_results(&self) -> &HashMap<String, f64> {
        &self.results
    }

    pub fn get_results_mut(&mut self) -> &mut HashMap<String, f64> {
        &mut self.results
    }

    pub fn clear_variables(&mut self) {
        self.results.retain(|k, _| k == "PI" || k == "E");
    }
}
