---
type: math-template
id: relativistic-time-dilation
name: Relativistic Time Dilation
---

# Template: Relativistic Time Dilation

## Description
Calculate t' = t / sqrt(1 - v^2/c^2)

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `proper_time` | Input for proper_time | Yes |
| `velocity` | Input for velocity | Yes |
| `speed_of_light` | Input for speed_of_light | Yes |

## Expected Output
- `T_prime`: Final computed value.
## Math AI Logic Model
```json
{
  "id": "relativistic-time-dilation",
  "name": "Relativistic Time Dilation",
  "problem": "Calculate t' = t / sqrt(1 - v^2/c^2)",
  "variables": {
    "proper_time": 3600,
    "velocity": 240000000,
    "speed_of_light": 299792458
  },
  "operations": [
    {
      "id": "v_sq",
      "op": "pow",
      "args": [
        "velocity",
        2
      ],
      "result": "V2"
    },
    {
      "id": "c_sq",
      "op": "pow",
      "args": [
        "speed_of_light",
        2
      ],
      "result": "C2"
    },
    {
      "id": "beta_sq",
      "op": "div",
      "args": [
        "V2",
        "C2"
      ],
      "result": "B2"
    },
    {
      "id": "diff",
      "op": "sub",
      "args": [
        1,
        "B2"
      ],
      "result": "D"
    },
    {
      "id": "gamma_inv",
      "op": "sqrt",
      "args": [
        "D"
      ],
      "result": "Gi"
    },
    {
      "id": "dilated_time",
      "op": "div",
      "args": [
        "proper_time",
        "Gi"
      ],
      "result": "T_prime"
    }
  ],
  "final_result": "T_prime"
}
```
