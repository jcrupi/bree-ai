---
type: math-analysis
category: finance-analytics
complexity: complex
variables:
  period: "Q1 2025"
  currency: "USD"
  tax_rate: 0.21
---

# Learning Case: P&L Extraction & EBITDA Analysis (Instance of Math-AI Algos)

## Documentation (Extracted Table)
| Item | Amount |
| :--- | :--- |
| Gross Revenue | 1,250,500.00 |
| Returns & Allowances | (45,000.00) |
| Cost of Goods Sold (COGS) | 480,000.00 |
| Salaries & Wages | 210,000.00 |
| Rent & Utilities | 35,000.00 |
| Depreciation | 12,000.00 |
| Amortization | 8,500.00 |
| Interest Expense | 14,000.00 |

## Problem Description
1. Calculate Net Revenue (Gross - Returns).
2. Calculate Gross Profit (Net Revenue - COGS).
3. Calculate Operating Expenses (Salaries + Rent).
4. Calculate EBITDA (Gross Profit - Operating Expenses).
5. Calculate Net Income before Tax (EBITDA - Depreciation - Amortization - Interest).
6. Apply 21% Tax to find Final Net Income.

## Math AI Logic Model
```json
{
  "math_ai_engine": {
    "problem": "Q1 Performance Summary",
    "table_data": true,
    "variables": {
      "Gross": 1250500,
      "Returns": 45000,
      "COGS": 480000,
      "Salaries": 210000,
      "Rent": 35000,
      "Dep": 12000,
      "Amort": 8500,
      "Interest": 14000,
      "TaxRate": 0.21
    },
    "operations": [
      { "id": "net_rev", "op": "sub", "args": ["Gross", "Returns"], "result": "NetRev" },
      { "id": "gross_prof", "op": "sub", "args": ["NetRev", "COGS"], "result": "GP" },
      { "id": "opex", "op": "add", "args": ["Salaries", "Rent"], "result": "OpEx" },
      { "id": "ebitda", "op": "sub", "args": ["GP", "OpEx"], "result": "EBITDA" },
      { "id": "ebit", "op": "sub", "args": ["EBITDA", ["Dep", "Amort"]], "result": "EBIT" },
      { "id": "ebt", "op": "sub", "args": ["EBIT", "Interest"], "result": "EBT" },
      { "id": "tax", "op": "mul", "args": ["EBT", "TaxRate"], "result": "TaxAmt" },
      { "id": "net_income", "op": "sub", "args": ["EBT", "TaxAmt"], "result": "NetIncome" }
    ],
    "final_result": "NetIncome"
  }
}
```
