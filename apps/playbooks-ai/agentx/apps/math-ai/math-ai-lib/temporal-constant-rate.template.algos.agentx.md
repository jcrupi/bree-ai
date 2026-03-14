---
type: math-template
id: temporal-constant-rate
name: Constant Frequency Analytics
---

# Template: Constant Frequency Trend Analysis

## Description
Calculates velocity and projections for signal data provided at a fixed frequency (e.g., a sensor pushing data every 100ms). Instead of timestamps, it uses the sampling rate to derive the temporal context.

## Interface (Engine Inputs)
| Variable | Description | Unit | Required |
| :--- | :--- | :--- | :--- |
| `v_now` | Current metric value | any | Yes |
| `v_last` | Previous metric value | any | Yes |
| `freq` | Sampling frequency | Hz (samples/sec) | Yes |
| `horizon` | Prediction interval | seconds | Yes |

## Example Data
### Input
```json
{
  "v_now": 200,
  "v_last": 180,
  "freq": 10,
  "horizon": 5
}
```
### Expected Output
- `Velocity`: 200 units/sec
- `V_Projected`: 1200 (at T+5s)

## Math AI Logic Model
```json
{
  "id": "temporal-constant-rate",
  "name": "Fixed Freq Trend",
  "variables": {
    "v_now": 0,
    "v_last": 0,
    "freq": 1,
    "horizon": 0
  },
  "operations": [
    { "id": "delta_v", "op": "sub", "args": ["v_now", "v_last"], "result": "dV" },
    { "id": "interval", "op": "div", "args": [1, "freq"], "result": "dT" },
    { "id": "velocity", "op": "div", "args": ["dV", "dT"], "result": "Velocity" },
    { "id": "proj_delta", "op": "mul", "args": ["Velocity", "horizon"], "result": "v_delta" },
    { "id": "projected_val", "op": "add", "args": ["v_now", "v_delta"], "result": "V_Projected" }
  ],
  "final_result": "Velocity"
}
```
