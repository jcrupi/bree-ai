---
type: math-template
id: bmi-standard
name: Body Mass Index
---

# Template: Body Mass Index

## Description
Calculate Body Mass Index (BMI).

## Interface (Engine Inputs)
| Variable | Description | Unit | Required |
| :--- | :--- | :--- | :--- |
| `W` | Patient Weight | kg | Yes |
| `H` | Patient Height | m | Yes |

## Example Data
### Input
```json
{ "W": 85, "H": 1.8 }
```
### Expected Output
- `BMI`: 26.23

## Expected Output
- `BMI`: The calculated Body Mass Index.

## Math AI Logic Model
```json
{
  "id": "bmi-standard",
  "name": "Body Mass Index",
  "problem": "Calculate BMI from Weight (kg) and Height (m)",
  "operations": [
    {
      "id": "square_height",
      "op": "pow",
      "args": [
        "H",
        2
      ],
      "result": "H2"
    },
    {
      "id": "calc_bmi",
      "op": "div",
      "args": [
        "W",
        "H2"
      ],
      "result": "BMI"
    }
  ],
  "final_result": "BMI"
}
```
