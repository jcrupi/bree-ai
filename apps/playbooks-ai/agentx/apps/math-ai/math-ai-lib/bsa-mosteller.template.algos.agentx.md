---
type: math-template
id: bsa-mosteller
name: Body Surface Area (Mosteller)
---

# Template: Body Surface Area (Mosteller)

## Description
Calculate BSA = sqrt((cm * kg) / 3600)

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |

## Expected Output
- `BSA`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "bsa-mosteller",
  "name": "Body Surface Area (Mosteller)",
  "problem": "Calculate BSA = sqrt((cm * kg) / 3600)",
  "operations": [
    {
      "id": "wh",
      "op": "mul",
      "args": [
        "W",
        "H"
      ],
      "result": "WH"
    },
    {
      "id": "wh_norm",
      "op": "div",
      "args": [
        "WH",
        3600
      ],
      "result": "WHN"
    },
    {
      "id": "bsa",
      "op": "pow",
      "args": [
        "WHN",
        0.5
      ],
      "result": "BSA"
    }
  ],
  "final_result": "BSA"
}
```
