---
type: math-analysis
category: finance
variables:
  price: 200
  discount_rate: 0.15
---

# Learning Case: Discount Calculation (Instance of Math-AI Algos)

## Documentation
A customer is purchasing a set of tools originally priced at $200.00. The store is offering a 15% clearance discount.

## Math AI Logic Model
```json
{
  "math_ai_engine": {
    "problem": "Calculate Discounted Price",
    "variables": {
      "P": 200.00,
      "D": 0.15
    },
    "operations": [
      { "id": "calc_discount", "op": "multiply", "args": ["P", "D"], "result": "discount_amt" },
      { "id": "final_price", "op": "subtract", "args": ["P", "discount_amt"], "result": "final_total" }
    ],
    "final_result": "final_total"
  }
}
```
