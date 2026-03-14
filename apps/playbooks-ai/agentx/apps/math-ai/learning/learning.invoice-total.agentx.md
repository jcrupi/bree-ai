---
type: math-analysis
category: finance
variables:
  items:
    - name: "Widget A"
      price: 15.50
      qty: 10
    - name: "Service Fee"
      price: 25.00
      qty: 1
---

# Learning Case: Invoice Total Calculation

## Documentation
The order includes 10 units of Widget A at $15.50 each and a flat service fee of $25.00.

## Math AI Logic Model
```json
{
  "math_ai_engine": {
    "problem": "Calculate Invoice Total",
    "steps": [
      { "id": "subtotal_widgets", "op": "multiply", "args": [15.50, 10], "result": 155.00 },
      { "id": "grand_total", "op": "add", "args": [155.00, 25.00], "result": 180.00 }
    ],
    "schema": {
      "grand_total": { "unit": "USD", "precision": 2 }
    }
  }
}
```
