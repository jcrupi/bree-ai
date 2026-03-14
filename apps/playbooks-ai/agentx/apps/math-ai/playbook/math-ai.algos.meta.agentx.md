# Algos: Math Extraction & Logic Modeling

## Declarative Spec Reference

Math AI algos produce **engine-ready JSON** conforming to the declarative spec. The spec is defined in `math-ai.playbook.meta.agentx.md` and implemented by:

- **Engine**: `rules-engine/math-ai/engine.ts`, `rules-engine/math-ai-rust/`
- **Lib templates**: `math-ai-lib/*.template.algos.agentx.md`

All output must use the `math_ai_engine` envelope and the operation schema. When the engine or lib changes, this meta must be updated to stay in sync.

---

## Algorithm: Numeric Extraction

1. **Identify**: Find all numeric strings, including dates, weights, measurements, and currency.
2. **Contextualize**: Associate each number with its immediate label (e.g., "SBP: 120" or "$50.00").
3. **Normalize**: Convert to standard units if necessary (e.g., "5'11\"" to "180.34cm").

---

## Algorithm: Logic Modeling

1. **Extract Equation**: Identify the core math question (e.g., "What is the total cost?").
2. **Map Variables**: Assign extracted numbers to equation variables (e.g., `rate = 50`, `hours = 8`).
3. **Build Declarative JSON** conforming to the spec:

```json
{
  "math_ai_engine": {
    "id": "template-id",
    "name": "Human-readable name",
    "problem": "Description",
    "variables": {
      "rate": 50,
      "hours": 8
    },
    "operations": [
      {
        "id": "step1",
        "op": "mul",
        "args": ["rate", "hours"],
        "result": "total"
      }
    ],
    "final_result": "total"
  }
}
```

### Operation Schema (Engine Contract)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | string | No | Step identifier (for traceability) |
| `op` | string | Yes | One of: `add`, `sub`, `mul`, `div`, `pow`, `ln`, `exp`, `sqrt`, `sin`, `cos`, `gamma`, `log`, `sum`, `min`, `max` (aliases: `multiply`, `divide`, `power`, `subtract`) |
| `args` | array | Yes | See Args Types below |
| `result` | string | Yes | Variable name to store the result (must be string) |

**Args Types** (each evaluated before passing to op):

| Type | Example | Behavior |
| :--- | :--- | :--- |
| Literal | `42`, `0.5` | Used as-is |
| Variable | `"W"`, `"H2"` | Lookup from context |
| Nested op | `{ "op": "sub", "args": ["x", "M"] }` | Executed recursively |
| Array | `["Dep", "Amort"]` | Summed (e.g. `sub(A, [B,C])` → A − B − C) |

### Supported Operators (Engine)

- **Arithmetic**: `add`, `sub`, `mul`, `div`, `pow`
- **Unary**: `sqrt`, `exp`, `ln`/`log`, `sin`, `cos`, `gamma`
- **Aggregate**: `sum`, `min`, `max`

### Derived Patterns (No Native Ops)

| Pattern | How to Build | Lib Template |
| :--- | :--- | :--- |
| **average** / **mean** | `div(sum(s1, s2, ...), n)` | `windowed-streaming-stats` |
| **FFT** | Compose `add`, `sub`, `pow`, `sqrt` for DFT | `fft-4point-magnitude` |
| **standard deviation** | `sqrt(sum(pow(sub(x, mean), 2)...) / n)` | `standard-deviation-pop` |

---

## Algorithm: Validation

1. **Range Check**: Are the extracted numbers physically possible (e.g., weight > 0)?
2. **Unit Consistency**: Ensure operations are not mixing incompatible units (e.g., adding kg to cm).

---

## Lib Template Structure

Each template in `math-ai-lib/` must include:

1. **Frontmatter**: `type: math-template`, `id`, `name`
2. **Interface (Engine Inputs)**: Table of variables, descriptions, units, required flag
3. **Math AI Logic Model**: A `## Math AI Logic Model` section with a ```json block containing the `math_ai_engine` model (or the inner model; the engine accepts both wrapped and unwrapped forms)

The engine extracts the JSON via regex on `## Math AI Logic Model` + ```json. Templates are loaded with `runTemplate(template, overrides)` for variable injection.

### Current Lib Templates

| Template | ID | Description |
| :--- | :--- | :--- |
| Algebraic Notation | `algebraic-notation-solver` | Infix expression parser (uses `parseExpression` at CLI; not a standard op) |
| BMI | `bmi-standard` | Body Mass Index |
| Mean Arterial Pressure | `mean-arterial-pressure` | MAP = (SBP + 2*DBP)/3 |
| Amortized Loan | `amortized-loan-payment` | Fixed-rate monthly payment |
| Compound Interest | `compound-interest` | A = P(1+r/n)^(nt) |
| BSA Mosteller | `bsa-mosteller` | Body surface area |
| Creatinine Clearance | `creatinine-clearance-cg` | Renal clearance (Cockcroft-Gault) |
| WACC Capital Cost | `wacc-capital-cost` | Weighted average cost |
| Standard Deviation | `standard-deviation-pop` | Population std dev |
| Streaming Stats | `windowed-streaming-stats` | Rolling sum/mean/min/max/range |
| Temporal Constant Rate | `temporal-constant-rate` | Fixed-freq velocity/projection |
| Temporal Variable Rate | `temporal-trend-analytics` | Variable-freq analytics |
| FFT 4-Point Magnitude | `fft-4point-magnitude` | FFT magnitude |
| Time Dilation | `relativistic-time-dilation` | Relativistic time |
| Resonance Frequency | `resonance-frequency-lc` | LC resonance |

### Learning Cases (Instances)

| Case | Category | Notes |
| :--- | :--- | :--- |
| `learning.bmi-calc` | arithmetic | bmi-standard |
| `learning.bsa-dosage` | clinical-pharmacology | bsa-mosteller + dosage |
| `learning.company-pl-summary` | finance-analytics | P&L; uses array args `[Dep, Amort]` |
| `learning.invoice-total` | finance | Uses `steps` alias |
| `learning.simple-percent` | arithmetic | multiply |
| `learning.discount` | finance | multiply, subtract |
| `learning.astro-math` | complex-arithmetic | multiply, divide |
| `learning.quantum-partition` | theoretical-physics | gamma, cos, ln, exp, nested |
| `learning.deep-space-comm-ring` | orbital-engineering | ln, pow, deeply nested |

### Optional Metadata (Engine Ignores)

Lib and learning may include: `schema`, `table_data`, `declarative_representation`, `derivation_steps`, `dynamic_parsing`. Used for documentation/tooling only.

### Exceptions

- **algebraic-notation-solver**: Uses `parse_and_run` (not a primitive). For raw infix strings, use `parseExpression()` at CLI.
- **result**: Must be string variable name; numeric `result` is ignored by engine.

---

## Maintenance

When updating the engine, lib, or spec:

1. Sync operator list here with `engine.ts` and Rust `lib.rs`.
2. Add new lib templates to the table above.
3. Run `bun run rules-engine/math-ai/test-runner.ts` to validate learning cases.
4. Update `math-ai.playbook.meta.agentx.md` if the schema changes.
