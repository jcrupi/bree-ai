---
type: math-template
id: standard-deviation-pop
name: Population Standard Deviation (5-Point)
---

# Template: Population Standard Deviation (5-Point)

## Description
Calculate Sigma = sqrt( sum( (xi - mean)^2 ) / N )

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `x1` | Input for x1 | Yes |
| `x2` | Input for x2 | Yes |
| `x3` | Input for x3 | Yes |
| `x4` | Input for x4 | Yes |
| `x5` | Input for x5 | Yes |

## Expected Output
- `Sigma`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "standard-deviation-pop",
  "name": "Population Standard Deviation (5-Point)",
  "problem": "Calculate Sigma = sqrt( sum( (xi - mean)^2 ) / N )",
  "variables": {
    "x1": 10,
    "x2": 15,
    "x3": 12,
    "x4": 18,
    "x5": 14
  },
  "operations": [
    {
      "id": "mean",
      "op": "div",
      "args": [
        {
          "op": "sum",
          "args": [
            "x1",
            "x2",
            "x3",
            "x4",
            "x5"
          ]
        },
        5
      ],
      "result": "M"
    },
    {
      "id": "var1",
      "op": "pow",
      "args": [
        {
          "op": "sub",
          "args": [
            "x1",
            "M"
          ]
        },
        2
      ],
      "result": "V1"
    },
    {
      "id": "var2",
      "op": "pow",
      "args": [
        {
          "op": "sub",
          "args": [
            "x2",
            "M"
          ]
        },
        2
      ],
      "result": "V2"
    },
    {
      "id": "var3",
      "op": "pow",
      "args": [
        {
          "op": "sub",
          "args": [
            "x3",
            "M"
          ]
        },
        2
      ],
      "result": "V3"
    },
    {
      "id": "var4",
      "op": "pow",
      "args": [
        {
          "op": "sub",
          "args": [
            "x4",
            "M"
          ]
        },
        2
      ],
      "result": "V4"
    },
    {
      "id": "var5",
      "op": "pow",
      "args": [
        {
          "op": "sub",
          "args": [
            "x5",
            "M"
          ]
        },
        2
      ],
      "result": "V5"
    },
    {
      "id": "variance",
      "op": "div",
      "args": [
        {
          "op": "sum",
          "args": [
            "V1",
            "V2",
            "V3",
            "V4",
            "V5"
          ]
        },
        5
      ],
      "result": "VAR"
    },
    {
      "id": "stddev",
      "op": "sqrt",
      "args": [
        "VAR"
      ],
      "result": "Sigma"
    }
  ],
  "final_result": "Sigma"
}
```
