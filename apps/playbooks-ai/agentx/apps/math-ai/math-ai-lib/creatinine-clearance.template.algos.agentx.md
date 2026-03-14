---
type: math-template
id: creatinine-clearance-cg
name: Cockcroft-Gault Creatinine Clearance
---

# Template: Cockcroft-Gault Creatinine Clearance

## Description
Estimate ClCr = ((140-age) * weight) / (72 * creatinine) [* 0.85 if female]

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `age` | Input for age | Yes |
| `weight` | Input for weight | Yes |
| `scr` | Input for scr | Yes |
| `sex_factor` | Input for sex_factor | Yes |

## Expected Output
- `ClCr`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "creatinine-clearance-cg",
  "name": "Cockcroft-Gault Creatinine Clearance",
  "problem": "Estimate ClCr = ((140-age) * weight) / (72 * creatinine) [* 0.85 if female]",
  "variables": {
    "age": 0,
    "weight": 0,
    "scr": 0,
    "sex_factor": 1
  },
  "operations": [
    {
      "id": "age_adj",
      "op": "sub",
      "args": [
        140,
        "age"
      ],
      "result": "A"
    },
    {
      "id": "numerator",
      "op": "mul",
      "args": [
        "A",
        "weight"
      ],
      "result": "N"
    },
    {
      "id": "denominator",
      "op": "mul",
      "args": [
        72,
        "scr"
      ],
      "result": "D"
    },
    {
      "id": "base_clcr",
      "op": "div",
      "args": [
        "N",
        "D"
      ],
      "result": "Base"
    },
    {
      "id": "final_clcr",
      "op": "mul",
      "args": [
        "Base",
        "sex_factor"
      ],
      "result": "ClCr"
    }
  ],
  "final_result": "ClCr"
}
```
