# @bree-ai/math-ai-engine

Deterministic Math AI Engine for declarative JSON-based mathematical operations.

## Installation

```bash
# In your app's package.json
{
  "dependencies": {
    "@bree-ai/math-ai-engine": "workspace:*"
  }
}
```

## Usage

```typescript
import { MathEngine } from '@bree-ai/math-ai-engine';

// Simple expression
const engine = new MathEngine();
const model = engine.parseExpression("1 + 2 * (30 + 19) / 3");
const result = engine.run(model);
console.log(result.lastResult); // 1033.67

// With variables
const engine2 = new MathEngine({ a: 101, b: 2 });
const model2 = engine2.parseExpression("a - 15 * (19 - b)");
const result2 = engine2.run(model2);
console.log(result2.lastResult); // -154
```

## Features

- **Declarative JSON Model**: Define math operations as JSON
- **Variable Substitution**: Pass dynamic values at runtime
- **Operator Support**: +, -, *, /, ^, sqrt, exp, ln, sin, cos, gamma
- **Expression Parser**: Parse infix notation strings
- **Template System**: Reusable math templates with variable injection

## API

### `MathEngine`

```typescript
constructor(initialVars?: Record<string, number>, silent?: boolean)
```

### Methods

- `parseExpression(expr: string)` - Parse infix notation to JSON model
- `run(model: any)` - Execute declarative JSON model
- `runTemplate(template: any, overrides: Record<string, number>)` - Run reusable templates

## License

MIT
