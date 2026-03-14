---
type: math-template
id: resonance-frequency-lc
name: LC Circuit Resonance Frequency
---

# Template: LC Circuit Resonance Frequency

## Description
Calculate f = 1 / (2 * pi * sqrt(L * C))

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `inductance` | Input for inductance | Yes |
| `capacitance` | Input for capacitance | Yes |

## Expected Output
- `Freq`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "resonance-frequency-lc",
  "name": "LC Circuit Resonance Frequency",
  "problem": "Calculate f = 1 / (2 * pi * sqrt(L * C))",
  "variables": {
    "inductance": 0.001,
    "capacitance": 0.000001
  },
  "operations": [
    {
      "id": "lc_product",
      "op": "mul",
      "args": [
        "inductance",
        "capacitance"
      ],
      "result": "LC"
    },
    {
      "id": "root_lc",
      "op": "sqrt",
      "args": [
        "LC"
      ],
      "result": "RLC"
    },
    {
      "id": "denom",
      "op": "mul",
      "args": [
        6.283185307,
        "RLC"
      ],
      "result": "D"
    },
    {
      "id": "final_freq",
      "op": "div",
      "args": [
        1,
        "D"
      ],
      "result": "Freq"
    }
  ],
  "final_result": "Freq"
}
```
