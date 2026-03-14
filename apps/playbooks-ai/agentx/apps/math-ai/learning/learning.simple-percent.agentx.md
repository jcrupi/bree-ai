---
type: math-analysis
category: arithmetic
complexity: simple
variables:
  base: 190
  percentage: 0.10
---

# Learning Case: Simple Percentage (Instance of Math-AI Algos)

## Documentation
What is 10% of 190.

## Math AI Logic Model
```json
{
  "math_ai_engine": {
    "problem": "Simple Percentage Calculation",
    "variables": {
      "V": 190,
      "P": 0.10
    },
    "operations": [
      { "id": "calc_percentage", "op": "multiply", "args": ["V", "P"], "result": "result" }
    ],
    "final_result": "result"
  }
}
```
