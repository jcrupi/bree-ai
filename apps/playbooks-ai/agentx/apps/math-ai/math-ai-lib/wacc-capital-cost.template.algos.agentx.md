---
type: math-template
id: wacc-capital-cost
name: Weighted Average Cost of Capital (WACC)
---

# Template: Weighted Average Cost of Capital (WACC)

## Description
Calculate WACC = (E/V * Re) + (D/V * Rd * (1 - Tc))

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `equity` | Input for equity | Yes |
| `debt` | Input for debt | Yes |
| `cost_equity` | Input for cost_equity | Yes |
| `cost_debt` | Input for cost_debt | Yes |
| `tax_rate` | Input for tax_rate | Yes |

## Expected Output
- `WACC`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "wacc-capital-cost",
  "name": "Weighted Average Cost of Capital (WACC)",
  "problem": "Calculate WACC = (E/V * Re) + (D/V * Rd * (1 - Tc))",
  "variables": {
    "equity": 500000,
    "debt": 250000,
    "cost_equity": 0.12,
    "cost_debt": 0.06,
    "tax_rate": 0.21
  },
  "operations": [
    {
      "id": "total_value",
      "op": "add",
      "args": [
        "equity",
        "debt"
      ],
      "result": "V"
    },
    {
      "id": "eq_weight",
      "op": "div",
      "args": [
        "equity",
        "V"
      ],
      "result": "We"
    },
    {
      "id": "debt_weight",
      "op": "div",
      "args": [
        "debt",
        "V"
      ],
      "result": "Wd"
    },
    {
      "id": "eq_comp",
      "op": "mul",
      "args": [
        "We",
        "cost_equity"
      ],
      "result": "Ec"
    },
    {
      "id": "tax_shield",
      "op": "sub",
      "args": [
        1,
        "tax_rate"
      ],
      "result": "TS"
    },
    {
      "id": "debt_adj",
      "op": "mul",
      "args": [
        "cost_debt",
        "TS"
      ],
      "result": "Rd_adj"
    },
    {
      "id": "debt_comp",
      "op": "mul",
      "args": [
        "Wd",
        "Rd_adj"
      ],
      "result": "Dc"
    },
    {
      "id": "final_wacc",
      "op": "add",
      "args": [
        "Ec",
        "Dc"
      ],
      "result": "WACC"
    }
  ],
  "final_result": "WACC"
}
```
