---
type: math-template
id: compound-interest
name: Compound Interest
---

# Template: Compound Interest

## Description
Calculate A = P(1 + r/n)^(nt)

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |

## Expected Output
- `A`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "compound-interest",
  "name": "Compound Interest",
  "problem": "Calculate A = P(1 + r/n)^(nt)",
  "operations": [
    {
      "id": "rate_per_period",
      "op": "div",
      "args": [
        "r",
        "n"
      ],
      "result": "rn"
    },
    {
      "id": "base",
      "op": "add",
      "args": [
        1,
        "rn"
      ],
      "result": "B"
    },
    {
      "id": "exponent",
      "op": "mul",
      "args": [
        "n",
        "t"
      ],
      "result": "NT"
    },
    {
      "id": "multiplier",
      "op": "pow",
      "args": [
        "B",
        "NT"
      ],
      "result": "M"
    },
    {
      "id": "final_amount",
      "op": "mul",
      "args": [
        "P",
        "M"
      ],
      "result": "A"
    }
  ],
  "final_result": "A"
}
```
