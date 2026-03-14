---
type: math-template
id: algebraic-notation-solver
name: Algebraic Notation Solver
---

# Template: Algebraic Notation Solver

## Description
Evaluates raw mathematical notation strings (infix) with optional variable substitution. This template allows you to pass formulas like:
- Simple expressions: `"1 + 2 * (30 + 19) / 3 + 1000"`
- With variables: `"a - 15 * (19 - b)"` where `a=101, b=2`
- Complex variable names: `"a19 + b2 * (x_val - y_val)"`

All expressions are resolved using deterministic AgentX logic with full operator precedence (PEMDAS).

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `notation` | The raw algebraic string to solve | Yes |
| `variables` | Key-value pairs for variable substitution | No |

## Example Data

### Example 1: Simple Expression (No Variables)
**Input:**
```json
{
  "notation": "1 + 2 * (30 + 19) / 3 + 1000"
}
```
**Expected Output:**
- `final_result`: 1033.66...

### Example 2: Expression with Variables
**Input:**
```json
{
  "notation": "a - 15 * (19 - b)",
  "variables": {
    "a": 101,
    "b": 2
  }
}
```
**Calculation:**
```
19 - 2 = 17
15 * 17 = 255
101 - 255 = -154
```
**Expected Output:**
- `final_result`: -154

### Example 3: Complex Variable Names
**Input:**
```json
{
  "notation": "a19 + b2 * sqrt(x_val)",
  "variables": {
    "a19": 100,
    "b2": 5,
    "x_val": 16
  }
}
```
**Expected Output:**
- `final_result`: 120 (100 + 5 * 4)

## Math AI Logic Model
```json
{
  "id": "algebraic-notation-solver",
  "name": "Notation Solver",
  "dynamic_parsing": true,
  "variables": {},
  "operations": [
    {
      "id": "resolve_notation",
      "op": "parse_and_run",
      "args": ["notation"],
      "result": "final_result"
    }
  ],
  "final_result": "final_result"
}
```

## Usage Examples

### TypeScript/JavaScript - Simple Expression
```typescript
import { MathEngine } from './rules-engine/math-ai/engine';

const engine = new MathEngine();
const model = engine.parseExpression("1 + 2 * (30 + 19) / 3 + 1000");
const result = engine.run(model);

console.log(result.lastResult); // 1033.666...
```

### TypeScript/JavaScript - With Variables
```typescript
import { MathEngine } from './rules-engine/math-ai/engine';

const formula = "a - 15 * (19 - b)";
const variables = { a: 101, b: 2 };

const engine = new MathEngine(variables);
const model = engine.parseExpression(formula);
const result = engine.run(model);

console.log(result.lastResult); // -154
console.log(result.allResults); // { a: 101, b: 2, PI: 3.14..., E: 2.71..., temp: 255, final_result: -154 }
```

### CLI - Simple Expression
```bash
bun run rules-engine/math-ai/math-cli.ts "100 - 10 + 490 - 8 * (19/5)"
# Output: 549.60
```

### CLI - With Variables (Programmatic)
```typescript
import { MathEngine } from './rules-engine/math-ai/engine';

const vars = { a19: 101, b: 2 };
const engine = new MathEngine(vars);
const model = engine.parseExpression("a19 - 15 * (19 - b)");
const result = engine.run(model);

console.log(result.lastResult); // -154
```

## Supported Features

### Operators
- Arithmetic: `+`, `-`, `*`, `/`, `^` (power)
- Functions: `sqrt()`, `exp()`, `ln()`, `sin()`, `cos()`
- Operator Precedence: PEMDAS/BODMAS

### Variables
- **Naming**: Alphanumeric + underscore (e.g., `a`, `x1`, `my_var`, `a19`)
- **Case Sensitive**: `a` ≠ `A`
- **Substitution**: Variables are replaced before execution
- **Constants**: `PI` and `E` are always available

### Limitations
- Variables must be defined before parsing
- No symbolic algebra (all variables must have numeric values)
- Functions require parentheses: `sqrt(16)` not `sqrt 16`
