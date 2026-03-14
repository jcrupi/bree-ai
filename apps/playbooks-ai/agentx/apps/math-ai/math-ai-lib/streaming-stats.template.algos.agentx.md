---
type: math-template
id: windowed-streaming-stats
name: Windowed Streaming Analytics
---

# Template: 5-Point Rolling Statistics

## Description
Calculates real-time summary statistics (Sum, Mean, Min, Max, and Range) for a rolling window of 5 data samples.

## Interface (Engine Inputs)
| Variable | Description | Required |
| :--- | :--- | :--- |
| `s1` | Sample t-4 (Oldest) | Yes |
| `s2` | Sample t-3 | Yes |
| `s3` | Sample t-2 | Yes |
| `s4` | Sample t-1 | Yes |
| `s5` | Sample t (Current) | Yes |

## Expected Output
- `RunningSum`: Total of all samples in window.
- `RunningMean`: Average value.
- `MinVal`: Minimum value in window.
- `MaxVal`: Maximum value in window.
- `Range`: Spread between min and max.

## Math AI Logic Model
```json
{
  "id": "windowed-streaming-stats",
  "name": "Streaming Stats",
  "variables": { "s1": 0, "s2": 0, "s3": 0, "s4": 0, "s5": 0 },
  "operations": [
    { "id": "sum", "op": "sum", "args": ["s1", "s2", "s3", "s4", "s5"], "result": "RunningSum" },
    { "id": "mean", "op": "div", "args": ["RunningSum", 5], "result": "RunningMean" },
    { "id": "min", "op": "min", "args": ["s1", "s2", "s3", "s4", "s5"], "result": "MinVal" },
    { "id": "max", "op": "max", "args": ["s1", "s2", "s3", "s4", "s5"], "result": "MaxVal" },
    { "id": "range", "op": "sub", "args": ["MaxVal", "MinVal"], "result": "Range" }
  ],
  "final_result": "RunningMean"
}
```
