---
type: math-analysis
category: clinical-pharmacology
complexity: complex
variables:
  patient_weight_kg: 92.5
  patient_height_cm: 185
  dosage_rate_mg_m2: 175
  drug_concentration_mg_ml: 6
---

# Learning Case: Chemotherapy Dosage (Instance of Math-AI Algos)

## Documentation/Scenario
Patient requires a course of Paclitaxel. The prescribed dosage rate is 175 mg/m². 
The patient's current weight is 92.5 kg and height is 185 cm.
The medication is supplied at a concentration of 6 mg/mL.

## Problem Description
1. Calculate the Body Surface Area (BSA) using the Mosteller formula: BSA = √((cm * kg) / 3600).
2. Calculate the total required dose in mg based on BSA.
3. Calculate the volume in mL to be administered.

## Math AI Logic Model
```json
{
  "math_ai_engine": {
    "problem": "Calculate Paclitaxel Dosage",
    "variables": {
      "W": 92.5,
      "H": 185,
      "Rate": 175,
      "Conc": 6
    },
    "operations": [
      { "id": "step1_metrics", "op": "mul", "args": ["W", "H"], "result": "WH" },
      { "id": "step2_divide", "op": "div", "args": ["WH", 3600], "result": "WH_norm" },
      { "id": "step3_bsa", "op": "pow", "args": ["WH_norm", 0.5], "result": "BSA" },
      { "id": "step4_dose_mg", "op": "mul", "args": ["BSA", "Rate"], "result": "Total_Dose_mg" },
      { "id": "step5_vol_ml", "op": "div", "args": ["Total_Dose_mg", "Conc"], "result": "Admin_Vol_ml" }
    ],
    "final_result": "Admin_Vol_ml",
    "schema": {
      "BSA": { "unit": "m2", "precision": 2 },
      "Total_Dose_mg": { "unit": "mg", "precision": 1 },
      "Admin_Vol_ml": { "unit": "ml", "precision": 1 }
    }
  }
}
```
