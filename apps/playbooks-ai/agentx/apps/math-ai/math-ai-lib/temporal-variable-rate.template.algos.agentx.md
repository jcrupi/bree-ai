---
type: math-template
id: temporal-trend-analytics
name: Temporal Trend & Prediction Analytics
---

# Template: Variable Rate Temporal Analytics

## Description
Calculates velocity and projections for data where each sample provides its own explicit timestamp (Non-uniform sampling).

## Interface (Engine Inputs)
| Variable | Description | Unit | Required |
| :--- | :--- | :--- | :--- |
| `v_now` | Current metric value | any | Yes |
| `v_last` | Previous metric value | any | Yes |
| `t_now` | Current timestamp | seconds | Yes |
| `t_last` | Previous timestamp | seconds | Yes |
| `horizon` | Prediction interval | seconds | Yes |

## Example Data
### Input
```json
{
  "v_now": 150,
  "v_last": 100,
  "t_now": 10,
  "t_last": 0,
  "horizon": 30
}
```
### Expected Output
- `Velocity`: 5 units/sec
- `V_Projected`: 300 (at T+30s)

## Math AI Logic Model
```json
{
  "id": "temporal-trend-analytics",
  "name": "Time Trend",
  "variables": {
    "v_now": 0,
    "v_last": 0,
    "t_now": 0,
    "t_last": 0,
    "horizon": 0
  },
  "operations": [
    { "id": "delta_v", "op": "sub", "args": ["v_now", "v_last"], "result": "dV" },
    { "id": "delta_t", "op": "sub", "args": ["t_now", "t_last"], "result": "dT" },
    { "id": "velocity", "op": "div", "args": ["dV", "dT"], "result": "Velocity" },
    { "id": "drift", "op": "div", "args": ["dV", "v_last"], "result": "DriftRatio" },
    { "id": "drift_pct", "op": "mul", "args": ["DriftRatio", 100], "result": "DriftPct" },
    { "id": "projection_delta", "op": "mul", "args": ["Velocity", "horizon"], "result": "v_proj_delta" },
    { "id": "projected_val", "op": "add", "args": ["v_now", "v_proj_delta"], "result": "V_Projected" }
  ],
  "final_result": "Velocity"
}
```
