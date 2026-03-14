
/**
 * Math AI Engine — Deterministic Execution Layer for AgentX
 * Parses and executes declarative JSON logic models extracted by the AI.
 */

export type MathOp = 'add' | 'sub' | 'mul' | 'div' | 'pow' | 'ln' | 'exp' | 'sqrt' | 'sin' | 'cos' | 'gamma' | 'log' | 'sum' | 'min' | 'max';

export interface MathInstruction {
  id: string;
  op: MathOp;
  args: (string | number | MathInstruction | any)[];
  result: string | number;
}

export interface MathContext {
  variables: Record<string, number>;
  constants: Record<string, number>;
  steps: MathInstruction[];
  results: Record<string, number>;
}

export class MathEngine {
  private context: MathContext;
  private silent: boolean;

  constructor(initialVars: Record<string, number> = {}, silent: boolean = false) {
    this.silent = silent;
    this.context = {
      variables: { ...initialVars },
      constants: {
        'PI': Math.PI,
        'E': Math.E
      },
      steps: [],
      results: { 
        ...initialVars,
        'PI': Math.PI,
        'E': Math.E
      }
    };
  }

  /**
   * Evaluates a single argument (constant, variable lookup, or nested operation)
   */
  private evaluateArg(arg: any): number {
    if (typeof arg === 'number') return arg;
    if (typeof arg === 'string') {
      if (this.context.results.hasOwnProperty(arg)) {
        return this.context.results[arg];
      }
      throw new Error(`Variable "${arg}" not found in context`);
    }
    if (arg && typeof arg === 'object' && arg.op) {
      return this.executeOperation(arg as MathInstruction);
    }
    throw new Error(`Invalid argument type: ${typeof arg}`);
  }

  /**
   * Executes a specific math operation
   */
  private executeOperation(inst: MathInstruction): number {
    const evaluatedArgs = inst.args.map(a => {
        // Handle array of arguments (e.g. sum of multiple fields)
        if (Array.isArray(a)) return a.reduce((sum, current) => sum + this.evaluateArg(current), 0);
        return this.evaluateArg(a);
    });

    const op = inst.op.toLowerCase();
    
    // Show the actual numbers being computed (evaluatedArgs) rather than the raw objects
    if (!this.silent) {
      console.log(`    \x1b[90m[ALGO EXEC]\x1b[0m Op: "${op.toUpperCase()}" | ID: ${inst.id || 'auto'} | Args: [${evaluatedArgs.join(', ')}]`);
    }

    let val: number;
    switch (op) {
      case 'pow':
      case 'power':
        val = Math.pow(evaluatedArgs[0], evaluatedArgs[1]);
        break;
      case 'add':
      case 'sum':
        val = evaluatedArgs.reduce((a, b) => a + b, 0);
        break;
      case 'min':
        val = Math.min(...evaluatedArgs);
        break;
      case 'max':
        val = Math.max(...evaluatedArgs);
        break;
      case 'sub':
      case 'subtract':
        val = evaluatedArgs.reduce((a, b) => a - b);
        break;
      case 'mul':
      case 'multiply':
        val = evaluatedArgs.reduce((a, b) => a * b, 1);
        break;
      case 'div':
      case 'divide':
        val = evaluatedArgs[0] / evaluatedArgs[1];
        break;
      case 'exp':
        val = Math.exp(evaluatedArgs[0]);
        break;
      case 'sqrt':
        val = Math.sqrt(evaluatedArgs[0]);
        break;
      case 'sin':
        val = Math.sin(evaluatedArgs[0]);
        break;
      case 'cos':
        val = Math.cos(evaluatedArgs[0]);
        break;
      case 'gamma':
        // Simple approximation for Gamma(x) using Lanczos or similar is complex, 
        // for now we'll use a basic placeholder or assume small integers
        val = this.gammaFunc(evaluatedArgs[0]);
        break;
      case 'ln':
      case 'log':
        val = Math.log(evaluatedArgs[0]);
        break;
      default:
        throw new Error(`Unknown operator: ${inst.op}`);
    }

    if (typeof inst.result === 'string') {
      this.context.results[inst.result] = val;
    }
    return val;
  }

  /**
   * Runs the full declarative model
   */
  public run(model: any): any {
    const engineData = model.math_ai_engine;
    if (!engineData) throw new Error("Invalid model: missing math_ai_engine root");

    // Initialize state
    const vars = engineData.variables || {};
    for (const [k, v] of Object.entries(vars)) {
      if (typeof v === 'number') {
        this.context.results[k] = v;
      }
    }

    const steps = engineData.operations || engineData.steps || [];
    let lastResult = 0;

    for (const step of steps) {
      lastResult = this.executeOperation(step);
    }

    return {
      success: true,
      lastResult,
      allResults: { ...this.context.results },
      finalResultId: engineData.final_result
    };
  }

  /**
   * Parses an algebraic string (infix notation) and converts it to an AgentX JSON model.
   * This allows "one-liner" expressions like "1 + 2 * (30 + 19) / 3 + 1000"
   */
  public parseExpression(expr: string): any {
    const tokens = expr.match(/\d+(\.\d+)?|[a-zA-Z_]\w*|[+\-*/^()]|sqrt|exp|ln|cos|sin/g) || [];
    let pos = 0;

    const parsePrimary = (): any => {
      let token = tokens[pos++];
      if (token === '(') {
        let node = parseAdd();
        pos++; // skip ')'
        return node;
      }
      if (['sqrt', 'exp', 'ln', 'cos', 'sin'].includes(token)) {
        pos++; // skip '('
        let node = { op: token, args: [parseAdd()], result: 'temp' };
        pos++; // skip ')'
        return node;
      }
      if (!isNaN(parseFloat(token))) return parseFloat(token);
      return token; // Variable
    };

    const parsePow = (): any => {
      let node = parsePrimary();
      while (tokens[pos] === '^') {
        pos++;
        node = { op: 'pow', args: [node, parsePow()], result: 'temp' };
      }
      return node;
    };

    const parseMul = (): any => {
      let node = parsePow();
      while (true) {
        const next = tokens[pos];
        if (next === '*' || next === '/') {
          pos++;
          let op = next === '*' ? 'mul' : 'div';
          node = { op, args: [node, parsePow()], result: 'temp' };
        } else if (next === '(' || (next && !['+', '-', '*', '/', '^', ')'].includes(next))) {
          // Implicit multiplication: e.g. 2(x) or 2x
          node = { op: 'mul', args: [node, parsePow()], result: 'temp' };
        } else {
          break;
        }
      }
      return node;
    };

    const parseAdd = (): any => {
      let node = parseMul();
      while (tokens[pos] === '+' || tokens[pos] === '-') {
        let op = tokens[pos++] === '+' ? 'add' : 'sub';
        node = { op, args: [node, parseMul()], result: 'temp' };
      }
      return node;
    };

    const logicModel = parseAdd();
    if (pos < tokens.length) {
      throw new Error(`Unexpected token at position ${pos}: ${tokens[pos]} in expression "${expr}"`);
    }

    return {
      math_ai_engine: {
        problem: `Expression: ${expr}`,
        operations: [ { ...logicModel, result: 'final_result' } ],
        final_result: 'final_result'
      }
    };
  }

  /**
   * Runs a reusable template (JSON or AgentX Markdown), overriding variables on the fly
   */
  public runTemplate(template: any, overrides: Record<string, number>): any {
    let model: any;

    if (typeof template === 'string') {
      // It's likely an AgentX markdown string
      model = this.extractModelFromAgentX(template);
    } else {
      // It's a raw JSON object
      model = JSON.parse(JSON.stringify(template));
    }
    
    // Inject overrides into the model variables
    if (!model.math_ai_engine) {
      // If it's a raw engine model, wrap it
      const temp = model;
      model.math_ai_engine = temp;
    }
    
    model.math_ai_engine.variables = { 
      ...(model.math_ai_engine.variables || {}), 
      ...overrides 
    };

    return this.run(model);
  }

  /**
   * Extracts the declarative JSON model from an AgentX markdown string
   */
  private extractModelFromAgentX(content: string): any {
    const sectionMatch = content.match(/## Math AI Logic Model[\s\S]*?```json\n([\s\S]*?)\n```/);
    let jsonContent = '';

    if (sectionMatch) {
        jsonContent = sectionMatch[1];
    } else {
        // Fallback for files without the section header
        const fallbackMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (!fallbackMatch) throw new Error("No JSON logic model found in AgentX template");
        jsonContent = fallbackMatch[1];
    }
    
    try {
      return JSON.parse(jsonContent);
    } catch (e) {
      throw new Error(`Failed to parse JSON from AgentX template: ${(e as Error).message}`);
    }
  }

  /**
   * Basic Gamma function approximation (Lanczos)
   */
  private gammaFunc(z: number): number {
    const g = 7;
    const p = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * this.gammaFunc(1 - z));
    z -= 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
}
