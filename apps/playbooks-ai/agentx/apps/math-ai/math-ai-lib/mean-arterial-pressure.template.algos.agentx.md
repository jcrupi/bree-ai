---
type: math-template
id: mean-arterial-pressure
name: Mean Arterial Pressure (MAP)
---

# Template: Mean Arterial Pressure (MAP)

## Description
Calculate MAP = (SBP + 2*DBP) / 3

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `sbp` | Input for sbp | Yes |
| `dbp` | Diastolic Blood Pressure | Yes |

## Example Data
### Input
```json
{ "sbp": 120, "dbp": 80 }
```
### Expected Output
- `MAP`: 93.33

## Expected Output
- `MAP`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "mean-arterial-pressure",
  "name": "Mean Arterial Pressure (MAP)",
  "problem": "Calculate MAP = (SBP + 2*DBP) / 3",
  "variables": {
    "sbp": 120,
    "dbp": 80
  },
  "operations": [
    {
      "id": "dbp_weighted",
      "op": "mul",
      "args": [
        "dbp",
        2
      ],
      "result": "DBP2"
    },
    {
      "id": "sum_pressures",
      "op": "add",
      "args": [
        "sbp",
        "DBP2"
      ],
      "result": "TotalP"
    },
    {
      "id": "final_map",
      "op": "div",
      "args": [
        "TotalP",
        3
      ],
      "result": "MAP"
    }
  ],
  "final_result": "MAP"
}
```
