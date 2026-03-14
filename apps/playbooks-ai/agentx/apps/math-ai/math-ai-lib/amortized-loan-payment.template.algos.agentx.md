---
type: math-template
id: amortized-loan-payment
name: Fixed-Rate Loan Payment (Amortization)
---

# Template: Fixed-Rate Loan Payment (Amortization)

## Description
Calculate Monthly Payment P = [r*PV] / [1 - (1+r)^-n]

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `principal` | Input for principal | Yes |
| `monthly_rate` | Input for monthly_rate | Yes |
| `months` | Input for months | Yes |

## Expected Output
- `Payment`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "amortized-loan-payment",
  "name": "Fixed-Rate Loan Payment (Amortization)",
  "problem": "Calculate Monthly Payment P = [r*PV] / [1 - (1+r)^-n]",
  "variables": {
    "principal": 250000,
    "monthly_rate": 0.005,
    "months": 360
  },
  "operations": [
    {
      "id": "num",
      "op": "mul",
      "args": [
        "principal",
        "monthly_rate"
      ],
      "result": "N"
    },
    {
      "id": "base",
      "op": "add",
      "args": [
        1,
        "monthly_rate"
      ],
      "result": "B"
    },
    {
      "id": "exp",
      "op": "mul",
      "args": [
        "months",
        -1
      ],
      "result": "E"
    },
    {
      "id": "denom_pow",
      "op": "pow",
      "args": [
        "B",
        "E"
      ],
      "result": "DP"
    },
    {
      "id": "denom",
      "op": "sub",
      "args": [
        1,
        "DP"
      ],
      "result": "D"
    },
    {
      "id": "final_payment",
      "op": "div",
      "args": [
        "N",
        "D"
      ],
      "result": "Payment"
    }
  ],
  "final_result": "Payment"
}
```
