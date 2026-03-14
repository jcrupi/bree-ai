# Playbook: Math AI

## Purpose
To extract, structure, and analyze mathematical problems and numeric data from clinical, financial, or technical documentation.

## Declarative Spec (Source of Truth)

Math AI uses a **declarative JSON model** that the engine parses and executes deterministically. This spec is the canonical reference and must stay in sync with:

- **Lib**: `agentx/apps/math-ai/math-ai-lib/*.template.algos.agentx.md` — reusable formula templates
- **Engine**: `rules-engine/math-ai/engine.ts` (TypeScript) and `rules-engine/math-ai-rust/` (Rust)

### Model Envelope

All executable models are wrapped in a root envelope:

```json
{
  "math_ai_engine": {
    "id": "template-id",
    "name": "Human-readable name",
    "problem": "Description of the computation",
    "variables": { "var1": 0, "var2": 0 },
    "operations": [ ... ],
    "final_result": "result_var"
  }
}
```

### Schema

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | No | Template identifier |
| `name` | string | No | Human-readable name |
| `problem` | string | No | Description of the computation |
| `variables` | object | No | Map of input variable names → numeric values (can be overridden at runtime) |
| `operations` | array | Yes | Ordered list of steps (alias: `steps`) |
| `final_result` | string | Yes | Variable name holding the final output |

**Optional metadata** (engine ignores; used for documentation/tooling): `schema`, `table_data`, `declarative_representation`, `derivation_steps`, `dynamic_parsing`

### Operation Structure

Each operation in `operations` (alias: `steps`):

```json
{
  "id": "step_id",
  "op": "add|sub|mul|div|pow|ln|exp|sqrt|sin|cos|gamma|log|sum|min|max",
  "args": ["var1", "var2"] | [number, "var"] | [{ "op": "...", "args": [...] }] | ["var1", ["var2", "var3"]],
  "result": "output_var"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | No | Step identifier (traceability) |
| `op` | string | Yes | Operator (see table below) |
| `args` | array | Yes | See Args Types below |
| `result` | string | Yes | Variable name to store result (must be string; engine ignores numeric `result`) |

**Args Types** (engine evaluates each, then passes to op):

| Type | Example | Behavior |
| :--- | :--- | :--- |
| Literal | `42`, `0.5`, `-1` | Used as-is |
| Variable | `"W"`, `"H2"` | Lookup from context |
| Nested op | `{ "op": "sub", "args": ["x", "M"] }` | Executed recursively |
| Array | `["Dep", "Amort"]` | Summed before passing to op (e.g. `sub(EBITDA, [Dep,Amort])` = EBITDA − Dep − Amort) |

### Supported Operators

| Op | Aliases | Args | Description |
| :--- | :--- | :--- | :--- |
| `add` | `sum` | 2+ | Addition (sum for many) |
| `sub` | `subtract` | 2+ | Subtraction (first − rest when 3+ args) |
| `mul` | `multiply` | 2+ | Multiplication |
| `div` | `divide` | 2 | Division |
| `pow` | `power` | 2 | Exponentiation |
| `sqrt` | — | 1 | Square root |
| `exp` | — | 1 | e^x |
| `ln` | `log` | 1 | Natural logarithm |
| `sin` | — | 1 | Sine (radians) |
| `cos` | — | 1 | Cosine (radians) |
| `gamma` | — | 1 | Gamma function |
| `min` | — | 2+ | Minimum |
| `max` | — | 2+ | Maximum |

Constants: `PI`, `E` are preloaded in the engine context.

### Derived Patterns (Not Primitives)

These are composed from primitives; there are no dedicated engine ops:

| Pattern | Composition | Example |
| :--- | :--- | :--- |
| **average** / **mean** | `div(sum(args...), n)` | `streaming-stats` template |
| **FFT** | Template composing `add`, `sub`, `pow`, `sqrt` | `fft-4point-magnitude` template |
| **std dev** | `sqrt(div(sum(pow(sub(x, mean), 2)...), n))` | `standard-deviation-pop` template |

### Exceptions (Not Engine-Ready)

| Element | Location | Note |
| :--- | :--- | :--- |
| `parse_and_run` | `algebraic-notation-solver` | Not a primitive; use `parseExpression()` at CLI for raw infix strings |
| `dynamic_parsing` | algebraic-notation | Metadata only; engine ignores |

### Learning Cases (Instances)

| Case | Category | Lib Template |
| :--- | :--- | :--- |
| `learning.bmi-calc` | arithmetic | bmi-standard |
| `learning.bsa-dosage` | clinical-pharmacology | bsa-mosteller |
| `learning.company-pl-summary` | finance-analytics | — (P&L custom) |
| `learning.invoice-total` | finance | — (simple) |
| `learning.simple-percent` | arithmetic | — |
| `learning.discount` | finance | — |
| `learning.astro-math` | complex-arithmetic | — |
| `learning.quantum-partition` | theoretical-physics | — (gamma, cos, ln, exp) |
| `learning.deep-space-comm-ring` | orbital-engineering | — (nested ops, ln, pow) |

---

## Intermediate AgentX Representation

The results of the analysis should be formatted as a structured `Math-AI AgentX` document:

1. **Frontmatter (YAML)**:
   - `type`: `math-analysis`
   - `complexity`: `simple|intermediate|complex`
   - `category`: `arithmetic|algebra|statistics|calculus`
   - `variables`: A map of extracted numeric variables and their units.

2. **Markdown Content**:
   - A clear description of the problem or data extracted.
   - List of identified numbers and their context (e.g., "Patient Weight: 85kg").

3. **Declarative JSON Model**:
   - A `math_ai_engine` block containing `variables`, `operations`, and `final_result` as defined above.
   - Must conform to the engine schema for deterministic execution.

## Directives

- **Precision**: Ensure all numbers are extracted with their units.
- **Traceability**: Link every variable to its source in the text.
- **Verification**: Always cross-check the math logic against the extracted variables.
- **Spec Compliance**: Output must conform to the declarative spec; use lib templates as reference.

## Maintenance

When adding or changing operators, templates, or engine behavior:

1. Update this playbook meta with the new spec.
2. Update `math-ai.algos.meta.agentx.md` with matching algorithm details.
3. Ensure lib templates in `math-ai-lib/` follow the spec.
4. Run `bun run rules-engine/math-ai/test-runner.ts` to validate learning cases.
