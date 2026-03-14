---
type: math-analysis
category: arithmetic
variables:
  weight: 85
  height: 1.8
  units:
    weight: kg
    height: m
---

# Learning Case: Patient BMI Calculation (Instance of Math-AI Algos)

## Documentation
Patient is a 45-year-old male. Recorded weight is 85kg. Height is 1.8 meters.

## Math AI Logic Model
```json
{
  "math_ai_engine": {
    "problem": "Calculate BMI",
    "variables": {
      "W": 85,
      "H": 1.8
    },
    "operations": [
      { "id": "square_height", "op": "power", "args": ["H", 2], "result": "H2" },
      { "id": "calc_bmi", "op": "divide", "args": ["W", "H2"], "result": "BMI" }
    ],
    "final_result": "BMI"
  }
}
```
